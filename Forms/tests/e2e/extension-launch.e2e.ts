import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MessageParser } from '../../src/3_modules/sub-modules/message-parser/index.ts';
import { TemplateEngine } from '../../src/3_modules/sub-modules/template-engine/index.ts';
import type { FormatSchema } from '../../src/0_contracts/format-schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadSchema(filename: string): FormatSchema {
  const filepath = path.resolve(__dirname, '../fixtures/schemas', filename);
  const raw = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(raw) as FormatSchema;
}

test.describe('Dynamic Message & Format Transformer Flow Test', () => {
  const skySchema = loadSchema('a_sky_group.json');
  const tl21Schema = loadSchema('tl21_house.json');
  const tnrSchema = loadSchema('tnr_home.json');

  const rawDntMessage = `🐳Team DNT Home
📤 Fb/Zalo khách: Lucky Man
☎️ Sđt khách:0904117586
🏡Địa chỉ: Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng
🕰️Ngày/giờ xem phòng: bây giờ 3/8
💸Giá tư vấn : 4tr-4tr6
 Mã :AHS284
Tên Sales : Tuấn`;

  test('parses raw unstructured sales message into structured LeadEntity', () => {
    const lead = MessageParser.parse(rawDntMessage);

    expect(lead.customerName).toBe('Lucky Man');
    expect(lead.customerPhone).toBe('0904117586');
    expect(lead.address).toBe('Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(lead.viewTime).toBe('bây giờ 3/8');
    expect(lead.price).toBe('4tr-4tr6');
    expect(lead.roomCode).toBe('AHS284');
    expect(lead.salesName).toBe('Tuấn');
  });

  test('transforms parsed lead into A Sky Group format dynamically', () => {
    const lead = MessageParser.parse(rawDntMessage);
    const output = TemplateEngine.render(lead, skySchema);

    expect(output).toContain('❤️ A Sky Group ❤️');
    expect(output).toContain('👉 Tên CTV: Thiên Ngọc');
    expect(output).toContain('👉 Địa chỉ phòng: Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(output).toContain('👉  Mã phòng: AHS284');
    expect(output).toContain('👉 Giá phòng: 4tr-4tr6');
    expect(output).toContain('👉 Ngày, giờ xem: bây giờ 3/8');
    expect(output).toContain('👉 Tên KH (FB/Zalo): Lucky Man');
    expect(output).toContain('👉 SDT khách: 0904117586');
  });

  test('transforms parsed lead into TL21House format dynamically', () => {
    const lead = MessageParser.parse(rawDntMessage);
    const output = TemplateEngine.render(lead, tl21Schema);

    expect(output).toContain('🏆TL21House🏆');
    expect(output).toContain('☘️Địa chỉ : Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(output).toContain('☘️Giá : 4tr-4tr6');
    expect(output).toContain('☘️Sdt khách : 0904117586');
    expect(output).toContain('☘️Thời gian xem : bây giờ 3/8');
    expect(output).toContain('☘️CTV : Thiên Ngọc');
    expect(output).toContain('☘️MÃ PHÒNG : AHS284');
  });

  test('transforms parsed lead into TNR HOME format dynamically', () => {
    const lead = MessageParser.parse(rawDntMessage);
    const output = TemplateEngine.render(lead, tnrSchema);

    expect(output).toContain('💛 TNR HOME 🌻');
    expect(output).toContain('SĐT khách: 0904117586');
    expect(output).toContain('Giờ xem: bây giờ 3/8                ngày xem:');
    expect(output).toContain('( Qua gọi trước 30P - 1 tiếng )');
    expect(output).toContain('Địa chỉ: Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(output).toContain('Giá tư vấn: 4tr-4tr6');
    expect(output).toContain('Mã tòa: AHS284');
    expect(output).toContain('*Cảm ơn Anh/Chị đã dẫn khách giúp em*');
    expect(output).not.toContain('Tên CTV');
  });
});
