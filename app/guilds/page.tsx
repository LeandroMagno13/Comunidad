'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Membership = { status: string; role: string };

export default function GuildsPage() {
  const router = useRouter();
  const [guilds, setGuilds] = useState<any[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', purpose: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch('/api/guilds');
    if (!res.ok) {
      router.push('/login');
      return;
    }
    setGuilds(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createGuild(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    const res = await fetch('/api/guilds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Error al crear el gremio');
      setCreating(false);
      return;
    }
    setForm({ name: '', description: '', purpose: '' });
    setShowCreate(false);
    setCreating(false);
    await load();
  }

  async function join(guildId: string) {
    const res = await fetch(`/api/guilds/${guildId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' }),
    });
    if (res.ok) await load();
  }

  async function leave(guildId: string) {
    const res = await fetch(`/api/guilds/${guildId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'leave' }),
    });
    if (res.ok) await load();
  }

  if (guilds === null) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  const inputClass =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:border-blue-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gremios</h1>
          <p className="mt-1 text-sm text-gray-600">
            Los gremios son la capa de ejecución de la comunidad: cada uno organiza un oficio o tema concreto.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? 'Cancelar' : 'Crear gremio'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createGuild} className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={80}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Modalidad de ingreso</label>
            <select
              className={inputClass}
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            >
              <option value="">Con aprobación del creador (recomendado)</option>
              <option value="open">Abierto: cualquiera entra directo</option>
              <option value="closed">Cerrado: sólo por invitación/creador</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {creating ? 'Creando…' : 'Crear gremio'}
          </button>
        </form>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {guilds.length === 0 ? (
          <p className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            Aún no hay gremios. ¡Crea el primero!
          </p>
        ) : (
          guilds.map((guild) => {
            const m: Membership | null = guild.myMembership;
            const memberCount = guild._count?.members ?? guild.members?.length ?? 0;
            return (
              <div key={guild.id} className="flex flex-col rounded-lg border border-gray-200 bg-white p-5">
                <Link href={`/guilds/${guild.id}`}>
                  <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">{guild.name}</h2>
                </Link>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-gray-600">{guild.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>{memberCount} miembros</span>
                  <span>{guild._count?.posts || 0} publicaciones</span>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  {m?.status === 'active' ? (
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Miembro {m.role === 'admin' ? '(admin)' : ''}
                      </span>
                      <div className="flex gap-2">
                        <Link
                          href={`/guilds/${guild.id}`}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => leave(guild.id)}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Salir
                        </button>
                      </div>
                    </div>
                  ) : m?.status === 'pending' ? (
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Solicitud pendiente
                      </span>
                      <Link href={`/guilds/${guild.id}`} className="text-xs text-blue-600 hover:underline">
                        Ver
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => join(guild.id)}
                      className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      {guild.purpose === 'open' ? 'Unirme' : 'Solicitar ingreso'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}