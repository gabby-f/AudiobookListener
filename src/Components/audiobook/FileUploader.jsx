import React, { useCallback, useState } from 'react';
import { Upload, BookOpen, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';

export default function FileUploader({ onFileSelect, onUrlSubmit, isLoading }) {
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [url, setUrl] = useState('');

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

    const handleUrlSubmit = useCallback((e) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url.trim());
            setUrl('');
            setShowUrlInput(false);
        }
    }, [url, onUrlSubmit]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-black"
        >
            <div className="max-w-2xl w-full">
                {/* Logo/Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="flex justify-center mb-12"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-2xl opacity-40" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl">
                            <BookOpen className="w-12 h-12 text-white" />
                        </div>
                    </div>
                </motion.div>

                {/* Heading */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        AudioBook
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> Listener</span>
                    </h1>
                    <p className="text-xl text-slate-400 font-light">
                        Your personal audiobook player
                    </p>
                </motion.div>

                {/* Upload Area */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <label
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        className="relative cursor-pointer group block"
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
                            className="relative border-2 border-slate-700 rounded-2xl p-16 
                                       transition-all duration-300
                                       hover:border-emerald-500/50 hover:bg-slate-800/40
                                       group-focus-within:border-emerald-500 group-focus-within:bg-slate-800/50"
                        >
                            {/* Gradient Background on Hover */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="relative flex flex-col items-center text-center">
                                {isLoading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        className="mb-4"
                                    >
                                        <div className="w-16 h-16 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className="mb-6"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center
                                                      group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-colors duration-300">
                                            <Upload className="w-10 h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
                                        </div>
                                    </motion.div>
                                )}

                                {isLoading ? (
                                    <p className="text-lg text-slate-300 font-medium">Processing audiobook...</p>
                                ) : (
                                    <>
                                        <p className="text-2xl text-white mb-2 font-semibold">
                                            Drop your audiobook here
                                        </p>
                                        <p className="text-slate-400 mb-6">
                                            or click to browse
                                        </p>
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            <span className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm font-medium">
                                                M4B
                                            </span>
                                            <span className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm font-medium">
                                                M4A
                                            </span>
                                            <span className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm font-medium">
                                                MP3
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </label>
                </motion.div>

                {/* Info Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-8 space-y-4"
                >
                    <p className="text-slate-500 text-sm">📚 Upload an M4B audiobook file to start listening</p>
                    
                    {/* Add from URL button */}
                    <div>
                        <Button
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            disabled={isLoading}
                            variant="outline"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
                        >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Or add from Dropbox / Direct URL
                        </Button>
                    </div>

                    {/* URL Input Form */}
                    {showUrlInput && (
                        <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleUrlSubmit}
                            className="max-w-2xl mx-auto mt-4 space-y-3"
                        >
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Paste Dropbox share link or direct audio URL..."
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    disabled={isLoading}
                                    required
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading || !url.trim()}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                                >
                                    Add
                                </Button>
                            </div>
                            <p className="text-xs text-slate-400">
                                💡 Tip: Dropbox links work great! Make sure the link is set to "Anyone with the link can view"
                            </p>
                            <p className="text-xs text-red-400">
                                ⚠️ Google Drive doesn't work due to streaming restrictions
                            </p>
                        </motion.form>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
