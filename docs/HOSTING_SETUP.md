# Quick Hosting Setup for Play Console

## 🚀 Fastest Option: GitHub Pages (5 minutes)

### Step 1: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `ibtikar-docs` (or any name)
3. Make it **Public**
4. Click "Create repository"

### Step 2: Upload Files
1. Click "uploading an existing file"
2. Drag and drop:
   - `privacy-policy.html`
   - `delete-account.html`
3. Commit message: "Add Play Console documentation"
4. Click "Commit changes"

### Step 3: Enable GitHub Pages
1. Go to repository **Settings**
2. Scroll to **Pages** (left sidebar)
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**

### Step 4: Get Your URLs
Wait 1-2 minutes, then your URLs will be:
- **Privacy Policy**: `https://YOUR_USERNAME.github.io/ibtikar-docs/privacy-policy.html`
- **Delete Account**: `https://YOUR_USERNAME.github.io/ibtikar-docs/delete-account.html`

Replace `YOUR_USERNAME` with your GitHub username.

---

## Alternative: Render Static Site

1. Go to https://render.com
2. Click **New +** → **Static Site**
3. Connect your GitHub repository (or upload files)
4. Set:
   - **Name**: `ibtikar-docs`
   - **Build Command**: (leave empty)
   - **Publish Directory**: `docs`
5. Deploy
6. Your URLs will be: `https://ibtikar-docs.onrender.com/privacy-policy.html`

---

## Test Your URLs

Before using in Play Console, test that:
- ✅ URLs load in browser
- ✅ No login required
- ✅ Pages display correctly
- ✅ Links between pages work

---

## For Play Console

Use these exact URLs when filling out:
- **Privacy Policy URL**: Your hosted privacy-policy.html URL
- **Delete Account URL**: Your hosted delete-account.html URL

