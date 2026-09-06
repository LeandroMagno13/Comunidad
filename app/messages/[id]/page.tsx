'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type Message = { id: string; senderId: string; content: string; createdAt: string; readAt?: string | null };

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  async function load(conversationId: string) {
    const res = await fetch(`/api/conversations/${conversationId}`);
    if (!res.ok) {
      router.push('/messages');
      return;
    }
    const data = await res.json();
    setOtherUser(data.otherUser?.name || 'Usuario');
    setMessages(data.messages || []);
  }

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    load(id);
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCurrentUserId(d?.user?.id || ''));
  }, [params]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${params?.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft }),
    });
    if (res.ok) {
      await load(params?.id as string);
      setDraft('');
    }
    setSending(false);
  }

  if (!otherUser) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-3xl flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/messages" className="text-sm text-blue-600 hover:underline">
          ← Conversaciones
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{otherUser}</h1>
        <span className="w-20" />
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500">Envía el primer mensaje.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine ? 'rounded-br-sm bg-blue-600 text-white' : 'rounded-bl-sm bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={`mt-1 text-[10px] ${mine ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleString('es', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Escribe un mensaje…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={5000}
        />
        <button
          disabled={sending || !draft.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}