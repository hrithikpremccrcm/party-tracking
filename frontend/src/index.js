import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AppProvider>
      <App />
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid #ff6b6b',
          fontFamily: "'Righteous', cursive",
        }
      }} />
    </AppProvider>
  </BrowserRouter>
);
