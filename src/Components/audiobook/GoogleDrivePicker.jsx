import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, FileAudio, Download, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  initGoogleDrive,
  initGoogleAuth,
  signInToGoogleDrive,
  signOutFromGoogleDrive,
  isSignedIn as checkIsSignedIn,
  listAudioFiles,
  downloadDriveFile,
} from '../../utils/googleDriveClient';
import { cacheAudiobookFile } from '../../utils/indexedDB';

export default function GoogleDrivePicker({ onFileSelect, isLoading }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [files, setFiles] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Google Drive API on component mount
  useEffect(() => {
    const initGoogle = async () => {
      try {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });

        // Initialize gapi
        await initGoogleDrive();

        // Initialize auth
        initGoogleAuth((token, error) => {
          if (error) {
            console.error('Auth error:', error);
            setError('Failed to sign in');
          } else {
            setIsSignedIn(true);
            loadFiles();
          }
        });

        // Check if already signed in
        setIsSignedIn(checkIsSignedIn());
      } catch (err) {
        console.error('Failed to initialize Google Drive:', err);
        setError('Failed to initialize Google Drive');
      }
    };

    initGoogle();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInToGoogleDrive();
      setIsSignedIn(true);
      await loadFiles();
    } catch (err) {
      console.error('Sign in failed:', err);
      setError('Failed to sign in. Make sure you have configured Google OAuth credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutFromGoogleDrive();
    setIsSignedIn(false);
    setFiles([]);
    setShowPicker(false);
  };

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const audioFiles = await listAudioFiles(50);
      setFiles(audioFiles);
      setShowPicker(true);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load files from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file) => {
    setLoading(true);
    setError(null);
    
    // Close the picker immediately for better UX
    setShowPicker(false);
    
    try {
      console.log('Downloading file from Google Drive:', file.name);
      const blob = await downloadDriveFile(file.id);
      
      // Create a File object from the blob
      const fileObj = new File([blob], file.name, { type: file.mimeType || 'audio/mp4' });
      
      // Mark this file as coming from Google Drive by adding custom property
      fileObj.googleDriveId = file.id;
      fileObj.googleDriveName = file.name;
      
      // Pass to parent component (this will trigger processing)
      onFileSelect(fileObj);
      
      // Cache the file in the background for faster future loads
      console.log('Caching file for faster future loads...');
      await cacheAudiobookFile(file.id, fileObj);
      console.log('✓ File cached');
    } catch (err) {
      console.error('Failed to download file:', err);
      setError('Failed to download file from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {!isSignedIn ? (
        <Button
          onClick={handleSignIn}
          disabled={loading || isLoading}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 border border-gray-300"
        >
          <Cloud className="w-5 h-5 mr-2" />
          {loading ? 'Connecting...' : 'Connect Google Drive'}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={loadFiles}
              disabled={loading || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Cloud className="w-5 h-5 mr-2" />
              {loading ? 'Loading...' : 'Browse Google Drive'}
            </Button>
            <Button
              onClick={handleSignOut}
              disabled={loading || isLoading}
              variant="outline"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
            >
              <CloudOff className="w-5 h-5" />
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* File Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold text-white">Select Audiobook from Google Drive</h2>
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* File List */}
              <div className="overflow-y-auto max-h-[calc(80vh-5rem)] p-6">
                {files.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileAudio className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No audio files found in your Google Drive</p>
                    <p className="text-sm mt-2">Upload some .m4b, .m4a, or .mp3 files to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <motion.button
                        key={file.id}
                        onClick={() => handleFileSelect(file)}
                        disabled={loading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center gap-4 p-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        <FileAudio className="w-10 h-10 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{file.name}</h3>
                          <div className="flex gap-3 mt-1 text-xs text-slate-400">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{formatDate(file.modifiedTime)}</span>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
