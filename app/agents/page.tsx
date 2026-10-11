'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/src/lib/api-client';

type AgentRow = {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  status: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  tokenPrefix: string | null;
};

const KIND_LABEL: Record<string, string> = {
  INTERNAL: 'Interno',
  EXTERNAL: 'Externo',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  blocked: 'Bloqueado',
  revoked: 'Revocado',
};

// Permisos concedibles a un agente EXTERNAL (membrana RONDA F).
// Para el bot de Telegram se necesitan READ_NOTIFICATIONS y READ_MESSAGES.
const PERMISSION_INFO: { value: string; label: string }[] = [
  { value: 'READ_PUBLIC', label: 'Leer contenido público' },
  { value: 'READ_COMMUNITY', label: 'Leer métricas de la comunidad' },
  { value: 'READ_GUILDS', label: 'Leer gremios' },
  { value: 'READ_REQUESTS', label: 'Leer solicitudes' },
  { value: 'READ_POLLS', label: 'Leer encuestas' },
  { value: 'READ_NOTIFICATIONS', label: 'Leer MIS notificaciones (bot personal)' },
  { value: 'READ_MESSAGES', label: 'Leer MIS mensajes (bot personal)' },
  { value: 'WRITE_POSTS', label: 'Publicar como yo (cuidado)' },
  { value: 'WRITE_COMMENTS', label: 'Comentar como yo (cuidado)' },
  { value: 'WRITE_REQUESTS', label: 'Crear solicitudes como yo (cuidado)' },
  { value: 'PARTICIPATE_POLLS', label: 'Votar en encuestas como yo (cuidado)' },
];

const DEFAULT_BOT_PERMS = [
  'READ_PUBLIC',
  'READ_COMMUNITY',
  'READ_POLLS',
  'READ_NOTIFICATIONS',
  'READ_MESSAGES',
];

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [perms, setPerms] = useState<string[]>(DEFAULT_BOT_PERMS);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{
    id: string;
    name: string;
    tokenValue?: string;
    tokenPrefix?: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/external/agents');
      const body = await res.json();
      if (!res.ok || body?.allowed !== true) {
        setError(body?.reason ?? 'error');
        setAgents([]);
        return;
      }
      setAgents(Array.isArray(body.data) ? body.data : []);
    } catch {
      setError('network_error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/external/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions: perms }),
      });
      const body = await res.json();
      if (!res.ok || body?.allowed !== true) {
        setError(body?.reason ?? 'error');
        return;
      }
      setCreated({
        id: body.data.id,
        name: body.data.name,
        tokenValue: body.data.token.value,
        tokenPrefix: body.data.token.prefix,
      });
      setName('');
    } catch {
      setError('network_error');
    } finally {
      setBusy(false);
      void load();
    }
  }

  async function run(id: string, action: 'revoke' | 'block' | 'activate') {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/external/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: id, action }),
      });
      const body = await res.json();
      if (!res.ok || body?.allowed !== true) {
        setError(body?.reason ?? 'error');
      }
    } catch {
      setError('network_error');
    } finally {
      setBusy(false);
      void load();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl space-y-6 px-4">
        <header className="rounded-2xl bg-slate-900 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-300">Para vos y tus bots</p>
          <h1 className="mt-2 text-3xl font-bold">Mis agentes</h1>
          <p className="mt-4 text-slate-300">
            Administrá tus agentes EXTERNAL: creá (el token se muestra una sola vez), revocá,
            bloqueá o activá. Para el bot de Telegram, mirá{' '}
            <a href="/bot#vincular" className="text-sky-300 underline underline-offset-2">
              cómo vincularlo
            </a>
            .
          </p>
        </header>

      {created?.tokenValue ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900">Credencial emitida (una única vez)</h2>
          <p className="mt-2 text-sm text-gray-700">Token (guardalo ahora; no se puede recuperar):</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-green-300">{created.tokenValue}</pre>
          <p className="mt-2 text-sm text-gray-700">Prefijo de identificación: <code className="bg-gray-100 px-1 rounded">{created.tokenPrefix}</code></p>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Crear agente</h2>
        <p className="text-sm text-gray-500 mb-4">Elegí un nombre y solo los permisos que necesita.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700">
              Nombre (mínimo 3 letras)
            </label>
            <input
              id="agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. Telegram"
              minLength={3}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">Permisos (solo los que necesita)</legend>
            <div className="space-y-2">
              {PERMISSION_INFO.map((p) => (
                <label key={p.value} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={perms.includes(p.value)}
                    onChange={(e) =>
                      setPerms((list) =>
                        e.target.checked ? [...list, p.value] : list.filter((x) => x !== p.value)
                      )
                    }
                  />
                  <span>
                    {p.label} <code className="bg-gray-100 px-1 rounded text-xs">{p.value}</code>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={busy || name.trim().length < 3}
            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? 'Creando…' : 'Crear agente y emitir token'}
          </button>
          {name.trim().length < 3 ? (
            <p className="text-xs text-gray-500">Escribí un nombre de al menos 3 letras para activar el botón.</p>
          ) : null}
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Agentes ({agents.length})</h2>
        {loading ? <p className="text-sm text-gray-500">Cargando...</p> : null}
        {error ? <p className="text-sm text-red-700">Error: {error}</p> : null}
        {agents.length === 0 && !loading ? <p className="text-sm text-gray-500">No tienes agentes todavia.</p> : null}
        <div className="space-y-3">
          {agents.map((a) => (
            <article key={a.id} className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-semibold text-gray-900">{a.name}</h3>
              <p className="mt-1 text-xs text-gray-500">
                Clase: {KIND_LABEL[a.kind] ?? a.kind} | Estado:{' '}
                {STATUS_LABEL[a.status] ?? a.status} | Última actividad:{' '}
                {a.lastUsedAt ? new Date(a.lastUsedAt).toLocaleString() : 'nunca'}
              </p>
              <p className="mt-1 text-xs text-gray-600">Permisos: {(a.permissions ?? []).join(', ') || 'ninguno'}</p>
              {a.status === 'active' ? (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => void run(a.id, 'revoke')} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Revocar
                  </button>
                  <button onClick={() => void run(a.id, 'block')} disabled={busy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Bloquear
                  </button>
                </div>
              ) : null}
              {a.status === 'blocked' ? (
                <button onClick={() => void run(a.id, 'activate')} disabled={busy} className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Activar
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}