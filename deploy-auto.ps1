# deploy-auto.ps1 — Deploy a Vercel con fallback a Netlify
# Uso: powershell -ExecutionPolicy Bypass -File deploy-auto.ps1

$ErrorActionPreference = "Continue"

# 1. Verificar si hay cambios
git add -A
$diff = git diff --cached --quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Sin cambios, no se hace deploy"
    exit 0
}

# 2. Commit y push
git commit -m "deploy: auto build and push"
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en git push"
    exit 1
}

# 3. Esperar a que Vercel procese el deployment
Write-Host "Esperando 90s para que Vercel procese el deployment..."
Start-Sleep -Seconds 90

# 4. Intentar asignar alias en Vercel
$vercelOutput = npx vercel ls --scope dulcendongs-projects 2>&1
$vercelUrl = ($vercelOutput | Select-String -Pattern 'egchat-v2-[a-z0-9]+-dulcendongs-projects\.vercel\.app' | Select-Object -First 1).Matches.Value

if ($vercelUrl) {
    npx vercel alias set $vercelUrl egchat-v2.vercel.app --scope dulcendongs-projects
    Write-Host "Vercel alias asignado: $vercelUrl"
    exit 0
}

# 5. Fallback a Netlify si Vercel no tiene nuevo deployment
Write-Host "Vercel sin nuevo deployment (limite alcanzado?) - desplegando en Netlify..."

if (-not $env:NETLIFY_AUTH_TOKEN -or -not $env:NETLIFY_SITE_ID) {
    Write-Host "NETLIFY_AUTH_TOKEN o NETLIFY_SITE_ID no configurados. Configuralos con:"
    Write-Host "  setx NETLIFY_AUTH_TOKEN 'tu-token'"
    Write-Host "  setx NETLIFY_SITE_ID 'tu-site-id'"
    exit 1
}

npm run build
netlify deploy --prod --dir=dist --auth=$env:NETLIFY_AUTH_TOKEN --site=$env:NETLIFY_SITE_ID
Write-Host "Deploy en Netlify completado"
