'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PollCard, { PollData } from '@/src/components/PollCard';
import PollCreateForm from '@/src/components/PollCreateForm';
import RichEditor from '@/src/components/RichEditor';
import RichText from '@/src/components/RichText';
import { htmlToText } from '@/src/lib/sanitize';

type PostItem = {
  id: string;
  title?: string | null;
  content: string;
  type: string;
  requestStatus?: string | null;
  createdAt: string;
  author: { id: string; name: string; profile?: { profession?: string | null } | null };
  guild?: { id: string; name: string } | null;
  _count?: { comments: number };
};

type ComposerType = 'update' | 'request' | 'poll';
type FeedType = 'all' | 'update' | 'request' | 'poll';
type Order = 'desc' | 'asc';

const REQUEST_LABEL: Record<string, string> = {
  open: 'Solicitud abierta',
  on_going: 'Solicitud en curso',
  completed: 'Solicitud completada',
  cancelled: 'Solicitud cancelada',
};

export default function Cartelera({
  scope,
  guildId,
}: {
  scope: 'community' | 'guild';
  guildId?: string | null;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [polls, setPolls] = useState<PollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState<ComposerType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<FeedType>('all');
  const [order, setOrder] = useState<Order>('desc');

  async function loadPosts() {
    const qs = scope === 'guild' && guildId ? `?guildId=${guildId}` : '';
    const res = await fetch(`/api/posts${qs}`);
    if (!res.ok) {
      if (scope === 'community') router.push('/login');
      return;
    }
    setPosts(await res.json());
  }

  async function loadPolls() {
    const qs = scope === 'guild' && guildId ? `?scope=guild&guildId=${guildId}` : '?scope=community';
    const res = await fetch(`/api/polls${qs}`);
    if (res.ok) setPolls(await res.json());
  }

  async function reload() {
    await Promise.all([loadPosts(), loadPolls()]);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, guildId]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!htmlToText(content).trim() || !composer || composer === 'poll') return;
    setError('');
    setSubmitting(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || null,
        content,
        guildId: scope === 'guild' ? guildId : null,
        type: composer,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || 'Error al publicar');
      return;
    }
    setTitle('');
    setContent('');
    setComposer(null);
    await reload();
  }

  function openComposer(t: ComposerType) {
    setComposer((c) => (c === t ? null : t));
    setError('');
  }

  const feed: ({ kind: 'post'; data: PostItem } | { kind: 'poll'; data: PollData })[] = [
    ...posts.map((p) => ({ kind: 'post' as const, data: p })),
    ...polls.map((p) => ({ kind: 'poll' as const, data: p })),
  ]
    .filter((item) => {
      if (filterType === 'all') return true;
      if (filterType === 'poll') return item.kind === 'poll';
      return item.kind === 'post' && item.data.type === filterType;
    })
    .sort((a, b) => {
      const ta = new Date(a.data.createdAt).getTime();
      const tb = new Date(b.data.createdAt).getTime();
      return order === 'desc' ? tb - ta : ta - tb;
    });

  const composerButtons: { type: ComposerType; label: string; activeClass: string }[] = [
    { type: 'update', label: 'Información', activeClass: 'bg-blue-600 text-white' },
    { type: 'request', label: 'Solicitud comunitaria', activeClass: 'bg-amber-500 text-white' },
    { type: 'poll', label: 'Encuesta', activeClass: 'bg-violet-600 text-white' },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {composerButtons.map((b) => (
          <button
            key={b.type}
            type="button"
            onClick={() => openComposer(b.type)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              composer === b.type
                ? b.activeClass
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {composer && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          {composer === 'poll' ? (
            <>
              <PollCreateForm
                scope={scope}
                guildId={guildId}
                onCreated={async () => {
                  setComposer(null);
                  await reload();
                }}
              />
            </>
          ) : (
            <form onSubmit={createPost}>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium"
                placeholder="Título (opcional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <div className="mt-2">
                <RichEditor onChange={setContent} />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                Formato enriquecido con controles: titulares, negritas, listas, citas y enlaces. Sin escribir código.
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposer(null);
                    setError('');
                  }}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !htmlToText(content).trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Publicando…' : 'Publicar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { value: 'all', label: 'Todos' },
              { value: 'update', label: 'Información' },
              { value: 'request', label: 'Solicitudes' },
              { value: 'poll', label: 'Encuestas' },
            ] as { value: FeedType; label: string }[]
          ).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterType(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filterType === f.value
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Ordenar:</span>
          <button
            type="button"
            onClick={() => setOrder('desc')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              order === 'desc'
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Más nuevos
          </button>
          <button
            type="button"
            onClick={() => setOrder('asc')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              order === 'asc'
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Más antiguos
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="px-1 py-4 text-center text-sm text-gray-500">Cargando cartelera…</p>
        ) : feed.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            {posts.length === 0 && polls.length === 0
              ? 'Aún no hay contenido en esta cartelera. ¡Publicá el primero con los botones de arriba!'
              : 'No hay contenido que coincida con este filtro.'}
          </p>
        ) : (
          feed.map((item) =>
            item.kind === 'post' ? (
              <Link
                key={`post-${item.data.id}`}
                href={`/community/${item.data.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {item.data.type === 'request' ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.data.requestStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : item.data.requestStatus === 'on_going'
                            ? 'bg-blue-100 text-blue-700'
                            : item.data.requestStatus === 'cancelled'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {REQUEST_LABEL[item.data.requestStatus || 'open'] || item.data.requestStatus}
                      </span>
                    ) : (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                        Informativa
                      </span>
                    )}
                    <span className="font-medium text-gray-900">{item.data.author.name}</span>
                    {item.data.author.profile?.profession && (
                      <span className="text-gray-500">· {item.data.author.profile.profession}</span>
                    )}
                    {scope === 'community' && item.data.guild && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {item.data.guild.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(item.data.createdAt).toLocaleString('es', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {item.data.title && <h2 className="mt-2 text-lg font-semibold text-gray-900">{item.data.title}</h2>}
                <RichText html={item.data.content} clamp />
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="text-blue-600 hover:underline">
                    {item.data._count?.comments || 0} comentarios · ver publicación completa →
                  </span>
                </div>
              </Link>
            ) : (
              <div key={`poll-${item.data.id}`}>
                <PollCard poll={item.data} onChanged={reload} />
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}