@echo off
chcp 65001 >nul
title Đóng Gói Release - Sale Lead Form Converter
color 0B

echo ====================================================================
echo             TỰ ĐỘNG ĐÓNG GÓI BẢN PHÁT HÀNH (RELEASE ZIP)
echo ====================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package_release.ps1"

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [LỖI] Quá trình đóng gói thất bại. Vui lòng kiểm tra lại log bên trên.
    pause
    exit /b 1
)

echo.
echo Đang mở thư mục chứa file ZIP...
explorer "%~dp0..\dist"
pause
exit /b 0
