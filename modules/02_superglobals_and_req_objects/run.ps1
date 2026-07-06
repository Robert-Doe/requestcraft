# run.ps1 - Module 02 build/run script (PowerShell equivalent of a Makefile)
#
# Targets:
#   run-node   - runs the Node.js superglobals demo (works right now)
#   run-php    - runs the PHP built-in dev server with router.php (requires php.exe on PATH)
#   clean      - removes any files this module generates (none yet)
#
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
        # php -S's second argument is a router script; it must run with the
        # php/ folder as the working directory so relative paths resolve
        Push-Location "$PSScriptRoot\php"
        try {
            php -S localhost:8000 router.php
        } finally {
            Pop-Location
        }
    }
    'clean' {
        Write-Host "Nothing to clean in Module 02 (no build artefacts are produced)."
    }
}
