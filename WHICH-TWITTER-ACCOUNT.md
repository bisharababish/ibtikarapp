# Which Twitter Account to Use for OAuth?

## Quick Answer

**You need to use the Twitter account that created your Developer App.**

## Why?

If your Twitter Developer App is in **"Development" mode** (which is the default for new apps), **only the Twitter account that created the app can authorize it**.

## How to Check Your App Mode

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Click on your app
3. Look at the top of the page - it will say either:
   - **"Development"** - Only creator account works
   - **"Production"** - Any account works

## Solutions

### Option 1: Use the Creator Account (Easiest)
- Sign in to Twitter with the **exact same account** you used to create the Developer App
- Then try the OAuth login again
- This should work immediately

### Option 2: Upgrade to Production Mode
- Go to your app settings
- Request to upgrade to "Production" mode
- This requires Twitter's approval (can take time)
- Once approved, any Twitter account can authorize your app

### Option 3: Add Test Users (Development Mode)
- In Development mode, you can add additional test users
- Go to app settings → User authentication settings
- Add test user Twitter handles
- Those users can then authorize the app

## Quick Test

Try this:
1. Make sure you're logged into Twitter with the account that created the Developer App
2. Clear your browser cache/cookies for Twitter
3. Try the OAuth flow again from your Expo app

## Still Not Working?

If you're using the creator account and it still doesn't work, check:
- Callback URL matches exactly
- OAuth 2.0 is enabled
- App permissions are set correctly

