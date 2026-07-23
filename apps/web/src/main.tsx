import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/globals.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--font-size-sm)',
            },
            success: {
              iconTheme: { primary: 'var(--color-success)', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: 'var(--color-danger)', secondary: 'white' },
            },
          }}
        />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
