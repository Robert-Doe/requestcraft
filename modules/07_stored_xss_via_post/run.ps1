# run.ps1 - Module 07 build/run script
#
# Targets: run-node, run-php, clean

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
        $commentsFile = "$PSScriptRoot\php\comments.json"
        if (Test-Path $commentsFile) {
            Remove-Item $commentsFile -Force
            Write-Host "Removed $commentsFile"
        } else {
            Write-Host "Nothing to clean (comments.json does not exist yet)."
        }
    }
}
