'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PostItem = {
  id: string;
  title?: string | null;
  content: string;
  status: string;
  createdAt: string;
  author: { id: string; name: string; profile?: { profession?: string | null } | null };
  guild?: { id: string; name: string } | null;
  guildId?: string | null;
  _count?: { comments: number };
};

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostItem[] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/posts');
    if (!res.ok) {
      router.push('/login');
      return;
    }
    setPosts(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setLoading(true);
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || null,
        content,
        guildId: null,
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
        Muro de la comunidad. Publica tu participación, ideas o preguntas. Cuida el contenido: está sujeto a moderación.
      </p>

      <form onSubmit={createPost} className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <input
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium"
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <textarea
          className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
          placeholder="¿Qué quieres compartir con la comunidad?"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={10000}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Aún no hay publicaciones. ¡Sé el primero en contribuir!
          </p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">{post.author.name}</span>
                  {post.author.profile?.profession && (
                    <span className="text-gray-500">· {post.author.profile.profession}</span>
                  )}
                  {post.guild && (
                    <Link href={`/guilds/${post.guild.id}`} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {post.guild.name}
                    </Link>
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
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{post.content}</p>
              <div className="mt-3 text-xs text-gray-500">
                <Link href={`/community/${post.id}`} className="text-blue-600 hover:underline">
                  {post._count?.comments || 0} comentarios
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}