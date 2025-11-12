#!/usr/bin/env node
/**
 * Simple runtime guard to prevent running the dev server on too old Node.
 * Next.js 15 + React 19 require Node >= 18.17 (recommended >=20).
 */
const semverGte = (a, b) => {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return true; // equal
};

const current = process.version; // e.g. v14.21.3
const required = '20.0.0';

if (!semverGte(current, required)) {
  console.error('\n\x1b[31m[ERROR]\x1b[0m Detected Node ' + current + ' – wymagane >= ' + required + '.');
  console.error('Next 15 / React 19 nie będą działać poprawnie na starszej wersji (np. SyntaxError na ??=).');
  console.error('\nSzybka naprawa (nvm-windows):');
  console.error('  nvm install 20.11.1');
  console.error('  nvm use 20.11.1');
  console.error('\nAlbo pobierz LTS z https://nodejs.org/');
  console.error('\nPo aktualizacji:');
  console.error('  node -v   # powinno pokazać >= v20');
  console.error('  npm install');
  console.error('  npm run dev');
  process.exit(1);
}

console.log('\x1b[32m[OK]\x1b[0m Node version ' + current + ' spełnia wymagania (>= ' + required + ').');
