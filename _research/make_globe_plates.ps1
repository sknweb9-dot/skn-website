# Cut the 512x512 globe plates used as three.js textures on /events.
#
# WHY A PREP STEP AND NOT next/image
# ----------------------------------
# The globe loads its textures with THREE.TextureLoader, which takes a plain URL
# and knows nothing about Next's optimizer. Pointing it at /_next/image would
# work but would put ~28 optimizer round-trips in the critical path of opening
# the gallery, and Next 16 caps images.qualities at [75] by default, so there is
# no quality dial there either. Pre-cut files are served straight from /public,
# cached immutably, and cost the optimizer nothing.
#
# WHY SQUARE AND WHY 512
# ----------------------
# Square because the source photographs run from 0.67 to 1.78 aspect, and a
# sphere of identically-shaped plaques reads as a temple wall while a sphere of
# mixed rectangles reads as debris. 512 because it is power-of-two, so three.js
# can mipmap it without resampling — plates are seen at anything from 40px on the
# far side of the sphere to ~260px at the front, and without mipmaps the far side
# shimmers as it turns.
#
# The arch silhouette is NOT baked in here. It is applied at runtime in
# components/GlobeCanvas.tsx by clipping each loaded plate to the same arch path
# the rest of the site uses, so the shape stays authored in exactly one place.
#
# Crop is biased upward (0.35 rather than 0.5) for the same reason CROP_BIAS
# exists in ScrollStage: the bottom of a dance photograph is floor and the top is
# faces and hands.
#
# Keep the source list in step with SOURCES in web/lib/events.ts. The build will
# tell you if you do not — verifyEvents() throws when a record names a plate no
# source produces.

$ErrorActionPreference = 'Stop'

$root = 'C:\Projects\Shantikalaniketan'
$img = Join-Path $root 'web\public\img'
$out = Join-Path $img 'globe'

# key -> source file. The key becomes the plate filename and must match the
# `key` field in web/lib/events.ts SOURCES.
$plates = [ordered]@{
  'udaan-2025-poster' = 'event-udaan-2025.jpg'
  'udaan-2023-poster' = 'event-udaan-2023.jpg'
  'aparna'            = 'event-aparna.jpg'
  'arangetram-k'      = 'event-arangetram-k.jpg'
  'arangetram-j'      = 'event-arangetram-j.jpg'
  'festival'          = 'event-festival.jpg'
  'mylapore'          = 'event-mylapore.jpg'
  'athma'             = 'event-athma.jpg'
  'nadasudha'         = 'event-nadasudha.jpg'
  'jun2024'           = 'event-jun2024.jpg'
  'canada'            = 'event-canada.jpg'
  'ensemble'          = 'ensemble.jpg'
  'embrace'           = 'embrace-dance.jpg'
  'gallery-1'         = 'gallery-1.jpg'
  'gallery-2'         = 'gallery-2.jpg'
  'gallery-3'         = 'gallery-3.jpg'
  'stage-1'           = 'stage-1-intro.jpg'
  'stage-2'           = 'stage-2-foundation.jpg'
  'stage-3'           = 'stage-3-strength.jpg'
  'stage-4'           = 'stage-4-transition.jpg'
  'stage-5'           = 'stage-5-expression.jpg'
  'stage-6'           = 'stage-6-maturity.jpg'
  'stage-7'           = 'stage-7-arangetram.jpg'
  'hero-events'       = 'hero-events.jpg'
  'hero-photos'       = 'hero-photos.jpg'
  'hero-gurukulam'    = 'hero-gurukulam.jpg'
  'hero-skn'          = 'hero-skn.jpg'
  'hero-videos'       = 'hero-videos.jpg'
}

$size = 512
$bias = 0.35

if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

$made = 0
$missing = @()

foreach ($key in $plates.Keys) {
  $src = Join-Path $img $plates[$key]
  if (-not (Test-Path $src)) { $missing += $plates[$key]; continue }

  $dst = Join-Path $out ("{0}.webp" -f $key)

  # scale so the short edge reaches $size, then crop to square with the window
  # held above centre.
  $vf = "scale=${size}:${size}:force_original_aspect_ratio=increase," +
        "crop=${size}:${size}:(iw-ow)/2:(ih-oh)*${bias}"

  & ffmpeg -y -hide_banner -loglevel error -i $src `
    -vf $vf `
    -frames:v 1 -c:v libwebp -lossless 0 -quality 78 -compression_level 6 `
    $dst

  if (-not (Test-Path $dst)) { throw "ffmpeg produced nothing for $key" }
  $made += 1
}

if ($missing.Count -gt 0) {
  throw ("Missing source images: " + ($missing -join ', '))
}

$files = Get-ChildItem $out -Filter *.webp
Write-Output ("plates=" + $made)
Write-Output ("totalKB=" + [math]::Round((($files | Measure-Object Length -Sum).Sum / 1KB)))
Write-Output ("avgKB=" + [math]::Round((($files | Measure-Object Length -Average).Average / 1KB), 1))

if ($files.Count -ne $plates.Count) {
  throw ("Expected " + $plates.Count + " plates, found " + $files.Count)
}
Write-Output 'ok'
