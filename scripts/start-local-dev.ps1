param(
  [string]$PublishPassword = "123456",
  [string]$CorsOrigin = "http://localhost:1313",
  [int]$PublishPort = 8790,
  [switch]$StartHugo = $true,
  [switch]$StartPublisherApi = $true
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$env:LOCAL_PUBLISH_PASSWORD = $PublishPassword
$env:LOCAL_PUBLISH_CORS_ORIGIN = $CorsOrigin
$env:LOCAL_PUBLISH_PORT = "$PublishPort"

Write-Host "Local env configured:"
Write-Host "  LOCAL_PUBLISH_PASSWORD=******"
Write-Host "  LOCAL_PUBLISH_CORS_ORIGIN=$($env:LOCAL_PUBLISH_CORS_ORIGIN)"
Write-Host "  LOCAL_PUBLISH_PORT=$($env:LOCAL_PUBLISH_PORT)"
Write-Host ""
Write-Host "Publisher API URL: http://127.0.0.1:$PublishPort/publish"
Write-Host "Publisher Page:    http://localhost:1313/publisher/"
Write-Host ""

if ($StartHugo) {
  Write-Host "Starting Hugo server in a new PowerShell window..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; hugo server -D"
}

if ($StartPublisherApi) {
  Write-Host "Starting local publisher API in a new PowerShell window..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; `$env:LOCAL_PUBLISH_PASSWORD='$PublishPassword'; `$env:LOCAL_PUBLISH_CORS_ORIGIN='$CorsOrigin'; `$env:LOCAL_PUBLISH_PORT='$PublishPort'; npm run publisher:local-api"
}

Write-Host ""
Write-Host "Done."
