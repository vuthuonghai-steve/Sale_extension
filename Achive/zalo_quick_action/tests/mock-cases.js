/**
 * Mock Test Cases Dataset for Zalo Quick Action Text Filtering
 * Lưu trữ toàn bộ các mẫu tin nhắn thực tế (Cũ + Mới) làm quy chuẩn chống Regression.
 */
(function (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.ZaloQuickActionMockCases = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MOCK_CASES = [
    {
      id: 'TC01_COMMISSION_BEFORE_TROPHY_NO_MA',
      category: 'Trường hợp mới: Hoa hồng đứng trước Cúp 🏆 không có chữ Mã',
      name: 'Lọc bỏ "🌷 40%-12m " và bảo tồn "🏆 032" cùng toàn bộ nội dung phòng',
      input: `🌷 40%-12m 🏆 032

🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà
Quận: Cầu Giấy

⌛️ Trống: 

☘ Giá: 6tr2-p601-604
              6tr4-p702
☘ Dạng phòng: STUDIO
☘ Thang: Thang máy + tha`,
      expected: `🏆 032

🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà
Quận: Cầu Giấy

⌛️ Trống:

☘ Giá: 6tr2-p601-604
 6tr4-p702
☘ Dạng phòng: STUDIO
☘ Thang: Thang máy + tha`
    },
    {
      id: 'TC02_COMMISSION_PERCENT_BEFORE_MA',
      category: 'Hoa hồng % dính trước Mã:',
      name: 'Lọc bỏ "🌷30% 6-12m " giữ lại "Mã: 🏆 918"',
      input: `🌷30% 6-12m Mã: 🏆 918

🏢 Địa chỉ: Số 10 ngõ 80 Chùa Láng
Quận: Đống Đa

☘ Giá: 5tr5 - p302
☘ Dạng phòng: 1N1K`,
      expected: `Mã: 🏆 918

🏢 Địa chỉ: Số 10 ngõ 80 Chùa Láng
Quận: Đống Đa

☘ Giá: 5tr5 - p302
☘ Dạng phòng: 1N1K`
    },
    {
      id: 'TC03_MULTI_SEGMENT_BEFORE_MA',
      category: 'Hoa hồng đa mốc phân cách bằng |',
      name: 'Lọc bỏ "🌷 40%- 12th | 30%- 6th " giữ lại "Mã: 🏆 379"',
      input: `🌷 40%- 12th | 30%- 6th Mã: 🏆 379
🏢 Địa chỉ: 52 Mỹ Đình
Quận: Nam Từ Liêm
☘ Giá: 4tr5 - p201`,
      expected: `Mã: 🏆 379
🏢 Địa chỉ: 52 Mỹ Đình
Quận: Nam Từ Liêm
☘ Giá: 4tr5 - p201`
    },
    {
      id: 'TC04_NOTE_BRACKET_CHU_DAN',
      category: 'Hoa hồng kèm ghi chú ngoặc đơn (Chủ dẫn)',
      name: 'Lọc bỏ "🌷40% - 12m ( Chủ dẫn 30% -12M) " giữ lại "Mã: 🏆 232"',
      input: `🌷40% - 12m ( Chủ dẫn 30% -12M) Mã: 🏆 232
🏢 Địa chỉ: 18 Khương Đình
Quận: Thanh Xuân`,
      expected: `Mã: 🏆 232
🏢 Địa chỉ: 18 Khương Đình
Quận: Thanh Xuân`
    },
    {
      id: 'TC05_MONEY_COMMISSION_BEFORE_MA',
      category: 'Hoa hồng tiền mặt (tr/triệu/k)',
      name: 'Lọc bỏ "🌷1tr1 - 6-12m " giữ lại "Mã: 🏆 626"',
      input: `🌷1tr1 - 6-12m Mã: 🏆 626
🏢 Địa chỉ: 25 Quan Hoa
Quận: Cầu Giấy`,
      expected: `Mã: 🏆 626
🏢 Địa chỉ: 25 Quan Hoa
Quận: Cầu Giấy`
    },
    {
      id: 'TC06_CONTRACT_DATE_LONG',
      category: 'Hoa hồng kèm hạn hợp đồng cụ thể',
      name: 'Lọc bỏ "🌷35%-hd 31/8/2027 " giữ lại "Mã: 🏆 119"',
      input: `🌷35%-hd 31/8/2027 Mã: 🏆 119
🏢 Địa chỉ: 99 Cầu Giấy
Quận: Cầu Giấy`,
      expected: `Mã: 🏆 119
🏢 Địa chỉ: 99 Cầu Giấy
Quận: Cầu Giấy`
    },
    {
      id: 'TC07_CONTRACT_DATE_WITH_TOI',
      category: 'Hoa hồng kèm chữ hạn tới ngày',
      name: 'Lọc bỏ "🌷40% - hd toi 30/8/2027 " giữ lại "Mã: 🏆 982"',
      input: `🌷40% - hd toi 30/8/2027 Mã: 🏆 982
🏢 Địa chỉ: 120 Hoàng Quốc Việt
Quận: Cầu Giấy`,
      expected: `Mã: 🏆 982
🏢 Địa chỉ: 120 Hoàng Quốc Việt
Quận: Cầu Giấy`
    },
    {
      id: 'TC08_TEXT_EMOJI_ROSE',
      category: 'Emoji hoa hồng dạng text Zalo (/-rose)',
      name: 'Lọc bỏ "/-rose 35% " giữ lại "Mã 801"',
      input: `/-rose 35% Mã 801
🏢 Địa chỉ: 88 Trần Duy Hưng
Quận: Cầu Giấy`,
      expected: `Mã 801
🏢 Địa chỉ: 88 Trần Duy Hưng
Quận: Cầu Giấy`
    },
    {
      id: 'TC09_STANDALONE_LINE_PERCENT_EMOJI',
      category: 'Dòng hoa hồng % đứng 1 mình (có emoji)',
      name: 'Xóa hoàn toàn dòng hoa hồng đứng riêng',
      input: `🌷40% - 6-12m
🏢 Địa chỉ: 15 Trung Kính
Quận: Cầu Giấy
☘ Giá: 5tr`,
      expected: `🏢 Địa chỉ: 15 Trung Kính
Quận: Cầu Giấy
☘ Giá: 5tr`
    },
    {
      id: 'TC10_STANDALONE_LINE_PERCENT_NO_EMOJI',
      category: 'Dòng hoa hồng % đứng 1 mình (không có emoji)',
      name: 'Xóa hoàn toàn dòng hoa hồng "30%-6th"',
      input: `30%-6th
🏢 Địa chỉ: 30 Dịch Vọng
Quận: Cầu Giấy`,
      expected: `🏢 Địa chỉ: 30 Dịch Vọng
Quận: Cầu Giấy`
    },
    {
      id: 'TC11_STANDALONE_LINE_NOTE_BRACKET',
      category: 'Dòng ghi chú hoa hồng đứng 1 mình',
      name: 'Xóa dòng "(Chốt đúng giá, fix giá hh 30%)"',
      input: `(Chốt đúng giá, fix giá hh 30%)
🏢 Địa chỉ: 45 Lê Đức Thọ
Quận: Nam Từ Liêm`,
      expected: `🏢 Địa chỉ: 45 Lê Đức Thọ
Quận: Nam Từ Liêm`
    },
    {
      id: 'TC12_ORPHAN_EMOJI_BEFORE_MA',
      category: 'Emoji hoa hồng mồ côi trước Mã:',
      name: 'Lọc bỏ "🌷 " trước "Mã: 🏆 063"',
      input: `🌷 Mã: 🏆 063
🏢 Địa chỉ: 72 Nguyễn Khang
Quận: Cầu Giấy`,
      expected: `Mã: 🏆 063
🏢 Địa chỉ: 72 Nguyễn Khang
Quận: Cầu Giấy`
    },
    {
      id: 'TC13_ORPHAN_EMOJI_BEFORE_TROPHY',
      category: 'Emoji hoa hồng mồ côi trước Cúp 🏆',
      name: 'Lọc bỏ "🌷 " trước "🏆 063"',
      input: `🌷 🏆 063
🏢 Địa chỉ: 72 Nguyễn Khang
Quận: Cầu Giấy`,
      expected: `🏆 063
🏢 Địa chỉ: 72 Nguyễn Khang
Quận: Cầu Giấy`
    },
    {
      id: 'TC14_BRAND_REMOVAL',
      category: 'Thương hiệu nguồn hàng TLHouse',
      name: 'Xóa bỏ dòng tag nguồn hàng TLHouse',
      input: `• Nguồn hàng cập nhật liên tục tại 🏆TL21House🏆
🏢 Địa chỉ: 18 Nguyễn Cơ Thạch
Quận: Nam Từ Liêm`,
      expected: `🏢 Địa chỉ: 18 Nguyễn Cơ Thạch
Quận: Nam Từ Liêm`
    },
    {
      id: 'TC15_PRESERVE_PRICE_LINES',
      category: 'Bảo toàn dòng giá phòng (Không xóa nhầm)',
      name: 'Bảo toàn tuyệt đối dòng giá "6tr2-p601-604" và "6tr4-p702"',
      input: `🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà
Quận: Cầu Giấy

⌛️ Trống: 

☘ Giá: 6tr2-p601-604
              6tr4-p702
☘ Dạng phòng: STUDIO
☘ Thang: Thang máy + tha`,
      expected: `🏢 Địa chỉ: Số 15 ngõ 42 Yên Hoà
Quận: Cầu Giấy

⌛️ Trống:

☘ Giá: 6tr2-p601-604
 6tr4-p702
☘ Dạng phòng: STUDIO
☘ Thang: Thang máy + tha`
    }
  ];

  return MOCK_CASES;
});
