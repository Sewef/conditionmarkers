# Script to crop, square, and resize all images in /public/images to 512x512
# Requires ImageMagick to be installed

# Get the script directory and construct path relative to it
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$imagesPath = Join-Path $scriptDir "public\images"
$outputSize = "512x512"

Write-Host "Looking for images in: $imagesPath" -ForegroundColor Gray

if (-not (Test-Path $imagesPath)) {
    Write-Host "Error: $imagesPath not found" -ForegroundColor Red
    exit 1
}

# List all files in the directory for debugging
Write-Host "Files in directory:" -ForegroundColor Gray
Get-ChildItem -Path $imagesPath | ForEach-Object { Write-Host "  - $($_.Name) ($($_.Extension))" }

$imageFiles = Get-ChildItem -Path $imagesPath -Filter "*.webp" -File

Write-Host "Found $($imageFiles.Count) .webp files" -ForegroundColor Gray

Write-Host "Processing $($imageFiles.Count) images..." -ForegroundColor Green
$successCount = 0

foreach ($file in $imageFiles) {
    $filePath = $file.FullName
    $fileName = $file.Name
    
    try {
        Write-Host "Processing: $fileName" -ForegroundColor Cyan
        
        # Get image dimensions
        $info = magick identify -format '%w %h' $filePath
        $dimensions = $info.Split(" ")
        $width = [int]$dimensions[0]
        $height = [int]$dimensions[1]
        
        # Square the image by cropping to the smaller dimension (centered)
        $squareSize = [Math]::Min($width, $height)
        $offsetX = [Math]::Max(0, [Math]::Floor(($width - $squareSize) / 2))
        $offsetY = [Math]::Max(0, [Math]::Floor(($height - $squareSize) / 2))
        
        # Use ImageMagick to crop and resize
        # -crop: crop to square starting at offsetX,offsetY with size squareSize x squareSize
        # +repage: flatten the virtual canvas
        # -resize: resize to 512x512
        # -quality: set JPEG quality (for WebP, still useful)
        $cropGeometry = "$squareSize`x$squareSize`+$offsetX`+$offsetY"
        magick "$filePath" -crop $cropGeometry +repage -resize $outputSize -quality 90 "$filePath"
        
        Write-Host "  OK: Successfully processed" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "  ERROR processing $fileName : $_" -ForegroundColor Red
    }
}

$totalCount = $imageFiles.Count
Write-Host "Done! Successfully processed $successCount/$totalCount images" -ForegroundColor Green
