# run.ps1 - Module 15 build/run script
#
# Targets: run-node, run-php, clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-node', 'run-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-node' { node "$PSScriptRoot\node\server.js" }
    'run-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use '-Target run-node' instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'clean' {
        Get-ChildItem "$PSScriptRoot\node\uploads-vulnerable" -File -ErrorAction SilentlyContinue | Remove-Item -Force
        Get-ChildItem "$PSScriptRoot\node\uploads-fixed" -File -ErrorAction SilentlyContinue | Remove-Item -Force
        Get-ChildItem "$PSScriptRoot\php\uploads-vulnerable" -File -ErrorAction SilentlyContinue | Remove-Item -Force
        Get-ChildItem "$PSScriptRoot\php\uploads-fixed" -File -ErrorAction SilentlyContinue | Remove-Item -Force
        Write-Host "Cleared all uploaded test files."
    }
}
