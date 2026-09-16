// ============================================================================
// SANITIZADOR DE HTML PARA PUBLICACIONES
//
// Las publicaciones se editan con formato enriquecido ("como HTML pero sin
// código": titulares, negritas, listas, citas y enlaces vía controles). El
// editor solo produce un conjunto acotado de etiquetas; este módulo las
// restringe (whitelist) y escapa TODO el resto. Es puro (sin DOM, sin
// matchAll/ES-next), así puede usarse en cliente y servidor, siempre que se
// guarda y cuando se renderiza.
//
// Regla: nunca se confía en el HTML que llega. Lo que no está en la whitelist
// se descarta conservando su texto; los atributos quedan limitados a href con
// protocolos seguros. Síntoma esperado: pastar código HTML ajeno se ve como
// texto plano, exactamente "HTML pero sin código".
// ============================================================================

const ALLOWED_TAGS = new Set([
  'p',
  'div',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'hr',
]);

const SAFE_HREF = /^(https?:\/\/|mailto:|#|\/)/i;

// Embeds permitidos: SOLO iframes de videos de YouTube y posts de X (Twitter).
// Se reconstruye un src canónico y nada más: jamás se copian atributos ajenos.
const YT_EMBED_RE = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/([A-Za-z0-9_-]{6,})/i;
const X_EMBED_RE = /^https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?(?:[^#]*[&])?id=(\d+)(?:[&#].*)?$/i;

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g;

function escapeText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescapeText(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

// Extrae el valor de un atributo (src, href…) de un fragmento de atributos.
function attrValue(attrs: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const m = re.exec(attrs);
  return m ? (m[1] ?? m[2] ?? '') : '';
}

// ¿El src de un iframe entra en la whitelist de embeds? Devuelve el src
// canónico (solo id de video / id de post) o null si no es un embed seguro.
function safeEmbedSrc(src: string): string | null {
  if (!src) return null;
  const yt = YT_EMBED_RE.exec(src.trim());
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[3]}`;
  const x = X_EMBED_RE.exec(src.trim());
  if (x) return `https://platform.twitter.com/embed/Tweet.html?id=${x[1]}`;
  return null;
}

function forEachTag(html: string, cb: (match: RegExpExecArray) => void) {
  const re = new RegExp(TAG_RE.source, 'g');
  let m: RegExpExecArray | null;
  // RegExp.exec con flag g (ES5): cada coincidencia reporta su index.
  while ((m = re.exec(html)) !== null) {
    cb(m);
  }
}

export function sanitizeHtml(html: string): string {
  let out = '';
  let last = 0;
  let anchorOpen = false;
  let iframeOpen = false;

  forEachTag(html, (m) => {
    const start = m.index;
    out += escapeText(html.slice(last, start));

    const raw = m[0];
    const name = (m[1] || '').toLowerCase();
    const isClosing = raw.startsWith('</');

    if (name === 'a') {
      if (isClosing) {
        if (anchorOpen) {
          out += '</a>';
          anchorOpen = false;
        }
      } else {
        anchorOpen = false;
        const attrs = m[2] || '';
        const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
        const href = (hrefMatch ? (hrefMatch[1] ?? hrefMatch[2]) : undefined) || '';
        if (href && SAFE_HREF.test(href)) {
          out += `<a href="${escapeText(href)}" rel="noopener noreferrer">`;
          anchorOpen = true;
        }
      }
    } else if (name === 'iframe') {
      if (isClosing) {
        if (iframeOpen) {
          out += '</iframe>';
          iframeOpen = false;
        }
      } else {
        const attrs = m[2] || '';
        const safe = safeEmbedSrc(attrValue(attrs, 'src'));
        if (safe !== null) {
          const title = safe.includes('youtube-nocookie.com') ? 'Video de YouTube' : 'Post de X';
          out += `<iframe src="${escapeText(safe)}" title="${title}" loading="lazy" allowfullscreen></iframe>`;
          iframeOpen = true;
        }
      }
    } else if (!ALLOWED_TAGS.has(name)) {
      // Etiqueta fuera de whitelist: se descarta, su texto se conserva (escapado).
    } else if (isClosing) {
      out += `</${name}>`;
    } else if (name === 'br') {
      out += '<br/>';
    } else if (name === 'hr') {
      out += '<hr/>';
    } else {
      out += `<${name}>`;
    }

    last = start + raw.length;
  });
  out += escapeText(html.slice(last));
  return out;
}

// Texto plano legible (para resúmenes y validación): quita etiquetas y
// decodifica entidades. No cifra, no convierte: solo extrae lo que se lee.
// Los embeds de video/post aportan un marcador para que una publicación
// "solo embed" no se considere vacía.
export function htmlToText(html: string): string {
  const withEmbed = html.replace(/<iframe\b[^>]*><\/iframe>|<iframe\b[^>]*\/>/gi, ' [video] ');
  const withoutTags = withEmbed.replace(TAG_RE, ' ');
  return unescapeText(withoutTags).replace(/\s+/g, ' ').trim();
}