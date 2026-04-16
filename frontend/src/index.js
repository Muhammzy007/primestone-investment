import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Global error handler with line numbers
window.addEventListener('error', (event) => {
  console.error('Error caught:', event.error);
  document.body.innerHTML = `
    <div style="padding:20px; background:#fee; color:#c00; border:2px solid #c00; margin:20px; font-family:monospace; white-space:pre-wrap;">
      <h2>❌ JavaScript Error</h2>
      <p><strong>Message:</strong> ${event.error?.message || event.message}</p>
      <p><strong>File:</strong> ${event.filename}</p>
      <p><strong>Line:</strong> ${event.lineno}</p>
      <p><strong>Column:</strong> ${event.colno}</p>
      <p><strong>Stack:</strong></p>
      <pre>${event.error?.stack || 'No stack trace'}</pre>
    </div>
  `;
  return false;
});

// Try to load the app
try {
  const App = require('./App').default;
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  document.body.innerHTML = `
    <div style="padding:20px; background:#fee; color:#c00; border:2px solid #c00; margin:20px; font-family:monospace;">
      <h2>❌ Failed to Load App</h2>
      <pre>${error.toString()}</pre>
      <pre>${error.stack || ''}</pre>
    </div>
  `;
}
