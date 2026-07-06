# run.ps1 - Module 05 build/run script
#
# Targets: run-node, run-php, clean
# Usage: .\run.ps1 -Target run-node

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-node', 'run-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-node' {
        node "$PSScriptRoot\node\server.js"
    }
    'run-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) {
            Write-Host "php is not on PATH. Install PHP first, or use '.\run.ps1 -Target run-node' instead." -ForegroundColor Yellow
            exit 1
        }
        Push-Location "$PSScriptRoot\php"
        try {
            php -S localhost:8000 router.php
        } finally {
            Pop-Location
        }
    }
    'clean' {
        Write-Host "Nothing to clean in Module 05 (no build artefacts are produced)."
    }
}
