# OAuth Callback URL Configuration

## ✅ Confirmed Callback URL

**Backend Callback Endpoint:**
```
https://ibtikar-backend.onrender.com/v1/oauth/x/callback
```

## 🔧 Configuration Checklist

### 1. Twitter Developer Portal
- ✅ Go to: https://developer.twitter.com/en/portal/dashboard
- ✅ Navigate to your app settings
- ✅ Set **Callback URL / Redirect URL** to:
  ```
  https://ibtikar-backend.onrender.com/v1/oauth/x/callback
  ```
- ⚠️ **Important:** This must match EXACTLY (including https://)

### 2. Backend Environment Variable
- ✅ Set `X_REDIRECT_URI` in your backend `.env` file:
  ```
  X_REDIRECT_URI=https://ibtikar-backend.onrender.com/v1/oauth/x/callback
  ```
- ✅ This is used in `server/backend/core/config.py`
- ✅ The backend uses this in `server/backend/clients/x_client.py` when building OAuth URLs

### 3. Backend Endpoint
- ✅ The endpoint is defined in `server/backend/api/main.py`:
  ```python
  @app.get("/v1/oauth/x/callback")
  async def x_oauth_callback(...)
  ```
- ✅ This endpoint handles the OAuth callback from Twitter

### 4. Frontend Configuration
- ✅ Frontend uses `BASE_URL` from `constants/config.ts`:
  ```typescript
  BASE_URL = "https://ibtikar-backend.onrender.com"
  ```
- ✅ Frontend calls: `${BASE_URL}/v1/oauth/x/start` to initiate OAuth
- ✅ Backend redirects to Twitter with the callback URL
- ✅ Twitter redirects back to: `https://ibtikar-backend.onrender.com/v1/oauth/x/callback`

## 🔄 OAuth Flow

1. **User clicks "Login with Twitter"**
   - Frontend calls: `GET https://ibtikar-backend.onrender.com/v1/oauth/x/start?user_id=1`

2. **Backend creates OAuth URL**
   - Uses `X_REDIRECT_URI` from environment
   - Redirects to: `https://twitter.com/i/oauth2/authorize?...&redirect_uri=https://ibtikar-backend.onrender.com/v1/oauth/x/callback&...`

3. **User authorizes on Twitter**
   - Twitter redirects to: `https://ibtikar-backend.onrender.com/v1/oauth/x/callback?code=...&state=...`

4. **Backend processes callback**
   - Exchanges code for token
   - Saves token to database
   - Redirects to app: `ibtikar://oauth/callback?success=true&user_id=1` (mobile)
   - OR redirects to: `http://localhost:8081?success=true&user_id=1` (web)

5. **App receives callback**
   - Deep link listener catches `ibtikar://oauth/callback`
   - OR web detects URL params
   - Calls `handleCallback()` to complete login

## ⚠️ Common Issues

### Issue 1: Callback URL Mismatch
**Symptom:** Twitter shows "Invalid redirect URI" error

**Fix:**
- Verify Twitter Developer Portal has EXACTLY: `https://ibtikar-backend.onrender.com/v1/oauth/x/callback`
- Verify backend `.env` has: `X_REDIRECT_URI=https://ibtikar-backend.onrender.com/v1/oauth/x/callback`
- No trailing slashes, no http (must be https)

### Issue 2: Callback Not Reaching Backend
**Symptom:** Backend logs don't show "OAuth Callback Received"

**Fix:**
- Check Render logs to see if callback endpoint is being hit
- Verify Render service is running
- Check if URL is accessible: `curl https://ibtikar-backend.onrender.com/v1/oauth/x/callback`

### Issue 3: Deep Link Not Working
**Symptom:** Backend receives callback but app doesn't

**Fix:**
- This is expected in Expo Go - deep links are unreliable
- Use the green "I Authorized - Check Status" button
- The button calls `manualCheckStatus()` which checks backend directly

## ✅ Verification Steps

1. **Check Twitter Developer Portal:**
   - Login to https://developer.twitter.com
   - Go to your app
   - Verify callback URL matches exactly

2. **Check Backend Environment:**
   - In Render dashboard, check environment variables
   - Verify `X_REDIRECT_URI` is set correctly

3. **Test Callback Endpoint:**
   ```bash
   curl https://ibtikar-backend.onrender.com/v1/oauth/x/callback
   ```
   - Should return 400 (missing code/state) - this is normal
   - If 404, endpoint doesn't exist
   - If 500, check backend logs

4. **Check Backend Logs:**
   - In Render dashboard, check logs
   - Look for: "🔗 OAuth Callback Received"
   - This confirms callback is reaching backend

## 📝 Summary

- **Callback URL:** `https://ibtikar-backend.onrender.com/v1/oauth/x/callback`
- **Must match in:** Twitter Developer Portal + Backend `.env` file
- **Backend endpoint:** `/v1/oauth/x/callback` in `main.py`
- **Frontend doesn't need to know this URL** - it only calls `/v1/oauth/x/start`

