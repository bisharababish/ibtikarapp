# Quick Start Guide - OAuth with Ngrok

## Prerequisites
- Backend running on port 8000
- Ngrok installed and authenticated
- Twitter OAuth app configured

## Quick Setup (5 minutes)

### 1. Start Ngrok
```bash
ngrok http 8000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### 2. Update Backend .env
Edit `C:\Users\Leo\Desktop\ibtikar-backend-main\backend\.env`:
```
X_REDIRECT_URI=https://abc123.ngrok-free.app/v1/oauth/x/callback
```

### 3. Update Twitter Developer Portal
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Add callback URL: `https://abc123.ngrok-free.app/v1/oauth/x/callback`
3. Save

### 4. Update Expo App .env
Create/edit `C:\Users\Leo\Desktop\ibtikarapp\ibtikar\.env`:
```
EXPO_PUBLIC_BACKEND_URL=https://abc123.ngrok-free.app
```

### 5. Restart Everything
- Restart backend (if needed)
- Restart Expo: `cd ibtikar && npx expo start --clear`

### 6. Test
- Open app on phone
- Click "Login with Twitter"
- Complete OAuth flow
- Should redirect back to app automatically

## Troubleshooting

**"localhost can't be reached"**
- Make sure ngrok is running
- Check that `EXPO_PUBLIC_BACKEND_URL` is set to ngrok URL
- Restart Expo with `--clear` flag

**OAuth callback fails**
- Verify `X_REDIRECT_URI` in backend .env matches ngrok URL
- Check Twitter Developer Portal has the same callback URL
- Make sure backend is running

**Deep link doesn't work**
- App scheme is `ibtikar://` (configured in app.json)
- Make sure you're testing on a real device, not emulator
- Check that expo-linking is installed

## What Changed

1. ✅ Backend callback now redirects to `ibtikar://oauth/callback`
2. ✅ AuthContext listens for deep links and handles OAuth success
3. ✅ Config supports environment variables for BASE_URL
4. ✅ Deep linking already configured in app.json

