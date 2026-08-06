import React from 'react';
import { createRoot } from 'react-dom/client';
import { createUiContainer } from '@composition/ui-container';

function PopupApp() {
  return (
    <div style={{ padding: '16px', minWidth: '300px', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0068ff' }}>Quick Zalo</h2>
      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Extension setup base successfully loaded.</p>
    </div>
  );
}

const container = createUiContainer();
void container;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
);
