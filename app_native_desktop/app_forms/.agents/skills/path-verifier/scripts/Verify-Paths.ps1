<#
.SYNOPSIS
    Wrapper PowerShell thực thi kiểm định và chuẩn hóa đường dẫn tương đối.
.DESCRIPTION
    Tự động gọi verify_paths.py để kiểm tra hoặc tự động sửa (fix) các đường dẫn tuyệt đối
    về đường dẫn tương đối dựa trên mốc neo .agents của dự án.
.PARAMETER Workspace
    Thư mục gốc cần quét (Mặc định: Root dự án hiện tại).
.PARAMETER Fix
    Tự động chuyển đổi các đường dẫn vi phạm.
.PARAMETER OutputJson
    Đường dẫn xuất file báo cáo JSON.
.EXAMPLE
    .\Verify-Paths.ps1 -Check
.EXAMPLE
    .\Verify-Paths.ps1 -Fix -OutputJson "Tests/Agy/Logs/path_audit.json"
#>
[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Workspace = ".",

    [Parameter()]
    [switch]$Fix,

    [Parameter()]
    [string]$OutputJson = ""
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PyScript = Join-Path $ScriptDir "verify_paths.py"

if (-not (Test-Path $PyScript)) {
    Write-Error "Không tìm thấy script: $PyScript"
    exit 1
}

$Arguments = @($PyScript, "--workspace", $Workspace)

if ($Fix) {
    $Arguments += "--fix"
}

if ($OutputJson -ne "") {
    $Arguments += @("--output", $OutputJson)
}

Write-Host ">>> Đang thực thi Path Verifier..." -ForegroundColor Cyan
python $Arguments
$ExitCode = $LASTEXITCODE

if ($ExitCode -eq 0) {
    Write-Host ">>> Kiểm định hoàn tất: KHÔNG CÓ VI PHẠM hoặc ĐÃ SỬA THÀNH CÔNG (Exit code 0)." -ForegroundColor Green
} else {
    Write-Host ">>> CẢNH BÁO: Phát hiện đường dẫn tuyệt đối vi phạm chuẩn (Exit code $ExitCode)." -ForegroundColor Yellow
}

exit $ExitCode
