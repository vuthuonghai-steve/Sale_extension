<#
.SYNOPSIS
    Automated Mechanical Quality Gatekeeper for AI Agent Rule Governance & Conflict Resolution.
.DESCRIPTION
    Wrapper script executing static rule parsing, conflict detection, and anti-phantom checks.
.PARAMETER Workspace
    Path to project workspace root. Default: repo root.
.PARAMETER ScriptsDir
    Path to scripts directory to audit for phantom gates. Default: <Workspace>\scripts.
.PARAMETER OutputPath
    Optional path to save output JSON audit report.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .agents\skills\rule-governance-analyzer\scripts\audit-rules.ps1
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$Workspace = "",

    [Parameter(Mandatory = $false)]
    [string]$ScriptsDir = "",

    [Parameter(Mandatory = $false)]
    [string]$OutputPath = ""
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

$PyArgs = @($PyScript, "--workspace", $Workspace)
if (-not [string]::IsNullOrWhiteSpace($ScriptsDir)) {
    $PyArgs += @("--scripts-dir", $ScriptsDir)
}
if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
    $PyArgs += @("--output", $OutputPath)
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
