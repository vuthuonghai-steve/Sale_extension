/**
 * @file src/Codes/Endpoints.js
 * Điểm vào chính (Main Entrypoint): Tổng hợp dữ liệu từ Sheets theo Schema Registry và Web App Router
 */

/**
 * Đọc, làm sạch và chuẩn hóa toàn bộ dữ liệu từ Spreadsheet dựa trên Schema Registry
 * @param {string} [spreadsheetId] 
 * @returns {{ data: Array<RoomDto>, diagnostics: Object }}
 */
function fetchAllData(spreadsheetId) {
  const targetId = spreadsheetId || CONFIG.DEFAULT_SPREADSHEET_ID;
  const { ss, sourceMode } = openTargetSpreadsheet(targetId);
  const schema = CONFIG.getSchema(targetId);

  const availableSheets = ss ? ss.getSheets().map(s => {
    return {
      sheetName: s.getName(),
      sheetId: s.getSheetId(),
      totalRows: s.getLastRow(),
      totalCols: s.getLastColumn()
    };
  }) : [];

  const diagnostics = {
    sourceMode: sourceMode,
    targetSpreadsheetId: targetId,
    activeSchemaName: schema.name,
    hasSpreadsheetAccess: !!ss,
    availableSheetsInFile: availableSheets,
    sheetDetails: {}
  };

  if (!ss) {
    LoggerService.error(`Không thể truy cập Spreadsheet "${targetId}"`);
    return { data: [], diagnostics: diagnostics };
  }

  let results = [];
  
  // Xác định danh sách các Sheet cần đọc (Ưu tiên các tab khai báo trong schema, nếu rỗng thì duyệt toàn bộ các tab có trong Spreadsheet)
  const targetSheetNames = (schema.tabs && Object.keys(schema.tabs).length > 0)
    ? Object.keys(schema.tabs)
    : availableSheets.map(s => s.sheetName);

  targetSheetNames.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      diagnostics.sheetDetails[sheetName] = { status: "NOT_FOUND" };
      return;
    }

    const { values, richTexts, formulas } = readSheetMatrix(sheet);
    if (!values || values.length <= 1) {
      diagnostics.sheetDetails[sheetName] = { status: "EMPTY_OR_NO_DATA", rowCount: values ? values.length : 0 };
      return;
    }

    // Lấy cấu hình trường và options cho tab này từ Schema
    const tabConfig = CONFIG.resolveTabConfig(schema, sheetName);
    const { headerIndex, header, columnMap } = findHeaderRow(values, tabConfig.fields, tabConfig.options);

    let currentHouseContext = null;
    const validRows = [];

    for (let r = headerIndex + 1; r < values.length; r++) {
      const rowVal = values[r];
      const rowRich = richTexts ? richTexts[r] : null;
      const rowFormula = formulas ? formulas[r] : null;

      // Bỏ qua dòng hoàn toàn rỗng
      const hasContent = rowVal.some(cell => cell !== "" && cell !== null && cell !== undefined);
      if (!hasContent) continue;

      const getVal = (fieldKey) => {
        const cIdx = columnMap[fieldKey];
        return (cIdx !== undefined && cIdx !== -1 && rowVal[cIdx] !== undefined) ? String(rowVal[cIdx] || "").trim() : "";
      };

      const rawStt = getVal("id");
      const rawHouse = getVal("houseName");
      const rawAddress = getVal("address");
      const rawPhone = getVal("phone");
      const rawServiceFee = getVal("serviceFee");
      const rawElevator = getVal("elevator");
      const rawDesc = getVal("description");
      const rawFurniture = getVal("furniture");
      const rawNote = getVal("note");

      const isNewBuilding = (rawHouse !== "") || 
                            (rawAddress !== "" && (!currentHouseContext || currentHouseContext.address !== rawAddress)) || 
                            (rawStt !== "" && !isNaN(parseInt(rawStt, 10)) && (!currentHouseContext || rawHouse !== ""));

      // Khi phát hiện tòa nhà mới -> Reset sạch context để chống rò rỉ dữ liệu (Context Leaking)
      if (isNewBuilding) {
        // Quét link media mặc định của tòa nhà
        const houseLinks = [];
        if (rowVal) {
          for (let c = 0; c < rowVal.length; c++) {
            const richCell = rowRich ? rowRich[c] : null;
            const formCell = rowFormula ? rowFormula[c] : null;
            extractAllLinksFromCell(rowVal[c], richCell, formCell).forEach(l => houseLinks.push(l));
          }
        }
        const houseMedia = houseLinks.length > 0 ? resolveCleanMedia(houseLinks) : null;

        currentHouseContext = {
          houseName: rawHouse,
          address: rawAddress,
          phone: rawPhone,
          serviceFee: rawServiceFee,
          elevator: rawElevator,
          description: rawDesc,
          furniture: rawFurniture,
          note: rawNote,
          media: houseMedia
        };
      } else if (currentHouseContext) {
        // Cập nhật thông tin bổ sung nếu dòng kế tiếp có khai báo thêm
        if (rawPhone && !currentHouseContext.phone) currentHouseContext.phone = rawPhone;
        if (rawServiceFee && !currentHouseContext.serviceFee) currentHouseContext.serviceFee = rawServiceFee;
        if (rawElevator && !currentHouseContext.elevator) currentHouseContext.elevator = rawElevator;
        if (rawFurniture && !currentHouseContext.furniture) currentHouseContext.furniture = rawFurniture;
        if (rawDesc && !currentHouseContext.description) currentHouseContext.description = rawDesc;
      }

      const normalized = normalizeRowToDto(
        rowVal,
        rowRich,
        rowFormula,
        columnMap,
        tabConfig.options,
        sheetName,
        r + 1,
        currentHouseContext
      );

      // ĐIỀU KIỆN CHÍNH XÁC: Chỉ nhận diện là phòng khi có giá tiền hợp lệ HOẶC có số phòng cụ thể
      const isValidRoom = (normalized.price > 0) || (normalized.room !== "");

      if (isValidRoom) {
        validRows.push(normalized);
      }
    }

    diagnostics.sheetDetails[sheetName] = {
      status: "SUCCESS",
      detectedHeaderRow: headerIndex + 1,
      resolvedColumnMap: columnMap,
      headerColumns: header.filter(c => c !== ""),
      totalRawRows: values.length,
      extractedRooms: validRows.length
    };

    results = results.concat(validRows);
  });

  return { data: results, diagnostics: diagnostics };
}

