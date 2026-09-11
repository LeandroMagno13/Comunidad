// Seed idempotente: asigna 20 CU iniciales al usuario "leandro hubert".
// Se ejecuta en el build de Vercel (vercel-build). No falla si el usuario no existe.
// Idempotencia: busca un CuTransaction con refType='seed' y refId fijo antes de emitir.
// Uso desde build: node scripts/assign-initial-cu.js
const { PrismaClient } = require('@prisma/client');

const REF_TYPE = 'seed';
const REF_ID = 'leandro-hubert-initial-20-cu';
const TARGET_NAME = 'leandro hubert';
const AMOUNT = 20;

async function main() {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      where: { name: { equals: TARGET_NAME, mode: 'insensitive' } },
    });
    if (!user) {
      console.log(`[seed-cu] Usuario "${TARGET_NAME}" no encontrado. No se emiten CU. (idempotente)`);
      return;
    }

    const existing = await prisma.cuTransaction.findFirst({
      where: { refType: REF_TYPE, refId: REF_ID },
    });
    if (existing) {
      console.log(
        `[seed-cu] Emisión inicial ya registrada para ${user.name} (${user.email}, tx ${existing.id}). Nada que hacer.`
      );
      return;
    }

    const account = await prisma.cuAccount.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const [updated, tx] = await prisma.$transaction([
      prisma.cuAccount.update({
        where: { id: account.id },
        data: { balance: { increment: AMOUNT }, totalIssued: { increment: AMOUNT } },
      }),
      prisma.cuTransaction.create({
        data: {
          type: 'issued',
          amount: AMOUNT,
          toUserId: user.id,
          description: `Asignación inicial experimental de ${AMOUNT} CU (bienvenida configurada).`,
          refType: REF_TYPE,
          refId: REF_ID,
        },
      }),
    ]);

    console.log(
      `[seed-cu] OK: ${AMOUNT} CU asignadas a ${user.name} (${user.email}). Saldo: ${updated.balance}. Tx: ${tx.id}`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[seed-cu] ERROR:', err);
  process.exit(1);
});