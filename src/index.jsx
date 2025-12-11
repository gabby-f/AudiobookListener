import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AudiobookPage from './pages/Audiobook';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <AudiobookPage />
    </React.StrictMode>
);
