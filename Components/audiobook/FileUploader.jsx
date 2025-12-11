import React, { useCallback } from 'react';
import { Upload, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FileUploader({ onFileSelect, isLoading }) {
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.m4b') || file.name.endsWith('.m4a') || file.name.endsWith('.mp3'))) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleFileInput = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center justify-center min-h-[70vh] px-4"
        >
            <div className="mb-8 text-center">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 mb-6"
                >
                    <BookOpen className="w-10 h-10 text-amber-500" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-light text-white mb-3 tracking-tight">
                    Audiobook Player
                </h1>
                <p className="text-slate-400 text-lg font-light">
                    Upload your M4B audiobook to begin listening
                </p>
            </div>

            <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative cursor-pointer group"
            >
                <input
                    type="file"
                    accept=".m4b,.m4a,.mp3"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isLoading}
                />
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full max-w-md border-2 border-dashed border-slate-700 rounded-2xl p-12 
                               transition-all duration-300 ease-out
                               hover:border-amber-500/50 hover:bg-slate-800/30
                               group-focus-within:border-amber-500"
                >
                    {isLoading ? (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-slate-300">Processing audiobook...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4
                                          group-hover:bg-amber-500/10 transition-colors duration-300">
                                <Upload className="w-7 h-7 text-slate-400 group-hover:text-amber-500 transition-colors duration-300" />
                            </div>
                            <p className="text-slate-300 mb-2 font-medium">
                                Drop your audiobook here
                            </p>
                            <p className="text-slate-500 text-sm">
                                or click to browse
                            </p>
                            <p className="text-slate-600 text-xs mt-4">
                                Supports M4B, M4A, MP3
                            </p>
                        </div>
                    )}
                </motion.div>
            </label>
        </motion.div>
    );
}