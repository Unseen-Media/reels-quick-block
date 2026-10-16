# Draws the extension icon (white "block" sign on a red-pink gradient circle) at 16/48/128 px.
param([string]$OutDir = "$PSScriptRoot\..\extension\icons")
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $OutDir | Out-Null

foreach ($size in 16, 48, 128) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $pad = [Math]::Max(1, $size * 0.04)
  $rect = New-Object System.Drawing.RectangleF $pad, $pad, ($size - 2 * $pad), ($size - 2 * $pad)
  $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect,
    ([System.Drawing.Color]::FromArgb(255, 254, 92, 120)),
    ([System.Drawing.Color]::FromArgb(255, 200, 20, 50)), 45.0
  $g.FillEllipse($grad, $rect)

  # White "no" symbol: ring + diagonal bar
  $stroke = [Math]::Max(1.6, $size * 0.1)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), $stroke
  $inset = $size * 0.25
  $ring = New-Object System.Drawing.RectangleF $inset, $inset, ($size - 2 * $inset), ($size - 2 * $inset)
  $g.DrawEllipse($pen, $ring)
  $r = ($size - 2 * $inset) / 2
  $c = $size / 2
  $d = $r * 0.7071
  $g.DrawLine($pen, ($c - $d), ($c - $d), ($c + $d), ($c + $d))

  $bmp.Save((Join-Path $OutDir "icon$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}
Get-ChildItem $OutDir | Select-Object Name, Length
