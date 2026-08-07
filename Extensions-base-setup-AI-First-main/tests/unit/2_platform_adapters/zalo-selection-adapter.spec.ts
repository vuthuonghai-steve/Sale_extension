// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ZaloSelectionDOMAdapter } from '../../../src/2_platform_adapters/zalo/zalo-selection-adapter';


describe('ZaloSelectionDOMAdapter', () => {
  let adapter: ZaloSelectionDOMAdapter;

  beforeEach(() => {
    adapter = new ZaloSelectionDOMAdapter();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('isWithinChatView nhận diện đúng phần tử trong khung hội thoại hợp lệ', () => {
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chatView';

    const msgItem = document.createElement('div');
    msgItem.className = 'msg-item';

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Nội dung tin nhắn';

    msgItem.appendChild(textSpan);
    chatContainer.appendChild(msgItem);
    document.body.appendChild(chatContainer);

    expect(adapter.isWithinChatView(textSpan)).toBe(true);
    expect(adapter.isWithinChatView(msgItem)).toBe(true);

    const outsideElem = document.createElement('div');
    document.body.appendChild(outsideElem);
    expect(adapter.isWithinChatView(outsideElem)).toBe(false);
  });

  it('isInputArea nhận diện đúng phần tử trong khung nhập liệu cấm', () => {
    const inputArea = document.createElement('div');
    inputArea.id = 'input_chat';

    const editableDiv = document.createElement('div');
    editableDiv.setAttribute('contenteditable', 'true');

    inputArea.appendChild(editableDiv);
    document.body.appendChild(inputArea);

    expect(adapter.isInputArea(editableDiv)).toBe(true);

    const searchBar = document.createElement('div');
    searchBar.className = 'search-bar';
    document.body.appendChild(searchBar);

    expect(adapter.isInputArea(searchBar)).toBe(true);

    const normalDiv = document.createElement('div');
    document.body.appendChild(normalDiv);

    expect(adapter.isInputArea(normalDiv)).toBe(false);
  });

  it('findClosestMessageElement leo cây DOM đúng đến bong bóng tin nhắn target', () => {
    const msgItem = document.createElement('div');
    msgItem.className = 'msg-item chat-bubble';
    msgItem.setAttribute('data-id', 'msg-888');

    const innerDiv = document.createElement('div');
    innerDiv.className = 'text-content';

    const textSpan = document.createElement('span');
    textSpan.textContent = 'Nội dung bong bóng';

    innerDiv.appendChild(textSpan);
    msgItem.appendChild(innerDiv);
    document.body.appendChild(msgItem);

    const foundTarget = adapter.findClosestMessageElement(textSpan);
    expect(foundTarget).toBe(msgItem);
    expect(adapter.extractMessageId(foundTarget)).toBe('msg-888');
  });

  it('extractMessageId đọc đúng messageId từ attribute data-id hoặc id', () => {
    const elemWithDataId = document.createElement('div');
    elemWithDataId.setAttribute('data-id', 'msg-10001');
    expect(adapter.extractMessageId(elemWithDataId)).toBe('msg-10001');

    const elemWithNestedDataId = document.createElement('div');
    const child = document.createElement('span');
    child.setAttribute('data-id', 'msg-10002');
    elemWithNestedDataId.appendChild(child);
    expect(adapter.extractMessageId(elemWithNestedDataId)).toBe('msg-10002');

    const elemWithIdAttr = document.createElement('div');
    elemWithIdAttr.id = 'msg-10003';
    expect(adapter.extractMessageId(elemWithIdAttr)).toBe('msg-10003');
  });
});
