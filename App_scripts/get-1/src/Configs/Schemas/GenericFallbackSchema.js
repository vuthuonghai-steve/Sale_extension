/**
 * @file src/Configs/Schemas/GenericFallbackSchema.js
 * Schema dự phòng thông minh (Generic Fallback Schema)
 * Tự động phát hiện và ánh xạ các trường dữ liệu phổ biến nhất trong ngành BĐS cho thuê
 */

const GenericFallbackSchema = {
  spreadsheetId: "*",
  name: "Generic Fallback Schema",
  description: "Schema tự động nhận diện thông minh cho bất kỳ Spreadsheet ID nào",

  options: {
    headerScanLimit: 15,
    hasMergedBuildings: true,
    smartRoomInference: true,
    priceUnit: "vnd"
  },

  defaultTabConfig: {
    fields: {
      id: {
        key: "id",
        aliases: ["stt", "no", "id", "#", "số thứ tự", "stt phòng", "mã"]
      },
      houseName: {
        key: "houseName",
        aliases: ["tên nhà", "tòa nhà", "nhà", "tên toà", "toà nhà", "building", "khu vực", "dự án", "cụm nhà", "toà"]
      },
      address: {
        key: "address",
        aliases: ["địa chỉ", "địa chỉ nhà", "vị trí", "đ/c", "address", "dc", "địa điểm", "số nhà"]
      },
      elevator: {
        key: "elevator",
        aliases: ["thang", "loại thang", "thang máy", "thang bộ", "elevator", "thang máy/bộ"]
      },
      room: {
        key: "room",
        aliases: ["phòng trống", "phòng", "p.trống", "mã phòng", "p trống", "room", "p.", "phòng số", "tên phòng"]
      },
      media: {
        key: "media",
        aliases: ["ảnh + video", "ảnh/video", "ảnh", "video", "link ảnh", "hình ảnh", "drive", "media", "ảnh/clip", "link", "hình", "ảnh phòng"]
      },
      price: {
        key: "price",
        aliases: ["đơn giá", "giá", "giá thuê", "giá phòng", "giá (tr)", "price", "tiền phòng", "giá bán", "giá cho thuê", "chi phí thuê"]
      },
      furniture: {
        key: "furniture",
        aliases: ["nội thất bao gồm", "nội thất", "đồ đạc", "trang thiết bị", "furniture", "nội thất có sẵn", "đồ", "tiện nghi"]
      },
      serviceFee: {
        key: "serviceFee",
        aliases: ["tiền dịch vụ", "dịch vụ", "phí dịch vụ", "dvc", "chi phí", "service", "dịch vụ chung", "phí quản lý"]
      },
      phone: {
        key: "phone",
        aliases: ["sđt dẫn", "sđt", "số điện thoại", "hotline", "liên hệ", "sđt sale", "phone", "tel", "quản lý", "chủ nhà", "đầu chủ"]
      },
      description: {
        key: "description",
        aliases: ["thông tin phòng", "thông tin", "mô tả", "chi tiết", "description", "tiện ích", "đặc điểm", "cấu trúc"]
      },
      note: {
        key: "note",
        aliases: ["ghi chú", "note", "tình trạng", "ngày vào", "thời gian", "trạng thái", "lưu ý", "thời hạn"]
      }
    }
  },

  tabs: {}
};
