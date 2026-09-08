<#
.SYNOPSIS
    Automated Mechanical Quality Gatekeeper for AI Agent Rule Governance & Conflict Resolution v1.1.0.
.DESCRIPTION
    Wrapper script executing static rule parsing, conflict detection, anti-phantom checks,
    and Headless Deep Semantic Audit with runtime model inheritance and reasoning effort control.
.PARAMETER Workspace
    Path to project workspace root. Default: repo root.
.PARAMETER ScriptsDir
    Path to scripts directory to audit for phantom gates. Default: <Workspace>\scripts.
.PARAMETER OutputPath
    Optional path to save output JSON audit report.
.PARAMETER Effort
    Reasoning effort level: low, medium, high. Default: low.
.PARAMETER TimeoutSec
    Timeout in seconds for headless execution. Default: 180.
.PARAMETER NoHeadless
    Switch to bypass headless execution and run local rule engine only.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .agents\skills\rule-governance-analyzer\scripts\audit-rules.ps1 -Effort low
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$Workspace = "",

    [Parameter(Mandatory = $false)]
    [string]$ScriptsDir = "",

    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "",

    [Parameter(Mandatory = $false)]
    [ValidateSet("low", "medium", "high")]
    [string]$Effort = "low",

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSec = 180,

    [Parameter(Mandatory = $false)]
    [switch]$NoHeadless
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PyScript = Join-Path $ScriptDir "audit_rules.py"

if (-not (Test-Path $PyScript)) {
    Write-Error "Backend script audit_rules.py not found at: $PyScript"
    exit 1
}

$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..\..\..")).Path
if ([string]::IsNullOrWhiteSpace($Workspace)) {
    $Workspace = $RepoRoot
}

$PyArgs = @($PyScript, "--workspace", $Workspace, "--effort", $Effort, "--timeout", $TimeoutSec)
if (-not [string]::IsNullOrWhiteSpace($ScriptsDir)) {
    $PyArgs += @("--scripts-dir", $ScriptsDir)
}
if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
    $PyArgs += @("--output", $OutputPath)
}
if ($NoHeadless) {
    $PyArgs += @("--no-headless")
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
