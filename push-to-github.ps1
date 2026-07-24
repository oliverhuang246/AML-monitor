# Quick push to GitHub - PowerShell script
# Encoding: UTF-8 with BOM

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Push code to GitHub" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git initialized successfully" -ForegroundColor Green
    Write-Host ""
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit
Write-Host ""
$commit_message = Read-Host "Enter commit message (default: Update)"
if ([string]::IsNullOrWhiteSpace($commit_message)) {
    $commit_message = "Update"
}
git commit -m "$commit_message"
Write-Host "Commit completed" -ForegroundColor Green
Write-Host ""

# Check if remote repository exists
$hasOrigin = git remote | Select-String "origin"
if (-not $hasOrigin) {
    Write-Host "Adding remote repository..." -ForegroundColor Yellow
    $repo_url = Read-Host "Enter GitHub repository URL (e.g., https://github.com/username/KYT1.git)"
    git remote add origin "$repo_url"
    Write-Host "Remote repository added" -ForegroundColor Green
    Write-Host ""
}

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Push completed successfully!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://render.com"
Write-Host "2. Login with GitHub"
Write-Host "3. Create Web Service"
Write-Host "4. Select your repository"
Write-Host "5. Wait for deployment"
Write-Host ""
Write-Host "For detailed steps, see: FREE_DEPLOY_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
