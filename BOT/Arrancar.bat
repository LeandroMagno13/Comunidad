@echo off
rem Arrancar.bat - inicia el bot horario portable de POSTSINGULAR (EXTERNAL
rem de solo lectura, sin escalar). El token se lee en TIEMPO REAL desde
rem BOT\.env por el propio bot: este archivo JAMAS contiene ni imprime un
rem token ni ningun secreto (contrato Lee.txt: inyeccion por ENV).
rem
rem Uso: deja esta carpeta como C:\Comunidad\BOT y copia Arrancar.bat a
rem shell:startup. Tambien funciona si se ejecuta directamente desde BOT.
setlocal EnableExtensions DisableDelayedExpansion
set "BOT_DIR=C:\Comunidad\BOT"
if not exist "%BOT_DIR%\telegram-hourly-bot.py" set "BOT_DIR=%~dp0"
if not exist "%BOT_DIR%\telegram-hourly-bot.py" (
  echo NO_ENCONTRADO_BOT_%BOT_DIR% 1>&2
  exit /b 1
)
cd /d "%BOT_DIR%"
where py >nul 2>nul
if %errorlevel%==0 (
  start "POSTSINGULAR-INFORME-HORARIO" /min py -3 "%BOT_DIR%\telegram-hourly-bot.py"
  exit /b 0
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "POSTSINGULAR-INFORME-HORARIO" /min python "%BOT_DIR%\telegram-hourly-bot.py"
  exit /b 0
)
echo NO_ENCONTRADO_PYTHON_INSTALA_PYTHON 1>&2
exit /b 1
