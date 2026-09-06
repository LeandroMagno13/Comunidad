'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type Member = {
  id: string;
  role: string;
  status: string;
  user: { id: string; name: string; profile?: { profession?: string | null; bio?: string | null } | null };
};

type PostItem = {
  id: string;
  title?: string | null;
  content: string;
  author: { name: string };
  createdAt: string;
  _count?: { comments: number };
};

export default function GuildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params?.id as string;

  const [guild, setGuild] = useState<any | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [canModerate, setCanModerate] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postContent, setPostContent] = useState('');
  const [error, setError] = useState('');

  async function loadMembers() {
    const res = await fetch(`/api/guilds/${guildId}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members || []);
      setCanModerate(data.pendingRequestsVisible || false);
    }
  }

  async function loadPosts() {
    const res = await fetch(`/api/posts?guildId=${guildId}`);
    if (res.ok) setPosts(await res.json());
  }

  async function loadGuild() {
    const res = await fetch('/api/guilds');
    if (!res.ok) {
      router.push('/login');
      return;
    }
    const list = await res.json();
    const found = list.find((g: any) => g.id === guildId);
    setGuild(found);
  }

  useEffect(() => {
    if (!guildId) return;
    loadGuild();
    loadMembers();
    loadPosts();
  }, [guildId]);

  async function membershipAction(action: string, userId?: string) {
    const res = await fetch(`/api/guilds/${guildId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userId }),
    });
    if (res.ok) await loadMembers();
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!postContent.trim()) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: postContent, guildId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Error al publicar');
      return;
    }
    setPostContent('');
    await loadPosts();
  }

  if (!guild) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  const pending = members.filter((m) => m.status === 'pending');
  const active = members.filter((m) => m.status === 'active');
  const myStatus = guild.myMembership?.status;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/guilds" className="text-sm text-blue-600 hover:underline">
        ← Gremios
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{guild.name}</h1>
          {guild.creator && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Creado por {guild.creator.name}
            </span>
          )}
        </div>
        <p className="mt-3 text-gray-700">{guild.description}</p>
        {guild.purpose && (
          <p className="mt-2 text-xs text-gray-500">
            Modalidad de ingreso: {guild.purpose === 'open' ? 'abierta' : guild.purpose === 'closed' ? 'cerrada' : 'con aprobación del creador'}
          </p>
        )}
      </div>

      {myStatus === 'active' && (
        <>
          <form onSubmit={createPost} className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder={`Publica en ${guild.name}…`}
              rows={3}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              maxLength={10000}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end">
              <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Publicar
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {posts.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay publicaciones en este gremio.</p>
            ) : (
              posts.map((p) => (
                <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{p.author.name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleString('es', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  {p.title && <h3 className="mt-1 font-semibold text-gray-900">{p.title}</h3>}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{p.content}</p>
                  <Link href={`/community/${p.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
                    {p._count?.comments || 0} comentarios
                  </Link>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Miembros ({active.length})</h2>

        {canModerate && pending.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-medium text-amber-700">Solicitudes pendientes ({pending.length})</h3>
            <ul className="mt-2 divide-y divide-gray-100">
              {pending.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.user.profile?.profession || 'Sin profesión'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => membershipAction('approve', m.user.id)}
                      className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => membershipAction('reject', m.user.id)}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <ul className="mt-3 divide-y divide-gray-100">
          {active.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                  <p className="text-xs text-gray-500">{m.user.profile?.profession || ''}</p>
                </div>
                {m.role === 'admin' && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                    admin
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {!myStatus && (
          <button
            onClick={() => membershipAction('join')}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Unirme a este gremio
          </button>
        )}
        {myStatus === 'pending' && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            Tu solicitud está pendiente de aprobación.
          </p>
        )}
      </div>
    </div>
  );
}