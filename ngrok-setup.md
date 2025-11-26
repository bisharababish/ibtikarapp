# Ngrok Setup for Expo OAuth

This guide will help you set up ngrok to expose your local backend to the internet so OAuth works on your phone.

## Step 1: Install Ngrok

1. Download ngrok from https://ngrok.com/download
2. Extract it to a folder (e.g., `C:\ngrok`)
3. Sign up for a free ngrok account at https://dashboard.ngrok.com/signup
4. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken
5. Run: `ngrok config add-authtoken YOUR_AUTHTOKEN`

## Step 2: Start Your Backend

Make sure your backend is running on port 8000:
```bash
cd C:\Users\Leo\Desktop\ibtikar-backend-main\backend
# Start your backend server (adjust command based on your setup)
```

## Step 3: Start Ngrok Tunnel

Open a new terminal and run:
```bash
ngrok http 8000
```

This will give you a URL like: `https://abc123.ngrok-free.app`

**IMPORTANT:** Copy this URL - you'll need it in the next steps!

## Step 4: Update Backend .env File

1. Navigate to `C:\Users\Leo\Desktop\ibtikar-backend-main\backend`
2. Create or edit `.env` file
3. Update `X_REDIRECT_URI` to use your ngrok URL:
```
X_REDIRECT_URI=https://abc123.ngrok-free.app/v1/oauth/x/callback
```

## Step 5: Update Twitter OAuth App Settings

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Open your app settings
3. Add your ngrok callback URL to "Callback URI / Redirect URL":
   ```
   https://abc123.ngrok-free.app/v1/oauth/x/callback
   ```
4. Save the changes

## Step 6: Update Expo App Config

1. Create a `.env` file in `C:\Users\Leo\Desktop\ibtikarapp\ibtikar\` (or root of Expo app)
2. Add:
```
EXPO_PUBLIC_BACKEND_URL=https://abc123.ngrok-free.app
```

3. Restart your Expo app:
```bash
cd C:\Users\Leo\Desktop\ibtikarapp\ibtikar
npx expo start --clear
```

**Note:** The app is already configured to read `EXPO_PUBLIC_BACKEND_URL` from environment variables. If you don't set it, it defaults to `http://127.0.0.1:8000`.

## Step 7: Test the OAuth Flow

1. Make sure your backend is running on port 8000
2. Make sure ngrok is running and exposing port 8000
3. Start your Expo app
4. Click "Login with Twitter" in the app
5. Complete the OAuth flow in the browser
6. You should be redirected back to the app automatically

## Important Notes

- **Ngrok URLs change each time** (unless you have a paid plan with a static domain)
- You'll need to update the URLs in `.env` files and Twitter settings each time you restart ngrok
- For development, consider using ngrok's free static domain feature or a paid plan

## Quick Start Script

You can use the `start-ngrok.ps1` script (Windows PowerShell) to automate starting ngrok and updating URLs.

