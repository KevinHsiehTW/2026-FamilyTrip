import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeFirebase } from './firebase';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize Firebase before rendering the app
// This ensures we have the config loaded (or failed gracefully)
initializeFirebase().then(() => {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
});