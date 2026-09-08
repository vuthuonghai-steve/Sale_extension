<#
.SYNOPSIS
    Automated Mechanical Quality Gatekeeper for BA Requirements Documents.
.DESCRIPTION
    Wrapper script for BA Quality Gate under IIBA BABOK standards.
.PARAMETER DraftPath
    Path to the requirements markdown file to audit.
.PARAMETER SchemaPath
    Optional path to the JSON schema file.
.PARAMETER Effort
    Thinking effort: low, medium, high. Default: medium.
.PARAMETER TimeoutSec
    Timeout in seconds. Default: 180.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .agents\skills\ba-requirements-analyzer\scripts\ba-quality-gate.ps1 -DraftPath Docs\Specs\rule-governance-skill-spec.md
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$DraftPath,

    [Parameter(Mandatory = $false)]
    [string]$SchemaPath = "",

    [Parameter(Mandatory = $false)]
    [ValidateSet("low", "medium", "high")]
    [string]$Effort = "medium",

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSec = 180
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PyScript = Join-Path $ScriptDir "ba_quality_gate.py"

if (-not (Test-Path $PyScript)) {
    Write-Error "Backend script ba_quality_gate.py not found at: $PyScript"
    exit 1
}

$PyArgs = @($PyScript, "--draft", $DraftPath, "--effort", $Effort, "--timeout", $TimeoutSec)
if (-not [string]::IsNullOrWhiteSpace($SchemaPath)) {
    $PyArgs += @("--schema", $SchemaPath)
}

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "python"
$processInfo.Arguments = ($PyArgs | ForEach-Object { if ($_ -match '\s') { "`"$_`"" } else { $_ } }) -join " "
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $false
$processInfo.RedirectStandardError = $false

$proc = [System.Diagnostics.Process]::Start($processInfo)
$proc.WaitForExit()

exit $proc.ExitCode
