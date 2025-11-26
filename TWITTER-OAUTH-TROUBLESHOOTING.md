# Twitter OAuth "Unable to Give Access" - Troubleshooting

## Common Causes & Solutions

### 1. **App in Development Mode (Most Common)**
If your Twitter app is in "Development" mode, **only the Twitter account that created the app can authorize it**.

**Solution:**
- You MUST sign in with the Twitter account that created the app
- OR upgrade your app to "Production" mode (requires Twitter approval)

### 2. **Callback URL Mismatch**
The callback URL in your Twitter app settings must **exactly match** what's in your backend.

**Check:**
- Twitter Developer Portal: https://developer.twitter.com/en/portal/dashboard
- Go to your app → Settings → User authentication settings
- Check "Callback URI / Redirect URL"
- It should be: `https://unwastable-pseudocandidly-arnette.ngrok-free.dev/v1/oauth/x/callback`
- **Must match EXACTLY** (no trailing slashes, same protocol, same domain)

### 3. **Missing App Permissions**
Your app needs the right permissions configured.

**Check:**
- App permissions → Read and write (or at least Read)
- OAuth 2.0 settings enabled
- Type of App: Web App, Automated App or Bot

### 4. **App Not Configured for OAuth 2.0**
Make sure OAuth 2.0 is enabled.

**Check:**
- Settings → User authentication settings
- OAuth 2.0: Enabled
- App permissions: Set correctly
- Type of App: Web App

## Step-by-Step Fix

### Step 1: Verify Twitter App Settings

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Click on your app
3. Go to "Settings" → "User authentication settings"
4. Verify:
   - ✅ OAuth 2.0 is enabled
   - ✅ App permissions are set (Read, Write, etc.)
   - ✅ Type of App: "Web App, Automated App or Bot"
   - ✅ Callback URI: `https://unwastable-pseudocandidly-arnette.ngrok-free.dev/v1/oauth/x/callback`
   - ✅ Website URL: Can be your ngrok URL or any valid URL

### Step 2: Check App Status

- If app is in "Development" mode:
  - You MUST use the Twitter account that created the app
  - OR request production access (takes time)

### Step 3: Verify Backend Configuration

Your backend `.env` should have:
```
X_REDIRECT_URI=https://unwastable-pseudocandidly-arnette.ngrok-free.dev/v1/oauth/x/callback
X_CLIENT_ID=your_client_id_here
```

### Step 4: Test with Creator Account

If your app is in development mode:
1. Make sure you're logged into Twitter with the account that created the app
2. Try the OAuth flow again

## Quick Checklist

- [ ] Using the Twitter account that created the app (if in dev mode)
- [ ] Callback URL matches exactly in Twitter settings
- [ ] OAuth 2.0 is enabled in Twitter app
- [ ] App permissions are set correctly
- [ ] Backend `.env` has correct `X_REDIRECT_URI`
- [ ] Backend is running and accessible via ngrok
- [ ] No typos in the callback URL

## Still Not Working?

Share:
1. What error message exactly do you see?
2. Is your app in Development or Production mode?
3. Are you using the Twitter account that created the app?

