param (
    [string]$Version = "1.0.0",
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$distDir = Join-Path $projectRoot "dist"
$packageFolderName = "SaleLeadAssistant_v" + $Version + "_" + $Runtime
$packageFolderPath = Join-Path $distDir $packageFolderName
$zipFilePath = Join-Path $distDir ($packageFolderName + ".zip")

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  BAT DAU DONG GOI RELEASE: Sale Lead Form Converter v$Version" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan

# 0. Dung tien trinh AppForms neu dang chay
try {
    Get-Process -Name AppForms -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 300
} catch {}

# 1. Don dep thu muc dist cu neu co (co retry neu file bi khoa tam thoi)
if (Test-Path $packageFolderPath) {
    for ($i = 0; $i -lt 3; $i++) {
        try {
            Remove-Item $packageFolderPath -Recurse -Force -ErrorAction Stop
            break
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }
}
if (Test-Path $zipFilePath) {
    Remove-Item $zipFilePath -Force -ErrorAction SilentlyContinue
}
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

# 2. Bien dich Publish Single File Self-Contained
Write-Host "`n[1/4] Dang bien dich (.NET Publish Single File Self-Contained)..." -ForegroundColor Green
Set-Location $projectRoot
$publishCmd = "dotnet publish -c $Configuration -r $Runtime --self-contained -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true"
Invoke-Expression $publishCmd

$publishOutDir = Join-Path $projectRoot ("bin\" + $Configuration + "\net6.0-windows\" + $Runtime + "\publish")
$exePath = Join-Path $publishOutDir "AppForms.exe"

if (-not (Test-Path $exePath)) {
    Write-Error "Khong tim thay file AppForms.exe tai $publishOutDir sau khi publish!"
    exit 1
}

# 3. Thu thap cac thanh phan vao goi phat hanh
Write-Host "`n[2/4] Dang gom cac file thanh phan vao thu muc goi phat hanh..." -ForegroundColor Green
New-Item -ItemType Directory -Path $packageFolderPath | Out-Null

# Copy file exe chinh
Copy-Item $exePath -Destination $packageFolderPath -Force

# Copy thu muc Assets (chua icon)
$assetsDir = Join-Path $projectRoot "Assets"
if (Test-Path $assetsDir) {
    Copy-Item $assetsDir -Destination (Join-Path $packageFolderPath "Assets") -Recurse -Force
}

# Copy cac file Batch va Huong dan tu scripts/distribution
$distributionDir = Join-Path $scriptDir "distribution"
if (Test-Path $distributionDir) {
    Get-ChildItem -Path $distributionDir | ForEach-Object {
        Copy-Item $_.FullName -Destination $packageFolderPath -Force
        Write-Host "  -> Da copy $($_.Name) tu scripts/distribution" -ForegroundColor DarkGray
    }
}

# 4. Nen thanh file .ZIP
Write-Host "`n[3/4] Dang nen thanh file ZIP: $zipFilePath..." -ForegroundColor Green
Compress-Archive -Path "$packageFolderPath\*" -DestinationPath $zipFilePath -CompressionLevel Optimal -Force

# 5. Hoan tat va hien thi thong tin
$zipItem = Get-Item $zipFilePath
$zipSizeMb = [math]::Round($zipItem.Length / 1MB, 2)

Write-Host "`n[4/4] DONG GOI HOAN TAT THANH CONG!" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Thu muc goi: $packageFolderPath" -ForegroundColor White
Write-Host "  File ZIP nen: $zipFilePath ($zipSizeMb MB)" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "Ban co the gui truc tiep file ZIP nay cho nguoi dung!" -ForegroundColor Green
