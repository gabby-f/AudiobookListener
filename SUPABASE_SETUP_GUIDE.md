# Supabase Setup Guide for Audiobook Listener

This guide will help you set up Supabase for multi-device sync.

## What This Enables
- Upload audiobooks once, access from any device (phone, tablet, laptop)
- Playback position syncs automatically across devices
- Library persists in the cloud
- No authentication needed (single user)

## Step-by-Step Setup

### 1. Create Supabase Account
- Go to https://supabase.com
- Sign up (free account)
- Create a new project
  - Project name: "audiobook-listener"
  - Password: Save this somewhere safe!
  - Region: Choose closest to your location

### 2. Create Database Tables
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the SQL from this file: `SUPABASE_SETUP.sql` (in your project root)
3. Paste it into the SQL editor and click "Run"

The SQL will create:
- `library` table - stores book metadata
- `playback_state` table - stores position, volume, speed
- RLS policies - allows public access (no auth needed)

### 3. Create Storage Bucket
1. Go to **Storage** in sidebar
2. Click **Create a new bucket**
3. Name: `audiobooks`
4. Make it **Public** (toggle on)
5. Click **Create bucket**

### 4. Get API Keys
1. Go to **Settings → API** (bottom left)
2. Copy your `Project URL`
3. Copy `anon public` key
4. Keep these safe! (Don't share them)

### 5. Update .env File
In your project root, edit `.env` and add:

```
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

Example:
```
REACT_APP_SUPABASE_URL=https://xyzabc.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Install Dependencies
```powershell
npm install @supabase/supabase-js
```

### 7. Restart Your Dev Server
```powershell
npm start
```

## How to Use

### Upload Audiobooks
1. Click "Upload Audiobook"
2. Select your M4B file
3. The app will:
   - Parse metadata (title, artist, cover)
   - Extract chapters
   - Upload to Supabase Cloud Storage
   - Save metadata to database
4. Done! Your book is now available on all devices

### Library
- All your uploaded books appear in "Your Library"
- Click the play button to start reading
- Your position is automatically saved every 5 seconds
- Switch devices and pick up where you left off!

### Delete Books
- Hover over a book in the library
- Click the trash icon to delete (removes file and metadata)

## Technical Details

### What Gets Uploaded Where

**Cloud Storage (`audiobooks/` bucket):**
- M4B audio files (the actual audiobook)

**Database (`library` table):**
- File name, title, artist, album
- Duration, storage path
- Cover art URL

**Database (`playback_state` table):**
- Current playback position (seconds)
- Playback speed
- Volume
- Last updated timestamp

### Real-Time Sync
- Playback position updates every 5 seconds
- Data is stored in Supabase automatically
- When you open the app on another device, it fetches your latest position

### Free Tier Limits (More than enough for 1 user)
- 500 MB storage
- 2 GB bandwidth
- Unlimited API requests
- Perfect for a personal audiobook collection!

## Troubleshooting

### Files Not Uploading
- Check browser console (F12) for errors
- Verify `.env` variables are set correctly
- Check Supabase project is active
- Try refreshing the page

### Playback Position Not Syncing
- Check browser DevTools (F12) → Network tab
- Look for failed requests to Supabase
- Verify database tables were created (SQL Editor)

### Can't See Books on Another Device
- Make sure you're using the same Supabase project
- Refresh the page
- Check that files uploaded successfully (Supabase Storage)

### "Unknown event handler property" Warning
- This is a minor UI warning, doesn't affect functionality
- Already fixed in latest version

## Next Steps

Once this is working:
- Try uploading a test audiobook
- Open on another device and play it
- Your position should sync automatically!

## Support

If you have issues:
1. Check browser console (F12) for error messages
2. Check Supabase dashboard for data
3. Verify `.env` has correct credentials
