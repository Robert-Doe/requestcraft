# run.ps1 - Module 09 build/run script
#
# This module needs TWO servers running AT THE SAME TIME, in two
# different terminals: the bank (port 8000) and the attacker site
# (port 8001).
#
# Targets:
#   run-bank-node, run-attacker-node   (Node versions)
#   run-bank-php,  run-attacker-php    (PHP versions, require php.exe on PATH)
#   clean                               (removes the PHP bank's persisted balances.json)
#
# Usage (two terminals):
#   Terminal 1: .\run.ps1 -Target run-bank-node
#   Terminal 2: .\run.ps1 -Target run-attacker-node

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-bank-node', 'run-attacker-node', 'run-bank-php', 'run-attacker-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-bank-node' {
        node "$PSScriptRoot\node\bank\server.js"
    }
    'run-attacker-node' {
        node "$PSScriptRoot\node\attacker\server.js"
    }
    'run-bank-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) {
            Write-Host "php is not on PATH. Install PHP first, or use '.\run.ps1 -Target run-bank-node' instead." -ForegroundColor Yellow
            exit 1
        }
        Push-Location "$PSScriptRoot\php\bank"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-attacker-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) {
            Write-Host "php is not on PATH. Install PHP first, or use '.\run.ps1 -Target run-attacker-node' instead." -ForegroundColor Yellow
            exit 1
        }
        Push-Location "$PSScriptRoot\php\attacker"
        try { php -S localhost:8001 router.php } finally { Pop-Location }
    }
    'clean' {
        $balancesFile = "$PSScriptRoot\php\bank\balances.json"
        if (Test-Path $balancesFile) {
            Remove-Item $balancesFile -Force
            Write-Host "Removed $balancesFile"
        } else {
            Write-Host "Nothing to clean (balances.json does not exist yet)."
        }
    }
}
