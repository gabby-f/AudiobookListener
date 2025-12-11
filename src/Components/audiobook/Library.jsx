import React, { useState, useEffect } from 'react';
import { Trash2, Music } from 'lucide-react';
import { getLibrary, deleteLibraryEntry, downloadAudioFile } from '../../utils/supabaseClient';

export default function Library({ onSelectFile, onLoadingChange }) {
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const items = await getLibrary();
      setLibraryItems(items);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file from library?')) return;
    
    try {
      await deleteLibraryEntry(item.id, item.storage_path);
      setLibraryItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file: ' + err.message);
    }
  };

  const handleSelectFile = async (item) => {
    onLoadingChange?.(true);
    try {
      console.log('Downloading file from Supabase:', item.storage_path);
      
      // Download the file from Supabase storage
      const fileBlob = await downloadAudioFile(item.storage_path);
      
      if (!fileBlob) {
        throw new Error('Failed to download file');
      }
      
      // Attach the file blob and metadata to the entry
      const entry = {
        ...item,
        file: fileBlob,
        fileId: item.id
      };
      
      onSelectFile(item.id, entry);
    } catch (err) {
      console.error('Error loading file from library:', err);
      alert('Failed to load audiobook: ' + err.message);
    } finally {
      onLoadingChange?.(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading library...</div>;
  }

  if (libraryItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Music className="w-12 h-12 mb-4 opacity-50" />
        <p>No audiobooks in library yet</p>
        <p className="text-sm mt-2">Upload an audiobook to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {libraryItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelectFile(item)}
          className="flex gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors group"
        >
          {item.cover_url ? (
            <img
              src={item.cover_url}
              alt={item.title}
              className="w-16 h-16 object-cover rounded flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <Music className="w-8 h-8 text-white opacity-60" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{item.title}</h3>
            <p className="text-sm text-gray-400 truncate">{item.artist}</p>
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              <span>{formatDuration(item.duration)}</span>
              {item.created_at && <span>{formatDate(item.created_at)}</span>}
            </div>
          </div>

          <button
            onClick={(e) => handleDelete(item, e)}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete from library"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
