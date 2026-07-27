import { RuntimeMessageBus } from '@infra/browser/runtime-bus';

export function createSidepanelContainer() {
  const bus = new RuntimeMessageBus();
  return {
    bus,
  };
}
