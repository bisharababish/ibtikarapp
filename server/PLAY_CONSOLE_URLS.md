# Play Console URLs

Your documentation pages are now hosted on your Render backend!

## 📋 URLs for Google Play Console

Use these exact URLs when filling out the Play Console forms:

### Privacy Policy URL:
```
https://ibtikar-backend.onrender.com/privacy-policy.html
```

### Delete Account URL:
```
https://ibtikar-backend.onrender.com/delete-account.html
```

---

## ✅ How to Test

1. **Before deploying to Render**, test locally:
   - Start your backend: `uvicorn backend.api.main:app --reload --port 8000`
   - Visit: `http://localhost:8000/privacy-policy.html`
   - Visit: `http://localhost:8000/delete-account.html`

2. **After deploying to Render**:
   - Visit: `https://ibtikar-backend.onrender.com/privacy-policy.html`
   - Visit: `https://ibtikar-backend.onrender.com/delete-account.html`
   - Make sure both pages load correctly

---

## 🚀 Next Steps

1. **Deploy to Render** (if not already deployed):
   - Push your changes to GitHub
   - Render will auto-deploy

2. **Test the URLs** in your browser

3. **Use in Play Console**:
   - Copy the URLs above
   - Paste into Play Console forms
   - Submit!

---

## 📝 Notes

- Files are located in: `server/static/`
- Routes are defined in: `server/backend/api/main.py`
- Both direct routes (`/privacy-policy.html`) and static mount (`/static/`) work
- Use the direct routes (without `/static/`) for Play Console

