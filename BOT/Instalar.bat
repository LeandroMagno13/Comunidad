@echo off
rem ============================================================================
rem  Instalador del bot de avisos de PostSingular
rem
rem  Pasos:
rem    1) Verifica Python y lo instala (con winget) si no esta presente.
rem    2) Prepara el archivo .env con el token de Telegram.
rem    3) Inicia el bot llamando a Arrancar.bat.
rem
rem  El bot usa solamente la biblioteca estandar de Python: no hace falta
rem  instalar paquetes externos ni clonar repositorios.
rem ============================================================================
setlocal EnableExtensions DisableDelayedExpansion
title Instalador del bot de avisos de PostSingular

set "BOT_DIR=C:\Comunidad\BOT"
if not exist "%BOT_DIR%\telegram-hourly-bot.py" set "BOT_DIR=%~dp0"
if not exist "%BOT_DIR%\telegram-hourly-bot.py" (
  echo [ERROR] No se encontro telegram-hourly-bot.py en %BOT_DIR%.
  echo         Guarda todos los archivos del bot en C:\Comunidad\BOT
  echo         y vuelve a ejecutar este instalador.
  exit /b 1
)

echo.
echo  ============================================================
echo   Bot de avisos de PostSingular - Instalador
echo  ============================================================
echo.

echo  [1/3] Verificando Python...
where py >nul 2>nul
if not errorlevel 1 goto PYTHON_OK
where python >nul 2>nul
if not errorlevel 1 goto PYTHON_OK

echo        Python no esta instalado en esta PC.
where winget >nul 2>nul
if errorlevel 1 goto SIN_WINGET
echo        Se instalara Python 3.13 con winget. Puede tardar unos minutos.
winget install --id Python.Python.3.13 -e --source winget --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo  [ERROR] No se pudo instalar Python automaticamente.
  echo          Revisa el mensaje anterior y prueba de nuevo.
  exit /b 1
)
echo        Python quedo instalado.
echo.
echo        Para continuar, cierra esta ventana y ejecuta Instalar.bat
echo        una vez mas. El bot arrancara automaticamente.
exit /b 0

:SIN_WINGET
echo        Esta PC no tiene winget. Se abrira la pagina de descarga oficial.
start "" "https://www.python.org/downloads/windows/"
echo        Al instalar Python, marca la opcion
echo        "Add Python to PATH". Despues ejecuta Instalar.bat de nuevo.
exit /b 1

:PYTHON_OK
echo        Python encontrado.
cd /d "%BOT_DIR%"

echo.
echo  [2/3] Preparando el archivo .env...
if exist ".env" (
  echo        El archivo .env ya existe. Se conserva tal cual esta.
  goto BOT_START
)
copy /Y ".env.example" ".env" >nul
echo        Se creo el archivo .env y se abre el Bloc de notas.
echo        Escribi el token del bot despues del signo igual.
echo        ATENCION: no compartas ese token. Queda guardado solo
echo        en tu PC y no debe subirse a GitHub ni enviarse por chat.
notepad ".env"
echo.
echo        Cuando termines de guardar el token, presiona una tecla
echo        para iniciar el bot.
pause
goto BOT_START

:BOT_START
echo.
echo  [3/3] Iniciando el bot...
call "%BOT_DIR%\Arrancar.bat"
if errorlevel 1 (
  echo  [ERROR] El bot no pudo iniciarse. Revisa el mensaje anterior.
  exit /b 1
)
echo.
echo  Listo. El bot quedo activo y avisara cuando haya cambios en la
echo  comunidad, ademas del informe diario de las 20:00 (hora de
echo  Argentina). Tambien responde a /informe y a /reporte.
echo.
echo  Para que arranque solo al encender la PC, copia Arrancar.bat
echo  a la carpeta Inicio (shell:startup).
echo.
pause
exit /b 0