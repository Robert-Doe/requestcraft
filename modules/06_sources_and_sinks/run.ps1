# run.ps1 - Module 06 build/run script
#
# This module has no web server -- it's a CLI analysis tool.
# Targets: run-node, run-php, clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-node', 'run-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-node' {
        node "$PSScriptRoot\node\analyze.js"
    }
    'run-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) {
            Write-Host "php is not on PATH. Install PHP first, or use '.\run.ps1 -Target run-node' instead." -ForegroundColor Yellow
            exit 1
        }
        php "$PSScriptRoot\php\analyze.php"
    }
    'clean' {
        Write-Host "Nothing to clean in Module 06 (no build artefacts are produced)."
    }
}
