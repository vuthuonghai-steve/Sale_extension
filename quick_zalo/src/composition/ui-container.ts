import { RuntimeMessageBus } from '@infra/browser/runtime-bus';

export function createUiContainer() {
  const bus = new RuntimeMessageBus();
  return {
    bus,
  };
}
