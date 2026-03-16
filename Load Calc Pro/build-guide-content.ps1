# Embed README.md into guide-content.js so the User Guide works from file:// (no fetch).
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$mdPath = Join-Path $root "README.md"
$jsPath = Join-Path $root "guide-content.js"
if (-not (Test-Path $mdPath)) { throw "README.md not found: $mdPath" }
$content = Get-Content -Path $mdPath -Raw -Encoding UTF8
if ($null -eq $content) { $content = "" }
$escaped = $content.Replace('\', '\\').Replace("`r`n", "`n").Replace("`r", "`n").Replace("`n", "\n").Replace('"', '\"')
$js = "window.LOAD_CALC_PRO_GUIDE_MARKDOWN = `"" + $escaped + "`";`n"
[IO.File]::WriteAllText($jsPath, $js, [Text.Encoding]::UTF8)
Write-Output "Generated $jsPath"
