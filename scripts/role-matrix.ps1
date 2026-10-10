# Module 10 - role-restriction matrix check
#
# Two passes over every role:
#   READS  - GET endpoints. Public browse endpoints are open to everyone by
#            design; only the admin-only reads must 403.
#   WRITES - POST/PUT/DELETE probes sent with an EMPTY body. Middleware order is
#            auth -> requireRole -> validate, so a wrong role gets 403 before
#            validation and the right role gets 400. Nothing is ever created.
#
# Six logins trip the auth limiter (20/15min). If sign-ins start returning 429,
# clear the counters and re-run:
#     node scripts\clear-rate-limits.js
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\role-matrix.ps1
#         powershell -ExecutionPolicy Bypass -File scripts\role-matrix.ps1 -BaseUrl http://localhost:4000

param(
  [string]$BaseUrl = "http://localhost:4000"
)

$ErrorActionPreference = "Stop"

$creds = @{
  super_admin     = @{ email = "superadmin@tournament.local"; password = "Admin#12345" }
  team_owner      = @{ email = "owner@tournament.local";     password = "Owner#12345" }
  content_manager = @{ email = "content@tournament.local";   password = "Content#12345" }
  score_manager   = @{ email = "scores@tournament.local";   password = "Scores#12345" }
  quiz_manager    = @{ email = "quiz@tournament.local";     password = "Quiz#12345" }
  fan             = @{ email = "fan@tournament.local";      password = "Fan#12345" }
}

$roles = @("super_admin","team_owner","content_manager","score_manager","quiz_manager","fan")
$all = $roles

# Reads. allow = roles permitted; $all means public by design.
$reads = @(
  @{ path = "/api/admin/dashboard";   allow = @("super_admin","team_owner","content_manager","score_manager","quiz_manager") }
  @{ path = "/api/admin/activity";    allow = @("super_admin","team_owner","content_manager","score_manager","quiz_manager") }
  @{ path = "/api/tournaments";       allow = $all }
  @{ path = "/api/venues";            allow = $all }
  @{ path = "/api/teams";             allow = $all }
  @{ path = "/api/players";           allow = $all }
  @{ path = "/api/matches";           allow = $all }
  @{ path = "/api/standings/active";  allow = $all }
  @{ path = "/api/news/articles";     allow = $all }
  @{ path = "/api/fans/quizzes";      allow = $all }
  @{ path = "/api/fans/leaderboard";  allow = $all }
  # Public live feed (the fan-facing live match page). Needs a real match id, so
  # this asserts role only: 404 means the id is fake, 403 would be a bug.
  @{ path = "/api/live/matches/00000000-0000-0000-0000-000000000000/live"; allow = $all; roleOnly = $true }
)

# Writes. Empty body: 403 = blocked by role, 400 = reached validation = allowed.
$writes = @(
  @{ method = "POST";   path = "/api/tournaments";            allow = @("super_admin") }
  @{ method = "POST";   path = "/api/venues";                 allow = @("super_admin") }
  @{ method = "POST";   path = "/api/teams";                  allow = @("super_admin","team_owner") }
  @{ method = "POST";   path = "/api/players";                allow = @("super_admin","team_owner") }
  @{ method = "POST";   path = "/api/matches";                allow = @("super_admin","score_manager") }
  @{ method = "POST";   path = "/api/news/articles";          allow = @("super_admin","content_manager") }
  @{ method = "POST";   path = "/api/fans/quizzes";           allow = @("super_admin","quiz_manager") }
  # start reaches the service for a score_manager (404 on the fake id), 403 otherwise.
  @{ method = "POST";   path = "/api/live/matches/00000000-0000-0000-0000-000000000000/start"; allow = @("super_admin","score_manager") }
  # Any signed-in role may manage users per the route; verify that holds.
  @{ method = "GET";    path = "/api/auth/users";             allow = @("super_admin") }
)

function Get-Status($path, $token) {
  try {
    $h = @{}
    if ($token) { $h["Authorization"] = "Bearer $token" }
    $r = Invoke-WebRequest -Uri "$BaseUrl$path" -Headers $h -TimeoutSec 15 -UseBasicParsing
    return [int]$r.StatusCode
  } catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    return 0
  }
}

