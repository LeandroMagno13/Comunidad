'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'dashboard' | 'users' | 'guilds' | 'reports';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  profile?: { profession?: string | null; country?: string | null } | null;
  guilds?: string[];
};

type ReportRow = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter?: { name: string };
  post?: { id: string; title?: string | null; content: string; author?: { name: string } } | null;
  comment?: { id: string; content: string; author?: { name: string } } | null;
};

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [guilds, setGuilds] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [msg, setMsg] = useState('');

  const [authed, setAuthed] = useState(false);

  async function loadDashboard() {
    const res = await fetch('/api/admin/dashboard');
    if (res.status === 403 || res.status === 401) {
      router.push('/');
      return;
    }
    if (res.ok) setStats(await res.json());
  }

  async function loadUsers() {
    const params = new URLSearchParams();
    if (userSearch) params.set('search', userSearch);
    if (userStatus) params.set('status', userStatus);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    }
  }

  async function loadGuilds() {
    const res = await fetch('/api/admin/guilds');
    if (res.ok) setGuilds(await res.json());
  }

  async function loadReports() {
    const res = await fetch('/api/admin/reports');
    if (res.ok) setReports(await res.json());
  }

  useEffect(() => {
    setAuthed(true);
    loadDashboard();
    loadUsers();
    loadGuilds();
    loadReports();
  }, []);

  function refreshTab(t: Tab) {
    setTab(t);
    if (t === 'dashboard') loadDashboard();
    if (t === 'users') loadUsers();
    if (t === 'guilds') loadGuilds();
    if (t === 'reports') loadReports();
  }

  async function updateUser(id: string, data: { status?: string; role?: string }) {
    setMsg('');
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    const r = await res.json();
    if (!res.ok) {
      setMsg(r.error || 'Error al actualizar');
      setTimeout(() => setMsg(''), 4000);
      return;
    }
    loadUsers();
  }

  async function moderateGuild(id: string, status: string) {
    const res = await fetch('/api/admin/guilds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) loadGuilds();
  }

  async function resolveReport(id: string, status: string, action?: string, target?: { postId?: string; commentId?: string }) {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, action, postId: target?.postId, commentId: target?.commentId }),
    });
    if (res.ok) loadReports();
  }

  if (!authed) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Verificando…</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Resumen' },
    { id: 'users', label: 'Usuarios' },
    { id: 'guilds', label: 'Gremios' },
    { id: 'reports', label: `Reportes${reports.length ? ` (${reports.length})` : ''}` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Panel del Super Admin</h1>

      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => refreshTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{msg}</div>}

      {tab === 'dashboard' && stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Usuarios', stats.stats?.userCount],
            ['Usuarios activos', stats.stats?.activeUsers],
            ['Gremios', stats.stats?.guildCount],
            ['Publicaciones', stats.stats?.postCount],
            ['Comentarios', stats.stats?.commentCount],
            ['Solicitudes de gremio pendientes', stats.stats?.pendingMemberships],
            ['Reportes pendientes', stats.stats?.pendingReports],
            ['Conversaciones', stats.stats?.conversationCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{value ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Buscar nombre o email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={userStatus}
              onChange={(e) => setUserStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="banned">Bloqueado</option>
              <option value="deactivated">Desactivado</option>
            </select>
            <button onClick={loadUsers} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Filtrar
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Último acceso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.profile?.profession || ''}{u.profile?.country ? ` · ${u.profile.country}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Usuario'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es') : 'Nunca'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={u.status}
                          onChange={(e) => updateUser(u.id, { status: e.target.value })}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          <option value="active">Activo</option>
                          <option value="deactivated">Desactivado</option>
                          <option value="banned">Bloqueado</option>
                        </select>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => updateUser(u.id, { role: 'SUPER_ADMIN' })}
                            className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            Hacer admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'guilds' && (
        <div className="mt-6 space-y-3">
          {guilds.length === 0 ? (
            <p className="text-sm text-gray-500">Sin gremios.</p>
          ) : (
            guilds.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                <div>
                  <p className="font-medium text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500">
                    {g._count?.members} miembros · {g._count?.posts} publicaciones · creado por {g.creator?.name || '—'}
                  </p>
                  <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    g.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {g.status}
                  </p>
                </div>
                <button
                  onClick={() => moderateGuild(g.id, g.status === 'active' ? 'archived' : 'active')}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  {g.status === 'active' ? 'Archivar' : 'Reactivar'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="mt-6 space-y-3">
          {reports.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No hay reportes pendientes.
            </p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Reporte de {r.reporter?.name || 'usuario'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleString('es')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">Motivo: {r.reason}</p>
                {r.post && (
                  <div className="mt-2 rounded-md bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">
                      Publicación de {r.post.author?.name}
                      {r.post.title ? ` · ${r.post.title}` : ''}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-700">{r.post.content}</p>
                  </div>
                )}
                {r.comment && (
                  <div className="mt-2 rounded-md bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Comentario de {r.comment.author?.name}</p>
                    <p className="mt-1 text-sm text-gray-700">{r.comment.content}</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.post && (
                    <button
                      onClick={() => resolveReport(r.id, 'reviewed', 'hidePost', { postId: r.post!.id })}
                      className="rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
                    >
                      Ocultar publicación
                    </button>
                  )}
                  {r.comment && (
                    <button
                      onClick={() => resolveReport(r.id, 'reviewed', 'hideComment', { commentId: r.comment!.id })}
                      className="rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
                    >
                      Ocultar comentario
                    </button>
                  )}
                  <button
                    onClick={() => resolveReport(r.id, 'reviewed')}
                    className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                  >
                    Revisado, sin acción
                  </button>
                  <button
                    onClick={() => resolveReport(r.id, 'dismissed')}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}