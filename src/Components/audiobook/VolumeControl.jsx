import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

export default function VolumeControl({ volume, onVolumeChange, isMuted, onToggleMute }) {
    const [showSlider, setShowSlider] = useState(false);

    const VolumeIcon = isMuted || volume === 0 
        ? VolumeX 
        : volume < 0.5 
            ? Volume1 
            : Volume2;

    return (
        <div 
            className="relative flex items-center"
            onMouseEnter={() => setShowSlider(true)}
            onMouseLeave={() => setShowSlider(false)}
        >
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded-full transition-all duration-200"
                title={isMuted ? "Unmute" : "Mute"}
            >
                <VolumeIcon className="w-5 h-5" />
            </Button>
            
            <AnimatePresence>
                {showSlider && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-4 bg-slate-900/95 backdrop-blur-sm 
                                 rounded-xl shadow-2xl border border-emerald-500/20"
                    >
                        <Slider
                            orientation="vertical"
                            value={[isMuted ? 0 : volume * 100]}
                            onValueChange={([val]) => onVolumeChange(val / 100)}
                            max={100}
                            step={1}
                            className="h-24"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
