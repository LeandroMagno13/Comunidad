@echo off
rem Arrancar.bat - inicia el bot horario portable de POSTSINGULAR (EXTERNAL
rem de solo lectura, sin escalar). El token se lee en TIEMPO REAL desde
rem BOT\.env por el propio bot: este archivo JAMAS contiene ni imprime un
rem token ni ningun secreto (contrato Lee.txt: inyeccion por ENV).
rem
rem Uso en la otra PC: copia la carpeta C:\Comunidad entera y pon un acceso
rem directo a este .bat en Inicio de Windows (shell:startup). El bot se abre
rem minimizado como bucle horario; su traza queda en BOT\.telegram-hourly-bot.log
rem y su estado en BOT\.telegram-hourly-bot-state.json. No hace falta nada mas.
setlocal disableextensions
cd /d "%~dp0"
if not exist "telegram-hourly-bot.py" (
  echo NO_ENCONTRADO_BOT_%CD% 1>&2
  pause
  exit /b 1
)
where py >nul 2>nul
if %errorlevel%==0 (
  start "POSTSINGULAR-INFORME-HORARIO" /min py -3 "telegram-hourly-bot.py"
  exit /b 0
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "POSTSINGULAR-INFORME-HORARIO" /min python "telegram-hourly-bot.py"
  exit /b 0
)
echo NO_ENCONTRADO_PYTHON_INSTALA_PYTHON 1>&2
pause
exit /b 1
