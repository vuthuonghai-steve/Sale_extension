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
            },
            {
                  id: 'TC16_COMMISSION_UNDERSCORE_CTV_CHU_DAN_BEFORE_MA',
                  category: 'Hoa hồng phân cách gạch dưới _ và ghi chú (ctv dẫn), (Chủ dẫn) trước Mã: 🏆',
                  name: 'Lọc bỏ "🌷40%_12th ( ctv dẫn)" và "      30%_12th  ( Chủ dẫn)     " giữ lại "Mã: 🏆"',
                  input: `🌷40%_12th ( ctv dẫn)
      30%_12th  ( Chủ dẫn)     Mã: 🏆 

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy


⌛️ Trống : 402`,
                  expected: `Mã: 🏆

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy

⌛️ Trống : 402`
            },
            {
                  id: 'TC17_COMMISSION_UNDERSCORE_STANDALONE',
                  category: 'Dòng hoa hồng phân cách gạch dưới _ đứng độc lập',
                  name: 'Xóa hoàn toàn dòng hoa hồng "🌷40%_12th ( ctv dẫn)"',
                  input: `🌷40%_12th ( ctv dẫn)
🏢 Địa chỉ: 91 Trần Thái Tông
☘ Giá: 4tr`,
                  expected: `🏢 Địa chỉ: 91 Trần Thái Tông
☘ Giá: 4tr`
            },
            {
                  id: 'TC18_COMMISSION_UNDERSCORE_BEFORE_TROPHY_NO_MA',
                  category: 'Hoa hồng gạch dưới đứng trước Cúp 🏆 không có chữ Mã',
                  name: 'Lọc bỏ thông tin hoa hồng giữ lại "🏆 044"',
                  input: `🌷40%_12th ( ctv dẫn)
      30%_12th  ( Chủ dẫn)     🏆 044

🏢 Địa chỉ: 91 Trần Thái Tông`,
                  expected: `🏆 044

🏢 Địa chỉ: 91 Trần Thái Tông`
            },
            {
                  id: 'TC19_FULL_MESSAGE_UNDERSCORE_TLHOUSE',
                  category: 'Toàn bộ tin nhắn thực tế: Hoa hồng gạch dưới + 2 mốc dẫn + Tag nguồn hàng TL21House',
                  name: 'Lọc sạch hoa hồng, người dẫn, và thương hiệu TL21House trên toàn bộ tin nhắn',
                  input: `🌷40%_12th ( ctv dẫn)
      30%_12th  ( Chủ dẫn)     Mã: 🏆 

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy


⌛️ Trống : 402

☘Giá : 5tr6 
☘Dạng phòng : studio giường tầng
☘Thang : Máy

🏆Nội thất : Điều hoà, nóng lạnh, gường, tủ quần áo, tủ bếp, máy giặt Riêng, Tủ Lạnh,...

🏆Dịch vụ :Điện 4k/số
Nước: 38k/khối 
Wifi : 100k 1p
Dvc :190k/người 

 ⭐Lưu ý: 
-ô tô cách nhà 50m
-3ng2xe
-Không pet
- Đóng 1 cọc 1
- Nguồn hàng cập nhật liên tục tại         
                🏆TL21House🏆`,
                  expected: `Mã: 🏆

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG (đi ngõ 36 dịch vọng hậu vào nhà được), Cầu Giấy

⌛️ Trống : 402

☘Giá : 5tr6
☘Dạng phòng : studio giường tầng
☘Thang : Máy

🏆Nội thất : Điều hoà, nóng lạnh, gường, tủ quần áo, tủ bếp, máy giặt Riêng, Tủ Lạnh,...

🏆Dịch vụ :Điện 4k/số
Nước: 38k/khối
Wifi : 100k 1p
Dvc :190k/người

 ⭐Lưu ý:
-ô tô cách nhà 50m
-3ng2xe
-Không pet
- Đóng 1 cọc 1`
            },
            {
                  id: 'TC20_COMMISSION_MULTI_SEGMENT_SAME_LINE_SPACES',
                  category: 'Nhiều mốc hoa hồng có ngoặc đơn trên cùng 1 dòng cách nhau bởi khoảng trắng',
                  name: 'Lọc bỏ "🌷40%_12th ( ctv dẫn)       30%_12th  ( Chủ dẫn)     " giữ lại "Mã: 🏆"',
                  input: `🌷40%_12th ( ctv dẫn)       30%_12th  ( Chủ dẫn)     Mã: 🏆

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG`,
                  expected: `Mã: 🏆

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG`
            },
            {
                  id: 'TC21_COMMISSION_BRACKET_NOTE_DIRECTLY_BEFORE_MA',
                  category: 'Hoa hồng kèm ngoặc đơn ghi chú đứng trực tiếp trước Mã: 🏆',
                  name: 'Lọc bỏ "🌷40%_12th ( ctv dẫn) " giữ lại "Mã: 🏆"',
                  input: `🌷40%_12th ( ctv dẫn) Mã: 🏆

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG`,
                  expected: `Mã: 🏆

Địa chỉ : 91 ngõ 44 TRẦN THÁI TÔNG`
            },
            {
                  id: 'TC22_BONUS_POLICY_HEADER_WITH_COMMISSION_AND_BRAND',
                  category: 'Trường hợp mới: Dòng chính sách giữ phòng / thưởng sale + Hoa hồng % trước Mã + Tag thương hiệu TL21House',
                  name: 'Lọc sạch dòng chính sách thưởng sale, hoa hồng 🌷30%- 12m và tag TL21House',
                  input: `GIỮ PHÒNG ĐẾN HẾT THÁNG 8 NẾU KHÁCH CHỐT ĐÚNG GIÁ. CÓ FIX GIÁ CHO KHÁCH CHUYỂN VÀO Ở LUÔN HOẶC THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8

🌷30%- 12m Mã: 🏆011

🏢Địa chỉ : nhà số 11D ngách 7 ngõ 101 Thanh Nhàn-Hai Bà Trưng

⌛️Trống : 

☘Giá : 4tr3-p101      
☘Dạng phòng studio
☘Thang : bộ

🏆Nội thất :Điều hòa, nóng lạnh, tủ lạnh, kệ tủ bếp hút mùi, giường tủ quần áo, sofa

🏆Dịch vụ : Điện: 4k/ số Nước: 120k/ người Internet: 100k/ phòng Phí dịch vụ: 120k/người/tháng (máy giặt, dọn vs, điện chung, rác...)

 ⭐Lưu ý: 
- Đóng 1 cọc 1
- Giới hạn 3 xe/phòng
- PET : ko 
- k nuoc ngoài
- KO NHẬN XE ĐIỆN  
- Nguồn hàng cập nhật liên tục tại         
                🏆TL21House🏆`,
                  expected: `Mã: 🏆011

🏢Địa chỉ : nhà số 11D ngách 7 ngõ 101 Thanh Nhàn-Hai Bà Trưng

⌛️Trống :

☘Giá : 4tr3-p101
☘Dạng phòng studio
☘Thang : bộ

🏆Nội thất :Điều hòa, nóng lạnh, tủ lạnh, kệ tủ bếp hút mùi, giường tủ quần áo, sofa

🏆Dịch vụ : Điện: 4k/ số Nước: 120k/ người Internet: 100k/ phòng Phí dịch vụ: 120k/người/tháng (máy giặt, dọn vs, điện chung, rác...)

 ⭐Lưu ý:
- Đóng 1 cọc 1
- Giới hạn 3 xe/phòng
- PET : ko
- k nuoc ngoài
- KO NHẬN XE ĐIỆN`
            },
            {
                  id: 'TC23_STANDALONE_BONUS_LINE_VARIATIONS',
                  category: 'Dòng thông báo thưởng nóng / thưởng sale độc lập',
                  name: 'Lọc bỏ dòng "THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ..." đứng độc lập',
                  input: `THƯỞNG SALE 500K/PHÒNG NẾU KHÁCH CHỐT ĐÚNG GIÁ VÀ CHUYỂN VÀO TRƯỚC 15/8

🌷30%- 12m Mã: 🏆011
🏢Địa chỉ : 11D Thanh Nhàn`,
                  expected: `Mã: 🏆011
🏢Địa chỉ : 11D Thanh Nhàn`
            },
            {
                  id: 'TC24_INLINE_BONUS_NOTE_BEFORE_MA',
                  category: 'Ghi chú thưởng sale / thưởng nóng dính liền hoa hồng trước Mã: 🏆',
                  name: 'Lọc bỏ hoa hồng và cụm "+ thưởng sale 500k" giữ lại "Mã: 🏆011"',
                  input: `🌷30%- 12m + thưởng sale 500k Mã: 🏆011
🏢Địa chỉ : 11D Thanh Nhàn`,
                  expected: `Mã: 🏆011
🏢Địa chỉ : 11D Thanh Nhàn`
            },
            {
                  id: 'TC25_COMMISSION_PERCENT_SPACE_DURATION_BEFORE_MA',
                  category: 'Trường hợp mới: Hoa hồng 🌷20%- 12m dính trước Mã: 🏆 366 kèm danh sách nhiều phòng',
                  name: 'Lọc bỏ "🌷20%- 12m " giữ lại "Mã: 🏆 366" và bảo toàn trọn vẹn danh sách nhiều giá phòng',
                  input: `🌷20%- 12m Mã: 🏆 366

🏢Địa chỉ : 561 Trương Định (A) - Quận Hoàng Mai

⌛️Trống : 1/9

☘Giá : 5tr7-p702
              4tr2-p701
             5tr6-p302,402,602
             5tr4-p202
☘Dạng phòng : Studio 25m² (Ban công)
☘Thang : Thang máy`,
                  expected: `Mã: 🏆 366

🏢Địa chỉ : 561 Trương Định (A) - Quận Hoàng Mai

⌛️Trống : 1/9

☘Giá : 5tr7-p702
 4tr2-p701
 5tr6-p302,402,602
 5tr4-p202
☘Dạng phòng : Studio 25m² (Ban công)
☘Thang : Thang máy`
            }
      ];

      return MOCK_CASES;
});
