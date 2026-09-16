'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const MAX_TEXT = 10000;

const BLOCK_TAGS = new Set(['p', 'div', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre']);
const WRAP_BLOCK_SELECTOR = 'p,div,h1,h2,h3,h4,blockquote,pre,ul,ol,li';

function ToolbarButton({ label, title, onRun }: { label: ReactNode; title: string; onRun: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onRun}
      className="rounded px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    >
      {label}
    </button>
  );
}

function closestTag(node: Node, tag: string, root: HTMLElement): HTMLElement | null {
  let n: Node | null = node;
  while (n && n !== root) {
    if (n.nodeType === 1 && (n as HTMLElement).tagName.toLowerCase() === tag) return n as HTMLElement;
    n = n.parentNode;
  }
  return null;
}

function closestBlock(node: Node, root: HTMLElement): HTMLElement | null {
  let n: Node | null = node;
  while (n && n !== root) {
    if (n.nodeType === 1 && BLOCK_TAGS.has((n as HTMLElement).tagName.toLowerCase())) return n as HTMLElement;
    n = n.parentNode;
  }
  return null;
}

function contentsRange(el: HTMLElement): Range {
  const r = document.createRange();
  r.selectNodeContents(el);
  return r;
}

function rangesOverlap(a: Range, b: Range): boolean {
  return a.compareBoundaryPoints(Range.END_TO_START, b) > 0 && b.compareBoundaryPoints(Range.END_TO_START, a) > 0;
}

function intersectRanges(a: Range, b: Range): Range | null {
  const start = a.compareBoundaryPoints(Range.START_TO_START, b) >= 0 ? a : b;
  const end = a.compareBoundaryPoints(Range.END_TO_END, b) <= 0 ? a : b;
  const r = document.createRange();
  r.setStart(start.startContainer, start.startOffset);
  r.setEnd(end.endContainer, end.endOffset);
  return r.collapsed ? null : r;
}

function blocksInRange(range: Range, root: HTMLElement): HTMLElement[] {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(WRAP_BLOCK_SELECTOR));
  const overlap = nodes.filter((el) => rangesOverlap(contentsRange(el), range));
  const minimal = overlap.filter((el) => {
    let p = el.parentElement;
    while (p && p !== root) {
      if (overlap.includes(p)) return false;
      p = p.parentElement;
    }
    return true;
  });
  return minimal.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
}

function wrapRangeInTag(range: Range, tag: string) {
  if (range.collapsed) return;
  const sc = range.startContainer;
  const so = range.startOffset;
  const ec = range.endContainer;
  const eo = range.endOffset;
  const fresh = document.createRange();
  fresh.setStart(sc, so);
  fresh.setEnd(ec, eo);
  if (fresh.collapsed) return;
  const fragment = fresh.extractContents();
  const el = document.createElement(tag);
  el.appendChild(fragment);
  fresh.insertNode(el);
  const sel = window.getSelection();
  const nr = document.createRange();
  nr.selectNodeContents(el);
  sel?.removeAllRanges();
  sel?.addRange(nr);
}

function wrapInlineRange(range: Range, root: HTMLElement, tag: string) {
  const blocks = blocksInRange(range, root);
  if (blocks.length === 0) {
    wrapRangeInTag(range, tag);
    return;
  }
  for (const block of blocks) {
    const sub = intersectRanges(contentsRange(block), range);
    if (sub) wrapRangeInTag(sub, tag);
  }
}

function elementDepth(el: HTMLElement, root: HTMLElement): number {
  let d = 0;
  let p = el.parentElement;
  while (p && p !== root) {
    d++;
    p = p.parentElement;
  }
  return d;
}

function unwrapElement(el: HTMLElement) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function removeTagInRange(range: Range, tag: string, root: HTMLElement) {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(tag));
  const overlapping = candidates.filter((el) => rangesOverlap(contentsRange(el), range));
  overlapping.sort((a, b) => elementDepth(b, root) - elementDepth(a, root));
  for (const el of overlapping) unwrapElement(el);
}

function replaceBlockWith(block: HTMLElement, newTag: string): HTMLElement {
  const el = document.createElement(newTag);
  while (block.firstChild) el.appendChild(block.firstChild);
  block.replaceWith(el);
  return el;
}

function extractYoutubeId(url: string): string | null {
  const m = url
    .trim()
    .match(
      /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
    );
  return m && m[1] ? m[1] : null;
}

