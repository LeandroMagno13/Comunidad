/* Preflight de entorno para Vercel.
 * - En produccion: falla explicitamente si faltan variables criticas.
 * - En preview/desarrollo: solo avisa, para no romper los deploy de PR.
 * - Nunca imprime valores de secretos: solo presencia y longitud.
 */
const required = [];
const warnings = [];

const isVercel = !!process.env.VERCEL_ENV;
const isProd = isVercel ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production';

function has(key) {
  return typeof process.env[key] === 'string' && process.env[key].trim() !== '';
}

if (isProd) {
  if (!has('DATABASE_URL')) {
    required.push('DATABASE_URL (URL del Postgres de produccion, con ?sslmode=require)');
  }

  const secret = process.env.JWT_SECRET;
  if (!has('JWT_SECRET')) {
    required.push('JWT_SECRET (>= 32 caracteres, generada al azar; nunca subirla al repo)');
  } else if (secret.length < 32) {
    required.push('JWT_SECRET (actual: ' + secret.length + ' caracteres; minimo 32)');
  }

  const rounds = process.env.BCRYPT_ROUNDS;
  if (rounds && rounds.trim() !== '') {
    const n = Number(rounds);
    if (!Number.isInteger(n) || n < 10) {
      required.push('BCRYPT_ROUNDS (debe ser un entero >= 10; default 12)');
    }
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (email && !/^\S+@\S+\.\S+$/.test(email.trim())) {
    warnings.push('ADMIN_BOOTSTRAP_EMAIL no parece un email valido');
  }
} else if (isVercel) {
  warnings.push('Vercel preview/development: las variables de produccion se validaran en el deploy de produccion');
}

if (required.length) {
  console.error('');
  console.error('ERROR: faltan variables de entorno obligatorias para produccion:');
  for (const r of required) console.error('  - ' + r);
  console.error('');
  console.error('Configuralas en: Vercel -> Project -> Settings -> Environment Variables.');
  console.error('Por seguridad, JWT_SECRET debe tener al menos 32 caracteres y nunca va en el codigo.');
  console.error('Los cambios de env vars requieren un nuevo deploy para aplicarse.');
  process.exit(1);
}

for (const w of warnings) console.log('AVISO: ' + w);
console.log('env-check: OK en ' + (isProd ? 'produccion' : 'desarrollo') + '.');
process.exit(0);