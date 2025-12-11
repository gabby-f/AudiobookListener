import React, { useState } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

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
                className="w-10 h-10 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
                <VolumeIcon className="w-5 h-5" />
            </Button>
            
            {showSlider && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                    <Slider
                        orientation="vertical"
                        value={[isMuted ? 0 : volume * 100]}
                        onValueChange={([val]) => onVolumeChange(val / 100)}
                        max={100}
                        step={1}
                        className="h-24"
                    />
                </div>
            )}
        </div>
    );
}