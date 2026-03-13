@echo off
setlocal

cd /d "%~dp0.."
echo Starting Hugo server in a new window...
echo Home: http://localhost:1313/
echo Publisher: http://localhost:1313/publisher/
echo.

start "Hugo Server" powershell -NoExit -Command "Set-Location '%cd%'; hugo server -D"
timeout /t 3 /nobreak >nul
start "" "http://localhost:1313/"

endlocal
