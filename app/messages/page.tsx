'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Conversation = {
  id: string;
  otherUser: { id: string; name: string; avatarUrl?: string | null } | null;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  updatedAt: string;
};

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  async function load() {
    const res = await fetch('/api/conversations');
    if (!res.ok) {
      router.push('/login');
      return;
    }
    setConversations(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function searchUsers(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    const res = await fetch(`/api/users?search=${encodeURIComponent(search.trim())}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
      setShowSearch(true);
    }
  }

  async function startConversation(userId: string) {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: userId }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/messages/${data.id}`);
    }
  }

  if (conversations === null) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
      </div>

      <form onSubmit={searchUsers} className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Buscar usuario por nombre o profesión…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Buscar
        </button>
      </form>

      {showSearch && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">Sin resultados</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.profile?.profession || u.email}</p>
                  </div>
                  <button
                    onClick={() => startConversation(u.id)}
                    className="rounded-md border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    Escribir
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setShowSearch(false)} className="mt-2 text-xs text-gray-500 hover:underline">
            Cerrar
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {conversations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Aún no tienes conversaciones. Busca un miembro y escribe el primer mensaje.
          </p>
        ) : (
          conversations.map((c) => (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{c.otherUser?.name || 'Usuario'}</p>
                {c.lastMessage && (
                  <p className="text-xs text-gray-400">
                    {new Date(c.lastMessage.createdAt).toLocaleString('es', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
              {c.lastMessage && (
                <p className="mt-1 truncate text-sm text-gray-600">{c.lastMessage.content}</p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}