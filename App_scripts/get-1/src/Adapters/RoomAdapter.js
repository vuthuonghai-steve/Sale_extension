/**
 * @file src/Adapters/RoomAdapter.js
 * Tầng Adapter: Chuẩn hóa dòng dữ liệu phòng trọ sang Clean Canonical DTO Model
 * Hỗ trợ trích xuất động dựa trên ColumnMap của Schema Registry.
 */

/**
 * Chuẩn hóa 1 dòng dữ liệu thô sang RoomDto theo ColumnMap của Schema
 * @param {Array<any>} row 
 * @param {Array<GoogleAppsScript.Spreadsheet.RichTextValue>} richTextRow 
 * @param {Array<string>} formulaRow 
 * @param {Object.<string, number>} columnMap - Bản đồ chỉ mục cột đã giải quyết từ Schema
 * @param {Object} tabOptions - Tùy chọn xử lý của Tab/Schema
 * @param {string} sheetName 
 * @param {number} rowIndex 
 * @param {HouseContext|null} parentContext 
 * @returns {RoomDto}
 */
function normalizeRowToDto(row, richTextRow, formulaRow, columnMap, tabOptions, sheetName, rowIndex, parentContext) {
  const getCellData = (fieldKey) => {
    const colIdx = columnMap ? columnMap[fieldKey] : undefined;
    if (colIdx !== undefined && colIdx !== -1 && row && colIdx < row.length) {
      return {
        val: row[colIdx] !== undefined && row[colIdx] !== null ? row[colIdx] : "",
        rich: richTextRow && richTextRow[colIdx] ? richTextRow[colIdx] : null,
        formula: formulaRow && formulaRow[colIdx] ? formulaRow[colIdx] : "",
        idx: colIdx
      };
    }
    return { val: "", rich: null, formula: "", idx: -1 };
  };

  const stt = getCellData("id");
  const house = getCellData("houseName");
  const room = getCellData("room");
  const address = getCellData("address");
  const elevator = getCellData("elevator");
  const media = getCellData("media");
  const price = getCellData("price");
  const furniture = getCellData("furniture");
  const serviceFee = getCellData("serviceFee");
  const phone = getCellData("phone");
  const description = getCellData("description");
  const note = getCellData("note");

  const rawStt = cleanText(stt.val);
  const rawHouse = cleanText(house.val);
  const rawRoom = cleanText(room.val);
  const rawAddress = cleanText(address.val);
  const rawElevator = cleanText(elevator.val);
  const rawFurniture = cleanText(furniture.val);
  const rawServiceFee = cleanText(serviceFee.val);
  const rawPhone = cleanText(phone.val);
  const rawDesc = cleanText(description.val);
  const rawNote = formatDateValue(note.val);
  const rawMediaText = cleanText(media.val);

  // Kế thừa thông tin toà nhà từ Context cha (Forward-Fill Context) nếu được cấu hình
  const hasMerged = tabOptions ? tabOptions.hasMergedBuildings !== false : true;
  const houseName = rawHouse || (hasMerged && parentContext ? parentContext.houseName : "");
  const houseAddress = rawAddress || (hasMerged && parentContext ? parentContext.address : "");
  const houseElevator = normalizeElevator(rawElevator || (hasMerged && parentContext ? parentContext.elevator : ""));
  const houseFurniture = rawFurniture || (hasMerged && parentContext ? parentContext.furniture : "");
  const houseServiceFee = rawServiceFee || (hasMerged && parentContext ? parentContext.serviceFee : "");
  const housePhone = rawPhone || (hasMerged && parentContext ? parentContext.phone : "");
  const houseDesc = rawDesc || (hasMerged && parentContext ? parentContext.description : "");
  const itemNote = rawNote || (hasMerged && parentContext ? parentContext.note : "");

  // Quét toàn diện Hyperlink từ cột Media, Room, House và toàn bộ các ô trong dòng
  const directCellLinks = new Set();
  [media, room, house, description, note].forEach(f => {
    if (f.idx !== -1) {
      extractAllLinksFromCell(f.val, f.rich, f.formula).forEach(l => directCellLinks.add(l));
    }
  });

  // Nếu vẫn chưa thấy link ở các cột chính, quét qua toàn bộ các ô trong hàng
  if (directCellLinks.size === 0 && row) {
    for (let c = 0; c < row.length; c++) {
      const richCell = richTextRow ? richTextRow[c] : null;
      const formCell = formulaRow ? formulaRow[c] : null;
      extractAllLinksFromCell(row[c], richCell, formCell).forEach(l => directCellLinks.add(l));
    }
  }

  // Giải quyết media với cơ chế fallback từ tòa nhà cha
  const fallbackMedia = hasMerged && parentContext ? parentContext.media : null;
  const cleanMedia = resolveCleanMedia(Array.from(directCellLinks), fallbackMedia);

  // Chuẩn hóa giá tiền (hỗ trợ đơn vị triệu hoặc vnd)
  let numericPrice = parsePrice(price.val);
  if (tabOptions && tabOptions.priceUnit === "trieu" && numericPrice > 0 && numericPrice < 100) {
    numericPrice = numericPrice * 1000000;
  }

  // Suy luận số phòng thông minh (từ ô phòng hoặc tên file media 303.mp4 / p202)
  const enableSmartRoom = tabOptions ? tabOptions.smartRoomInference !== false : true;
  const roomInference = enableSmartRoom ? inferRoomNumber(rawRoom, rawMediaText) : { resolvedRoom: rawRoom, isFromMedia: false };
  const finalRoom = roomInference.resolvedRoom;
  const rooms = parseCleanRooms(finalRoom);

  // Chuẩn hóa số điện thoại
  const phones = parseCleanPhones(housePhone);

  const roomDisplay = finalRoom ? `P.${finalRoom}` : "Phòng trống";
  const fullTitle = houseName ? `${houseName} - ${roomDisplay}` : roomDisplay;
  const idValue = rawStt && !isNaN(parseInt(rawStt, 10)) ? parseInt(rawStt, 10) : `${houseName}_${finalRoom}_${rowIndex}`.replace(/[\s\.\,\/]+/g, '_');

  return {
    id: idValue,
    stt: rawStt ? (isNaN(parseInt(rawStt, 10)) ? rawStt : parseInt(rawStt, 10)) : rowIndex,
    houseName: houseName,
    room: finalRoom,
    rooms: rooms,
    title: fullTitle,
    address: houseAddress,
    elevator: houseElevator,
    price: numericPrice,
    priceFormatted: formatPriceText(numericPrice),
    phones: phones,
    furniture: houseFurniture,
    serviceFee: houseServiceFee,
    description: houseDesc,
    note: itemNote,
    media: cleanMedia,
    sheetOrigin: sheetName
  };
}
