import { describe, expect, it } from 'vitest';
import { AppErrorCode } from '../../../../src/0_contracts/ipc-payloads';
import type {
  IClipboardAdapter,
  IZaloQuickActionInput,
} from '../../../../src/0_contracts/zalo-quick-action.contract';
import type {
  IZaloDOMAdapter,
  IZaloRawExtractResult,
} from '../../../../src/0_contracts/zalo-extract.contract';
import type {
  IZaloSelectionCapturedRaw,
  IZaloSelectionDOMAdapter,
} from '../../../../src/0_contracts/zalo-selection.contract';
import { ZaloQuickActionExtractorModule } from '../../../../src/3_modules/composite-modules/zalo-quick-action-extractor';
import { ZaloExtractSingleMessageModule } from '../../../../src/3_modules/sub-modules/zalo-extract-single-message';
import { ZaloMessageSanitizerModule } from '../../../../src/3_modules/sub-modules/zalo-message-sanitizer';
import { ZaloSelectionLocatorModule } from '../../../../src/3_modules/sub-modules/zalo-selection-locator';

class StubSelectionAdapter implements IZaloSelectionDOMAdapter {
  public rawSelection: IZaloSelectionCapturedRaw | null = null;
  public closestMsgElem: Element | null = null;
  public inChatView = true;
  public inInputArea = false;
  public extractedMsgId: string | null = null;

