# Google Drive Proxy Edge Function

This Supabase Edge Function proxies audio streaming from Google Drive to enable iOS Safari compatibility.

## Why This Is Needed

iOS Safari cannot:
- Stream from URLs with authentication tokens (CORS issues)
- Use Service Workers to intercept and add auth headers
- Download large audiobook files (memory crashes)

This proxy handles authentication server-side and streams audio to iOS Safari with proper headers.

## Deploy

```bash
# Install Supabase CLI if you haven't
# https://supabase.com/docs/guides/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy google-drive-proxy
```

## Usage

The function is called from the client with:
- `fileId`: Google Drive file ID
- `accessToken`: User's Google OAuth access token

Example:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-drive-proxy?fileId=FILE_ID&accessToken=TOKEN
```

The function:
1. Receives the request with file ID and token
2. Fetches from Google Drive with Authorization header
3. Forwards Range requests (for seeking)
4. Streams response back with CORS headers
5. iOS Safari plays the audio normally

## Security Note

The access token is passed as a query parameter. This is acceptable because:
- The token is short-lived (1 hour)
- It's only the user's own Google Drive content
- Supabase Edge Functions run server-side (not exposed in client)
- Alternative would be storing tokens in Supabase (more complex)

For production, consider:
- Using Supabase Auth to store Google tokens
- Refreshing tokens server-side
- Rate limiting
