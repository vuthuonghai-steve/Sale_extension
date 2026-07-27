import { RuntimeMessageBus } from '@infra/browser/runtime-bus';
import { createConfigContainer } from './config-container';

export function createSidepanelContainer() {
  const bus = new RuntimeMessageBus();
  const config = createConfigContainer();
  return {
    bus,
    config,
  };
}

