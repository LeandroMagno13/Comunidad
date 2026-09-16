'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export type PollData = {
  id: string;
  title: string;
  description?: string | null;
  scope: string;
  guildId?: string | null;
  postId?: string | null;
  isClosed: boolean;
  status?: string;
  closesAt?: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  post?: { id: string; title?: string | null; type?: string | null; status?: string | null } | null;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  myOptionId?: string | null;
  canVote: boolean;
  canManage: boolean;
  registro: { id: string; userId: string; userName: string; optionId: string; optionText: string; createdAt: string }[];
};

export default function PollCard({
  poll,
  onChanged,
}: {
  poll: PollData;
  onChanged: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showRegistro, setShowRegistro] = useState(false);

  useEffect(() => {
    // Cierre temporal: cuando vence el tiempo, recargar para que quede cerrada.
    if (!poll.closesAt || poll.isClosed) return;
    const ms = new Date(poll.closesAt).getTime() - Date.now();
    if (ms <= 0) {
      onChanged();
      return;
    }
    const t = setTimeout(onChanged, ms);
    return () => clearTimeout(t);
  }, [poll.closesAt, poll.isClosed, onChanged]);

  async function vote(optionId: string) {
    setError('');
    setBusy(true);
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', pollId: poll.id, optionId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'No se pudo registrar el voto');
      return;
    }
    onChanged();
  }

  async function close() {
    setError('');
    setBusy(true);
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', pollId: poll.id }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'No se pudo cerrar');
      return;
    }
    onChanged();
  }

  const closed = poll.isClosed;
  const closesAt = poll.closesAt ? new Date(poll.closesAt) : null;
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);
  const isGuild = poll.scope === 'guild';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isGuild ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              Encuesta del gremio
            </span>
          ) : (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
              Encuesta de la comunidad
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              closed ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
            }`}
          >
            {closed ? 'Cerrada' : 'Abierta'}
          </span>
          {!closed && closesAt && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Cierra el {new Date(closesAt).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(poll.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <h3 className="mt-2 font-semibold text-gray-900">{poll.title}</h3>
      {poll.description && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{poll.description}</p>}
      <p className="mt-1 text-xs text-gray-500">
        Por {poll.createdBy.name} · {poll.totalVotes} voto{poll.totalVotes === 1 ? '' : 's'}
      </p>

      {poll.post && (
        <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
            Publicación referida
          </span>
          <Link href={`/community/${poll.post.id}`} className="block text-sm font-medium text-blue-700 hover:underline">
            {poll.post.title || 'Ver publicación'} →
          </Link>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {poll.options.map((opt) => {
          const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const mine = poll.myOptionId === opt.id;
          return (
            <div key={opt.id} className="rounded-md border border-gray-200 p-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className={`font-medium ${mine ? 'text-blue-700' : 'text-gray-800'}`}>
                  {opt.text} {mine && <span className="text-[10px] text-blue-600">(tu voto)</span>}
                </span>
                {!poll.canVote && poll.totalVotes > 0 && <span className="text-xs text-gray-500">{opt.votes} · {pct}%</span>}
              </div>
              {!poll.canVote && poll.totalVotes > 0 && (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.round((opt.votes / maxVotes) * 100)}%` }}
                  />
                </div>
              )}
              {poll.canVote && (
                <button
                  onClick={() => vote(opt.id)}
                  disabled={busy}
                  className="mt-1 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Votar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <button onClick={() => setShowRegistro((s) => !s)} className="text-gray-500 hover:text-gray-700 hover:underline">
          {showRegistro ? 'Ocultar trazabilidad' : `Ver trazabilidad (${poll.registro.length})`}
        </button>
        {poll.canManage && !closed && (
          <button onClick={close} disabled={busy} className="text-amber-600 hover:underline disabled:opacity-50">
            Cerrar encuesta
          </button>
        )}
      </div>

      {showRegistro && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
          {poll.registro.length === 0 ? (
            <p className="text-xs text-gray-500">Aún no hay votos registrados.</p>
          ) : (
            <ul className="space-y-1">
              {poll.registro.map((r) => (
                <li key={r.id} className="text-xs text-gray-600">
                  <span className="font-medium">{r.userName}</span> → “{r.optionText}” ·{' '}
                  {new Date(r.createdAt).toLocaleString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}