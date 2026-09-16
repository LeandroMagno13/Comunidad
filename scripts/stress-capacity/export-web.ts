// ============================================================================
// RONDA C+D — export-web: publica el ensayo de stress de capacidad en
// public/stress-test/ y ARCHIVA el ensayo de RONDA A bajo public/stress-test/
// ronda-a/ (referencia historica, no se borra). Determinado por el EVRIDENCE
// en evidence/stress-test-capacity/ (debe ejecutarse main.ts antes).
// Ejecutar: npx tsx scripts/stress-capacity/main.ts && npx tsx scripts/stress-capacity/export-web.ts
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';

const EVID = 'evidence/stress-test-capacity';
const EVID_A = 'evidence/stress-test';
const PUB = 'public/stress-test';
const ARCHIVE = `${PUB}/ronda-a`;

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDir(src: string, dst: string) {
  ensureDir(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function moveIntoArchive() {
  // Idempotente: restaura el archivo de RONDA A desde su evidencia versionada
  // (evidence/stress-test AREA, byte-idéntica a git). No mueve lo que haya en
  // PUB: si export-web se ejecuta dos veces, vin repite el archivo y la
  // evidencia de RONDA A NO se corrompe por la publicación de la C+D.
  if (!fs.existsSync(EVID_A)) {
    console.warn(`Aviso: ${EVID_A} no existe, no se puede archivar RONDA A`);
    return;
  }
  ensureDir(ARCHIVE);
  for (const it of ['REPORTE.md', '_auto-summary.md', 'charts', 'data']) {
    const src = path.join(EVID_A, it);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(ARCHIVE, it);
    if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(src, dst, { recursive: true, force: true });
  }
  // nota de archivo
  const note = [
    '# Ensayo de stress — RONDA A (archivado)',
    '',
    'Este directorio conserva el ensayo de stress original (RONDA A, PID legacy) tal como se publico',
    'en /ensayo-de-stress antes de la publicacion de la RONDA C+D (capacidad real + urgencia).',
    'Se mantiene intacto como referencia historica y trazabilidad; ya NO alimenta la pagina',
    '/ensayo-de-stress (que desde esta ronda consume presentation.json de la C+D).',
    '',
    '- REPORTE.md: informe original RONDA A (hallazgos y metodologia).',
    '- data/presentation.json, data/summary.csv, data/montecarlo.json, data/trace-E*.csv: datos.',
    '- charts/: paneles E01..E16 y overlays del ensayo original.',
    '',
    'El ensayo vigente vive en /ensayo-de-stress (pagina) y en public/stress-test/* (informe C+D).',
    '',
  ].join('\n');
  fs.writeFileSync(`${ARCHIVE}/LEEME-ARCHIVO.md`, note, 'utf8');
  console.log(`RONDA A archivada en ${ARCHIVE}`);
}

function publish() {
  ensureDir(PUB);
  ensureDir(`${PUB}/charts`);
  ensureDir(`${PUB}/data`);
  copyDir(`${EVID}/charts`, `${PUB}/charts`);
  copyDir(`${EVID}/data`, `${PUB}/data`);
  if (fs.existsSync(`${EVID}/REPORTE.md`)) fs.copyFileSync(`${EVID}/REPORTE.md`, `${PUB}/REPORTE.md`);
  if (fs.existsSync(`${EVID}/_auto-summary.md`)) fs.copyFileSync(`${EVID}/_auto-summary.md`, `${PUB}/_auto-summary.md`);
  console.log(`RONDA C+D publicada en ${PUB}`);
}

moveIntoArchive();
publish();