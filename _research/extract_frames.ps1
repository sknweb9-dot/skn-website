# Extract the arch frame sequence from Hastas.mp4.
#
# Replaces the earlier mudra.mp4 extraction. Differences that matter:
#
#   * Source is 3840x2160 landscape, 30fps, 54.000s, 1620 decodable frames,
#     against the old 720x1280 portrait 24fps. The arm is horizontal here, so a
#     portrait crop is required rather than a straight scale.
#
#   * Crop 1558x2160 at x=1546 holds ratio 0.7215 — unchanged, so --arch-ratio,
#     the arch mask path, ArchOutline and CROP_BIAS all stay as they are. The
#     offset was measured, not guessed: _research/hand_extent.py samples every
#     3rd frame and puts the leftmost fingertip at x=1696 and the skin/sleeve
#     boundary at x=3240, so x=1546 leaves a 150px fingertip margin and the
#     right edge at 3104 keeps the green sleeve out of frame in every frame.
#     _research/crop_candidates.py renders the alternatives that were rejected.
#
#   * fps=6 gives exactly 324 frames over 54s, so every gesture boundary in the
#     reference guide — all of which fall on whole seconds — lands on a frame
#     multiple of 6. That is what lets lib/mudras.ts carry real frame numbers and
#     drop the old LABEL_GRID indirection entirely.
#
#   * Hastas.mp4 has no burned-in gesture labels, so there is nothing to crop off
#     the bottom at draw time. VISIBLE_FRAME_HEIGHT is gone.
#
#   * 864px wide, not 720. Measured aperture widths are 294-644 CSS px, so the
#     common retina desktop (1920 logical at DPR 2) needs ~966 device px and the
#     old 720 under-resolved it. 864 covers 1440-logical retina outright and
#     upscales 12% at 1920. Quality 74 from _research/encode_trial.py; denoising
#     was tested (_research/denoise_trial.py) and rejected — it saved only 6%
#     and risks softening the alta edges.
$ErrorActionPreference = 'Stop'

$root = 'C:\Projects\Shantikalaniketan'
$src = Join-Path $root 'Hastas.mp4'
$staging = Join-Path $root 'web\public\frames_new'
$final = Join-Path $root 'web\public\frames'

$EXPECTED = 324

if (-not (Test-Path $src)) { throw "Source not found: $src" }
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

& ffmpeg -y -hide_banner -loglevel error -i $src `
  -vf "crop=1558:2160:1546:0,fps=6,scale=864:-2:flags=lanczos" `
  -an -c:v libwebp -lossless 0 -quality 74 -compression_level 6 `
  (Join-Path $staging 'frame_%04d.webp')

$new = Get-ChildItem $staging -Filter *.webp
Write-Output ('extracted=' + $new.Count)
Write-Output ('totalMB=' + [math]::Round((($new | Measure-Object Length -Sum).Sum / 1MB), 2))
Write-Output ('avgKB=' + [math]::Round((($new | Measure-Object Length -Average).Average / 1KB), 1))

if ($new.Count -ne $EXPECTED) {
  throw ('Expected exactly ' + $EXPECTED + ' frames, got ' + $new.Count +
         '. The gesture frame numbers in lib/mudras.ts assume 6fps over 54s; ' +
         'do not swap a different count in without recomputing them.')
}

# Confirm the emitted geometry matches what lib/mudras.ts declares.
$probe = & ffprobe -v error -select_streams v:0 -show_entries stream=width,height `
  -of csv=p=0 (Join-Path $staging 'frame_0001.webp')
Write-Output ('geometry=' + $probe)

if (Test-Path $final) { Remove-Item $final -Recurse -Force }
Rename-Item $staging 'frames'
Write-Output 'swapped=ok'
