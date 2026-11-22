/**
 * @fileoverview Tela 6 no celular real (Cenário 4 — Sansão no metrô).
 * Diferente do simulador, aqui o texto é editável de verdade: o toque posiciona o cursor,
 * o teclado é o do próprio aparelho e o ditado por voz é o microfone desse teclado
 * (HTA 3.3 e 3.4). A barra de formatação fica logo acima do teclado (`R20`), com alvos de
 * 48 × 48 px (`R19`), e os botões não tiram o foco do texto, então o teclado não fecha.
 *
 * Com o cursor parado (sem seleção), "Itálico", "Negrito" e "Sublinhado" valem para o que
 * for digitado ou ditado em seguida, e um segundo toque desliga o estilo (Cenário 4).
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronLeftIcon,
  HeadphonesIcon,
  ItalicIcon,
  MicIcon,
  SceneSeparatorIcon,
  UnderlineIcon,
} from '../../components/shared/Icons';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { MobileBlock, MobileTextSegment, SiteLanguage, TextAlign } from '../../types/prototype';
import { MobileCompactPlayer } from './MobileCompactPlayer';
import { MobileFrame } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';
import './MobileScreens.css';

type StyleKey = 'bold' | 'italic' | 'underline';

interface ActiveState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
}

const INITIAL_STATE: ActiveState = {
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
};

/** Caractere invisível que segura o cursor dentro de um estilo recém-ligado. */
const ZWSP = '​';

const STYLE_TAG: Record<StyleKey, string> = { bold: 'b', italic: 'i', underline: 'u' };

const NATIVE_STRINGS: Record<
  SiteLanguage,
  {
    screenLabel: string;
    kicker: string;
    hint: string;
    docAria: string;
    toolbarAria: string;
    cancelAria: string;
    saveAria: string;
  }
> = {
  'pt-BR': {
    screenLabel: 'Tela 6 — Editor Mobile',
    kicker: 'Modo Edição',
    hint: 'Toque no texto para escrever. Para ditar, use o microfone do teclado.',
    docAria: 'Texto do Capítulo 9 em edição',
    toolbarAria: 'Formatação do texto',
    cancelAria: 'Cancelar edição e voltar à leitura',
    saveAria: 'Salvar alterações do capítulo',
  },
  'en-US': {
    screenLabel: 'Screen 6 — Mobile Editor',
    kicker: 'Edit mode',
    hint: 'Tap the text to write. To dictate, use the keyboard microphone.',
    docAria: 'Chapter 9 text being edited',
    toolbarAria: 'Text formatting',
    cancelAria: 'Cancel editing and return to reading',
    saveAria: 'Save chapter changes',
  },
  'es-ES': {
    screenLabel: 'Pantalla 6 — Editor Móvil',
    kicker: 'Modo edición',
    hint: 'Toca el texto para escribir. Para dictar, usa el micrófono del teclado.',
    docAria: 'Texto del Capítulo 9 en edición',
    toolbarAria: 'Formato del texto',
    cancelAria: 'Cancelar edición y volver a la lectura',
    saveAria: 'Guardar cambios del capítulo',
  },
};

/* --------------------------------------------------------------------------
   Conversão entre blocos do capítulo e HTML editável
   -------------------------------------------------------------------------- */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function segmentToHtml(seg: MobileTextSegment): string {
  let html = escapeHtml(seg.text);
  if (seg.underline) html = `<u>${html}</u>`;
  if (seg.italic) html = `<i>${html}</i>`;
  if (seg.bold) html = `<b>${html}</b>`;
  return html;
}

function blocksToHtml(blocks: MobileBlock[]): string {
  return blocks
    .map((block) => {
      const isSep = Boolean(block.isSeparator || block.text.trim() === '***');
      if (isSep) {
        return `<p class="mobile-native-sep" data-id="${block.id}" style="text-align:center">***</p>`;
      }
      const segments: MobileTextSegment[] =
        block.segments && block.segments.length > 0
          ? block.segments
          : [
              {
                text: block.text,
                bold: block.bold,
                italic: block.italic,
                underline: block.underline,
              },
            ];
      const inner = segments.map(segmentToHtml).join('') || '<br>';
      return `<p data-id="${block.id}" style="text-align:${block.align}">${inner}</p>`;
    })
    .join('');
}

