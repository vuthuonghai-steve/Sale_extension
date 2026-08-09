import { defineContentScript } from '#imports';
import { logger } from '@platform/telemetry/logger.ts';
import { createTraceId } from '@platform/ipc/ipc-bus.ts';
import { IPC_ACTIONS, type IpcMessageEnvelope, type FormFieldDescriptor } from '@contracts';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    const traceId = createTraceId();
    logger.info('ContentScript', 'Forms content script injected', { url: window.location.href }, traceId);

    chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
      const envelope = message as IpcMessageEnvelope;
      if (!envelope || !envelope.action) return false;

      const reqTraceId = envelope.traceId || createTraceId();

      if (envelope.action === IPC_ACTIONS.FORM_EXTRACT_REQUEST) {
        logger.info('ContentScript', 'Extracting form fields from DOM', {}, reqTraceId);

        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        const fields: FormFieldDescriptor[] = inputs.map((el, idx) => {
          const inputEl = el as HTMLInputElement;
          const labelEl = document.querySelector(`label[for="${inputEl.id}"]`);
          const fallbackLabel = inputEl.getAttribute('aria-label') || inputEl.title || inputEl.name || `Field ${idx + 1}`;
          const labelText = labelEl?.textContent?.trim() || fallbackLabel;

          return {
            id: inputEl.id || `field_${idx}`,
            name: inputEl.name || `field_${idx}`,
            label: labelText,
            type: (inputEl.type as FormFieldDescriptor['type']) || 'text',
            required: inputEl.required || false,
            currentValue: inputEl.value,
          };
        });

        sendResponse({
          data: {
            url: window.location.href,
            title: document.title,
            fields,
            extractedAt: Date.now(),
          },
        });
        return true;
      }

      if (envelope.action === IPC_ACTIONS.FORM_FILL_REQUEST) {
        logger.info('ContentScript', 'Filling form fields in DOM', { payload: envelope.payload }, reqTraceId);
        const payload = envelope.payload as { instructions?: Array<{ fieldId: string; value: string }> };
        let count = 0;

        if (payload?.instructions) {
          for (const item of payload.instructions) {
            const el = document.getElementById(item.fieldId) as HTMLInputElement | null;
            if (el && item.value !== undefined) {
              el.value = String(item.value);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              count++;
            }
          }
        }

        sendResponse({
          result: {
            success: true,
            filledFieldsCount: count,
            failedFields: [],
          },
        });
        return true;
      }

      return false;
    });
  },
});
