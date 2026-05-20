# Update suite version.json in this directory (bump version + add changelog entry).
# Usage: .\create-version.ps1 -VersionType "minor" -Changes "Phase 2: Load Calc Basic integrated", "ROOT scoping"
# Run from FieldCalcs directory (script updates version.json alongside this script).

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("major", "minor", "patch")]
    [string]$VersionType = "patch",

    [Parameter(Mandatory=$false)]
    [string[]]$Changes = @("Version update")
)

$versionFile = Join-Path $PSScriptRoot "version.json"
if (-not (Test-Path $versionFile)) {
    Write-Error "version.json not found at: $versionFile"
    exit 1
}

$versionData = Get-Content $versionFile -Raw | ConvertFrom-Json
$currentVersion = $versionData.version

$versionParts = $currentVersion.Split('.') | ForEach-Object { [int]$_ }

switch ($VersionType) {
    "major" {
        $versionParts[0]++
        $versionParts[1] = 0
        $versionParts[2] = 0
    }
    "minor" {
        $versionParts[1]++
        $versionParts[2] = 0
    }
    "patch" {
        $versionParts[2]++
    }
}

$newVersion = $versionParts -join '.'
$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

Write-Host "Current version: $currentVersion"
Write-Host "New version: $newVersion"

$newChangelogEntry = @{
    version = $newVersion
    date    = $now
    changes = $Changes
}

$versionData.version      = $newVersion
$versionData.lastUpdated  = $now
$existingChangelog        = @()
if ($versionData.changelog) {
    $existingChangelog = @($versionData.changelog)
}
$versionData.changelog = @($newChangelogEntry) + $existingChangelog

$versionData | ConvertTo-Json -Depth 10 | Set-Content $versionFile -Encoding UTF8

Write-Host "`nVersion $newVersion written to version.json"
Write-Host "Changelog entry:"
foreach ($c in $Changes) { Write-Host "  - $c" }
