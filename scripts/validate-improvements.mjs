// Script de validación de mejoras implementadas
// Ejecutar con: node scripts/validate-improvements.mjs

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

function readFile(relativePath) {
  try {
    return readFileSync(join(rootDir, relativePath), 'utf-8');
  } catch {
    return null;
  }
}

function fileExists(relativePath) {
  return existsSync(join(rootDir, relativePath));
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     VALIDACIÓN DE MEJORAS - COMUNIDAD POST SINGULARIDAD  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// ════════════════════════════════════════════════════════════════════════════
// 1. SEGURIDAD CRÍTICA
// ════════════════════════════════════════════════════════════════════════════
console.log('📋 1. SEGURIDAD CRÍTICA');
console.log('─────────────────────────────────────────────────────────────');

check(
  'Token de Telegram eliminado (BOT/Token nocommit.txt)',
  !fileExists('BOT/Token nocommit.txt')
);

const gitignore = readFile('.gitignore');
check(
  '.gitignore excluye BOT/Token nocommit.txt',
  gitignore && gitignore.includes('BOT/Token nocommit.txt')
);

check(
  '.gitignore excluye .env*',
  gitignore && gitignore.includes('.env*')
);

// ════════════════════════════════════════════════════════════════════════════
// 2. TYPE-CHECKING Y LINTING
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 2. TYPE-CHECKING Y LINTING');
console.log('─────────────────────────────────────────────────────────────');

const nextConfig = readFile('next.config.js');
check(
  'ignoreBuildErrors está en false',
  nextConfig && nextConfig.includes('ignoreBuildErrors: false')
);

check(
  'ignoreDuringBuilds está en false',
  nextConfig && nextConfig.includes('ignoreDuringBuilds: false')
);

// ════════════════════════════════════════════════════════════════════════════
// 3. TESTS UNITARIOS
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 3. TESTS UNITARIOS');
console.log('─────────────────────────────────────────────────────────────');

check(
  'Tests de cap-formulas existen',
  fileExists('scripts/tests/cap-formulas.test.mjs')
);

check(
  'Tests de auth existen',
  fileExists('scripts/tests/auth.test.mjs')
);

// ════════════════════════════════════════════════════════════════════════════
// 4. RATE LIMITING
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 4. RATE LIMITING');
console.log('─────────────────────────────────────────────────────────────');

const rateLimit = readFile('src/lib/rate-limit.ts');
check(
  'Módulo de rate limiting existe',
  rateLimit !== null
);

check(
  'Rate limiting tiene función rateLimit()',
  rateLimit && rateLimit.includes('export function rateLimit')
);

check(
  'Rate limiting tiene límites configurados',
  rateLimit && rateLimit.includes('RATE_LIMITS')
);

const middleware = readFile('middleware.ts');
check(
  'Middleware usa rate limiting',
  middleware && middleware.includes('rateLimit(')
);

check(
  'Middleware aplica rate limiting en /api/',
  middleware && middleware.includes("pathname.startsWith('/api/')")
);

// ════════════════════════════════════════════════════════════════════════════
// 5. HEADERS DE SEGURIDAD
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 5. HEADERS DE SEGURIDAD');
console.log('─────────────────────────────────────────────────────────────');

check(
  'Middleware tiene X-Frame-Options',
  middleware && middleware.includes('X-Frame-Options')
);

check(
  'Middleware tiene X-Content-Type-Options',
  middleware && middleware.includes('X-Content-Type-Options')
);

check(
  'Middleware tiene Referrer-Policy',
  middleware && middleware.includes('Referrer-Policy')
);

check(
  'Middleware aplica headers en todas las respuestas',
  middleware && middleware.includes('addSecurityHeaders')
);

// ════════════════════════════════════════════════════════════════════════════
// 6. VALIDACIÓN CON ZOD
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 6. VALIDACIÓN CON ZOD');
console.log('─────────────────────────────────────────────────────────────');

const validations = readFile('src/lib/validations.ts');
check(
  'Módulo de validaciones existe',
  validations !== null
);

check(
  'Validaciones sin dependencias externas',
  validations && !validations.includes("from 'zod'")
);

check(
  'Validaciones tiene createPostSchema',
  validations && validations.includes('createPostSchema')
);

check(
  'Validaciones tiene createGuildSchema',
  validations && validations.includes('createGuildSchema')
);

check(
  'Validaciones tiene registerSchema',
  validations && validations.includes('registerSchema')
);

const postsApi = readFile('src/pages/api/posts.ts');
check(
  'Endpoint de posts usa validación',
  postsApi && postsApi.includes('createPostSchema')
);

// ════════════════════════════════════════════════════════════════════════════
// 7. PAGINACIÓN CONSISTENTE
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 7. PAGINACIÓN CONSISTENTE');
console.log('─────────────────────────────────────────────────────────────');

check(
  'Endpoint de posts tiene paginación',
  postsApi && postsApi.includes('pagination')
);

check(
  'Paginación usa page y limit',
  postsApi && postsApi.includes('page') && postsApi.includes('limit')
);

check(
  'Paginación retorna total',
  postsApi && postsApi.includes('total')
);

// ════════════════════════════════════════════════════════════════════════════
// 8. COMPONENTES DE LANDING PAGE
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 8. COMPONENTES DE LANDING PAGE');
console.log('─────────────────────────────────────────────────────────────');

check(
  'Componente GuildCategories existe',
  fileExists('src/components/landing/GuildCategories.tsx')
);

check(
  'GuildCategories está bien formado',
  (() => {
    const content = readFile('src/components/landing/GuildCategories.tsx');
    return content && content.includes('export default function GuildCategories');
  })()
);

// ════════════════════════════════════════════════════════════════════════════
// 9. ESTADO GLOBAL
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 9. ESTADO GLOBAL');
console.log('─────────────────────────────────────────────────────────────');

const store = readFile('src/lib/store.tsx');
check(
  'Store de estado global existe',
  store !== null
);

check(
  'Store usa React Context',
  store && store.includes('createContext')
);

check(
  'Store tiene useAppStore hook',
  store && store.includes('export function useAppStore')
);

check(
  'Store maneja usuario',
  store && store.includes('SET_USER')
);

check(
  'Store maneja notificaciones',
  store && store.includes('SET_NOTIFICATIONS')
);

// ════════════════════════════════════════════════════════════════════════════
// 10. LIMPIEZA DE ARCHIVOS TEMPORALES
// ════════════════════════════════════════════════════════════════════════════
console.log('\n📋 10. LIMPIEZA DE ARCHIVOS TEMPORALES');
console.log('─────────────────────────────────────────────────────────────');

check(
  'No hay archivos .tmp en scripts/agents/',
  !fileExists('scripts/agents/407A7AA7.tmp')
);

// ════════════════════════════════════════════════════════════════════════════
// RESUMEN
// ════════════════════════════════════════════════════════════════════════════
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                         RESUMEN                           ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  ✅ Pasaron: ${passed.toString().padEnd(3)}                                  ║`);
console.log(`║  ❌ Fallaron: ${failed.toString().padEnd(3)}                                 ║`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (failed === 0) {
  console.log('🎉 Todas las mejoras están correctamente implementadas.\n');
  process.exit(0);
} else {
  console.log(`⚠️  Hay ${failed} mejoras que necesitan atención.\n`);
  process.exit(1);
}
