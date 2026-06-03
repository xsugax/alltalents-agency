# Redeploy All Talents API on Render (ata-h0yo.onrender.com)
# Option A: Render Dashboard → alltalents-api → Manual Deploy → Clear build cache
# Option B: If repo is linked, push api/ changes to the connected branch
# Option C: Render CLI (after: npm i -g @render/cli && render login)
Set-Location $PSScriptRoot
Write-Host "API root: $PSScriptRoot\api" -ForegroundColor Cyan
Write-Host "Health: https://ata-h0yo.onrender.com/api/health" -ForegroundColor Gray
if (Get-Command render -ErrorAction SilentlyContinue) {
  Write-Host "Triggering Render deploy via CLI..." -ForegroundColor Cyan
  render deploys create --service alltalents-api --confirm
} else {
  Write-Host "Render CLI not installed. Use dashboard manual deploy or:" -ForegroundColor Yellow
  Write-Host "  npm i -g @render/cli" -ForegroundColor Gray
  Write-Host "  render login" -ForegroundColor Gray
  Write-Host "  render deploys create --service alltalents-api --confirm" -ForegroundColor Gray
}
