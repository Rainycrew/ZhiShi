# generate-android-res.ps1
# Generate Android launcher icons, adaptive foreground/background and splash drawables
# from resources/ using System.Drawing (Windows built-in, no sharp / @capacitor/assets).
# Run AFTER: npx cap add android  (npm run assets)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root   = Split-Path -Parent $PSScriptRoot
$icon   = Join-Path $root 'resources\icon.png'
$splashSrc = Join-Path $root 'resources\splash.png'
$res    = Join-Path $root 'android\app\src\main\res'

if (-not (Test-Path (Join-Path $root 'android'))) {
    Write-Host "[assets] android/ not found. Run: npx cap add android first" -ForegroundColor Yellow
    exit 0
}

$deepGreen = [System.Drawing.Color]::FromArgb(255, 14, 42, 34)

$iconImg   = [System.Drawing.Bitmap]::FromFile($icon)
$splashImg = [System.Drawing.Bitmap]::FromFile($splashSrc)

function New-Dir([string]$p) {
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null }
}

function HQ-Graphics([System.Drawing.Bitmap]$bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    return $g
}

function Save-Square([System.Drawing.Bitmap]$src, [int]$size, [string]$path) {
    New-Dir (Split-Path $path)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = HQ-Graphics $bmp
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose(); $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

function Save-Round([System.Drawing.Bitmap]$src, [int]$size, [string]$path) {
    New-Dir (Split-Path $path)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = HQ-Graphics $bmp
    $g.Clear([System.Drawing.Color]::Transparent)
    $brush = New-Object System.Drawing.SolidBrush $deepGreen
    $g.FillEllipse($brush, 0, 0, $size, $size); $brush.Dispose()
    $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clipPath.AddEllipse(0, 0, $size, $size)
    $g.SetClip($clipPath)
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.ResetClip()
    $clipPath.Dispose(); $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

function Save-Foreground([System.Drawing.Bitmap]$src, [int]$size, [string]$path) {
    New-Dir (Split-Path $path)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = HQ-Graphics $bmp
    $g.Clear([System.Drawing.Color]::Transparent)
    $s = [float]$size * 0.88
    $x = [float](($size - $s) / 2.0)
    $g.DrawImage($src, $x, $x, $s, $s)
    $g.Dispose(); $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

function Save-Cover([System.Drawing.Bitmap]$src, [int]$w, [int]$h, [string]$path) {
    New-Dir (Split-Path $path)
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = HQ-Graphics $bmp
    $g.Clear([System.Drawing.Color]::FromArgb(255, 241, 240, 234))
    $scale = [Math]::Max($w / $src.Width, $h / $src.Height)
    $dw = $src.Width * $scale; $dh = $src.Height * $scale
    $dx = [float](($w - $dw) / 2.0); $dy = [float](($h - $dh) / 2.0)
    $g.DrawImage($src, $dx, $dy, $dw, $dh)
    $g.Dispose(); $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}

$densities = @(
    @{ d='mdpi';    s=48  },
    @{ d='hdpi';    s=72  },
    @{ d='xhdpi';   s=96  },
    @{ d='xxhdpi';  s=144 },
    @{ d='xxxhdpi'; s=192 }
)
foreach ($den in $densities) {
    $mip = Join-Path $res ("mipmap-" + $den.d)
    Save-Square $iconImg $den.s (Join-Path $mip 'ic_launcher.png')
    Save-Round  $iconImg $den.s (Join-Path $mip 'ic_launcher_round.png')
    $fgSize = [int]([Math]::Round($den.s * 2.25))
    Save-Foreground $iconImg $fgSize (Join-Path $mip 'ic_launcher_foreground.png')
    Write-Host ("[assets] mipmap-{0}: launcher/round/foreground" -f $den.d)
}

$bgColorFile = Join-Path $res 'values\ic_launcher_background.xml'
if (Test-Path $bgColorFile) {
    $content = Get-Content $bgColorFile -Raw
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, '>#?[0-9A-Fa-f]{6}<', '>#0E2A22<')
    [System.IO.File]::WriteAllText($bgColorFile, $content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "[assets] adaptive background color -> #0E2A22"
} else {
    Write-Host "[assets] ic_launcher_background.xml not found" -ForegroundColor Yellow
}

$splashes = @(
    @{ p='drawable';              w=480;  h=320  },
    @{ p='drawable-port-mdpi';    w=320;  h=480  },
    @{ p='drawable-port-hdpi';    w=480;  h=800  },
    @{ p='drawable-port-xhdpi';   w=720;  h=1280 },
    @{ p='drawable-port-xxhdpi';  w=960;  h=1600 },
    @{ p='drawable-port-xxxhdpi'; w=1280; h=1920 },
    @{ p='drawable-land-mdpi';    w=480;  h=320  },
    @{ p='drawable-land-hdpi';    w=800;  h=480  },
    @{ p='drawable-land-xhdpi';   w=1280; h=720  },
    @{ p='drawable-land-xxhdpi';  w=1600; h=960  },
    @{ p='drawable-land-xxxhdpi'; w=1920; h=1280 }
)
foreach ($sp in $splashes) {
    Save-Cover $splashImg $sp.w $sp.h (Join-Path $res ($sp.p + '\splash.png'))
}
Write-Host "[assets] splash drawables generated"

$iconImg.Dispose(); $splashImg.Dispose()
Write-Host "[assets] done. Icons + adaptive + splash written to android/app/src/main/res/"
