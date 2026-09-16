// ============================================================================
// MARCADO DE CONTENIDO DE PRUEBA (se ejecuta en cada build de Vercel).
//
// Contenido de prueba creado durante el desarrollo no debe formar parte de la
// historia pública (feeds RSS/Atom), aunque siga visible en la web. Este paso
// idempotente marca por título exacto los ítems conocidos como pruebas con
// excludeFromFeed=true. Aditivo y seguro: nunca borra ni oculta nada.
// ============================================================================

const { PrismaClient } = require('@prisma/client');

const TEST_POST_TITLES = ['Revision de coherencia del texto de la pagina'];
const TEST_POLL_TITLES = ['Encuesta test'];

async function main() {
  const db = new PrismaClient();

  const posts = await db.post.updateMany({
    where: { title: { in: TEST_POST_TITLES }, excludeFromFeed: false },
    data: { excludeFromFeed: true },
  });
  const polls = await db.poll.updateMany({
    where: { title: { in: TEST_POLL_TITLES }, excludeFromFeed: false },
    data: { excludeFromFeed: true },
  });

  console.log(
    `[sync-feed-exclusions] ${posts.count} publicación(es) y ${polls.count} encuesta(s) marcada(s) como contenido de prueba (fuera de la corriente pública).`,
  );
  await db.$disconnect();
}

main().catch((err) => {
  console.error('[sync-feed-exclusions] ERROR:', err);
  process.exit(1);
});