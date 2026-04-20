Add-Type -AssemblyName System.Drawing

$src = Join-Path (Get-Location) "public\assets\apps\ChatGPT Image 20 abr 2026, 10_41_23.png"
$img = [System.Drawing.Bitmap]::new($src)

$totalW = $img.Width
$totalH = $img.Height
$iconW  = [int]($totalW / 4)

$names = @("estados", "apuestas", "cemac", "mitaxi")
$outSize = 256

# Umbral para considerar "blanco" (R,G,B > 230)
$threshold = 230

for ($i = 0; $i -lt 4; $i++) {
    # 1. Recortar el icono completo (sin texto inferior)
    $cropTop  = [int]($totalH * 0.08)
    $cropH    = [int]($totalH * 0.65)
    $x        = [int]($i * $iconW)

    $cropped = New-Object System.Drawing.Bitmap($iconW, $cropH)
    $gc = [System.Drawing.Graphics]::FromImage($cropped)
    $gc.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $srcR = [System.Drawing.Rectangle]::new($x, $cropTop, $iconW, $cropH)
    $dstR = [System.Drawing.Rectangle]::new(0, 0, $iconW, $cropH)
    $gc.DrawImage($img, $dstR, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
    $gc.Dispose()

    # 2. Hacer transparente el fondo blanco
    $cropped.MakeTransparent([System.Drawing.Color]::White)

    # Hacer transparentes también los grises muy claros (anti-aliasing del fondo)
    for ($py = 0; $py -lt $cropped.Height; $py++) {
        for ($px = 0; $px -lt $cropped.Width; $px++) {
            $pixel = $cropped.GetPixel($px, $py)
            if ($pixel.R -gt $threshold -and $pixel.G -gt $threshold -and $pixel.B -gt $threshold) {
                $cropped.SetPixel($px, $py, [System.Drawing.Color]::Transparent)
            }
        }
    }

    # 3. Escalar a outSize x outSize
    $bmp = New-Object System.Drawing.Bitmap($outSize, $outSize)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($cropped, 0, 0, $outSize, $outSize)
    $g.Dispose()
    $cropped.Dispose()

    $outPath = Join-Path (Get-Location) "public\assets\apps\$($names[$i]).png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "OK: $($names[$i]).png - fondo eliminado"
}

$img.Dispose()
Write-Host "Listo!"
