# Password Setup for Audiobook Listener

## Current Setup
- **Default password**: `audiobook`
- Stored as SHA-256 hash in the code
- Session-based (stays logged in until browser closes)

## How to Change the Password

### Option 1: Using Browser Console (Easiest)
1. Open your deployed app
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Paste this code (replace "YourNewPassword" with your actual password):

```javascript
(async function() {
    const password = "YourNewPassword";
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('Your password hash:');
    console.log(hash);
})();
```

5. Copy the hash that appears
6. Add to your `.env` file:
   ```
   REACT_APP_PASSWORD_HASH=your_copied_hash_here
   ```
7. Rebuild and redeploy

### Option 2: Using Node.js
Run this in your project terminal:

```powershell
node -e "const crypto = require('crypto'); const password = 'YourNewPassword'; const hash = crypto.createHash('sha256').update(password).digest('hex'); console.log('Password hash:', hash);"
```

Copy the hash and add to `.env` as above.

### Option 3: Keep Default
If you're happy with the default password "audiobook", no action needed!

## Security Notes

- **Password is hashed** - Even in the built code, only the hash is visible
- **Session-based** - Login lasts until browser closes (or you click logout)
- **Frontend only** - This is basic protection, not bank-level security
- **Good enough for personal use** - Keeps casual snoopers out

## How Login Works

1. User enters password
2. Password is hashed with SHA-256
3. Hash is compared to stored hash
4. If match, `authenticated` flag is set in sessionStorage
5. Logout clears the session flag

## Deploy with Custom Password

1. Edit `.env`:
   ```
   REACT_APP_PASSWORD_HASH=your_hash_here
   ```

2. Rebuild:
   ```powershell
   npm run build
   ```

3. Redeploy to GitHub Pages:
   ```powershell
   git add build -f
   git commit -m "Update with new password"
   git subtree push --prefix build origin gh-pages
   ```

Your new password will be required on next visit!