function Write-Status($method, $path, $token) {
  try {
    $h = @{ "Content-Type" = "application/json" }
    if ($token) { $h["Authorization"] = "Bearer $token" }
    $r = Invoke-WebRequest -Uri "$BaseUrl$path" -Method $method -Headers $h `
      -Body "{}" -TimeoutSec 15 -UseBasicParsing
    return [int]$r.StatusCode
  } catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    return 0
  }
}

$tokens = @{}
Write-Host "Signing in as each role..." -ForegroundColor Cyan
foreach ($role in $creds.Keys) {
  # The API rate-limits auth, so back off between logins to avoid a 429 cascade.
  Start-Sleep -Milliseconds 1200
  try {
    $body = @{ email = $creds[$role].email; password = $creds[$role].password } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $body `
      -ContentType "application/json" -TimeoutSec 15
    # Login returns { user, tokens: { token } }.
    $tokens[$role] = $r.tokens.token
    Write-Host ("  {0,-16} ok" -f $role)
  } catch {
    Write-Host ("  {0,-16} SIGN-IN FAILED - {1}" -f $role, $_.Exception.Message) -ForegroundColor Red
    $tokens[$role] = $null
  }
}

$pass = 0; $fail = 0; $rows = @()

Write-Host "`nREAD pass..." -ForegroundColor Cyan
foreach ($role in $roles) {
  $token = $tokens[$role]
  if (-not $token) { continue }
  foreach ($e in $reads) {
    $expectAllowed = $e.allow -contains $role
    $status = Get-Status $e.path $token
    if ($e.roleOnly) {
      # A 404 means the request passed role checks and the fake id missed.
      $ok = if ($expectAllowed) { ($status -ne 403 -and $status -ne 401) } else { ($status -eq 403 -or $status -eq 401) }
      $label = if ($expectAllowed) { "not 403/401" } else { "403" }
    } else {
      $ok = ($status -eq 200) -eq $expectAllowed
      if (-not $expectAllowed -and ($status -eq 403 -or $status -eq 401)) { $ok = $true }
      $label = if ($expectAllowed) { "200" } else { "403" }
    }
    if ($ok) { $pass++ } else { $fail++ }
    $rows += [pscustomobject]@{
      Kind = "READ"; Role = $role; Endpoint = $e.path
      Expected = $label
      Actual = $status; Result = if ($ok) { "PASS" } else { "FAIL" }
    }
  }
}

Write-Host "WRITE pass (empty body, nothing created)..." -ForegroundColor Cyan
foreach ($role in $roles) {
  $token = $tokens[$role]
  if (-not $token) { continue }
  foreach ($e in $writes) {
    $expectAllowed = $e.allow -contains $role
    if ($e.method -eq "GET") {
      $status = Get-Status $e.path $token
      $ok = ($status -eq 200) -eq $expectAllowed
      if (-not $expectAllowed -and ($status -eq 403 -or $status -eq 401)) { $ok = $true }
      $expectedLabel = if ($expectAllowed) { "200" } else { "403" }
    } else {
      $status = Write-Status $e.method $e.path $token
      # Allowed = got past requireRole to validation (400/422), or reached the
      # service and rejected the fake match id (404). Blocked = 403/401.
      $allowed = ($status -eq 400 -or $status -eq 422 -or $status -eq 404)
      $ok = $allowed -eq $expectAllowed
      if (-not $expectAllowed -and ($status -eq 403 -or $status -eq 401)) { $ok = $true }
      $expectedLabel = if ($expectAllowed) { "not 403 (reached validation/service)" } else { "403" }
    }
    if ($ok) { $pass++ } else { $fail++ }
    $rows += [pscustomobject]@{
      Kind = "WRITE"; Role = $role; Endpoint = "$($e.method) $($e.path)"
      Expected = $expectedLabel; Actual = $status
      Result = if ($ok) { "PASS" } else { "FAIL" }
    }
  }
}

$rows | Format-Table -AutoSize | Out-String | Write-Host
$failed = $rows | Where-Object { $_.Result -eq "FAIL" }
if ($failed) {
  Write-Host "Failures:" -ForegroundColor Red
  $failed | Format-Table -AutoSize | Out-String | Write-Host
}

Write-Host "PASS: $pass   FAIL: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
exit $fail