  public captureCurrentSelection(): IZaloSelectionCapturedRaw | null {
    return this.rawSelection;
  }
  public findClosestMessageElement(anchorElement: Element | null): Element | null {
    void anchorElement;
    return this.closestMsgElem;
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

class StubExtractDOMAdapter implements IZaloDOMAdapter {
  public resultToReturn: IZaloRawExtractResult | null = null;

  public extractMessageFromElement(targetElement: Element | null): IZaloRawExtractResult | null {
    void targetElement;
    return this.resultToReturn;
  }
}

class StubClipboardAdapter implements IClipboardAdapter {
  public shouldSucceed = true;
  public lastCopiedText = '';

  public writeText(text: string): Promise<boolean> {
    this.lastCopiedText = text;
    return Promise.resolve(this.shouldSucceed);
  }

  public readText(): Promise<string> {
    return Promise.resolve(this.lastCopiedText);
  }
}

describe('ZaloQuickActionExtractorModule Composite Orchestrator', () => {
  const setupModule = () => {
    const selAdapter = new StubSelectionAdapter();
    const extAdapter = new StubExtractDOMAdapter();
    const clipAdapter = new StubClipboardAdapter();

    const locatorModule = new ZaloSelectionLocatorModule(selAdapter);
    const singleExtractor = new ZaloExtractSingleMessageModule(extAdapter);
    const sanitizerModule = new ZaloMessageSanitizerModule();

    const compositeModule = new ZaloQuickActionExtractorModule(
      locatorModule,
      singleExtractor,
      sanitizerModule,
      clipAdapter
    );

    return {
      selAdapter,
      extAdapter,
      clipAdapter,
      locatorModule,
      singleExtractor,
      sanitizerModule,
      compositeModule,
    };
  };

  it('UT-ORCH-00: Trả về lỗi INVALID_PAYLOAD khi traceId bị rỗng', async () => {
    const { compositeModule } = setupModule();
    const input: IZaloQuickActionInput = {
      traceId: '',
      triggerSource: 'SHORTCUT_ON_SELECTION',
      selectedText: 'Text test',
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(false);
    expect(result.stage).toBe('COPIED');
    expect(result.error?.code).toBe(AppErrorCode.INVALID_PAYLOAD);
  });

  it('UT-ORCH-01: Bôi đen đoạn text + Bấm Alt+Q (Leo DOM xác định toàn bộ text, icon của tin nhắn)', async () => {
    const { compositeModule, selAdapter, extAdapter, clipAdapter } = setupModule();
    const dummyAnchor = { nodeName: 'SPAN' } as Element;
    const dummyBubble = { className: 'msg-item' } as Element;

    selAdapter.rawSelection = {
      selectedText: 'Căn hộ 2PN2WC',
      anchorNode: null,
      commonAncestorElement: dummyAnchor,
      boundingClientRect: { top: 10, left: 10, width: 100, height: 20 },
    };
    selAdapter.closestMsgElem = dummyBubble;
    selAdapter.extractedMsgId = 'msg-101';

    extAdapter.resultToReturn = {
      messageId: 'msg-101',
      extractedText: 'Căn hộ 2PN2WC giá 15tr/tháng. LH 0901234567 🍾🏢📍',
    };

    const input: IZaloQuickActionInput = {
      traceId: 'trace-ut-orch-01',
      triggerSource: 'SHORTCUT_ON_SELECTION',
      selectedText: 'Căn hộ 2PN2WC',
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(true);
    expect(result.stage).toBe('COPIED');
    expect(result.traceId).toBe('trace-ut-orch-01');
    expect(result.data?.isPartialSelection).toBe(false);
    expect(result.data?.messageId).toBe('msg-101');
    expect(result.data?.sanitizedText).toBe('Căn hộ 2PN2WC giá 15tr/tháng. LH 0901234567 🍾🏢📍');
    expect(result.data?.copiedToClipboard).toBe(true);
    expect(result.data?.metadata.userGestureType).toBe('KEYBOARD_GESTURE');
    expect(clipAdapter.lastCopiedText).toBe('Căn hộ 2PN2WC giá 15tr/tháng. LH 0901234567 🍾🏢📍');
  });

  it('UT-ORCH-01-B: Bôi đen đoạn text khi có cờ extractOnlySelection = true -> Chỉ trích xuất đoạn bôi đen', async () => {
    const { compositeModule, clipAdapter } = setupModule();
    const input: IZaloQuickActionInput = {
      traceId: 'trace-ut-orch-01-b',
      triggerSource: 'SHORTCUT_ON_SELECTION',
      selectedText: 'Căn hộ 2PN2WC giá 15tr/tháng. LH 0901234567 🍾🏢📍',
      filterOptions: {
        extractOnlySelection: true,
      },
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(true);
    expect(result.data?.isPartialSelection).toBe(true);
    expect(result.data?.sanitizedText).toBe('Căn hộ 2PN2WC giá 15tr/tháng. LH 0901234567 🍾🏢📍');
    expect(clipAdapter.lastCopiedText).toBe('Căn hộ 2PN2WC giá 15tr/tháng. LH 0901234567 🍾🏢📍');
  });

  it('UT-ORCH-02: Hover tin nhắn + Bấm Alt+Q (Full Message Copy)', async () => {
    const { compositeModule, extAdapter, clipAdapter } = setupModule();
    const dummyBubble = { className: 'msg-item' } as Element;

    extAdapter.resultToReturn = {
      messageId: 'msg-999',
      extractedText: 'Toàn bộ nội dung tin nhắn BĐS 🍾',
    };

    const input: IZaloQuickActionInput = {
      traceId: 'trace-ut-orch-02',
      triggerSource: 'SHORTCUT_HOVER',
      targetElement: dummyBubble,
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(true);
    expect(result.data?.isPartialSelection).toBe(false);
    expect(result.data?.messageId).toBe('msg-999');
    expect(result.data?.sanitizedText).toBe('Toàn bộ nội dung tin nhắn BĐS 🍾');
    expect(clipAdapter.lastCopiedText).toBe('Toàn bộ nội dung tin nhắn BĐS 🍾');
  });

  it('UT-ORCH-03: Click nút [📋 Copy sạch] trên Mini Floating Bar', async () => {
    const { compositeModule, selAdapter, extAdapter, clipAdapter } = setupModule();
    const dummyAnchor = { nodeName: 'SPAN' } as Element;
    const dummyBubble = { className: 'msg-item' } as Element;

    selAdapter.rawSelection = {
      selectedText: 'Văn bản chọn từ chuột 🏆',
      anchorNode: null,
      commonAncestorElement: dummyAnchor,
      boundingClientRect: { top: 10, left: 10, width: 100, height: 20 },
    };
    selAdapter.closestMsgElem = dummyBubble;

    extAdapter.resultToReturn = {
      messageId: 'msg-202',
      extractedText: 'Văn bản đầy đủ từ bong bóng tin nhắn 🏆',
    };

    const input: IZaloQuickActionInput = {
      traceId: 'trace-ut-orch-03',
      triggerSource: 'FLOATING_BAR_CLICK',
      selectedText: 'Văn bản chọn từ chuột 🏆',
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(true);
    expect(result.data?.metadata.userGestureType).toBe('CLICK_GESTURE');
    expect(result.data?.copiedToClipboard).toBe(true);
    expect(clipAdapter.lastCopiedText).toBe('Văn bản đầy đủ từ bong bóng tin nhắn 🏆');
  });

  it('UT-ORCH-04: Bẫy vùng nhập liệu (#input_chat) (Input Area Guard Gate)', async () => {
    const { compositeModule, selAdapter } = setupModule();
    const dummyElem = { nodeName: 'DIV' } as Element;

    selAdapter.rawSelection = {
      selectedText: 'Đang gõ tin dở dang trong ô chat',
      anchorNode: null,
      commonAncestorElement: dummyElem,
      boundingClientRect: null,
    };
    selAdapter.inInputArea = true;

    const input: IZaloQuickActionInput = {
      traceId: 'trace-ut-orch-04',
      triggerSource: 'SHORTCUT_ALT_Q',
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('SELECTION_INSIDE_INPUT_AREA');
  });

  it('UT-ORCH-05: Bẫy tin nhắn rỗng / chỉ có sticker (Empty Extraction Guard)', async () => {
    const { compositeModule, extAdapter } = setupModule();
    const dummyBubble = { className: 'msg-item' } as Element;

    extAdapter.resultToReturn = {
      messageId: 'msg-empty',
      extractedText: '   ',
    };

    const input: IZaloQuickActionInput = {
      traceId: 'trace-ut-orch-05',
      triggerSource: 'SHORTCUT_HOVER',
      targetElement: dummyBubble,
    };

    const result = await compositeModule.process(input);

    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('EMPTY_EXTRACTED_TEXT');
  });
});
