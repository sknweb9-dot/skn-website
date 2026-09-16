# Re-extract the mudra frame sequence at 1.5x the previous density (218 -> ~327).
# Source: mudra.mp4, 720x1280, 24fps, 45.375s, 1089 frames.
# Sampling at 24/3.3333 = 7.2fps. Native 720px width: no upscaling.
$ErrorActionPreference = 'Stop'

$root = 'C:\Projects\Shantikalaniketan'
$src = Join-Path $root 'mudra.mp4'
$staging = Join-Path $root 'web\public\frames_new'
$final = Join-Path $root 'web\public\frames'

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

& ffmpeg -y -hide_banner -loglevel error -i $src `
  -vf "fps=24/3.3333,scale=720:-2:flags=lanczos" `
  -an -c:v libwebp -lossless 0 -quality 72 -compression_level 6 `
  (Join-Path $staging 'frame_%04d.webp')

$new = Get-ChildItem $staging -Filter *.webp
Write-Output ('extracted=' + $new.Count)
Write-Output ('totalMB=' + [math]::Round((($new | Measure-Object Length -Sum).Sum / 1MB), 2))
Write-Output ('avgKB=' + [math]::Round((($new | Measure-Object Length -Average).Average / 1KB), 1))

if ($new.Count -lt 300) { throw ('Expected ~327 frames, got ' + $new.Count) }

Remove-Item $final -Recurse -Force
Rename-Item $staging 'frames'
Write-Output 'swapped=ok'

# Copy the emblem SVG into the web app's public tree.
Copy-Item (Join-Path $root 'assets\img\logo-full.svg') (Join-Path $root 'web\public\img\logo-full.svg') -Force
Write-Output 'emblem=ok'
