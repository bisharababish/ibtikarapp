# Test script for Ibtikar Backend API
# This tests various endpoints to ensure everything is working

Write-Host "=== Testing Ibtikar Backend API ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://ibtikar-backend.onrender.com"

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -Headers @{"Accept"="application/json"}
    Write-Host "   ✓ Health: $($health.status)" -ForegroundColor Green
    Write-Host "   Environment: $($health.env)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: OAuth Debug
Write-Host "2. Testing OAuth Configuration..." -ForegroundColor Yellow
try {
    $oauth = Invoke-RestMethod -Uri "$baseUrl/v1/oauth/debug" -Method GET -Headers @{"Accept"="application/json"}
    Write-Host "   ✓ OAuth configured" -ForegroundColor Green
    Write-Host "   Client ID: $($oauth.client_id)" -ForegroundColor Gray
    Write-Host "   Redirect URI: $($oauth.redirect_uri)" -ForegroundColor Gray
    Write-Host "   Scopes: $($oauth.scopes)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ OAuth debug failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Link Status
Write-Host "3. Testing Link Status for user_id=1..." -ForegroundColor Yellow
try {
    $linkStatus = Invoke-RestMethod -Uri "$baseUrl/v1/me/link-status?user_id=1" -Method GET -Headers @{"Accept"="application/json"}
    if ($linkStatus.linked) {
        Write-Host "   ✓ Account is linked" -ForegroundColor Green
        Write-Host "   Scopes: $($linkStatus.scopes)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ Account is NOT linked" -ForegroundColor Yellow
        Write-Host "   → You need to complete OAuth flow at: $baseUrl/v1/oauth/x/start?user_id=1" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ Link status check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: OAuth Start URL (check if it redirects properly)
Write-Host "4. Testing OAuth Start URL..." -ForegroundColor Yellow
try {
    $oauthStartUrl = "$baseUrl/v1/oauth/x/start?user_id=1"
    Write-Host "   OAuth Start URL: $oauthStartUrl" -ForegroundColor Cyan
    Write-Host "   → Open this URL in your browser to start OAuth flow" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Failed to generate OAuth URL: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Analysis Preview (only if linked)
Write-Host "5. Testing Analysis Preview Endpoint..." -ForegroundColor Yellow
try {
    $linkStatus = Invoke-RestMethod -Uri "$baseUrl/v1/me/link-status?user_id=1" -Method GET -Headers @{"Accept"="application/json"}
    if ($linkStatus.linked) {
        $analysisUrl = "$baseUrl/v1/analysis/preview?user_id=1" + '&authors_limit=3' + '&per_batch=3'
        $analysis = Invoke-RestMethod -Uri "$analysisUrl" -Method POST -Headers @{"Accept"="application/json"} -ErrorAction Continue
        Write-Host "   ✓ Analysis successful" -ForegroundColor Green
        Write-Host "   Total items: $($analysis.items.Count)" -ForegroundColor Gray
        Write-Host "   Harmful: $($analysis.harmful_count), Safe: $($analysis.safe_count), Unknown: $($analysis.unknown_count)" -ForegroundColor Gray
        
        # Check if model is working correctly
        if ($analysis.items.Count -gt 0) {
            $firstItem = $analysis.items[0]
            Write-Host "   First item label: $($firstItem.label), score: $($firstItem.score)" -ForegroundColor Gray
            if ($firstItem.score -eq 0.5) {
                Write-Host "   ⚠ Warning: Score is 0.5 (default fallback) - model might not be working" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ⚠ Skipped - account not linked" -ForegroundColor Yellow
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*500*") {
        Write-Host "   ✗ Analysis failed - likely no OAuth tokens (account not linked)" -ForegroundColor Red
    } else {
        Write-Host "   ✗ Analysis failed: $errorMessage" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If account is not linked, visit: $baseUrl/v1/oauth/x/start?user_id=1" -ForegroundColor White
Write-Host "2. After linking, run this script again to test analysis" -ForegroundColor White
Write-Host "3. Check Render logs for Hugging Face API calls if classifications look wrong" -ForegroundColor White

