'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthStatus() {
  const [user, setUser] = useState<{ name: string } | null | undefined>(undefined);

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
  }, []);

  if (user === undefined) {
    return <span className="text-gray-400 text-sm">…</span>;
  }

  if (user) {
    return (
      <Link
        href="/profile"
        className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        {user.name}
      </Link>
    );
  }

  return (
    <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
      Iniciar sesión
    </Link>
  );
}