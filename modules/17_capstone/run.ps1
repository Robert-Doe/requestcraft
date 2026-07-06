# run.ps1 - Module 17 Capstone build/run script
#
# Targets: run-vulnerable-node, run-hardened-node, run-vulnerable-php, run-hardened-php, clean

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('run-vulnerable-node', 'run-hardened-node', 'run-vulnerable-php', 'run-hardened-php', 'clean')]
    [string]$Target
)

switch ($Target) {
    'run-vulnerable-node' { node "$PSScriptRoot\node\vulnerable\server.js" }
    'run-hardened-node'   { node "$PSScriptRoot\node\hardened\server.js" }
    'run-vulnerable-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\vulnerable"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'run-hardened-php' {
        $php = Get-Command php -ErrorAction SilentlyContinue
        if (-not $php) { Write-Host "php is not on PATH. Use the -node target instead." -ForegroundColor Yellow; exit 1 }
        Push-Location "$PSScriptRoot\php\hardened"
        try { php -S localhost:8000 router.php } finally { Pop-Location }
    }
    'clean' {
        $files = @(
            "$PSScriptRoot\php\vulnerable\posts.json",
            "$PSScriptRoot\php\hardened\posts.json",
            "$PSScriptRoot\php\hardened\tokens.json"
        )
        foreach ($f in $files) { if (Test-Path $f) { Remove-Item $f -Force; Write-Host "Removed $f" } }
    }
}
