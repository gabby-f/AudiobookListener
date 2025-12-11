import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AudiobookPage from './pages/Audiobook';
import Login from './Components/Login';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Check if user is already logged in
    useEffect(() => {
        const authenticated = sessionStorage.getItem('authenticated');
        if (authenticated === 'true') {
            setIsAuthenticated(true);
        }
        setIsChecking(false);
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authenticated');
        setIsAuthenticated(false);
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return <AudiobookPage onLogout={handleLogout} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
