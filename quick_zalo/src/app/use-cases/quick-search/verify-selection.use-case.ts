/**
 * @file verify-selection.use-case.ts
 * @layer Application Layer (@app/use-cases/quick-search)
 * @description UseCase verifying text selection against 2-layer match (RAM RingBuffer & Dexie DB).
 */

import { Result, ok, err } from '@shared/kernel/result';
import type { RingBufferService } from '@domain/quick-search/services/ring-buffer.service';
import type { MessageMatcherService } from '@domain/quick-search/services/message-matcher.service';
import type { IDexieMessageRepository } from '@app/ports/message-repository.port';
import type { EvlogLogger } from '@infra/logging/evlog-logger';

export class VerifyError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'VerifyError';
  }
}

export interface VerifySelectionPayload {
  selectionText: string;
  targetElement?: HTMLElement | null;
}

export type VerifySelectionResponse =
  | { type: 'SILENT_PASS_THROUGH' }
  | { type: 'SILENT_IDLE' }
  | { type: 'SHOW_TOAST_WARNING'; message: string; durationMs: number }
  | { type: 'SHOW_TOAST_INFO'; message: string; durationMs: number }
  | { type: 'SHOW_TOAST_ERROR'; message: string; durationMs: number }
  | {
      type: 'SHOW_CENTER_ALERT_MODAL';
      title: string;
      message: string;
      details?: string;
      matchType?: string;
      durationMs: number;
    }
  | { type: 'SHOW_SUCCESS_TOAST'; message: string; durationMs: number };

export interface VerifySelectionUseCaseDeps {
  isFullExtractionEnabledFn: () => boolean;
  ringBufferService: RingBufferService;
  messageMatcherService: MessageMatcherService;
  messageRepository: IDexieMessageRepository;
  logger?: EvlogLogger;
}

export class VerifySelectionUseCase {
  private readonly isFullExtractionEnabledFn: () => boolean;
  private readonly ringBufferService: RingBufferService;
  private readonly messageMatcherService: MessageMatcherService;
  private readonly messageRepository: IDexieMessageRepository;
  private readonly logger?: EvlogLogger;

  constructor(
    isFullExtractionOrDeps: (() => boolean) | VerifySelectionUseCaseDeps,
    ringBufferService?: RingBufferService,
    messageMatcherService?: MessageMatcherService,
    messageRepository?: IDexieMessageRepository,
    logger?: EvlogLogger
  ) {
    if (typeof isFullExtractionOrDeps === 'function') {
      this.isFullExtractionEnabledFn = isFullExtractionOrDeps;
      this.ringBufferService = ringBufferService!;
      this.messageMatcherService = messageMatcherService!;
      this.messageRepository = messageRepository!;
      this.logger = logger;
    } else {
      this.isFullExtractionEnabledFn = isFullExtractionOrDeps.isFullExtractionEnabledFn;
      this.ringBufferService = isFullExtractionOrDeps.ringBufferService;
      this.messageMatcherService = isFullExtractionOrDeps.messageMatcherService;
      this.messageRepository = isFullExtractionOrDeps.messageRepository;
      this.logger = isFullExtractionOrDeps.logger;
    }
  }

