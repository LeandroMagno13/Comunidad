'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Enlace que SOLO aparece para quien ya inició sesión. Se usa para destinos que
// exigen cuenta (p. ej. /guilds, que redirige a /login si no hay sesión): un
// visitante no ve un enlace que lo va a rebotar. Mientras se verifica la sesión
// devuelve null para no parpadear.
export default function MemberOnlyLink({
  href,
  label,
  className,
}: {
  href: string;
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

  if (!authed) return null;

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}
