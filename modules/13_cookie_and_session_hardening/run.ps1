# run.ps1 - Module 13 build/run script
#
# This module needs TWO servers at once: a guestbook variant (port 8000)
# and the attacker's collector (port 8002).
#
# Targets:
#   run-vulnerable-cookie-node, run-fixed-cookie-node, run-collector-node
#   run-vulnerable-cookie-php,  run-fixed-cookie-php,  run-collector-php
#   clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        'run-vulnerable-cookie-node', 'run-fixed-cookie-node', 'run-collector-node',
        'run-vulnerable-cookie-php', 'run-fixed-cookie-php', 'run-collector-php',
        'clean'
    )]
    [string]$Target
)

switch ($Target) {
    'run-vulnerable-cookie-node' { node "$PSScriptRoot\node\vulnerable-cookie\server.js" }
    'run-fixed-cookie-node'      { node "$PSScriptRoot\node\fixed-cookie\server.js" }
    'run-collector-node'         { node "$PSScriptRoot\node\attacker-collector\server.js" }
    'run-vulnerable-cookie-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\vulnerable-cookie"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-fixed-cookie-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\fixed-cookie"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-collector-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\attacker-collector"
        try { php -S localhost:8002 router.php } finally { Pop-Location }
    }
    'clean' {
        $files = @(
            "$PSScriptRoot\php\vulnerable-cookie\comments.json",
            "$PSScriptRoot\php\fixed-cookie\comments.json"
        )
        foreach ($f in $files) { if (Test-Path $f) { Remove-Item $f -Force; Write-Host "Removed $f" } }
    }
}
