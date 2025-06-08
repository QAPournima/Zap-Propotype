import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}

if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  worker.start().then(renderApp);
} else {
  renderApp();
} 