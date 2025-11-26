# How to See Logs for Debugging

## Frontend Logs (Expo/React Native)

### Option 1: Expo Terminal
1. Open the terminal where you ran `npx expo start`
2. You should see all `console.log()` messages there
3. Look for messages starting with:
   - `🚀 STEP 1:` - Login started
   - `🔗 STEP 6:` - Callback received
   - `✅ STEP 13:` - Login complete
   - `🔄 REDIRECT:` - Redirect happening

### Option 2: React Native Debugger
1. Shake your device (or press `Cmd+D` on iOS simulator / `Cmd+M` on Android)
2. Select "Debug" or "Open Debugger"
3. Open browser DevTools (Chrome DevTools)
4. Go to Console tab
5. You'll see all logs there

### Option 3: Metro Bundler Logs
- The terminal running `npx expo start` shows all logs
- Scroll up to see previous logs
- Look for colored output with emojis

## Backend Logs (Render)

### View Render Logs:
1. Go to: https://dashboard.render.com
2. Click on your backend service (ibtikar-backend)
3. Click on "Logs" tab in the left sidebar
4. You should see real-time logs
5. Look for:
   - `🚀 OAuth Start Request` - When you click login
   - `🔗 OAuth Callback Received` - When Twitter redirects back
   - `🔀 Redirecting to app:` - Final redirect to deep link

### If Logs Are Empty:
- Make sure your backend service is running (green status)
- Try clicking "View Logs" or refresh the page
- Check if there are any errors preventing logs from showing

## What to Look For

### Successful Flow:
1. **Frontend**: `STEP 1: Starting Twitter login...`
2. **Backend**: `OAuth Start Request`
3. **Frontend**: `STEP 4: OAuth session result received`
4. **Backend**: `OAuth Callback Received` (after you click authorize)
5. **Backend**: `Redirecting to app: ibtikar://oauth/callback...`
6. **Frontend**: `Deep link event received`
7. **Frontend**: `STEP 6: OAuth callback received`
8. **Frontend**: `STEP 13: Login complete!`
9. **Frontend**: `REDIRECT: User detected`

### If Stuck:
- Check if you see `OAuth Callback Received` in backend logs
- If YES: Backend is working, issue is with deep link
- If NO: Backend callback isn't being reached (check Twitter callback URL)

## Quick Test

To test if deep links work:
1. Open your terminal
2. Run: `npx uri-scheme open ibtikar://oauth/callback?success=true&user_id=1 --ios` (for iOS)
   OR: `adb shell am start -W -a android.intent.action.VIEW -d "ibtikar://oauth/callback?success=true&user_id=1"` (for Android)
3. If the app opens and processes it, deep links work!

