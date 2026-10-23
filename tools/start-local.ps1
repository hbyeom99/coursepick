param(
    [ValidateSet('', 'api', 'web')][string]$Server = '',
    [switch]$CheckOnly,
    [switch]$NoBrowser
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
$runtimeRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$legacyVenv = Join-Path $env:USERPROFILE 'Documents\Codex\2026-10-02\referenced-chatgpt-conversation-this-is-an\work\backend-venv'
$logs = Join-Path $projectRoot 'outputs\local-servers'

function Find-Node {
    $bundled = Join-Path $runtimeRoot 'node\bin\node.exe'
    if (Test-Path -LiteralPath $bundled) { return $bundled }
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    throw 'Node.js was not found. Install the project runtime first.'
}
function Find-Python {
    $candidates = @(
        (Join-Path $projectRoot '.venv\Scripts\python.exe'),
        (Join-Path $projectRoot 'backend\.venv\Scripts\python.exe'),
        (Join-Path $projectRoot 'work\backend-venv\Scripts\python.exe'),
        (Join-Path $legacyVenv 'Scripts\python.exe'),
        (Join-Path $runtimeRoot 'python\python.exe')
    )
    $command = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($command -and $command.Source -notlike '*\WindowsApps\*') { $candidates += $command.Source }
    foreach ($candidate in $candidates | Select-Object -Unique) {
        if (-not (Test-Path -LiteralPath $candidate)) { continue }
        try {
            & $candidate -c 'import fastapi, uvicorn, supabase, dotenv, korcen' 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) { return $candidate }
        } catch { }
    }
    # Reuse existing dependency installation without copying or installing packages.
    $bundled = Join-Path $runtimeRoot 'python\python.exe'
    $packages = Join-Path $legacyVenv 'Lib\site-packages'
    if ((Test-Path -LiteralPath $bundled) -and (Test-Path -LiteralPath $packages)) {
        $env:PYTHONPATH = if ($env:PYTHONPATH) { "$packages;$env:PYTHONPATH" } else { $packages }
        & $bundled -c 'import fastapi, uvicorn, supabase, dotenv, korcen' 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return $bundled }
    }
    throw 'Python with the existing backend dependencies was not found. See docs/local-launcher.md.'
}
function Test-App([string]$Kind) {
    try {
        if ($Kind -eq 'api') {
            $response = Invoke-RestMethod 'http://127.0.0.1:8000/api/health' -TimeoutSec 2
            return ($response.status -eq 'ok')
        }
        $response = Invoke-WebRequest 'http://127.0.0.1:5173/' -UseBasicParsing -TimeoutSec 2
        return ($response.StatusCode -eq 200 -and $response.Content -match 'coursepick' -and $response.Content -match '/@vite/client')
    } catch { return $false }
}
function Test-Port([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $task = $client.ConnectAsync('127.0.0.1', $Port); return ($task.Wait(500) -and $client.Connected) }
    catch { return $false }
    finally { $client.Dispose() }
}
try {
    if ($Server -eq 'api') {
        $python = Find-Python
        Set-Location -LiteralPath (Join-Path $projectRoot 'backend')
        & $python -m uvicorn main:app --host 127.0.0.1 --port 8000
        exit $LASTEXITCODE
    }
    if ($Server -eq 'web') {
        $node = Find-Node
        & $node (Join-Path $projectRoot 'node_modules\vite\bin\vite.js') --host 127.0.0.1 --port 5173 --strictPort
        exit $LASTEXITCODE
    }
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules\vite\bin\vite.js'))) {
        throw 'Frontend dependencies are missing. No packages were installed automatically.'
    }
    $node = Find-Node
    $python = Find-Python
    if ($CheckOnly) { Write-Host 'Ready: Node, Python and existing frontend/backend dependencies.'; exit 0 }
    New-Item -ItemType Directory -Path $logs -Force | Out-Null
    $mutex = New-Object System.Threading.Mutex($false, 'Local\CoursepickLocalLauncher')
    $locked = $false
    try {
        try { $locked = $mutex.WaitOne(60000) } catch [System.Threading.AbandonedMutexException] { $locked = $true }
        if (-not $locked) { throw 'Another launcher is still starting the app. Try again shortly.' }
        foreach ($kind in @('api', 'web')) {
            if (Test-App $kind) { Write-Host "$kind server is already running."; continue }
            $port = if ($kind -eq 'api') { 8000 } else { 5173 }
            if (Test-Port $port) { throw "Port $port is occupied by another or unhealthy server. No process was stopped." }
            $arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -Server ' + $kind
            $process = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -WindowStyle Hidden -WorkingDirectory $projectRoot -RedirectStandardOutput (Join-Path $logs "$kind.stdout.log") -RedirectStandardError (Join-Path $logs "$kind.stderr.log") -PassThru
            $ready = $false
            $deadline = [DateTime]::UtcNow.AddSeconds(45)
            while ([DateTime]::UtcNow -lt $deadline) {
                if (Test-App $kind) { $ready = $true; break }
                if ($process.HasExited) { break }
                Start-Sleep -Milliseconds 500
            }
            if (-not $ready) { throw "$kind server did not become ready. Check outputs\local-servers\$kind.stderr.log." }
            Write-Host "$kind server is ready."
        }
        if (-not $NoBrowser) { Start-Process 'http://localhost:5173/' }
        Write-Host 'Coursepick is ready: http://localhost:5173/'
        Write-Host 'Servers continue running after this launcher closes.'
    } finally {
        if ($locked) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
