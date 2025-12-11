import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from '../ui/button';
import { Zap } from 'lucide-react';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function SpeedControl({ speed, onSpeedChange }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded-full transition-all duration-200 relative"
                    title="Playback speed"
                >
                    <div className="flex flex-col items-center">
                        <Zap className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5 leading-none">{speed}x</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="center" 
                className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl"
            >
                {SPEEDS.map((s) => (
                    <DropdownMenuItem
                        key={s}
                        onClick={() => onSpeedChange(s)}
                        className={`justify-center font-mono text-sm cursor-pointer px-4 py-2 rounded-lg transition-all duration-200
                            ${speed === s 
                                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' 
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        {s}x
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
