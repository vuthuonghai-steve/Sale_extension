import { describe, it, expect } from 'vitest';
import { MessageParser } from '../../src/3_modules/sub-modules/message-parser/index.ts';
import testCases from '../fixtures/lead-test-cases.json';


describe('MessageParser Unit Tests', () => {
  it('handles empty or blank string gracefully', () => {
    expect(MessageParser.parse('')).toEqual({});
    expect(MessageParser.parse('   \n\t  ')).toEqual({});
  });

  it('correctly extracts Vietnamese phone numbers', () => {
    expect(MessageParser.extractPhoneNumber('SĐT: 0904117586')).toBe('0904117586');
    expect(MessageParser.extractPhoneNumber('+84904117586')).toBe('+84904117586');
    expect(MessageParser.extractPhoneNumber('No phone here')).toBeUndefined();
  });

  for (const tc of testCases) {
    it(`parses test case: ${tc.description}`, () => {
      const parsed = MessageParser.parse(tc.rawInput);

      for (const [key, val] of Object.entries(tc.expectedLead)) {
        expect((parsed as Record<string, string | undefined>)[key]).toBe(val);
      }
    });
  }

  it('handles irregular formats and messy spacing', () => {
    const raw = `
      🐳 Team Luxury Home
      🏡 Địa chỉ :   Số 10 Ngõ 50 Nguyễn Trãi - Thanh Xuân  
      💸 Giá : 4.5tr - 5tr
      ☎️ SĐT : 0398765432
      🕰️ Ngày xem : Chiều chủ nhật 2h
      Mã : NX101
      Tên Sales : Nguyễn Văn Nam
      Ghi chú thêm: tầng 3 có ban công
    `;

    const parsed = MessageParser.parse(raw);
    expect(parsed.teamName).toContain('Team Luxury Home');
    expect(parsed.address).toBe('Số 10 Ngõ 50 Nguyễn Trãi - Thanh Xuân');
    expect(parsed.price).toBe('4.5tr - 5tr');
    expect(parsed.customerPhone).toBe('0398765432');
    expect(parsed.viewTime).toBe('Chiều chủ nhật 2h');
    expect(parsed.roomCode).toBe('NX101');
    expect(parsed.salesName).toBe('Nguyễn Văn Nam');
    expect(parsed.rawNotes).toContain('Ghi chú thêm: tầng 3 có ban công');
  });

  it('handles lines without colon via fallback regexes', () => {
    const raw = `
      Mã phòng P302
      Tên CTV Hoang Yen
      SĐT 0988776655
    `;
    const parsed = MessageParser.parse(raw);
    expect(parsed.roomCode).toBe('P302');
    expect(parsed.salesName).toBe('Hoang Yen');
    expect(parsed.customerPhone).toBe('0988776655');
  });

  it('extracts phone when customerName has phone number embedded', () => {
    const raw = `
      Tên KH: 0987654321
    `;
    const parsed = MessageParser.parse(raw);
    expect(parsed.customerPhone).toBe('0987654321');
  });
});

