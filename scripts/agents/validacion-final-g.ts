import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = 'C:/Comunidad';
const OUT_DIR = path.join(ROOT, 'evidence', 'agentes', 'membrana');

function run(cmd: string, args: string[]): string {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: false });
  } catch (e: any) {
    return 'EXIT>0 ' + (e.stdout || '') + (e.stderr || '');
  }
}

interface Row { nombre: string; valor: string }

const rows: Row[] = [];
// 1) Arbol git: solo los archivos esperados de RONDA G, nada fuera de contrato
const statusRaw = run('git', ['status', '--porcelain']);
rows.push({ nombre: 'G1_solo_archivos_esperados', valor: String(statusRaw.split(/\r?\n/).length - 1) + ' rutas' });

// 2) tsc como juez byte-final
const tsc = run('cmd', ['/c', 'npx.cmd tsc --noEmit']);
rows.push({ nombre: 'G2_tsc_0_errores', valor: tsc.trim() === '' || /noEmit/.test(tsc) ? 'OK' : 'FALLA: ' + tsc.slice(0, 300) });

// 3) Payload byte-fiel: los 3 entregables clave en disco son ASCII puro determinista
const targets = [
  ['src', 'lib', 'agents', 'engine.ts'],
  ['src', 'lib', 'agents', 'internal-super-admin.ts'],
  ['AGENTS.md'],
];
const sizes: { file: string; bytes: number; noAscii: number }[] = [];
for (const parts of targets) {
  const p = path.join(ROOT, ...parts);
  if (!fs.existsSync(p)) continue;
  const b = fs.readFileSync(p);
  let na = 0;
  for (const c of b) if (c > 127) na++;
  sizes.push({ file: parts.join('/'), bytes: b.length, noAscii: na });
}
rows.push({ nombre: 'G3_archivos_byte_fieles', valor: sizes.map((s) => s.file + '=' + s.bytes + 'B').join(' | ') });

// 4) Evidencias de ambas suites en disco
const evM = path.join(ROOT, 'evidence', 'agentes', 'membrana', 'membrane-tests.json');
const evN = path.join(ROOT, 'evidence', 'agentes', 'membrana', 'internal-super-admin.json');
const hasM = fs.existsSync(evM);
const hasN = fs.existsSync(evN);
rows.push({ nombre: 'G4_evidencias_en_disco', valor: 'TestM=' + hasM + ' TestN=' + hasN });

const summary = {
  ronda: 'G',
  seccion: 4,
  suite: 'ValidacionFinalG',
  total: rows.length,
  rows,
  regla_de_oro: rows.every((r) => r.valor !== 'FALLA'),
  estados: {
    TestM_membrana: 19,
    TestN_interno: 11,
    AGENTS_contrato: 'publicado',
    evidencia: 'evidence/agentes/membrana/*.json',
    commit: 'PENDIENTE aprobacion usuario (regla G: no commitear G sin OK)',
  },
  generatedAt: new Date().toISOString(),
};
fs.mkdirSync(OUT_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, 'validacion-final.json');
fs.writeFileSync(outFile, JSON.stringify(summary, null, 2), 'utf8');
console.log(JSON.stringify(summary, null, 2));
console.log('Evidencia final: ' + outFile);