  public async execute(
    payload: VerifySelectionPayload
  ): Promise<Result<VerifySelectionResponse, VerifyError>> {
    try {
      // IF-01: Check if full extraction mode is ON
      if (this.isFullExtractionEnabledFn()) {
        this.logger?.info(
          '@app/quick-search/verify-selection',
          'IF-01: Full extraction enabled, pass-through',
          { selectionText: payload.selectionText }
        );
        return ok({ type: 'SILENT_PASS_THROUGH' });
      }

      const trimmedText = payload.selectionText ? payload.selectionText.trim() : '';

      // IF-02: Empty selection
      if (!trimmedText) {
        this.logger?.info(
          '@app/quick-search/verify-selection',
          'IF-02: Selection text empty, idle',
          { selectionText: payload.selectionText }
        );
        return ok({ type: 'SILENT_IDLE' });
      }

      // IF-03: Selection < 2 chars
      if (trimmedText.length < 2) {
        this.logger?.warn(
          '@app/quick-search/verify-selection',
          'IF-03: Selection text length < 2',
          { selectionText: payload.selectionText, length: trimmedText.length }
        );
        return ok({
          type: 'SHOW_TOAST_WARNING',
          message: '⚠️ Cần bôi đen tối thiểu 2 ký tự để tìm kiếm & đối chiếu.',
          durationMs: 1500,
        });
      }

      // Layer 1 matching
      let matchedEntity = this.messageMatcherService.match(
        trimmedText,
        payload.targetElement ?? null,
        this.ringBufferService.getSnapshot()
      );

      if (!matchedEntity) {
        matchedEntity = this.messageMatcherService.extractOnTheFlyFromDOM(payload.targetElement ?? null);
      }

      // IF-04: Not matched in RAM or DOM
      if (!matchedEntity) {
        this.logger?.info(
          '@app/quick-search/verify-selection',
          'IF-04: Matcher found no match',
          { selectionText: payload.selectionText }
        );
        return ok({
          type: 'SHOW_TOAST_INFO',
          message: 'ℹ️ Tin nhắn quá cũ hoặc không nằm trong khu vực chat Zalo.',
          durationMs: 2000,
        });
      }

      // Layer 2 verification: Step 1 Address + Price
      const addressPriceResult = await this.messageRepository.findByAddressAndPrice(
        null,
        null,
        matchedEntity.rawContent
      );

      if (addressPriceResult.isErr) {
        return ok({
          type: 'SHOW_TOAST_ERROR',
          message: '⚠️ Không thể kết nối CSDL IndexedDB. Đã bật chế độ xem nhanh ngầm định.',
          durationMs: 3000,
        });
      }

      if (addressPriceResult.value.found) {
        return ok({
          type: 'SHOW_CENTER_ALERT_MODAL',
          title: '⚠️ PHÁT HIỆN TIN NHẮN TRÙNG LẶP',
          message: 'Khớp Địa chỉ + Giá tiền trong CSDL',
          details: addressPriceResult.value.details,
          matchType: addressPriceResult.value.matchType,
          durationMs: 2500,
        });
      }

      // Step 2 Raw Data check
      const rawDataResult = await this.messageRepository.findByRawData(
        matchedEntity.rawContent,
        matchedEntity.hash
      );

      if (rawDataResult.isErr) {
        return ok({
          type: 'SHOW_TOAST_ERROR',
          message: '⚠️ Không thể kết nối CSDL IndexedDB. Đã bật chế độ xem nhanh ngầm định.',
          durationMs: 3000,
        });
      }

      if (rawDataResult.value.found) {
        return ok({
          type: 'SHOW_CENTER_ALERT_MODAL',
          title: '⚠️ PHÁT HIỆN TIN NHẮN TRÙNG LẶP',
          message: 'Khớp Nội dung thô Data Raw trong CSDL',
          details: rawDataResult.value.details,
          matchType: rawDataResult.value.matchType,
          durationMs: 2500,
        });
      }

      // Step 2b Hash check fallback
      if (this.messageRepository.findByHash) {
        const hashResult = await this.messageRepository.findByHash(matchedEntity.hash);
        if (hashResult && hashResult.isErr) {
          return ok({
            type: 'SHOW_TOAST_ERROR',
            message: '⚠️ Không thể kết nối CSDL IndexedDB. Đã bật chế độ xem nhanh ngầm định.',
            durationMs: 3000,
          });
        }
        if (hashResult && hashResult.isOk && hashResult.value !== null) {
          return ok({
            type: 'SHOW_CENTER_ALERT_MODAL',
            title: '⚠️ PHÁT HIỆN TIN NHẮN TRÙNG LẶP',
            message: 'Tin nhắn đã tồn tại trong CSDL',
            durationMs: 2500,
          });
        }
      }

      // Step 3 Not found (Happy Path)
      return ok({
        type: 'SHOW_SUCCESS_TOAST',
        message: '✅ TIN NHẮN MỚI HỢP LỆ (Chưa có trong CSDL)',
        durationMs: 1500,
      });
    } catch (error) {
      this.logger?.log(
        '@app/quick-search/verify-selection',
        'FATAL',
        'Unexpected error in VerifySelectionUseCase',
        { selectionText: payload.selectionText },
        error instanceof Error ? error : new Error(String(error))
      );
      return err(new VerifyError('Unexpected error in VerifySelectionUseCase', error));
    }
  }
}
