const fs = require('fs');
const path = require('path');

// 1. Đường dẫn file Markdown gốc của các Đơn vị hành chính
const mdPath = path.join(__dirname, '../Docs/danh_sach_quan_huyen_thi_xa.md');
const content = fs.readFileSync(mdPath, 'utf8');

const lines = content.split('\n');

const districts = [];
const wardList = [];

// Hàm chuẩn hóa chuỗi phục vụ tra cứu nhanh
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 2. Parse Bảng 1: 30 Quận/Huyện/Thị xã
let inTable = false;
for (const line of lines) {
  if (line.includes('| STT | Tên Đơn vị Hành chính |')) {
    inTable = true;
    continue;
  }
  if (inTable) {
    if (!line.trim().startsWith('|')) {
      if (districts.length > 0) inTable = false;
      continue;
    }
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 5 && !isNaN(parseInt(parts[0]))) {
      const stt = parseInt(parts[0]);
      const name = parts[1];
      const area = parts[2];
      const population = parts[3];
      const subUnitsInfo = parts[4];

      let type = 'Quận';
      if (name.startsWith('Huyện')) type = 'Huyện';
      if (name.startsWith('Thị xã')) type = 'Thị xã';

      districts.push({
        stt,
        name,
        normalizedName: normalizeText(name),
        shortName: name.replace(/^(Quận|Huyện|Thị xã)\s+/, ''),
        normalizedShortName: normalizeText(name.replace(/^(Quận|Huyện|Thị xã)\s+/, '')),
        type,
        area,
        population,
        subUnitsInfo,
        wards: []
      });
    }
  }
}

// 3. Parse Bảng 2: Phường/Xã/Thị trấn trực thuộc
let currentDistrict = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const distMatch = line.match(/^(\d+)\.\s+\*\*(.*?)\*\*/);
  if (distMatch) {
    const distName = distMatch[2].trim();
    currentDistrict = districts.find(d => d.name.toLowerCase() === distName.toLowerCase());
    continue;
  }

  if (currentDistrict && line.startsWith('-')) {
    let cleanLine = line.replace(/^-\s+/, '');
    let type = 'Phường';
    if (currentDistrict.type === 'Huyện') type = 'Xã';

    if (cleanLine.includes('**Thị trấn:**')) {
      type = 'Thị trấn';
      cleanLine = cleanLine.replace(/\*\*Thị trấn:\*\*\s*/, '');
    } else if (cleanLine.includes('**9 phường:**')) {
      type = 'Phường';
      cleanLine = cleanLine.replace(/\*\*9 phường:\*\*\s*/, '');
    } else if (cleanLine.includes('**6 xã:**')) {
      type = 'Xã';
      cleanLine = cleanLine.replace(/\*\*6 xã:\*\*\s*/, '');
    } else if (/\*\*\d+\s+xã:\*\*/.test(cleanLine)) {
      type = 'Xã';
      cleanLine = cleanLine.replace(/\*\*\d+\s+xã:\*\*\s*/, '');
    }

    cleanLine = cleanLine.replace(/\.$/, '');
    const names = cleanLine.split(',').map(s => s.trim()).filter(Boolean);

    for (const rawName of names) {
      const wardName = rawName.trim();
      const fullName = `${type} ${wardName}`;
      
      const item = {
        name: wardName,
        fullName: fullName,
        type: type,
        districtName: currentDistrict.name,
        districtType: currentDistrict.type,
        normalizedName: normalizeText(wardName),
        normalizedFullName: normalizeText(fullName),
      };

      currentDistrict.wards.push(item);
      wardList.push(item);
    }
  }
}

