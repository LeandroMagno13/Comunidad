'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// CTA de registro que SOLO aparece para quien no inició sesión. Para un usuario
// ya logueado o mientras se verifica la sesión, devuelve null: nadie "parte"
// hacia /register dos veces. Integración previa: fetch por componente (barato).
export default function GuestRegisterButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setAuthed(Boolean(data?.user));
      })
      .catch(() => {
        if (active) setAuthed(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authed === null) return null;
  if (authed) return null;

  return (
    <Link href="/register" className={className}>
      {label}
    </Link>
  );
}