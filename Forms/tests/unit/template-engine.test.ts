import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../../src/3_modules/sub-modules/template-engine/index.ts';
import type { LeadEntity, FormatSchema } from '@contracts';

import skySchemaJson from '../fixtures/schemas/a_sky_group.json';
import tl21SchemaJson from '../fixtures/schemas/tl21_house.json';
import tnrSchemaJson from '../fixtures/schemas/tnr_home.json';

const skySchema = skySchemaJson as unknown as FormatSchema;
const tl21Schema = tl21SchemaJson as unknown as FormatSchema;
const tnrSchema = tnrSchemaJson as unknown as FormatSchema;

describe('TemplateEngine Unit Tests', () => {
  const fullLead: LeadEntity = {
    teamName: '🐳Team DNT Home',
    customerName: 'Lucky Man',
    customerPhone: '0904117586',
    address: 'Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng',
    viewTime: 'bây giờ 3/8',
    price: '4tr-4tr6',
    roomCode: 'AHS284',
    salesName: 'Tuấn',
  };

  it('renders correctly for A Sky Group schema with fixed salesName Thiên Ngọc', () => {
    const output = TemplateEngine.render(fullLead, skySchema);
    expect(output).toContain('❤️ A Sky Group ❤️');
    expect(output).toContain('👉 Tên CTV: Thiên Ngọc');
    expect(output).toContain('👉 Địa chỉ phòng: Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(output).toContain('👉  Mã phòng: AHS284');
    expect(output).toContain('👉 Giá phòng: 4tr-4tr6');
    expect(output).toContain('👉 Ngày, giờ xem: bây giờ 3/8');
    expect(output).toContain('👉 Tên KH (FB/Zalo): Lucky Man');
    expect(output).toContain('👉 SDT khách: 0904117586');
  });

  it('renders correctly for TL21House schema with fixed salesName Thiên Ngọc', () => {
    const output = TemplateEngine.render(fullLead, tl21Schema);
    expect(output).toContain('🏆TL21House🏆');
    expect(output).toContain('☘️Địa chỉ : Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(output).toContain('☘️Giá : 4tr-4tr6');
    expect(output).toContain('☘️Sdt khách : 0904117586');
    expect(output).toContain('☘️Thời gian xem : bây giờ 3/8');
    expect(output).toContain('☘️CTV : Thiên Ngọc');
    expect(output).toContain('☘️MÃ PHÒNG : AHS284');
  });

  it('applies fallbackTo when primary field is empty', () => {
    const leadWithoutName: LeadEntity = {
      customerPhone: '0383401138',
      address: 'NGÕ 322/95/1 MỸ ĐÌNH 1',
      roomCode: '68',
      price: '6tr2',
      viewTime: '10/8',
    };

    const output = TemplateEngine.render(leadWithoutName, skySchema);
    // fallbackTo: customerName -> customerPhone
    expect(output).toContain('👉 Tên KH (FB/Zalo): 0383401138');
    expect(output).toContain('👉 SDT khách: 0383401138');
    // defaultValues: salesName -> "Thiên Ngọc"
    expect(output).toContain('👉 Tên CTV: Thiên Ngọc');
  });

  it('renders correctly for TNR HOME schema', () => {
    const output = TemplateEngine.render(fullLead, tnrSchema);
    expect(output).toContain('💛 TNR HOME 🌻');
    expect(output).toContain('SĐT khách: 0904117586');
    expect(output).toContain('Giờ xem: bây giờ 3/8                ngày xem:');
    expect(output).toContain('( Qua gọi trước 30P - 1 tiếng )');
    expect(output).toContain('Địa chỉ: Ngõ 101/39 Thanh Nhàn - Hai Bà Trưng');
    expect(output).toContain('Giá tư vấn: 4tr-4tr6');
    expect(output).toContain('Mã tòa: AHS284');
    expect(output).toContain('*Cảm ơn Anh/Chị đã dẫn khách giúp em*');
    // Đảm bảo không render trường CTV trong format TNR HOME
    expect(output).not.toContain('Tên CTV');
    expect(output).not.toContain('Tên Sales');
  });

  it('renders all output schemas concurrently with renderAll', () => {
    const all = TemplateEngine.renderAll(fullLead, [skySchema, tl21Schema, tnrSchema]);
    expect(all[skySchema.id]).toContain('❤️ A Sky Group ❤️');
    expect(all[tl21Schema.id]).toContain('🏆TL21House🏆');
    expect(all[tnrSchema.id]).toContain('💛 TNR HOME 🌻');
  });

  it('renders footer when footerTemplate is defined', () => {
    const schemaWithFooter: FormatSchema = {
      ...skySchema,
      footerTemplate: '--- Liên hệ hotline 1900 ---',
    };
    const output = TemplateEngine.render(fullLead, schemaWithFooter);
    expect(output).toContain('--- Liên hệ hotline 1900 ---');
  });
});
