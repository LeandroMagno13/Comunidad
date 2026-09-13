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
  author: { id: string; name: string; profile?: { profession?: string | null } | null; cuAccount?: { balance: number } | null };
  guild?: { id: string; name: string } | null;
  guildId?: string | null;
  _count?: { comments: number };
};

const REQUEST_LABEL = {
  open: 'Solicitud abierta',
  on_going: 'Solicitud en curso',
  completed: 'Solicitud completada',
  cancelled: 'Solicitud cancelada',
} as Record<string, string>;

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('update');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [polls, setPolls] = useState<PollData[]>([]);

  async function load() {
    const res = await fetch('/api/posts');
    if (!res.ok) {
      router.push('/login');
      return;
    }
    setPosts(await res.json());
  }

  async function loadPolls() {
    const res = await fetch('/api/polls?scope=community');
    if (res.ok) setPolls(await res.json());
  }

  useEffect(() => {
    load();
    loadPolls();
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!htmlToText(content).trim()) return;
    setError('');
    setLoading(true);
    // LEGACY: cuOffer eliminado. La CU NO es medio de pago (§Lee.txt).
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || null,
        content,
        guildId: null,
        type: postType,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Error al publicar');
      setLoading(false);
      return;
    }
    setTitle('');
    setContent('');
    setPostType('update');
    setLoading(false);
    await load();
  }

  if (posts === null) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Comunidad</h1>
      <p className="mt-1 text-sm text-gray-600">
        Muro de la comunidad. Publicá tu participación: información para compartir o solicitudes
        comunitarias para contribuir. Cuida el contenido: está sujeto a moderación.
      </p>

      <form onSubmit={createPost} className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-gray-200 p-0.5">
            <button
              type="button"
              onClick={() => setPostType('update')}
              className={`rounded px-3 py-1 text-xs font-medium ${
                postType === 'update' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Informativa
            </button>
            <button
              type="button"
              onClick={() => setPostType('request')}
              className={`rounded px-3 py-1 text-xs font-medium ${
                postType === 'request' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Solicitud comunitaria
            </button>
          </div>
        </div>
        <input
          className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium"
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <RichEditor onChange={setContent} />
        <p className="mt-1 text-[10px] text-gray-400">
          Formato enriquecido con controles: titulares, negritas, listas, citas y enlaces. Sin escribir código.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={loading || !htmlToText(content).trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Encuestas de la comunidad</h2>
        <p className="mt-1 text-xs text-gray-500">
          La comunidad decide por votación con trazabilidad: cada voto queda registrado y consultable, y puede
          enlazarse a la publicación que le da contexto.
        </p>
        <div className="mt-3 space-y-4">
          <PollCreateForm scope="community" onCreated={loadPolls} />
          {polls.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Aún no hay encuestas comunitarias.
            </p>
          ) : (
            polls.map((poll) => <PollCard key={poll.id} poll={poll} onChanged={loadPolls} />)
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Aún no hay publicaciones. ¡Sé el primero en contribuir!
          </p>
        ) : (
          posts.map((post) => {
            const isRequest = post.type === 'request';
            return (
              <Link key={post.id} href={`/community/${post.id}`} className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{post.author.name}</span>
                    {post.author.profile?.profession && (
                      <span className="text-gray-500">· {post.author.profile.profession}</span>
                    )}
                    {isRequest && (
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
                    {!isRequest && (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                        Informativa
                      </span>
                    )}
                    {post.guild && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        {post.guild.name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleString('es', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {post.title && <h2 className="mt-2 text-lg font-semibold text-gray-900">{post.title}</h2>}
                <RichText html={post.content} clamp />
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="text-blue-600 hover:underline">
                    {post._count?.comments || 0} comentarios · ver publicación completa →
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}