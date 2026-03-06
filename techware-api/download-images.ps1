param(
  [string]$CsvPath = "techware-api/image-sources.csv",
  [string]$BaseDir = ".",
  [string]$StatusFilter = "approved",
  [switch]$IncludeBlankStatus,
  [switch]$Force,
  [switch]$DryRun
)

$totalRows = 0
$selected = 0
$downloaded = 0
$skippedExisting = 0
$skippedMissingFields = 0
$skippedStatus = 0
$failed = 0

$csvFull = (Resolve-Path $CsvPath -ErrorAction Stop).Path
$baseFull = (Resolve-Path $BaseDir -ErrorAction Stop).Path
$rows = Import-Csv $csvFull
if ($null -eq $rows) { $rows = @() }

$totalRows = @($rows).Count
$userAgent = "TechwareImageDownloader/1.0"

foreach ($row in $rows) {
  $status = ""
  if ($null -ne $row.PSObject.Properties["status"]) { $status = [string]$row.status }
  $status = $status.Trim()

  $okStatus = if ($IncludeBlankStatus) {
    ($status -ieq $StatusFilter) -or [string]::IsNullOrWhiteSpace($status)
  } else {
    $status -ieq $StatusFilter
  }

  if (-not $okStatus) { $skippedStatus++; continue }
  $selected++

  $targetPath = ""
  if ($null -ne $row.PSObject.Properties["targetPath"]) { $targetPath = [string]$row.targetPath }
  $url = ""
  if ($null -ne $row.PSObject.Properties["url"]) { $url = [string]$row.url }

  $targetPath = $targetPath.Trim()
  $url = $url.Trim()

  if ([string]::IsNullOrWhiteSpace($targetPath) -or [string]::IsNullOrWhiteSpace($url)) {
    Write-Warning "Missing targetPath/url, skipping."
    $skippedMissingFields++
    continue
  }

  $fullTarget = if ([IO.Path]::IsPathRooted($targetPath)) { $targetPath } else { Join-Path $baseFull $targetPath }
  $parent = Split-Path $fullTarget -Parent
  if (-not (Test-Path $parent)) {
    if ($DryRun) { Write-Host "[DRYRUN] mkdir $parent" }
    else { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
  }

  if ((Test-Path $fullTarget) -and (-not $Force)) {
    $skippedExisting++
    continue
  }

  if ($DryRun) {
    Write-Host "[DRYRUN] $url -> $fullTarget"
    $downloaded++
    continue
  }

  try {
    Invoke-WebRequest -Uri $url -OutFile $fullTarget -Headers @{ "User-Agent" = $userAgent } -ErrorAction Stop
    $downloaded++
  } catch {
    Write-Warning "Failed: $url -> $fullTarget : $($_.Exception.Message)"
    $failed++
  }
}

Write-Host "Summary:"
Write-Host "  total rows: $totalRows"
Write-Host "  selected: $selected"
Write-Host "  downloaded: $downloaded"
Write-Host "  skippedExisting: $skippedExisting"
Write-Host "  skippedMissingFields: $skippedMissingFields"
Write-Host "  skippedStatus: $skippedStatus"
Write-Host "  failed: $failed"

if ($failed -gt 0) { exit 1 } else { exit 0 }
