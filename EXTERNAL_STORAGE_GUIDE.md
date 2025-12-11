# External Storage Guide (Dropbox / Direct URLs)

This guide shows you how to use **Dropbox** or other direct URLs to store your audiobooks and access them from any device.

## ⚠️ Important: Google Drive Does NOT Work

**Google Drive blocks audio streaming** due to CORS (Cross-Origin Resource Sharing) restrictions. The browser cannot play audio directly from Google Drive links.

**Use Dropbox instead** - it works perfectly for streaming!

## Why Use External Storage?

✅ **No file size limits** - Upload audiobooks of any size  
✅ **Free storage** - Use your existing Dropbox space  
✅ **Multi-device access** - Listen from any browser/device  
✅ **Easy management** - Organize files in folders you control  
✅ **No upload time** - Files stay where they are, just link them

---

## Dropbox (Recommended)

### Step 1: Upload Audiobook to Dropbox

1. Go to [Dropbox](https://www.dropbox.com)
2. Click **Upload files**
3. Select your audiobook file (.m4b, .m4a, or .mp3)
4. Wait for upload to complete

### Step 2: Get Shareable Link

1. Hover over the file and click **Share**
2. Click **Create link** or **Copy link**
3. Change access to **Anyone with the link**

Your link will look like:
```
https://www.dropbox.com/s/abc123/audiobook.m4b?dl=0
```

### Step 3: Modify the Link (Optional)

Dropbox links end with `?dl=0`. The app will automatically convert this to `?dl=1` for streaming, but you can do it manually:

**Before:**
```
https://www.dropbox.com/s/abc123/audiobook.m4b?dl=0
```

**After:**
```
https://www.dropbox.com/s/abc123/audiobook.m4b?dl=1
```

### Step 4: Add to Your Library

1. Open your audiobook player
2. Click **"Or add from Dropbox / Direct URL"**
3. Paste the Dropbox link
4. Click **Add**

✅ Done! Works from any device now.

---

## Why Not Google Drive?

Google Drive does NOT allow direct audio streaming in web browsers due to CORS restrictions. When you try to play audio from Google Drive, you'll see:

```
Access to audio has been blocked by CORS policy
```

**Alternatives to Google Drive:**
1. **Dropbox** (recommended, works perfectly)
2. **OneDrive** with public sharing
3. **Direct audio URLs** from any web server
4. **Download and upload** the file directly to the app (up to 50MB with Supabase free tier)

> **Tip:** The app will automatically convert `dl=0` to `dl=1` for you!

### Step 4: Add to Your Library

1. Open your audiobook player
2. Click **"Or add from Google Drive / Dropbox URL"**
3. Paste the Dropbox link
4. Click **Add**

✅ Done! Works from any device now.

---

## Troubleshooting

### "Failed to load audio from URL"

**Problem:** The link might not be public or direct.

**Solution:**
- **Google Drive**: Make sure you set access to "Anyone with the link"
- **Dropbox**: Make sure the link ends with `?dl=1` not `?dl=0`

### "Timeout loading audio metadata"

**Problem:** File is very large or slow connection.

**Solution:**
- Wait a bit longer (30 second timeout)
- Try re-uploading the file to Google Drive/Dropbox
- Check your internet connection

### Audio won't play / buffering issues

**Problem:** External links can be slower than local files.

**Solution:**
- **Google Drive** works best for streaming
- **Dropbox** sometimes has rate limits
- Consider using smaller file sizes or better compression

### "CORS" or "Cross-origin" errors

**Problem:** Browser security blocking external audio.

**Solution:**
- This is rare with Google Drive/Dropbox
- Make sure the link is truly public
- Try refreshing the page

---

## Comparison: Local Upload vs External Link

| Feature | Local Upload | External Link (Drive/Dropbox) |
|---------|-------------|-------------------------------|
| **File Size Limit** | 50MB (Supabase free) | Unlimited |
| **Storage Cost** | Supabase quota | Your existing Drive/Dropbox |
| **Upload Speed** | Slower (uploads to Supabase) | Instant (just paste link) |
| **Playback Speed** | Fast | Depends on Drive/Dropbox speed |
| **Offline Access** | No | No |
| **Multi-device** | ✅ Yes | ✅ Yes |

---

## Tips for Best Experience

1. **Organize your files**: Keep audiobooks in a dedicated folder on Drive/Dropbox
2. **Use Google Drive for streaming**: Generally faster and more reliable than Dropbox
3. **Name files clearly**: The filename becomes the title in your library
4. **Test the link first**: Paste it in a browser to make sure it's accessible
5. **Keep links safe**: Save your Drive/Dropbox links somewhere in case you need to re-add

---

## Privacy & Security

- ✅ Links are only stored in your private Supabase database
- ✅ No one else can access your library (password-protected)
- ⚠️ Anyone with the Google Drive/Dropbox link can download the file
- 💡 To keep files private, don't share the links with others

---

## Need Help?

If you run into issues:
1. Check the browser console (F12) for error messages
2. Verify the link works by pasting it in a new browser tab
3. Make sure your Google Drive/Dropbox file sharing is enabled
4. Try uploading the file directly instead (up to 50MB)