/**
 * Lấy toàn bộ danh sách phòng DTO
 * @param {string} [spreadsheetId] 
 * @returns {Array<RoomDto>}
 */
function getAllObjects(spreadsheetId) {
  return fetchAllData(spreadsheetId).data;
}

/**
 * Đóng gói JSON trả về chuẩn cho HTTP Web App
 * @param {any} payload 
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function createJsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint Web App (HTTP GET Router)
 * @param {Object} e - Event request từ Apps Script
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || CONSTANTS.ACTIONS.LIST;
    const spreadsheetId = params.spreadsheetId || null;

    // Action kiểm tra chi tiết từng cell thô
    if (action === CONSTANTS.ACTIONS.DEBUG_RAW) {
      const targetId = spreadsheetId || CONFIG.DEFAULT_SPREADSHEET_ID;
      const { ss } = openTargetSpreadsheet(targetId);
      if (!ss) return createJsonResponse({ error: "No spreadsheet found" });

      const sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];
      const { values, richTexts, formulas } = readSheetMatrix(sheet);

      const inspectedRows = [];
      const scanLimit = Math.min(values.length, 15);

      for (let r = 0; r < scanLimit; r++) {
        const rowData = [];
        for (let c = 0; c < values[r].length; c++) {
          const val = values[r][c];
          const rich = richTexts ? richTexts[r][c] : null;
          const form = formulas ? formulas[r][c] : null;
          const cellLinks = extractAllLinksFromCell(val, rich, form);

          rowData.push({
            colIndex: c,
            value: val,
            formula: form,
            cellLinkUrl: rich ? rich.getLinkUrl() : null,
            extractedLinks: cellLinks
          });
        }
        inspectedRows.push({ rowIndex: r + 1, cells: rowData });
      }

      return createJsonResponse({
        status: CONSTANTS.STATUS.DEBUG_RAW,
        totalRows: values.length,
        inspectedRows: inspectedRows
      });
    }

    // Action kiểm tra cấu hình diagnostics và schema mapping
    if (action === CONSTANTS.ACTIONS.DEBUG) {
      const result = fetchAllData(spreadsheetId);
      return createJsonResponse({
        status: CONSTANTS.STATUS.DEBUG_INFO,
        total: result.data.length,
        diagnostics: result.diagnostics,
        sampleData: result.data.slice(0, 2)
      });
    }

    // Action mặc định: lấy toàn bộ danh sách phòng sạch
    const result = fetchAllData(spreadsheetId);
    return createJsonResponse({
      status: CONSTANTS.STATUS.SUCCESS,
      total: result.data.length,
      data: result.data
    });
  } catch (error) {
    LoggerService.error(`Lỗi xử lý doGet: ${error.message}`, error);
    return createJsonResponse({
      status: CONSTANTS.STATUS.ERROR,
      message: error.message
    });
  }
}

/**
 * Hàm kiểm tra chạy thử trong Apps Script Editor Console
 */
function testRun() {
  LoggerService.info("=== BẮT ĐẦU CHẠY THỬ NGHIỆM SCHEMA MAPPING ===");
  const result = fetchAllData();
  LoggerService.info(`Active Schema: ${result.diagnostics.activeSchemaName}`);
  LoggerService.info(`Tổng số phòng trích xuất: ${result.data.length}`);
  if (result.data.length > 0) {
    LoggerService.info("Mẫu phòng 1 sau khi clean:", result.data[0]);
  }
  LoggerService.info("=== KẾT THÚC CHẠY THỬ NGHIỆM ===");
}
