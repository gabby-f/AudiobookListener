# Supabase Setup - Quick Reference

## 1️⃣ Create Account
https://supabase.com → Sign up → Create project

## 2️⃣ Create Database Tables
Copy SQL from `SUPABASE_SETUP.sql` → Paste in Supabase SQL Editor → Run

## 3️⃣ Create Storage Bucket
Supabase Dashboard → Storage → Create bucket named "audiobooks" → Make Public

## 4️⃣ Get API Keys
Supabase Dashboard → Settings → API → Copy:
- Project URL
- Anon Public Key

## 5️⃣ Update .env
```
REACT_APP_SUPABASE_URL=paste_project_url_here
REACT_APP_SUPABASE_ANON_KEY=paste_anon_key_here
```

## 6️⃣ Start App
```
npm start
```

## ✅ Done!
- Upload audiobooks via the app
- They sync to all your devices
- Playback position auto-saves

---

## File Changes Made

**New Files:**
- `src/utils/supabaseClient.js` - Supabase API wrapper
- `Components/audiobook/Library.jsx` - Cloud library UI
- `SUPABASE_SETUP.sql` - Database schema
- `SUPABASE_SETUP_GUIDE.md` - Full guide

**Updated Files:**
- `src/pages/Audiobook.jsx` - Now uses Supabase instead of IndexedDB
- `.env` - Added Supabase config placeholders

**Dependencies Added:**
- `@supabase/supabase-js` - Supabase client library
