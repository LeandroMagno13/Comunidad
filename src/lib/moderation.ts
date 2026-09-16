import { db } from '@/src/lib/db';

// Moderación de publicaciones con cascada a encuestas vinculadas.
// Cuando una publicación deja de estar visible, sus encuestas referidas
// (postId) también dejan de mostrarse; al restaurarla, vuelven a ser
// visibles. Así una encuesta jamás mantiene vivo el acceso a contenido
// moderado.

export function pollStatusFromPost(status: string): string {
  // 'deleted' no se expone en la API pública de moderación; si llegara,
  // las encuestas vinculadas quedan igualmente fuera de la vista.
  return status === 'visible'
    ? 'visible'
    : status === 'hidden' || status === 'blocked'
    ? status
    : 'hidden';
}

// Actualiza una publicación y en el mismo paso sincroniza el estado de sus
// encuestas vinculadas. Devuelve null si la publicación no existe.
export async function setPostStatus(id: string, status: string) {
  let post;
  try {
    post = await db.post.update({ where: { id }, data: { status } });
  } catch {
    return null;
  }
  const pollStatus = pollStatusFromPost(status);
  await db.poll.updateMany({
    where: { postId: id, status: { not: pollStatus } },
    data: { status: pollStatus },
  });
  return post;
}