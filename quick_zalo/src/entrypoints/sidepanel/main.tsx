import React from 'react';
import { createRoot } from 'react-dom/client';
import { createSidepanelContainer } from '@composition/sidepanel-container';
import { AppShell, ErrorBoundary } from '@/ui/components';
import '@/ui/style.css';

const container = createSidepanelContainer();
void container;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  </React.StrictMode>,
);
