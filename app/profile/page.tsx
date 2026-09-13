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

type CuTransactionItem = {
  id: string;
  type: string;
  amount: number;
  description?: string | null;
  createdAt: string;
  fromUser?: { id: string; name: string } | null;
  toUser?: { id: string; name: string } | null;
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

  const [cu, setCu] = useState<{ account: any; transactions: CuTransactionItem[] } | null>(null);

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
    loadCu();
  }, [router]);

  async function loadCu() {
    const res = await fetch('/api/cu/account');
    if (!res.ok) return;
    const data = await res.json();
    setCu(data);
  }

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
        {user?.email} ·{' '}
        {user?.role === 'SUPER_ADMIN'
          ? 'Super Admin'
          : user?.role === 'ADMIN'
          ? 'Admin'
          : user?.role === 'MODERATOR'
          ? 'Moderador'
          : 'Miembro'}
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
        <h2 className="text-lg font-semibold text-gray-900">Mis CU · registro experimental de participación</h2>
        <p className="mt-1 text-xs text-gray-500">
          Las CU son la unidad experimental de participación de la comunidad. No son dinero,
          no tienen conversión monetaria, no representan patrimonio, no se conectan
          automáticamente con los rendimientos del patrimonio y no son una medida del
          valor de las personas. Se registran mediante la participación inicial y la actividad
          comunitaria; no se gastan como pago.
        </p>

        {cu ? (
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs font-medium text-indigo-700">Registro interno actual</p>
                <p className="text-3xl font-bold text-indigo-900">{cu.account.balance} CU</p>
              </div>
              <div className="text-sm text-indigo-700">
                <p>Total recibidas: {cu.account.totalIssued}</p>
                <p>Total consumidas: {cu.account.totalConsumed}</p>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-indigo-900">Movimientos recientes</h3>
              {cu.transactions.length === 0 ? (
                <p className="mt-2 text-xs text-indigo-600">Todavía no hay movimientos.</p>
              ) : (
                <ul className="mt-2 divide-y divide-indigo-100">
                  {cu.transactions.map((t) => {
                    let sign = '';
                    let label = t.description || t.type;
                    if (t.type === 'issued') {
                      sign = '+';
                      label = t.description || 'CU recibidas (grant de bienvenida)';
                    } else if (t.type === 'transfer') {
                      if (t.fromUser?.id === cu?.account.userId) {
                        sign = '-';
                        label = t.toUser ? `Transferidas a ${t.toUser.name}` : 'Transferidas';
                      } else {
                        sign = '+';
                        label = t.fromUser ? `Recibidas de ${t.fromUser.name}` : 'Recibidas';
                      }
                    } else if (t.type === 'consume') {
                      sign = '-';
                      label = t.description || 'CU consumidas';
                    } else if (t.type === 'adjustment') {
                      if (t.toUser?.id === cu?.account.userId) {
                        sign = '+';
                        label = t.description || 'Ajuste histórico';
                      } else {
                        sign = '-';
                        label = t.description || 'Ajuste histórico';
                      }
                    }
                    return (
                      <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <p className="font-medium text-indigo-900">{label}</p>
                          <p className="text-[11px] text-indigo-500">
                            {new Date(t.createdAt).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`font-semibold ${sign === '+' ? 'text-green-700' : 'text-indigo-800'}`}>
                          {sign}
                          {t.amount} CU
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Cargando tu cuenta de CU…</p>
        )}
      </div>

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