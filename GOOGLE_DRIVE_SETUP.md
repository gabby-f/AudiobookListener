# Google Drive OAuth Setup Guide

This guide will walk you through setting up Google Drive OAuth for your Audiobook Listener app.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name your project (e.g., "Audiobook Listener")
4. Click **Create**
5. Wait for the project to be created (takes ~30 seconds)

## Step 2: Enable the Google Drive API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google Drive API"
3. Click on **Google Drive API**
4. Click **Enable**
5. Wait for it to enable (~10 seconds)

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have Google Workspace)
3. Click **Create**

### Fill in the consent screen:

- **App name**: Audiobook Listener
- **User support email**: Your email address
- **App logo**: (Optional)
- **Application home page**: `https://gabby-f.github.io/AudiobookListener`
- **Authorized domains**: `gabby-f.github.io`
- **Developer contact**: Your email address

4. Click **Save and Continue**
5. **Scopes**: Click **Add or Remove Scopes**
   - Search for "drive.readonly"
   - Check: `../auth/drive.readonly` (View and download all your Google Drive files)
   - Click **Update**
   - Click **Save and Continue**

6. **Test users** (for testing mode):
   - Click **Add Users**
   - Add your Gmail address (and any other testers)
   - Click **Save and Continue**

7. Click **Back to Dashboard**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: Web application
4. Name: "Audiobook Listener Web Client"

### Add Authorized JavaScript origins:

- `https://gabby-f.github.io`
- `http://localhost:3000` (for local development)

### Add Authorized redirect URIs:

- `https://gabby-f.github.io/AudiobookListener`
- `http://localhost:3000` (for local development)

5. Click **Create**

## Step 5: Get Your Credentials

After creating, you'll see a dialog with:
- **Client ID**: Something like `123456789-abcdefg.apps.googleusercontent.com`

1097872181876-gn1ikcrkrnvtmnjor8l30v2q1kbbeo6g.apps.googleusercontent.com

- **Client Secret**: You don't need this for client-side OAuth (we're using PKCE)

**Copy the Client ID** - you'll need it for the next step.

## Step 6: Create API Key (for Google Drive API)

1. Still in **Credentials**, click **Create Credentials** → **API key**
2. **Copy the API key** that appears
3. Click **Restrict Key** (recommended)
4. Under **API restrictions**, select **Restrict key**
5. Select **Google Drive API**
6. Click **Save**

## Step 7: Configure Environment Variables

Create a `.env` file in your project root:

```env
REACT_APP_GOOGLE_CLIENT_ID=1097872181876-gn1ikcrkrnvtmnjor8l30v2q1kbbeo6g.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=AIzaSyCUxEH7Ttc2uXuG9zZJeq7qEEcu7x6PqPk
```

**Important:** Never commit this `.env` file to GitHub! It's already in `.gitignore`.

## Step 8: Update .env for Production (GitHub Pages)

For production deployment, you have two options:

### Option A: Hardcode values (simple but less secure)

Edit `src/utils/googleDriveClient.js` and replace:

```javascript
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1097872181876-gn1ikcrkrnvtmnjor8l30v2q1kbbeo6g.apps.googleusercontent.com';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'AIzaSyCUxEH7Ttc2uXuG9zZJeq7qEEcu7x6PqPk';
```

### Option B: Use GitHub Secrets (more secure)

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add two secrets:
   - `REACT_APP_GOOGLE_CLIENT_ID`
   - `REACT_APP_GOOGLE_API_KEY`
3. Update your build workflow to use these secrets

**For now, use Option A** since you're deploying manually.

## Step 9: Test Locally

1. Make sure `.env` file has your credentials
2. Run `npm start`
3. Click "Connect Google Drive"
4. Sign in with your Google account
5. Grant permissions
6. You should see your Drive files!

## Step 10: Deploy to GitHub Pages

1. Update the hardcoded values in `googleDriveClient.js` (Option A above)
2. Build: `npm run build`
3. Commit and deploy:
   ```bash
   git add -A
   git commit -m "Add Google Drive OAuth integration"
   git push origin main
   git add build -f
   git commit -m "Deploy with Google Drive support"
   git subtree push --prefix build origin gh-pages
   ```

## Troubleshooting

### "Access blocked: This app's request is invalid"

- Make sure you added your GitHub Pages URL to **Authorized JavaScript origins**
- Make sure the URL exactly matches (including https://)

### "Unauthorized"

- Check that Drive API is enabled
- Verify your API key is correct
- Make sure API key restrictions allow Drive API

### "redirect_uri_mismatch"

- Add your exact URL to **Authorized redirect URIs**
- For GitHub Pages: `https://gabby-f.github.io/AudiobookListener`

### "This app isn't verified"

- This is normal for testing mode
- Click "Advanced" → "Go to Audiobook Listener (unsafe)"
- To remove this warning, submit your app for verification (optional, takes 1-2 weeks)

### Files not appearing

- Make sure you have audio files in your Drive (.m4b, .m4a, .mp3)
- Check browser console for errors
- Verify you granted the correct permissions

## Security Notes

### For Personal Use (Current Setup):

✅ **Client ID is public** - This is fine, it identifies your app  
✅ **API Key is public** - Restricted to Drive API only  
⚠️ **Test mode** - Only you and added test users can sign in  

### To Make It Public:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Submit for verification (Google reviews your app)
4. Takes 1-2 weeks
5. Allows anyone with a Google account to use it

For now, staying in **test mode** is recommended!

## What Users Will See

When users click "Connect Google Drive":

1. Popup asks them to sign in with Google
2. Shows: "Audiobook Listener wants to: View and download all your Google Drive files"
3. User clicks "Allow"
4. They can browse their Drive files
5. Select an audiobook to download and play

## Cost

Everything described here is **100% FREE**:
- ✅ Google Cloud project: Free
- ✅ Drive API calls: Free (1 billion/day limit)
- ✅ OAuth: Free
- ✅ API keys: Free

You only pay if you exceed 1 billion API calls per day (won't happen!).

## Next Steps

After setup:
1. Test with your account
2. Add friends/family as test users
3. (Optional) Submit for verification to make it public

Enjoy seamless Google Drive integration! 🎧
