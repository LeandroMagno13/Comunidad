# coding: utf-8
"""Informe horario de la API pública de PostSingular para Telegram."""
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

BASE = "https://postsingular.org/api/v1/public/"
API = "https://postsingular.org/api/"
BOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BOT_DIR, ".telegram-hourly-bot-state.json")
LOG_FILE = os.path.join(BOT_DIR, ".telegram-hourly-bot.log")
UA = "postsingular-hourly-bot/2.0 (public read-only)"
ARGENTINA = timezone(timedelta(hours=-3))
HORA_CIERRE = 20
DEFAULT_STATE = {"chat_id": None, "update_id": 0, "last_fingerprint": "", "since_posts": "", "since_guilds": "", "since_users": "", "known_request_ids": [], "known_poll_ids": [], "snapshot": {}, "initialized": False, "report_requested": False, "prevision_requested": False, "links": {}, "personal_requested": {}}
state = dict(DEFAULT_STATE)

def redact_token(text):
    """Para logs: nunca registrar tokens (ni de agente ni de Telegram)."""
    if not isinstance(text, str) or not text:
        return ""
    if len(text) > 16:
        return text[:4] + "…" + text[-4:] + f" (len={len(text)})"
    return "(secreto)"

def log(message):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as file:
            file.write(f"{datetime.now(timezone.utc).isoformat()} {message}\n")
    except OSError:
        pass

def load_state():
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as file:
            loaded = json.load(file)
        if isinstance(loaded, dict): state.update(loaded)
    except (OSError, ValueError): pass

def save_state():
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as file: json.dump(state, file, ensure_ascii=False)
    except OSError as error: log(f"state_save_error {error!r}")

def load_env(path):
    values = {}
    try:
        with open(path, "r", encoding="utf-8") as file:
            for raw_line in file:
                line = raw_line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    values[key.strip()] = value.strip().strip('"').strip("'")
    except OSError: pass
    return values

def get_token():
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if token: return token
    for path in (os.path.join(BOT_DIR, ".env"), os.path.join(os.path.dirname(BOT_DIR), ".env")):
        token = load_env(path).get("TELEGRAM_BOT_TOKEN", "")
        if token: return token
    return ""

def http_get(url, timeout=60, redirects=5):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response: return response.status, response.read()
    except urllib.error.HTTPError as error:
        if error.code in (301, 302, 303, 307, 308) and redirects > 0:
            location = error.headers.get("Location")
            if location:
                new_url = urllib.parse.urljoin(url, location)
                return http_get(new_url, timeout, redirects - 1)
        return error.code, error.read()
    except OSError as error:
        log(f"http_error {error!r}")
        return None, b""

def get_json(url):
    status, body = http_get(url)
    if status != 200:
        log(f"request_failed status={status}")
        return None
    try: return json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as error:
        log(f"json_error {error!r}")
        return None

def public_get(resource, since=""):
    query = {"limit": "200"}
    if since: query["since"] = since
    return get_json(BASE + resource + "?" + urllib.parse.urlencode(query))

def http_get_auth(url, agent_token, timeout=60):
    """GET autenticado con token de agente (Bearer). El token nunca se loguea."""
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json", "Authorization": "Bearer " + agent_token})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response: return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()
    except OSError as error:
        log(f"http_auth_error {error!r}")
        return None, b""

