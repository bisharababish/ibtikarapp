# Delete Account URL for Google Play Store

## 📋 Account Deletion URL

**URL**: `https://ibtikar-backend.onrender.com/delete-account`

This URL must be added to your Google Play Store listing under:
- **Google Play Console** → **App content** → **Data safety** → **Delete account URL**

## ✅ What's Included

The delete account page (`/delete-account`) includes all Google Play Store requirements:

1. **App/Developer Name**: Prominently displays "Ibtikar - AI-Powered Social Safety"

2. **Steps to Request Deletion**: Clear, numbered steps showing users how to:
   - Open the app and log in
   - Navigate to settings or contact directly
   - Submit deletion request
   - Confirmation timeline (48 hours)
   - Deletion timeline (30 days)

3. **Contact Information**: 
   - Email: `privacy@ibtikar.app`
   - Prominently displayed in a highlighted section

4. **Data Deletion Information**:
   - ✅ **What will be deleted**:
     - User Account Information
     - OAuth Tokens (encrypted Twitter/X tokens)
     - Analysis Predictions
     - Post Data
     - Author Analytics
     - Account Settings
   
   - ⚠️ **What cannot be deleted**:
     - Anonymized Analytics (no personal identifiers)
     - Legal Records (required by law)

5. **Retention Period**: 
   - Requests processed within **30 days** (as required by Google Play Store)
   - Clear timeline displayed

## 🔧 Backend API Endpoint

If you need to programmatically delete accounts, there's also an API endpoint:

**Endpoint**: `DELETE /v1/account/delete`

**Parameters**:
- `user_id` (required): User ID to delete
- `confirm` (required): Must be `true` to proceed

**Example**:
```
DELETE https://ibtikar-backend.onrender.com/v1/account/delete?user_id=1&confirm=true
```

**Note**: This endpoint should only be used by administrators or through automated systems. Regular users should use the web page or contact email.

## 📧 Email Contact

Users can also request account deletion via email:
- **Email**: `privacy@ibtikar.app`
- **Subject**: "Account Deletion Request"
- Users should include their user ID or Twitter/X handle

## 🔒 Security

- Account deletion requires explicit confirmation
- All associated data is deleted (cascade delete):
  - User account
  - OAuth tokens
  - All predictions/analysis data
- Database relationships ensure complete deletion

## 📝 Notes

- The delete account page is mobile-responsive
- Uses Ibtikar brand colors (Yellow, Teal, Black)
- Follows Google Play Store compliance requirements
- No authentication required to view the page (users need to authenticate via email to request deletion)

