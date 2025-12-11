# Deploying the Google Drive Proxy Edge Function

## Prerequisites

1. **Install Supabase CLI**
   ```powershell
   # Using Scoop (recommended for Windows)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # Or download from: https://github.com/supabase/cli/releases
   ```

2. **Get your Supabase Project Reference**
   - Go to https://app.supabase.com
   - Open your project
   - Go to Settings → General
   - Copy the "Reference ID" (looks like: `yuhgjsxnzwclffnljqct`)

## Deploy Steps

1. **Login to Supabase**
   ```powershell
   supabase login
   ```
   This will open a browser for authentication.

2. **Link your project**
   ```powershell
   cd "C:\Users\gabby\Documents\Audiobook Listener"
   supabase link --project-ref yuhgjsxnzwclffnljqct
   ```
   Replace with your actual project reference ID.

3. **Deploy the Edge Function**
   ```powershell
   supabase functions deploy google-drive-proxy
   ```

4. **Verify deployment**
   The function will be available at:
   ```
   https://yuhgjsxnzwclffnljqct.supabase.co/functions/v1/google-drive-proxy
   ```

## Test the Function

You can test it directly from your browser or with curl:

```powershell
# Test with curl (replace FILE_ID and ACCESS_TOKEN)
curl "https://yuhgjsxnzwclffnljqct.supabase.co/functions/v1/google-drive-proxy?fileId=YOUR_FILE_ID&accessToken=YOUR_TOKEN" -I
```

You should see headers like:
```
HTTP/2 200
content-type: audio/mp4
accept-ranges: bytes
access-control-allow-origin: *
```

## How It Works

1. **iOS Safari** requests audio from: `https://YOUR_PROJECT.supabase.co/functions/v1/google-drive-proxy?fileId=XXX&accessToken=YYY`

2. **Edge Function** (running on Deno):
   - Receives the request
   - Fetches from Google Drive with Authorization header
   - Forwards Range requests (for seeking)
   - Streams response back with CORS headers

3. **iOS Safari** plays the audio normally with full seeking support

## Troubleshooting

**Function not found?**
- Check that you've deployed: `supabase functions list`
- Verify project is linked: `supabase projects list`

**CORS errors?**
- The function includes proper CORS headers
- Check browser console for specific error

**Authentication errors?**
- Ensure user is signed in to Google Drive
- Access tokens expire after 1 hour (app refreshes automatically)

## Security Notes

- Access tokens are short-lived (1 hour)
- Edge function only accesses user's own Google Drive
- For production, consider storing tokens in Supabase Auth
- Add rate limiting if needed

## Next Steps After Deployment

1. Build and deploy the updated client code:
   ```powershell
   npm run build
   Copy-Item -Path build/* -Destination . -Recurse -Force
   git add .
   git commit -m "Add Supabase proxy for Google Drive streaming on iOS"
   git push origin gh-pages
   ```

2. Test on iOS Safari - Google Drive files should now stream properly!
