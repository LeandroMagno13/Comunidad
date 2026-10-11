import sys
sys.path.insert(0, "BOT")
import importlib.util

spec = importlib.util.spec_from_file_location("hourly_bot", "BOT/telegram-hourly-bot.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

# redact_token nunca expone el secreto
assert mod.redact_token("") == ""
assert mod.redact_token(None) == ""
assert mod.redact_token("abc") == "(secreto)"
r = mod.redact_token("A" * 40)
assert "A" * 40 not in r and "len=40" in r, r

# link_prefix estable y con formato
assert mod.link_prefix("tok123") == mod.link_prefix("tok123")
assert len(mod.link_prefix("tok123")) == 8

# get_links migra estados viejos sin romper
mod.state = dict(mod.DEFAULT_STATE)
assert mod.get_links() == {}
mod.state["links"] = {"123": {"token": "x"}}
assert mod.get_links() == {"123": {"token": "x"}}

# handle_link_command: /vincular sin token pide uso (sin red)
sent = []
mod.send_report = lambda t, c, m: sent.append(m) or True
mod.handle_link_command("BOT", 999, "/vincular", "/vincular")
assert sent and "Uso:" in sent[0], sent

# /desvincular sin vínculo
sent.clear()
mod.handle_link_command("BOT", 999, "/desvincular", "/desvincular")
assert sent and "No estabas" in sent[0], sent

# /mibot sin vínculo
sent.clear()
mod.handle_link_command("BOT", 999, "/mibot", "/mibot")
assert sent and "No vinculado" in sent[0], sent

print("BOT_SELFTEST_OK")
