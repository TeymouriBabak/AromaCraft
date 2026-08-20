Get-CimInstance Win32_Process | ForEach-Object {
  if ($_.CommandLine -and $_.CommandLine -match 'aromacraft' -and $_.Name -eq 'node.exe') {
    [PSCustomObject]@{ ProcessId = $_.ProcessId; CommandLine = $_.CommandLine }
  }
} | Sort-Object ProcessId | Format-Table -AutoSize
