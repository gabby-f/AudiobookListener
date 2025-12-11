import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../Components/ui/button';

export default function Login({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Simple hash function for password verification
    const hashPassword = async (pwd) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(pwd);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const hashedInput = await hashPassword(password);
            
            // Get stored password hash from env or use default
            // For production, set REACT_APP_PASSWORD_HASH in your .env
            const storedHash = process.env.REACT_APP_PASSWORD_HASH || 
                '3d85bd51dc4d93eeeccbd9f66dfeb9ad277ccca77513a0b0493f8f7f001b98e5'; // Default: "audiobook"
            
            console.log('Input hash:', hashedInput);
            console.log('Stored hash:', storedHash);
            console.log('Match:', hashedInput === storedHash);
            
            if (hashedInput === storedHash) {
                // Store session token
                sessionStorage.setItem('authenticated', 'true');
                localStorage.setItem('lastLogin', new Date().toISOString());
                onLogin();
            } else {
                setError('Incorrect password');
                setPassword('');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    {/* Logo/Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Audiobook Library
                    </h1>
                    <p className="text-slate-400 text-center mb-8 text-sm">
                        Enter your password to continue
                    </p>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter password"
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
