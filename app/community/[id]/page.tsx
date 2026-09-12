'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type CommentItem = {
  id: string;
  content: string;
  author: { id: string; name: string };
  createdAt: string;
  replies?: CommentItem[];
};

type PostDetail = {
  id: string;
  title?: string | null;
  content: string;
  type: string;
  requestStatus?: string | null;
  author: { id: string; name: string; cuAccount?: { balance: number } | null };
  fulfilledBy?: { id: string; name: string } | null;
  guild?: { id: string; name: string } | null;
  createdAt: string;
  comments: CommentItem[];
};

const REQUEST_LABEL: Record<string, string> = {
  open: 'Solicitud abierta',
  on_going: 'Solicitud en curso',
  completed: 'Solicitud completada',
  cancelled: 'Solicitud cancelada',
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comment, setComment] = useState('');
  const [replyId, setReplyId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportMsg, setReportMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionMsgOk, setActionMsgOk] = useState(false);

  async function load() {
    const res = await fetch(`/api/posts/${params?.id}`);
    if (!res.ok) {
      router.push('/community');
      return;
    }
    setPost(await res.json());
  }

  useEffect(() => {
    load();
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentUserId(d?.user?.id || ''));
  }, [params]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    const res = await fetch(`/api/posts/${params?.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment }),
    });
    if (res.ok) {
      setComment('');
      await load();
    }
  }

  async function addReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !replyId) return;
    const res = await fetch(`/api/posts/${params?.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reply, parentId: replyId }),
    });
    if (res.ok) {
      setReply('');
      setReplyId(null);
      await load();
    }
  }

  async function report(e: React.FormEvent) {
    e.preventDefault();
    if (!reportReason.trim()) return;
    setReporting(true);
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: params?.id, reason: reportReason }),
    });
    setReportMsg(res.ok ? 'Reporte enviado. Gracias por cuidar la comunidad.' : 'Error al reportar');
    setReportReason('');
    setReporting(false);
    setReportMsg('');
    setTimeout(() => setReportMsg(''), 4000);
  }

  async function requestAction(action: string) {
    setActionMsg('');
    const res = await fetch(`/api/posts/${params?.id}/offer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionMsgOk(false);
      setActionMsg(data.error || 'Error al procesar la solicitud');
      return;
    }
    setActionMsgOk(true);
    setActionMsg(action === 'accept' ? 'Te anotaste para realizar la tarea.' : action === 'complete' ? '¡Participación confirmada! Gracias por contribuir.' : 'Solicitud actualizada.');
    await load();
  }

  if (!post) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  function renderComments(comments: CommentItem[], depth = 0) {
    return comments.map((c) => (
      <div key={c.id} className={depth > 0 ? 'mt-2 border-l-2 border-gray-100 pl-3' : 'mt-3'}>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-900">{c.author.name}</span>
          <span className="text-gray-400">
            {new Date(c.createdAt).toLocaleString('es', { day: '2-digit', month: 'short' })}
          </span>
          <button onClick={() => setReplyId(replyId === c.id ? null : c.id)} className="text-blue-600 hover:underline">
            Responder
          </button>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
        {replyId === c.id && (
          <form onSubmit={addReply} className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              placeholder="Responder…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={4000}
            />
            <button className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
              Enviar
            </button>
          </form>
        )}
        {c.replies && c.replies.length > 0 && renderComments(c.replies, depth + 1)}
      </div>
    ));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/community" className="text-sm text-blue-600 hover:underline">
        ← Comunidad
      </Link>

      <article className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-900">{post.author.name}</span>
          {post.type === 'request' && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                post.requestStatus === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : post.requestStatus === 'on_going'
                  ? 'bg-blue-100 text-blue-700'
                  : post.requestStatus === 'cancelled'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {REQUEST_LABEL[post.requestStatus || 'open'] || post.requestStatus}
            </span>
          )}
          {post.type !== 'request' && (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
              Informativa
            </span>
          )}
          {post.guild && (
            <Link href={`/guilds/${post.guild.id}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              {post.guild.name}
            </Link>
          )}
          <span className="text-xs text-gray-400">
            {new Date(post.createdAt).toLocaleString('es', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        {post.title && <h1 className="mt-2 text-xl font-bold text-gray-900">{post.title}</h1>}
        <p className="mt-3 whitespace-pre-wrap text-gray-800">{post.content}</p>

        {post.type === 'request' && (
          <div className="mt-4 rounded-md bg-indigo-50 p-4">
            <p className="text-sm font-semibold text-indigo-900">Solicitud comunitaria · participación</p>
            <p className="mt-1 text-xs text-indigo-700">
              Pedido de ayuda entre usuarios de la comunidad. Cuando el autor confirme el trabajo,
              la contribución queda registrada como participación. La CU no se transfiere: no es un
              medio de pago.
            </p>

            {(post.requestStatus === 'open' || post.requestStatus === 'on_going') && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {currentUserId === post.author.id ? (
                  <>
                    {post.requestStatus === 'on_going' && post.fulfilledBy && (
                      <>
                        <span className="text-xs font-medium text-indigo-700">
                          Se encarga: {post.fulfilledBy.name}
                        </span>
                        <button
                          onClick={() => requestAction('complete')}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Confirmar tarea y registrar participación
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => requestAction('cancel')}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar solicitud
                    </button>
                  </>
                ) : post.requestStatus === 'open' ? (
                  <button
                    onClick={() => requestAction('accept')}
                    className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                  >
                    Me hago cargo de la tarea
                  </button>
                ) : post.fulfilledBy?.id === currentUserId ? (
                  <button
                    onClick={() => requestAction('cancel')}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Dejar de encargarme
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">Ya hay alguien encargándose de esta tarea.</span>
                )}
              </div>
            )}

            {actionMsg && (
              <p className={`mt-2 text-sm ${actionMsgOk ? 'text-green-700' : 'text-red-700'}`}>{actionMsg}</p>
            )}

            {post.requestStatus === 'completed' && post.fulfilledBy && (
              <p className="mt-2 text-sm text-green-700">
                Tarea completada. Participación de {post.fulfilledBy.name} registrada.
              </p>
            )}
          </div>
        )}
      </article>

      <form onSubmit={report} className="mt-2 flex items-center gap-2">
        <input
          className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs"
          placeholder="Motivo para reportar esta publicación (opcional, sólo si es necesaria moderación)"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          maxLength={1000}
        />
        <button
          disabled={reporting || !reportReason.trim()}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Reportar
        </button>
      </form>
      {reportMsg && <p className="mt-2 text-sm text-green-700">{reportMsg}</p>}

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Comentarios</h2>
        <form onSubmit={addComment} className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Escribe un comentario…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={4000}
          />
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Comentar
          </button>
        </form>

        <div className="mt-4">
          {post.comments.length === 0 ? (
            <p className="text-sm text-gray-500">Sin comentarios todavía.</p>
          ) : (
            renderComments(post.comments)
          )}
        </div>
      </div>
    </div>
  );
}