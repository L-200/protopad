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
import {
  MobileBlock,
  MobileTextSegment,
  SiteLanguage,
  StoryLanguage,
  TextAlign,
} from '../../types/prototype';
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
const ZWSP = '\u200B';

const STYLE_TAG: Record<StyleKey, string> = { bold: 'b', italic: 'i', underline: 'u' };

function storyLangToHtmlLang(language: StoryLanguage): string {
  switch (language) {
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    default:
      return 'pt-BR';
  }
}

const NATIVE_STRINGS: Record<
  SiteLanguage,
  {
    screenLabel: string;
    kicker: string;
    editChapterTitle: (num: number) => string;
    hint: string;
    docAria: (num: number) => string;
    toolbarAria: string;
    cancelAria: string;
    saveAria: string;
  }
> = {
  'pt-BR': {
    screenLabel: 'Tela 6 — Editor Mobile',
    kicker: 'Modo Edição',
    editChapterTitle: (num) => `Editar Cap. ${num}`,
    hint: 'Toque no texto para escrever. Para ditar, use o microfone do teclado.',
    docAria: (num) => `Texto do Capítulo ${num} em edição`,
    toolbarAria: 'Formatação do texto',
    cancelAria: 'Cancelar edição e voltar à leitura',
    saveAria: 'Salvar alterações do capítulo',
  },
  'en-US': {
    screenLabel: 'Screen 6 — Mobile Editor',
    kicker: 'Edit mode',
    editChapterTitle: (num) => `Edit Ch. ${num}`,
    hint: 'Tap the text to write. To dictate, use the keyboard microphone.',
    docAria: (num) => `Chapter ${num} text being edited`,
    toolbarAria: 'Text formatting',
    cancelAria: 'Cancel editing and return to reading',
    saveAria: 'Save chapter changes',
  },
  'es-ES': {
    screenLabel: 'Pantalla 6 — Editor Móvil',
    kicker: 'Modo edición',
    editChapterTitle: (num) => `Editar Cap. ${num}`,
    hint: 'Toca el texto para escribir. Para dictar, usa el micrófono del teclado.',
    docAria: (num) => `Texto del Capítulo ${num} en edición`,
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
        const text = (node.textContent ?? '')
          .split(ZWSP)
          .join('')
          .replace(/\u00A0/g, ' ');
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
  if (!node) return null;
  if (node === root) {
    const last = root.lastElementChild;
    return last instanceof HTMLElement && last.tagName !== 'BR' ? last : null;
  }
  let current: Node | null = node;
  while (current && current.parentNode !== root) {
    current = current.parentNode;
  }
  return current instanceof HTMLElement && current.tagName !== 'BR' ? current : null;
}

/**
 * Garante que um nó solto na raiz (ex.: Text node direto em `docRef` ou `docRef` vazio)
 * esteja encapsulado em `<p>`, preservando exatamente a posição do cursor/seleção.
 */
function resolveOrNormalizeParagraph(
  root: HTMLElement,
  range: Range
): HTMLElement | null {
  const existing = paragraphOf(root, range.startContainer);
  if (existing && range.startContainer !== root) {
    return existing;
  }

  // Caso 1: Texto solto diretamente sob `root` -> envolve em <p> mantendo offsets
  if (
    range.startContainer.nodeType === Node.TEXT_NODE &&
    range.startContainer.parentNode === root
  ) {
    const textNode = range.startContainer as Text;
    const startOff = range.startOffset;
    const endIsSame = range.endContainer === textNode;
    const endOff = range.endOffset;
    const p = document.createElement('p');
    p.style.textAlign = 'left';
    root.insertBefore(p, textNode);
    p.appendChild(textNode);

    const sel = window.getSelection();
    if (sel) {
      const nextRange = document.createRange();
      nextRange.setStart(textNode, startOff);
      if (endIsSame) {
        nextRange.setEnd(textNode, endOff);
      } else {
        nextRange.collapse(true);
      }
      sel.removeAllRanges();
      sel.addRange(nextRange);
      range.setStart(nextRange.startContainer, nextRange.startOffset);
      range.setEnd(nextRange.endContainer, nextRange.endOffset);
    }
    return p;
  }

  // Caso 1b: Cursor direto em um <br> solto na raiz -> substitui por <p><br></p>
  if (
    range.startContainer instanceof HTMLBRElement &&
    range.startContainer.parentNode === root
  ) {
    const p = document.createElement('p');
    p.style.textAlign = 'left';
    p.appendChild(document.createElement('br'));
    range.startContainer.replaceWith(p);
    const next = placeCaret(p, 0);
    if (next) {
      range.setStart(next.startContainer, next.startOffset);
      range.collapse(true);
    }
    return p;
  }

  // Caso 2: `root` vazio ou cursor direto em `root`
  if (range.startContainer === root) {
    const idx = Math.max(
      0,
      Math.min(range.startOffset, Math.max(0, root.childNodes.length - 1))
    );
    const candidate = root.childNodes[idx] ?? root.lastChild;
    if (candidate instanceof HTMLElement && candidate.tagName !== 'BR') {
      return candidate;
    }
    if (candidate instanceof HTMLBRElement) {
      const p = document.createElement('p');
      p.style.textAlign = 'left';
      p.appendChild(document.createElement('br'));
      candidate.replaceWith(p);
      const next = placeCaret(p, 0);
      if (next) {
        range.setStart(next.startContainer, next.startOffset);
        range.collapse(true);
      }
      return p;
    }
    if (candidate && candidate.nodeType === Node.TEXT_NODE) {
      const p = document.createElement('p');
      p.style.textAlign = 'left';
      root.insertBefore(p, candidate);
      p.appendChild(candidate);
      const next = placeCaret(candidate, (candidate.textContent ?? '').length);
      if (next) {
        range.setStart(next.startContainer, next.startOffset);
        range.collapse(true);
      }
      return p;
    }
  }

  const p = document.createElement('p');
  p.style.textAlign = 'left';
  p.appendChild(document.createElement('br'));
  root.appendChild(p);
  const next = placeCaret(p, 0);
  if (next) {
    range.setStart(next.startContainer, next.startOffset);
    range.collapse(true);
  }
  return p;
}

function findAnchorParagraph(root: HTMLElement): HTMLElement | null {
  const children = Array.from(root.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement
  );
  if (children.length === 0) return null;
  const forestIdx = children.findIndex((el) =>
    (el.textContent ?? '').toLowerCase().includes('floresta')
  );
  if (forestIdx > 0) {
    return children[forestIdx - 1];
  }
  return children[children.length - 1];
}

function findLastTextNode(el: HTMLElement): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  while (walker.nextNode()) {
    last = walker.currentNode as Text;
  }
  return last;
}

