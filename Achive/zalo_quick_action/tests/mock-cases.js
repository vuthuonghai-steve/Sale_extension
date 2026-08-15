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
            },
            {
                  id: 'TC26_COMMISSION_DEADLINE_HEADER_BEFORE_MA',
                  category: 'Trường hợp mới: Hoa hồng kèm dòng hạn Hh đến 30/8 đứng trước 🌷50%-12m Mã: 🏆 105',
                  name: 'Lọc bỏ "Hh đến 30/8", "🌷50%-12m " và tag thương hiệu TL21House, bảo tồn toàn bộ thông tin phòng',
                  input: `Hh đến 30/8
🌷50%-12m Mã: 🏆 105

🏢Địa chỉ : 95 ngõ 87 Nguyễn Khang - Quận: Cầu Giấy 

⌛️Trống : 

☘Giá: 6tr8-p302
             
☘Dạng phòng : 1n1k
☘Thang : Máy

🏆Nội thất : Full đồ cao cấp như hình
May giat Chung , nếu lắp máy giặt riêng cao thêm 250k

🏆Dịch vụ : Điện 4kđ/số; nước 110k/người/tháng; dịch vụ chung 220000 đồng/người/ tháng

 ⭐Lưu ý: 
- Đóng  1-  2 cọc 1 
- Lưu ý ctv : ai bắn form trước là của người đó
- Ngõ ô tô 
- đường 2 ô tô tránh nhau có thế để ô to trước nhà thông qua vũ phạm hàm 100m, ra khu đô thị trung hòa 50m
- Nguồn hàng cập nhật liên tục tại         
                🏆TL21House`,
                  expected: `Mã: 🏆 105

🏢Địa chỉ : 95 ngõ 87 Nguyễn Khang - Quận: Cầu Giấy

⌛️Trống :

☘Giá: 6tr8-p302

☘Dạng phòng : 1n1k
☘Thang : Máy

🏆Nội thất : Full đồ cao cấp như hình
May giat Chung , nếu lắp máy giặt riêng cao thêm 250k

🏆Dịch vụ : Điện 4kđ/số; nước 110k/người/tháng; dịch vụ chung 220000 đồng/người/ tháng

 ⭐Lưu ý:
- Đóng 1- 2 cọc 1
- Lưu ý ctv : ai bắn form trước là của người đó
- Ngõ ô tô
- đường 2 ô tô tránh nhau có thế để ô to trước nhà thông qua vũ phạm hàm 100m, ra khu đô thị trung hòa 50m`
            },
            {
                  id: 'TC27_COMMISSION_DEADLINE_VARIATIONS',
                  category: 'Biến thể: Hạn hoa hồng cùng dòng hoặc độc lập',
                  name: 'Lọc bỏ "Hh đến 30/8 🌷50%-12m " trên cùng một dòng trước Mã: 🏆 105',
                  input: `Hh đến 30/8 🌷50%-12m Mã: 🏆 105
🏢Địa chỉ : 95 ngõ 87 Nguyễn Khang - Quận: Cầu Giấy
☘Giá: 6tr8-p302`,
                  expected: `Mã: 🏆 105
🏢Địa chỉ : 95 ngõ 87 Nguyễn Khang - Quận: Cầu Giấy
☘Giá: 6tr8-p302`
            },
            {
                  id: 'TC28_COMMISSION_DOUBLE_M_DURATION_BEFORE_MA',
                  category: 'Trường hợp mới: Ký hiệu thời hạn gõ lặp 12mm đứng trước Mã',
                  name: 'Lọc bỏ "🌷30%-12mm " và giữ lại "Mã: 🏆 078" cùng toàn bộ thông tin',
                  input: `🌷30%-12mm Mã: 🏆 078

🏢Địa chỉ : Số 11 ngõ 281/69 Trần Khát Chân, quận Hai Bà Trưng, Tp. Hà Nội`,
                  expected: `Mã: 🏆 078

🏢Địa chỉ : Số 11 ngõ 281/69 Trần Khát Chân, quận Hai Bà Trưng, Tp. Hà Nội`
            },
            {
                  id: 'TC29_COMMISSION_HD_TOI_AND_CTV_DAN_NO_OPEN_BRACKET',
                  category: 'Trường hợp mới: Dòng hoa hồng có chữ hđ tới và ghi chú CTV dẫn) thiếu dấu mở ngoặc',
                  name: 'Lọc bỏ dòng "     50%-hd tới 31/8 CTV dẫn)" đứng độc lập',
                  input: `     50%-hd tới 31/8 CTV dẫn)
🏢Địa chỉ : ngõ 562 Thuỵ Khuê - Tây Hồ`,
                  expected: `🏢Địa chỉ : ngõ 562 Thuỵ Khuê - Tây Hồ`
            },
            {
                  id: 'TC30_FULL_MESSAGE_THUONG_CTV_AND_MULTI_DAN_TLHOUSE',
                  category: 'Toàn bộ tin nhắn thực tế: Thưởng CTV 500k + Hoa hồng hđ tới 31/8 Chủ dẫn/CTV dẫn + Tag TL21House',
                  name: 'Lọc sạch thưởng CTV, 2 mốc hoa hồng Chủ dẫn/CTV dẫn, bảo toàn trọn vẹn thông tin phòng',
                  input: `THƯỞNG CTV 500k
🌷40% - hđ tới 31/8( Chủ dẫn) Mã: 🏆 388
     50%-hd tới 31/8 CTV dẫn)
🏢Địa chỉ : ngõ 562 Thuỵ Khuê - Tây Hồ 

⌛️Trống : P602 vào luôn

☘Giá :
502: 5.6tr hạ còn 4.8tr - vào ở ngày 
              
☘Dạng phòng : STUDIO
☘Thang : MÁY

🏆Nội thất : Full Nột thất : bàn làm việc, giường, tủ quần áo, tủ bếp trên dưới, hút mùi, bếp từ, tủ lạnh, rèm cửa, bàn ăn, ghế ăn. Máy giặt riêng từng phòng.

Lưu ý: Phòng còn rèm đang lắp. Đệm và ga gối khách tự mua. Nhà bên cạnh nhỏ hơn, chung chủ, máy giặt chung, bằng giá tiền nhà mình, ae tự tin tư vấn khách nha. 

🏆Dịch vụ : Điện 4k/số, nước 30k/m3, wifi 100k/ph/th, Dịch vụ chung : 200k/ng/th. Xe máy: free để xe đầu, để xe thứ 2 100k/xe.

 ⭐Lưu ý: 
- Đóng 1 cọc 1
- Cách mặt phố chỉ 40M, ngõ rộng 4M
- Ở tối đa 2 người, không nuôi pet (cân nhắc), không nhận khách nước ngoài, nhận tối đa 2 xe/phòng. (Nếu ở 3 người vẫn có thể cân nhắc, ưu tiên 3 nữ ở sạch sẽ). Fix mạnh cho khách ở 1-2 người nha. 
- Qua xem phòng liên hệ trước 30p
- Nhà không chung chủ - giờ giấc tự do
- Nguồn hàng cập nhật liên tục tại         
                🏆TL21House🏆`,
                  expected: `Mã: 🏆 388

🏢Địa chỉ : ngõ 562 Thuỵ Khuê - Tây Hồ

⌛️Trống : P602 vào luôn

☘Giá :
502: 5.6tr hạ còn 4.8tr - vào ở ngày

☘Dạng phòng : STUDIO
☘Thang : MÁY

🏆Nội thất : Full Nột thất : bàn làm việc, giường, tủ quần áo, tủ bếp trên dưới, hút mùi, bếp từ, tủ lạnh, rèm cửa, bàn ăn, ghế ăn. Máy giặt riêng từng phòng.

Lưu ý: Phòng còn rèm đang lắp. Đệm và ga gối khách tự mua. Nhà bên cạnh nhỏ hơn, chung chủ, máy giặt chung, bằng giá tiền nhà mình, ae tự tin tư vấn khách nha.

🏆Dịch vụ : Điện 4k/số, nước 30k/m3, wifi 100k/ph/th, Dịch vụ chung : 200k/ng/th. Xe máy: free để xe đầu, để xe thứ 2 100k/xe.

 ⭐Lưu ý:
- Đóng 1 cọc 1
- Cách mặt phố chỉ 40M, ngõ rộng 4M
- Ở tối đa 2 người, không nuôi pet (cân nhắc), không nhận khách nước ngoài, nhận tối đa 2 xe/phòng. (Nếu ở 3 người vẫn có thể cân nhắc, ưu tiên 3 nữ ở sạch sẽ). Fix mạnh cho khách ở 1-2 người nha.
- Qua xem phòng liên hệ trước 30p
- Nhà không chung chủ - giờ giấc tự do`
            }
      ];

      return MOCK_CASES;
});
