/**
 * @file src/Types/RoomTypes.js
 * Định nghĩa Type Contracts & JSDoc Schemas cho dữ liệu phòng trọ
 */

/**
 * @typedef {Object} MediaItemDto
 * @property {string} id - Google Drive file ID
 * @property {string} name - Tên tệp
 * @property {("image"|"video")} type - Loại tệp
 * @property {string} [thumbnailUrl] - URL ảnh thumbnail (chỉ cho image)
 * @property {string} previewUrl - URL xem trước nhúng (embed/preview)
 * @property {string} viewUrl - URL xem trực tiếp trên Google Drive
 */

/**
 * @typedef {Object} RoomMediaDto
 * @property {string} folderUrl - URL thư mục Google Drive gốc
 * @property {string} thumbnail - URL ảnh đại diện chất lượng cao
 * @property {string} preview - URL xem trước nhanh (ảnh đầu hoặc video đầu)
 * @property {number} totalImages - Tổng số ảnh
 * @property {number} totalVideos - Tổng số video
 * @property {Array<MediaItemDto>} images - Danh sách ảnh chi tiết
 * @property {Array<MediaItemDto>} videos - Danh sách video chi tiết
 */

/**
 * @typedef {Object} RoomDto
 * @property {string|number} id - Mã định danh phòng duy nhất
 * @property {number|string} stt - Số thứ tự dòng
 * @property {string} houseName - Tên tòa nhà
 * @property {string} room - Tên/số phòng đại diện
 * @property {Array<string>} rooms - Danh sách các phòng (nếu là phòng ghép)
 * @property {string} title - Tiêu đề hiển thị đầy đủ
 * @property {string} address - Địa chỉ tòa nhà
 * @property {string} elevator - Loại thang di chuyển (Thang bộ / Thang máy)
 * @property {number} price - Giá phòng dạng số nguyên (VNĐ)
 * @property {string} priceFormatted - Giá phòng hiển thị (ví dụ: "4,5 triệu/tháng")
 * @property {Array<string>} phones - Danh sách số điện thoại liên hệ
 * @property {string} furniture - Nội thất bao gồm
 * @property {string} serviceFee - Biểu phí dịch vụ (điện, nước, mạng, vệ sinh)
 * @property {string} description - Thông tin phòng & mô tả chi tiết
 * @property {string} note - Ghi chú (ngày vào ở, tình trạng phòng)
 * @property {RoomMediaDto} media - Toàn bộ dữ liệu ảnh, video và folder Drive
 * @property {string} sheetOrigin - Tên sheet nguồn trích xuất
 */

/**
 * @typedef {Object} HouseContext
 * @property {string} houseName - Tên tòa nhà
 * @property {string} address - Địa chỉ tòa nhà
 * @property {string} phone - Số điện thoại gốc của tòa
 * @property {string} serviceFee - Phí dịch vụ của tòa
 * @property {string} elevator - Loại thang
 * @property {string} description - Mô tả tòa nhà
 * @property {string} furniture - Nội thất mặc định tòa nhà
 * @property {string} note - Ghi chú mặc định
 * @property {RoomMediaDto|null} media - Media mặc định kế thừa của tòa nhà
 */
