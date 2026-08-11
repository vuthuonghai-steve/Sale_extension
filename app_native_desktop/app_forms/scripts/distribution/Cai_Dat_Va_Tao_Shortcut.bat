@echo off
chcp 65001 >nul
title Cài Đặt Shortcut - Sale Lead Assistant
color 0B

echo ====================================================================
echo             SALE LEAD FORM CONVERTER - THIẾT LẬP NHANH
echo ====================================================================
echo.
echo  Đang tiến hành tạo Shortcut trên Desktop và Start Menu...
echo.

set "TARGET_DIR=%~dp0"
set "TARGET_EXE=%TARGET_DIR%AppForms.exe"
set "ICON_PATH=%TARGET_DIR%Assets\app_icon.ico"

if not exist "%TARGET_EXE%" (
    color 0C
    echo [LỖI] Không tìm thấy file 'AppForms.exe' tại thư mục hiện tại:
    echo        "%TARGET_DIR%"
    echo.
    echo * Vui lòng đảm bảo bạn đã GIẢI NÉN (Extract) toàn bộ file ZIP
    echo   trước khi chạy file cài đặt này!
    echo.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$desktop = [System.Environment]::GetFolderPath('Desktop'); " ^
    "$sDesktop = $ws.CreateShortcut((Join-Path $desktop 'Sale Lead Assistant.lnk')); " ^
    "$sDesktop.TargetPath = '%TARGET_EXE%'; " ^
    "$sDesktop.WorkingDirectory = '%TARGET_DIR%'; " ^
    "if (Test-Path '%ICON_PATH%') { $sDesktop.IconLocation = '%ICON_PATH%, 0'; } else { $sDesktop.IconLocation = '%TARGET_EXE%, 0'; }; " ^
    "$sDesktop.Description = 'Trợ lý Sidepanel Desktop tự động chuyển đổi Lead Form'; " ^
    "$sDesktop.Save(); " ^
    "$startMenu = [System.Environment]::GetFolderPath('Programs'); " ^
    "$sStart = $ws.CreateShortcut((Join-Path $startMenu 'Sale Lead Assistant.lnk')); " ^
    "$sStart.TargetPath = '%TARGET_EXE%'; " ^
    "$sStart.WorkingDirectory = '%TARGET_DIR%'; " ^
    "if (Test-Path '%ICON_PATH%') { $sStart.IconLocation = '%ICON_PATH%, 0'; } else { $sStart.IconLocation = '%TARGET_EXE%, 0'; }; " ^
    "$sStart.Description = 'Trợ lý Sidepanel Desktop tự động chuyển đổi Lead Form'; " ^
    "$sStart.Save();"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [CẢNH BÁO] Có lỗi xảy ra trong quá trình tạo Shortcut.
    echo Bạn vẫn có thể chạy trực tiếp file 'AppForms.exe'.
    echo.
    pause
    exit /b 1
)

color 0A
echo [THÀNH CÔNG] Đã tạo Shortcut với đầy đủ Icon sắc nét tại:
echo   [1] Màn hình chính (Desktop): "Sale Lead Assistant"
echo   [2] Danh mục ứng dụng (Start Menu): "Sale Lead Assistant"
echo.
echo ====================================================================
echo.
set /p RUN_NOW=">> Bạn có muốn khởi động ứng dụng ngay bây giờ không? (Y/N, mặc định Y): "
if "%RUN_NOW%"=="" set RUN_NOW=Y
if /i "%RUN_NOW%"=="Y" (
    start "" "%TARGET_EXE%"
)

echo.
echo Cảm ơn bạn đã sử dụng Sale Lead Form Converter!
timeout /t 3 >nul
exit /b 0
