import React from 'react';
import { createRoot } from 'react-dom/client';
import { createSidepanelContainer } from '@composition/sidepanel-container';

function SidepanelApp() {
  return (
    <div style={{ padding: '16px', height: '100vh', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0068ff' }}>Quick Zalo Sidepanel</h2>
        <span style={{ fontSize: '12px', color: '#888' }}>Sales Workspace & Automation</span>
      </header>
      <main>
        <p style={{ fontSize: '14px', color: '#444' }}>
          Sidepanel interface loaded successfully. Ready for Zalo CRM & Message handling.
        </p>
      </main>
    </div>
  );
}

const container = createSidepanelContainer();
void container;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidepanelApp />
  </React.StrictMode>,
);
