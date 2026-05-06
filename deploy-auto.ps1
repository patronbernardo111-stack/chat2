# deploy-auto.ps1 — Deploy a Vercel con fallback a Netlify
# Uso: powershell -ExecutionPolicy Bypass -File deploy-auto.ps1

$ErrorActionPreference = "Continue"

# Asegurar que Git esté en el PATH
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $env:PATH += ";C:\Program Files\Git\cmd"
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Git no encontrado. Instálalo desde https://git-scm.com"
    exit 1
}

# 1. Verificar si hay cambios
git rm --cached egchat-api-temp 2>$null  # eliminar submódulo roto si vuelve a aparecer
git add -A
git reset HEAD egchat-api-temp 2>$null   # asegurarse de no stagear egchat-api-temp
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

Write-Host "Push completado. Vercel desplegará automáticamente desde el repo."
exit 0
