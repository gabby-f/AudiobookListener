import React, { useState, useEffect } from 'react';
import { Trash2, Play, BookOpen } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { getLibrary, deleteLibraryEntry, getPlaybackState, supabase } from '../../utils/supabaseClient';

export default function Library({ onSelectFile, onLoadingChange }) {
    const [library, setLibrary] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load library on mount
    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const books = await getLibrary();
            
            // For each book, fetch its playback state
            const booksWithState = await Promise.all(
                books.map(async (book) => {
                    const playbackState = await getPlaybackState(book.id);
                    return {
                        ...book,
                        playbackPosition: playbackState?.current_position || 0,
                        volume: playbackState?.volume || 1,
                        speed: playbackState?.playback_speed || 1,
                    };
                })
            );
            
            setLibrary(booksWithState);
        } catch (err) {
            console.error('Error loading library:', err);
            setError('Failed to load library');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectBook = async (book) => {
        try {
            // Get the public URL for the audio file
            const { data } = supabase.storage
                .from('audiobooks')
                .getPublicUrl(book.storage_path);
            
            // Create a fetch-based file object
            const response = await fetch(data.publicUrl);
            const blob = await response.blob();
            const file = new File([blob], book.file_name, { type: 'audio/mp4' });
            
            // Load stored playback state
            const playbackState = await getPlaybackState(book.id);
            
            onSelectFile(book.id, {
                ...book,
                file: file,
                chapters: [], // Will be parsed from the file
                playbackPosition: playbackState?.current_position || 0,
                volume: playbackState?.volume || 1,
                speed: playbackState?.playback_speed || 1,
            });
        } catch (err) {
            console.error('Error selecting book:', err);
            setError('Failed to load book');
        }
    };

    const handleDeleteBook = async (bookId, storagePath) => {
        if (!window.confirm('Are you sure you want to delete this book?')) {
            return;
        }

        try {
            await deleteLibraryEntry(bookId, storagePath);
            setLibrary(library.filter(b => b.id !== bookId));
        } catch (err) {
            console.error('Error deleting book:', err);
            setError('Failed to delete book');
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getProgressPercentage = (book) => {
        if (!book.duration) return 0;
        return (book.playbackPosition / book.duration) * 100;
    };

    return (
        <div className="max-w-4xl mx-auto">
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded text-red-400">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-8 text-slate-400">
                    Loading library...
                </div>
            ) : library.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                    <p className="text-slate-400">No audiobooks yet. Upload one to get started!</p>
                </div>
            ) : (
                <ScrollArea className="h-[600px]">
                    <div className="space-y-3 pr-4">
                        {library.map((book) => (
                            <div
                                key={book.id}
                                className="group p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                            >
                                <div className="flex gap-4 items-start">
                                    {/* Cover Art */}
                                    {book.cover_url && (
                                        <img
                                            src={book.cover_url}
                                            alt={book.title}
                                            className="w-16 h-24 object-cover rounded flex-shrink-0"
                                        />
                                    )}

                                    {/* Book Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white truncate text-lg">{book.title}</h3>
                                        <p className="text-slate-400 text-sm truncate">{book.artist || 'Unknown Artist'}</p>
                                        <p className="text-slate-500 text-xs mt-1">{formatDuration(book.duration)}</p>

                                        {/* Progress Bar */}
                                        {book.playbackPosition > 0 && (
                                            <div className="mt-3">
                                                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all"
                                                        style={{ width: `${getProgressPercentage(book)}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {Math.floor(book.playbackPosition / 60)}m / {Math.floor(book.duration / 60)}m
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleSelectBook(book)}
                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                            title="Play book"
                                        >
                                            <Play className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteBook(book.id, book.storage_path)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete book"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
