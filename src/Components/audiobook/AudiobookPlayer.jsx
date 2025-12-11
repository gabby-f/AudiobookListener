import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { List, X, Disc3 } from 'lucide-react';
import { Button } from '../ui/button';
import PlaybackControls from './PlaybackControls';
import ProgressBar from './ProgressBar';
import ChapterList from './ChapterList';
import SpeedControl from './SpeedControl';
import VolumeControl from './VolumeControl';

export default function AudiobookPlayer({ file, chapters, bookInfo, onClose, savedState, onSaveState }) {
    const audioRef = useRef(null);
    const lastSaveTimeRef = useRef(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [showChapters, setShowChapters] = useState(false);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);

    // Create object URL for the file (or use URL directly if it's already a string)
    useEffect(() => {
        if (file) {
            // Check if file is already a URL string (from Google Drive/Dropbox)
            if (typeof file === 'string') {
                setAudioUrl(file);
            } else {
                // It's a File/Blob object, create object URL
                const url = URL.createObjectURL(file);
                setAudioUrl(url);
                return () => URL.revokeObjectURL(url);
            }
        }
    }, [file]);

    // Apply saved volume/speed to audio element when available
    useEffect(() => {
        if (!audioRef.current || !savedState) return;
        
        // Restore volume to both state and audio element
        if (savedState.volume !== undefined) {
            setVolume(savedState.volume);
            audioRef.current.volume = savedState.volume;
        }
        
        // Restore playback speed to both state and audio element
        if (savedState.speed !== undefined) {
            setSpeed(savedState.speed);
            audioRef.current.playbackRate = savedState.speed;
        }
    }, [savedState, audioUrl]);

    // Throttled save on timeUpdate (max once per 5 seconds)
    const handleTimeUpdateWithSave = useCallback(() => {
        if (!audioRef.current) return;
        const now = Date.now();
        const newTime = audioRef.current.currentTime;
        setCurrentTime(newTime);
        
        // Only save if playing and at least 5 seconds have passed since last save
        if (isPlaying && onSaveState && now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            onSaveState({
                playbackPosition: newTime,
                volume: audioRef.current.volume,
                speed: audioRef.current.playbackRate,
                currentChapterIndex,
            });
        }
    }, [isPlaying, currentChapterIndex, onSaveState]);

    // Update current chapter based on playback time
    useEffect(() => {
        if (chapters.length === 0) return;
        
        const chapterIndex = chapters.findIndex((chapter, index) => {
            const nextChapter = chapters[index + 1];
            if (nextChapter) {
                return currentTime >= chapter.startTime && currentTime < nextChapter.startTime;
            }
            return currentTime >= chapter.startTime;
        });
        
        if (chapterIndex !== -1 && chapterIndex !== currentChapterIndex) {
            setCurrentChapterIndex(chapterIndex);
        }
    }, [currentTime, chapters, currentChapterIndex]);

    const handlePlayPause = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleSeek = useCallback((time) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    const handleSkipBack = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }, []);

    const handleSkipForward = useCallback(() => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 15);
    }, [duration]);

    const handlePrevChapter = useCallback(() => {
        if (chapters.length <= 1 || currentChapterIndex === 0) return;
        const prevChapter = chapters[currentChapterIndex - 1];
        if (prevChapter && audioRef.current) {
            audioRef.current.currentTime = prevChapter.startTime;
        }
    }, [chapters, currentChapterIndex]);

    const handleNextChapter = useCallback(() => {
        if (chapters.length <= 1 || currentChapterIndex >= chapters.length - 1) return;
        const nextChapter = chapters[currentChapterIndex + 1];
        if (nextChapter && audioRef.current) {
            audioRef.current.currentTime = nextChapter.startTime;
        }
    }, [chapters, currentChapterIndex]);

    const handleChapterSelect = useCallback((index) => {
        if (chapters[index] && audioRef.current) {
            audioRef.current.currentTime = chapters[index].startTime;
            setShowChapters(false);
        }
    }, [chapters]);

    const handleVolumeChange = useCallback((newVolume) => {
        if (!audioRef.current) return;
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    }, []);

    const handleToggleMute = useCallback(() => {
        if (!audioRef.current) return;
        const newMuted = !isMuted;
        audioRef.current.muted = newMuted;
        setIsMuted(newMuted);
    }, [isMuted]);

    const handleSpeedChange = useCallback((newSpeed) => {
        if (!audioRef.current) return;
        audioRef.current.playbackRate = newSpeed;
        setSpeed(newSpeed);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
        
        // After metadata is loaded, seek to saved position if available
        if (savedState && savedState.playbackPosition !== undefined) {
            const position = Number(savedState.playbackPosition);
            if (!isNaN(position) && position > 0) {
                console.log('Metadata loaded, seeking to:', position);
                audioRef.current.currentTime = position;
                setCurrentTime(position);
            }
        }
        
        // Attempt autoplay (will fail if user hasn't interacted with page)
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.log('Autoplay prevented by browser policy:', error.message);
                // User will need to click play button manually
            });
        }
    }, [savedState]);

    const handleProgress = useCallback(() => {
        if (!audioRef.current || !audioRef.current.buffered.length) return;
        const bufferedEnd = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
        setBuffered(bufferedEnd);
    }, []);

    const currentChapter = chapters[currentChapterIndex];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-950 to-black"
        >
            {/* Hidden Audio Element - key forces remount when URL changes */}
            <audio
                key={audioUrl}
                ref={audioRef}
                src={audioUrl}
                preload="metadata"
                crossOrigin="anonymous"
                playsInline
                onTimeUpdate={handleTimeUpdateWithSave}
                onLoadedMetadata={handleLoadedMetadata}
                onProgress={handleProgress}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                    console.error('Audio error:', e.target.error);
                    if (e.target.error) {
                        console.error('Error code:', e.target.error.code);
                        console.error('Error message:', e.target.error.message);
                    }
                }}
            />

            {/* Top Controls - Spotify Style */}
            <div className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/50 border-b border-slate-800/50">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                        Now Playing
                    </p>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowChapters(true)}
                            className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded-full transition-all duration-200"
                        >
                            <List className="w-5 h-5" />
                        </Button>
                        <SpeedControl speed={speed} onSpeedChange={handleSpeedChange} />
                        <VolumeControl 
                            volume={volume} 
                            onVolumeChange={handleVolumeChange}
                            isMuted={isMuted}
                            onToggleMute={handleToggleMute}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content - Centered Layout */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 overflow-y-auto">
                {/* Album Art / Cover - Large and Animated */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="relative mb-12"
                >
                    <div className="relative">
                        {/* Glow/Blur effect - behind cover */}
                        <motion.div 
                            animate={isPlaying ? { opacity: [0.4, 0.6, 0.4] } : { opacity: 0.2 }}
                            transition={isPlaying ? { duration: 3, repeat: Infinity } : {}}
                            className="absolute inset-0 -z-10 blur-3xl bg-gradient-to-br from-emerald-500/40 to-cyan-500/20 rounded-3xl" 
                        />
                        
                        {/* Cover Image */}
                        <motion.div
                            animate={isPlaying ? { 
                                rotateZ: 360,
                            } : {}}
                            transition={isPlaying ? { 
                                duration: 8, 
                                repeat: Infinity, 
                                ease: "linear" 
                            } : {}}
                            className="w-56 h-56 md:w-72 md:h-72 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 
                                      shadow-2xl shadow-emerald-500/20 flex items-center justify-center overflow-hidden border-4 border-slate-800"
                        >
                            {bookInfo?.cover ? (
                                <img 
                                    src={bookInfo.cover} 
                                    alt={bookInfo.title || 'Audiobook cover'} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-600 to-slate-800">
                                    <Disc3 className={`w-24 h-24 text-slate-400 ${isPlaying ? 'animate-spin' : ''}`} style={{
                                        animationDuration: isPlaying ? '3s' : 'none'
                                    }} />
                                </div>
                            )}
                        </motion.div>
                    </div>
                </motion.div>

                {/* Book Title & Artist Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6 max-w-2xl"
                >
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
                        {bookInfo?.title || file?.name?.replace(/\.[^/.]+$/, '') || 'Unknown Title'}
                    </h1>
                    {bookInfo?.artist && (
                        <p className="text-base md:text-lg text-slate-400 font-light mb-3">{bookInfo.artist}</p>
                    )}
                </motion.div>

                {/* Current Chapter Info */}
                {currentChapter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="mb-8 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center max-w-lg"
                    >
                        <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">Current Chapter</p>
                        <p className="text-sm md:text-base text-white font-medium">
                            {currentChapter.title || `Chapter ${currentChapterIndex + 1}`}
                        </p>
                    </motion.div>
                )}

                {/* Progress Bar */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-2xl mb-8"
                >
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        buffered={buffered}
                        onSeek={handleSeek}
                    />
                </motion.div>

                {/* Playback Controls - Center Stage */}
                <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <PlaybackControls
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayPause}
                        onSkipBack={handleSkipBack}
                        onSkipForward={handleSkipForward}
                        onPrevChapter={handlePrevChapter}
                        onNextChapter={handleNextChapter}
                        hasChapters={chapters.length > 1}
                    />
                </motion.div>
            </div>

            {/* Chapter List Drawer */}
            <ChapterList
                chapters={chapters}
                currentChapterIndex={currentChapterIndex}
                currentTime={currentTime}
                onChapterSelect={handleChapterSelect}
                isOpen={showChapters}
                onClose={() => setShowChapters(false)}
            />
        </motion.div>
    );
}
