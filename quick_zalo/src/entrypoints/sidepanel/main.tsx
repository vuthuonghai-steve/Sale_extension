import React from 'react';
import { createRoot } from 'react-dom/client';
import { createSidepanelContainer } from '@composition/sidepanel-container';
import { SidepanelApp } from '@features/message-extraction/ui/SidepanelApp';
import { ErrorBoundary } from '@/ui/components/ErrorBoundary';
import '@/ui/style.css';

const container = createSidepanelContainer();
void container;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SidepanelApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
