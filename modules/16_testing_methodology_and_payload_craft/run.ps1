# run.ps1 - Module 16 build/run script
#
# Two-step: run the target server in one terminal, run the test runner
# in a second terminal.
#
# Targets: run-target-node, run-tests-node, run-target-php, run-tests-php, clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-target-node', 'run-tests-node', 'run-target-php', 'run-tests-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-target-node' { node "$PSScriptRoot\node\target.js" }
    'run-tests-node'  { node "$PSScriptRoot\node\test_runner.js" }
    'run-target-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node targets instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php"
        try { php -S localhost:8000 target.php } finally { Pop-Location }
    }
    'run-tests-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node targets instead." -ForegroundColor Yellow; exit 1 }
        php "$PSScriptRoot\php\test_runner.php"
    }
    'clean' { Write-Host "Nothing to clean in Module 16 (no build artefacts are produced)." }
}
