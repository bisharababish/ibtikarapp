# PowerShell script to update .env files with ngrok URL
# Usage: .\update-ngrok-config.ps1 -NgrokUrl "https://your-domain.ngrok-free.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$NgrokUrl
)

Write-Host "Updating configuration files with ngrok URL: $NgrokUrl" -ForegroundColor Green
Write-Host ""

# Remove trailing slash if present
$NgrokUrl = $NgrokUrl.TrimEnd('/')

# Backend .env file path
$BackendEnvPath = "C:\Users\Leo\Desktop\ibtikar-backend-main\backend\.env"
$BackendCallbackUrl = "$NgrokUrl/v1/oauth/x/callback"

# Expo .env file path
$ExpoEnvPath = "C:\Users\Leo\Desktop\ibtikarapp\ibtikar\.env"

Write-Host "1. Updating Backend .env file..." -ForegroundColor Yellow
if (Test-Path $BackendEnvPath) {
    # Read existing .env file
    $backendContent = Get-Content $BackendEnvPath -Raw
    
    # Update or add X_REDIRECT_URI
    if ($backendContent -match "X_REDIRECT_URI=") {
        $backendContent = $backendContent -replace "X_REDIRECT_URI=.*", "X_REDIRECT_URI=$BackendCallbackUrl"
    } else {
        $backendContent += "`nX_REDIRECT_URI=$BackendCallbackUrl"
    }
    
    Set-Content -Path $BackendEnvPath -Value $backendContent
    Write-Host "   ✓ Updated: $BackendEnvPath" -ForegroundColor Green
} else {
    # Create new .env file
    $backendContent = @"
# X OAuth Configuration
X_REDIRECT_URI=$BackendCallbackUrl
"@
    Set-Content -Path $BackendEnvPath -Value $backendContent
    Write-Host "   ✓ Created: $BackendEnvPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Updating Expo .env file..." -ForegroundColor Yellow
if (Test-Path $ExpoEnvPath) {
    # Read existing .env file
    $expoContent = Get-Content $ExpoEnvPath -Raw
    
    # Update or add EXPO_PUBLIC_BACKEND_URL
    if ($expoContent -match "EXPO_PUBLIC_BACKEND_URL=") {
        $expoContent = $expoContent -replace "EXPO_PUBLIC_BACKEND_URL=.*", "EXPO_PUBLIC_BACKEND_URL=$NgrokUrl"
    } else {
        $expoContent += "`nEXPO_PUBLIC_BACKEND_URL=$NgrokUrl"
    }
    
    Set-Content -Path $ExpoEnvPath -Value $expoContent
    Write-Host "   ✓ Updated: $ExpoEnvPath" -ForegroundColor Green
} else {
    # Create new .env file
    $expoContent = @"
# Backend API URL
EXPO_PUBLIC_BACKEND_URL=$NgrokUrl
"@
    Set-Content -Path $ExpoEnvPath -Value $expoContent
    Write-Host "   ✓ Created: $ExpoEnvPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Configuration updated successfully!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update Twitter Developer Portal with this callback URL:" -ForegroundColor White
Write-Host "   $BackendCallbackUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Restart your backend server" -ForegroundColor White
Write-Host "3. Restart Expo app with: npx expo start --clear" -ForegroundColor White
Write-Host ""