function elementStyle(el: HTMLElement): Partial<Record<StyleKey, boolean>> {
  const tag = el.tagName;
  const out: Partial<Record<StyleKey, boolean>> = {};
  if (tag === 'B' || tag === 'STRONG') out.bold = true;
  if (tag === 'I' || tag === 'EM') out.italic = true;
  if (tag === 'U') out.underline = true;
  const { fontWeight, fontStyle, textDecoration, textDecorationLine } = el.style;
  if (fontWeight === 'bold' || Number(fontWeight) >= 600) out.bold = true;
  if (fontWeight === 'normal' || fontWeight === '400') out.bold = false;
  if (fontStyle === 'italic') out.italic = true;
  if (fontStyle === 'normal') out.italic = false;
  if ((textDecoration || textDecorationLine || '').includes('underline')) out.underline = true;
  return out;
}

function readAlign(el: HTMLElement): TextAlign {
  const align = el.style.textAlign;
  return align === 'center' || align === 'right' ? align : 'left';
}

/** Lê o conteúdo editável e devolve os blocos do capítulo (parágrafos e separadores). */
function htmlToBlocks(root: HTMLElement): MobileBlock[] {
  const blocks: MobileBlock[] = [];
  // Ao pular linha, o navegador copia os atributos do parágrafo (inclusive data-id).
  const seenIds = new Set<string>();

  const paragraphs: HTMLElement[] = [];
  root.childNodes.forEach((node) => {
    if (node instanceof HTMLElement) {
      paragraphs.push(node);
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      // Texto solto direto na raiz: trata como um parágrafo.
      const p = document.createElement('p');
      p.textContent = node.textContent;
      paragraphs.push(p);
    }
  });

  paragraphs.forEach((para, idx) => {
    const segments: MobileTextSegment[] = [];
    const walk = (node: Node, style: Record<StyleKey, boolean>) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (node.textContent ?? '').split(ZWSP).join('');
        if (!text) return;
        const last = segments[segments.length - 1];
        if (
          last &&
          Boolean(last.bold) === style.bold &&
          Boolean(last.italic) === style.italic &&
          Boolean(last.underline) === style.underline
        ) {
          last.text += text;
        } else {
          segments.push({ text, ...style });
        }
        return;
      }
      if (node instanceof HTMLElement) {
        if (node.tagName === 'BR') return;
        const next = { ...style, ...elementStyle(node) };
        node.childNodes.forEach((child) => walk(child, next));
      }
    };
    walk(para, { bold: false, italic: false, underline: false });

    const plain = segments.map((s) => s.text).join('').trim();
    if (!plain) return;

    let id = para.dataset.id || `mob-blk-${Date.now()}-${idx}`;
    if (seenIds.has(id)) id = `mob-blk-${Date.now()}-${idx}`;
    seenIds.add(id);
    if (plain === '***') {
      blocks.push({
        id,
        text: '***',
        bold: false,
        italic: false,
        underline: false,
        align: 'center',
        isSeparator: true,
      });
      return;
    }

    blocks.push({
      id,
      text: plain,
      bold: segments.every((s) => s.bold),
      italic: segments.every((s) => s.italic),
      underline: segments.every((s) => s.underline),
      align: readAlign(para),
      isSeparator: false,
      segments,
    });
  });

  return blocks;
}

/* --------------------------------------------------------------------------
   Seleção e formatação no conteúdo editável
   -------------------------------------------------------------------------- */

function paragraphOf(root: HTMLElement, node: Node | null): HTMLElement | null {
  let current: Node | null = node;
  while (current && current.parentNode !== root) {
    current = current.parentNode;
  }
  return current instanceof HTMLElement ? current : null;
}

