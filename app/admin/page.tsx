'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'dashboard' | 'users' | 'guilds' | 'reports' | 'content' | 'economy';

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
  economy: 'Economía CU',
};

const LIBERATION_DISCLAIMER =
  'Esta estimación no determina el valor monetario de las CU ni representa una participación sobre el patrimonio. Es un dato experimental de percepción colectiva.';

const PHASE_LABEL: Record<string, string> = {
  expansion: 'Expansión',
  neutral: 'Neutral',
  contraction: 'Contracción',
};

function phaseLabel(phase?: string): string {
  return phase ? PHASE_LABEL[phase] || phase : '—';
}

function phaseColor(phase?: string): string {
  if (phase === 'expansion') return 'text-amber-700';
  if (phase === 'contraction') return 'text-green-700';
  return '';
}

function Sparkline({ data, width = 600, height = 160, color = '#6366f1' }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / span) * (height - 12) - 6).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxWidth: width }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

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

  const [eco, setEco] = useState<any>(null);
  const [ecoConfig, setEcoConfig] = useState<any>({});
  const [basketForm, setBasketForm] = useState<any>({});
  const [simForm, setSimForm] = useState({
    users: '100',
    initialCu: '20',
    emittedPerCycle: '10',
    consumedPerCycle: '8',
    demandGrowthPerCycle: '0',
    shockCycle: '0',
    shockAmount: '0',
    userGrowthPerCycle: '0',
    startObserved: '100',
    setPoint: '100',
    kp: '0.5',
    ki: '0.1',
    kd: '0.05',
    outputMin: '-100',
    outputMax: '100',
    expansionGain: '1',
    contractionGain: '1',
    maxEmissionPerCycle: '1000',
    cycles: '20',
  });

  const SIM_PRESETS: Record<string, { label: string; [k: string]: string }> = {
    A: {
      label: 'A · Equilibrio',
      users: '100', initialCu: '20', emittedPerCycle: '10', consumedPerCycle: '8',
      demandGrowthPerCycle: '0', shockCycle: '0', shockAmount: '0', userGrowthPerCycle: '0',
      startObserved: '100', setPoint: '100', kp: '0.5', ki: '0.1', kd: '0.05',
      expansionGain: '1', contractionGain: '1', cycles: '20',
    },
    B: {
      label: 'B · Shock de demanda',
      users: '100', initialCu: '20', emittedPerCycle: '10', consumedPerCycle: '8',
      demandGrowthPerCycle: '0', shockCycle: '2', shockAmount: '100', userGrowthPerCycle: '0',
      startObserved: '100', setPoint: '100', kp: '0.5', ki: '0.1', kd: '0.05',
      expansionGain: '1', contractionGain: '1', cycles: '20',
    },
    C: {
      label: 'C · Crecimiento',
      users: '100', initialCu: '20', emittedPerCycle: '10', consumedPerCycle: '8',
      demandGrowthPerCycle: '3', shockCycle: '0', shockAmount: '0', userGrowthPerCycle: '10',
      startObserved: '100', setPoint: '100', kp: '0.5', ki: '0.1', kd: '0.05',
      expansionGain: '1', contractionGain: '1', cycles: '25',
    },
    D: {
      label: 'D · Exceso de CU',
      users: '100', initialCu: '20', emittedPerCycle: '20', consumedPerCycle: '8',
      demandGrowthPerCycle: '0', shockCycle: '0', shockAmount: '0', userGrowthPerCycle: '0',
      startObserved: '100', setPoint: '100', kp: '0.5', ki: '0.1', kd: '0.05',
      expansionGain: '0', contractionGain: '1', cycles: '30',
    },
    E: {
      label: 'E · Escasez de CU',
      users: '100', initialCu: '20', emittedPerCycle: '2', consumedPerCycle: '8',
      demandGrowthPerCycle: '0', shockCycle: '0', shockAmount: '0', userGrowthPerCycle: '0',
      startObserved: '100', setPoint: '100', kp: '0.5', ki: '0.1', kd: '0.05',
      expansionGain: '1', contractionGain: '0', cycles: '30',
    },
  };
  const [sim, setSim] = useState<{ params: any; cycles: any[] } | null>(null);
  const [adjustTarget, setAdjustTarget] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  async function runAdjust() {
    const delta = Number(adjustAmount);
    if (!adjustTarget) return notify('Elegí un usuario');
    if (!Number.isInteger(delta) || delta === 0) return notify('El monto debe ser un entero distinto de cero');
    if (!adjustReason.trim()) return notify('El motivo es obligatorio');
    const res = await fetch('/api/cu/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adjustTarget, amount: delta, reason: adjustReason.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Error al aplicar el ajuste');
      return;
    }
    notify(`Ajuste aplicado: +${delta} CU -> saldo ${data.balance}`, true);
    setAdjustTarget('');
    setAdjustAmount('');
    setAdjustReason('');
    loadEconomy();
  }

  async function loadEconomy() {
    const res = await fetch('/api/cu/metrics');
    if (!res.ok) return;
    const data = await res.json();
    setEco(data);
    setEcoConfig({
      kp: data.config?.kp,
      ki: data.config?.ki,
      kd: data.config?.kd,
      outputMin: data.config?.outputMin,
      outputMax: data.config?.outputMax,
      periodDays: data.config?.periodDays,
      milestoneCu: data.config?.milestoneCu,
      newUserGrantEnabled: data.config?.newUserGrantEnabled,
      newUserGrantCu: data.config?.newUserGrantCu,
      newUserSensitivity: data.config?.newUserSensitivity,
      expansionGain: data.config?.expansionGain,
      contractionGain: data.config?.contractionGain,
      reserveShare: data.config?.reserveShare,
      newUserShare: data.config?.newUserShare,
      historicalShare: data.config?.historicalShare,
      maxEmissionPerCycle: data.config?.maxEmissionPerCycle,
      adjustmentEnabled: data.config?.adjustmentEnabled,
      adjustmentMode: data.config?.adjustmentMode,
      adjustmentCap: data.config?.adjustmentCap,
      enabled: data.config?.enabled,
    });
    setBasketForm({
      name: data.basket?.name,
      description: data.basket?.description || '',
      targetCu: data.basket?.targetCu,
      observedCu: data.basket?.observedCu,
      observedMethod: data.basket?.observedMethod || 'manual',
      periodDays: data.basket?.periodDays,
      items: data.basket?.items || [],
    });
  }

  async function saveEcoConfig(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/cu/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kp: Number(ecoConfig.kp),
        ki: Number(ecoConfig.ki),
        kd: Number(ecoConfig.kd),
        outputMin: Number(ecoConfig.outputMin),
        outputMax: Number(ecoConfig.outputMax),
        periodDays: Number(ecoConfig.periodDays),
        milestoneCu: Number(ecoConfig.milestoneCu),
        newUserGrantEnabled: Boolean(ecoConfig.newUserGrantEnabled),
        newUserGrantCu: Number(ecoConfig.newUserGrantCu),
        newUserSensitivity: Number(ecoConfig.newUserSensitivity),
        expansionGain: Number(ecoConfig.expansionGain),
        contractionGain: Number(ecoConfig.contractionGain),
        reserveShare: Number(ecoConfig.reserveShare),
        newUserShare: Number(ecoConfig.newUserShare),
        historicalShare: Number(ecoConfig.historicalShare),
        maxEmissionPerCycle: Number(ecoConfig.maxEmissionPerCycle),
        adjustmentEnabled: Boolean(ecoConfig.adjustmentEnabled),
        adjustmentMode: ecoConfig.adjustmentMode,
        adjustmentCap: Number(ecoConfig.adjustmentCap),
        enabled: Boolean(ecoConfig.enabled),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Error al guardar la configuración');
      return;
    }
    notify('Configuración del controlador guardada', true);
    loadEconomy();
  }

  async function saveBasket(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/cu/basket', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: basketForm.name,
        description: basketForm.description,
        targetCu: Number(basketForm.targetCu),
        observedCu: Number(basketForm.observedCu),
        periodDays: Number(basketForm.periodDays),
        items: (basketForm.items || []).map((it: any) => ({
          name: it.name,
          weight: Number(it.weight),
          description: it.description || '',
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Error al guardar la canasta');
      return;
    }
    notify('Canasta actualizada', true);
    loadEconomy();
  }

  async function runSim(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/cu/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users: Number(simForm.users),
        initialCu: Number(simForm.initialCu),
        emittedPerCycle: Number(simForm.emittedPerCycle),
        consumedPerCycle: Number(simForm.consumedPerCycle),
        demandGrowthPerCycle: Number(simForm.demandGrowthPerCycle),
        shockCycle: Number(simForm.shockCycle),
        shockAmount: Number(simForm.shockAmount),
        userGrowthPerCycle: Number(simForm.userGrowthPerCycle),
        startObserved: Number(simForm.startObserved),
        setPoint: Number(simForm.setPoint),
        kp: Number(simForm.kp),
        ki: Number(simForm.ki),
        kd: Number(simForm.kd),
        outputMin: Number(simForm.outputMin),
        outputMax: Number(simForm.outputMax),
        expansionGain: Number(simForm.expansionGain),
        contractionGain: Number(simForm.contractionGain),
        maxEmissionPerCycle: Number(simForm.maxEmissionPerCycle),
        cycles: Number(simForm.cycles),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || 'Error al simular');
      return;
    }
    setSim(data);
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
      loadEconomy();
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
    if (t === 'economy') loadEconomy();
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
    meRole === 'MODERATOR' ? ['reports', 'content'] : ['dashboard', 'users', 'guilds', 'reports', 'content', 'economy'];

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

      {tab === 'economy' && canManageUsers && (
        <div className="mt-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-900">
              ¿Qué estamos experimentando? — Economía de CU (modelo de control)
            </p>
            <div className="mt-2 grid gap-4 text-xs text-amber-800 lg:grid-cols-2">
              <div>
                <p className="font-semibold">Idea</p>
                <p className="mt-1">
                  Las CU son una unidad interna de participación / "stamina" de la comunidad. NO son
                  dinero, no tienen conversión monetaria y no representan patrimonio. Son una capa
                  separada del patrimonio real.
                </p>
                <p className="mt-2 font-semibold">Ritmo</p>
                <p className="mt-1">
                  MEDICIÓN → COMPARAR → CORREGIR → VOLVER A MEDIR. La canasta representativa actúa
                  como 'sensor': comparamos su costo observado contra un set point y corregimos la
                  OFERTA relativa, no el valor de las personas ni de las CU.
                </p>
              </div>
              <div>
                <p className="font-semibold">Tubería de decisión</p>
                <p className="mt-1 font-mono text-[11px] leading-relaxed">
                  MEDICIÓN → PID → SEÑAL DE CORRECCIÓN → POLÍTICA DE OFERTA → EMISIÓN / NO EMISIÓN /
                  AJUSTE → NUEVA MEDICIÓN
                </p>
                <p className="mt-2">
                  Ojo: la señal del PID <span className="font-semibold">no es una emisión</span>.
                  La política de oferta decide si emite, no emite o ajusta; y con qué tasa. Los
                  ajustes sobre saldos históricos son auditables y están separados del PID.
                </p>
              </div>
            </div>
            <button onClick={loadEconomy} className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700">
              Medir ahora
            </button>
            <a
              href="/ensayo-de-stress"
              className="ml-2 mt-3 inline-block rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Ver informe completo: Ensayo de Stress →
            </a>
          </div>

          {!eco ? (
            <p className="mt-6 text-sm text-gray-500">Medí el estado de la economía de CU para ver las métricas.</p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Oferta total (CU emitidas netas)" value={`${eco.supply} CU`} />
                <Stat label="Set point (canasta)" value={`${eco.setPoint} CU`} tip="CU objetivo para adquirir / reproducir la canasta representativa en equilibrio." />
                <Stat label="Canasta observada" value={`${eco.observed} CU`} tip="Valor del 'sensor': costo observado de la canasta según su metodología (manual | auto)." />
                <Stat label="Error (obs − set point)" value={eco.error} accent={eco.error > 0 ? 'text-amber-700' : 'text-green-700'} tip="Cuánto se aleja el sensor del set point. Error positivo = la canasta está 'cara' (escasez relativa de CU); negativo = 'barata' (abundancia relativa)." />
                <Stat label="Señal de corrección (PID)" value={eco.pidOutput} accent={eco.pidOutput >= 0 ? 'text-amber-700' : 'text-green-700'} tip="Salida del controlador. NO es una emisión: indica la dirección y magnitud de la corrección sugerida de oferta." />
                <Stat label="Política de oferta (fase)" value={phaseLabel(eco.policy?.phase)} accent={phaseColor(eco.policy?.phase)} tip="Decisión de la capa SupplyPolicy según la señal del PID: expansión / neutralidad / contracción." />
                <Stat label="Señal → Emisión sugerida" value={`${eco.policy?.emission ?? '—'} CU/ciclo`} tip="Emisión que resultaría de aplicar la política (expansión/contracción) sobre la emisión base." />
                <Stat label="Velocidad (periodo)" value={eco.velocity} tip="Actividad = (transferidas + consumidas) / oferta. Es una métrica de actividad, NO un precio del CU." />
                <Stat label="Transferidas (periodo)" value={`${eco.transferredPeriod} CU`} />
                <Stat label="Consumidas (periodo)" value={`${eco.consumedPeriod} CU`} />
                <Stat label="Cuentas" value={eco.accounts} />
                <Stat label="Usuarios activos" value={eco.activeUsers} />
                <Stat label="Saldo promedio" value={Math.round(eco.avgBalance)} />
                <Stat label="Saldo mediano" value={eco.medianBalance} />
                <Stat label="Concentración (10% mayor)" value={eco.topDecileShare != null ? `${Math.round(eco.topDecileShare * 100)}%` : '—'} />
                <Stat label="Emisión acumulada" value={`${eco.issuedTotal} CU`} />
                <Stat label="Consumo acumulado" value={`${eco.consumedTotal} CU`} />
                <Stat label="Control PID" value={eco.controllerEnabled ? 'activo' : 'inactivo'} />
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Patrimonio real + economías personales</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Esta capa es independiente de la economía de CU. Las CU no representan pesos, activos,
                  acciones ni promesas de pago. Los recursos reales de cada persona y sus finanzas
                  personales están fuera de este modelo.
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-900">Estimación de 'liberación' (percepción colectiva, NO monetaria)</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {LIBERATION_DISCLAIMER} Esta estimación es un dato experimental de percepción y{' '}
                  <span className="font-semibold">no alimenta al PID</span>: no modifica emisiones ni saldos.
                </p>
                <div className="mt-2 grid gap-3 text-sm sm:grid-cols-3">
                  <Stat label="Promedio" value={eco.liberation?.mean != null ? Math.round(eco.liberation.mean) + ' CU' : '—'} />
                  <Stat label="Mediana" value={eco.liberation?.median != null ? Math.round(eco.liberation.median) + ' CU' : '—'} />
                  <Stat label="Ponderado (por saldo)" value={eco.liberation?.weighted != null ? Math.round(eco.liberation.weighted) + ' CU' : '—'} />
                </div>
                <p className="mt-2 text-[11px] text-gray-400">{eco.liberation?.reporters || 0} usuarios dejaron su estimación.</p>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <form onSubmit={saveEcoConfig} className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900">Controlador PID</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Produce la SEÑAL de corrección a partir del error (canasta observada − set point).
                    No emite CU por sí mismo.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <Field label="Kp" value={ecoConfig.kp} onChange={(v) => setEcoConfig({ ...ecoConfig, kp: v })} step="0.05" />
                    <Field label="Ki" value={ecoConfig.ki} onChange={(v) => setEcoConfig({ ...ecoConfig, ki: v })} step="0.05" />
                    <Field label="Kd" value={ecoConfig.kd} onChange={(v) => setEcoConfig({ ...ecoConfig, kd: v })} step="0.05" />
                    <Field label="Salida mín." value={ecoConfig.outputMin} onChange={(v) => setEcoConfig({ ...ecoConfig, outputMin: v })} />
                    <Field label="Salida máx." value={ecoConfig.outputMax} onChange={(v) => setEcoConfig({ ...ecoConfig, outputMax: v })} />
                    <Field label="Periodo (días)" value={ecoConfig.periodDays} onChange={(v) => setEcoConfig({ ...ecoConfig, periodDays: v })} />
                    <Field label="Meta de saldo (aviso)" value={ecoConfig.milestoneCu} onChange={(v) => setEcoConfig({ ...ecoConfig, milestoneCu: v })} tip="Solo genera una notificación al alcanzar el saldo. No es un objetivo económico obligatorio." />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-gray-700">
                      CU de bienvenida (base en equilibrio)
                      <input
                        type="number"
                        min={0}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        value={ecoConfig.newUserGrantCu}
                        onChange={(e) => setEcoConfig({ ...ecoConfig, newUserGrantCu: e.target.value })}
                      />
                    </label>
                    <label className="block text-xs font-medium text-gray-700" title="Cómo responde la asignación a nuevos usuarios ante escasez/abundancia relativa (0 = constante, 1 = proporcional al error).">
                      Sensibilidad nuevos usuarios
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        value={ecoConfig.newUserSensitivity}
                        onChange={(e) => setEcoConfig({ ...ecoConfig, newUserSensitivity: e.target.value })}
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    La asignación a nuevos usuarios es DINÁMICA: depende del estado del sistema + señal
                    del PID. En equilibrio = cantidad base; ante escasez relativa se reduce (puede
                    llegar a 0); ante abundancia puede aumentar. No es una emisión fija.
                  </p>
                  <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                    <p className="text-xs font-semibold text-indigo-900">Política de oferta (SupplyPolicy)</p>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <Field label="Gan. expansión" value={ecoConfig.expansionGain} onChange={(v) => setEcoConfig({ ...ecoConfig, expansionGain: v })} step="0.05" tip="0 = la política no emite automáticamente ante señal positiva." />
                      <Field label="Gan. contracción" value={ecoConfig.contractionGain} onChange={(v) => setEcoConfig({ ...ecoConfig, contractionGain: v })} step="0.05" tip="0 = la política no reduce automáticamente la emisión ante señal negativa." />
                      <Field label="Máx emisión/ciclo" value={ecoConfig.maxEmissionPerCycle} onChange={(v) => setEcoConfig({ ...ecoConfig, maxEmissionPerCycle: v })} tip="Tope anti-shock de emisión por ciclo para evitar sobre-corrección." />
                      <Field label="Reserva" value={ecoConfig.reserveShare} onChange={(v) => setEcoConfig({ ...ecoConfig, reserveShare: v })} step="0.05" tip="Proporción de la emisión destinada a reserva." />
                      <Field label="Nuevos usuarios" value={ecoConfig.newUserShare} onChange={(v) => setEcoConfig({ ...ecoConfig, newUserShare: v })} step="0.05" tip="Proporción de la emisión destinada a nuevos usuarios." />
                      <Field label="Históricos" value={ecoConfig.historicalShare} onChange={(v) => setEcoConfig({ ...ecoConfig, historicalShare: v })} step="0.05" tip="Proporción destinada a usuarios históricos (sujeta a ajuste auditable)." />
                    </div>
                    <p className="mt-1 text-[11px] text-indigo-700">
                      Las proporciones deberían sumar 1 (o menos). Son hipótesis experimentales:
                      parametrizables, nunca reglas definitivas.
                    </p>
                  </div>
                  <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
                    <p className="text-xs font-semibold text-purple-900">Ajustes históricos (separados del PID, auditablemente)</p>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-purple-800">
                        <input
                          type="checkbox"
                          checked={Boolean(ecoConfig.adjustmentEnabled)}
                          onChange={(e) => setEcoConfig({ ...ecoConfig, adjustmentEnabled: e.target.checked })}
                        />
                        Habilitar ajustes
                      </label>
                      <select
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                        value={ecoConfig.adjustmentMode || 'none'}
                        onChange={(e) => setEcoConfig({ ...ecoConfig, adjustmentMode: e.target.value })}
                      >
                        <option value="none">none</option>
                        <option value="flat">flat (fijo)</option>
                        <option value="proportional">proportional</option>
                        <option value="manual">manual</option>
                      </select>
                      <Field label="Tope por ajuste (0 = sin tope)" value={ecoConfig.adjustmentCap} onChange={(v) => setEcoConfig({ ...ecoConfig, adjustmentCap: v })} />
                    </div>
                    <p className="mt-1 text-[11px] text-purple-700">
                      Deshabilitado por defecto: no hay reglas de confiscación automática. Cuando se
                      use, cada ajuste queda registrado en CuTransaction y debe responder a una política
                      acordada, nunca a un capricho del controlador.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-1.5 text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(ecoConfig.enabled)}
                        onChange={(e) => setEcoConfig({ ...ecoConfig, enabled: e.target.checked })}
                      />
                      Control de oferta activo
                    </label>
                    <label className="flex items-center gap-1.5 text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(ecoConfig.newUserGrantEnabled)}
                        onChange={(e) => setEcoConfig({ ...ecoConfig, newUserGrantEnabled: e.target.checked })}
                      />
                      Dar CU de bienvenida (dinámica)
                    </label>
                  </div>
                  <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Guardar configuración
                  </button>
                </form>

                <form onSubmit={saveBasket} className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-900">Canasta representativa (sensor / set point)</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    La canasta es una hipótesis de medición, NO una fórmula definitiva: el valor
                    observado depende de componentes, pesos y una metodología parametrizable.
                  </p>
                  <div className="mt-3 space-y-2">
                    <Field label="Nombre" value={basketForm.name} onChange={(v) => setBasketForm({ ...basketForm, name: v })} />
                    <label className="block text-xs font-medium text-gray-700">
                      Descripción
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                        rows={2}
                        value={basketForm.description || ''}
                        onChange={(e) => setBasketForm({ ...basketForm, description: e.target.value })}
                      />
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Set point (target)" value={basketForm.targetCu} onChange={(v) => setBasketForm({ ...basketForm, targetCu: v })} tip="CU objetivo para la canasta en equilibrio." />
                      <Field label="Observado" value={basketForm.observedCu} onChange={(v) => setBasketForm({ ...basketForm, observedCu: v })} tip="Lectura actual del sensor. En el futuro se podrá calcular con 'auto'." />
                      <label className="block text-xs font-medium text-gray-700">
                        Metodología (sensor)
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                          value={basketForm.observedMethod || 'manual'}
                          onChange={(e) => setBasketForm({ ...basketForm, observedMethod: e.target.value })}
                        >
                          <option value="manual">manual</option>
                          <option value="auto">auto (TODO)</option>
                        </select>
                      </label>
                    </div>
                    <Field label="Periodo (días)" value={basketForm.periodDays} onChange={(v) => setBasketForm({ ...basketForm, periodDays: v })} />
                  </div>
                  <h4 className="mt-4 text-xs font-semibold text-gray-700">Ítems (componente · peso)</h4>
                  <ul className="mt-1 space-y-1">
                    {(basketForm.items || []).map((it: any, i: number) => (
                      <li key={i} className="flex gap-1.5 text-sm">
                        <input
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1"
                          value={it.name}
                          onChange={(e) =>
                            setBasketForm({
                              ...basketForm,
                              items: basketForm.items.map((x: any, xi: number) => (xi === i ? { ...x, name: e.target.value } : x)),
                            })
                          }
                        />
                        <input
                          type="number"
                          step="0.1"
                          min={0.1}
                          className="w-20 rounded-md border border-gray-300 px-2 py-1"
                          value={it.weight}
                          onChange={(e) =>
                            setBasketForm({
                              ...basketForm,
                              items: basketForm.items.map((x: any, xi: number) => (xi === i ? { ...x, weight: Number(e.target.value) } : x)),
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                  <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    Guardar canasta
                  </button>
                </form>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">Ajuste histórico (manual, auditado)</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Toda modificación de un saldo queda registrada en CuTransaction (type='adjustment')
                  con el actor y el motivo. Solo funciona si los ajustes están habilitados en la
                  configuración.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <label className="block text-xs font-medium text-gray-700">
                    Usuario
                    <select
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={adjustTarget || ''}
                      onChange={(e) => setAdjustTarget(e.target.value)}
                    >
                      <option value="">Seleccionar…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} · {u.email}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-gray-700">
                    CU (±, entero)
                    <input
                      type="number"
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-gray-700 sm:col-span-2">
                    Motivo (obligatorio)
                    <input
                      className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                  </label>
                </div>
                <button onClick={runAdjust} className="mt-3 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                  Aplicar ajuste
                </button>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">Simulador (pizarra, no toca la economía real)</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Estudio ciclo a ciclo de la tubería MEDICIÓN → PID → POLÍTICA → EMISIÓN. Permite
                  observar expansión/contracción de oferta y abundancia/escasez relativa ante shocks
                  de demanda o crecimiento, antes de tocar las políticas.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(SIM_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
                      onClick={() => {
                        const next = { ...simForm };
                        for (const [k, v] of Object.entries(preset)) {
                          if (k !== 'label') (next as any)[k] = v;
                        }
                        setSimForm(next);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <form onSubmit={runSim} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  <Field label="Usuarios" value={simForm.users} onChange={(v) => setSimForm({ ...simForm, users: v })} />
                  <Field label="CU inicial/usu" value={simForm.initialCu} onChange={(v) => setSimForm({ ...simForm, initialCu: v })} />
                  <Field label="Emisión/ciclo (base)" value={simForm.emittedPerCycle} onChange={(v) => setSimForm({ ...simForm, emittedPerCycle: v })} tip="Emisión base que la política ajusta con la señal." />
                  <Field label="Consumo/ciclo" value={simForm.consumedPerCycle} onChange={(v) => setSimForm({ ...simForm, consumedPerCycle: v })} />
                  <Field label="Crec. demanda %/ciclo" value={simForm.demandGrowthPerCycle} onChange={(v) => setSimForm({ ...simForm, demandGrowthPerCycle: v })} />
                  <Field label="Ciclo shock" value={simForm.shockCycle} onChange={(v) => setSimForm({ ...simForm, shockCycle: v })} tip="0 = sin shock de demanda." />
                  <Field label="Shock demanda %" value={simForm.shockAmount} onChange={(v) => setSimForm({ ...simForm, shockAmount: v })} />
                  <Field label="Nuevos usuarios/ciclo" value={simForm.userGrowthPerCycle} onChange={(v) => setSimForm({ ...simForm, userGrowthPerCycle: v })} />
                  <Field label="Obs. inicial" value={simForm.startObserved} onChange={(v) => setSimForm({ ...simForm, startObserved: v })} />
                  <Field label="Set point" value={simForm.setPoint} onChange={(v) => setSimForm({ ...simForm, setPoint: v })} />
                  <Field label="Kp" value={simForm.kp} onChange={(v) => setSimForm({ ...simForm, kp: v })} step="0.05" />
                  <Field label="Ki" value={simForm.ki} onChange={(v) => setSimForm({ ...simForm, ki: v })} step="0.05" />
                  <Field label="Kd" value={simForm.kd} onChange={(v) => setSimForm({ ...simForm, kd: v })} step="0.05" />
                  <Field label="Gan. expansión" value={simForm.expansionGain} onChange={(v) => setSimForm({ ...simForm, expansionGain: v })} step="0.05" />
                  <Field label="Gan. contracción" value={simForm.contractionGain} onChange={(v) => setSimForm({ ...simForm, contractionGain: v })} step="0.05" />
                  <Field label="Máx emisión/ciclo" value={simForm.maxEmissionPerCycle} onChange={(v) => setSimForm({ ...simForm, maxEmissionPerCycle: v })} />
                  <Field label="Ciclos" value={simForm.cycles} onChange={(v) => setSimForm({ ...simForm, cycles: v })} />
                </form>
                <button className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  Correr simulación
                </button>

                {sim && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500">
                      Señal PID ≠ emisión: la columna 'Señal PID' es la salida del controlador; la
                      columna 'Emisión' es la decisión de la política de oferta.
                    </p>
                    <div className="mt-2 grid gap-6 lg:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700">CU totales por ciclo</h4>
                        <Sparkline data={sim.cycles.map((c: any) => c.supply)} color="#6366f1" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700">Canasta observada vs set point</h4>
                        <Sparkline data={sim.cycles.map((c: any) => c.observed)} color="#f59e0b" />
                        <p className="mt-1 text-[11px] text-gray-400">Set point: {sim.params.setPoint}</p>
                      </div>
                    </div>
                    <div className="mt-3 max-h-80 overflow-auto rounded-md border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Ciclo</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">CU totales</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Canasta obs.</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Error</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Señal PID</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Fase</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Emisión</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Consumo</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">Usuarios</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sim.cycles.map((c: any) => (
                            <tr key={c.cycle}>
                              <td className="px-3 py-1.5">{c.cycle}</td>
                              <td className="px-3 py-1.5">{c.supply}</td>
                              <td className="px-3 py-1.5">{c.observed}</td>
                              <td className="px-3 py-1.5">{c.error}</td>
                              <td className={`px-3 py-1.5 ${c.pidOutput >= 0 ? 'text-amber-700' : 'text-green-700'}`}>{c.pidOutput}</td>
                              <td className="px-3 py-1.5">{c.phase}</td>
                              <td className="px-3 py-1.5">{c.emission}</td>
                              <td className="px-3 py-1.5">{c.consumption}</td>
                              <td className="px-3 py-1.5">{c.users}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, tip }: { label: string; value: any; accent?: string; tip?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4" title={tip}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold text-gray-900 ${accent || ''}`}>{value ?? '—'}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
  tip,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  step?: string;
  tip?: string;
}) {
  return (
    <label className="block text-xs font-medium text-gray-700" title={tip}>
      {label}
      <input
        type="number"
        step={step || '1'}
        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}