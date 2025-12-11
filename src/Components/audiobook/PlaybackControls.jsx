import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8"
        >
            {/* Chapter Navigation Buttons */}
            {hasChapters && (
                <div className="flex items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onPrevChapter}
                        className="w-12 h-12 rounded-full bg-slate-800/60 hover:bg-slate-700 
                                 flex items-center justify-center text-slate-300 hover:text-white
                                 transition-all duration-200 border border-slate-700 hover:border-slate-600"
                    >
                        <SkipBack className="w-5 h-5" />
                    </motion.button>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold min-w-max">Chapters</p>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNextChapter}
                        className="w-12 h-12 rounded-full bg-slate-800/60 hover:bg-slate-700 
                                 flex items-center justify-center text-slate-300 hover:text-white
                                 transition-all duration-200 border border-slate-700 hover:border-slate-600"
                    >
                        <SkipForward className="w-5 h-5" />
                    </motion.button>
                </div>
            )}

            {/* Main Playback Controls */}
            <div className="flex items-center justify-center gap-4 md:gap-8">
                {/* Skip Back 15s */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSkipBack}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800/40 hover:bg-slate-700/60 
                             flex items-center justify-center text-slate-300 hover:text-white
                             transition-all duration-200 border border-slate-700/50 hover:border-slate-600"
                >
                    <div className="flex flex-col items-center">
                        <Rewind className="w-6 h-6" />
                        <span className="text-[9px] font-bold mt-0.5">15</span>
                    </div>
                </motion.button>

                {/* Play/Pause - Main Control */}
                <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={onPlayPause}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500
                             flex items-center justify-center shadow-2xl shadow-emerald-500/30
                             hover:shadow-emerald-500/50 transition-all duration-300 group
                             border-2 border-emerald-300/20 hover:border-emerald-300/40"
                >
                    <motion.div
                        animate={isPlaying ? { scale: [1, 1.05, 1] } : {}}
                        transition={isPlaying ? { duration: 0.6, repeat: Infinity } : {}}
                    >
                        {isPlaying ? (
                            <Pause className="w-10 h-10 md:w-12 md:h-12 text-white fill-white" />
                        ) : (
                            <Play className="w-10 h-10 md:w-12 md:h-12 text-white fill-white ml-1" />
                        )}
                    </motion.div>
                </motion.button>

                {/* Skip Forward 15s */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSkipForward}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-slate-800/40 hover:bg-slate-700/60 
                             flex items-center justify-center text-slate-300 hover:text-white
                             transition-all duration-200 border border-slate-700/50 hover:border-slate-600"
                >
                    <div className="flex flex-col items-center">
                        <FastForward className="w-6 h-6" />
                        <span className="text-[9px] font-bold mt-0.5">15</span>
                    </div>
                </motion.button>
            </div>
        </motion.div>
    );
}
