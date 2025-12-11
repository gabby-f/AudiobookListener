# Supabase Integration Architecture

## Overview
Your audiobook player now supports cloud sync for single-user multi-device access.

## System Architecture

```
┌─────────────────────────────────────────┐
│     Your Audiobook Player (React)       │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Audiobook.jsx (Main Component) │ │
│  │  - Upload files                  │ │
│  │  - Manage library                │ │
│  │  - Play audiobooks               │ │
│  └───────────────────────────────────┘ │
│                  │                      │
│  ┌───────────────▼───────────────────┐ │
│  │    supabaseClient.js              │ │
│  │  (API wrapper)                    │ │
│  │  - Upload files                  │ │
│  │  - Save metadata                 │ │
│  │  - Sync playback state           │ │
│  └───────────────┬───────────────────┘ │
└─────────────────┼─────────────────────┘
                  │
        ┌─────────▼─────────┐
        │    Supabase       │
        │   (Cloud Backend) │
        └─────────┬─────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
   ┌────▼─────┐      ┌──────▼──────┐
   │ Storage  │      │  Database   │
   │ Bucket   │      │             │
   │          │      │  - library  │
   │ audiobook│      │  - playback │
   │ files    │      │    _state   │
   └──────────┘      └─────────────┘
```

## Data Flow

### Uploading an Audiobook
1. User selects M4B file
2. App parses metadata and chapters
3. `supabaseClient.uploadAudioFile()` uploads to `audiobooks/` bucket
4. `supabaseClient.saveLibraryEntry()` saves metadata to `library` table
5. Book appears in library on all devices

### Playing an Audiobook
1. User clicks play on book in library
2. App fetches file URL from Supabase Storage
3. App downloads playback state from `playback_state` table
4. Sets player to last position
5. User can resume listening

### Syncing Playback Position
1. Every 5 seconds during playback:
   - `handleSaveState()` is called
   - `updatePlaybackState()` saves position to database
2. On next device:
   - App loads book from library
   - Fetches latest `playback_state` from database
   - Resumes from that position

## Database Schema

### library table
```sql
id            UUID (primary key)
created_at    TIMESTAMP
file_name     TEXT (original filename)
title         TEXT (book title)
artist        TEXT (author name)
album         TEXT (series)
duration      FLOAT (seconds)
storage_path  TEXT (path in Supabase storage)
cover_url     TEXT (image URL)
```

### playback_state table
```sql
id              UUID (primary key)
library_id      UUID (foreign key → library.id)
current_position FLOAT (seconds)
is_playing      BOOLEAN
playback_speed  FLOAT
volume          FLOAT (0-1)
is_muted        BOOLEAN
last_updated    TIMESTAMP
```

## File Storage

**Supabase Storage Bucket: `audiobooks/`**
- Location: Cloud (accessible from anywhere)
- File naming: `{timestamp}_{filename}.m4b`
- Permissions: Public read (anyone with link can play, but not modify/delete)

## Security Notes

Since this is a **single-user app**:
- No authentication required
- Row Level Security (RLS) allows ALL access
- Good enough for personal use
- If you wanted multi-user: Add auth with `supabase.auth.signUp()`

## Performance

### Free Tier (More than enough)
- 500 MB storage (fit 50+ audiobooks)
- 2 GB bandwidth/month
- Unlimited API calls
- Real-time subscriptions (for live sync)

### Query Times
- Upload: ~5-30 seconds (depends on file size)
- Download: Streaming (plays while downloading)
- Metadata fetch: <1 second
- Playback sync: Every 5 seconds

## Real-Time Features

The app can subscribe to real-time updates using:
```javascript
subscribeToPlaybackState(libraryId, (update) => {
  // Updates instantly when playback state changes
  console.log('Position updated:', update.current_position);
});
```

Currently implemented for:
- Playback position (syncs every 5s)
- Can be extended to volume, speed, etc.

## Modifications Made to Your App

### src/pages/Audiobook.jsx
- Removed: IndexedDB references
- Added: Supabase upload and sync
- `handleFileSelect()` now uploads to cloud
- `handleSaveState()` now syncs to Supabase
- `handleLibrarySelect()` loads from Supabase

### Components/audiobook/Library.jsx
- New component (was using IndexedDB before)
- Fetches books from `library` table
- Shows playback progress
- Delete functionality
- Real-time updates possible

### src/utils/supabaseClient.js
- New utility module
- Handles all Supabase API calls
- Wraps upload, save, sync functions
- Error handling included

## Future Enhancements

Possible additions:
- User authentication (multi-user support)
- Book ratings/reviews
- Bookmarks/notes
- Sharing library with family
- Automated backups
- Audio sample caching
- Offline mode (download for offline play)
- Analytics (reading habits)

## Troubleshooting

### Uploads fail
- Check `.env` has correct Supabase URL/key
- Verify `audiobooks` bucket is public
- Check browser console for CORS errors

### Playback doesn't sync
- Check `playback_state` table exists
- Verify RLS policies allow insert/update
- Check browser console for API errors

### Library is empty
- Upload a book first
- Refresh page
- Check Supabase dashboard for data

### Slow performance
- Bandwidth limit? Supabase free tier has 2GB/month
- Large file? Consider transcoding to lower bitrate
- Bad connection? Check internet speed
