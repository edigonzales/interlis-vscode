$ErrorActionPreference = 'Stop'
$destination = Join-Path $PWD 'build/ci/process-audit'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$source = 'INTERLIS-V5-ProcessStart'
$rows = [System.Collections.Generic.List[object]]::new()
$subscription = Register-CimIndicationEvent -Query 'SELECT * FROM Win32_ProcessStartTrace' -SourceIdentifier $source
try {
    Start-Sleep -Milliseconds 500
    $child = Start-Process -FilePath (Get-Command node).Source -ArgumentList 'scripts/ci/smoke.cjs' -NoNewWindow -PassThru
    do {
        foreach ($event in @(Get-Event -SourceIdentifier $source -ErrorAction SilentlyContinue)) {
            $data = $event.SourceEventArgs.NewEvent
            $rows.Add([pscustomobject]@{pid=[int]$data.ProcessID; parent=[int]$data.ParentProcessID; name=[string]$data.ProcessName; timestamp=[string]$data.TIME_CREATED})
            Remove-Event -EventIdentifier $event.EventIdentifier
        }
        Start-Sleep -Milliseconds 100
        $child.Refresh()
    } while (-not $child.HasExited)
    $child.WaitForExit()
    $exit = $child.ExitCode
    Start-Sleep -Seconds 2
    foreach ($event in @(Get-Event -SourceIdentifier $source -ErrorAction SilentlyContinue)) {
        $data = $event.SourceEventArgs.NewEvent
        $rows.Add([pscustomobject]@{pid=[int]$data.ProcessID; parent=[int]$data.ParentProcessID; name=[string]$data.ProcessName; timestamp=[string]$data.TIME_CREATED})
        Remove-Event -EventIdentifier $event.EventIdentifier
    }
    $owned = [System.Collections.Generic.HashSet[int]]::new()
    [void]$owned.Add($child.Id)
    do {
        $before = $owned.Count
        foreach ($row in $rows) { if ($owned.Contains($row.parent)) { [void]$owned.Add($row.pid) } }
    } while ($owned.Count -ne $before)
    $observed = @($rows | Where-Object { $owned.Contains($_.pid) })
    $forbidden = @($observed | Where-Object { $_.name -match '^(python.*|pypy.*|pip[0-9.]*|uvx?)(\.exe)?$' })
    $rootSeen = @($observed | Where-Object pid -eq $child.Id).Count -gt 0
    $javaSeen = @($observed | Where-Object name -eq 'java.exe').Count -gt 0
    $passed = $exit -eq 0 -and $rootSeen -and $javaSeen -and $forbidden.Count -eq 0
    @{scope='Actual Windows WMI process-start events for the smoke process and descendants; no macOS sandbox claim'; exit=$exit; rootPid=$child.Id; rootSeen=$rootSeen; javaSeen=$javaSeen; processes=$observed; forbidden=$forbidden; status=$(if($passed){'passed'}else{'failed'})} | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $destination 'result.json')
    if (-not $passed) { throw 'Windows smoke or process audit failed' }
} finally {
    Unregister-Event -SourceIdentifier $source -ErrorAction SilentlyContinue
    Remove-Job -Id $subscription.Id -Force -ErrorAction SilentlyContinue
}
