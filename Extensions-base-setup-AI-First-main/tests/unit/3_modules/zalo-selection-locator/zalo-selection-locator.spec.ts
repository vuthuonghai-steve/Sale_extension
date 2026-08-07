import { describe, expect, it } from 'vitest';
import { AppErrorCode } from '../../../../src/0_contracts/ipc-payloads';
import type {
  IZaloSelectionCapturedRaw,
  IZaloSelectionDOMAdapter,
} from '../../../../src/0_contracts/zalo-selection.contract';
import {
  locateZaloSelection,
  ZaloSelectionLocatorModule,
} from '../../../../src/3_modules/sub-modules/zalo-selection-locator';

class StubZaloSelectionAdapter implements IZaloSelectionDOMAdapter {
  public rawSelection: IZaloSelectionCapturedRaw | null = null;
  public closestMessageElem: Element | null = null;
  public inChatView = true;
  public inInputArea = false;
  public extractedMsgId: string | null = null;

  public captureCurrentSelection(): IZaloSelectionCapturedRaw | null {
    return this.rawSelection;
  }

  public findClosestMessageElement(anchorElement: Element | null): Element | null {
    void anchorElement;
    return this.closestMessageElem;
  }

  public isWithinChatView(element: Element | null): boolean {
    void element;
    return this.inChatView;
  }

  public isInputArea(element: Element | null): boolean {
    void element;
    return this.inInputArea;
  }

  public extractMessageId(element: Element | null): string | null {
    void element;
    return this.extractedMsgId;
  }
}

describe('ZaloSelectionLocatorModule', () => {
  it('trả về lỗi INVALID_PAYLOAD khi traceId bị thiếu', async () => {
    const adapter = new StubZaloSelectionAdapter();
    const module = new ZaloSelectionLocatorModule(adapter);

    const result = await module.process({
      traceId: '',
    });

    expect(result.success).toBe(false);
    expect(result.stage).toBe('LOCATED');
    expect(result.error?.code).toBe(AppErrorCode.INVALID_PAYLOAD);
  });

  it('trả về isValidSelection = false khi không có bôi đen hoặc văn bản rỗng', async () => {
    const adapter = new StubZaloSelectionAdapter();
    adapter.rawSelection = {
      selectedText: '   ',
      anchorNode: null,
      commonAncestorElement: null,
      boundingClientRect: null,
    };

    const module = new ZaloSelectionLocatorModule(adapter);
    const result = await module.process({
      traceId: 'tr-sel-001',
    });

    expect(result.success).toBe(true);
    expect(result.stage).toBe('LOCATED');
    expect(result.data?.isValidSelection).toBe(false);
    expect(result.data?.targetElement).toBeNull();
  });

  it('loại trừ bôi đen trong khung nhập liệu (#input_chat)', async () => {
    const adapter = new StubZaloSelectionAdapter();
    const dummyElem = { nodeName: 'DIV' } as Element;
    adapter.rawSelection = {
      selectedText: 'Đang gõ tin nhắn',
      anchorNode: null,
      commonAncestorElement: dummyElem,
      boundingClientRect: { top: 10, left: 10, width: 50, height: 20 },
    };
    adapter.inInputArea = true;

    const module = new ZaloSelectionLocatorModule(adapter);
    const result = await module.process({
      traceId: 'tr-sel-002',
    });

    expect(result.success).toBe(true);
    expect(result.data?.isValidSelection).toBe(false);
    expect(result.data?.metadata.isInputArea).toBe(true);
  });

  it('loại trừ bôi đen ngoài khu vực Chat View', async () => {
    const adapter = new StubZaloSelectionAdapter();
    const dummyElem = { nodeName: 'DIV' } as Element;
    adapter.rawSelection = {
      selectedText: 'Văn bản trên menu cài đặt',
      anchorNode: null,
      commonAncestorElement: dummyElem,
      boundingClientRect: null,
    };
    adapter.inChatView = false;
    adapter.inInputArea = false;

    const module = new ZaloSelectionLocatorModule(adapter);
    const result = await module.process({
      traceId: 'tr-sel-003',
    });

    expect(result.success).toBe(true);
    expect(result.data?.isValidSelection).toBe(false);
    expect(result.data?.metadata.isWithinChatView).toBe(false);
  });

  it('định vị thành công targetElement và messageId khi bôi đen trong bong bóng tin nhắn hợp lệ', async () => {
    const adapter = new StubZaloSelectionAdapter();
    const anchorElem = { nodeName: 'SPAN' } as Element;
    const targetMsgElem = { className: 'msg-item chat-bubble' } as Element;

    adapter.rawSelection = {
      selectedText: 'Xin chào Zalo Web',
      anchorNode: null,
      commonAncestorElement: anchorElem,
      boundingClientRect: { top: 100, left: 200, width: 120, height: 24 },
    };
    adapter.closestMessageElem = targetMsgElem;
    adapter.extractedMsgId = 'msg-12345';
    adapter.inChatView = true;
    adapter.inInputArea = false;

    const module = new ZaloSelectionLocatorModule(adapter);
    const result = await module.process({
      traceId: 'tr-sel-004',
    });

    expect(result.success).toBe(true);
    expect(result.data?.isValidSelection).toBe(true);
    expect(result.data?.targetElement).toBe(targetMsgElem);
    expect(result.data?.messageId).toBe('msg-12345');
    expect(result.data?.selectedText).toBe('Xin chào Zalo Web');
    expect(result.data?.boundingClientRect).toEqual({ top: 100, left: 200, width: 120, height: 24 });
    expect(result.data?.metadata.isWithinChatView).toBe(true);
    expect(result.data?.metadata.isInputArea).toBe(false);
    expect(result.data?.metadata.containerClass).toBe('msg-item chat-bubble');
  });

  it('helper locateZaloSelection chạy đúng quy trình', async () => {
    const adapter = new StubZaloSelectionAdapter();
    const anchorElem = { nodeName: 'SPAN' } as Element;
    adapter.rawSelection = {
      selectedText: 'Test helper',
      anchorNode: null,
      commonAncestorElement: anchorElem,
      boundingClientRect: null,
    };
    adapter.inChatView = true;
    adapter.inInputArea = false;

    const result = await locateZaloSelection(adapter, {
      traceId: 'tr-sel-005',
    });

    expect(result.success).toBe(true);
    expect(result.data?.isValidSelection).toBe(true);
    expect(result.data?.selectedText).toBe('Test helper');
  });
});
