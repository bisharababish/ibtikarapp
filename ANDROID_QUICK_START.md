# Android Deployment - Quick Start Checklist

## 🚀 After You Pay the $25

### Immediate Next Steps:

1. **Set Up Expo Account** (5 minutes)
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Link Your Project** (2 minutes)
   ```bash
   eas build:configure
   ```
   - Copy the Project ID it gives you
   - Update `app.json` → `extra.eas.projectId` with your Project ID

3. **Create App in Play Console** (5 minutes)
   - Go to https://play.google.com/console
   - Click "Create app"
   - Name: **Ibtikar**
   - Package: `com.ibtikar.app` (already configured)

4. **Build Your App** (15-20 minutes)
   ```bash
   eas build --platform android --profile production
   ```
   - Wait for build to finish
   - You'll get a download link

5. **Prepare Store Listing** (30 minutes)
   - Add app description
   - Upload 2+ screenshots
   - Upload feature graphic (1024x500)
   - Add privacy policy URL
   - Complete content rating

6. **Upload & Submit** (10 minutes)
   - Download AAB from EAS
   - Upload to Play Console → Internal testing
   - Submit for review

---

## 📝 What You Need Before Starting

- [ ] Google Play Developer account (you have this)
- [ ] $25 payment completed (you're doing this next)
- [ ] Privacy policy URL (create one - can use GitHub Pages)
- [ ] 2+ app screenshots
- [ ] Feature graphic (1024x500px)

---

## ⚡ Quick Commands

```bash
# Setup
npm install -g eas-cli
eas login
eas build:configure

# Build
eas build --platform android --profile production

# Submit (if you set up service account)
eas submit --platform android --profile production
```

---

## 📖 Full Guide

See `ANDROID_DEPLOYMENT.md` for complete step-by-step instructions.

---

## ⚠️ Important Notes

1. **Privacy Policy is REQUIRED** - Google will reject without it
2. **Test on a real Android device** before submitting
3. **Start with Internal Testing** - don't go straight to Production
4. **Version numbers** - increment `versionCode` in `app.json` for each update

---

**Your Package Name:** `com.ibtikar.app`  
**Your App Name:** Ibtikar  
**Current Version:** 1.0.0 (versionCode: 1)

Good luck! 🎉



