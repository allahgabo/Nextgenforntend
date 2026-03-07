import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
// StrictMode removed — it double-invokes handlers in dev, causing duplicate API calls
root.render(<App />);
