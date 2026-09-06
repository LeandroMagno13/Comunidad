'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Me = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
    profile?: {
      profession?: string | null;
      country?: string | null;
      bio?: string | null;
      expertise?: string[];
      interests?: string[];
      availability?: string | null;
      linkedinUrl?: string | null;
      githubUrl?: string | null;
      websiteUrl?: string | null;
    } | null;
  } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<Me['user'] | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [interests, setInterests] = useState('');
  const [availability, setAvailability] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setName(data.user.name || '');
        setProfession(data.user.profile?.profession || '');
        setCountry(data.user.profile?.country || '');
        setBio(data.user.profile?.bio || '');
        setExpertise((data.user.profile?.expertise || []).join(', '));
        setInterests((data.user.profile?.interests || []).join(', '));
        setAvailability(data.user.profile?.availability || '');
        setLinkedinUrl(data.user.profile?.linkedinUrl || '');
        setGithubUrl(data.user.profile?.githubUrl || '');
        setWebsiteUrl(data.user.profile?.websiteUrl || '');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          profession,
          country,
          bio,
          expertise: expertise.split(',').map((s) => s.trim()).filter(Boolean),
          interests: interests.split(',').map((s) => s.trim()).filter(Boolean),
          availability,
          linkedinUrl,
          githubUrl,
          websiteUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        setLoading(false);
        return;
      }
      setSuccess('Perfil actualizado');
      setLoading(false);
    } catch {
      setError('Error de conexión');
      setLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg('');

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPassMsg(data.error || 'Error al cambiar la contraseña');
      return;
    }
    setPassMsg('Contraseña actualizada');
    setCurrentPassword('');
    setNewPassword('');
  }

  if (user === undefined) {
    return <div className="px-4 py-10 text-center text-sm text-gray-500">Cargando…</div>;
  }

  const inputClass =
    'block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm';

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      <p className="mt-1 text-sm text-gray-600">
        {user?.email} · {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Miembro'}
      </p>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <form onSubmit={saveProfile} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Profesión</label>
            <input className={inputClass} value={profession} onChange={(e) => setProfession(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">País</label>
            <input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Sobre mí</label>
          <textarea className={inputClass} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Áreas de experiencia (separadas por coma)</label>
          <input className={inputClass} value={expertise} onChange={(e) => setExpertise(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Intereses (separados por coma)</label>
          <input className={inputClass} value={interests} onChange={(e) => setInterests(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Disponibilidad</label>
          <select className={inputClass} value={availability} onChange={(e) => setAvailability(e.target.value)}>
            <option value="">Selecciona…</option>
            <option value="full-time">Tiempo completo</option>
            <option value="part-time">Medio tiempo</option>
            <option value="weekends">Solo fines de semana</option>
            <option value="on-demand">Bajo demanda</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">LinkedIn</label>
            <input className={inputClass} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">GitHub</label>
            <input className={inputClass} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Sitio web</label>
            <input className={inputClass} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900">Cambiar contraseña</h2>
        {passMsg && (
          <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-700">{passMsg}</div>
        )}
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña actual</label>
            <input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nueva contraseña</label>
            <input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}