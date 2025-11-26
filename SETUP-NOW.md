# Quick Setup - Follow These Steps

## Step 1: Find Your Ngrok URL

In your ngrok terminal, look for a line that says:
```
Forwarding: https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:8000
```

**Copy the HTTPS URL** (the part before the arrow `->`)

Example: `https://abc123.ngrok-free.app`

## Step 2: Update Configuration Files

### Option A: Use the Helper Script (Easiest)

In a NEW PowerShell terminal (keep ngrok running), run:

```powershell
cd C:\Users\Leo\Desktop\ibtikarapp
.\update-ngrok-config.ps1 -NgrokUrl "PASTE-YOUR-NGROK-URL-HERE"
```

Replace `PASTE-YOUR-NGROK-URL-HERE` with your actual ngrok URL (without quotes if it has spaces).

### Option B: Manual Update

**1. Backend .env file:**
- Location: `C:\Users\Leo\Desktop\ibtikar-backend-main\backend\.env`
- Create or edit this file and add/update:
```
X_REDIRECT_URI=https://YOUR-NGROK-URL/v1/oauth/x/callback
```

**2. Expo .env file:**
- Location: `C:\Users\Leo\Desktop\ibtikarapp\ibtikar\.env`
- Create or edit this file and add:
```
EXPO_PUBLIC_BACKEND_URL=https://YOUR-NGROK-URL
```

## Step 3: Update Twitter Developer Portal

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Click on your app
3. Go to "Settings" → "User authentication settings"
4. Under "Callback URI / Redirect URL", add:
   ```
   https://YOUR-NGROK-URL/v1/oauth/x/callback
   ```
5. Click "Save"

## Step 4: Restart Services

1. **Restart your backend** (if it's running)
2. **Restart Expo app:**
   ```powershell
   cd C:\Users\Leo\Desktop\ibtikarapp\ibtikar
   npx expo start --clear
   ```

## Step 5: Test!

1. Open your Expo app on your phone
2. Click "Login with Twitter"
3. Complete the OAuth flow
4. You should be redirected back to the app automatically!

---

**Keep ngrok running** - Don't close the ngrok terminal window while testing!

