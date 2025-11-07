const fs = require('fs');
const path = require('path');
const glob = require('glob');

const patternsToRemove = [
  /^\/\/ src\/.*$/gm,
  /^\/\/ NEW:.*$/gm,
  /^\/\/ ADD:.*$/gm,
  /^\/\/ CHANGED:.*$/gm,
  /^\/\/ REPLACED:.*$/gm,
  /^\/\/ FIX:.*$/gm,
  /^\/\/ UPDATED:.*$/gm,
  /^\/\/ Enhanced:.*$/gm,
  /^\/\/ Optimal.*$/gm,
  /^\/\/ Maximum.*$/gm,
  /^\/\/ Smart.*$/gm,
  /^\/\/ Ultra.*$/gm,
  /^\/\/ Aggressive.*$/gm,
  /^\/\/ ===+.*===+.*$/gm,
  /^\/\/ -+.*$/gm,
  /^\/\/ \+.*$/gm,
  /\/\/ Lines \d+-\d+ omitted/g,
  /\/\/ Line \d+ omitted/g,
  /\/\*\s*Lines?\s+\d+.*omitted.*\*\//g,
];

const importantPatterns = [
  /\/\/ @ts-/,
  /\/\/ eslint-/,
  /\/\*\*[\s\S]*?\*\//,
  /\/\/ TODO:/,
  /\/\/ FIXME:/,
  /\/\/ NOTE:/,
  /\/\/ IMPORTANT:/,
  /\/\/ API:/,
  /\/\/ WARNING:/,
];

function shouldKeepComment(line) {
  return importantPatterns.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      
      if (!trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        return true;
      }
      
      if (shouldKeepComment(line)) {
        return true;
      }
      
      for (const pattern of patternsToRemove) {
        if (pattern.test(line)) {
          return false;
        }
      }
      
      return true;
    });
    
    content = cleanedLines.join('\n');
    
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`✗ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  const patterns = [
    path.join(srcPath, '**', '*.ts'),
    path.join(srcPath, '**', '*.tsx'),
    path.join(srcPath, '**', '*.js'),
    path.join(srcPath, '**', '*.jsx'),
  ];
  
  let totalCleaned = 0;
  let totalFiles = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**']
    });
    
    files.forEach(file => {
      totalFiles++;
      if (cleanFile(file)) {
        totalCleaned++;
      }
    });
  });
  
  console.log(`\n✓ Done! Cleaned ${totalCleaned} out of ${totalFiles} files.`);
}

main();