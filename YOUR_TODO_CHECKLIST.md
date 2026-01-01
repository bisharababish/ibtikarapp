# Your To-Do Checklist - Account Deletion

## ✅ What I've Already Done (Complete)

1. ✅ Created delete account web page (`/delete-account` endpoint)
2. ✅ Created delete account API endpoint (`DELETE /v1/account/delete`)
3. ✅ Added all Google Play Store required information to the page
4. ✅ Created documentation files
5. ✅ Updated deployment guide

**Everything is coded and ready!**

---

## 📋 What YOU Need to Do

### 1. Fix the URL Typo in Google Play Console ⚠️ URGENT

**In Google Play Console → Data Safety → Delete Account URL:**

**Currently entered (WRONG):**
```
https://ibtikar-backend.onrender.com/delete-accour
```

**Should be (CORRECT):**
```
https://ibtikar-backend.onrender.com/delete-account
```

**Action:** Change "delete-accour" → "delete-account"

---

### 2. Deploy/Restart Your Backend 🚀

The new endpoints need to be deployed to be accessible.

**If using Render:**
- Push your code to GitHub (if not already)
- Render should auto-deploy, OR
- Manually trigger a deploy in Render dashboard

**If deploying manually:**
```bash
# Make sure your backend server restarts with the new code
# The new /delete-account endpoint will be available
```

**Verify it works:**
- Visit: `https://ibtikar-backend.onrender.com/delete-account`
- You should see the delete account page with Ibtikar branding

---

### 3. Set Up Email Address (if not done) 📧

**Email:** `privacy@ibtikar.app`

**You need to:**
- [ ] Set up email forwarding/routing to your email
- [ ] Monitor this email for account deletion requests
- [ ] Respond within 48 hours as stated on the page

**Note:** If you don't have this email set up yet, users can still use the delete account API endpoint or you can use a different email (just update it in the code).

---

### 4. Test the Delete Account Page ✅

**After deploying:**

1. Open: `https://ibtikar-backend.onrender.com/delete-account`
2. Verify:
   - ✅ Page loads correctly
   - ✅ Shows "Ibtikar - AI-Powered Social Safety"
   - ✅ Shows contact email
   - ✅ Shows data deletion information
   - ✅ Looks good on mobile (responsive)

---

### 5. Optional: Test Account Deletion (if needed) 🧪

**Only if you want to test the deletion works:**

1. Create a test account (user_id = 999 or something)
2. Test deletion via API:
   ```
   DELETE https://ibtikar-backend.onrender.com/v1/account/delete?user_id=999&confirm=true
   ```
3. Verify account and data are deleted

**⚠️ Warning:** Only test with test accounts, not real user data!

---

## ✅ Quick Summary

**Must Do:**
1. ✅ Fix URL typo in Google Play Console (delete-accour → delete-account)
2. ✅ Deploy/restart backend (if not auto-deployed)

**Should Do:**
3. ✅ Set up privacy@ibtikar.app email
4. ✅ Test the delete-account page works

**That's it!** Everything else is already done. 🎉

---

## 🎯 Priority Order

1. **HIGHEST:** Fix the URL typo in Google Play Console
2. **HIGH:** Deploy backend (so URL actually works)
3. **MEDIUM:** Set up email monitoring
4. **LOW:** Test the functionality

---

## ❓ Questions?

- **URL not working?** → Check backend is deployed
- **Email not set up?** → Users can still contact you via the page
- **Need to change email?** → Edit `server/backend/api/main.py` line ~825, change `privacy@ibtikar.app` to your email

