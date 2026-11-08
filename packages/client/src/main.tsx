import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// 운영에서는 nginx SSI가 <title>을 넣는다. dev(Vite)처럼 비어 있을 때만 기본값을 쓴다
if (!document.title) document.title = 'Seoul Vibe';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
