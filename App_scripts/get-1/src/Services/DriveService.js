/**
 * @file src/Services/DriveService.js
 * Dịch vụ bóc tách tài nguyên Google Drive (Folder/File), trích xuất ảnh Thumbnail chất lượng cao và Video
 */

/**
 * Trích xuất toàn bộ URL từ một ô bất kỳ (hỗ trợ song song RichText, Formulas và Text content)
 * @param {any} cellValue 
 * @param {GoogleAppsScript.Spreadsheet.RichTextValue} richTextValue 
 * @param {string} formulaValue 
 * @returns {Array<string>}
 */
function extractAllLinksFromCell(cellValue, richTextValue, formulaValue) {
  const links = new Set();

  if (richTextValue) {
    const wholeCellLink = richTextValue.getLinkUrl();
    if (wholeCellLink) links.add(wholeCellLink);

    try {
      const runs = richTextValue.getRuns();
      if (runs && runs.length > 0) {
        runs.forEach(run => {
          const runLink = run.getLinkUrl();
          if (runLink) links.add(runLink);
        });
      }
    } catch (e) {
      LoggerService.warn(`Lỗi bóc tách RichText run link: ${e.message}`);
    }
  }

  if (formulaValue && typeof formulaValue === 'string' && formulaValue.startsWith('=')) {
    const formulaMatches = formulaValue.match(CONSTANTS.REGEX.URL_GLOBAL);
    if (formulaMatches) {
      formulaMatches.forEach(url => links.add(url));
    }
  }

  const textContent = String(cellValue || "");
  const textMatches = textContent.match(CONSTANTS.REGEX.URL_GLOBAL);
  if (textMatches) {
    textMatches.forEach(url => links.add(url));
  }

  // Nếu cell chỉ chứa Drive ID thô không kèm URL
  if (links.size === 0) {
    const rawIdMatch = textContent.trim().match(/^[-\w]{25,}$/);
    if (rawIdMatch) {
      links.add(`https://drive.google.com/file/d/${rawIdMatch[0]}/view`);
    }
  }

  return Array.from(links);
}

/**
 * Trích xuất Drive Resource ID từ URL bất kỳ
 * @param {string} url 
 * @returns {string|null}
 */
function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(CONSTANTS.REGEX.DRIVE_ID);
  return match ? match[0] : null;
}

/**
 * Khám phá tài nguyên Google Drive (Folder hoặc File) và đọc toàn bộ tệp bên trong
 * @param {string} resourceId 
 * @returns {{ isFolder: boolean, folderUrl: string, images: Array<MediaItemDto>, videos: Array<MediaItemDto> }}
 */
