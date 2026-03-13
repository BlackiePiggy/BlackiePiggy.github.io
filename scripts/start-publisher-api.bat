@echo off
setlocal

cd /d "%~dp0.."

if "%LOCAL_PUBLISH_PASSWORD%"=="" set "LOCAL_PUBLISH_PASSWORD=123456"
if "%LOCAL_PUBLISH_CORS_ORIGIN%"=="" set "LOCAL_PUBLISH_CORS_ORIGIN=http://localhost:1313"
if "%LOCAL_PUBLISH_PORT%"=="" set "LOCAL_PUBLISH_PORT=8790"

echo Starting Local Publisher API...
echo   LOCAL_PUBLISH_PASSWORD=******
echo   LOCAL_PUBLISH_CORS_ORIGIN=%LOCAL_PUBLISH_CORS_ORIGIN%
echo   LOCAL_PUBLISH_PORT=%LOCAL_PUBLISH_PORT%
echo   API URL: http://127.0.0.1:%LOCAL_PUBLISH_PORT%/publish
echo   Publisher Page: http://localhost:1313/publisher/
echo.

start "Local Publisher API" powershell -NoExit -Command "Set-Location '%cd%'; $env:LOCAL_PUBLISH_PASSWORD='%LOCAL_PUBLISH_PASSWORD%'; $env:LOCAL_PUBLISH_CORS_ORIGIN='%LOCAL_PUBLISH_CORS_ORIGIN%'; $env:LOCAL_PUBLISH_PORT='%LOCAL_PUBLISH_PORT%'; npm run publisher:local-api"
timeout /t 2 /nobreak >nul
start "" "http://localhost:1313/publisher/"

endlocal