/** Remove marcadores `ZWSP` que já receberam texto real e tags de estilo vazias. */
function cleanupZwspInRoot(root: HTMLElement): void {
  const sel = window.getSelection();
  const activeRange =
    sel && sel.rangeCount > 0 && root.contains(sel.getRangeAt(0).startContainer)
      ? sel.getRangeAt(0)
      : null;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodesToClean: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.data.includes(ZWSP) && node.data.split(ZWSP).join('').length > 0) {
      nodesToClean.push(node);
    }
  }

  for (const node of nodesToClean) {
    const isStart = activeRange?.startContainer === node;
    const isEnd = activeRange?.endContainer === node;
    const oldStart = activeRange?.startOffset ?? 0;
    const oldEnd = activeRange?.endOffset ?? 0;

    const countBefore = (limit: number) =>
      (node.data.slice(0, limit).match(/\u200B/g) ?? []).length;

    const startShift = isStart ? countBefore(oldStart) : 0;
    const endShift = isEnd ? countBefore(oldEnd) : 0;

    node.data = node.data.split(ZWSP).join('');

    if (sel && activeRange && (isStart || isEnd)) {
      const updated = activeRange.cloneRange();
      if (isStart) {
        updated.setStart(node, Math.max(0, Math.min(oldStart - startShift, node.data.length)));
      }
      if (isEnd) {
        updated.setEnd(node, Math.max(0, Math.min(oldEnd - endShift, node.data.length)));
      }
      sel.removeAllRanges();
      sel.addRange(updated);
    }
  }

  // Remove tags de estilo órfãs vazias que não seguram o cursor atual
  const caretNode =
    sel && sel.rangeCount > 0 ? sel.getRangeAt(0).startContainer : null;
  root.querySelectorAll('b, strong, i, em, u').forEach((el) => {
    if (caretNode && el.contains(caretNode)) return;
    if ((el.textContent ?? '').length === 0 && !el.querySelector('br')) {
      el.remove();
    }
  });
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

