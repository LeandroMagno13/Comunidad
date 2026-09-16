# coding: utf-8
"""Informe horario de la API pública de PostSingular para Telegram."""
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://postsingular.org/api/v1/public/"
BOT_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BOT_DIR, ".telegram-hourly-bot-state.json")
LOG_FILE = os.path.join(BOT_DIR, ".telegram-hourly-bot.log")
UA = "postsingular-hourly-bot/2.0 (public read-only)"
ARGENTINA = timezone(timedelta(hours=-3))
HORA_CIERRE = 20
DEFAULT_STATE = {"chat_id": None, "update_id": 0, "last_fingerprint": "", "since_posts": "", "since_guilds": "", "since_users": "", "known_request_ids": [], "known_poll_ids": [], "snapshot": {}, "initialized": False, "report_requested": False}
state = dict(DEFAULT_STATE)

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

def http_get(url, timeout=25):
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response: return response.status, response.read()
    except urllib.error.HTTPError as error: return error.code, error.read()
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

def telegram_json(token, method, params=None):
    url = f"https://api.telegram.org/bot{token}/{method}"
    if params: url += "?" + urllib.parse.urlencode(params)
    return get_json(url)

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
        command = str(message.get("text", "")).strip().lower().split("@")[0]
        if accept_commands and command in ("/start", "/informe", "/reporte"): requested = True
    save_state()
    return requested

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

if __name__ == "__main__":
    if "--once" in sys.argv: sys.exit(main())
    try: main()
    except Exception as error: log(f"initial_cycle_error {error!r}")
    next_hour = time.time() + (3600 - int(time.time()) % 3600)
    while True:
        try:
            token = get_token()
            if token and ingest_updates(token, accept_commands=True): state["report_requested"] = True; main()
        except Exception as error: log(f"poll_error {error!r}")
        time.sleep(20)
        if time.time() >= next_hour:
            next_hour += 3600
            try: main()
            except Exception as error: log(f"cycle_error {error!r}")
