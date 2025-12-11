import React, { useCallback, useRef } from 'react';

export default function ProgressBar({ currentTime, duration, onSeek, buffered }) {
    const progressRef = useRef(null);

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
        <div className="w-full px-4 md:px-0">
            <div
                ref={progressRef}
                onClick={handleClick}
                onMouseMove={handleDrag}
                className="relative h-2 bg-slate-700/50 rounded-full cursor-pointer group overflow-hidden"
            >
                {/* Buffered */}
                <div
                    className="absolute inset-y-0 left-0 bg-slate-600/50 rounded-full transition-all duration-150"
                    style={{ width: `${bufferedProgress}%` }}
                />
                
                {/* Progress */}
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                />
                
                {/* Thumb */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200
                             -ml-2"
                    style={{ left: `${progress}%` }}
                />
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
}