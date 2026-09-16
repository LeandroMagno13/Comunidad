# coding: utf-8
"""Informe de actividad y previsión de PostSingular (skill del bot).

Baja los datos públicos de la página (solo lectura, sin autenticación),
arma series diarias usables (posts/miembros/gremios nuevos por día), las
corre por TimesFM (Google) para pronosticar los próximos N días, redacta
un informe informativo con un modelo de lenguaje "estándar" (Ollama local;
si no, endpoint compatible OpenAI; si no, plantilla) y lo publica en la
página como publicación de tipo "Información".

Es un laboratorio: el pronóstico es probabilístico y observacional (detecta
trayectorias), NO causal ni autoridad sobre el modelo de PostSingular.

Uso:
  python informe_forecast.py            # baja, pronostica, redacta y publica
  python informe_forecast.py --preview  # igual, pero sin publicar
  python informe_forecast.py --no-llm   # fuerza la plantilla (sin LLM)
  python informe_forecast.py --horizon 21
  python informe_forecast.py --base http://localhost:3000

Dependencias opcionales (solo para el pronóstico fino):
  pip install timesfm[torch]   (TimesFM 3.0 / 2.5; sin esto cae a plantilla)
Y un LLM "standard" a elección (Ollama local o endpoint OpenAI-compatible);
sin LLM, el informe sale por plantilla con los mismos números.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

BASE_DEFAULT = "https://postsingular.org"
BOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREV_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(PREV_DIR, ".prevision-state.json")
LOG_FILE = os.path.join(PREV_DIR, ".prevision.log")
UA = "postsingular-prevision-skill/1.0 (public read-only + publicar a pedido)"
AR = timezone(timedelta(hours=-3))

_TFM3_CKPT = "google/timesfm-3.0-pytorch"
_TFM25_CKPT = "google/timesfm-2.5-200m-pytorch"

DEFAULT_CFG = {
    "base": BASE_DEFAULT,
    "posts_user": "",
    "posts_password": "",
    "ollama_url": "http://localhost:11434",
    "ollama_model": "llama3.1",
    "llm_api_url": "",
    "llm_api_key": "",
    "llm_model": "",
    "telegram_token": "",
    "telegram_chat_id": "",
    "horizon": "14",
    "min_points": "12",
}


# ---------------------------------------------------------------------------
# Entorno / estado / log (sin dependencias externas)
# ---------------------------------------------------------------------------

def load_env_file(path):
    values = {}
    try:
        with open(path, "r", encoding="utf-8") as file:
            for raw in file:
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                values[key.strip()] = value.strip().strip('"').strip("'")
    except OSError:
        pass
    return values


def load_config():
    cfg = dict(DEFAULT_CFG)
    merged = {}
    for path in (os.path.join(PREV_DIR, ".env"),
                 os.path.join(PREV_DIR, ".env.prevision"),
                 os.path.join(BOT_DIR, ".env")):
        merged.update(load_env_file(path))
    merged.update({k: v for k, v in os.environ.items() if v})
    names = {
        "base": "POSTSINGULAR_BASE",
        "posts_user": "POSTS_USER",
        "posts_password": "POSTS_PASSWORD",
        "ollama_url": "LLM_OLLAMA_URL",
        "ollama_model": "LLM_OLLAMA_MODEL",
        "llm_api_url": "LLM_API_URL",
        "llm_api_key": "LLM_API_KEY",
        "llm_model": "LLM_MODEL",
        "telegram_token": "TELEGRAM_BOT_TOKEN",
        "telegram_chat_id": "TELEGRAM_CHAT_ID",
        "horizon": "PREVISION_HORIZON",
        "min_points": "PREVISION_MIN_POINTS",
    }
    for dest, env_name in names.items():
        if merged.get(env_name):
            cfg[dest] = merged[env_name]
    cfg["base"] = cfg["base"].rstrip("/").replace("http://", "http://", 1)
    try:
        cfg["horizon"] = int(cfg["horizon"])
    except ValueError:
        cfg["horizon"] = int(DEFAULT_CFG["horizon"])
    try:
        cfg["min_points"] = int(cfg["min_points"])
    except ValueError:
        cfg["min_points"] = int(DEFAULT_CFG["min_points"])
    return cfg


def load_state():
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, ValueError):
        return {}


def save_state(state):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as file:
            json.dump(state, file, ensure_ascii=False, indent=2)
    except OSError as error:
        log(f"state_save_error {error!r}")


def log(message):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as file:
            file.write(f"{datetime.now(timezone.utc).isoformat()} {message}\n")
    except OSError:
        pass


# ---------------------------------------------------------------------------
# HTTP (solo stdlib)
# ---------------------------------------------------------------------------

def http_json(method, url, payload=None, headers=None, timeout=60):
    data = None
    head = dict(headers or {})
    head["User-Agent"] = UA
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        head["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=head, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
            try:
                return response.status, json.loads(body.decode("utf-8"))
            except (UnicodeDecodeError, ValueError):
                return response.status, body.decode("utf-8", "replace")
    except urllib.error.HTTPError as error:
        try:
            return error.code, json.loads(error.read().decode("utf-8"))
        except (UnicodeDecodeError, ValueError, AttributeError):
            return error.code, {"error": f"http {error.code}"}
    except OSError as error:
        log(f"http_error method={method} url={url} {error!r}")
        return None, None


def api_get(cfg, resource, since=None):
    query = {"limit": "200"}
    if since:
        query["since"] = since
    url = f"{cfg['base']}/api/v1/public/{resource}?{urllib.parse.urlencode(query)}"
    status, body = http_json("GET", url, timeout=40)
    if status != 200:
        log(f"api_failed resource={resource} status={status}")
        return None
    return body


def cursor_after(items):
    created = [
        item.get("createdAt") for item in items
        if isinstance(item, dict) and item.get("createdAt")
    ]
    if not created:
        return None
    newest = max(datetime.fromisoformat(c.replace("Z", "+00:00")) for c in created)
    return (newest + timedelta(milliseconds=1)).isoformat().replace("+00:00", "Z")


def paginate(cfg, resource, use_since=True):
    """Descarga todos los elementos de un recurso público paginando por cursor."""
    items = []
    since = ""
    for _ in range(100):
        body = api_get(cfg, resource, since if use_since else None)
        data = (body or {}).get("data") or []
        items.extend(data)
        if not use_since or len(data) < 200:
            break
        if not data:
            break
        nxt = cursor_after(data)
        if not nxt or nxt == since:
            break
        since = nxt
    return items


# ---------------------------------------------------------------------------
# Series diarias usables a partir de los datos de la página
# ---------------------------------------------------------------------------

def day_key(iso):
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(AR).date()
    except (AttributeError, ValueError):
        return None


def build_series(cfg):
    """Devuelve (dates, metrics, totals). dates: lista de fechas (día AR)."""
    community = api_get(cfg, "community")
    comm = (community or {}).get("data") or {}
    posts = paginate(cfg, "posts")
    users = paginate(cfg, "users")
    guilds = paginate(cfg, "guilds")
    polls = paginate(cfg, "polls", use_since=False)

    by_day = {}
    for item in posts:
        d = day_key(item.get("createdAt", ""))
        if d is None:
            continue
        bucket = by_day.setdefault(d, {"posts": 0, "requests": 0})
        bucket["posts"] += 1
        if item.get("type") == "request":
            bucket["requests"] += 1
    for item in users:
        d = day_key(item.get("createdAt", ""))
        if d is not None:
            by_day.setdefault(d, {}).setdefault("users", 0)
            by_day[d]["users"] = by_day[d].get("users", 0) + 1
    for item in guilds:
        d = day_key(item.get("createdAt", ""))
        if d is not None:
            by_day.setdefault(d, {}).setdefault("guilds", 0)
            by_day[d]["guilds"] = by_day[d].get("guilds", 0) + 1

    if not by_day:
        raise RuntimeError("no se descargó ningún dato de la página")

    start = min(by_day)
    today = datetime.now(AR).date()
    if (today - start).days > 360:
        start = today - timedelta(days=360)  # contexto acotado
    dates = []
    cursor = start
    while cursor <= today:
        dates.append(cursor)
        cursor += timedelta(days=1)

    def series(key):
        return [by_day.get(d, {}).get(key, 0) for d in dates]

    totals = {
        "members": comm.get("members"),
        "visible_posts": comm.get("visiblePosts"),
        "guilds": comm.get("guilds"),
        "requests_online": len([i for i in posts if isinstance(i, dict) and i.get("type") == "request"]),
        "polls": len(polls),
    }
    return dates, {
        "posts_new": series("posts"),
        "users_new": series("users"),
        "guilds_new": series("guilds"),
        "requests_new": series("requests"),
    }, totals


def series_stats(series):
    n = len(series)
    if n == 0:
        return {"n": 0, "last": 0, "mean7": 0.0, "mean30": 0.0, "total": 0}
    mean = lambda k: sum(series[-k:]) / min(k, n)
    return {
        "n": n,
        "last": series[-1],
        "mean7": mean(7),
        "mean30": mean(30),
        "total": sum(series),
    }


# ---------------------------------------------------------------------------
# Pronóstico: TimesFM 3.0 (multivariado) -> 2.5 (univariado) -> plantilla
# ---------------------------------------------------------------------------

def naive_forecast(series, horizon):
    if not series:
        return [0.0] * horizon, [0.0] * horizon, [0.0] * horizon
    window = min(14, len(series))
    base = sum(series[-window:]) / window
    low = base * 0.7
    high = base * 1.3
    return ([base] * horizon, [low] * horizon, [high] * horizon)


def forecast_tfm3(matrix, horizon):
    """TimesFM 3.0 multivariado. matrix: (V, L). Devuelve (pts, low, high)."""
    try:
        import numpy as np
        from timesfm3 import TimesFM3Evaluator, ModelConfig
    except Exception:
        return None
    target = np.asarray(matrix, dtype=np.float32)
    try:
        cfg = ModelConfig(checkpoint_path=_TFM3_CKPT, per_core_batch_size=8, device="cpu")
        ev = TimesFM3Evaluator(cfg)
    except Exception:
        return None
    try:
        outs = list(ev.predict_batch(
            contexts=[target], horizon=horizon,
            return_quantiles=True, use_symmetric_averaging=False))
    except Exception:
        try:
            outs = list(ev.predict_batch(contexts=[target], horizon=horizon))
        except Exception:
            return None
    if not outs:
        return None
    out = outs[0]
    try:
        points = np.asarray(out.forecast, dtype=float)
        if points.shape != (matrix.shape[0], horizon):
            return None
        q = getattr(out, "quantiles", None)
        if q is not None:
            q = np.asarray(q, dtype=float)
            low, high = q[..., 0], q[..., -1]
        else:
            low, high = points * 0.85, points * 1.15
        return points, low, high
    except Exception:
        return None


def forecast_tfm25(matrix, horizon):
    """TimesFM 2.5 univariado (fallback)."""
    try:
        import numpy as np
        from timesfm import TimesFm, TimesFmHparams
    except Exception:
        return None
    try:
        model = TimesFm(
            hparams=TimesFmHparams(backend="cpu"),
            checkpoint=_TFM25_CKPT,
        )
        model.load_from_checkpoint()
    except Exception:
        return None
    points, lows, highs = [], [], []
    for row in matrix:
        try:
            arr = np.asarray(row, dtype=np.float32).reshape(1, -1)
            out = model.forecast(inputs=arr, forecast_horizon=horizon)
        except Exception:
            return None
        if out is None:
            return None
        try:
            point = np.asarray(out[0], dtype=float).reshape(horizon)
        except Exception:
            return None
        low, high = point * 0.85, point * 1.15
        try:
            q = np.asarray(out[1], dtype=float).reshape(horizon, -1)
            if q.shape[-1] >= 2:
                low, high = q[:, 0], q[:, -1]
        except Exception:
            pass
        points.append(point)
        lows.append(low)
        highs.append(high)
    try:
        import numpy as np
        return (np.stack(points), np.stack(lows), np.stack(highs))
    except Exception:
        return None


def run_forecast(series_map, horizon):
    """Devuelve (resultados_por_metrica, metodo)."""
    names = ["posts_new", "users_new", "guilds_new"]
    series_list = [series_map[n] for n in names]
    length = len(series_list[0])
    result = {}
    outcome = None
    method = "plantilla"

    if length >= max(12, horizon):
        try:
            import numpy as np
            matrix = np.asarray(series_list, dtype=np.float32)
            outcome = forecast_tfm3(matrix, horizon)
            method = "TimesFM 3.0 (multivariado, zero-shot)"
            if outcome is None:
                outcome = forecast_tfm25(matrix, horizon)
                method = "TimesFM 2.5 (univariado, zero-shot)"
        except Exception:
            outcome = None

    for i, name in enumerate(names):
        if outcome is not None:
            pts, low, high = outcome[0][i], outcome[1][i], outcome[2][i]
            if not isinstance(pts, list):
                pts = [float(x) for x in pts.tolist()]
                low = [float(x) for x in low.tolist()]
                high = [float(x) for x in high.tolist()]
            else:
                pts = [float(x) for x in pts]
                low = [float(x) for x in low]
                high = [float(x) for x in high]
        else:
            pts, low, high = naive_forecast(series_map[name], horizon)
        result[name] = {
            "point": pts,
            "low": low,
            "high": high,
            "sum_point": sum(pts),
            "sum_low": sum(low),
            "sum_high": sum(high),
        }
    return result, method.strip()


# ---------------------------------------------------------------------------
# Redacción del informe (LLM estándar o plantilla)
# ---------------------------------------------------------------------------

def fmt_int(x):
    return f"{int(round(x)):,}".replace(",", ".")


def build_prompt(cfg, stats, forecast, horizon, totals, method):
    lines = [
        "Sos el redactor del laboratorio PostSingular (comunidad que estudia la",
        "propiedad productiva participativa). Escribís un INFORME INFORMATIVO para",
        "el muro de la comunidad, en español rioplatense, tono claro y sobrio de",
        "laboratorio, sin opiniones políticas. NO inventes ni agregues datos: usá",
        f"solo estos números. Pronóstico a {horizon} días, método: {method}.",
        "",
        "DATOS REALES ACTUALES (de la página):",
    ]
    for key, label in (("members", "miembros activos"), ("visible_posts", "publicaciones visibles"),
                       ("guilds", "gremios"), ("requests_online", "solicitudes abiertas"),
                       ("polls", "encuestas en cartelera")):
        if totals.get(key) is not None:
            lines.append(f"- {label}: {fmt_int(totals[key])}")
    lines.append("")
    lines.append("SERIES DIARIAS (nuevos por día) y su media reciente:")
    for name, label in (("posts_new", "publicaciones nuevas"), ("users_new", "miembros nuevos"),
                        ("guilds_new", "gremios nuevos")):
        st = stats[name]
        fr = forecast[name]
        lines.append(
            f"- {label}: última semana promedio {st['mean7']:.2f}/día, "
            f"últimos 30 días {st['mean30']:.2f}/día; "
            f"pronóstico total próximo {horizon} días: entre {fmt_int(fr['sum_low'])} y "
            f"{fmt_int(fr['sum_high'])} (punto medio {fmt_int(fr['sum_point'])})"
        )
    lines.append(f"- solicitudes nuevas (como posts): media últimos 7 días {stats['requests_new']['mean7']:.2f}/día")
    lines.append("")
    lines.append(
        "ESTRUCTURA (3 párrafos cortos): 1) resumen del estado actual; "
        "2) tendencia reciente y proyección con rangos; "
        "3) nota de método: pronóstico probabilístico y observacional, "
        "no causal, hecho con series públicas; invitación a leerlo como experimento."
    )
    lines.append("Máximo 180 palabras. Solo texto plano en párrafos, sin listas puntuales largas, sin markdown.")
    return "\n".join(lines)


def llm_ollama(cfg, prompt):
    url = f"{cfg['ollama_url'].rstrip('/')}/api/generate"
    payload = {
        "model": cfg["ollama_model"],
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.5, "num_predict": 800},
    }
    status, body = http_json("POST", url, payload=payload, timeout=300)
    if status == 200 and isinstance(body, dict) and body.get("response"):
        return body["response"].strip()
    return None


def llm_openai(cfg, prompt):
    url = f"{cfg['llm_api_url'].rstrip('/')}/chat/completions"
    payload = {
        "model": cfg["llm_model"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
    }
    status, body = http_json(
        "POST", url, payload=payload,
        headers={"Authorization": f"Bearer {cfg['llm_api_key']}"},
        timeout=300,
    )
    if status != 200:
        return None
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None
    return str(content).strip() if content else None


def template_report(cfg, stats, forecast, horizon, totals, method):
    now = datetime.now(AR)
    lines = [
        f"Resumen de la comunidad y proyección a {horizon} días (informe del "
        f"{now.strftime('%d/%m/%Y')}, generado por la skill de previsión del bot).",
        "",
        "Estado actual. La comunidad cuenta con %s miembros activos, %s "
        "publicaciones visibles y %s gremios; hay %s solicitudes abiertas y %s "
        "encuestas en cartelera. Son los totales reales que sirve la API pública.",
    ]
    filled = [
        fmt_int(totals.get("members") or 0),
        fmt_int(totals.get("visible_posts") or 0),
        fmt_int(totals.get("guilds") or 0),
        fmt_int(totals.get("requests_online") or 0),
        fmt_int(totals.get("polls") or 0),
    ]
    lines[2] = lines[2] % tuple(filled)
    lines.append("")
    lines.append(f"Tendencia reciente y proyección ({horizon} días). "
                 "En las últimas semanas se observaron estos promedios diarios de "
                 "nuevos aportes:")
    for name, label in (("posts_new", "publicaciones"), ("users_new", "miembros"),
                        ("guilds_new", "gremios")):
        st = stats[name]
        fr = forecast[name]
        lines.append(f"- {label}: {st['mean7']:.1f} por día en la última semana; "
                     f"para los próximos {horizon} días se espera un total entre "
                     f"{fmt_int(fr['sum_low'])} y {fmt_int(fr['sum_high'])} "
                     f"(punto medio {fmt_int(fr['sum_point'])}).")
    lines.append(f"- solicitudes nuevas: {stats['requests_new']['mean7']:.1f} por día en la última semana.")
    lines.append("")
    lines.append(f"Nota de método. Este pronóstico es probabilístico y observacional "
                 f"({method} sobre series públicas), no una predicción causal ni una "
                 "decisión del modelo de PostSingular. Se presenta como experimento del "
                 "laboratorio: la trayectoria puede cambiar con los hechos reales.")
    return "\n".join(lines)


def write_report(cfg, stats, forecast, horizon, totals, method, use_llm):
    prompt = build_prompt(cfg, stats, forecast, horizon, totals, method)
    text = None
    source = "plantilla"
    if use_llm:
        try:
            text = llm_ollama(cfg, prompt)
            source = f"Ollama ({cfg['ollama_model']})" if text else source
        except Exception as error:
            log(f"llm_ollama_error {error!r}")
        if not text and cfg["llm_api_key"] and cfg["llm_api_url"]:
            try:
                text = llm_openai(cfg, prompt)
                source = cfg["llm_model"] or "OpenAI-compatible" if text else source
            except Exception as error:
                log(f"llm_openai_error {error!r}")
    if not text:
        text = template_report(cfg, stats, forecast, horizon, totals, method)
        source = "plantilla (sin LLM)"
    return text.strip(), source, prompt


# ---------------------------------------------------------------------------
# Publicación en la página (Información) / aviso Telegram
# ---------------------------------------------------------------------------

def login(cfg):
    status, body = http_json(
        "POST", f"{cfg['base']}/api/auth/login",
        payload={"email": cfg["posts_user"], "password": cfg["posts_password"]},
        timeout=40,
    )
    if status != 200 or not isinstance(body, dict) or not body.get("token"):
        log(f"login_failed status={status}")
        return None
    return body["token"]


def publish_post(cfg, token, title, content_html):
    status, body = http_json(
        "POST", f"{cfg['base']}/api/posts",
        payload={"title": title, "content": content_html, "type": "update"},
        headers={"Authorization": f"Bearer {token}"},
        timeout=60,
    )
    if status != 201 or not isinstance(body, dict) or not body.get("id"):
        log(f"publish_failed status={status}")
        return None
    return body["id"]


def text_to_html(text):
    """Texto plano -> HTML del subconjunto seguro (p/h2/h3/ul/li/strong/em/hr)."""
    esc = lambda s: html.escape(s, quote=False)

    def inline(line):
        s = esc(line)
        for outer, tag in (("**", "strong"), ("*", "em"), ("`", "code")):
            parts = s.split(outer)
            if len(parts) > 1:
                s = parts[0]
                for i, part in enumerate(parts[1:], start=1):
                    s += (f"<{tag}>" if i % 2 else f"</{tag}>") + part
        return s

    lines = text.replace("\r", "").split("\n")
    out = []
    ul_open = False

    def flush_ul():
        nonlocal ul_open
        if ul_open:
            out.append("</ul>")
            ul_open = False

    for raw in lines:
        line = raw.rstrip()
        strip = line.strip()
        if not strip:
            flush_ul()
            continue
        if strip.startswith("### "):
            flush_ul()
            out.append(f"<h3>{inline(strip[4:])}</h3>")
        elif strip.startswith("## "):
            flush_ul()
            out.append(f"<h2>{inline(strip[3:])}</h2>")
        elif strip.startswith("# "):
            flush_ul()
            out.append(f"<h2>{inline(strip[2:])}</h2>")
        elif strip in ("---", "—-"):
            flush_ul()
            out.append("<hr/>")
        elif strip.startswith("- ") or strip.startswith("* "):
            if not ul_open:
                out.append("<ul>")
                ul_open = True
            out.append(f"<li>{inline(strip[2:])}</li>")
        else:
            flush_ul()
            out.append(f"<p>{inline(line)}</p>")
    flush_ul()
    return "\n".join(out).strip() or "<p></p>"


def telegram_notify(cfg, title, post_id):
    token = cfg["telegram_token"]
    chat = cfg["telegram_chat_id"]
    if not chat:
        try:
            path = os.path.join(BOT_DIR, ".telegram-hourly-bot-state.json")
            with open(path, "r", encoding="utf-8") as file:
                chat = (json.load(file) or {}).get("chat_id") or ""
        except (OSError, ValueError):
            chat = ""
    if not token or not chat:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat,
        "text": f"Informe de previsión publicado: {title}\n{cfg['base']}/community",
        "disable_web_page_preview": "true",
    }
    status, body = http_json("POST", url, payload=payload, timeout=40)
    return bool(status == 200 and isinstance(body, dict) and body.get("ok"))


# ---------------------------------------------------------------------------
# Orquestación
# ---------------------------------------------------------------------------

def main(argv):
    args = [a for a in argv if a.startswith("--")]
    preview = "--preview" in args
    force = "--force" in args
    no_llm = "--no-llm" in args
    cfg = load_config()
    if "--base" in argv:
        idx = argv.index("--base")
        if idx + 1 < len(argv):
            cfg["base"] = argv[idx + 1].rstrip("/")
    if "--horizon" in argv:
        idx = argv.index("--horizon")
        if idx + 1 < len(argv):
            try:
                cfg["horizon"] = int(argv[idx + 1])
            except ValueError:
                pass

    log("prevision_start")
    print(f"[prevision] base={cfg['base']} horizon={cfg['horizon']}d "
          f"preview={preview} llm={not no_llm}")

    dates, series, totals = build_series(cfg)
    stats = {name: series_stats(series[name]) for name in series}

    forecast, method = run_forecast(series, cfg["horizon"])
    text, source, _prompt = write_report(cfg, stats, forecast, cfg["horizon"], totals, method, use_llm=not no_llm)

    title = f"Informe de actividad y previsión · {datetime.now(AR).strftime('%d/%m/%Y')}"
    content_html = text_to_html(text)
    fingerprint = hashlib.sha256((title + content_html).encode("utf-8")).hexdigest()

    print("=" * 60)
    print(f"TITULO: {title}")
    print(f"METODO: {method}")
    print(f"REDACCION: {source}")
    print("-" * 60)
    print(text)
    print("=" * 60)

    if preview:
        print("PREVIEW=1 (no se publicó)")
        return 0

    state = load_state()
    if state.get("last_fingerprint") == fingerprint and not force:
        print("SIN_CAMBIOS=1 (ya publicado este informe; usá --force para repetir)")
        return 2

    if not cfg["posts_user"] or not cfg["posts_password"]:
        print("PUBLISH_ERROR: falta POSTS_USER/POSTS_PASSWORD en BOT/.env")
        log("publish_skip_no_credentials")
        return 3

    token = login(cfg)
    if not token:
        print("PUBLISH_ERROR=login_failed")
        return 1
    post_id = publish_post(cfg, token, title, content_html)
    if not post_id:
        print("PUBLISH_ERROR=post_failed")
        return 1
    notified = telegram_notify(cfg, title, post_id)
    state.update({
        "last_fingerprint": fingerprint,
        "last_title": title,
        "last_post_id": post_id,
        "last_published_at": datetime.now(timezone.utc).isoformat(),
        "method": method,
        "source": source,
    })
    save_state(state)
    print(f"PUBLISH_OK=1 id={post_id} telegram={notified}")
    log(f"prevision_published id={post_id} notify={notified}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except Exception as error:  # noqa: BLE001
        log(f"prevision_error {error!r}")
        print(f"ERROR: {error!r}")
        sys.exit(1)