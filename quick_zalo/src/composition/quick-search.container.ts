/**
 * @file quick-search.container.ts
 * @layer Composition Layer (@composition)
 * @description Dependency Injection Container wiring components for Quick Search feature.
 */

import { InMemoryEventBusAdapter } from '@infra/events/in-memory-event-bus.adapter';
import { RingBufferService } from '@domain/quick-search/services/ring-buffer.service';
import { MessageMatcherService } from '@domain/quick-search/services/message-matcher.service';
import { VerifySelectionUseCase } from '@app/use-cases/quick-search/verify-selection.use-case';
import { UIOverlayController } from '../ui/controllers/ui-overlay.controller';
import { DOMSelectionListener } from '@infra/listeners/dom-selection.listener';
import type { IDexieMessageRepository } from '@app/ports/message-repository.port';
import { MESSAGE_EVENT_TYPES, MessageCapturedPayload, ConversationChangedPayload } from '@shared/contracts/events/message-events.contract';

export interface BootstrapQuickSearchOptions {
  messageRepository: IDexieMessageRepository;
  isFullExtractionEnabled?: () => boolean;
  debounceMs?: number;
  capacity?: number;
}

export class QuickSearchContainerInstance {
  public readonly eventBus: InMemoryEventBusAdapter;
  public readonly ringBufferService: RingBufferService;
  public readonly messageMatcherService: MessageMatcherService;
  public readonly messageRepository: IDexieMessageRepository;
  public readonly verifySelectionUseCase: VerifySelectionUseCase;
  public readonly uiOverlayController: UIOverlayController;
  public readonly domSelectionListener: DOMSelectionListener;
  private readonly isFullExtractionFn: () => boolean;

  constructor(options: BootstrapQuickSearchOptions) {
    this.eventBus = new InMemoryEventBusAdapter();
    this.ringBufferService = new RingBufferService(options.capacity ?? 10);
    this.messageMatcherService = new MessageMatcherService();
    this.messageRepository = options.messageRepository;
    this.isFullExtractionFn = options.isFullExtractionEnabled ?? (() => false);

    this.uiOverlayController = new UIOverlayController();

    if (!this.isFullExtractionFn()) {
      this.uiOverlayController.mountModeBadge('Quick Search Active');
    } else {
      this.uiOverlayController.unmountModeBadge();
    }

    this.verifySelectionUseCase = new VerifySelectionUseCase({
      isFullExtractionEnabledFn: this.isFullExtractionFn,
      ringBufferService: this.ringBufferService,
      messageMatcherService: this.messageMatcherService,
      messageRepository: this.messageRepository,
    });

    // Subscribe to MESSAGE_CAPTURED events
    this.eventBus.subscribe<MessageCapturedPayload>(MESSAGE_EVENT_TYPES.MESSAGE_CAPTURED, (payload: MessageCapturedPayload) => {
      const sanitized = payload.rawContent.toLowerCase();
      const hash = `hash_${sanitized}`;
      this.ringBufferService.push({
        id: `msg_${payload.timestamp}`,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        rawContent: payload.rawContent,
        sanitizedContent: sanitized,
        hash,
        capturedAt: payload.timestamp,
      });
    });

    // Subscribe to CONVERSATION_CHANGED events
    this.eventBus.subscribe<ConversationChangedPayload>(MESSAGE_EVENT_TYPES.CONVERSATION_CHANGED, () => {
      this.ringBufferService.clear();
    });

    // Setup DOMSelectionListener
    this.domSelectionListener = new DOMSelectionListener(
      async (selectionPayload) => {
        const result = await this.verifySelectionUseCase.execute({
          selectionText: selectionPayload.selectionFragment,
          targetElement: selectionPayload.targetElement,
        });

        if (result.isOk) {
          const action = result.value;
          if (action.type === 'SHOW_CENTER_ALERT_MODAL') {
            this.uiOverlayController.showCenterAlert(action, action.durationMs);
          } else if (action.type === 'SHOW_SUCCESS_TOAST') {
            this.uiOverlayController.showSuccessToast(action.message, action.durationMs);
          }
        }
      },
      document.body,
      options.debounceMs ?? 150
    );
  }

  public destroy(): void {
    this.domSelectionListener.stop();
    this.ringBufferService.clear();
    this.uiOverlayController.destroy();
    if (activeInstance === this) {
      activeInstance = null;
    }
  }
}

let activeInstance: QuickSearchContainerInstance | null = null;

export function bootstrapQuickSearchContainer(
  options: BootstrapQuickSearchOptions
): QuickSearchContainerInstance {
  if (activeInstance) {
    return activeInstance;
  }
  activeInstance = new QuickSearchContainerInstance(options);
  return activeInstance;
}

export function isQuickSearchContainerInitialized(): boolean {
  return activeInstance !== null;
}

export function getQuickSearchContainerInstance(): QuickSearchContainerInstance | null {
  return activeInstance;
}
