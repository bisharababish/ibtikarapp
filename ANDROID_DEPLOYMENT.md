# Android Deployment Guide - Step by Step

## 🎯 Quick Overview

You're deploying **Ibtikar** to Google Play Store. This guide walks you through everything after you pay the $25 Google Play Developer registration fee.

---

## ✅ Prerequisites Checklist

Before you start, make sure you have:

- [x] **Google Play Developer Account** - Created (you mentioned you made an account)
- [ ] **Paid the $25 registration fee** - Next step (you mentioned you're going to pay)
- [ ] **Expo Account** - Sign up at https://expo.dev (free)
- [ ] **EAS CLI installed** - We'll do this below
- [ ] **Privacy Policy URL** - Required by Google Play

---

## Step 1: Set Up Expo & EAS

### 1.1 Install EAS CLI
```bash
npm install -g eas-cli
```

### 1.2 Login to Expo
```bash
eas login
```
This will open your browser to sign in. If you don't have an account, create one at https://expo.dev

### 1.3 Link Your Project
```bash
eas build:configure
```
This will:
- Create/update `eas.json` (already done, but this links it to your Expo account)
- Ask you to create a project on Expo if you haven't already
- Give you a **Project ID** - you'll need this!

### 1.4 Get Your Project ID
After running `eas build:configure`, you'll get a Project ID. It looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Update `app.json`:**
```json
"extra": {
  "eas": {
    "projectId": "YOUR-PROJECT-ID-HERE"
  }
}
```

Replace `"your-project-id-here"` with your actual Project ID.

---

## Step 2: Set Up Google Play Console

### 2.1 Complete Payment
1. Go to https://play.google.com/console
2. Complete the $25 payment
3. Wait for account activation (usually instant, but can take up to 48 hours)

### 2.2 Create Your App
1. In Play Console, click **"Create app"**
2. Fill in:
   - **App name:** Ibtikar
   - **Default language:** English (or your preferred language)
   - **App or game:** App
   - **Free or paid:** Free
   - **Declarations:** Check all that apply (usually just "Contains ads" if applicable)
3. Click **"Create app"**

### 2.3 Note Your Package Name
Your package name is: `com.ibtikar.app` (already configured in `app.json`)

---

## Step 3: Set Up Google Play API Access (For Automated Submission)

This step allows EAS to automatically upload your app to Play Store. You can skip this and upload manually if you prefer.

### 3.1 Create Service Account
1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable **Google Play Android Developer API**
4. Go to **IAM & Admin** → **Service Accounts**
5. Click **Create Service Account**
6. Name it: `play-store-uploader`
7. Grant role: **Editor** (or **Owner**)
8. Click **Done**

### 3.2 Create Key
1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON**
5. Download the JSON file
6. **Save it as:** `google-service-account.json` in your project root
7. ⚠️ **Add to `.gitignore`** - Never commit this file!

### 3.3 Link to Play Console
1. Go to Play Console → **Setup** → **API access**
2. Find your service account (email looks like: `play-store-uploader@your-project.iam.gserviceaccount.com`)
3. Click **Grant access**
4. Select role: **Admin** (or **Release manager**)
5. Click **Invite user**

---

## Step 4: Build Your Android App

### 4.1 Update Version (if needed)
In `app.json`, make sure your version is correct:
```json
"version": "1.0.0",
"android": {
  "versionCode": 1
}
```

**Note:** Each time you update, increment:
- `version` (e.g., "1.0.1", "1.1.0")
- `versionCode` (must be higher: 2, 3, 4...)

### 4.2 Build Production APK/AAB
```bash
eas build --platform android --profile production
```

This will:
- Build your app in the cloud (takes 10-20 minutes)
- Create an **AAB file** (Android App Bundle) - required for Play Store
- Show you a URL to track progress

### 4.3 Wait for Build
- You'll get a build URL like: `https://expo.dev/accounts/your-account/builds/build-id`
- Wait for status to show **"Finished"**
- You can download the AAB file from there

---

## Step 5: Prepare Store Listing

While your app is building, prepare your store listing in Play Console.

### 5.1 App Details
Go to **Play Console** → **Your App** → **Store presence** → **Main store listing**

**Required Fields:**
- **App name:** Ibtikar
- **Short description (80 chars):** 
  ```
  AI-powered social media safety tool for detecting harmful content
  ```
- **Full description (4000 chars):**
  ```
  Ibtikar is an AI-powered social media safety tool that helps users identify and protect against harmful content on Twitter/X.

  Features:
  • Real-time content analysis using advanced AI
  • Harmful content detection and alerts
  • Privacy-focused design
  • Easy Twitter/X integration
  • Comprehensive safety resources

  Empowering users with digital safety and social entrepreneurship.

  Ibtikar uses cutting-edge AI technology to analyze social media content and help users stay safe online. Whether you're browsing your timeline or checking specific posts, Ibtikar provides instant feedback on potentially harmful content.

  Privacy and Security:
  - We respect your privacy
  - No tracking across apps or websites
  - Secure OAuth authentication
  - Your data stays safe

  Perfect for:
  - Parents monitoring their children's social media
  - Educators teaching digital safety
  - Anyone concerned about online safety
  - Social media users who want peace of mind
  ```

### 5.2 Graphics Required

**Feature Graphic (Required):**
- Size: 1024 x 500 pixels
- Format: PNG or JPG
- No text (or minimal text)
- Shows your app's main feature

**Screenshots (Required):**
- At least 2 screenshots
- Phone screenshots: Minimum 320px, maximum 3840px (height)
- Recommended: 1080 x 1920 (portrait)
- Format: PNG or JPG (24-bit)

**App Icon:**
- Size: 512 x 512 pixels
- Format: PNG (32-bit with alpha)
- Already created: `./assets/images/icon.png` (check if it's 512x512)

### 5.3 Privacy Policy (REQUIRED)
Google Play **requires** a privacy policy URL.

**Options:**
1. Host on GitHub Pages (free)
2. Host on your website
3. Use a privacy policy generator

**Must include:**
- What data you collect
- How you use it
- Third-party services (Twitter/X API, Hugging Face)
- Data storage
- User rights
- Contact information

**Add URL in Play Console:**
- Go to **Store presence** → **App content** → **Privacy Policy**
- Enter your privacy policy URL

### 5.4 Content Rating
1. Go to **Store presence** → **App content** → **Content rating**
2. Click **Start questionnaire**
3. Answer questions about your app
4. Usually results in **"Everyone"** or **"Teen"** rating
5. Submit and wait for rating (usually instant)

---

## Step 6: Upload Your App

### Option A: Automated (EAS Submit) - Recommended

If you set up the service account (Step 3):

```bash
eas submit --platform android --profile production
```

This will:
- Use your `google-service-account.json`
- Upload the latest build automatically
- Place it in **Internal testing** track

### Option B: Manual Upload

1. Download your AAB file from EAS build page
2. Go to Play Console → **Your App** → **Production** (or **Testing** → **Internal testing**)
3. Click **Create new release**
4. Upload your AAB file
5. Add **Release name:** `1.0.0` (or your version)
6. Add **Release notes:**
   ```
   Initial release of Ibtikar
   - AI-powered content analysis
   - Twitter/X integration
   - Real-time safety alerts
   ```
7. Click **Save**
8. Click **Review release**

---

## Step 7: Complete Store Listing & Submit

### 7.1 Final Checklist
Before submitting, make sure you've completed:

- [ ] App details (name, description)
- [ ] At least 2 screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Privacy policy URL added
- [ ] Content rating completed
- [ ] App bundle uploaded
- [ ] Release notes added

### 7.2 Start with Internal Testing
**Recommended approach:**
1. Upload to **Internal testing** first
2. Test the app yourself
3. Add testers (optional)
4. Test for a few days
5. Then move to **Closed testing** or **Open testing**

### 7.3 Submit for Review
1. Go to **Testing** → **Internal testing** (or your chosen track)
2. Click **Review release**
3. Review all information
4. Click **Start rollout to Internal testing**

**For Production:**
1. After testing, go to **Production**
2. Create release
3. Upload AAB
4. Click **Review release**
5. Click **Start rollout to Production**

---

## Step 8: Wait for Review

- **First-time apps:** Usually 1-3 days
- **Updates:** Usually 1-7 days
- Google will email you when approved or if there are issues

---

## 🚨 Common Issues & Solutions

### Issue: "Missing Privacy Policy"
**Solution:** Add privacy policy URL in Play Console → App content → Privacy Policy

### Issue: "App crashes on launch"
**Solution:** 
- Test on a physical Android device first
- Check EAS build logs
- Make sure all environment variables are set

### Issue: "Missing required graphics"
**Solution:** Upload at least 2 screenshots and feature graphic

### Issue: "Package name already exists"
**Solution:** Your package name `com.ibtikar.app` must be unique. If taken, change it in `app.json`:
```json
"android": {
  "package": "com.yourname.ibtikar"
}
```

### Issue: "Service account key not found"
**Solution:** Make sure `google-service-account.json` is in your project root and in `.gitignore`

---

## 📋 Quick Command Reference

```bash
# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build Android production
eas build --platform android --profile production

# Check build status
eas build:list

# Submit to Play Store (automated)
eas submit --platform android --profile production

# View build logs
eas build:view [build-id]
```

---

## 🎉 After Approval

Once your app is approved:

1. **Monitor:** Check Play Console for crashes and reviews
2. **Update:** When you need to update, increment version and rebuild
3. **Promote:** Share your app link: `https://play.google.com/store/apps/details?id=com.ibtikar.app`

---

## 📞 Need Help?

- **Expo Docs:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Play Console Help:** https://support.google.com/googleplay/android-developer

---

## ✅ Final Checklist Before Submitting

- [ ] EAS project ID added to `app.json`
- [ ] Google Play Developer account paid ($25)
- [ ] App created in Play Console
- [ ] Privacy policy URL ready
- [ ] Screenshots prepared (at least 2)
- [ ] Feature graphic prepared (1024x500)
- [ ] Content rating completed
- [ ] App built successfully (`eas build`)
- [ ] Tested on physical Android device
- [ ] All store listing fields filled
- [ ] Ready to submit!

Good luck with your deployment! 🚀



