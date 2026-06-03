# Deploy All Talents Agency to production (alltalentsagency.com)
# Requires: npm i -g vercel && vercel login (once)
Set-Location $PSScriptRoot
Write-Host "Deploying to Vercel project: alltalents-agency (alltalentsagency.com) ..." -ForegroundColor Cyan
npx vercel --prod --yes
if ($LASTEXITCODE -eq 0) {
  Write-Host "Done. Check https://alltalentsagency.com (hard refresh: Ctrl+F5)" -ForegroundColor Green
} else {
  Write-Host "Deploy failed. Run: npx vercel login" -ForegroundColor Yellow
}
