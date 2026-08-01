/**
 * @file quick-search.container.ts
 * @layer Composition Layer (@composition)
 * @description Dependency Injection Container wiring components for Quick Search feature.
 */

import { RingBufferService } from '@domain/quick-search/services/ring-buffer.service';
import { MessageMatcherService } from '@domain/quick-search/services/message-matcher.service';
import { VerifySelectionUseCase } from '@app/use-cases/quick-search/verify-selection.use-case';
import { UIOverlayController } from '@ui/controllers/ui-overlay.controller';
import { DOMSelectionListener } from '@infra/listeners/dom-selection.listener';
import type { IDexieMessageRepository } from '@app/ports/message-repository.port';
import type { IEventBus, UnsubscribeFn } from '@shared/kernel/event-bus.interface';
import type { ILogger } from '@app/ports/logger.port';
import { MESSAGE_EVENT_TYPES, MessageCapturedPayload, ConversationChangedPayload } from '@shared/contracts/events/message-events.contract';
import { Evlog } from '../infra/logging';

export interface BootstrapQuickSearchOptions {
  messageRepository: IDexieMessageRepository;
  eventBus: IEventBus;
  logger?: ILogger;
  isFullExtractionEnabled?: () => boolean;
  debounceMs?: number;
  capacity?: number;
}

export class QuickSearchContainerInstance {
  public readonly eventBus: IEventBus;
  public readonly ringBufferService: RingBufferService;
  public readonly messageMatcherService: MessageMatcherService;
  public readonly messageRepository: IDexieMessageRepository;
  public readonly verifySelectionUseCase: VerifySelectionUseCase;
  public readonly uiOverlayController: UIOverlayController;
  public readonly domSelectionListener: DOMSelectionListener;
  private readonly isFullExtractionFn: () => boolean;
  private readonly unsubscribeMessageCaptured: UnsubscribeFn;
  private readonly unsubscribeConversationChanged: UnsubscribeFn;

  constructor(options: BootstrapQuickSearchOptions) {
    this.eventBus = options.eventBus;
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
      logger: options.logger,
    });

    // Subscribe to MESSAGE_CAPTURED events
    this.unsubscribeMessageCaptured = this.eventBus.subscribe<MessageCapturedPayload>(
      MESSAGE_EVENT_TYPES.MESSAGE_CAPTURED,
      (payload: MessageCapturedPayload) => {
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
        Evlog.info('@composition/quick-search', 'Ring buffer push from MESSAGE_CAPTURED', {
          conversationId: payload.conversationId,
          bufferSize: this.ringBufferService.getSnapshot().length,
        });
      }
    );

    // Subscribe to CONVERSATION_CHANGED events
    this.unsubscribeConversationChanged = this.eventBus.subscribe<ConversationChangedPayload>(
      MESSAGE_EVENT_TYPES.CONVERSATION_CHANGED,
      (payload: ConversationChangedPayload) => {
        this.ringBufferService.clear();
        Evlog.info('@composition/quick-search', 'Ring buffer cleared on conversation change', {
          conversationId: payload.conversationId,
        });
      }
    );

    // Setup DOMSelectionListener
    this.domSelectionListener = new DOMSelectionListener(
      async (selectionPayload) => {
        const result = await this.verifySelectionUseCase.execute({
          selectionText: selectionPayload.selectionFragment,
          targetElement: selectionPayload.targetElement,
        });

        if (result.isOk) {
          const action = result.value;
          switch (action.type) {
            case 'SHOW_TOAST_WARNING':
              this.uiOverlayController.showToastWarning(action.message, action.durationMs);
              break;
            case 'SHOW_TOAST_INFO':
              this.uiOverlayController.showToastInfo(action.message, action.durationMs);
              break;
            case 'SHOW_TOAST_ERROR':
              this.uiOverlayController.showToastError(action.message, action.durationMs);
              break;
            case 'SHOW_CENTER_ALERT_MODAL':
              this.uiOverlayController.showCenterAlert(action, action.durationMs);
              break;
            case 'SHOW_SUCCESS_TOAST':
              this.uiOverlayController.showSuccessToast(action.message, action.durationMs);
              break;
            case 'SILENT_PASS_THROUGH':
            case 'SILENT_IDLE':
              break;
          }
        }
      },
      document.body,
      options.debounceMs ?? 150
    );

    Evlog.info('@composition/quick-search', 'QuickSearchContainer bootstrapped', {
      isFullExtractionEnabled: this.isFullExtractionFn(),
    });
  }

  public destroy(): void {
    this.unsubscribeMessageCaptured();
    this.unsubscribeConversationChanged();
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