def api_get_private(path, agent_token):
    status, body = http_get_auth(API + path, agent_token)
    if status != 200:
        return status, None
    try: return status, json.loads(body.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as error:
        log(f"json_auth_error {error!r}")
        return status, None

def link_prefix(agent_token):
    try: return hashlib.sha256(agent_token.encode("utf-8")).hexdigest()[:8]
    except (AttributeError, ValueError): return "????"

def get_links():
    links = state.get("links")
    if not isinstance(links, dict):
        links = {}
        state["links"] = links
    return links

def validate_link(agent_token):
    """Valida el token contra /api/notifications. 200=ok, 401=token malo, 403=sin permiso."""
    status, data = api_get_private("notifications", agent_token)
    if status == 200 and isinstance(data, dict) and "unread" in data:
        return True, ""
    if status == 401:
        return False, "Token inválido o revocado. Generá uno nuevo en la web (/agents) y probá de nuevo."
    if status == 403:
        return False, "Al agente le faltan permisos. Al crearlo en /agents, marcá READ_NOTIFICATIONS y READ_MESSAGES."
    return False, "No se pudo validar (la web no respondió). Probá en unos minutos."

def personal_digest(agent_token):
    """Digest personal: notificaciones sin leer + mensajes sin leer. Solo lectura."""
    lines = []
    status_n, notifs = api_get_private("notifications", agent_token)
    if status_n != 200 or not isinstance(notifs, dict):
        return None
    unread = [n for n in (notifs.get("notifications") or []) if isinstance(n, dict) and not n.get("readAt")]
    lines.append(f"Personales sin leer: {len(unread)}")
    for n in unread[:5]:
        title = str(n.get("title") or "Aviso")[:80]
        lines.append(f"- {title}")
    if len(unread) > 5:
        lines.append(f"(+{len(unread) - 5} más en /notifications)")
    status_c, convs = api_get_private("conversations", agent_token)
    if status_c == 200 and isinstance(convs, list):
        with_unread = [((c.get("otherUser") or {}).get("name", "?"), c.get("unread", 0)) for c in convs if isinstance(c, dict) and int(c.get("unread", 0) or 0) > 0]
        total_msg = sum(u for _, u in with_unread)
        if total_msg > 0:
            lines.append(f"Mensajes sin leer: {total_msg}")
            for name, u in with_unread[:5]:
                lines.append(f"- {name}: {u}")
    return {"unread_count": len(unread), "text": "TUS PERSONALES\n" + "\n".join(lines)}

def telegram_json(token, method, params=None):
    url = f"https://api.telegram.org/bot{token}/{method}"
    if params: url += "?" + urllib.parse.urlencode(params)
    return get_json(url)

HELP_TEXT = (
    "Hola. Soy el avisador de PostSingular.\n"
    "Sin vincular: te mando el informe general de la comunidad (/informe).\n"
    "Vinculado: además te aviso tus notificaciones y mensajes personales.\n"
    "Para vincularme:\n"
    "1) Entrá a la web → Mis agentes → crear agente (nombre, p. ej. 'Telegram')\n"
    "   con permisos READ_NOTIFICATIONS y READ_MESSAGES. Copiá el token (se muestra una sola vez).\n"
    "2) Acá mandame: /vincular TU_TOKEN\n"
    "3) Borrá tu mensaje con el token (privacidad).\n"
    "Comandos: /mibot (estado), /personales (ver ahora), /desvincular (olvidarme)."
)

def handle_link_command(bot_token, chat_id, raw_text, command):
    """Vinculación bot ↔ usuario. El token de agente NUNCA se loguea."""
    key = str(chat_id)
    parts = raw_text.split()
    if command == "/vincular":
        if len(parts) < 2 or not parts[1].strip():
            send_report(bot_token, chat_id, "Uso: /vincular TU_TOKEN (el token de tu agente, que se muestra una sola vez en la web).")
            return
        agent_token = parts[1].strip()
        ok, why = validate_link(agent_token)
        if not ok:
            log(f"link_failed chat={chat_id} reason={why[:60]}")
            send_report(bot_token, chat_id, "No pude vincular: " + why)
            return
        links = get_links()
        links[key] = {"token": agent_token, "prefix": link_prefix(agent_token), "linked_at": datetime.now(timezone.utc).isoformat(), "last_unread": 0}
        save_state()
        log(f"linked chat={chat_id} prefix={links[key]['prefix']}")
        send_report(bot_token, chat_id, "Vinculado. Desde ahora te aviso tus personales además del informe general. Por privacidad, borrá tu mensaje con el token.")
        return
    if command == "/desvincular":
        links = get_links()
        if key in links:
            links[key]["token"] = ""
            del links[key]
            save_state()
            log(f"unlinked chat={chat_id}")
            send_report(bot_token, chat_id, "Desvinculado: olvidé tu token y ya no te mando personales.")
        else:
            send_report(bot_token, chat_id, "No estabas vinculado.")
        return
    if command == "/mibot":
        links = get_links()
        link = links.get(key)
        if not link:
            send_report(bot_token, chat_id, "No vinculado. Usá /vincular TU_TOKEN para recibir tus personales.")
        else:
            send_report(bot_token, chat_id, f"Vinculado (token …{link.get('prefix', '????')}, desde {str(link.get('linked_at', '?'))[:10]}). /personales para ver ahora, /desvincular para salir.")
        return
    if command == "/personales":
        links = get_links()
        link = links.get(key)
        if not link or not link.get("token"):
            send_report(bot_token, chat_id, "No vinculado. Usá /vincular TU_TOKEN primero.")
            return
        digest = personal_digest(link["token"])
        if digest is None:
            send_report(bot_token, chat_id, "No pude consultar tus personales (¿token revocado? probá /vincular de nuevo).")
            return
        link["last_unread"] = digest["unread_count"]
        save_state()
        send_report(bot_token, chat_id, digest["text"])
        return

def ingest_updates(token, accept_commands=False):
    params = {"timeout": 2}
    if state.get("update_id"): params["offset"] = int(state["update_id"]) + 1
    response = telegram_json(token, "getUpdates", params)
    requested = False
    if not response or not response.get("ok"): return requested
    for update in response.get("result", []):
        update_id = update.get("update_id")
        if isinstance(update_id, int): state["update_id"] = max(int(state.get("update_id", 0)), update_id)
        message = update.get("message") or update.get("edited_message") or {}
        chat = message.get("chat") or {}
        if chat.get("id") is not None: state["chat_id"] = chat["id"]
        raw_text = str(message.get("text", "")).strip()
        command = raw_text.lower().split("@")[0].split()[0] if raw_text else ""
        if accept_commands and command in ("/start", "/informe", "/reporte"):
            requested = True
            state["report_requested"] = True
        if accept_commands and command == "/start" and chat.get("id") is not None:
            send_report(token, chat["id"], HELP_TEXT)
        if accept_commands and command == "/prevision": state["prevision_requested"] = True
        if accept_commands and chat.get("id") is not None:
            handle_link_command(token, chat["id"], raw_text, command)
    save_state()
    return requested

def run_prevision_skill(token=None, chat_id=None):
    """Lanza el informe de previsión en segundo plano (publica a pedido del dueño)."""
    script = os.path.join(BOT_DIR, "prevision", "informe_forecast.py")
    if not os.path.exists(script):
        log("prevision_missing_script")
        return False
    started = False
    try:
        flag = getattr(subprocess, "CREATE_NO_WINDOW", 0)
        proc = subprocess.Popen(
            [sys.executable, script],
            cwd=BOT_DIR,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=flag,
        )
        started = bool(proc and proc.pid)
    except OSError as error:
        log(f"prevision_launch_error {error!r}")
        started = False
    try:
        with open(os.path.join(BOT_DIR, "prevision", ".prevision-launch.log"), "a", encoding="utf-8") as file:
            file.write(f"{datetime.now(timezone.utc).isoformat()} start={started}\n")
    except OSError:
        pass
    if started and token and chat_id:
        send_report(token, chat_id, "Generando informe de previsión… (en segundo plano). En cuanto termine, se publica en la página como Información.")
    log(f"prevision_started={started}")
    return started

def iso_after(value):
    try: return (datetime.fromisoformat(value.replace("Z", "+00:00")) + timedelta(milliseconds=1)).isoformat().replace("+00:00", "Z")
    except (AttributeError, ValueError): return value

def newest_cursor(response, fallback):
    items = (response or {}).get("data") or []
    created = [item.get("createdAt") for item in items if isinstance(item, dict) and item.get("createdAt")]
    if created: return iso_after(max(created))
    return ((response or {}).get("meta") or {}).get("generatedAt") or fallback

def new_ids(items, previous_ids, initialized):
    ids = [str(item.get("id")) for item in items if isinstance(item, dict) and item.get("id") is not None]
    return (0 if not initialized else sum(item_id not in set(previous_ids or []) for item_id in ids), ids[:200])

def collect_report_data():
    """Hace una sola consulta por recurso en cada ciclo horario."""
    initialized = bool(state.get("initialized"))
    health = public_get("health")
    community = public_get("community")
    posts = public_get("posts", state.get("since_posts", ""))
    guilds = public_get("guilds", state.get("since_guilds", ""))
    users = public_get("users", state.get("since_users", ""))
    requests = public_get("requests")
    polls = public_get("polls")
    activity = public_get("activity")
    community_data = (community or {}).get("data") or {}
    post_items, guild_items, user_items = (posts or {}).get("data") or [], (guilds or {}).get("data") or [], (users or {}).get("data") or []
    request_items, poll_items = (requests or {}).get("data") or [], (polls or {}).get("data") or []
    requests_new, request_ids = new_ids(request_items, state.get("known_request_ids"), initialized)
    polls_new, poll_ids = new_ids(poll_items, state.get("known_poll_ids"), initialized)
    activity_data = (activity or {}).get("data") or {}
    data = {
        "version": ((community or {}).get("meta") or {}).get("version", "NO_DISPONIBLE"),
        "members": community_data.get("members", "NO_DISPONIBLE"),
        "members_new": len(user_items) if users and users.get("ok") else "NO_DISPONIBLE",
        "posts": community_data.get("visiblePosts", "NO_DISPONIBLE"), "posts_new": len(post_items) if posts and posts.get("ok") else "NO_DISPONIBLE",
        "guilds": community_data.get("guilds", "NO_DISPONIBLE"), "guilds_new": len(guild_items) if guilds and guilds.get("ok") else "NO_DISPONIBLE",
        "requests": len(request_items) if requests and requests.get("ok") else "NO_DISPONIBLE", "requests_new": requests_new if requests and requests.get("ok") else "NO_DISPONIBLE",
        "polls": len(poll_items) if polls and polls.get("ok") else "NO_DISPONIBLE", "polls_new": polls_new if polls and polls.get("ok") else "NO_DISPONIBLE",
        "activity": len(activity_data.get("entries") or []) if activity and activity.get("ok") else "NO_DISPONIBLE",
        "health": bool(health and health.get("ok")),
    }
    state["since_posts"], state["since_guilds"], state["since_users"] = newest_cursor(posts, state.get("since_posts", "")), newest_cursor(guilds, state.get("since_guilds", "")), newest_cursor(users, state.get("since_users", ""))
    state["known_request_ids"], state["known_poll_ids"], state["initialized"] = request_ids, poll_ids, True
    return data

LABELS = {"version": "Version API", "members": "Miembros Activos", "members_new": "Miembros Nuevos", "posts": "Posts Visibles", "posts_new": "Post Nuevos", "guilds": "Gremios", "guilds_new": "Gremios Nuevos", "requests": "Solicitudes en Cartelera", "requests_new": "Solicitudes Nuevas", "polls": "Encuestas en Cartelera", "polls_new": "Encuestas Nuevas", "activity": "Actividad Reciente", "health": "Salud de Servicio"}
ORDER = list(LABELS)

def make_report(data):
    now = datetime.now(ARGENTINA)
    lines = ["POSTSINGULAR - INFORME HORARIO", now.strftime("%d-%m-%Y\t%H:%M:%S"), "Informa cuando hay cambios y a las 20:00 hs de forma periódica.", ""]
    lines.extend(f"{LABELS[key]}: {data[key]}" for key in ORDER)
    lines.append(f"fuente: {BASE}")
    changes = [f"- {LABELS[key]}: {state['snapshot'][key]} -> {data[key]}" for key in ORDER if key in state.get("snapshot", {}) and state["snapshot"][key] != data[key]]
    if changes: lines.extend(["", "CAMBIOS DESDE EL ÚLTIMO INFORME:", *changes])
    return "\n".join(lines)

def send_report(token, chat_id, text):
    response = telegram_json(token, "sendMessage", {"chat_id": chat_id, "text": text, "disable_web_page_preview": "true"})
    return bool(response and response.get("ok"))

def main():
    token = get_token()
    if not token:
        log("missing_telegram_token")
        print("SIN_TOKEN=1")
        return 1
    load_state()
    ingest_updates(token)
    push_personal_digests(token)
    data, report = collect_report_data(), None
    report = make_report(data)
    fingerprint = hashlib.sha256(json.dumps(data, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
    now = datetime.now(ARGENTINA)
    must_send = bool(state.get("report_requested")) or now.hour == HORA_CIERRE or fingerprint != state.get("last_fingerprint")
    print(report)
    if state.get("chat_id") is None:
        save_state(); print("SEND_RESULT=sin_destinatario"); return 0
    if not must_send:
        save_state(); print("SEND_RESULT=sin_cambios"); return 0
    if send_report(token, state["chat_id"], report):
        state["last_fingerprint"], state["snapshot"], state["report_requested"] = fingerprint, data, False
        save_state(); print("SEND_RESULT=enviado"); return 0
    save_state(); print("SEND_RESULT=fallo"); return 1

def push_personal_digests(bot_token):
    """A cada chat vinculado: personales si hay sin leer nuevos (o a las 20:00)."""
    now = datetime.now(ARGENTINA)
    for key, link in list(get_links().items()):
        agent_token = (link or {}).get("token", "")
        if not agent_token:
            continue
        try:
            chat_id = int(key)
        except (TypeError, ValueError):
            continue
        digest = personal_digest(agent_token)
        if digest is None:
            log(f"personal_failed chat={chat_id}")
            continue
        prev = int(link.get("last_unread", 0) or 0)
        if digest["unread_count"] != prev:
            link["last_unread"] = digest["unread_count"]
        if digest["unread_count"] > 0 and (digest["unread_count"] != prev or now.hour == HORA_CIERRE):
            if send_report(bot_token, chat_id, digest["text"]):
                log(f"personal_sent chat={chat_id} unread={digest['unread_count']}")
    save_state()

if __name__ == "__main__":
    if "--once" in sys.argv: sys.exit(main())
    try: main()
    except Exception as error: log(f"initial_cycle_error {error!r}")
    next_hour = time.time() + (3600 - int(time.time()) % 3600)
    while True:
        try:
            token = get_token()
            if token:
                ingest_updates(token, accept_commands=True)
                if state.get("prevision_requested"):
                    state["prevision_requested"] = False
                    save_state()
                    run_prevision_skill(token, state.get("chat_id"))
                if state.get("report_requested"):
                    state["report_requested"] = True
                    main()
        except Exception as error: log(f"poll_error {error!r}")
        time.sleep(20)
        if time.time() >= next_hour:
            next_hour += 3600
            try: main()
            except Exception as error: log(f"cycle_error {error!r}")