function placeCaret(node: Node, offset: number): Range | null {
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return range;
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
  const {
    activeMobileChapter,
    updateSansaoChapter,
    navigateTo,
  } = usePrototype();

  const docRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const isComposingRef = useRef<boolean>(false);

  const [active, setActive] = useState<ActiveState>(INITIAL_STATE);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playerBlocks, setPlayerBlocks] = useState<MobileBlock[]>(
    activeMobileChapter.blocks
  );
  const audio = useSansaoAudio(playerBlocks);

  // Monta o texto ao abrir o editor (ou ao trocar o capítulo ativo); depois o DOM editável é dono do conteúdo.
  useLayoutEffect(() => {
    const root = docRef.current;
    if (!root) return;
    root.innerHTML = blocksToHtml(activeMobileChapter.blocks);
    setPlayerBlocks(activeMobileChapter.blocks);
    lastRangeRef.current = null;
    setActive(INITIAL_STATE);
    try {
      document.execCommand('defaultParagraphSeparator', false, 'p');
      document.execCommand('styleWithCSS', false, 'false');
    } catch {
      /* navegadores sem suporte simplesmente ignoram */
    }
  }, [activeMobileChapter.id]);

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
    const querySelectedStyle = (key: StyleKey): boolean => {
      if (!range.collapsed) {
        try {
          if (document.queryCommandState(key)) return true;
        } catch {
          /* fallback para inspeção do ancestral */
        }
      }
      return Boolean(styleAncestor(range.startContainer, key, para));
    };
    setActive({
      bold: querySelectedStyle('bold'),
      italic: querySelectedStyle('italic'),
      underline: querySelectedStyle('underline'),
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

  /**
   * Devolve a seleção atual do texto, restaura a última conhecida se o foco saiu,
   * ou inicializa o cursor ao final do parágrafo-âncora se o usuário ainda não tocou no texto.
   */
  const ensureRange = (): Range | null => {
    const root = docRef.current;
    if (!root) return null;
    const current = selectionInside(root);
    if (current) return current;

    const saved = lastRangeRef.current;
    if (saved && root.contains(saved.commonAncestorContainer)) {
      root.focus({ preventScroll: true });
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(saved);
      return saved;
    }

    // Sem seleção prévia: inicializa no fim do parágrafo-âncora (ou cria um se vazio)
    let anchor = findAnchorParagraph(root);
    if (!anchor) {
      // Caso haja texto solto direto sob `root`, normaliza antes de posicionar
      const bareText = Array.from(root.childNodes).find(
        (n): n is Text => n.nodeType === Node.TEXT_NODE && Boolean(n.textContent?.trim())
      );
      anchor = document.createElement('p');
      anchor.style.textAlign = 'left';
      if (bareText) {
        root.insertBefore(anchor, bareText);
        anchor.appendChild(bareText);
      } else {
        anchor.appendChild(document.createElement('br'));
        root.appendChild(anchor);
      }
    }

    root.focus({ preventScroll: true });
    const lastText = findLastTextNode(anchor);
    const initialized = lastText
      ? placeCaret(lastText, lastText.data.length)
      : placeCaret(anchor, anchor.childNodes.length);
    if (initialized) {
      lastRangeRef.current = initialized.cloneRange();
    }
    return initialized;
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

    const para = resolveOrNormalizeParagraph(root, range);
    if (!para) return;
    const activeRange = selectionInside(root) ?? range;
    const ancestor = styleAncestor(activeRange.startContainer, key, para);

    if (!ancestor) {
      // Liga o estilo: o que vier a seguir (digitado ou ditado) entra dentro dele.
      const el = document.createElement(STYLE_TAG[key]);
      const holder = document.createTextNode(ZWSP);
      el.appendChild(holder);

      if (
        activeRange.startContainer.nodeType === Node.TEXT_NODE &&
        activeRange.startContainer.textContent === ZWSP
      ) {
        (activeRange.startContainer as Text).replaceWith(el);
      } else {
        activeRange.insertNode(el);
      }
      const next = placeCaret(holder, 1);
      if (next) lastRangeRef.current = next.cloneRange();
    } else {
      // Desliga o estilo: se nada foi digitado ainda dentro da tag, apenas desembrulha sem deixar lixo.
      const inner = styleChainBetween(activeRange.startContainer, ancestor);
      const ancestorHasRealText =
        (ancestor.textContent ?? '').split(ZWSP).join('').length > 0;

      const holder = document.createTextNode(ZWSP);
      let wrapper: ChildNode = holder;
      for (const el of inner) {
        const clone = el.cloneNode(false) as ChildNode;
        clone.appendChild(wrapper);
        wrapper = clone;
      }

      if (!ancestorHasRealText) {
        ancestor.replaceWith(wrapper);
      } else {
        const rest = document.createRange();
        rest.setStart(activeRange.startContainer, activeRange.startOffset);
        rest.setEndAfter(ancestor);
        const restFragment = rest.extractContents();

        ancestor.after(wrapper);
        const restText = (restFragment.textContent ?? '').split(ZWSP).join('');
        if (restText) {
          wrapper.after(restFragment);
        }
      }
      const next = placeCaret(holder, 1);
      if (next) lastRangeRef.current = next.cloneRange();
    }
    refreshActive();
  };

  const handleSetAlign = (align: TextAlign) => {
    const root = docRef.current;
    const range = ensureRange();
    if (!root || !range) return;
    const para = resolveOrNormalizeParagraph(root, range);
    const activeRange = selectionInside(root) ?? range;
    if (para) {
      para.style.textAlign = align;
    }
    Array.from(root.children).forEach((child) => {
      if (child instanceof HTMLElement && activeRange.intersectsNode(child)) {
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
      (range && resolveOrNormalizeParagraph(root, range)) ||
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
    const caret = placeCaret(next, 0);
    if (caret) lastRangeRef.current = caret.cloneRange();
    refreshActive();
  };

  const handleTogglePlayer = () => {
    if (!isPlayerOpen && docRef.current) {
      setPlayerBlocks(htmlToBlocks(docRef.current));
    }
    setIsPlayerOpen((open) => !open);
  };

  /** Salva o capítulo e volta à leitura com a mesma velocidade (`R6`, HTA 5). */
  const handleSave = () => {
    const root = docRef.current;
    if (!root) return;
    const parsedBlocks = htmlToBlocks(root);
    const finalBlocks: MobileBlock[] =
      parsedBlocks.length > 0
        ? parsedBlocks
        : [
            {
              id: `mob-blk-${Date.now()}-empty`,
              text: ' ',
              bold: false,
              italic: false,
              underline: false,
              align: 'left',
              isSeparator: false,
            },
          ];
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

  const handleDocInput = () => {
    if (isComposingRef.current) return;
    const root = docRef.current;
    if (root) {
      const range = selectionInside(root);
      if (range) {
        resolveOrNormalizeParagraph(root, range);
      }
      // Remove <br> solto diretamente sob root se houver parágrafos ou normaliza em <p>
      Array.from(root.childNodes).forEach((child) => {
        if (child instanceof HTMLBRElement) {
          if (root.querySelector('p')) {
            child.remove();
          } else {
            const p = document.createElement('p');
            p.style.textAlign = 'left';
            p.appendChild(document.createElement('br'));
            child.replaceWith(p);
            const caret = placeCaret(p, 0);
            if (caret) lastRangeRef.current = caret.cloneRange();
          }
        }
      });
      // Remove classe mobile-native-sep clonada por Enter ao sair de um separador ***
      root.querySelectorAll('p').forEach((p) => {
        const cleanText = (p.textContent ?? '').split(ZWSP).join('').trim();
        if (p.classList.contains('mobile-native-sep') && cleanText !== '***') {
          p.classList.remove('mobile-native-sep');
          if (p.style.textAlign === 'center') {
            p.style.textAlign = 'left';
          }
        }
      });
      cleanupZwspInRoot(root);
    }
    refreshActive();
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    handleDocInput();
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

  const chapterHeaderTitle =
    activeMobileChapter.chapterNumber === 9
      ? t.mobile.editorTitle
      : extra.editChapterTitle(activeMobileChapter.chapterNumber);

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
          <span className="mobile-header-chapter">{chapterHeaderTitle}</span>
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
          aria-label={extra.docAria(activeMobileChapter.chapterNumber)}
          lang={storyLangToHtmlLang(activeMobileChapter.language)}
          spellCheck
          autoCapitalize="sentences"
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onInput={handleDocInput}
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
