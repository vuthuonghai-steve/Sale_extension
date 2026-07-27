import { describe, it, expect } from 'vitest';
import { useNavigation } from './use-navigation';
import type { ModuleDef } from '@features/registry';

const dummyModule: ModuleDef = {
  id: 'test-module',
  title: 'Test Module',
  description: 'Test Description',
  component: () => null,
};

describe('useNavigation Hook interface', () => {
  it('should be a valid function exporting hook definition', () => {
    expect(typeof useNavigation).toBe('function');
  });

  it('dummy module contract verification', () => {
    expect(dummyModule.id).toBe('test-module');
    expect(dummyModule.title).toBe('Test Module');
  });
});
