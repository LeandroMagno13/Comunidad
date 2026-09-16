@echo off
rem Instalador de la skill prevision (informe_forecast.py) para el bot de PostSingular.
rem Instala las dependencias opcionales del pronostico (TimesFM + torch CPU).
rem Si no queres instalar nada pesado, el informe igual funciona por plantilla.
cd /d "%~dp0\..

echo [1/2] Instalando torch (CPU) ...
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 goto error

echo [2/2] Instalando timesfm[torch] ...
python -m pip install "timesfm[torch]"
if errorlevel 1 goto error

echo.
echo Listo. Primer uso bajara el modelo de HuggingFace (~800 MB) a AUTO.
echo Proba con:  python prevision\informe_forecast.py --preview
goto end

:error
echo Fallo al instalar. Si ya habia torch instalado, podes probar solo:
echo   python -m pip install "timesfm[torch]"
:end
pause