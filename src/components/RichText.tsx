'use client';

import { useMemo } from 'react';
import { sanitizeHtml } from '@/src/lib/sanitize';

// Renderiza el HTML ya restringido por el editor con la tipografía de un foro.
// Volvemos a sanitizar en el cliente como defensa en profundidad (nunca se
// confía en el contenido guardado), y las variantes arbitrarias de Tailwind
// dan el aspecto de "publicación de foro" a cada etiqueta permitida.
export default function RichText({
  html,
  className = '',
  clamp = false,
}: {
  html: string;
  className?: string;
  clamp?: boolean;
}) {
  const safe = useMemo(() => sanitizeHtml(html), [html]);

  let cls = className || '';
  if (clamp) {
    cls = `${cls} line-clamp-2 overflow-hidden`;
  } else {
    cls = `${cls} [&>p]:mb-3 [&>p:last-child]:mb-0 [&>div]:mb-3 [&>div:last-child]:mb-0`;
  }

  const embedCls = clamp
    ? '[&_iframe]:hidden'
    : '[&_iframe]:my-4 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg [&_iframe]:border [&_iframe]:border-gray-200';

  return (
    <div
      className={`[&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-700
        [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900
        [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900
        [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900
        [&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-800
        [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5
        [&_li]:mb-1 [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300
        [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
        [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-gray-900
        [&_pre]:p-3 [&_pre]:text-sm [&_pre]:text-gray-100 [&_code]:rounded [&_code]:bg-gray-100
        [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_code]:text-gray-800
        [&_hr]:my-4 [&_hr]:border-gray-200 [&_u]:underline [&_s]:line-through
        ${embedCls} ${cls}`}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}