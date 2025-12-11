import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Clock } from 'lucide-react';
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
                    
                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 z-50 shadow-2xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-medium text-white">Chapters</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <ScrollArea className="h-[calc(100vh-65px)]">
                            <div className="p-2">
                                {chapters.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No chapters found</p>
                                        <p className="text-sm mt-1">This audiobook may not have chapter markers</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {chapters.map((chapter, index) => {
                                            const isActive = index === currentChapterIndex;
                                            const isPast = currentTime >= chapter.startTime && index < currentChapterIndex;
                                            
                                            return (
                                                <motion.button
                                                    key={index}
                                                    onClick={() => onChapterSelect(index)}
                                                    whileHover={{ x: 4 }}
                                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200
                                                        ${isActive 
                                                            ? 'bg-amber-500/10 border border-amber-500/30' 
                                                            : 'hover:bg-slate-800/50 border border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className={`text-xs font-mono mt-0.5 ${isActive ? 'text-amber-500' : 'text-slate-600'}`}>
                                                            {String(index + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium truncate ${isActive ? 'text-amber-500' : 'text-slate-300'}`}>
                                                                {chapter.title || `Chapter ${index + 1}`}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Clock className="w-3 h-3 text-slate-600" />
                                                                <span className="text-xs text-slate-500">
                                                                    {formatTime(chapter.startTime)}
                                                                    {chapter.duration && ` • ${formatTime(chapter.duration)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isActive && (
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-2" />
                                                        )}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}