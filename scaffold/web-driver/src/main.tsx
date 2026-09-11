import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import RootErrorBoundary from './components/RootErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootErrorBoundary appName="Driver">
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
