# Ibtikar Documentation Pages

This folder contains the required documentation pages for Google Play Console:

- `privacy-policy.html` - Privacy Policy (required by Google Play)
- `delete-account.html` - Account Deletion Instructions (required by Google Play)

## How to Host These Pages

### Option 1: GitHub Pages (Free & Easy)

1. Create a GitHub repository (or use existing one)
2. Upload these files to a `docs` folder in your repo
3. Go to repository Settings → Pages
4. Select source: "Deploy from a branch" → "main" → "/docs"
5. Your URLs will be:
   - Privacy Policy: `https://yourusername.github.io/repo-name/privacy-policy.html`
   - Delete Account: `https://yourusername.github.io/repo-name/delete-account.html`

### Option 2: Render Static Site (Free)

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set build command: (leave empty)
4. Set publish directory: `docs`
5. Your URLs will be:
   - Privacy Policy: `https://your-site.onrender.com/privacy-policy.html`
   - Delete Account: `https://your-site.onrender.com/delete-account.html`

### Option 3: Your Own Domain

Upload these files to your web server and access via your domain.

## For Google Play Console

Use these URLs when filling out:
- **Privacy Policy URL**: Your hosted privacy-policy.html URL
- **Delete Account URL**: Your hosted delete-account.html URL

## Notes

- Make sure the URLs are publicly accessible (no login required)
- Update the contact email in both files if needed
- Test the links before submitting to Google Play

