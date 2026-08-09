import React from 'react';
import ReactDOM from 'react-dom/client';
import { SidePanelView } from '@presentation';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <SidePanelView />
    </React.StrictMode>,
  );
}
