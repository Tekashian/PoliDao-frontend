# Clean development comments from source files
$srcPath = ".\src"
$patterns = @(
    '^\s*//\s*(NEW|ADD|ADDED|CHANGED|FIX|FIXED|UPDATED|Enhanced|Optimal|TODO|FIXME|HACK|XXX|NOTE|TEMP):.*$'
)

Write-Host "Starting code cleanup..." -ForegroundColor Cyan
$totalRemoved = 0
$filesProcessed = 0

Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName
    $newContent = @()
    $removed = 0
    
    foreach ($line in $content) {
        $keep = $true
        foreach ($pattern in $patterns) {
            if ($line -match $pattern) {
                $keep = $false
                $removed++
                break
            }
        }
        if ($keep) {
            $newContent += $line
        }
    }
    
    if ($removed -gt 0) {
        $newContent | Set-Content -Path $file.FullName
        $totalRemoved += $removed
        $filesProcessed++
        Write-Host "$($file.Name): $removed comments removed" -ForegroundColor Green
    }
}

Write-Host "`nCleanup complete!" -ForegroundColor Cyan
Write-Host "Files processed: $filesProcessed" -ForegroundColor Gray
Write-Host "Comments removed: $totalRemoved" -ForegroundColor Gray
