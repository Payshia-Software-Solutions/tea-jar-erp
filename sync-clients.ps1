$clients = @(
    "lanka-auto-mart",
    "linton-teas-system",
    "lanka-auto-prime",
    "nebulync-erp-office",
    "tea-jar-erp"
)

# Move up one level to access the sibling client folders
$baseDir = (Get-Item -Path ".\").Parent.FullName
$coreUrl = "https://github.com/Payshia-Software-Solutions/rapair-management.git"

Write-Host "Starting BizzFlow Client Sync..." -ForegroundColor Cyan

foreach ($client in $clients) {
    $clientDir = Join-Path $baseDir $client
    if (Test-Path $clientDir) {
        Write-Host "`n========================================" -ForegroundColor Magenta
        Write-Host "Syncing Client: $client" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Magenta

        Set-Location $clientDir
        
        $remotes = git remote
        if ($remotes -notcontains "core-origin") {
            Write-Host "Adding core-origin remote..." -ForegroundColor DarkGray
            git remote add core-origin $coreUrl
        }

        Write-Host "Fetching core-origin..." -ForegroundColor DarkGray
        git fetch core-origin

        Write-Host "Merging core updates (main branch)..." -ForegroundColor DarkGray
        # Use allow-unrelated-histories for edge cases and --no-edit to avoid hanging on message prompts
        git merge core-origin/main --allow-unrelated-histories --no-edit
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "MERGE CONFLICT or ERROR in $client!" -ForegroundColor Red
            Write-Host "Please resolve conflicts manually in $clientDir before pushing." -ForegroundColor Red
            continue
        }

        Write-Host "Pushing to client's origin..." -ForegroundColor DarkGray
        git push origin main
        
        Write-Host "$client Synced Successfully! `n" -ForegroundColor Green
    } else {
        Write-Host "`n[SKIPPED] Folder for $client not found at $clientDir." -ForegroundColor Yellow
    }
}

# Return to the core directory
Set-Location (Join-Path $baseDir "rapair-management")
Write-Host "All active clients have been processed!" -ForegroundColor Cyan
