// Script para ejecutar todos los tests unitarios
// Ejecutar con: node scripts/run-all-tests.mjs

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const tests = [
  { name: 'Tests de cap-formulas', file: 'scripts/tests/cap-formulas.test.mjs' },
  { name: 'Tests de auth', file: 'scripts/tests/auth.test.mjs' },
  { name: 'Tests de store', file: 'scripts/tests/store.test.mjs' },
  { name: 'Tests de rate-limit', file: 'scripts/tests/rate-limit.test.mjs' },
  { name: 'Tests de validaciones', file: 'scripts/tests/validations.test.mjs' },
  { name: 'Tests de middleware', file: 'scripts/tests/middleware.test.mjs' },
  { name: 'Tests de schema', file: 'scripts/tests/schema.test.mjs' },
  { name: 'Tests de infraestructura', file: 'scripts/tests/infra.test.mjs' },
  { name: 'Tests de integración', file: 'scripts/tests/api-integration.test.mjs' },
  { name: 'Tests conductuales CSRF Edge', file: 'scripts/tests/csrf-edge.test.mjs' },
];

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║              EJECUTANDO TODOS LOS TESTS                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let totalPassed = 0;
let totalFailed = 0;
const failedTests = [];

for (const test of tests) {
  console.log(`\n▶️  Ejecutando: ${test.name}`);
  console.log('─'.repeat(60));
  
  try {
    const output = execSync(`node ${test.file}`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    
    console.log(output);
    
    // Contar tests que pasaron/fallaron
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    
    if (passMatch) totalPassed += parseInt(passMatch[1], 10);
    if (failMatch) {
      totalFailed += parseInt(failMatch[1], 10);
      failedTests.push(test.name);
    }
    
  } catch (error) {
    console.error(`❌ Error ejecutando ${test.name}:`, error.message);
    totalFailed++;
    failedTests.push(test.name);
  }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                      RESUMEN FINAL                        ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  ✅ Tests que pasaron: ${totalPassed.toString().padEnd(3)}                            ║`);
console.log(`║  ❌ Tests que fallaron: ${totalFailed.toString().padEnd(3)}                           ║`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (totalFailed === 0) {
  console.log('🎉 Todos los tests pasaron exitosamente!\n');
  process.exit(0);
} else {
  console.log(`⚠️  Hay ${totalFailed} tests que fallaron en: ${failedTests.join(', ')}\n`);
  process.exit(1);
}
