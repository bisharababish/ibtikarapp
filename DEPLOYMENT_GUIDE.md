# Deployment Guide for App Store & Play Store

## Prerequisites

1. **Expo Account**
   - Sign up at https://expo.dev
   - Install EAS CLI: `npm install -g eas-cli`
   - Login: `eas login`

2. **App Store Connect (iOS)**
   - Apple Developer account ($99/year)
   - Create app in App Store Connect
   - Note your Bundle ID: `com.ibtikar.app`

3. **Google Play Console (Android)**
   - Google Play Developer account ($25 one-time)
   - Create app in Play Console
   - Note your Package name: `com.ibtikar.app`

## Step 1: Configure EAS

```bash
# Initialize EAS (if not done)
eas build:configure

# This creates eas.json - update it with your project ID
```

Update `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 2: Update app.json

✅ Already updated with:
- Bundle identifier
- Package name
- Privacy settings
- Permissions

**Still needed:**
- Add your EAS project ID in `app.json` → `extra.eas.projectId`
- Get it from: https://expo.dev/accounts/[your-account]/projects/ibtikar

## Step 3: Build for Production

### iOS Build
```bash
# Build for iOS
eas build --platform ios --profile production

# This will:
# - Create an .ipa file
# - Upload to App Store Connect (if configured)
# - Or download for manual upload
```

### Android Build
```bash
# Build for Android
eas build --platform android --profile production

# This will:
# - Create an .aab file (recommended for Play Store)
# - Upload to Play Console (if configured)
```

## Step 4: Prepare Store Listings

### App Store (iOS) Requirements

1. **App Information**
   - Name: Ibtikar
   - Subtitle: AI-Powered Social Safety
   - Category: Social Networking or Utilities
   - Privacy Policy URL: (required - add yours)

2. **Screenshots** (Required for all device sizes)
   - iPhone 6.7" (iPhone 14 Pro Max)
   - iPhone 6.5" (iPhone 11 Pro Max)
   - iPhone 5.5" (iPhone 8 Plus)
   - iPad Pro 12.9"
   - iPad Pro 11"

3. **App Preview Video** (Optional but recommended)
   - 15-30 seconds
   - Show key features

4. **Description**
   ```
   Ibtikar is an AI-powered social media safety tool that helps users 
   identify and protect against harmful content on Twitter/X.
   
   Features:
   • Real-time content analysis using advanced AI
   • Harmful content detection and alerts
   • Privacy-focused design
   • Easy Twitter/X integration
   • Comprehensive safety resources
   
   Empowering users with digital safety and social entrepreneurship.
   ```

5. **Keywords** (100 characters max)
   ```
   social media safety, AI content moderation, Twitter safety, 
   harmful content detection, digital safety, social entrepreneurship
   ```

6. **Support URL**
   - Your website or support email

### Play Store (Android) Requirements

1. **App Details**
   - Short description (80 chars): "AI-powered social media safety tool for detecting harmful content"
   - Full description (4000 chars): Similar to iOS description

2. **Graphics**
   - Feature graphic: 1024x500 (required)
   - Screenshots: Phone (required), Tablet (optional), TV (optional)
   - App icon: 512x512

3. **Privacy Policy**
   - URL required
   - Must be accessible

4. **Content Rating**
   - Complete questionnaire in Play Console
   - Usually rated "Everyone" or "Teen"

## Step 5: Submit to Stores

### iOS - App Store Connect

1. **Upload Build**
   ```bash
   # If using EAS submit
   eas submit --platform ios
   
   # Or manually:
   # - Download .ipa from EAS
   # - Upload via Transporter app or Xcode
   ```

2. **Complete App Information**
   - Fill all required fields
   - Upload screenshots
   - Add description
   - Set pricing (Free or Paid)

3. **Submit for Review**
   - Review all information
   - Submit for review
   - Wait 1-3 days for approval

### Android - Google Play Console

1. **Upload Build**
   ```bash
   # If using EAS submit
   eas submit --platform android
   
   # Or manually:
   # - Download .aab from EAS
   # - Upload to Play Console → Internal Testing
   ```

2. **Complete Store Listing**
   - Fill all required fields
   - Upload graphics
   - Add description
   - Complete content rating

3. **Release**
   - Start with Internal Testing
   - Test thoroughly
   - Move to Closed Testing
   - Finally, Production release

## Step 6: Post-Submission

### Monitor
- Check App Store Connect / Play Console daily
- Respond to review feedback quickly
- Monitor crash reports

### Common Issues

**iOS Rejection Reasons:**
- Missing privacy policy
- Incomplete app information
- App crashes during review
- Missing required permissions explanation

**Android Rejection Reasons:**
- Missing privacy policy
- Incomplete content rating
- App crashes
- Missing required permissions

## Environment Variables

Make sure these are set in your backend (Render):
- `X_CLIENT_ID`
- `X_CLIENT_SECRET`
- `IBTIKAR_URL`
- `HF_TOKEN` (optional)
- `SECRET_KEY`
- `FERNET_KEY`
- Database URL

## Testing Checklist

Before submitting:
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test OAuth login flow
- [ ] Test AI analysis feature
- [ ] Test error handling
- [ ] Test offline scenarios
- [ ] Verify all links work
- [ ] Check all screens render correctly
- [ ] Test on different screen sizes
- [ ] Verify privacy policy is accessible

## Privacy Policy Requirements

Your privacy policy must include:
1. What data you collect
2. How you use the data
3. Third-party services (Twitter/X API, Hugging Face)
4. Data storage and security
5. User rights
6. Contact information

## Support

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- App Store Connect: https://appstoreconnect.apple.com
- Play Console: https://play.google.com/console

## Quick Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Submit to stores
eas submit --platform ios
eas submit --platform android

# Update app version
# Edit app.json version, then rebuild
```

Good luck with your deployment! 🚀


