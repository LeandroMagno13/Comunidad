'use client';

import { useState } from 'react';

export default function PollCreateForm({
  scope,
  guildId,
  onCreated,
}: {
  scope: 'guild' | 'community';
  guildId?: string | null;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [postRef, setPostRef] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function setOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function extractPostId(prompt: string) {
    const s = prompt.trim();
    const match = s.match(/community\/([a-zA-Z0-9]+)/);
    return match ? match[1] : s;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const postId = postRef.trim() ? extractPostId(postRef) : null;
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        title,
        description: description || null,
        scope,
        guildId: scope === 'guild' ? guildId : null,
        postId,
        options,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'No se pudo crear la encuesta');
      return;
    }
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setPostRef('');
    onCreated();
  }

  return (
    <form onSubmit={create} className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-900">
        {scope === 'guild' ? 'Crear encuesta del gremio' : 'Crear encuesta de la comunidad'}
      </h3>
      <input
        className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        placeholder="Título de la encuesta"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />
      <textarea
        className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        placeholder="Descripción (opcional): qué se decide, antecedentes, contexto…"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
      />
      <div className="mt-2 space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder={`Opción ${i + 1}`}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              maxLength={120}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded px-2 py-1 text-xs text-gray-400 hover:text-red-600"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {options.length < 8 && (
        <button
          type="button"
          onClick={() => setOptions((prev) => [...prev, ''])}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          + Agregar opción
        </button>
      )}
      <input
        className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        placeholder="Enlace a la publicación referida (opcional): pegá el link del muro o el ID"
        value={postRef}
        onChange={(e) => setPostRef(e.target.value)}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={busy || !title.trim() || options.filter((o) => o.trim()).length < 2}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Creando…' : 'Crear encuesta'}
        </button>
      </div>
    </form>
  );
}