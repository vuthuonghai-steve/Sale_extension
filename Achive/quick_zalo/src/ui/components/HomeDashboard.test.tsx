import React from 'react';
import { describe, it, expect } from 'vitest';
import { AppShell, HomeDashboard, ModuleCard, ModulePage } from './shell';

describe('UI Shell Components Contract', () => {
  it('exports valid React components', () => {
    expect(typeof AppShell).toBe('function');
    expect(typeof HomeDashboard).toBe('function');
    expect(typeof ModuleCard).toBe('function');
    expect(typeof ModulePage).toBe('function');
  });
});
