'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type NotifItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type NotifData = {
  notifications: NotifItem[];
  unread: number;
};

function fmtFecha(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => {
        if (r.status === 401) {
          router.push('/login');
          throw new Error('no-autenticado');
        }
        return r.ok ? r.json() : Promise.reject(new Error('Error del servidor'));
      })
      .then((data: NotifData) => {
        setNotifs(data.notifications ?? []);
        setLoading(false);
      })
      .catch((e) => {
        if (e?.message === 'no-autenticado') return;
        setError('No se pudieron cargar las notificaciones.');
        setLoading(false);
      });
  }, [router]);

  async function markAllRead() {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (!res.ok) return;
    const now = new Date().toISOString();
    setNotifs((list) => list.map((n) => (n.readAt ? n : { ...n, readAt: now })));
  }

  async function openNotif(n: NotifItem) {
    if (!n.readAt) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    }
    if (n.link) router.push(n.link);
  }

  const unreadCount = notifs.filter((n) => !n.readAt).length;

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? 'Cargando…'
                  : unreadCount > 0
                  ? `Tenés ${unreadCount} sin leer.`
                  : 'No tenés notificaciones sin leer.'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="rounded-lg border border-sky-600 px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-50"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          {!loading && notifs.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              Todavía no tenés notificaciones. Cuando algo te afecte —por ejemplo, una nueva versión del
              manual o una solicitud satisfecha— aparecerá acá.
            </p>
          )}

          <ul className="space-y-3">
            {notifs.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => openNotif(n)}
                  disabled={!n.link}
                  className={`w-full rounded-lg border p-4 text-left ${
                    n.readAt ? 'border-gray-200 bg-white' : 'border-sky-200 bg-sky-50'
                  } ${n.link ? 'cursor-pointer hover:border-sky-300' : 'cursor-default'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-semibold text-gray-900 ${n.readAt ? '' : 'flex items-center gap-2'}`}
                    >
                      {!n.readAt && <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />}
                      {n.title}
                    </p>
                    <p className="shrink-0 text-xs text-gray-400">{fmtFecha(n.createdAt)}</p>
                  </div>
                  {n.content && <p className="mt-1 break-words text-sm text-gray-600">{n.content}</p>}
                  {n.link && (
                    <p className="mt-2 text-xs font-medium text-sky-600">Abrir enlace →</p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm">
            <Link href="/" className="text-sky-600 hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}