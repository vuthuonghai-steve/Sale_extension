/**
 * Automated Unit Test Suite cho Logic BĐS Sale Dashboard (Local Node.js)
 * Chạy: node tests/test-suite.js
 */

const assert = require("assert");

// Import logic mô phỏng
function parseDriveUrl(url) {
  if (!url) return { type: "none", id: null, url: "" };
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (folderMatch && folderMatch[1]) {
    return { type: "folder", id: folderMatch[1], url: url };
  }
  const fileMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/) || url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (fileMatch && fileMatch[1]) {
    return { type: "file", id: fileMatch[1], url: url };
  }
  return { type: "unknown", id: null, url: url };
}

function extractPriceNumber(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[.,\s]/g, "");
  const match = cleaned.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1]);
  if (num >= 1000000) return num / 1000000;
  if (num >= 1000) return num / 1000;
  return num;
}

function generateSalesPostText(item) {
  const lines = [];
  const title = item.houseName ? `🔥 ${item.houseName.toUpperCase()} - ${item.address}` : `🔥 PHÒNG CHO THUÊ - ${item.address}`;
  lines.push(title);
  if (item.emptyRooms) lines.push(`🚪 Phòng trống: ${item.emptyRooms}`);
  if (item.price) lines.push(`💵 Giá thuê: ${item.price} đ/tháng`);
  if (item.elevator) lines.push(`🛗 Loại thang: ${item.elevator}`);
  if (item.furniture) lines.push(`🛋️ Nội thất: ${item.furniture}`);
  if (item.services) lines.push(`⚡ Dịch vụ & Tiện ích:\n${item.services}`);
  if (item.details) lines.push(`📌 Thông tin thêm:\n${item.details}`);
  if (item.note) lines.push(`⏱️ Ghi chú/Vào ở: ${item.note}`);
  if (item.contactPhone) lines.push(`📞 Liên hệ xem phòng: ${item.contactPhone}`);
  return lines.join("\n\n");
}

console.log("=========================================");
console.log("🧪 ĐANG CHẠY KIỂM THỬ TỰ ĐỘNG (UNIT TESTS)");
console.log("=========================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Chi tiết lỗi: ${err.message}`);
  }
}

// Test 1: Nhận diện Google Drive Folder URL
runTest("Nhận diện link Google Drive Folder", () => {
  const url = "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456";
  const res = parseDriveUrl(url);
  assert.strictEqual(res.type, "folder");
  assert.strictEqual(res.id, "1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456");
});

// Test 2: Nhận diện Google Drive File URL
runTest("Nhận diện link Google Drive File đơn lẻ", () => {
  const url = "https://drive.google.com/file/d/1XyZ_987654321AbCdEfGhIjKlMnOpQrSt/view?usp=sharing";
  const res = parseDriveUrl(url);
  assert.strictEqual(res.type, "file");
  assert.strictEqual(res.id, "1XyZ_987654321AbCdEfGhIjKlMnOpQrSt");
});

// Test 3: Xử lý link không phải Drive
runTest("Xử lý link rỗng hoặc không phải Drive", () => {
  assert.strictEqual(parseDriveUrl("").type, "none");
  assert.strictEqual(parseDriveUrl(null).type, "none");
  assert.strictEqual(parseDriveUrl("https://example.com/other").type, "unknown");
});

// Test 4: Trích xuất số tiền từ text giá phòng
runTest("Trích xuất giá trị số từ chuỗi giá tiền", () => {
  assert.strictEqual(extractPriceNumber("4.600.000"), 4.6);
  assert.strictEqual(extractPriceNumber("3,900k"), 3.9);
  assert.strictEqual(extractPriceNumber("5tr2"), 5);
  assert.strictEqual(extractPriceNumber("11.000.000"), 11);
  assert.strictEqual(extractPriceNumber(""), 0);
});

// Test 5: Sinh mẫu tin đăng bán phòng
runTest("Tạo mẫu tin đăng bán phòng đầy đủ thông tin", () => {
  const item = {
    houseName: "105 Bạch Mai",
    address: "Ngõ 105 Bạch Mai",
    emptyRooms: "208",
    price: "4.600.000",
    elevator: "Bộ",
    furniture: "Giường, tủ, điều hòa",
    services: "Điện 3.9k, Nước 100k",
    details: "Phòng rộng 35m2",
    note: "1/9 vào ở",
    contactPhone: "0366024166"
  };
  const text = generateSalesPostText(item);
  assert.ok(text.includes("105 BẠCH MAI"));
  assert.ok(text.includes("4.600.000 đ/tháng"));
  assert.ok(text.includes("0366024166"));
  assert.ok(text.includes("Giường, tủ, điều hòa"));
});

console.log(`\n=========================================`);
console.log(`📊 KẾT QUẢ: ${passed}/${total} bài test đã vượt qua thành công!`);
console.log("=========================================\n");

if (passed !== total) process.exit(1);