function extractXId(url: string): string | null {
  const m = url.trim().match(/(?:twitter\.com|x\.com)\/[^/?#]+\/status\/(\d+)/i);
  return m && m[1] ? m[1] : null;
}

export default function RichEditor({
  onChange,
  initialValue = '',
}: {
  onChange: (html: string) => void;
  initialValue?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [textLength, setTextLength] = useState(0);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialValue) {
      ref.current.innerHTML = initialValue || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInput() {
    const el = ref.current;
    if (!el) return;
    setTextLength(el.innerText.length);
    onChange(el.innerHTML);
  }

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  function toggleInline(tag: 'b' | 'i' | 'u' | 's') {
    const root = ref.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      const cmd =
        tag === 'b' ? 'bold' : tag === 'i' ? 'italic' : tag === 'u' ? 'underline' : 'strikeThrough';
      document.execCommand(cmd, false, undefined);
      handleInput();
      return;
    }
    const startEl =
      range.startContainer.nodeType === 3
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement);
    const endEl =
      range.endContainer.nodeType === 3
        ? range.endContainer.parentElement
        : (range.endContainer as HTMLElement);
    const startWrap = startEl && closestTag(startEl, tag, root);
    const endWrap = endEl && closestTag(endEl, tag, root);
    if (startWrap && endWrap) {
      removeTagInRange(range, tag, root);
    } else {
      wrapInlineRange(range, root, tag);
    }
    handleInput();
  }

  function toggleBlock(tag: 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre') {
    const root = ref.current;
    const sel = window.getSelection();
    if (!root || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const block = closestBlock(range.startContainer, root);
    if (!block || block === root) return;
    if (block.tagName.toLowerCase() === tag) {
      replaceBlockWith(block, 'p');
    } else {
      replaceBlockWith(block, tag);
    }
    handleInput();
  }

  function addLink() {
    const url = window.prompt('Enlace (URL):', 'https://');
    if (!url) return;
    exec('createLink', url);
  }

  function addVideo() {
    const url = window.prompt('Video de YouTube (URL):', 'https://www.youtube.com/watch?v=');
    if (!url) return;
    const id = extractYoutubeId(url);
    if (!id) {
      window.alert('No reconocí ese enlace de YouTube. Pegá un enlace tipo https://www.youtube.com/watch?v=… o https://youtu.be/…');
      return;
    }
    const iframe = `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video de YouTube" loading="lazy" allowfullscreen></iframe>`;
    ref.current?.focus();
    document.execCommand('insertHTML', false, iframe);
    handleInput();
  }

  function addPostX() {
    const url = window.prompt('Post de X / Twitter (URL):', 'https://x.com/');
    if (!url) return;
    const id = extractXId(url);
    if (!id) {
      window.alert('No reconocí ese enlace. Pegá un enlace tipo https://x.com/usuario/status/1234567890');
      return;
    }
    const iframe = `<iframe src="https://platform.twitter.com/embed/Tweet.html?id=${id}" title="Post de X" loading="lazy" allowfullscreen></iframe>`;
    ref.current?.focus();
    document.execCommand('insertHTML', false, iframe);
    handleInput();
  }

  return (
    <div className="rounded-md border border-gray-300">
      <style>{`
        .rich-editor:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        .rich-editor h1 { font-size: 1.5rem; font-weight: 700; margin: .5rem 0; line-height: 1.25; }
        .rich-editor h2 { font-size: 1.25rem; font-weight: 700; margin: .4rem 0; line-height: 1.25; }
        .rich-editor h3 { font-size: 1.1rem; font-weight: 600; margin: .35rem 0; line-height: 1.25; }
        .rich-editor h4 { font-size: 1rem; font-weight: 600; margin: .3rem 0; }
        .rich-editor ul { list-style: disc; padding-left: 1.4rem; margin: .25rem 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.4rem; margin: .25rem 0; }
        .rich-editor li { margin: .1rem 0; }
        .rich-editor blockquote { border-left: 3px solid #d1d5db; padding-left: .75rem; margin: .5rem 0; color: #4b5563; font-style: italic; }
        .rich-editor pre { background: #111827; color: #f3f4f6; border-radius: .5rem; padding: .75rem; margin: .5rem 0; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85rem; }
        .rich-editor code { background: #e5e7eb; color: #111827; border-radius: .25rem; padding: 0 .25rem; font-size: .9em; }
        .rich-editor hr { border-top: 1px solid #d1d5db; margin: .75rem 0; }
        .rich-editor iframe { max-width: 100%; border: 0; border-radius: .5rem; margin: .5rem 0; background: #000; }
      `}</style>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1">
        <ToolbarButton title="Titular 1" label={<span className="font-bold">H1</span>} onRun={() => toggleBlock('h1')} />
        <ToolbarButton title="Titular 2" label={<span className="font-bold">H2</span>} onRun={() => toggleBlock('h2')} />
        <ToolbarButton title="Titular 3" label={<span className="font-bold">H3</span>} onRun={() => toggleBlock('h3')} />
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton title="Negrita" label={<b className="font-black">B</b>} onRun={() => toggleInline('b')} />
        <ToolbarButton title="Cursiva" label={<i className="font-semibold not-italic">I</i>} onRun={() => toggleInline('i')} />
        <ToolbarButton title="Subrayado" label={<u>U</u>} onRun={() => toggleInline('u')} />
        <ToolbarButton title="Tachado" label={<s>S</s>} onRun={() => toggleInline('s')} />
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton title="Lista con viñetas" label="• Lista" onRun={() => exec('insertUnorderedList')} />
        <ToolbarButton title="Lista numerada" label="1. Lista" onRun={() => exec('insertOrderedList')} />
        <ToolbarButton title="Cita" label="Cita" onRun={() => toggleBlock('blockquote')} />
        <ToolbarButton title="Bloque de código" label="Código" onRun={() => toggleBlock('pre')} />
        <ToolbarButton title="Separador" label="—" onRun={() => exec('insertHorizontalRule')} />
        <span className="mx-1 h-4 w-px bg-gray-200" />
        <ToolbarButton title="Enlace" label="Enlace" onRun={addLink} />
        <ToolbarButton title="Quitar enlace" label="Quitar" onRun={() => exec('unlink')} />
        <ToolbarButton title="Video de YouTube" label="Video YouTube" onRun={addVideo} />
        <ToolbarButton title="Post de X (Twitter)" label="Post de X" onRun={addPostX} />
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder="Escribí tu publicación… Los controles de arriba dan formato (títulos, negritas, listas, citas, código, enlaces y videos) sin escribir código."
        onInput={handleInput}
        onBlur={handleInput}
        suppressContentEditableWarning
        className="rich-editor min-h-40 cursor-text px-3 py-2 text-sm text-gray-800 outline-none"
      />
      {textLength > MAX_TEXT - 500 && (
        <p className={`px-3 pb-1 text-right text-[10px] ${textLength > MAX_TEXT ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
          {textLength}/{MAX_TEXT} caracteres
        </p>
      )}
    </div>
  );
}