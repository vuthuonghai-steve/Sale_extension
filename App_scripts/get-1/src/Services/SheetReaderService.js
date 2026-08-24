/**
 * @file src/Services/SheetReaderService.js
 * Dịch vụ đọc và phân tích cấu trúc Google Spreadsheet (Values, RichText, Formulas)
 * Hỗ trợ ánh xạ cột động (Dynamic ColumnMap) dựa trên Schema Fields & Aliases.
 */

/**
 * Tìm dòng header trong sheet và xây dựng ColumnMap tự động dựa trên Schema Aliases
 * @param {Array<Array<any>>} allRows 
 * @param {Object} schemaFields - Cấu hình các trường trong Schema (kèm aliases)
 * @param {Object} [options] 
 * @returns {{ headerIndex: number, header: Array<string>, columnMap: Object.<string, number> }}
 */
function findHeaderRow(allRows, schemaFields, options) {
  if (!allRows || allRows.length === 0) return { headerIndex: -1, header: [], columnMap: {} };

  const maxScanRows = Math.min(allRows.length, (options && options.headerScanLimit) || 10);
  const fields = schemaFields || {};
  const fieldKeys = Object.keys(fields);

  let bestMatchIndex = 0;
  let maxMatchCount = 0;
  let bestColumnMap = {};

  for (let r = 0; r < maxScanRows; r++) {
    const row = allRows[r];
    if (!row || !Array.isArray(row)) continue;

    let matchCount = 0;
    const currentMap = {};

    row.forEach((cell, colIdx) => {
      const cellText = String(cell || "").trim().toLowerCase();
      if (!cellText) return;

      // So khớp với aliases của từng trường trong schema
      for (let k = 0; k < fieldKeys.length; k++) {
        const fieldKey = fieldKeys[k];
        const fieldDef = fields[fieldKey];
        const aliases = (fieldDef && fieldDef.aliases) ? fieldDef.aliases.map(a => String(a).trim().toLowerCase()) : [fieldKey.toLowerCase()];

        if (aliases.includes(cellText)) {
          if (currentMap[fieldKey] === undefined) {
            currentMap[fieldKey] = colIdx;
            matchCount++;
          }
          break;
        }
      }
    });

    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestMatchIndex = r;
      bestColumnMap = currentMap;
    }
  }

  // Nếu dòng tốt nhất không tìm thấy một số trường, quét thêm theo tên khớp một phần (substring fallback)
  if (allRows[bestMatchIndex]) {
    const headerRow = allRows[bestMatchIndex];
    fieldKeys.forEach(fieldKey => {
      if (bestColumnMap[fieldKey] === undefined) {
        const fieldDef = fields[fieldKey];
        const aliases = (fieldDef && fieldDef.aliases) ? fieldDef.aliases.map(a => String(a).trim().toLowerCase()) : [fieldKey.toLowerCase()];

        headerRow.forEach((cell, colIdx) => {
          const cellText = String(cell || "").trim().toLowerCase();
          if (!cellText) return;

          for (let a = 0; a < aliases.length; a++) {
            if (cellText.includes(aliases[a]) && bestColumnMap[fieldKey] === undefined) {
              bestColumnMap[fieldKey] = colIdx;
              break;
            }
          }
        });
      }
    });
  }

  return {
    headerIndex: bestMatchIndex,
    header: allRows[bestMatchIndex] ? allRows[bestMatchIndex].map(c => String(c || "").trim()) : [],
    columnMap: bestColumnMap
  };
}

/**
 * Mở Spreadsheet theo ID hoặc lấy Active Spreadsheet
 * @param {string} [spreadsheetId] 
 * @returns {{ ss: GoogleAppsScript.Spreadsheet.Spreadsheet|null, sourceMode: string }}
 */
function openTargetSpreadsheet(spreadsheetId) {
  const targetId = spreadsheetId || CONFIG.DEFAULT_SPREADSHEET_ID;
  let ss = null;
  let sourceMode = "unknown";

  if (targetId) {
    try {
      ss = SpreadsheetApp.openById(targetId);
      sourceMode = `openById(${targetId})`;
    } catch (e) {
      LoggerService.warn(`Không thể mở Spreadsheet "${targetId}": ${e.message}`);
    }
  }

  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) sourceMode = "getActiveSpreadsheet()";
    } catch (e) {
      // Ignored
    }
  }

  return { ss, sourceMode };
}

/**
 * Đọc toàn diện dữ liệu của 1 Sheet (Values, RichText và Formulas)
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 
 * @returns {{ values: Array<Array<any>>, richTexts: Array<Array<GoogleAppsScript.Spreadsheet.RichTextValue>>, formulas: Array<Array<string>> }}
 */
function readSheetMatrix(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues() || [];
  let richTexts = null;
  let formulas = null;

  try {
    richTexts = range.getRichTextValues();
  } catch (e) {
    LoggerService.warn(`Lỗi lấy RichTextValues: ${e.message}`);
  }

  try {
    formulas = range.getFormulas();
  } catch (e) {
    LoggerService.warn(`Lỗi lấy Formulas: ${e.message}`);
  }

  return { values, richTexts, formulas };
}
