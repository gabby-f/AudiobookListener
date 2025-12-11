import React, { useState, useCallback, useEffect, useRef } from 'react';
import { parseBlob } from 'music-metadata-browser';
import { LogOut } from 'lucide-react';
import { extractM4BChapters, extractM4BMetadata } from '../utils/m4bParser';
import FileUploader from '../Components/audiobook/FileUploader';
import AudiobookPlayer from '../Components/audiobook/AudiobookPlayer';
import Library from '../Components/audiobook/Library';
import { Button } from '../Components/ui/button';
import { 
  uploadAudioFile, 
  saveLibraryEntry, 
  getLibrary,
  updatePlaybackState,
  getPlaybackState
} from '../utils/supabaseClient';

const STORAGE_KEY = 'audiobook_player_state';

export default function AudiobookPage({ onLogout }) {
    const [currentFileId, setCurrentFileId] = useState(null);
    const [audioFile, setAudioFile] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [bookInfo, setBookInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [savedState, setSavedState] = useState(null);
    
    // Use ref to always have access to the latest currentFileId without recreating callbacks
    const currentFileIdRef = useRef(null);
    
    // Keep ref in sync with state
    useEffect(() => {
        currentFileIdRef.current = currentFileId;
    }, [currentFileId]);

    // Load saved state on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setSavedState(state);
            } catch (error) {
                console.error('Error loading saved state:', error);
            }
        }
    }, []);
    
    const parseM4BChapters = useCallback(async (file) => {
        try {
            const extractedChapters = [];
            const info = {
                title: null,
                artist: null,
                album: null,
                cover: null,
                duration: 0
            };
            
            // Extract metadata directly from MP4 atoms (like VLC)
            console.log('Extracting metadata from M4B file using binary parser...');
            const binaryMetadata = await extractM4BMetadata(file);
            
            if (binaryMetadata) {
                info.title = binaryMetadata.title;
                info.artist = binaryMetadata.artist || binaryMetadata.albumArtist;
                info.album = binaryMetadata.album;
                info.cover = binaryMetadata.cover;
                info.duration = binaryMetadata.duration;
                
                console.log('Binary metadata extracted:', {
                    title: info.title,
                    artist: info.artist,
                    hasCover: !!info.cover,
                    duration: info.duration
                });
            }
            
            // Extract chapters using binary parsing (like VLC)
            console.log('Extracting chapters from M4B file...');
            const binaryChapters = await extractM4BChapters(file);
            
            if (binaryChapters.length > 0) {
                console.log(`Successfully extracted ${binaryChapters.length} chapters from binary parsing`);
                extractedChapters.push(...binaryChapters);
            }
            
            // Fallback to music-metadata-browser if binary parsing didn't get everything
            let metadata;
            try {
                // Only use music-metadata if we're missing critical info
                if (!info.title || !info.duration) {
                    metadata = await parseBlob(file, { 
                        duration: true,
                        skipCovers: false,
                        native: false  // Skip native parsing to avoid Buffer issues
                    });
                    
                    // Fill in missing metadata from music-metadata
                    if (!info.title) {
                        info.title = metadata.common.title || file.name.replace(/\.[^/.]+$/, '');
                    }
                    if (!info.artist) {
                        info.artist = metadata.common.artist || metadata.common.albumartist || null;
                    }
                    if (!info.album) {
                        info.album = metadata.common.album || null;
                    }
                    if (!info.duration || info.duration === 0) {
                        info.duration = metadata.format.duration || 0;
                    }
                    
                    // Extract cover art from music-metadata if binary parser didn't find it
                    if (!info.cover && metadata.common.picture && metadata.common.picture.length > 0) {
                        const picture = metadata.common.picture[0];
                        const blob = new Blob([picture.data], { type: picture.format });
                        const coverUrl = URL.createObjectURL(blob);
                        console.log('Extracted cover art from music-metadata');
                        info.cover = coverUrl;
                    }
                }
                
            } catch (metadataError) {
                console.warn('Music-metadata fallback failed (non-critical):', metadataError.message);
                // Use binary metadata or filename as fallback
                if (!info.title) {
                    info.title = file.name.replace(/\.[^/.]+$/, '');
                }
            }
            
            // Calculate chapter durations if chapters were found
            if (extractedChapters.length > 0) {
                extractedChapters.sort((a, b) => a.startTime - b.startTime);
                
                extractedChapters.forEach((chapter, index) => {
                    const nextChapter = extractedChapters[index + 1];
                    chapter.duration = nextChapter 
                        ? nextChapter.startTime - chapter.startTime
                        : info.duration - chapter.startTime;
                });
                
                console.log(`Successfully extracted ${extractedChapters.length} chapters`);
            } else if (info.duration > 0) {
                // Fallback: create time-based chapters
                const chapterDuration = 600; // 10 minute segments
                const numChapters = Math.ceil(info.duration / chapterDuration);
                
                for (let i = 0; i < numChapters; i++) {
                    const startTime = i * chapterDuration;
                    extractedChapters.push({
                        title: `Part ${i + 1}`,
                        startTime: startTime,
                        duration: Math.min(chapterDuration, info.duration - startTime)
                    });
                }
                
                console.log(`No chapters found. Created ${extractedChapters.length} time-based segments`);
            }
            
            return { chapters: extractedChapters, info };
            
        } catch (error) {
            console.error('Error parsing M4B file:', error);
            return { 
                chapters: [], 
                info: { 
                    title: file.name.replace(/\.[^/.]+$/, ''), 
                    artist: null, 
                    album: null,
                    cover: null,
                    duration: 0
                } 
            };
        }
    }, []);

    const handleFileSelect = useCallback(async (file) => {
        setIsLoading(true);
        
        try {
            const { chapters: extractedChapters, info } = await parseM4BChapters(file);
            setChapters(extractedChapters);
            setBookInfo(info);
            setAudioFile(file);
            
            // Upload file to Supabase storage and save metadata to database
            try {
                console.log('Uploading file to Supabase...');
                const { storagePath, publicUrl } = await uploadAudioFile(file);
                
                // Extract cover art from blob URL if present
                let coverUrl = null;
                if (info.cover && info.cover.startsWith('blob:')) {
                    // For blob URLs, we'll just use the publicUrl placeholder
                    // In a real app, you might upload the cover separately
                    coverUrl = publicUrl.replace(/m4b.*$/, 'cover.jpg');
                }
                
                console.log('Saving to library...');
                const libraryEntry = await saveLibraryEntry({
                    fileName: file.name,
                    title: info.title || file.name.replace(/\.[^/.]+$/, ''),
                    artist: info.artist || 'Unknown Artist',
                    album: info.album || null,
                    duration: info.duration || 0,
                    storagePath: storagePath,
                    coverUrl: coverUrl,
                    chapters: extractedChapters || [],
                });
                
                // Store the library entry ID
                setCurrentFileId(libraryEntry.id);
                currentFileIdRef.current = libraryEntry.id;
                
                console.log('File uploaded and saved to Supabase successfully');
            } catch (supabaseErr) {
                console.error('Failed to upload to Supabase:', supabaseErr);
                alert('Failed to upload to cloud storage. Please check your Supabase configuration:\n\n' + supabaseErr.message);
                throw supabaseErr;
            }
        } catch (error) {
            console.error('Error parsing audiobook:', error);
            setAudioFile(null);
            setChapters([]);
            setBookInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [parseM4BChapters]);

    const handleClose = useCallback(() => {
        setAudioFile(null);
        setChapters([]);
        setBookInfo(null);
        setCurrentFileId(null);
        setSavedState(null);
        // Clear saved state
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            // ignore
        }
    }, []);

    const handleUrlSubmit = useCallback(async (url) => {
        setIsLoading(true);
        
        try {
            console.log('Processing URL:', url);
            
            // Convert Google Drive/Dropbox share links to streamable URLs
            let directUrl = url;
            let fileName = 'audiobook.m4b';
            
            // Google Drive: Use a proxy-friendly format
            if (url.includes('drive.google.com')) {
                const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (fileIdMatch) {
                    const fileId = fileIdMatch[1];
                    // Use the direct streaming URL format
                    directUrl = `https://drive.google.com/uc?export=open&id=${fileId}`;
                    fileName = `google-drive-${fileId}.m4b`;
                }
            }
            // Dropbox: add dl=1 parameter
            else if (url.includes('dropbox.com')) {
                directUrl = url.replace('dl=0', 'dl=1');
                if (!directUrl.includes('dl=1')) {
                    directUrl += (url.includes('?') ? '&' : '?') + 'dl=1';
                }
                // Extract filename from Dropbox URL
                const pathMatch = url.match(/\/([^/?]+)\?/);
                if (pathMatch) fileName = pathMatch[1];
            }
            // Direct audio URL
            else {
                fileName = url.split('/').pop().split('?')[0] || 'audiobook.m4b';
            }
            
            console.log('Streaming URL:', directUrl);
            console.log('Filename:', fileName);
            
            // For Google Drive, we can't reliably get metadata without actually loading
            // So we'll create a basic entry and let the user play to get duration
            let duration = 0;
            
            // Try to get duration, but don't fail if we can't
            try {
                const audio = new Audio();
                audio.crossOrigin = 'anonymous';
                audio.preload = 'metadata';
                audio.src = directUrl;
                
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        console.log('Metadata timeout, continuing without duration');
                        resolve();
                    }, 10000); // Shorter timeout
                    
                    audio.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        duration = audio.duration;
                        resolve();
                    };
                    
                    audio.onerror = (e) => {
                        clearTimeout(timeout);
                        console.log('Audio error, continuing anyway:', e);
                        resolve(); // Don't reject, just continue
                    };
                });
            } catch (err) {
                console.log('Could not get metadata, continuing anyway:', err);
            }
            
            console.log('Audio duration:', duration || 'unknown');
            
            // For URL-based files, we can't parse metadata, so use basic info
            const info = {
                title: fileName.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown Artist',
                album: null,
                cover: null,
                duration: duration || 0
            };
            
            // Create simple time-based chapters (30-minute segments) if we have duration
            const chapters = [];
            if (duration > 0) {
                const chapterDuration = 30 * 60; // 30 minutes
                for (let i = 0; i < Math.ceil(duration / chapterDuration); i++) {
                    const startTime = i * chapterDuration;
                    chapters.push({
                        title: `Part ${i + 1}`,
                        startTime: startTime,
                        duration: Math.min(chapterDuration, duration - startTime)
                    });
                }
            } else {
                // If no duration, create a single chapter
                chapters.push({
                    title: 'Full Audiobook',
                    startTime: 0,
                    duration: 0
                });
            }
            
            setChapters(chapters);
            setBookInfo(info);
            setAudioFile(directUrl); // Store URL instead of file
            
            // Save to Supabase (no upload needed, just save metadata with URL)
            try {
                console.log('Saving URL-based audiobook to library...');
                const libraryEntry = await saveLibraryEntry({
                    fileName: fileName,
                    title: info.title,
                    artist: info.artist,
                    album: info.album || null,
                    duration: duration || 0,
                    storagePath: directUrl, // Store the direct URL
                    coverUrl: null,
                    chapters: chapters,
                });
                
                setCurrentFileId(libraryEntry.id);
                currentFileIdRef.current = libraryEntry.id;
                
                console.log('URL-based audiobook saved successfully');
            } catch (supabaseErr) {
                console.error('Failed to save to Supabase:', supabaseErr);
                alert('Failed to save to library: ' + supabaseErr.message);
            }
        } catch (error) {
            console.error('Error processing URL:', error);
            alert('Failed to load audiobook from URL: ' + error.message);
            setAudioFile(null);
            setChapters([]);
            setBookInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleLibrarySelect = useCallback(async (fileId, libraryEntry) => {
        setIsLoading(true);
        try {
            // File is already loaded by Library component (could be blob or URL)
            const file = libraryEntry.file;
            if (!file) {
                throw new Error('File not found in library entry');
            }

            console.log('Loading book from library:', libraryEntry.title);

            // Use stored chapters if available
            let chapters = libraryEntry.chapters || [];
            
            // If file is a URL (string), we can't parse it, must use stored chapters
            const isUrl = typeof file === 'string';
            
            if (!isUrl && chapters.length === 0) {
                console.log('No stored chapters, parsing file...');
                const { chapters: extractedChapters } = await parseM4BChapters(file);
                chapters = extractedChapters;
            }
            
            setChapters(chapters);
            setBookInfo({
                title: libraryEntry.title || 'Unknown',
                artist: libraryEntry.artist || 'Unknown Artist',
                cover: libraryEntry.cover_url || null,
            });
            
            // For URL-based files, use URL directly; for blobs, create new File object
            if (isUrl) {
                setAudioFile(file); // file is the URL string
            } else {
                // Force audio remount by creating new file object
                const newFile = new File([file], file.name, { type: file.type });
                setAudioFile(newFile);
            }
            // This ensures clean state when switching between library items
            const newFile = new File([file], file.name, { type: file.type });
            setAudioFile(newFile);
            setCurrentFileId(fileId);
            currentFileIdRef.current = fileId;

            // Load saved playback position (ensure it's a valid number)
            const playbackPosition = typeof libraryEntry.playbackPosition === 'number' 
                ? libraryEntry.playbackPosition 
                : 0;
            
            console.log('Setting saved state with playbackPosition:', playbackPosition);
            setSavedState({
                playbackPosition: playbackPosition,
                currentChapterIndex: 0,
                volume: libraryEntry.volume !== undefined ? libraryEntry.volume : 1,
                speed: libraryEntry.speed !== undefined ? libraryEntry.speed : 1,
            });
        } catch (error) {
            console.error('Error loading file from library:', error);
        } finally {
            setIsLoading(false);
        }
    }, [parseM4BChapters]);

    const handleSaveState = useCallback(async (state) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        
        // Also sync playback state to Supabase
        const libraryId = currentFileIdRef.current;
        if (libraryId) {
            try {
                await updatePlaybackState(libraryId, {
                    currentPosition: state.playbackPosition || 0,
                    isPlaying: false, // Set this based on actual playback state if needed
                    playbackSpeed: state.speed !== undefined ? state.speed : 1,
                    volume: state.volume !== undefined ? state.volume : 1,
                    isMuted: false,
                });
            } catch (err) {
                console.warn('Failed to sync playback state to Supabase:', err);
                // Continue locally anyway
            }
        }
    }, []); // Empty dependency array - callback is stable, uses ref for currentFileId

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {!audioFile ? (
                <>
                    {/* Logout Button */}
                    {onLogout && (
                        <div className="absolute top-4 right-4 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onLogout}
                                className="text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Sign out"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                    
                    <FileUploader 
                        onFileSelect={handleFileSelect}
                        onUrlSubmit={handleUrlSubmit}
                        isLoading={isLoading}
                    />
                    <div className="px-6 py-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Your Library</h2>
                        <Library 
                            onSelectFile={handleLibrarySelect}
                            onLoadingChange={setIsLoading}
                        />
                    </div>
                </>
            ) : (
                <div className="h-screen">
                    <AudiobookPlayer
                        file={audioFile}
                        chapters={chapters}
                        bookInfo={bookInfo}
                        onClose={handleClose}
                        savedState={savedState}
                        onSaveState={handleSaveState}
                    />
                </div>
            )}
        </div>
    );
}
