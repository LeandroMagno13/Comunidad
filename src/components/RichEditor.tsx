'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const MAX_TEXT = 10000;

type ToolBtn = {
  label: ReactNode;
  title: string;
  command: string;
  value?: string;
};

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

  function exec(command: string, value?: string) {
    ref.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  function handleInput() {
    const el = ref.current;
    if (!el) return;
    setTextLength(el.innerText.length);
    onChange(el.innerHTML);
  }

  function addLink() {
    const url = window.prompt('Enlace (URL):', 'https://');
    if (!url) return;
    exec('createLink', url);
  }

const blockBtns: ToolBtn[] = [
  { label: <span className="font-bold">H1</span>, title: 'Titular 1', command: 'formatBlock', value: 'h1' },
  { label: <span className="font-bold">H2</span>, title: 'Titular 2', command: 'formatBlock', value: 'h2' },
  { label: <span className="font-bold">H3</span>, title: 'Titular 3', command: 'formatBlock', value: 'h3' },
];

const inlineBtns: ToolBtn[] = [
  { label: <b className="font-black">B</b>, title: 'Negrita', command: 'bold' },
  { label: <i className="font-semibold not-italic">I</i>, title: 'Cursiva', command: 'italic' },
  { label: <u>U</u>, title: 'Subrayado', command: 'underline' },
  { label: <s>S</s>, title: 'Tachado', command: 'strikeThrough' },
];

const listBtns: ToolBtn[] = [
  { label: '• Lista', title: 'Lista con viñetas', command: 'insertUnorderedList' },
  { label: '1. Lista', title: 'Lista numerada', command: 'insertOrderedList' },
  { label: 'Cita', title: 'Cita', command: 'formatBlock', value: 'blockquote' },
  { label: 'Código', title: 'Bloque de código', command: 'formatBlock', value: 'pre' },
];

  return (
    <div className="rounded-md border border-gray-300">
      <style>{`
        .rich-editor:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
      `}</style>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1">
        {blockBtns.map((b) => (
          <ToolbarButton
            key={b.title}
            title={b.title}
            label={b.label}
            onRun={() => exec(b.command, b.value)}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {inlineBtns.map((b) => (
          <ToolbarButton key={b.title} title={b.title} label={b.label} onRun={() => exec(b.command, b.value)} />
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {listBtns.map((b) => (
          <ToolbarButton key={b.title} title={b.title} label={b.label} onRun={() => exec(b.command, b.value)} />
        ))}
        <ToolbarButton title="Enlace" label="Enlace" onRun={addLink} />
        <ToolbarButton title="Quitar enlace" label="Quitar" onRun={() => exec('unlink')} />
        <ToolbarButton title="Separador" label="—" onRun={() => exec('insertHorizontalRule')} />
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder="Escribí tu publicación… Los controles de arriba dan formato (títulos, negritas, listas, citas y enlaces) sin escribir código."
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