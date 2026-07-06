# run.ps1 - Module 04 build/run script
#
# Targets:
#   run-node - runs the Node.js counter server
#   run-php  - runs the PHP counter server (requires php.exe on PATH)
#   crawl    - runs the crawler simulation against whichever server is running on :8000
#   clean    - removes the PHP counter's persisted counts.json

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-node', 'run-php', 'crawl', 'clean')]
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
    'crawl' {
        # Run this from a SECOND terminal while run-node or run-php is active in the first
        node "$PSScriptRoot\crawler.js"
    }
    'clean' {
        $countsFile = "$PSScriptRoot\php\counts.json"
        if (Test-Path $countsFile) {
            Remove-Item $countsFile -Force
            Write-Host "Removed $countsFile"
        } else {
            Write-Host "Nothing to clean (counts.json does not exist yet)."
        }
    }
}
