# OAuth Testing Checklist

## Before Testing
- ✅ Ngrok is running (`ngrok http 8000`)
- ✅ Backend is running on port 8000
- ✅ Twitter Developer Portal updated with callback URL
- ✅ Configuration files updated (.env files)

## Testing Steps

1. **Start Expo:**
   ```bash
   cd ibtikar
   npx expo start --clear
   ```

2. **Open app on your phone:**
   - Scan the QR code or use Expo Go app
   - Make sure your phone and computer are on the same network (or use tunnel)

3. **Test OAuth Flow:**
   - Click "Login with Twitter" button
   - Browser should open with Twitter login
   - Complete authentication
   - **Expected:** You should be redirected back to the app automatically via deep link

## What to Expect

### ✅ Success:
- Browser opens with Twitter login
- After login, browser redirects to ngrok callback URL
- Backend processes OAuth and redirects to `ibtikar://oauth/callback`
- App automatically opens and shows you're logged in

### ❌ If it fails:

**"localhost can't be reached" on phone:**
- Check that `EXPO_PUBLIC_BACKEND_URL` in `.env` is set to ngrok URL
- Restart Expo with `--clear` flag
- Verify ngrok is still running

**OAuth callback fails:**
- Check Twitter Developer Portal has the exact callback URL
- Verify backend `.env` has correct `X_REDIRECT_URI`
- Check backend logs for errors

**Deep link doesn't work:**
- Make sure you're testing on a real device (not emulator)
- Check that app scheme is `ibtikar://` (configured in app.json)
- Try manually opening: `ibtikar://oauth/callback?success=true&user_id=1`

## Debug Commands

Check if environment variable is loaded:
```bash
# In Expo, the variable should be available at runtime
# Check console logs when app starts
```

Check backend logs:
- Look for OAuth callback requests
- Check for any errors in token exchange

Check ngrok dashboard:
- Visit: https://dashboard.ngrok.com/
- See incoming requests to your tunnel

