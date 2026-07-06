# run.ps1 - Module 11 build/run script
#
# Targets:
#   run-reflected-fixed-node, run-stored-fixed-node, run-context-demo-node
#   run-reflected-fixed-php,  run-stored-fixed-php,  run-context-demo-php
#   clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        'run-reflected-fixed-node', 'run-stored-fixed-node', 'run-context-demo-node',
        'run-reflected-fixed-php', 'run-stored-fixed-php', 'run-context-demo-php',
        'clean'
    )]
    [string]$Target
)

switch ($Target) {
    'run-reflected-fixed-node' { node "$PSScriptRoot\node\reflected-fixed\server.js" }
    'run-stored-fixed-node'    { node "$PSScriptRoot\node\stored-fixed\server.js" }
    'run-context-demo-node'    { node "$PSScriptRoot\node\context-demo\server.js" }
    'run-reflected-fixed-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\reflected-fixed"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-stored-fixed-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\stored-fixed"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-context-demo-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\context-demo"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'clean' {
        $f = "$PSScriptRoot\php\stored-fixed\comments.json"
        if (Test-Path $f) { Remove-Item $f -Force; Write-Host "Removed $f" }
    }
}