function inspectAndExploreDrive(resourceId) {
  if (!resourceId) return { isFolder: false, folderUrl: '', images: [], videos: [] };

  const cacheKey = `drv_res_v4_${resourceId}`;
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      // Ignore parse error
    }
  }

  const images = [];
  const videos = [];
  let isFolder = false;
  let folderUrl = "";

  // 1. Thử mở dưới dạng Thư mục (Folder)
  try {
    const folder = DriveApp.getFolderById(resourceId);
    if (folder) {
      isFolder = true;
      folderUrl = `https://drive.google.com/drive/folders/${resourceId}`;
      const files = folder.getFiles();

      let count = 0;
      while (files.hasNext() && count < 60) {
        const file = files.next();
        const fId = file.getId();
        const fName = file.getName();
        const mime = file.getMimeType();

        const isVid = mime.startsWith('video/') || CONSTANTS.REGEX.VIDEO_EXT.test(fName);
        const isImg = mime.startsWith('image/') || CONSTANTS.REGEX.IMAGE_EXT.test(fName);

        if (isVid) {
          videos.push({
            id: fId,
            name: fName,
            type: "video",
            previewUrl: `https://drive.google.com/file/d/${fId}/preview`,
            viewUrl: `https://drive.google.com/file/d/${fId}/view`
          });
        } else {
          images.push({
            id: fId,
            name: fName,
            type: "image",
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${fId}&sz=w1000`,
            previewUrl: `https://drive.google.com/file/d/${fId}/preview`,
            viewUrl: `https://drive.google.com/file/d/${fId}/view`
          });
        }
        count++;
      }
    }
  } catch (errFolder) {
    // Không phải Folder hoặc không có quyền mở Folder, tiếp tục thử File
  }

  // 2. Nếu không phải Folder, xử lý như File đơn lẻ
  if (!isFolder) {
    try {
      const file = DriveApp.getFileById(resourceId);
      if (file) {
        const fId = file.getId();
        const fName = file.getName();
        const mime = file.getMimeType();
        const isVid = mime.startsWith('video/') || CONSTANTS.REGEX.VIDEO_EXT.test(fName);

        if (isVid) {
          videos.push({
            id: fId,
            name: fName,
            type: "video",
            previewUrl: `https://drive.google.com/file/d/${fId}/preview`,
            viewUrl: `https://drive.google.com/file/d/${fId}/view`
          });
        } else {
          images.push({
            id: fId,
            name: fName,
            type: "image",
            thumbnailUrl: `https://drive.google.com/thumbnail?id=${fId}&sz=w1000`,
            previewUrl: `https://drive.google.com/file/d/${fId}/preview`,
            viewUrl: `https://drive.google.com/file/d/${fId}/view`
          });
        }
      }
    } catch (errFile) {
      // Fallback nếu không mở được DriveApp: tạo object dựa trên Resource ID
      images.push({
        id: resourceId,
        name: "",
        type: "image",
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${resourceId}&sz=w1000`,
        previewUrl: `https://drive.google.com/file/d/${resourceId}/preview`,
        viewUrl: `https://drive.google.com/file/d/${resourceId}/view`
      });
    }
  }

  const result = {
    isFolder: isFolder,
    folderUrl: folderUrl,
    images: images,
    videos: videos
  };

  if (images.length > 0 || videos.length > 0 || isFolder) {
    cache.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_TTL_SECONDS);
  }

  return result;
}

/**
 * Xử lý danh sách URLs thành Media Object hoàn chỉnh, kèm cơ chế fallback từ tòa nhà cha
 * @param {Array<string>} urls 
 * @param {RoomMediaDto|null} [fallbackMedia] 
 * @returns {RoomMediaDto}
 */
function resolveCleanMedia(urls, fallbackMedia) {
  const images = [];
  const videos = [];
  let mainFolderUrl = "";

  if (urls && urls.length > 0) {
    urls.forEach(url => {
      const driveId = extractDriveId(url);
      if (driveId) {
        const explored = inspectAndExploreDrive(driveId);
        if (explored.isFolder && explored.folderUrl) {
          mainFolderUrl = explored.folderUrl;
        } else if (!mainFolderUrl && (url.includes('/folders/') || url.includes('open?id='))) {
          mainFolderUrl = url;
        }

        explored.images.forEach(img => images.push(img));
        explored.videos.forEach(vid => videos.push(vid));
      }
    });
  }

  // Kế thừa media từ tòa nhà cha nếu ô phòng không có media riêng
  if (images.length === 0 && videos.length === 0 && fallbackMedia) {
    if (fallbackMedia.images) fallbackMedia.images.forEach(img => images.push(img));
    if (fallbackMedia.videos) fallbackMedia.videos.forEach(vid => videos.push(vid));
    if (!mainFolderUrl) mainFolderUrl = fallbackMedia.folderUrl || "";
  }

  const primaryImage = images.length > 0 ? images[0] : null;
  const primaryVideo = videos.length > 0 ? videos[0] : null;

  return {
    folderUrl: mainFolderUrl,
    thumbnail: primaryImage ? primaryImage.thumbnailUrl : "",
    preview: primaryImage ? primaryImage.previewUrl : (primaryVideo ? primaryVideo.previewUrl : ""),
    totalImages: images.length,
    totalVideos: videos.length,
    images: images,
    videos: videos
  };
}
