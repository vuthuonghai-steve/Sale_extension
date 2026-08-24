/**
 * @file src/Configs/Schemas/DucAnhSchema.js
 * Schema định nghĩa cấu trúc dữ liệu cho Spreadsheet ID: 1-A9ex-6QwdYDAMUYzUTxsNoJ81q18KYV
 */

const DucAnhSchema = {
  // Spreadsheet ID thực tế
  spreadsheetId: "1-A9ex-6QwdYDAMUYzUTxsNoJ81q18KYV",
  name: "Bảng phòng trọ Đức Anh",
  description: "Cấu hình mapping cột và tùy chọn xử lý cho nguồn phòng trọ Đức Anh",

  // Tùy chọn xử lý dữ liệu
  options: {
    headerScanLimit: 10,           // Quét tối đa 10 dòng đầu để dò tìm Header
    hasMergedBuildings: true,       // Bật kế thừa thông tin tòa nhà (Forward-Fill Context)
    smartRoomInference: true,       // Tự động suy luận số phòng từ tên file/media nếu ô phòng rỗng
    priceUnit: "vnd"                // Đơn vị tiền tệ đầy đủ (vnd: số nguyên)
  },

  // Cấu hình trường và danh sách từ khóa bí danh (aliases) mặc định cho các Tab
  defaultTabConfig: {
    fields: {
      id: {
        key: "id",
        aliases: ["stt", "no", "id", "#", "số thứ tự"]
      },
      houseName: {
        key: "houseName",
        aliases: ["tên nhà", "tòa nhà", "nhà", "tên toà", "toà nhà", "building", "khu vực"]
      },
      address: {
        key: "address",
        aliases: ["địa chỉ", "địa chỉ nhà", "vị trí", "đ/c", "address", "dc"]
      },
      elevator: {
        key: "elevator",
        aliases: ["thang", "loại thang", "thang máy", "thang bộ", "elevator"]
      },
      room: {
        key: "room",
        aliases: ["phòng trống", "phòng", "p.trống", "mã phòng", "p trống", "room", "p."]
      },
      media: {
        key: "media",
        aliases: ["ảnh + video", "ảnh/video", "ảnh", "video", "link ảnh", "hình ảnh", "drive", "media", "ảnh/clip"]
      },
      price: {
        key: "price",
        aliases: ["đơn giá", "giá", "giá thuê", "giá phòng", "giá (tr)", "price", "tiền phòng"]
      },
      furniture: {
        key: "furniture",
        aliases: ["nội thất bao gồm", "nội thất", "đồ đạc", "trang thiết bị", "furniture", "nội thất có sẵn"]
      },
      serviceFee: {
        key: "serviceFee",
        aliases: ["tiền dịch vụ", "dịch vụ", "phí dịch vụ", "dvc", "chi phí", "service", "dịch vụ chung"]
      },
      phone: {
        key: "phone",
        aliases: ["sđt dẫn", "sđt", "số điện thoại", "hotline", "liên hệ", "sđt sale", "phone", "tel", "quản lý"]
      },
      description: {
        key: "description",
        aliases: ["thông tin phòng", "thông tin", "mô tả", "chi tiết", "description", "tiện ích"]
      },
      note: {
        key: "note",
        aliases: ["ghi chú", "note", "tình trạng", "ngày vào", "thời gian", "trạng thái"]
      }
    }
  },

  // Cấu hình ghi đè cho từng Tab cụ thể nếu có cấu trúc riêng
  tabs: {
    "Sheet1": {},
    "Trang tính2": {}
  }
};
