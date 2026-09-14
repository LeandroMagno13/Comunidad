'use client';

import { useCallback, useEffect, useState } from 'react';

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

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      const res = await fetch('/api/v1/external/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
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
      const res = await fetch('/api/v1/external/agents', {
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
    <main>
      <h1>Mis agentes</h1>
      <p>Administra tus agentes EXTERNAL: crea (token se muestra una vez), revoca, bloquea o activa.</p>

      {created?.tokenValue ? (
        <section>
          <h2>Credencial emitida (una unica vez)</h2>
          <p>Token (guardalo; no se puede recuperar):</p>
          <pre>{created.tokenValue}</pre>
          <p>Prefijo de identificacion: <code>{created.tokenPrefix}</code></p>
        </section>
      ) : null}

      <section>
        <h2>Crear agente</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre (min 3)"
            minLength={3}
            required
          />
          <button type="submit" disabled={busy || name.trim().length < 3}>
            Crear
          </button>
        </form>
      </section>

      <section>
        <h2>Agentes ({agents.length})</h2>
        {loading ? <p>Cargando...</p> : null}
        {error ? <p>Error: {error}</p> : null}
        {agents.length === 0 && !loading ? <p>No tienes agentes todavia.</p> : null}
        {agents.map((a) => (
          <article key={a.id}>
            <h3>{a.name}</h3>
            <p>
              Clase: {KIND_LABEL[a.kind] ?? a.kind} | Estado:{' '}
              {STATUS_LABEL[a.status] ?? a.status} | Ultima actividad:{' '}
              {a.lastUsedAt ? new Date(a.lastUsedAt).toLocaleString() : 'nunca'}
            </p>
            <p>Permisos: {(a.permissions ?? []).join(', ') || 'ninguno'}</p>
            {a.status === 'active' ? (
              <div>
                <button onClick={() => void run(a.id, 'revoke')} disabled={busy}>
                  Revocar
                </button>
                <button onClick={() => void run(a.id, 'block')} disabled={busy}>
                  Bloquear
                </button>
              </div>
            ) : null}
            {a.status === 'blocked' ? (
              <button onClick={() => void run(a.id, 'activate')} disabled={busy}>
                Activar
              </button>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}