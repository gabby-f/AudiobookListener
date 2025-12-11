import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

export default function PlaybackControls({
    isPlaying,
    onPlayPause,
    onSkipBack,
    onSkipForward,
    onPrevChapter,
    onNextChapter,
    hasChapters
}) {
    return (
        <div className="flex items-center justify-center gap-2 md:gap-4">
            {/* Previous Chapter */}
            {hasChapters && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrevChapter}
                    className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                    <SkipBack className="w-5 h-5" />
                </Button>
            )}

            {/* Skip Back 15s */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onSkipBack}
                className="w-12 h-12 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
                <div className="relative">
                    <Rewind className="w-6 h-6" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">15</span>
                </div>
            </Button>

            {/* Play/Pause */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayPause}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 
                         flex items-center justify-center shadow-lg shadow-amber-500/25
                         hover:shadow-amber-500/40 transition-shadow duration-300"
            >
                {isPlaying ? (
                    <Pause className="w-7 h-7 md:w-8 md:h-8 text-white" fill="white" />
                ) : (
                    <Play className="w-7 h-7 md:w-8 md:h-8 text-white ml-1" fill="white" />
                )}
            </motion.button>

            {/* Skip Forward 15s */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onSkipForward}
                className="w-12 h-12 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
                <div className="relative">
                    <FastForward className="w-6 h-6" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold">15</span>
                </div>
            </Button>

            {/* Next Chapter */}
            {hasChapters && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNextChapter}
                    className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                    <SkipForward className="w-5 h-5" />
                </Button>
            )}
        </div>
    );
}