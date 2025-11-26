# PowerShell script to start ngrok and display the URL
# Make sure ngrok is in your PATH or update the path below

Write-Host "Starting ngrok tunnel on port 8000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop ngrok" -ForegroundColor Yellow
Write-Host ""

# Start ngrok on port 8000 (backend port)
ngrok http 8000

