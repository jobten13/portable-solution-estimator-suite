$ErrorActionPreference = "Stop"

$mdPath = Join-Path $PSScriptRoot "Load-Calc-Pro-Quickstart.md"
$pdfPath = Join-Path $PSScriptRoot "Load-Calc-Pro-Quickstart.pdf"

if (-not (Test-Path $mdPath)) {
  throw "Markdown source not found: $mdPath"
}

$rawLines = Get-Content -Path $mdPath
$lines = @()
foreach ($line in $rawLines) {
  $trimmed = $line.TrimEnd()
  if ($trimmed -eq "") {
    $lines += " "
    continue
  }

  if ($trimmed.StartsWith("# ")) {
    $lines += ($trimmed.Substring(2)).ToUpperInvariant()
  } elseif ($trimmed.StartsWith("## ")) {
    $lines += $trimmed.Substring(3)
  } elseif ($trimmed.StartsWith("- ")) {
    $lines += ("- " + $trimmed.Substring(2))
  } elseif ($trimmed -match "^\d+\.\s") {
    $lines += $trimmed
  } else {
    $lines += $trimmed
  }
}

function Escape-PdfText([string]$text) {
  $t = $text.Replace("\", "\\")
  $t = $t.Replace("(", "\(")
  $t = $t.Replace(")", "\)")
  return $t
}

$maxChars = 100
$wrapped = @()
foreach ($line in $lines) {
  if ($line.Length -le $maxChars) {
    $wrapped += $line
    continue
  }
  $remaining = $line
  while ($remaining.Length -gt $maxChars) {
    $cut = $remaining.LastIndexOf(" ", $maxChars)
    if ($cut -lt 1) { $cut = $maxChars }
    $wrapped += $remaining.Substring(0, $cut)
    $remaining = $remaining.Substring($cut).TrimStart()
  }
  if ($remaining.Length -gt 0) { $wrapped += $remaining }
}

$contentBuilder = New-Object System.Text.StringBuilder
[void]$contentBuilder.Append("BT`n/F1 10 Tf`n50 790 Td`n")
foreach ($line in $wrapped) {
  [void]$contentBuilder.AppendFormat("({0}) Tj`n", (Escape-PdfText $line))
  [void]$contentBuilder.Append("0 -12 Td`n")
}
[void]$contentBuilder.Append("ET`n")

$stream = $contentBuilder.ToString()
$obj1 = "1 0 obj`n<< /Type /Catalog /Pages 2 0 R >>`nendobj`n"
$obj2 = "2 0 obj`n<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n"
$obj3 = "3 0 obj`n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`nendobj`n"
$obj4 = "4 0 obj`n<< /Length " + ([Text.Encoding]::ASCII.GetByteCount($stream)) + " >>`nstream`n" + $stream + "endstream`nendobj`n"
$obj5 = "5 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`nendobj`n"

$objects = @($obj1, $obj2, $obj3, $obj4, $obj5)
$pdf = New-Object System.Text.StringBuilder
[void]$pdf.Append("%PDF-1.4`n")

$offsets = @()
foreach ($obj in $objects) {
  $offsets += [Text.Encoding]::ASCII.GetByteCount($pdf.ToString())
  [void]$pdf.Append($obj)
}

$xrefOffset = [Text.Encoding]::ASCII.GetByteCount($pdf.ToString())
[void]$pdf.Append("xref`n0 6`n")
[void]$pdf.Append("0000000000 65535 f `n")
foreach ($off in $offsets) {
  [void]$pdf.AppendFormat("{0} 00000 n `n", $off.ToString("D10"))
}
[void]$pdf.Append("trailer`n<< /Size 6 /Root 1 0 R >>`n")
[void]$pdf.Append("startxref`n")
[void]$pdf.Append($xrefOffset.ToString() + "`n")
[void]$pdf.Append("%%EOF`n")

[IO.File]::WriteAllBytes($pdfPath, [Text.Encoding]::ASCII.GetBytes($pdf.ToString()))
Write-Output "Generated $pdfPath"
