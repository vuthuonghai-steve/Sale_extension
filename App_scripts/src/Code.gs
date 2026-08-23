/**
 * Google Apps Script - BĐS Sale Dashboard
 * Trích xuất dữ liệu Google Sheets + Ảnh Google Drive
 * Cung cấp giao diện 2 cột: Copy Text & Copy Ảnh 1-Click
 */

const CONFIG = {
  DEFAULT_SHEET_URL: "https://docs.google.com/spreadsheets/d/1-A9ex-6QwdYDAMUYzUTxsNoJ81q18KYV/edit#gid=1864797977",
  DEFAULT_GID: "1864797977",
  CACHE_EXPIRATION_SECONDS: 1800 // 30 phút cache
};

/**
 * Entry point cho Web App (deploy dạng Standalone Web App)
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("BĐS Sale Dashboard - Quản lý Phòng & Ảnh")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Menu tự động trên thanh công cụ khi gắn script vào Google Sheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("🏠 BĐS Dashboard")
    .addItem("📊 Mở Dashboard (Cửa sổ lớn)", "showDialog")
    .addItem("📑 Mở Dashboard (Sidebar)", "showSidebar")
    .addSeparator()
    .addItem("📝 Tự động điền cột Thông tin gửi khách", "insertFormattedColumnToSheet")
    .addItem("🔄 Làm mới dữ liệu Cache", "clearCache")
    .addToUi();
}

function showDialog() {
  const html = HtmlService.createHtmlOutputFromFile("index")
    .setWidth(1280)
    .setHeight(850);
  SpreadsheetApp.getUi().showModalDialog(html, "BĐS Sale Dashboard");
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile("index")
    .setTitle("BĐS Sale Dashboard");
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Bóc tách toàn bộ dữ liệu từ Sheet (gồm text và Hyperlink ẩn trong ô)
 * @param {string} sheetUrlOrId - URL hoặc ID của Google Sheet
 * @param {string|number} gid - Sheet Tab ID (tùy chọn)
 */
