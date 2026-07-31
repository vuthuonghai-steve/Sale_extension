/**
 * @file extract-message.use-case.ts
 * @layer Application Layer (@app/features/message-extraction)
 * @description Use case trích xuất tin nhắn: luôn phát MESSAGE_CAPTURED lên Event Bus,
 * chỉ lưu IndexedDB khi Full Extraction được bật (isFullExtractionEnabled).
 */

import type { IEventBus } from '@shared/kernel/event-bus.interface';
import type { IMessageRepository } from '@app/ports/message-repository.port';
import { MESSAGE_EVENT_TYPES } from '@shared/contracts/events/message-events.contract';
import type { MessageCapturedPayload } from '@shared/contracts/events/message-events.contract';
import { ok, err } from '@shared/kernel/result';
import type { Result } from '@shared/kernel/result';
import type { AppError } from '@shared/contracts/errors';
import { DataNormalizationService } from '@domain/data-normalization/services/normalization.service';

export interface ExtractMessageInput {
  rawContent: string;
  senderId: string;
  conversationId: string;
  isFullExtractionEnabled: boolean;
}

export interface ExtractMessageOutput {
  isFullExtracted: boolean;
  savedMessageId?: string;
}

export class ExtractMessageUseCase {
  private readonly normalizer = new DataNormalizationService();

  constructor(
    private readonly deps: {
      eventBus: IEventBus;
      messageRepository: IMessageRepository;
    },
  ) {}

  public async execute(input: ExtractMessageInput): Promise<Result<ExtractMessageOutput, AppError>> {
    const payload: MessageCapturedPayload = {
      rawContent: input.rawContent,
      senderId: input.senderId,
      timestamp: Date.now(),
      conversationId: input.conversationId,
    };
    this.deps.eventBus.publish(MESSAGE_EVENT_TYPES.MESSAGE_CAPTURED, payload);

    if (!input.isFullExtractionEnabled) {
      return ok({ isFullExtracted: false });
    }

    const normalized = this.normalizer.normalize({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      data_raw: input.rawContent,
    });

    const saveResult = await this.deps.messageRepository.save(normalized);
    if (saveResult.isErr) {
      return err<AppError, ExtractMessageOutput>(saveResult.error);
    }

    return ok({ isFullExtracted: true, savedMessageId: saveResult.value.id });
  }
}
