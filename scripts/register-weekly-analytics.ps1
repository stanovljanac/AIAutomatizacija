# Registers the weekly analytics run (1A, D-073) in Windows Task Scheduler.
#
# Durable, unlike the session-local CronCreate routine (that one expires after 7 days). Runs
# pipeline/06-publish/fetch-analytics.mjs every week as the current user; a run missed because the
# PC was off starts at the next logon (StartWhenAvailable). Output is appended to the log on F:
# (C: is full). Re-running this script replaces the task.
#
#   powershell -ExecutionPolicy Bypass -File scripts\register-weekly-analytics.ps1 [-Day Monday] [-At 09:30]
#   Start-ScheduledTask -TaskName AutomationDesk-WeeklyAnalytics      # run it once now
#   Unregister-ScheduledTask -TaskName AutomationDesk-WeeklyAnalytics -Confirm:$false   # remove it
param(
  [string]$Day = "Monday",
  [string]$At = "09:30",
  [string]$Log = "F:\AI\.tmp\weekly-analytics.log"
)

$TaskName = "AutomationDesk-WeeklyAnalytics"
$Repo = Split-Path -Parent $PSScriptRoot
$Node = (Get-Command node -ErrorAction Stop).Source
$Script = Join-Path $Repo "pipeline\06-publish\fetch-analytics.mjs"
New-Item -ItemType Directory -Force (Split-Path -Parent $Log) | Out-Null

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -WorkingDirectory $Repo `
  -Argument "/c `"`"$Node`" `"$Script`" >> `"$Log`" 2>&1`""
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $At
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force `
  -Description "The Automation Desk: weekly YouTube analytics (catalog, reach/CTR, ledger snapshots, idea re-rank, playlist report). D-073." |
  Out-Null

$Task = Get-ScheduledTask -TaskName $TaskName
Write-Output "registered $TaskName - every $Day at $At; log: $Log; state: $($Task.State)"
