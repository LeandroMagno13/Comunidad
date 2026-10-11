'use client';

import { useEffect, useState } from 'react';

// Botón de modo oscuro/claro. Guarda la preferencia en localStorage
// y la aplica como clase `dark` en <html> (tailwind darkMode: 'class').
// Respeta la preferencia del sistema en la primera visita.

const STORAGE_KEY = 'comunidad-theme';

function currentTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.classList.toggle('dark', saved === 'dark');
        setTheme(saved);
        return;
      }
    } catch {
      // localStorage no disponible: se usa el tema del sistema
    }
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', prefersDark);
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento: el cambio igual aplica a la sesión actual
    }
  }

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={theme === 'dark'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className="inline-flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  );
}
