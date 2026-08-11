@echo off
chcp 65001 >nul
title Gỡ Bỏ Shortcut - Sale Lead Assistant
color 0E

echo ====================================================================
echo             GỠ BỎ SHORTCUT SALE LEAD ASSISTANT
echo ====================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$desktop = [System.Environment]::GetFolderPath('Desktop'); " ^
    "$lnkDesktop = Join-Path $desktop 'Sale Lead Assistant.lnk'; " ^
    "if (Test-Path $lnkDesktop) { Remove-Item $lnkDesktop -Force; Write-Output 'Đã xóa shortcut Desktop.'; }; " ^
    "$startMenu = [System.Environment]::GetFolderPath('Programs'); " ^
    "$lnkStart = Join-Path $startMenu 'Sale Lead Assistant.lnk'; " ^
    "if (Test-Path $lnkStart) { Remove-Item $lnkStart -Force; Write-Output 'Đã xóa shortcut Start Menu.'; };"

echo.
color 0A
echo [THÀNH CÔNG] Đã xóa toàn bộ Shortcut khỏi Desktop và Start Menu.
echo Thư mục ứng dụng vẫn được giữ nguyên.
echo.
pause
exit /b 0
