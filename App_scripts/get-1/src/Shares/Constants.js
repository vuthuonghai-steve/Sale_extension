/**
 * @file src/Shares/Constants.js
 * Các hằng số, Enum trạng thái và biểu thức chính quy (Regex) dùng chung
 */

const CONSTANTS = {
  ACTIONS: {
    LIST: "list",
    DEBUG: "debug",
    DEBUG_RAW: "debug_raw"
  },
  STATUS: {
    SUCCESS: "success",
    ERROR: "error",
    DEBUG_INFO: "debug_info",
    DEBUG_RAW: "debug_raw"
  },
  REGEX: {
    DRIVE_ID: /[-\w]{25,}/,
    URL_GLOBAL: /https?:\/\/[^\s"'\)]+/g,
    VIDEO_EXT: /\.(mp4|mov|avi|mkv|wmv|3gp)$/i,
    IMAGE_EXT: /\.(jpg|jpeg|png|webp|heic|gif|bmp)$/i,
    VIETNAMESE_PHONE: /(?:\+84|84|0)(?:3|5|7|8|9)\d{8}/g,
    ROOM_NUMBER_IN_FILENAME: /\b[pP]?(\d{1,4}[a-zA-Z]?)\b/
  },
  ELEVATOR_TYPES: {
    STAIRS: "Thang bộ",
    ELEVATOR: "Thang máy"
  }
};
