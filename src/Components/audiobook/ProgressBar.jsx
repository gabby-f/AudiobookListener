import React, { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ProgressBar({ currentTime, duration, onSeek, buffered }) {
    const progressRef = useRef(null);
    const [isHovering, setIsHovering] = React.useState(false);

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

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedProgress = buffered && duration > 0 ? (buffered / duration) * 100 : 0;

    const handleClick = useCallback((e) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        const newTime = clickPosition * duration;
        onSeek(newTime);
    }, [duration, onSeek]);

    const handleDrag = useCallback((e) => {
        if (e.buttons !== 1 || !progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const clickPosition = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = clickPosition * duration;
        onSeek(newTime);
    }, [duration, onSeek]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div
                ref={progressRef}
                onClick={handleClick}
                onMouseMove={handleDrag}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className="relative h-1.5 bg-slate-700/40 rounded-full cursor-pointer group overflow-hidden
                          hover:h-2 transition-all duration-200"
            >
                {/* Buffered Progress */}
                <motion.div
                    className="absolute inset-y-0 left-0 bg-slate-600/60 rounded-full"
                    style={{ width: `${bufferedProgress}%` }}
                    initial={false}
                    animate={{ width: `${bufferedProgress}%` }}
                    transition={{ duration: 0.1 }}
                />
                
                {/* Main Progress */}
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400"
                    style={{ width: `${progress}%` }}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                />
                
                {/* Playhead Thumb */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg
                             opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 -ml-2"
                    style={{ left: `${progress}%` }}
                    animate={isHovering ? { scale: 1.2 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                />
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between mt-3 text-xs text-slate-400 font-mono font-medium tracking-wider">
                <span className="bg-slate-800/40 px-2 py-1 rounded">{formatTime(currentTime)}</span>
                <span className="bg-slate-800/40 px-2 py-1 rounded">{formatTime(duration)}</span>
            </div>
        </motion.div>
    );
}