/** Elemento de estilo (`<i>`, `<b>`…) mais próximo do cursor dentro do parágrafo. */
function styleAncestor(
  node: Node,
  key: StyleKey,
  paragraph: HTMLElement
): HTMLElement | null {
  let current: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (current && current !== paragraph) {
    if (current instanceof HTMLElement) {
      const style = elementStyle(current);
      if (style[key] === true) return current;
      if (style[key] === false) return null;
    }
    current = current.parentNode;
  }
  return null;
}

/** Elementos de estilo entre o cursor e `stop` (exclusive), do mais interno ao mais externo. */
function styleChainBetween(node: Node, stop: HTMLElement): HTMLElement[] {
  const chain: HTMLElement[] = [];
  let current: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentNode : node;
  while (current && current !== stop) {
    if (current instanceof HTMLElement && Object.keys(elementStyle(current)).length > 0) {
      chain.push(current);
    }
    current = current.parentNode;
  }
  return chain;
}

function placeCaret(node: Node, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function selectionInside(root: HTMLElement): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return root.contains(range.commonAncestorContainer) ? range : null;
}

/* -------------------------------------------------------------------------- */

export const MobileEditorNative: React.FC = () => {
  const { t, siteLanguage } = useTranslation();
  const extra = NATIVE_STRINGS[siteLanguage];
  const { sansaoChapter, updateSansaoChapter, navigateTo } = usePrototype();

  const docRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);

  const [active, setActive] = useState<ActiveState>(INITIAL_STATE);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerBlocks, setPlayerBlocks] = useState<MobileBlock[]>(sansaoChapter.blocks);
  const audio = useSansaoAudio(playerBlocks);

  // Monta o texto uma única vez; depois o DOM editável é dono do conteúdo.
  useLayoutEffect(() => {
    const root = docRef.current;
    if (!root) return;
    root.innerHTML = blocksToHtml(sansaoChapter.blocks);
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* navegadores sem suporte simplesmente ignoram */
    }
  }, []);

  /** Atualiza o destaque dos botões conforme o ponto do cursor (`R13` no celular, `R20`). */
  const refreshActive = useCallback(() => {
    const root = docRef.current;
    if (!root) return;
    const range = selectionInside(root);
    if (!range) return;
    lastRangeRef.current = range.cloneRange();
    const para = paragraphOf(root, range.startContainer);
    if (!para) {
      setActive(INITIAL_STATE);
      return;
    }
    setActive({
      bold: Boolean(styleAncestor(range.startContainer, 'bold', para)),
      italic: Boolean(styleAncestor(range.startContainer, 'italic', para)),
      underline: Boolean(styleAncestor(range.startContainer, 'underline', para)),
      align: readAlign(para),
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActive);
    return () => document.removeEventListener('selectionchange', refreshActive);
  }, [refreshActive]);

  // Quando o teclado abre, mantém a linha do cursor visível acima da barra de formatação.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let timer: number | undefined;
    const keepCaretVisible = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const root = docRef.current;
        const scroller = scrollRef.current;
        if (!root || !scroller) return;
        const range = selectionInside(root);
        // Só acompanha o cursor parado; durante uma seleção, a tela não pode pular.
        if (!range || !range.collapsed) return;
        const rects = range.getClientRects();
        let caretRect: DOMRect | null = rects.length > 0 ? rects[rects.length - 1] : null;
        if (!caretRect) {
          const container = range.startContainer;
          const el = container instanceof HTMLElement ? container : container.parentElement;
          caretRect = el ? el.getBoundingClientRect() : null;
        }
        if (!caretRect) return;
        const box = scroller.getBoundingClientRect();
        if (caretRect.bottom > box.bottom - 12) {
          scroller.scrollTop += caretRect.bottom - box.bottom + 32;
        } else if (caretRect.top < box.top + 12) {
          scroller.scrollTop -= box.top - caretRect.top + 32;
        }
      }, 60);
    };
    vv.addEventListener('resize', keepCaretVisible);
    document.addEventListener('selectionchange', keepCaretVisible);
    return () => {
      window.clearTimeout(timer);
      vv.removeEventListener('resize', keepCaretVisible);
      document.removeEventListener('selectionchange', keepCaretVisible);
    };
  }, []);

  /** Devolve a seleção atual do texto (ou a última conhecida, se o foco saiu). */
  const ensureRange = (): Range | null => {
    const root = docRef.current;
    if (!root) return null;
    const current = selectionInside(root);
    if (current) return current;
    const saved = lastRangeRef.current;
    if (!saved || !root.contains(saved.commonAncestorContainer)) return null;
    root.focus({ preventScroll: true });
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(saved);
    return saved;
  };

  const handleToggleStyle = (key: StyleKey) => {
    const root = docRef.current;
    const range = ensureRange();
    if (!root || !range) return;

    // Com texto selecionado, o próprio navegador aplica o estilo ao trecho.
    if (!range.collapsed) {
      document.execCommand(key);
      refreshActive();
      return;
    }

    const para = paragraphOf(root, range.startContainer);
    if (!para) return;
    const ancestor = styleAncestor(range.startContainer, key, para);

    if (!ancestor) {
      // Liga o estilo: o que vier a seguir (digitado ou ditado) entra dentro dele.
      const el = document.createElement(STYLE_TAG[key]);
      const holder = document.createTextNode(ZWSP);
      el.appendChild(holder);
      range.insertNode(el);
      placeCaret(holder, 1);
    } else {
      // Desliga o estilo: divide o elemento no cursor e continua fora dele,
      // mantendo os outros estilos que estavam ativos por dentro.
      const inner = styleChainBetween(range.startContainer, ancestor);
      const rest = document.createRange();
      rest.setStart(range.startContainer, range.startOffset);
      rest.setEndAfter(ancestor);
      const restFragment = rest.extractContents();

      const holder = document.createTextNode(ZWSP);
      let wrapper: ChildNode = holder;
      for (const el of inner) {
        const clone = el.cloneNode(false) as ChildNode;
        clone.appendChild(wrapper);
        wrapper = clone;
      }

      ancestor.after(wrapper);
      const restText = (restFragment.textContent ?? '').split(ZWSP).join('');
      if (restText) {
        wrapper.after(restFragment);
      }
      placeCaret(holder, 1);
    }
    refreshActive();
  };

  const handleSetAlign = (align: TextAlign) => {
    const root = docRef.current;
    const range = ensureRange();
    if (!root || !range) return;
    Array.from(root.children).forEach((child) => {
      if (child instanceof HTMLElement && range.intersectsNode(child)) {
        child.style.textAlign = align;
      }
    });
    refreshActive();
  };

  /** Insere o separador "***" já centralizado e põe o cursor na linha seguinte (`R20`). */
  const handleInsertSeparator = () => {
    const root = docRef.current;
    const range = ensureRange();
    if (!root) return;
    const para =
      (range && paragraphOf(root, range.startContainer)) ||
      (root.lastElementChild as HTMLElement | null);

    const sep = document.createElement('p');
    sep.className = 'mobile-native-sep';
    sep.style.textAlign = 'center';
    sep.textContent = '***';

    const next = document.createElement('p');
    next.style.textAlign = 'left';
    next.appendChild(document.createElement('br'));

    const paraIsEmpty = para && !(para.textContent ?? '').split(ZWSP).join('').trim();
    if (para && paraIsEmpty) {
      para.replaceWith(sep, next);
    } else if (para) {
      para.after(sep, next);
    } else {
      root.append(sep, next);
    }
    placeCaret(next, 0);
    refreshActive();
  };

  const handleTogglePlayer = () => {
    if (!isPlayerOpen && docRef.current) {
      setPlayerBlocks(htmlToBlocks(docRef.current));
    }
    setIsPlayerOpen((open) => !open);
  };

  /** Salva o capítulo e volta à leitura com a mesma velocidade (`R6`, HTA 6). */
  const handleSave = () => {
    const root = docRef.current;
    if (!root) return;
    const finalBlocks = htmlToBlocks(root);
    root.blur();
    updateSansaoChapter((prev) => ({
      ...prev,
      blocks: finalBlocks,
      edited: true,
      isPlaying: false,
      currentParagraph: Math.max(1, Math.min(prev.currentParagraph, finalBlocks.length)),
    }));
    navigateTo('tela_5_leitura_mobile');
  };

  /** Os botões da barra não podem roubar o foco do texto, senão o teclado fecha. */
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  const formatButton = (
    label: string,
    ariaLabel: string,
    icon: React.ReactNode,
    pressed: boolean | undefined,
    onClick: () => void
  ) => (
    <button
      type="button"
      className="mobile-format-btn"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onMouseDown={keepFocus}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <MobileFrame screenLabel={extra.screenLabel}>
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-touch-btn"
          aria-label={extra.cancelAria}
          onClick={() => navigateTo('tela_5_leitura_mobile')}
        >
          <ChevronLeftIcon size={18} />
          <span>{t.mobile.backToReader}</span>
        </button>

        <div className="mobile-header-titles">
          <span className="mobile-header-story">{extra.kicker}</span>
          <span className="mobile-header-chapter">{t.mobile.editorTitle}</span>
        </div>

        <button
          type="button"
          className={`mobile-touch-btn ${isPlayerOpen ? 'mobile-touch-btn--active' : ''}`.trim()}
          aria-expanded={isPlayerOpen}
          aria-label={isPlayerOpen ? t.mobile.collapsePlayerAria : t.mobile.expandPlayerAria}
          onMouseDown={keepFocus}
          onClick={handleTogglePlayer}
        >
          <HeadphonesIcon size={18} />
          <span>{t.mobile.listenLabel}</span>
        </button>

        <button
          type="button"
          className="mobile-touch-btn mobile-touch-btn--primary"
          aria-label={extra.saveAria}
          onClick={handleSave}
        >
          {t.common.save}
        </button>
      </header>

      {isPlayerOpen && (
        <MobileCompactPlayer
          audio={audio}
          onClose={() => setIsPlayerOpen(false)}
          keepFocus
        />
      )}

      <main ref={scrollRef} className="mobile-editor-scroll">
        <p className="mobile-native-hint">
          <MicIcon size={16} />
          <span>{extra.hint}</span>
        </p>
        <div
          ref={docRef}
          className="mobile-native-doc"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={extra.docAria}
          lang="pt-BR"
          spellCheck
          autoCapitalize="sentences"
          onInput={refreshActive}
          onKeyUp={refreshActive}
        />
      </main>

      {/* Barra de formatação logo acima do teclado do aparelho (R20) */}
      <div className="mobile-format-toolbar-wrap" role="toolbar" aria-label={extra.toolbarAria}>
        <div className="mobile-format-toolbar">
          {formatButton(t.mobile.bold, t.mobile.bold, <BoldIcon size={18} />, active.bold, () =>
            handleToggleStyle('bold')
          )}
          {formatButton(t.mobile.italic, t.mobile.italic, <ItalicIcon size={18} />, active.italic, () =>
            handleToggleStyle('italic')
          )}
          {formatButton(
            t.mobile.underline,
            t.mobile.underline,
            <UnderlineIcon size={18} />,
            active.underline,
            () => handleToggleStyle('underline')
          )}
          <span className="mobile-format-divider" aria-hidden="true" />
          {formatButton(
            t.mobile.left,
            t.editor.alignLeftTooltip,
            <AlignLeftIcon size={18} />,
            active.align === 'left',
            () => handleSetAlign('left')
          )}
          {formatButton(
            t.mobile.center,
            t.editor.alignCenterTooltip,
            <AlignCenterIcon size={18} />,
            active.align === 'center',
            () => handleSetAlign('center')
          )}
          {formatButton(
            t.mobile.right,
            t.editor.alignRightTooltip,
            <AlignRightIcon size={18} />,
            active.align === 'right',
            () => handleSetAlign('right')
          )}
          <span className="mobile-format-divider" aria-hidden="true" />
          {formatButton(
            `${t.mobile.separatorBtn} ***`,
            t.editor.sceneBreakTooltip,
            <SceneSeparatorIcon size={18} />,
            undefined,
            handleInsertSeparator
          )}
        </div>
      </div>
    </MobileFrame>
  );
};
