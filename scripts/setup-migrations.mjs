// Script para inicializar migraciones de Prisma
// Ejecutar con: node scripts/setup-migrations.mjs
//
// Este script:
// 1. Verifica que la base de datos esté disponible
// 2. Crea la migración inicial desde el schema actual
// 3. Aplica la migración

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        INICIALIZACIÓN DE MIGRACIONES DE PRISMA           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Verificar que DATABASE_URL esté configurada
import { readFileSync } from 'fs';
try {
  const envContent = readFileSync(join(rootDir, '.env'), 'utf-8');
  if (!envContent.includes('DATABASE_URL=')) {
    console.error('❌ Error: DATABASE_URL no está configurada en .env');
    console.log('   Agregá DATABASE_URL="postgresql://user:password@localhost:5432/comunidad"');
    process.exit(1);
  }
  console.log('✅ DATABASE_URL encontrada en .env\n');
} catch (error) {
  console.error('❌ Error: No se pudo leer .env');
  process.exit(1);
}

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`▶️  ${description}...`);
  try {
    const output = execSync(command, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    console.log(`✅ ${description} - OK\n`);
    if (output.trim()) {
      console.log(output.trim());
      console.log('');
    }
    return true;
  } catch (error) {
    console.error(`❌ ${description} - FALLÓ`);
    console.error(error.stderr || error.message);
    return false;
  }
}

// Paso 1: Verificar conexión a la base de datos
console.log('Paso 1: Verificando conexión a la base de datos...');
if (!runCommand('npx prisma db execute --stdin <<< "SELECT 1"', 'Conexión a BD')) {
  console.error('\n❌ No se pudo conectar a la base de datos.');
  console.log('   Asegurate de que PostgreSQL esté corriendo y DATABASE_URL sea correcta.\n');
  process.exit(1);
}

// Paso 2: Crear directorio de migraciones si no existe
import { mkdirSync, existsSync } from 'fs';
const migrationsDir = join(rootDir, 'prisma', 'migrations');
if (!existsSync(migrationsDir)) {
  console.log('Paso 2: Creando directorio de migraciones...');
  mkdirSync(migrationsDir, { recursive: true });
  console.log('✅ Directorio de migraciones creado\n');
}

// Paso 3: Generar cliente Prisma
console.log('Paso 3: Generando cliente Prisma...');
if (!runCommand('npx prisma generate', 'Generación de cliente Prisma')) {
  console.error('\n❌ Error generando cliente Prisma.\n');
  process.exit(1);
}

// Paso 4: Crear migración inicial
console.log('Paso 4: Creando migración inicial...');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const migrationName = `init_${timestamp}`;
if (!runCommand(`npx prisma migrate dev --name ${migrationName} --create-only`, `Creando migración ${migrationName}`)) {
  console.error('\n❌ Error creando migración.\n');
  console.log('   Esto puede pasar si ya hay migraciones pendientes o diferencias con la BD.');
  console.log('   Verificá el estado con: npx prisma migrate status\n');
  process.exit(1);
}

// Paso 5: Aplicar migración
console.log('Paso 5: Aplicando migración...');
if (!runCommand('npx prisma migrate deploy', 'Aplicando migración')) {
  console.error('\n❌ Error aplicando migración.\n');
  process.exit(1);
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║              MIGRACIONES COMPLETADAS ✅                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('Próximos pasos:');
console.log('  • Para futuras migraciones: npx prisma migrate dev --name <nombre>');
console.log('  • Para ver estado: npx prisma migrate status');
console.log('  • Para revertir: npx prisma migrate resolve --rolled-back <migration>\n');
