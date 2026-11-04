Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "icon-512.png").Path
$srcImage = [System.Drawing.Image]::FromFile($srcPath)

$resDir = (Resolve-Path "android\app\src\main\res").Path

$densities = @(
    @{ Name = "mipmap-mdpi"; LauncherSize = 48; ForeSize = 108 },
    @{ Name = "mipmap-hdpi"; LauncherSize = 72; ForeSize = 162 },
    @{ Name = "mipmap-xhdpi"; LauncherSize = 96; ForeSize = 216 },
    @{ Name = "mipmap-xxhdpi"; LauncherSize = 144; ForeSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LauncherSize = 192; ForeSize = 432 }
)

$bgColor = [System.Drawing.ColorTranslator]::FromHtml("#FAF8F4")

foreach ($d in $densities) {
    $folder = Join-Path $resDir $d.Name
    if (-not (Test-Path $folder)) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }

    # 1. ic_launcher_foreground.png (108dp canvas, safe zone 72dp)
    $foreBmp = New-Object System.Drawing.Bitmap($d.ForeSize, $d.ForeSize)
    $g = [System.Drawing.Graphics]::FromImage($foreBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $innerSize = [int]($d.ForeSize * 72 / 108)
    $offset = [int](($d.ForeSize - $innerSize) / 2)
    $g.DrawImage($srcImage, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()

    $forePath = Join-Path $folder "ic_launcher_foreground.png"
    $foreBmp.Save($forePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $foreBmp.Dispose()

    # 2. ic_launcher.png (Legacy launcher)
    $launchBmp = New-Object System.Drawing.Bitmap($d.LauncherSize, $d.LauncherSize)
    $g2 = [System.Drawing.Graphics]::FromImage($launchBmp)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.Clear($bgColor)
    $g2.DrawImage($srcImage, 0, 0, $d.LauncherSize, $d.LauncherSize)
    $g2.Dispose()

    $launchPath = Join-Path $folder "ic_launcher.png"
    $launchBmp.Save($launchPath, [System.Drawing.Imaging.ImageFormat]::Png)

    # 3. ic_launcher_round.png
    $roundPath = Join-Path $folder "ic_launcher_round.png"
    $roundBmp = New-Object System.Drawing.Bitmap($d.LauncherSize, $d.LauncherSize)
    $g3 = [System.Drawing.Graphics]::FromImage($roundBmp)
    $g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g3.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g3.Clear([System.Drawing.Color]::Transparent)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $d.LauncherSize, $d.LauncherSize)
    $g3.SetClip($path)
    $g3.Clear($bgColor)
    $g3.DrawImage($srcImage, 0, 0, $d.LauncherSize, $d.LauncherSize)
    $g3.Dispose()

    $roundBmp.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $roundBmp.Dispose()
    $launchBmp.Dispose()

    Write-Host "Generated icons for $($d.Name)"
}

$srcImage.Dispose()
Write-Host "All Android icons generated successfully!"
