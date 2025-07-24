import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './App.css';
import { attachConsole } from '@tauri-apps/plugin-log';

// Attach console for logging
attachConsole().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);