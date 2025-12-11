import { createClient } from '@supabase/supabase-js';

// Accept both CRA-style REACT_APP_* and plain SUPABASE_* envs; fallback to the provided URL
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://yuhgjsxnzwclffnljqct.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
const appSecret = process.env.REACT_APP_APP_SECRET || 'MySecretKey123'; // Your secret passcode

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-app-secret': appSecret
    }
  }
});

/**
 * Upload M4B file to Supabase storage
 */
export async function uploadAudioFile(file, onProgress) {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('audiobooks')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    return {
      storagePath: data.path,
      publicUrl: supabase.storage.from('audiobooks').getPublicUrl(data.path).data.publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Save audiobook metadata to database
 */
export async function saveLibraryEntry(metadata) {
  try {
    const { data, error } = await supabase
      .from('library')
      .insert([{
        file_name: metadata.fileName,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        duration: metadata.duration,
        storage_path: metadata.storagePath,
        cover_url: metadata.coverUrl || null
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving library entry:', error);
    throw error;
  }
}

/**
 * Get all audiobooks from library
 */
export async function getLibrary() {
  try {
    const { data, error } = await supabase
      .from('library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching library:', error);
    return [];
  }
}

/**
 * Delete audiobook from library and storage
 */
export async function deleteLibraryEntry(id, storagePath) {
  try {
    // Delete from storage
    if (storagePath) {
      await supabase.storage
        .from('audiobooks')
        .remove([storagePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('library')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting library entry:', error);
    throw error;
  }
}

/**
 * Update playback state (position, speed, volume, etc)
 */
export async function updatePlaybackState(libraryId, state) {
  try {
    const { data, error } = await supabase
      .from('playback_state')
      .upsert([{
        library_id: libraryId,
        current_position: state.currentPosition || 0,
        is_playing: state.isPlaying || false,
        playback_speed: state.playbackSpeed || 1,
        volume: state.volume || 1,
        is_muted: state.isMuted || false,
        last_updated: new Date().toISOString()
      }], { onConflict: 'library_id' })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating playback state:', error);
  }
}

/**
 * Get playback state for an audiobook
 */
export async function getPlaybackState(libraryId) {
  try {
    const { data, error } = await supabase
      .from('playback_state')
      .select('*')
      .eq('library_id', libraryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data || null;
  } catch (error) {
    console.error('Error fetching playback state:', error);
    return null;
  }
}

/**
 * Subscribe to real-time playback state updates
 * Useful for syncing across browser tabs
 */
export function subscribeToPlaybackState(libraryId, callback) {
  return supabase
    .from(`playback_state:library_id=eq.${libraryId}`)
    .on('*', payload => {
      callback(payload.new);
    })
    .subscribe();
}
