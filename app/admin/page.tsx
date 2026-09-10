'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'dashboard' | 'users' | 'guilds' | 'reports' | 'content';

type Me = { user?: { id?: string; role?: string } | null };

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

type ContentPost = {
  id: string;
  title?: string | null;
  content: string;
  status: string;
  createdAt: string;
  author?: { name: string } | null;
  _count?: { comments?: number; reports?: number };
};

type ContentComment = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  author?: { name: string } | null;
  post?: { id: string; title?: string | null } | null;
  _count?: { reports?: number };
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MODERATOR: 'Moderador',
  USER: 'Usuario',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  banned: 'Bloqueado',
  deactivated: 'Desactivado',
  visible: 'Visible',
  hidden: 'Oculto',
  blocked: 'Bloqueado',
};

const TAB_LABEL: Record<Tab, string> = {
  dashboard: 'Resumen',
  users: 'Usuarios',
  guilds: 'Gremios',
  reports: 'Reportes',
  content: 'Contenido',
};

export default function AdminPanel() {
  const router = useRouter();
  const [meId, setMeId] = useState<string | null>(null);
  const [meRole, setMeRole] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [userRole, setUserRole] = useState('');
  const [guilds, setGuilds] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [reportStatus, setReportStatus] = useState('');
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);
  const [contentComments, setContentComments] = useState<ContentComment[]>([]);
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [authed, setAuthed] = useState(false);

  function notify(text: string, ok = false) {
    if (ok) {
      setOkMsg(text);
      setMsg('');
    } else {
      setMsg(text);
      setOkMsg('');
    }
    setTimeout(() => {
      setMsg('');
      setOkMsg('');
    }, 4000);
  }

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
    if (userRole) params.set('role', userRole);
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
    const params = new URLSearchParams();
    if (reportStatus) params.set('status', reportStatus);
    const res = await fetch(`/api/admin/reports?${params}`);
    if (res.ok) setReports(await res.json());
  }

  async function loadContent() {
    const res = await fetch('/api/admin/content');
    if (res.ok) {
      const data = await res.json();
      setContentPosts(data.posts || []);
      setContentComments(data.comments || []);
    }
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Me | null) => {
        setMeId(data?.user?.id ?? null);
        setMeRole(data?.user?.role ?? null);
        setAuthed(true);
      })
      .catch(() => setAuthed(true));
  }, []);

  // Carga inicial según el rol
  useEffect(() => {
    if (!authed || !meRole) return;
    const isStaff = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(meRole);
    if (!isStaff) {
      router.push('/');
      return;
    }
    if (meRole === 'SUPER_ADMIN' || meRole === 'ADMIN') {
      setTab('dashboard');
      loadDashboard();
      loadUsers();
      loadGuilds();
      loadReports();
      loadContent();
    } else {
      setTab('reports');
      loadReports();
      loadContent();
    }
  }, [authed, meRole]);

  function refreshTab(t: Tab) {
    setTab(t);
    if (t === 'dashboard') loadDashboard();
    if (t === 'users') loadUsers();
    if (t === 'guilds') loadGuilds();
    if (t === 'reports') loadReports();
    if (t === 'content') loadContent();
  }

  async function updateUser(id: string, data: { status?: string; role?: string }) {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    const r = await res.json();
    if (!res.ok) {
      notify(r.error || 'Error al actualizar');
      return;
    }
    notify('Usuario actualizado correctamente', true);
    loadUsers();
  }

  async function moderateGuild(id: string, status: string) {
    const res = await fetch('/api/admin/guilds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      notify('Gremio actualizado correctamente', true);
      loadGuilds();
    }
  }

  async function resolveReport(id: string, status: string, action?: string, target?: { postId?: string; commentId?: string }) {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, action, postId: target?.postId, commentId: target?.commentId }),
    });
    if (res.ok) {
      notify(status === 'dismissed' ? 'Reporte descartado' : 'Reporte resuelto', true);
      loadReports();
    }
  }

  async function moderateContent(type: 'post' | 'comment', id: string, status: string) {
    if (status === 'hidden' && !window.confirm('¿Ocultar este contenido a la comunidad?')) return;
    const res = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, status }),
    });
    if (!res.ok) {
      const r = await res.json();
      notify(r.error || 'Error al moderar');
      return;
    }
    notify(status === 'hidden' ? 'Contenido oculto' : 'Contenido restaurado', true);
    // refrescar ambos para que reportes de contenido oculto desaparezcan de la vista pública
    if (type === 'post') {
      setContentPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );
    } else {
      setContentComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c)),
      );
    }
  }

  if (!authed || !meRole) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Verificando…</div>;
  }

  const canManageUsers = meRole === 'SUPER_ADMIN' || meRole === 'ADMIN';
  const tabs: Tab[] =
    meRole === 'MODERATOR' ? ['reports', 'content'] : ['dashboard', 'users', 'guilds', 'reports', 'content'];

  const canAssignRoles: string[] =
    meRole === 'SUPER_ADMIN'
      ? ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']
      : ['USER', 'MODERATOR'];

  // Un Admin no puede tocar filas con rol igual o superior; nadie puede editarse a sí mismo
  function userEditable(u: UserRow) {
    if (u.id === meId) return false;
    if (meRole === 'SUPER_ADMIN') return true;
    if (meRole === 'ADMIN') return u.role === 'USER' || u.role === 'MODERATOR';
    return false;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {meRole === 'SUPER_ADMIN' ? 'Super Admin' : meRole === 'ADMIN' ? 'Admin' : 'Moderador'}
        </span>
      </div>

      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => refreshTab(t)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              tab === t ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {TAB_LABEL[t]}
            {t === 'reports' && reports.some((r) => r.status === 'pending') && (
              <span className="ml-1 rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">
                {reports.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {msg && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{msg}</div>}
      {okMsg && <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{okMsg}</div>}

      {tab === 'dashboard' && stats && (
        <div className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900">Últimas publicaciones</h2>
            <div className="mt-3 space-y-2">
              {(stats.recentPosts || []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {p.title || p.content.slice(0, 60)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.author?.name} · {new Date(p.createdAt).toLocaleString('es')} ·{' '}
                      {p._count?.comments || 0} comentarios
                    </p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    p.status === 'visible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {STATUS_LABEL[p.status] || p.status}
                  </span>
                </div>
              ))}
              {!stats.recentPosts?.length && (
                <p className="text-sm text-gray-500">Sin publicaciones todavía.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && canManageUsers && (
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
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="USER">Usuario</option>
              <option value="MODERATOR">Moderador</option>
              {(meRole === 'SUPER_ADMIN') && <option value="ADMIN">Admin</option>}
              {(meRole === 'SUPER_ADMIN') && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
            <button onClick={loadUsers} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Filtrar
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {userTotal} usuarios encontrados.
          </p>

          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Último acceso</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Gremios</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const editable = userEditable(u);
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-400">{u.profile?.profession || ''}{u.profile?.country ? ` · ${u.profile.country}` : ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'ADMIN'
                            ? 'bg-blue-100 text-blue-700'
                            : u.role === 'MODERATOR'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{STATUS_LABEL[u.status] || u.status}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es') : 'Nunca'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.guilds?.length ? u.guilds.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {editable ? (
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
                            <select
                              value={u.role}
                              onChange={(e) => updateUser(u.id, { role: e.target.value })}
                              className="rounded border px-2 py-1 text-xs"
                            >
                              {canAssignRoles.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABEL[r] || r}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {u.id === meId
                              ? 'No puedes editarte a ti mismo'
                              : meRole === 'ADMIN' && (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
                              ? 'Solo el Super Admin puede editarlo'
                              : 'Este rol no puede editarse'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'guilds' && canManageUsers && (
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
        <div className="mt-6">
          <p className="text-sm text-gray-600">
            Cola de moderación: resolvé los reportes de publicaciones y comentarios. Ocultar quita el
            contenido de la vista de la comunidad manteniendo el registro.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisados</option>
              <option value="dismissed">Descartados</option>
            </select>
            <button onClick={loadReports} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Filtrar
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No hay reportes que coincidan con el filtro.
              </p>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      Reporte de {r.reporter?.name || 'usuario'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : r.status === 'reviewed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.status === 'pending' ? 'Pendiente' : r.status === 'reviewed' ? 'Revisado' : 'Descartado'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleString('es')}
                      </span>
                    </div>
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
                  {r.status === 'pending' && (
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
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className="mt-6">
          <p className="text-sm text-gray-600">
            Moderación directa de publicaciones y comentarios. Ocultar retira el contenido de la
            comunidad sin eliminarlo.
          </p>

          <h2 className="mt-6 text-lg font-bold text-gray-900">
            Publicaciones ({contentPosts.length})
          </h2>
          <div className="mt-3 space-y-2">
            {contentPosts.length === 0 ? (
              <p className="text-sm text-gray-500">Sin publicaciones.</p>
            ) : (
              contentPosts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {p.title || p.content.slice(0, 60)}
                    </p>
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {p.author?.name} · {new Date(p.createdAt).toLocaleString('es')}
                      {p._count?.reports ? ` · ${p._count.reports} reporte(s)` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      p.status === 'visible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                    {p.status === 'visible' ? (
                      <button
                        onClick={() => moderateContent('post', p.id, 'hidden')}
                        className="rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
                      >
                        Ocultar
                      </button>
                    ) : (
                      <button
                        onClick={() => moderateContent('post', p.id, 'visible')}
                        className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                      >
                        Mostrar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <h2 className="mt-8 text-lg font-bold text-gray-900">
            Comentarios ({contentComments.length})
          </h2>
          <div className="mt-3 space-y-2">
            {contentComments.length === 0 ? (
              <p className="text-sm text-gray-500">Sin comentarios.</p>
            ) : (
              contentComments.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm text-gray-800">{c.content}</p>
                    <p className="text-xs text-gray-500">
                      {c.author?.name}
                      {c.post?.title ? ` · en "${c.post.title}"` : ' · en una publicación'}
                      {c._count?.reports ? ` · ${c._count.reports} reporte(s)` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      c.status === 'visible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {STATUS_LABEL[c.status] || c.status}
                    </span>
                    {c.status === 'visible' ? (
                      <button
                        onClick={() => moderateContent('comment', c.id, 'hidden')}
                        className="rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200"
                      >
                        Ocultar
                      </button>
                    ) : (
                      <button
                        onClick={() => moderateContent('comment', c.id, 'visible')}
                        className="rounded-md bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200"
                      >
                        Mostrar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}