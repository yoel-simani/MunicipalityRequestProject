param(
  [string]$Source = "D:\REACT-Workspace",
  [string]$DestRoot = "$env:USERPROFILE\REACT-Workspace-backups"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = Join-Path $DestRoot ("backup-" + $timestamp)

if (-not (Test-Path $DestRoot)) {
  New-Item -ItemType Directory -Path $DestRoot | Out-Null
}

Write-Host "Creating backup from:`n  $Source`ninto:`n  $dest"

try {
  Copy-Item -Path $Source -Destination $dest -Recurse -Force -ErrorAction Stop
  Write-Host "Backup completed successfully."
  Write-Host "Backup path: $dest"
} catch {
  Write-Host "Backup failed: $($_.Exception.Message)"
  exit 1
}
