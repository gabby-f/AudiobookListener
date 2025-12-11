import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from '../ui/button';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function SpeedControl({ speed, onSpeedChange }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-700/50"
                >
                    {speed}x
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="center" 
                className="bg-slate-800 border-slate-700 min-w-[80px]"
            >
                {SPEEDS.map((s) => (
                    <DropdownMenuItem
                        key={s}
                        onClick={() => onSpeedChange(s)}
                        className={`justify-center font-mono text-sm cursor-pointer
                            ${speed === s 
                                ? 'text-amber-500 bg-amber-500/10' 
                                : 'text-slate-300 hover:text-white'
                            }`}
                    >
                        {s}x
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}