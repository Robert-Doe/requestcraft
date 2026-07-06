# run.ps1 - Module 01 build/run script (PowerShell equivalent of a Makefile;
# no C/build step exists for PHP or JS, so "build" collapses into "run")
#
# Targets (pass as the -Target parameter):
#   run-node   - runs the Node.js raw TCP listener (works right now, Node is on PATH)
#   run-php    - runs the PHP raw TCP listener (requires php.exe on PATH)
#   clean      - removes any files this module generates (none yet, kept for
#                consistency with every other module's script)
#
# Usage:
#   .\run.ps1 -Target run-node
#   .\run.ps1 -Target run-php
#   .\run.ps1 -Target clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-node', 'run-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-node' {
        # node is confirmed on PATH for this course -- runs the JS listener
        # directly, no build step needed (JS doesn't compile)
        node "$PSScriptRoot\node\raw_server.js"
    }
    'run-php' {
        # Requires php.exe on PATH -- fail fast with a clear message if it's
        # missing, rather than a confusing "command not found" further down
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) {
            Write-Host "php is not on PATH. Install PHP first, or use '.\run.ps1 -Target run-node' instead." -ForegroundColor Yellow
            exit 1
        }
        php "$PSScriptRoot\php\raw_server.php"
    }
    'clean' {
        # Module 01 produces no build artefacts (no compiled output, no logs
        # written to disk) -- this target exists purely so every module's
        # script exposes the same three targets
        Write-Host "Nothing to clean in Module 01 (no build artefacts are produced)."
    }
}
