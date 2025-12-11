import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { List, BookOpen, X } from 'lucide-react';
import { Button } from '../ui/button';
import PlaybackControls from './PlaybackControls';
import ProgressBar from './ProgressBar';
import ChapterList from './ChapterList';
import SpeedControl from './SpeedControl';
import VolumeControl from './VolumeControl';

export default function AudiobookPlayer({ file, chapters, bookInfo, onClose, savedState, onSaveState }) {
    const audioRef = useRef(null);
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

    // Create object URL for the file
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    // Restore saved playback position
    useEffect(() => {
        if (audioRef.current && savedState && savedState.currentTime) {
            audioRef.current.currentTime = savedState.currentTime;
            setCurrentTime(savedState.currentTime);
            if (savedState.volume !== undefined) setVolume(savedState.volume);
            if (savedState.speed !== undefined) {
                setSpeed(savedState.speed);
                audioRef.current.playbackRate = savedState.speed;
            }
        }
    }, [savedState, audioUrl]);

    // Save state periodically during playback
    useEffect(() => {
        if (!isPlaying || !onSaveState) return;
        
        const interval = setInterval(() => {
            onSaveState({
                currentTime,
                volume,
                speed,
                timestamp: Date.now()
            });
        }, 5000); // Save every 5 seconds
        
        return () => clearInterval(interval);
    }, [isPlaying, currentTime, volume, speed, onSaveState]);

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

    const handleTimeUpdate = useCallback(() => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
    }, []);

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
            className="flex flex-col h-full"
        >
            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onProgress={handleProgress}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </Button>
                
                <div className="flex items-center gap-2">
                    <SpeedControl speed={speed} onSpeedChange={handleSpeedChange} />
                    <VolumeControl 
                        volume={volume} 
                        onVolumeChange={handleVolumeChange}
                        isMuted={isMuted}
                        onToggleMute={handleToggleMute}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowChapters(true)}
                        className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                    >
                        <List className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                {/* Album Art / Cover */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-8"
                >
                    <div className="w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 
                                  shadow-2xl shadow-black/50 flex items-center justify-center overflow-hidden">
                        {bookInfo?.cover ? (
                            <img 
                                src={bookInfo.cover} 
                                alt={bookInfo.title || 'Audiobook cover'} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <BookOpen className="w-20 h-20 md:w-24 md:h-24 text-slate-600" />
                        )}
                    </div>
                    
                    {/* Glow effect */}
                    <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full scale-75" />
                </motion.div>

                {/* Book Info */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8 max-w-md"
                >
                    <h1 className="text-xl md:text-2xl font-semibold text-white mb-2 truncate">
                        {bookInfo?.title || file?.name?.replace(/\.[^/.]+$/, '') || 'Unknown Title'}
                    </h1>
                    {bookInfo?.artist && (
                        <p className="text-slate-400 mb-1">{bookInfo.artist}</p>
                    )}
                    {currentChapter && (
                        <p className="text-amber-500/80 text-sm">
                            {currentChapter.title || `Chapter ${currentChapterIndex + 1}`}
                        </p>
                    )}
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full max-w-lg mb-8"
                >
                    <ProgressBar
                        currentTime={currentTime}
                        duration={duration}
                        buffered={buffered}
                        onSeek={handleSeek}
                    />
                </motion.div>

                {/* Playback Controls */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
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