'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'];

type Me = {
  user?: {
    name: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
};

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
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export default function Navbar() {
  const [user, setUser] = useState<Me['user'] | null | undefined>(undefined);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: NotifData | null) => {
        setNotifs(data?.notifications ?? []);
        setUnread(data?.unread ?? 0);
      })
      .catch(() => {});
  }, [user, pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    const now = new Date().toISOString();
    setNotifs((list) => list.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnread(0);
  }

  async function openNotif(n: NotifItem) {
    if (!n.readAt) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      setUnread((u) => Math.max(0, u - 1));
      setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    }
    setNotifOpen(false);
    router.push(n.link ?? '/notifications');
  }

  const navItems = user
    ? [
        { href: '/', label: 'Inicio' },
        { href: '/community', label: 'Comunidad' },
        { href: '/guilds', label: 'Gremios' },
        { href: '/principios', label: 'Principios' },
        { href: '/manual', label: 'Manual' },
        { href: '/bot', label: 'Bot' },
        { href: '/messages', label: 'Mensajes' },
        { href: '/profile', label: 'Perfil' },
      ]
    : [
        { href: '/', label: 'Inicio' },
        { href: '/principios', label: 'Principios' },
        { href: '/manual', label: 'Manual' },
        { href: '/bot', label: 'Bot' },
      ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          Comunidad <span className="text-sky-600">Post Singularidad</span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname?.startsWith(item.href)
                  ? 'text-sm font-medium text-sky-600'
                  : 'text-sm text-slate-600 hover:text-slate-900'
              }
            >
              {item.label}
            </Link>
          ))}

          {user?.role && NAV_STAFF_ROLES.includes(user.role) && (
            <Link
              href="/admin"
              className={
                pathname?.startsWith('/admin')
                  ? 'text-sm font-medium text-sky-600'
                  : 'text-sm text-slate-600 hover:text-slate-900'
              }
            >
              Admin
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex items-center rounded-full p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Notificaciones"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
                    <button onClick={markAllRead} className="text-xs text-sky-600 hover:underline">
                      Marcar todas leídas
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-400">No tenés notificaciones.</p>
                    ) : (
                      <ul className="space-y-1">
                        {notifs.map((n) => (
                          <li key={n.id}>
                            <button
                              onClick={() => openNotif(n)}
                              className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className={`text-sm ${n.readAt ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
                                  {!n.readAt && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-sky-500 align-middle" />}
                                  {n.title}
                                </span>
                                <span className="shrink-0 text-[11px] text-slate-400">{fmtFecha(n.createdAt)}</span>
                              </span>
                              <span className="break-words text-xs text-slate-500">{n.content}</span>
                              {n.link && <span className="text-[11px] font-medium text-sky-600">Abrir enlace →</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button onClick={() => { setNotifOpen(false); router.push('/notifications'); }} className="text-xs font-medium text-sky-600 hover:underline">
                      Ver todas las notificaciones →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
              >
                Unirme
              </Link>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-700">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Salir
              </button>
            </div>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="flex flex-col gap-2 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-slate-700 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
            {user?.role && NAV_STAFF_ROLES.includes(user.role) && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="text-sm text-slate-700">
                Admin
              </Link>
            )}
            {user ? (
              <button onClick={logout} className="text-left text-sm text-red-600">
                Cerrar sesión ({user.name})
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-sm text-slate-700">
                  Iniciar sesión
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-sky-600">
                  Unirme
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
