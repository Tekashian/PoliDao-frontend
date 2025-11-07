# Professional script to remove development comments from TypeScript/React files
# Preserves business logic comments and code functionality

$patterns = @(
    '^\s*//\s*(NEW|ADD|ADDED|CHANGED|FIX|FIXED|UPDATED|Enhanced|Optimal|TODO|FIXME|HACK|XXX|NOTE|TEMP):.*$',
    '^\s*//\s*(Sweet spot|Perfect balance|Conservative|Maximum|minimum|balance).*$',
    '^\s*//\s*src/.*\.tsx?\s*$',
    '^\s*//\s*={3,}.*$'
)

$srcPath = ".\src"
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx")

Write-Host "🧹 Professional Code Cleanup - Removing Development Comments" -ForegroundColor Cyan
Write-Host "📁 Scanning: $srcPath" -ForegroundColor Gray
Write-Host ""

$totalRemoved = 0
$filesProcessed = 0

Get-ChildItem -Path $srcPath -Recurse -Include $extensions | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $removed = 0
    
    # Remove development comments line by line
    $lines = $content -split "`n"
    $cleanedLines = @()
    
    foreach ($line in $lines) {
        $shouldKeep = $true
        
        foreach ($pattern in $patterns) {
            if ($line -match $pattern) {
                $shouldKeep = $false
                $removed++
                break
            }
        }
        
        if ($shouldKeep) {
            $cleanedLines += $line
        }
    }
    
    $newContent = $cleanedLines -join "`n"
    
    # Remove excessive blank lines (more than 2 consecutive)
    $newContent = $newContent -replace '(\r?\n){4,}', "`n`n`n"
    
    if ($newContent -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        $totalRemoved += $removed
        $filesProcessed++
        Write-Host "✓ $($file.Name): $removed comments removed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ Cleanup Complete!" -ForegroundColor Cyan
Write-Host "📊 Files processed: $filesProcessed" -ForegroundColor Gray
Write-Host "🗑️  Comments removed: $totalRemoved" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Remember to test the application after cleanup!" -ForegroundColor Yellow
