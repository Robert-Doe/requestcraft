# run.ps1 - Module 10 build/run script
#
# This module needs TWO servers running AT THE SAME TIME: a bank
# variant (port 8000) and the attacker site (port 8001). Run the
# vulnerable bank first, observe the attack succeed, then stop it and
# run the fixed bank against the SAME attacker site to see the attack
# fail.
#
# Targets:
#   run-bank-vulnerable-node, run-bank-fixed-node, run-attacker-node
#   run-bank-vulnerable-php,  run-bank-fixed-php,  run-attacker-php
#   clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        'run-bank-vulnerable-node', 'run-bank-fixed-node', 'run-attacker-node',
        'run-bank-vulnerable-php', 'run-bank-fixed-php', 'run-attacker-php',
        'clean'
    )]
    [string]$Target
)

switch ($Target) {
    'run-bank-vulnerable-node' { node "$PSScriptRoot\node\bank-vulnerable\server.js" }
    'run-bank-fixed-node'      { node "$PSScriptRoot\node\bank-fixed\server.js" }
    'run-attacker-node'        { node "$PSScriptRoot\node\attacker\server.js" }
    'run-bank-vulnerable-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\bank-vulnerable"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-bank-fixed-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\bank-fixed"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-attacker-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\attacker"
        try { php -S localhost:8001 router.php } finally { Pop-Location }
    }
    'clean' {
        $files = @(
            "$PSScriptRoot\php\bank-vulnerable\balances.json",
            "$PSScriptRoot\php\bank-fixed\balances.json",
            "$PSScriptRoot\php\bank-fixed\tokens.json"
        )
        foreach ($f in $files) {
            if (Test-Path $f) { Remove-Item $f -Force; Write-Host "Removed $f" }
        }
    }
}
