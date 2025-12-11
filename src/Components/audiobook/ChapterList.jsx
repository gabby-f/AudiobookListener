import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Clock, Play } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

export default function ChapterList({ 
    chapters, 
    currentChapterIndex, 
    onChapterSelect, 
    isOpen, 
    onClose,
    currentTime 
}) {
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />
                    
                    {/* Panel - Spotify Style Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border-l border-emerald-500/10 z-50 shadow-2xl shadow-black/50"
                    >
                        {/* Header */}
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sticky top-0 z-10 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50 px-6 py-4"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Queue</p>
                                        <h2 className="text-lg font-bold text-white">Chapters</h2>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>

                        {/* Chapters List */}
                        <ScrollArea className="h-[calc(100vh-100px)]">
                            <div className="px-4 py-4 space-y-2">
                                {chapters.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-12 text-slate-500"
                                    >
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No chapters found</p>
                                        <p className="text-sm mt-1">This audiobook may not have chapter markers</p>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ staggerChildren: 0.02 }}
                                        className="space-y-1"
                                    >
                                        {chapters.map((chapter, index) => {
                                            const isActive = index === currentChapterIndex;
                                            
                                            return (
                                                <motion.button
                                                    key={index}
                                                    onClick={() => onChapterSelect(index)}
                                                    whileHover={{ x: 6, scale: 1.01 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.01 }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 relative group
                                                        ${isActive 
                                                            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40' 
                                                            : 'hover:bg-slate-800/40 border border-transparent hover:border-slate-700/50'
                                                        }`}
                                                >
                                                    {/* Left accent bar for active chapter */}
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeChapter"
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full"
                                                        />
                                                    )}
                                                    
                                                    <div className="flex items-start gap-3 pl-1">
                                                        {/* Chapter Number Badge */}
                                                        <div className={`mt-0.5 text-xs font-bold font-mono w-6 text-center ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                            {String(index + 1).padStart(2, '0')}
                                                        </div>
                                                        
                                                        {/* Chapter Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-semibold truncate text-sm ${isActive ? 'text-emerald-300' : 'text-slate-200'}`}>
                                                                {chapter.title || `Chapter ${index + 1}`}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1.5">
                                                                <Clock className="w-3 h-3 text-slate-600" />
                                                                <span className="text-xs text-slate-400">
                                                                    {formatTime(chapter.startTime)}
                                                                    {chapter.duration && ` • ${formatTime(chapter.duration)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Play indicator */}
                                                        {isActive && (
                                                            <motion.div
                                                                animate={{ scale: [1, 1.1, 1] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                            >
                                                                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        </ScrollArea>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
