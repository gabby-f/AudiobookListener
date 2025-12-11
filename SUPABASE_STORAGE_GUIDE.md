# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage so you can access your audiobooks from multiple devices.

## Step 1: Create Storage Bucket

1. Go to your Supabase project: https://supabase.com/dashboard/project/yuhgjsxnzwclffnljqct
2. Click on **Storage** in the left sidebar
3. Click **New bucket**
4. Enter bucket name: `audiobooks`
5. **Uncheck** "Public bucket" (we'll set policies manually for better control)
6. Click **Create bucket**

## Step 2: Set Up Storage Policies

1. Click on **Storage** → **Policies** in your Supabase dashboard
2. Find the `audiobooks` bucket
3. Click on **New policy**
4. Or run the SQL from `SUPABASE_STORAGE_SETUP.sql`:
   - Go to **SQL Editor** in Supabase
   - Copy and paste the contents of `SUPABASE_STORAGE_SETUP.sql`
   - Click **Run**

## Step 3: Verify Database Table Has Chapters Column

Make sure your `library` table includes a `chapters` column:

```sql
-- Run this in SQL Editor if chapters column doesn't exist
ALTER TABLE library 
ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;
```

## Step 4: Test the Setup

1. Rebuild and deploy your app:
   ```bash
   npm run build
   git add -A
   git commit -m "Switch to Supabase storage for multi-device access"
   git push origin main
   git add build -f
   git commit -m "Deploy Supabase storage version"
   git subtree push --prefix build origin gh-pages
   ```

2. Upload an audiobook through the app
3. Check Supabase Storage to see if the file appears
4. Try accessing from a different browser/device

## How It Works

- **Before**: Files stored in browser's IndexedDB (local only)
- **After**: Files stored in Supabase Storage (accessible from any device)

When you upload an audiobook:
1. File is uploaded to Supabase Storage
2. Metadata (title, artist, duration, chapters) saved to database
3. When you click a library item, file is downloaded from Supabase

## Benefits

✅ Access same library from multiple devices  
✅ No file size limits (unlike IndexedDB)  
✅ Automatic cloud backup  
✅ Share audiobooks across browsers  

## Troubleshooting

### "Bucket not found" error
- Make sure you created the `audiobooks` bucket in Supabase Storage
- Check bucket name is exactly `audiobooks` (lowercase)

### "Permission denied" error
- Run the SQL policies from `SUPABASE_STORAGE_SETUP.sql`
- Make sure policies allow public access (since we're using anon key)

### Files not appearing in library
- Check browser console for errors
- Verify the `library` table has the `chapters` column
- Make sure upload completed successfully (green checkmark in console)