// 4. Danh sách các tuyến Đường / Phố chính tại Hà Nội
const hanoiStreets = [
  // Cầu Giấy
  { street: "Cầu Giấy", ward: "Phường Quan Hoa / Dịch Vọng", district: "Quận Cầu Giấy" },
  { street: "Duy Tân", ward: "Phường Dịch Vọng Hậu", district: "Quận Cầu Giấy" },
  { street: "Hoàng Quốc Việt", ward: "Phường Nghĩa Tân / Nghĩa Đô", district: "Quận Cầu Giấy" },
  { street: "Xuân Thủy", ward: "Phường Dịch Vọng Hậu", district: "Quận Cầu Giấy" },
  { street: "Nguyễn Phong Sắc", ward: "Phường Dịch Vọng / Nghĩa Tân", district: "Quận Cầu Giấy" },
  { street: "Trần Thái Tông", ward: "Phường Dịch Vọng Hậu", district: "Quận Cầu Giấy" },
  { street: "Trần Đăng Ninh", ward: "Phường Dịch Vọng", district: "Quận Cầu Giấy" },
  { street: "Nguyễn Chánh", ward: "Phường Trung Hòa", district: "Quận Cầu Giấy" },
  { street: "Trung Kính", ward: "Phường Yên Hòa / Trung Hòa", district: "Quận Cầu Giấy" },
  { street: "Vũ Phạm Hàm", ward: "Phường Yên Hòa", district: "Quận Cầu Giấy" },
  { street: "Nguyễn Khang", ward: "Phường Yên Hòa", district: "Quận Cầu Giấy" },
  { street: "Hoàng Ngân", ward: "Phường Trung Hòa", district: "Quận Cầu Giấy" },
  { street: "Lê Văn Lương", ward: "Phường Trung Hòa", district: "Quận Cầu Giấy" },
  { street: "Phạm Văn Đồng", ward: "Phường Mai Dịch", district: "Quận Cầu Giấy" },
  { street: "Phạm Hùng", ward: "Phường Mai Dịch", district: "Quận Cầu Giấy" },
  { street: "Tô Hiệu", ward: "Phường Nghĩa Tân", district: "Quận Cầu Giấy" },
  { street: "Nghĩa Tân", ward: "Phường Nghĩa Tân", district: "Quận Cầu Giấy" },
  { street: "Nguyễn Văn Huyên", ward: "Phường Quan Hoa / Dịch Vọng", district: "Quận Cầu Giấy" },
  { street: "Dương Đình Nghệ", ward: "Phường Yên Hòa", district: "Quận Cầu Giấy" },
  { street: "Do Doãn Thiện", ward: "Phường Mai Dịch", district: "Quận Cầu Giấy" },
  { street: "Đặng Thùy Trâm", ward: "Phường Dịch Vọng Hậu", district: "Quận Cầu Giấy" },
  { street: "Trần Quý Kiên", ward: "Phường Dịch Vọng", district: "Quận Cầu Giấy" },
  { street: "Phan Văn Trường", ward: "Phường Dịch Vọng Hậu", district: "Quận Cầu Giấy" },
  { street: "Trương Công Giai", ward: "Phường Dịch Vọng", district: "Quận Cầu Giấy" },

  // Ba Đình
  { street: "Kim Mã", ward: "Phường Kim Mã", district: "Quận Ba Đình" },
  { street: "Liễu Giai", ward: "Phường Liễu Giai", district: "Quận Ba Đình" },
  { street: "Đội Cấn", ward: "Phường Đội Cấn", district: "Quận Ba Đình" },
  { street: "Giảng Võ", ward: "Phường Giảng Võ", district: "Quận Ba Đình" },
  { street: "Nguyễn Thái Học", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Quán Thánh", ward: "Phường Quán Thánh", district: "Quận Ba Đình" },
  { street: "Phan Đình Phùng", ward: "Phường Quán Thánh", district: "Quận Ba Đình" },
  { street: "Vạn Phúc", ward: "Phường Kim Mã", district: "Quận Ba Đình" },
  { street: "Hoàng Hoa Thám", ward: "Phường Ngọc Hà / Vĩnh Phúc", district: "Quận Ba Đình" },
  { street: "Văn Cao", ward: "Phường Liễu Giai", district: "Quận Ba Đình" },
  { street: "Nguyễn Chí Thanh", ward: "Phường Ngọc Khánh", district: "Quận Ba Đình" },
  { street: "Đường Bưởi", ward: "Phường Vĩnh Phúc / Cống Vị", district: "Quận Ba Đình" },
  { street: "Độc Lập", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Hùng Vương", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Sơn Tây", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Trần Phú", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Điện Biên Phủ", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Ngọc Khánh", ward: "Phường Ngọc Khánh", district: "Quận Ba Đình" },
  { street: "Cống Vị", ward: "Phường Cống Vị", district: "Quận Ba Đình" },
  { street: "Linh Lang", ward: "Phường Cống Vị", district: "Quận Ba Đình" },
  { street: "Phan Kế Bính", ward: "Phường Cống Vị", district: "Quận Ba Đình" },
  { street: "Đào Tấn", ward: "Phường Cống Vị", district: "Quận Ba Đình" },
  { street: "Chu Văn An", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Lê Hồng Phong", ward: "Phường Điện Biên", district: "Quận Ba Đình" },
  { street: "Phúc Xá", ward: "Phường Phúc Xá", district: "Quận Ba Đình" },
  { street: "Trúc Bạch", ward: "Phường Trúc Bạch", district: "Quận Ba Đình" },
  { street: "Thành Công", ward: "Phường Thành Công", district: "Quận Ba Đình" },

  // Hoàn Kiếm
  { street: "Hàng Bạc", ward: "Phường Hàng Bạc", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Bài", ward: "Phường Hàng Bài", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Bồ", ward: "Phường Hàng Bồ", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Bông", ward: "Phường Hàng Bông", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Buồm", ward: "Phường Hàng Buồm", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Đào", ward: "Phường Hàng Đào", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Gai", ward: "Phường Hàng Gai", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Mã", ward: "Phường Hàng Mã", district: "Quận Hoàn Kiếm" },
  { street: "Hàng Trống", ward: "Phường Hàng Trống", district: "Quận Hoàn Kiếm" },
  { street: "Lý Thái Tổ", ward: "Phường Lý Thái Tổ", district: "Quận Hoàn Kiếm" },
  { street: "Phan Chu Trinh", ward: "Phường Phan Chu Trinh", district: "Quận Hoàn Kiếm" },
  { street: "Phúc Tân", ward: "Phường Phúc Tân", district: "Quận Hoàn Kiếm" },
  { street: "Trần Hưng Đạo", ward: "Phường Trần Hưng Đạo", district: "Quận Hoàn Kiếm" },
  { street: "Tràng Tiền", ward: "Phường Tràng Tiền", district: "Quận Hoàn Kiếm" },
  { street: "Đinh Tiên Hoàng", ward: "Phường Lý Thái Tổ", district: "Quận Hoàn Kiếm" },
  { street: "Lê Thái Tổ", ward: "Phường Hàng Trống", district: "Quận Hoàn Kiếm" },
  { street: "Tràng Thi", ward: "Phường Hàng Bông", district: "Quận Hoàn Kiếm" },
  { street: "Phố Huế", ward: "Phường Hàng Bài", district: "Quận Hoàn Kiếm / Hai Bà Trưng" },
  { street: "Hàm Long", ward: "Phường Phan Chu Trinh", district: "Quận Hoàn Kiếm" },
  { street: "Lý Thường Kiệt", ward: "Phường Trần Hưng Đạo", district: "Quận Hoàn Kiếm" },
  { street: "Hai Bà Trưng", ward: "Phường Tràng Tiền", district: "Quận Hoàn Kiếm" },
  { street: "Ngô Quyền", ward: "Phường Tràng Tiền", district: "Quận Hoàn Kiếm" },
  { street: "Bà Triệu", ward: "Phường Hàng Bài", district: "Quận Hoàn Kiếm / Hai Bà Trưng" },
  { street: "Tạ Hiện", ward: "Phường Hàng Buồm", district: "Quận Hoàn Kiếm" },
  { street: "Mã Mây", ward: "Phường Hàng Buồm", district: "Quận Hoàn Kiếm" },
  { street: "Đường Thành", ward: "Phường Cửa Đông", district: "Quận Hoàn Kiếm" },
  { street: "Lãn Ông", ward: "Phường Hàng Bồ", district: "Quận Hoàn Kiếm" },

  // Đống Đa
  { street: "Tây Sơn", ward: "Phường Quang Trung / Ngã Tư Sở", district: "Quận Đống Đa" },
  { street: "Nguyễn Lương Bằng", ward: "Phường Nam Đồng", district: "Quận Đống Đa" },
  { street: "Tôn Đức Thắng", ward: "Phường Hàng Bột", district: "Quận Đống Đa" },
  { street: "Khâm Thiên", ward: "Phường Khâm Thiên", district: "Quận Đống Đa" },
  { street: "Chùa Bộc", ward: "Phường Quang Trung", district: "Quận Đống Đa" },
  { street: "Phạm Ngọc Thạch", ward: "Phường Trung Tự / Kim Liên", district: "Quận Đống Đa" },
  { street: "Xã Đàn", ward: "Phường Phương Liên / Nam Đồng", district: "Quận Đống Đa" },
  { street: "Đường Láng", ward: "Phường Láng Thượng / Láng Hạ", district: "Quận Đống Đa" },
  { street: "Láng Hạ", ward: "Phường Láng Hạ", district: "Quận Đống Đa" },
  { street: "Huỳnh Thúc Kháng", ward: "Phường Láng Hạ", district: "Quận Đống Đa" },
  { street: "Thái Hà", ward: "Phường Trung Liệt", district: "Quận Đống Đa" },
  { street: "Thái Thịnh", ward: "Phường Thịnh Quang", district: "Quận Đống Đa" },
  { street: "Hoàng Cầu", ward: "Phường Ô Chợ Dừa", district: "Quận Đống Đa" },
  { street: "Yên Lãng", ward: "Phường Trung Liệt", district: "Quận Đống Đa" },
  { street: "Nguyên Hồng", ward: "Phường Láng Hạ", district: "Quận Đống Đa" },
  { street: "Ô Chợ Dừa", ward: "Phường Ô Chợ Dừa", district: "Quận Đống Đa" },
  { street: "Văn Miếu", ward: "Phường Văn Miếu", district: "Quận Đống Đa" },
  { street: "Quốc Tử Giám", ward: "Phường Quốc Tử Giám", district: "Quận Đống Đa" },
  { street: "Cát Linh", ward: "Phường Cát Linh", district: "Quận Đống Đa" },
  { street: "Đặng Tiến Đông", ward: "Phường Trung Liệt", district: "Quận Đống Đa" },

  // Hai Bà Trưng
  { street: "Bạch Mai", ward: "Phường Cầu Dền / Bạch Mai", district: "Quận Hai Bà Trưng" },
  { street: "Trần Khát Chân", ward: "Phường Phố Huế / Thanh Nhàn", district: "Quận Hai Bà Trưng" },
  { street: "Đại Cồ Việt", ward: "Phường Lê Đại Hành / Bách Khoa", district: "Quận Hai Bà Trưng" },
  { street: "Minh Khai", ward: "Phường Minh Khai", district: "Quận Hai Bà Trưng" },
  { street: "Kim Ngưu", ward: "Phường Thanh Lương / Minh Khai", district: "Quận Hai Bà Trưng" },
  { street: "Thanh Nhàn", ward: "Phường Thanh Nhàn", district: "Quận Hai Bà Trưng" },
  { street: "Giải Phóng", ward: "Phường Đồng Tâm", district: "Quận Hai Bà Trưng / Hoàng Mai" },
  { street: "Lạc Trung", ward: "Phường Vĩnh Tuy", district: "Quận Hai Bà Trưng" },
  { street: "Lò Đúc", ward: "Phường Phạm Đình Hổ", district: "Quận Hai Bà Trưng" },
  { street: "Trương Định", ward: "Phường Trương Định", district: "Quận Hai Bà Trưng" },

  // Thanh Xuân
  { street: "Nguyễn Trãi", ward: "Phường Thượng Đình / Thanh Xuân Trung", district: "Quận Thanh Xuân" },
  { street: "Khuất Duy Tiến", ward: "Phường Thanh Xuân Bắc", district: "Quận Thanh Xuân" },
  { street: "Hoàng Đạo Thúy", ward: "Phường Nhân Chính", district: "Quận Thanh Xuân" },
  { street: "Vũ Tông Phan", ward: "Phường Khương Trung", district: "Quận Thanh Xuân" },
  { street: "Khương Trung", ward: "Phường Khương Trung", district: "Quận Thanh Xuân" },
  { street: "Bùi Xương Trạch", ward: "Phường Khương Đình", district: "Quận Thanh Xuân" },
  { street: "Kim Giang", ward: "Phường Kim Giang", district: "Quận Thanh Xuân" },
  { street: "Nguyễn Xiển", ward: "Phường Hạ Đình", district: "Quận Thanh Xuân" },
  { street: "Nhân Hòa", ward: "Phường Nhân Chính", district: "Quận Thanh Xuân" },
  { street: "Nguyễn Tuân", ward: "Phường Thanh Xuân Trung", district: "Quận Thanh Xuân" },
  { street: "Vũ Trọng Phụng", ward: "Phường Thanh Xuân Trung", district: "Quận Thanh Xuân" },
  { street: "Lê Trọng Tấn", ward: "Phường Khương Mai", district: "Quận Thanh Xuân" },
  { street: "Hoàng Văn Thái", ward: "Phường Khương Mai", district: "Quận Thanh Xuân" },

  // Hoàng Mai
  { street: "Định Công", ward: "Phường Định Công", district: "Quận Hoàng Mai" },
  { street: "Đại Kim", ward: "Phường Đại Kim", district: "Quận Hoàng Mai" },
  { street: "Linh Đàm", ward: "Phường Hoàng Liệt", district: "Quận Hoàng Mai" },
  { street: "Tân Mai", ward: "Phường Tân Mai", district: "Quận Hoàng Mai" },
  { street: "Lĩnh Nam", ward: "Phường Lĩnh Nam", district: "Quận Hoàng Mai" },
  { street: "Vĩnh Hưng", ward: "Phường Vĩnh Hưng", district: "Quận Hoàng Mai" },
  { street: "Tam Trinh", ward: "Phường Mai Động / Yên Sở", district: "Quận Hoàng Mai" },
  { street: "Yên Sở", ward: "Phường Yên Sở", district: "Quận Hoàng Mai" },
  { street: "Nguyễn Hữu Thọ", ward: "Phường Hoàng Liệt", district: "Quận Hoàng Mai" },
  { street: "Nghiêm Xuân Yêm", ward: "Phường Đại Kim", district: "Quận Hoàng Mai" },

  // Bắc Từ Liêm
  { street: "Cổ Nhuế", ward: "Phường Cổ Nhuế 1 / Cổ Nhuế 2", district: "Quận Bắc Từ Liêm" },
  { street: "Đức Thắng", ward: "Phường Đức Thắng", district: "Quận Bắc Từ Liêm" },
  { street: "Thụy Phương", ward: "Phường Thụy Phương", district: "Quận Bắc Từ Liêm" },
  { street: "Đông Ngạc", ward: "Phường Đông Ngạc", district: "Quận Bắc Từ Liêm" },
  { street: "Văn Tiến Dũng", ward: "Phường Minh Khai", district: "Quận Bắc Từ Liêm" },
  { street: "Cầu Diễn", ward: "Phường Phúc Diễn", district: "Quận Bắc Từ Liêm" },
  { street: "Tây Tựu", ward: "Phường Tây Tựu", district: "Quận Bắc Từ Liêm" },
  { street: "Xuân Đỉnh", ward: "Phường Xuân Đỉnh", district: "Quận Bắc Từ Liêm" },
  { street: "Xuân Tảo", ward: "Phường Xuân Tảo", district: "Quận Bắc Từ Liêm" },

  // Nam Từ Liêm
  { street: "Mễ Trì", ward: "Phường Mễ Trì", district: "Quận Nam Từ Liêm" },
  { street: "Lê Đức Thọ", ward: "Phường Mỹ Đình 1 / Mỹ Đình 2", district: "Quận Nam Từ Liêm" },
  { street: "Hàm Nghi", ward: "Phường Cầu Diễn", district: "Quận Nam Từ Liêm" },
  { street: "Nguyễn Hoàng", ward: "Phường Mỹ Đình 2", district: "Quận Nam Từ Liêm" },
  { street: "Trần Hữu Dực", ward: "Phường Cầu Diễn", district: "Quận Nam Từ Liêm" },
  { street: "Đại Mỗ", ward: "Phường Đại Mỗ", district: "Quận Nam Từ Liêm" },
  { street: "Tây Mỗ", ward: "Phường Tây Mỗ", district: "Quận Nam Từ Liêm" },
  { street: "Châu Văn Liêm", ward: "Phường Phú Đô", district: "Quận Nam Từ Liêm" },
  { street: "Đỗ Đức Dục", ward: "Phường Mễ Trì", district: "Quận Nam Từ Liêm" },
  { street: "Trịnh Văn Bô", ward: "Phường Phương Canh", district: "Quận Nam Từ Liêm" },
  { street: "Xuân Phương", ward: "Phường Xuân Phương", district: "Quận Nam Từ Liêm" },

  // Hà Đông
  { street: "Quang Trung", ward: "Phường Quang Trung", district: "Quận Hà Đông" },
  { street: "Tố Hữu", ward: "Phường Vạn Phúc / Dương Nội", district: "Quận Hà Đông" },
  { street: "Vạn Phúc", ward: "Phường Vạn Phúc", district: "Quận Hà Đông" },
  { street: "Văn Phú", ward: "Phường Phú La", district: "Quận Hà Đông" },
  { street: "Mỗ Lao", ward: "Phường Mộ Lao", district: "Quận Hà Đông" },
  { street: "Yên Nghĩa", ward: "Phường Yên Nghĩa", district: "Quận Hà Đông" },
  { street: "Xa La", ward: "Phường Phúc La", district: "Quận Hà Đông" },
  { street: "Kiến Hưng", ward: "Phường Kiến Hưng", district: "Quận Hà Đông" },
  { street: "Dương Nội", ward: "Phường Dương Nội", district: "Quận Hà Đông" },
  { street: "Ba La", ward: "Phường Phú La", district: "Quận Hà Đông" },

  // Tây Hồ
  { street: "Thụy Khuê", ward: "Phường Thụy Khuê", district: "Quận Tây Hồ" },
  { street: "Võ Chí Công", ward: "Phường Xuân La", district: "Quận Tây Hồ" },
  { street: "Lạc Long Quân", ward: "Phường Bưởi / Xuân La", district: "Quận Tây Hồ" },
  { street: "Nguyễn Hoàng Tôn", ward: "Phường Xuân La / Phú Thượng", district: "Quận Tây Hồ" },
  { street: "Xuân La", ward: "Phường Xuân La", district: "Quận Tây Hồ" },
  { street: "Quảng An", ward: "Phường Quảng An", district: "Quận Tây Hồ" },
  { street: "Đặng Thai Mai", ward: "Phường Quảng An", district: "Quận Tây Hồ" },
  { street: "Nhật Tân", ward: "Phường Nhật Tân", district: "Quận Tây Hồ" },
  { street: "Yên Phụ", ward: "Phường Yên Phụ", district: "Quận Tây Hồ" },

  // Long Biên
  { street: "Nguyễn Văn Cừ", ward: "Phường Ngọc Lâm / Bồ Đề", district: "Quận Long Biên" },
  { street: "Ngô Gia Tự", ward: "Phường Đức Giang", district: "Quận Long Biên" },
  { street: "Nguyễn Văn Linh", ward: "Phường Phúc Đồng", district: "Quận Long Biên" },
  { street: "Chu Huy Mân", ward: "Phường Phúc Đồng", district: "Quận Long Biên" },
  { street: "Bồ Đề", ward: "Phường Bồ Đề", district: "Quận Long Biên" },
  { street: "Ngọc Lâm", ward: "Phường Ngọc Lâm", district: "Quận Long Biên" },
  { street: "Sài Đồng", ward: "Phường Sài Đồng", district: "Quận Long Biên" },
  { street: "Thạch Bàn", ward: "Phường Thạch Bàn", district: "Quận Long Biên" },
  { street: "Cổ Linh", ward: "Phường Long Biên", district: "Quận Long Biên" },
  { street: "Việt Hưng", ward: "Phường Việt Hưng", district: "Quận Long Biên" }
];

// 5. Build Master Index
const lookupIndex = {};

// Index Districts
districts.forEach(d => {
  const keys = [d.name, d.shortName, d.normalizedName, d.normalizedShortName];
  keys.forEach(k => {
    if (k && !lookupIndex[k]) {
      lookupIndex[k] = {
        type: 'district',
        data: {
          stt: d.stt,
          name: d.name,
          adminType: d.type,
          area: d.area,
          population: d.population,
          subUnitsInfo: d.subUnitsInfo,
          wardCount: d.wards.length
        }
      };
    }
  });
});

// Index Wards
wardList.forEach(w => {
  const keys = [
    w.fullName,
    w.name,
    w.normalizedFullName,
    w.normalizedName,
    `${w.name} ${w.districtName}`,
    `${w.fullName} ${w.districtName}`,
    `${normalizeText(w.name)} ${normalizeText(w.districtName)}`
  ];

  keys.forEach(k => {
    if (k && !lookupIndex[k]) {
      lookupIndex[k] = {
        type: 'ward',
        data: {
          name: w.name,
          fullName: w.fullName,
          wardType: w.type,
          districtName: w.districtName,
          districtType: w.districtType
        }
      };
    }
  });
});

// Index Streets & Roads
hanoiStreets.forEach(s => {
  const streetVariants = [
    s.street,
    `Đường ${s.street}`,
    `Phố ${s.street}`,
    normalizeText(s.street),
    normalizeText(`Đường ${s.street}`),
    normalizeText(`Phố ${s.street}`)
  ];

  streetVariants.forEach(k => {
    if (k && !lookupIndex[k]) {
      lookupIndex[k] = {
        type: 'street',
        data: {
          streetName: s.street,
          wardName: s.ward,
          districtName: s.district
        }
      };
    }
  });
});

const output = {
  metadata: {
    totalDistricts: districts.length,
    totalWards: wardList.length,
    totalStreets: hanoiStreets.length,
    generatedAt: new Date().toISOString()
  },
  districts: districts,
  streets: hanoiStreets,
  lookupIndex: lookupIndex
};

const targetDir = path.join(__dirname, '../data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, 'hanoi_admin_data.min.json');
fs.writeFileSync(outputPath, JSON.stringify(output));

console.log('✅ Successfully generated Hanoi Admin Dataset!');
console.log(`Districts: ${districts.length} | Wards: ${wardList.length} | Streets: ${hanoiStreets.length}`);
console.log(`Total Index Entries: ${Object.keys(lookupIndex).length}`);
console.log(`JSON Output Path: ${outputPath}`);