function fetchSheetData(sheetUrlOrId, gid) {
  try {
    let targetUrl = sheetUrlOrId || CONFIG.DEFAULT_SHEET_URL;
    let targetGid = gid;

    // Tự động bóc tách GID từ URL nếu chưa có gid riêng
    if (!targetGid && targetUrl && targetUrl.indexOf("gid=") !== -1) {
      const matchGid = targetUrl.match(/[#&?]gid=([0-9]+)/);
      if (matchGid && matchGid[1]) {
        targetGid = matchGid[1];
      }
    }

    let ss;
    if (targetUrl.indexOf("docs.google.com") !== -1) {
      ss = SpreadsheetApp.openByUrl(targetUrl);
    } else if (targetUrl) {
      ss = SpreadsheetApp.openById(targetUrl);
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      throw new Error("Không thể mở bảng tính với thông tin đã cung cấp.");
    }

    let sheet;
    if (targetGid) {
      const sheets = ss.getSheets();
      sheet = sheets.find(s => String(s.getSheetId()) === String(targetGid)) || ss.getActiveSheet();
    } else {
      sheet = ss.getActiveSheet();
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const richTextValues = dataRange.getRichTextValues();

    if (values.length < 2) {
      return { success: true, count: 0, items: [], sheetName: sheet.getName() };
    }

    // Tự động tìm dòng Header thực sự (quét trong 6 dòng đầu tiên)
    let headerRowIdx = 0;
    let colMap = null;

    for (let r = 0; r < Math.min(values.length, 6); r++) {
      const row = values[r].map(h => String(h || "").trim().toLowerCase());
      const hasAddr = findColIndex(row, ["địa chỉ", "dia chi", "vị trí"]) !== -1;
      const hasRoom = findColIndex(row, ["phòng trống", "phòng", "mã phòng", "căn"]) !== -1;
      const hasPrice = findColIndex(row, ["đơn giá", "giá", "giá thuê", "price"]) !== -1;

      if (hasAddr || (hasRoom && hasPrice)) {
        headerRowIdx = r;
        colMap = {
          stt: findColIndex(row, ["va stt", "stt", "số tt", "no"]),
          houseName: findColIndex(row, ["tên nhà", "tên", "toa nha", "toà nhà"]),
          address: findColIndex(row, ["địa chỉ", "dia chi", "vị trí"]),
          elevator: findColIndex(row, ["thang", "thang máy", "thang bo", "loại thang"]),
          emptyRooms: findColIndex(row, ["phòng trống", "phòng", "mã phòng", "căn"]),
          media: findColIndex(row, ["ảnh + video", "ảnh", "video", "media", "link ảnh"]),
          price: findColIndex(row, ["đơn giá", "giá", "giá thuê", "price"]),
          furniture: findColIndex(row, ["nội thất bao gồm", "nội thất", "đồ đạc"]),
          services: findColIndex(row, ["tiền dịch vụ", "dịch vụ", "chi phí", "phí dv"]),
          contactPhone: findColIndex(row, ["sđt dẫn", "sđt", "liên hệ", "phone", "sdt"]),
          roomDetails: findColIndex(row, ["thông tin phòng", "chi tiết phòng", "mô tả"]),
          note: findColIndex(row, ["ghi chú", "note", "thời gian ở"])
        };
        break;
      }
    }

    // Fallback nếu không khớp từ khóa
    if (!colMap) {
      const row = values[0].map(h => String(h || "").trim().toLowerCase());
      colMap = {
        stt: 0, houseName: 1, address: 2, elevator: 3, emptyRooms: 4,
        media: 5, price: 6, furniture: 7, services: 8, contactPhone: 9,
        roomDetails: 10, note: 11
      };
      headerRowIdx = 0;
    }

    const items = [];

    for (let r = headerRowIdx + 1; r < values.length; r++) {
      const rowVal = values[r];
      const rowRich = richTextValues[r];

      // Bỏ qua dòng trống hoàn toàn
      if (rowVal.every(cell => cell === "" || cell === null)) continue;

      const rawHouseName = getCellStr(rowVal, colMap.houseName);
      const rawAddress = getCellStr(rowVal, colMap.address);
      let rawPrice = getCellStr(rowVal, colMap.price);
      const rawEmptyRooms = getCellStr(rowVal, colMap.emptyRooms);
      const rawElevator = getCellStr(rowVal, colMap.elevator);
      const rawFurniture = getCellStr(rowVal, colMap.furniture);
      const rawServices = getCellStr(rowVal, colMap.services);
      const rawPhone = getCellStr(rowVal, colMap.contactPhone);
      const rawDetails = getCellStr(rowVal, colMap.roomDetails);
      const rawNote = getCellStr(rowVal, colMap.note);
      const rawStt = getCellStr(rowVal, colMap.stt) || String(items.length + 1);

      // Bỏ qua dòng tiêu đề phụ hoặc dòng không có địa chỉ lẫn phòng trống
      if (!rawAddress && !rawEmptyRooms && !rawPrice) continue;

      // Định dạng hiển thị đơn giá nếu là số
      if (typeof rowVal[colMap.price] === "number") {
        rawPrice = rowVal[colMap.price].toLocaleString("vi-VN");
      }

      // Bóc tách Hyperlink từ cột Media
      let mediaLink = "";
      let mediaText = "";
      if (colMap.media !== -1 && rowRich && rowRich[colMap.media]) {
        const cellRich = rowRich[colMap.media];
        mediaText = String(rowVal[colMap.media] || "").trim();
        mediaLink = cellRich.getLinkUrl() || "";
        
        if (!mediaLink && mediaText.startsWith("http")) {
          mediaLink = mediaText;
        }
      }

      // Xử lý thông tin ảnh/folder Drive
      const driveInfo = parseDriveUrl(mediaLink);

      const item = {
        id: "room_" + r,
        rowIndex: r + 1,
        stt: rawStt,
        houseName: rawHouseName,
        address: rawAddress,
        elevator: rawElevator,
        emptyRooms: rawEmptyRooms,
        price: rawPrice,
        furniture: rawFurniture,
        services: rawServices,
        contactPhone: rawPhone,
        details: rawDetails,
        note: rawNote,
        mediaText: mediaText,
        mediaLink: mediaLink,
        driveInfo: driveInfo,
        images: []
      };

      item.formattedSalesText = generateSalesPostText(item);

      if (driveInfo.type === "file" && driveInfo.id) {
        item.images = [{
          id: driveInfo.id,
          name: "Ảnh phòng " + (rawEmptyRooms || rawHouseName),
          thumbnailUrl: "https://lh3.googleusercontent.com/d/" + driveInfo.id,
          directUrl: "https://drive.google.com/uc?export=view&id=" + driveInfo.id,
          previewUrl: "https://drive.google.com/file/d/" + driveInfo.id + "/view"
        }];
      }

      items.push(item);
    }

    return {
      success: true,
      spreadsheetTitle: ss.getName(),
      sheetName: sheet.getName(),
      count: items.length,
      items: items
    };

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

/**
 * Lấy danh sách ảnh từ Folder Google Drive (kèm bộ nhớ Cache để tăng tốc)
 * @param {string} folderIdOrUrl - ID hoặc URL của Google Drive Folder
 */
function getDriveFolderImages(folderIdOrUrl) {
  try {
    if (!folderIdOrUrl) return { success: true, images: [] };

    const driveInfo = parseDriveUrl(folderIdOrUrl);
    if (!driveInfo.id) return { success: true, images: [] };

    // Kiểm tra trong CacheService trước
    const cache = CacheService.getScriptCache();
    const cacheKey = "DRIVE_FOLDER_" + driveInfo.id;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      return { success: true, fromCache: true, images: JSON.parse(cachedData) };
    }

    const images = [];

    if (driveInfo.type === "folder") {
      const folder = DriveApp.getFolderById(driveInfo.id);
      const files = folder.getFiles();

      while (files.hasNext()) {
        const file = files.next();
        const mime = file.getMimeType();
        // Chỉ lấy các định dạng ảnh
        if (mime.startsWith("image/")) {
          const fileId = file.getId();
          images.push({
            id: fileId,
            name: file.getName(),
            mimeType: mime,
            size: file.getSize(),
            thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fileId,
            directUrl: "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200",
            previewUrl: "https://drive.google.com/file/d/" + fileId + "/view"
          });
        }
      }
    } else if (driveInfo.type === "file") {
      const file = DriveApp.getFileById(driveInfo.id);
      const fileId = file.getId();
      images.push({
        id: fileId,
        name: file.getName(),
        mimeType: file.getMimeType(),
        thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fileId,
        directUrl: "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200",
        previewUrl: "https://drive.google.com/file/d/" + fileId + "/view"
      });
    }

    // Lưu cache
    if (images.length > 0) {
      cache.put(cacheKey, JSON.stringify(images), CONFIG.CACHE_EXPIRATION_SECONDS);
    }

    return { success: true, fromCache: false, count: images.length, images: images };

  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      images: []
    };
  }
}

/**
 * Xóa cache
 */
function clearCache() {
  const cache = CacheService.getScriptCache();
  SpreadsheetApp.getActiveSpreadsheet().toast("Đã làm mới bộ đệm hệ thống!", "Thông báo", 3);
}

// ===================== HELPER UTILS ===================== //

function findColIndex(headers, keywords) {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    for (let k = 0; k < keywords.length; k++) {
      if (h === keywords[k] || h.indexOf(keywords[k]) !== -1) {
        return i;
      }
    }
  }
  return -1;
}

function getCellStr(row, index) {
  if (index === -1 || index >= row.length || row[index] === undefined || row[index] === null) {
    return "";
  }
  return String(row[index]).trim();
}

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

function generateSalesPostText(item) {
  const lines = [
    `Mã phòng : ${item.emptyRooms || ''}`,
    `Địa chỉ : ${item.address || ''}`,
    `Giá : ${item.price || ''}`,
    `danh sách các dịch vụ : ${item.services ? ('\n' + item.services) : ''}`,
    `Phòng trống : ${item.note || 'ở ngay'}`,
    `Note : ${[item.furniture, item.details].filter(Boolean).join('\n')}`
  ];
  
  return lines.join('\n');
}

/**
 * Tự động tạo và điền cột 'Thông tin gửi khách' trực tiếp vào bảng tính
 */
function insertFormattedColumnToSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const res = fetchSheetData();
  
  if (!res.success || !res.items || res.items.length === 0) {
    ss.toast("Không tìm thấy dữ liệu phòng để xử lý!", "Lỗi", 3);
    return;
  }

  const values = sheet.getDataRange().getValues();
  // Header dòng 2 (index 1)
  const headerRowIdx = values.length > 1 && values[0].every(c => !c || c === "va") ? 1 : 0;
  const headers = values[headerRowIdx];

  // Tìm xem đã có cột 'Thông tin gửi khách' chưa
  let targetColIdx = headers.findIndex(h => String(h).trim().toLowerCase() === "thông tin gửi khách");
  let targetColNumber;

  if (targetColIdx === -1) {
    targetColNumber = sheet.getLastColumn() + 1;
    sheet.getRange(headerRowIdx + 1, targetColNumber).setValue("Thông tin gửi khách");
  } else {
    targetColNumber = targetColIdx + 1;
  }

  const outputRows = [];
  const totalRows = values.length;

  for (let r = headerRowIdx + 1; r < totalRows; r++) {
    const item = res.items.find(it => it.rowIndex === (r + 1));
    if (item && item.formattedSalesText) {
      outputRows.push([item.formattedSalesText]);
    } else {
      outputRows.push([""]);
    }
  }

  if (outputRows.length > 0) {
    const targetRange = sheet.getRange(headerRowIdx + 2, targetColNumber, outputRows.length, 1);
    targetRange.setValues(outputRows);
    targetRange.setWrap(true); // Bật chế độ xuống dòng tự động
    sheet.setColumnWidth(targetColNumber, 350);
    ss.toast("Đã điền thành công " + res.items.length + " phòng vào cột 'Thông tin gửi khách'!", "Thành công", 4);
  }
}

/**
 * Hàm kiểm thử đọc dữ liệu từ Sheet (Chạy trực tiếp từ nút Run trên Web Editor)
 */
function testFetchSheetData() {
  Logger.log("🧪 BẮT ĐẦU TEST ĐỌC BẢNG TÍNH GOOGLE SHEETS...");
  const res = fetchSheetData(CONFIG.DEFAULT_SHEET_URL, CONFIG.DEFAULT_GID);
  
  if (!res.success) {
    Logger.log("❌ TEST THẤT BẠI: " + res.error);
    return;
  }
  
  Logger.log("✅ TEST THÀNH CÔNG!");
  Logger.log("📊 Tổng số phòng bóc tách được: " + res.count);
  
  if (res.items && res.items.length > 0) {
    const first = res.items[0];
    Logger.log("--- MẪU PHÒNG ĐẦU TIÊN ---");
    Logger.log("Tên nhà: " + first.houseName);
    Logger.log("Địa chỉ: " + first.address);
    Logger.log("Giá thuê: " + first.price);
    Logger.log("Link Drive bóc tách: " + first.mediaLink);
    Logger.log("Drive Type: " + first.driveInfo.type + " (ID: " + first.driveInfo.id + ")");
  }
}

/**
 * Hàm kiểm thử quét ảnh từ Google Drive Folder
 */
function testGetDriveImages() {
  Logger.log("🧪 BẮT ĐẦU TEST LẤY ẢNH GOOGLE DRIVE...");
  // Test thử với 1 link drive bất kỳ
  const testUrl = "https://drive.google.com/drive/folders/test_id";
  const info = parseDriveUrl(testUrl);
  Logger.log("Parse URL kết quả: " + JSON.stringify(info));
}
