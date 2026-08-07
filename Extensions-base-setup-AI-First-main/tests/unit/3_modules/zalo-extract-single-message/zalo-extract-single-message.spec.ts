import { describe, expect, it } from 'vitest';
import { AppErrorCode } from '../../../../src/0_contracts/ipc-payloads';
import type { IZaloDOMAdapter, IZaloRawExtractResult } from '../../../../src/0_contracts/zalo-extract.contract';
import {
  extractSingleMessage,
  ZaloExtractSingleMessageModule,
} from '../../../../src/3_modules/sub-modules/zalo-extract-single-message';
import extractFixtures from './fixtures.json';

class StubZaloDOMAdapter implements IZaloDOMAdapter {
  constructor(private stubResult: IZaloRawExtractResult | null = null) {}

  public setStubResult(result: IZaloRawExtractResult | null) {
    this.stubResult = result;
  }

  public extractMessageFromElement(targetElement: Element | null): IZaloRawExtractResult | null {
    void targetElement;
    return this.stubResult;
  }
}

describe('ZaloExtractSingleMessageModule', () => {
  it('trả về lỗi INVALID_PAYLOAD khi targetElement bị thiếu', async () => {
    const adapter = new StubZaloDOMAdapter();
    const module = new ZaloExtractSingleMessageModule(adapter);

    const result = await module.process({
      traceId: 'tr-test-001',
      targetElement: null,
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe('EXTRACTED');
    expect(result.error?.code).toBe(AppErrorCode.INVALID_PAYLOAD);
    expect(result.data).toBeNull();
  });

  it('trả về lỗi NOT_FOUND khi adapter không trích xuất được text', async () => {
    const adapter = new StubZaloDOMAdapter(null);
    const module = new ZaloExtractSingleMessageModule(adapter);

    const dummyElem = {} as Element;
    const result = await module.process({
      traceId: 'tr-test-002',
      targetElement: dummyElem,
    });

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(AppErrorCode.NOT_FOUND);
  });

  it('trích xuất thành công tin nhắn chứa \\n và emoji Unicode', async () => {
    const mockText = extractFixtures.sampleText;
    const adapter = new StubZaloDOMAdapter({
      messageId: 'msg-999',
      extractedText: mockText,
      containerClass: 'msg-item msg-text-bubble',
    });
    const module = new ZaloExtractSingleMessageModule(adapter);

    const dummyElem = {} as Element;
    const result = await module.process({
      traceId: 'tr-test-003',
      targetElement: dummyElem,
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe('EXTRACTED');
    expect(result.data?.messageId).toBe('msg-999');
    expect(result.data?.extractedText).toBe(mockText);
    expect(result.metadata.hasEmoji).toBe(true);
    expect(result.metadata.hasNewline).toBe(true);
    expect(result.metadata.textLength).toBe(mockText.length);
    expect(result.metadata.containerClass).toBe('msg-item msg-text-bubble');
    expect(result.error).toBeNull();
  });

  it('helper extractSingleMessage hoạt động tương tự class', async () => {
    const mockText = extractFixtures.simpleText;
    const adapter = new StubZaloDOMAdapter({
      messageId: 'msg-100',
      extractedText: mockText,
    });

    const dummyElem = {} as Element;
    const result = await extractSingleMessage(adapter, {
      traceId: 'tr-test-004',
      targetElement: dummyElem,
    });

    expect(result.success).toBe(true);
    expect(result.data?.extractedText).toBe(mockText);
  });
});
