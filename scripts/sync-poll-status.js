// ============================================================================
// SYNCRONIZACIÓN DE ENCUESTAS VINCULADAS (se ejecuta en cada build de Vercel).
//
// Aditivo e idempotente: ninguna encuesta referenciada por una publicación que
// no esté visible (hidden/blocked/deleted) puede quedar como visible. Cubre
// los datos PREEXISTENTES creados antes de que existiera el campo Poll.status:
// el ocultamiento en cascada corre en cada evento de moderación, pero los
// registros viejos necesitan una pasada al desplegar. Con esto, la columna
// status refleja la misma realidad que el filtro de lectura.
// ============================================================================

const { PrismaClient } = require('@prisma/client');

async function main() {
  const db = new PrismaClient();
  const linked = await db.poll.findMany({
    where: { postId: { not: null } },
    select: {
      id: true,
      status: true,
      post: { select: { status: true } },
    },
  });

  let changed = 0;
  for (const poll of linked) {
    const want = poll.post?.status === 'visible' ? 'visible' : 'hidden';
    if (poll.status !== want) {
      await db.poll.update({ where: { id: poll.id }, data: { status: want } });
      changed++;
    }
  }

  console.log(
    `[sync-poll-status] ${changed} encuesta(s) sincronizada(s) con su publicación vinculada.`,
  );
  await db.$disconnect();
}

main().catch((err) => {
  console.error('[sync-poll-status] ERROR:', err);
  process.exit(1);
});