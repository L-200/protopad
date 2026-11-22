/**
 * @fileoverview Tela 6 — Editor de Capítulo Mobile com Teclado Virtual (`390 × 844 px`).
 * Implementa:
 * - Barra de formatação horizontal ancorada acima do teclado virtual (`R20`) com alvos `>= 48 × 48 px` (`R19`),
 * - Formatação inline por segmento na mesma linha/parágrafo (`MobileTextSegment[]`): permite ativar
 *   `Sublinhado` (ou `Negrito`/`Itálico`), digitar/ditar um trecho e desativar na mesma linha sem
 *   afetar as palavras anteriores,
 * - Teclado QWERTY simulado com tecla **`⇧ Shift / Caps Lock`** funcional (`shift` -> `caps` -> `lower`),
 * - Botão **Ditado por voz** sempre funcional (acrescenta frases ditadas aplicando os modificadores
 *   ativos apenas ao trecho ditado, mesmo quando já há texto na linha),
 * - Player compacto expansível no topo para conferência de áudio sem dispensar o teclado (Cenário 4).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ChevronLeftIcon,
  CloseIcon,
  HeadphonesIcon,
  ItalicIcon,
  MicIcon,
  NextParagraphIcon,
  PauseIcon,
  PlayIcon,
  PrevParagraphIcon,
  SceneSeparatorIcon,
  SpeedIcon,
  UnderlineIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import {
  MobileBlock,
  MobileTextSegment,
  SiteLanguage,
  TextAlign,
} from '../../types/prototype';
import { formatLocalizedRate, MobileFrame } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';
import './MobileScreens.css';

interface ActiveStyleState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
}

type ShiftMode = 'shift' | 'caps' | 'lower';

const DEFAULT_STYLE: ActiveStyleState = {
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
};

const DICTATION_PHRASES: Record<SiteLanguage, string[]> = {
  'pt-BR': [
    'Caio soube naquele instante que não haveria volta se cruzasse a fronteira.',
    'O mapa dobrado no bolso pesava mais que a própria lâmina.',
    'Cada sombra entre os pinheiros parecia vigiar sua escolha.',
  ],
  'en-US': [
    'Caio knew in that instant there would be no turning back once he crossed the border.',
    'The folded map in his pocket weighed heavier than his blade.',
    'Every shadow among the pines seemed to watch his choice.',
  ],
  'es-ES': [
    'Caio supo en aquel instante que no habría vuelta atrás si cruzaba la frontera.',
    'El mapa doblado en su bolsillo pesaba más que su propia espada.',
    'Cada sombra entre los pinos parecía vigilar su elección.',
  ],
};

const QWERTY_ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const QWERTY_ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const QWERTY_ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

const MOBILE_EDITOR_STRINGS: Record<
  SiteLanguage,
  {
    screenLabel: string;
    cancelBackAria: string;
    editModeKicker: string;
    saveAria: string;
    collapseLabel: string;
    playNarrationAria: string;
    pauseNarrationAria: string;
    mainAria: string;
    contextHint: string;
    blocksCount: (n: number) => string;
    editParagraphAria: (n: number) => string;
    doneEditingBlockBtn: string;
    tapToEditAria: (n: number, text: string) => string;
    composerAria: string;
    cursorAfterLabel: string;
    editingBlockLabel: (n: number) => string;
    composerPlaceholder: string;
    composerTextAria: string;
    dictationListeningMsg: string;
    dictationDoneMsg: string;
    toolbarAria: string;
    keyboardAria: string;
    shiftAria: (mode: ShiftMode) => string;
    insertAsterisksAria: string;
    deleteCharAria: string;
    commaAria: string;
    periodAria: string;
    confirmLineAria: string;
  }
> = {
  'pt-BR': {
    screenLabel: 'Tela 6 — Editor Mobile',
    cancelBackAria: 'Cancelar edição e voltar à leitura',
    editModeKicker: 'Modo Edição',
    saveAria: 'Salvar alterações do capítulo',
    collapseLabel: 'Recolher',
    playNarrationAria: 'Reproduzir narração',
    pauseNarrationAria: 'Pausar narração',
    mainAria: 'Área de edição do Capítulo 9',
    contextHint: 'Toque em um parágrafo para editar ou escreva no cursor abaixo',
    blocksCount: (n) => `${n} blocos`,
    editParagraphAria: (n) => `Editar parágrafo ${n}`,
    doneEditingBlockBtn: 'Concluir edição deste parágrafo',
    tapToEditAria: (n, text) => `Parágrafo ${n}: ${text}. Toque para editar`,
    composerAria: 'Parágrafo em edição com formatação inline',
    cursorAfterLabel: 'Novo parágrafo após',
    editingBlockLabel: (n) => `Editando parágrafo ${n}`,
    composerPlaceholder: "Digite no teclado ou toque em 'Ditado por voz'...",
    composerTextAria: 'Texto do parágrafo em edição',
    dictationListeningMsg: 'Captando voz em Português...',
    dictationDoneMsg: 'Trecho ditado inserido com a formatação ativa.',
    toolbarAria: 'Barra de formatação inline e alinhamento',
    keyboardAria: 'Teclado virtual com Shift, Caps Lock e ditado por voz',
    shiftAria: (mode) =>
      mode === 'caps'
        ? 'Caps Lock ativado (toque para minúsculas)'
        : mode === 'shift'
          ? 'Shift ativado para próxima letra (toque para Caps Lock)'
          : 'Minúsculas (toque para Shift maiúscula)',
    insertAsterisksAria: 'Inserir separador de cena centralizado',
    deleteCharAria: 'Apagar caractere',
    commaAria: 'Vírgula',
    periodAria: 'Ponto final',
    confirmLineAria: 'Confirmar parágrafo e iniciar nova linha',
  },
  'en-US': {
    screenLabel: 'Screen 6 — Mobile Editor',
    cancelBackAria: 'Cancel editing and return to reader',
    editModeKicker: 'Edit Mode',
    saveAria: 'Save chapter changes',
    collapseLabel: 'Collapse',
    playNarrationAria: 'Play narration',
    pauseNarrationAria: 'Pause narration',
    mainAria: 'Chapter 9 editing area',
    contextHint: 'Tap a paragraph to edit or type at the cursor below',
    blocksCount: (n) => `${n} blocks`,
    editParagraphAria: (n) => `Edit paragraph ${n}`,
    doneEditingBlockBtn: 'Done editing this paragraph',
    tapToEditAria: (n, text) => `Paragraph ${n}: ${text}. Tap to edit`,
    composerAria: 'Paragraph being edited with inline formatting',
    cursorAfterLabel: 'New paragraph after',
    editingBlockLabel: (n) => `Editing paragraph ${n}`,
    composerPlaceholder: 'Type on keyboard or tap Voice dictation...',
    composerTextAria: 'Paragraph text being edited',
    dictationListeningMsg: 'Listening for voice input...',
    dictationDoneMsg: 'Dictated phrase inserted with active formatting.',
    toolbarAria: 'Inline formatting and alignment toolbar',
    keyboardAria: 'Virtual keyboard with Shift, Caps Lock, and voice dictation',
    shiftAria: (mode) =>
      mode === 'caps'
        ? 'Caps Lock active (tap for lowercase)'
        : mode === 'shift'
          ? 'Shift active for next letter (tap for Caps Lock)'
          : 'Lowercase (tap for Shift uppercase)',
    insertAsterisksAria: 'Insert centered scene break',
    deleteCharAria: 'Delete character',
    commaAria: 'Comma',
    periodAria: 'Period',
    confirmLineAria: 'Confirm paragraph and start new line',
  },
  'es-ES': {
    screenLabel: 'Pantalla 6 — Editor Móvil',
    cancelBackAria: 'Cancelar edición y volver a la lectura',
    editModeKicker: 'Modo Edición',
    saveAria: 'Guardar cambios del capítulo',
    collapseLabel: 'Contraer',
    playNarrationAria: 'Reproducir narración',
    pauseNarrationAria: 'Pausar narración',
    mainAria: 'Área de edición del Capítulo 9',
    contextHint: 'Toca un párrafo para editar o escribe en el cursor debajo',
    blocksCount: (n) => `${n} bloques`,
    editParagraphAria: (n) => `Editar párrafo ${n}`,
    doneEditingBlockBtn: 'Terminar edición de este párrafo',
    tapToEditAria: (n, text) => `Párrafo ${n}: ${text}. Toca para editar`,
    composerAria: 'Párrafo en edición con formato en línea',
    cursorAfterLabel: 'Nuevo párrafo tras',
    editingBlockLabel: (n) => `Editando párrafo ${n}`,
    composerPlaceholder: 'Escribe o usa el dictado por voz...',
    composerTextAria: 'Texto del párrafo en edición',
    dictationListeningMsg: 'Captando voz...',
    dictationDoneMsg: 'Frase dictada insertada con el formato activo.',
    toolbarAria: 'Barra de formato en línea y alineación',
    keyboardAria: 'Teclado virtual con Shift, Caps Lock y dictado por voz',
    shiftAria: (mode) =>
      mode === 'caps'
        ? 'Caps Lock activado (toca para minúsculas)'
        : mode === 'shift'
          ? 'Shift activado para la siguiente letra (toca para Caps Lock)'
          : 'Minúsculas (toca para Shift mayúscula)',
    insertAsterisksAria: 'Insertar separador de escena centrado',
    deleteCharAria: 'Borrar carácter',
    commaAria: 'Coma',
    periodAria: 'Punto',
    confirmLineAria: 'Confirmar párrafo y nueva línea',
  },
};

function findDefaultInsertionIndex(blocks: MobileBlock[]): number {
  if (blocks.length === 0) return -1;
  const forestIdx = blocks.findIndex((b) =>
    b.text.toLowerCase().includes('floresta')
  );
  if (forestIdx > 0) {
    return forestIdx - 1;
  }
  return Math.min(3, blocks.length - 1);
}

/** Concatena o texto plano de uma lista de segmentos inline. */
function segmentsToPlainText(segments: MobileTextSegment[]): string {
  return segments.map((s) => s.text).join('');
}

/** Converte um bloco existente em lista de segmentos inline preservando seus estilos. */
function blockToSegments(block: MobileBlock): MobileTextSegment[] {
  if (block.segments && block.segments.length > 0) {
    return block.segments.map((s) => ({ ...s }));
  }
  if (!block.text) return [];
  return [
    {
      text: block.text,
      bold: block.bold,
      italic: block.italic,
      underline: block.underline,
    },
  ];
}

/** Acrescenta texto ao último segmento se os estilos coincidirem, ou cria um novo segmento inline. */
function appendTextToSegments(
  segments: MobileTextSegment[],
  chunk: string,
  style: ActiveStyleState
): MobileTextSegment[] {
  if (!chunk) return segments;
  const last = segments[segments.length - 1];
  if (
    last &&
    Boolean(last.bold) === style.bold &&
    Boolean(last.italic) === style.italic &&
    Boolean(last.underline) === style.underline
  ) {
    const updated = [...segments];
    updated[updated.length - 1] = {
      ...last,
      text: last.text + chunk,
    };
    return updated;
  }
  return [
    ...segments,
    {
      text: chunk,
      bold: style.bold,
      italic: style.italic,
      underline: style.underline,
    },
  ];
}

/** Remove o último caractere da lista de segmentos inline. */
function removeLastCharFromSegments(
  segments: MobileTextSegment[]
): MobileTextSegment[] {
  if (segments.length === 0) return segments;
  const updated = [...segments];
  const last = updated[updated.length - 1];
  if (last.text.length > 1) {
    updated[updated.length - 1] = {
      ...last,
      text: last.text.slice(0, -1),
    };
    return updated;
  }
  updated.pop();
  return updated;
}

/** Renderiza os segmentos inline de um bloco ou compositor com Negrito, Itálico e Sublinhado por trecho. */
function renderInlineSegments(
  segments: MobileTextSegment[],
  keyPrefix: string
): React.ReactNode {
  return segments.map((seg, idx) => (
    <span
      key={`${keyPrefix}-seg-${idx}`}
      style={{
        fontWeight: seg.bold ? 700 : 400,
        fontStyle: seg.italic ? 'italic' : 'normal',
        textDecoration: seg.underline ? 'underline' : 'none',
      }}
    >
      {seg.text}
    </span>
  ));
}

/**
 * Editor mobile do Cap. 9 com suporte a formatação inline por trecho na mesma linha,
 * tecla Shift/Caps Lock no teclado virtual e ditado por voz contínuo.
 */
export const MobileEditorScreen: React.FC = () => {
  const { t, siteLanguage } = useTranslation();
  const extra = MOBILE_EDITOR_STRINGS[siteLanguage];
  const { sansaoChapter, updateSansaoChapter, navigateTo } = usePrototype();

  const [draftBlocks, setDraftBlocks] = useState<MobileBlock[]>(() =>
    sansaoChapter.blocks.map((b) => ({
      ...b,
      segments: b.segments ? b.segments.map((s) => ({ ...s })) : undefined,
    }))
  );
  const [insertAfterIndex, setInsertAfterIndex] = useState<number>(() =>
    findDefaultInsertionIndex(sansaoChapter.blocks)
  );
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [composerSegments, setComposerSegments] = useState<MobileTextSegment[]>(
    []
  );
  const [activeStyle, setActiveStyle] =
    useState<ActiveStyleState>(DEFAULT_STYLE);
  const [shiftMode, setShiftMode] = useState<ShiftMode>('shift');
  const [isCompactPlayerExpanded, setIsCompactPlayerExpanded] =
    useState<boolean>(false);
  const [dictationState, setDictationState] = useState<
    'idle' | 'listening' | 'done'
  >('idle');
  const [dictationCount, setDictationCount] = useState<number>(0);

  const composerBoxRef = useRef<HTMLDivElement | null>(null);
  const dictationTimerRef = useRef<number | null>(null);

  const composerPlainText = segmentsToPlainText(composerSegments);

  const {
    isPlaying,
    currentParagraph,
    totalParagraphs,
    playbackRate,
    progressPercent,
    togglePlay,
    prevParagraph,
    nextParagraph,
    cyclePlaybackRate,
  } = useSansaoAudio(draftBlocks);

  const localizedRate = formatLocalizedRate(playbackRate, siteLanguage);

  // Sincroniza quando o usuário clica em "Restaurar Cap. 9 inicial" no painel lateral
  useEffect(() => {
    if (!sansaoChapter.edited) {
      setDraftBlocks(
        sansaoChapter.blocks.map((b) => ({
          ...b,
          segments: b.segments ? b.segments.map((s) => ({ ...s })) : undefined,
        }))
      );
      setInsertAfterIndex(findDefaultInsertionIndex(sansaoChapter.blocks));
      setEditingBlockId(null);
      setComposerSegments([]);
      setActiveStyle(DEFAULT_STYLE);
      setShiftMode('shift');
      setDictationCount(0);
      setDictationState('idle');
    }
  }, [sansaoChapter.edited, sansaoChapter.blocks]);

  useEffect(() => {
    return () => {
      if (dictationTimerRef.current !== null) {
        window.clearTimeout(dictationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    composerBoxRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [insertAfterIndex, editingBlockId]);

  const buildBlockFromSegments = (
    segments: MobileTextSegment[],
    style: ActiveStyleState,
    forceSeparator = false
  ): MobileBlock => {
    const rawPlain = segmentsToPlainText(segments).trim();
    const isSep = forceSeparator || rawPlain === '***';
    if (isSep) {
      return {
        id: `mob-blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: '***',
        bold: false,
        italic: false,
        underline: false,
        align: 'center',
        isSeparator: true,
      };
    }

    const cleanedSegments = segments.filter((s) => s.text.length > 0);
    const allBold =
      cleanedSegments.length > 0 && cleanedSegments.every((s) => Boolean(s.bold));
    const allItalic =
      cleanedSegments.length > 0 &&
      cleanedSegments.every((s) => Boolean(s.italic));
    const allUnderline =
      cleanedSegments.length > 0 &&
      cleanedSegments.every((s) => Boolean(s.underline));

    return {
      id: `mob-blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: rawPlain,
      bold: allBold,
      italic: allItalic,
      underline: allUnderline,
      align: style.align,
      isSeparator: false,
      segments: cleanedSegments,
    };
  };

  /**
   * Converte os segmentos inline do compositor em um `MobileBlock` e insere
   * após `insertAfterIndex`.
   */
  const commitComposerBlock = (
    overrideSegments?: MobileTextSegment[],
    forceSeparator = false
  ) => {
    const segsToCommit = overrideSegments ?? composerSegments;
    const plain = segmentsToPlainText(segsToCommit).trim();
    if (!plain && !forceSeparator) {
      return draftBlocks;
    }
    const newBlock = buildBlockFromSegments(
      segsToCommit,
      activeStyle,
      forceSeparator
    );
    const nextBlocks = [...draftBlocks];
    const safeInsertPos = Math.max(
      0,
      Math.min(insertAfterIndex + 1, nextBlocks.length)
    );
    nextBlocks.splice(safeInsertPos, 0, newBlock);
    setDraftBlocks(nextBlocks);
    setInsertAfterIndex(safeInsertPos);
    setComposerSegments([]);
    setShiftMode('shift');
    return nextBlocks;
  };

  /**
   * Alterna um modificador inline (`bold`, `italic`, `underline`) para os PRÓXIMOS
   * caracteres digitados ou ditados na mesma linha, sem alterar os segmentos anteriores!
   */
  const handleToggleStyle = (key: 'bold' | 'italic' | 'underline') => {
    setActiveStyle((prev) => ({ ...prev, [key]: !prev[key] }));
    composerBoxRef.current?.focus();
  };

  const handleSetAlign = (align: TextAlign) => {
    setActiveStyle((prev) => ({ ...prev, align }));
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) => (b.id === editingBlockId ? { ...b, align } : b))
      );
    }
    composerBoxRef.current?.focus();
  };

  /** Alterna a tecla Shift entre `lower -> shift (1 letra) -> caps (fixo) -> lower`. */
  const handleToggleShift = () => {
    setShiftMode((prev) => {
      if (prev === 'lower') return 'shift';
      if (prev === 'shift') return 'caps';
      return 'lower';
    });
    composerBoxRef.current?.focus();
  };

  /** Insere texto aplicando o `activeStyle` atual apenas ao trecho recém-inserido. */
  const insertTextChunk = (rawChunk: string) => {
    if (!rawChunk) return;

    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== editingBlockId) return b;
          const nextSegs = appendTextToSegments(
            blockToSegments(b),
            rawChunk,
            activeStyle
          );
          const nextPlain = segmentsToPlainText(nextSegs);
          return {
            ...b,
            text: nextPlain,
            segments: nextSegs,
            isSeparator: nextPlain.trim() === '***',
          };
        })
      );
      return;
    }

    setComposerSegments((prev) =>
      appendTextToSegments(prev, rawChunk, activeStyle)
    );
  };

  /**
   * Comita eventual texto pendente no compositor e insere um bloco separador `***`
   * já centralizado logo em seguida (`R20`).
   */
  const handleInsertSeparator = () => {
    setEditingBlockId(null);
    let working = draftBlocks;
    let cursor = insertAfterIndex;
    if (composerPlainText.trim()) {
      const committed = buildBlockFromSegments(
        composerSegments,
        activeStyle,
        false
      );
      working = [...draftBlocks];
      const pos = Math.max(0, Math.min(cursor + 1, working.length));
      working.splice(pos, 0, committed);
      cursor = pos;
    }
    const sepBlock = buildBlockFromSegments(
      [{ text: '***' }],
      { ...activeStyle, align: 'center' },
      true
    );
    const sepPos = Math.max(0, Math.min(cursor + 1, working.length));
    const finalBlocks = [...working];
    finalBlocks.splice(sepPos, 0, sepBlock);
    setDraftBlocks(finalBlocks);
    setInsertAfterIndex(sepPos);
    setComposerSegments([]);
    setShiftMode('shift');
  };

  /**
   * Simula captação de voz em tempo real: funciona a qualquer momento (mesmo se já houver
   * palavras digitadas na linha), acrescentando a frase ditada com a formatação inline ativa
   * (`Itálico`, `Negrito`, `Sublinhado`) sem nunca substituir o texto por `***`.
   */
  const handleDictate = () => {
    if (dictationTimerRef.current !== null) {
      window.clearTimeout(dictationTimerRef.current);
    }
    setDictationState('listening');
    composerBoxRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });

    dictationTimerRef.current = window.setTimeout(() => {
      const phrases = DICTATION_PHRASES[siteLanguage];
      const phrase = phrases[dictationCount % phrases.length];

      const currentPlain = editingBlockId
        ? draftBlocks.find((b) => b.id === editingBlockId)?.text ?? ''
        : composerPlainText;
      const needsLeadingSpace =
        currentPlain.length > 0 && !/\s$/.test(currentPlain);
      const textToAppend = `${needsLeadingSpace ? ' ' : ''}${phrase}`;

      insertTextChunk(textToAppend);
      setDictationCount((c) => c + 1);
      setDictationState('done');
      setShiftMode('shift');
      composerBoxRef.current?.focus();
    }, 320);
  };

  const handleVirtualKey = (upperChar: string) => {
    const isUpper = shiftMode === 'shift' || shiftMode === 'caps';
    const charToInsert = isUpper
      ? upperChar.toUpperCase()
      : upperChar.toLowerCase();

    insertTextChunk(charToInsert);

    // Se estava em Shift de 1 letra, volta automaticamente para minúsculas após digitar
    if (shiftMode === 'shift') {
      setShiftMode('lower');
    }
  };

  const handleVirtualPunctuation = (symbol: string) => {
    insertTextChunk(symbol);
    // Após ponto final, ativa Shift automático para início da próxima frase
    if (symbol.includes('.')) {
      if (shiftMode === 'lower') {
        setShiftMode('shift');
      }
    }
  };

  const handleBackspace = () => {
    if (editingBlockId) {
      setDraftBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== editingBlockId) return b;
          const nextSegs = removeLastCharFromSegments(blockToSegments(b));
          const nextPlain = segmentsToPlainText(nextSegs);
          return {
            ...b,
            text: nextPlain,
            segments: nextSegs,
          };
        })
      );
      return;
    }

    setComposerSegments((prev) => {
      const next = removeLastCharFromSegments(prev);
      if (next.length === 0 && shiftMode === 'lower') {
        setShiftMode('shift');
      }
      return next;
    });
  };

  const handleNewLine = () => {
    if (editingBlockId) {
      const idx = draftBlocks.findIndex((b) => b.id === editingBlockId);
      if (idx >= 0) {
        setInsertAfterIndex(idx);
      }
      setEditingBlockId(null);
      setShiftMode('shift');
      return;
    }
    if (composerPlainText.trim()) {
      commitComposerBlock(composerSegments, false);
    }
  };

  /** Suporte também ao teclado físico do computador enquanto o compositor está focado. */
  const handlePhysicalKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleStyle('bold');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleToggleStyle('italic');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleToggleStyle('underline');
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewLine();
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (e.key === 'Shift') {
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      insertTextChunk(e.key);
      if (shiftMode === 'shift') {
        setShiftMode('lower');
      }
    }
  };

  /**
   * Persiste os blocos editados (incluindo o compositor pendente) no estado do Cap. 9
   * e retorna à Tela 5 preservando a velocidade global (`R6`, `R19`, `R20`).
   */
  const handleSave = () => {
    let finalBlocks = draftBlocks;
    if (composerPlainText.trim()) {
      finalBlocks = commitComposerBlock(composerSegments, false);
    }
    updateSansaoChapter((prev) => ({
      ...prev,
      blocks: finalBlocks,
      edited: true,
      currentParagraph: Math.max(
        1,
        Math.min(prev.currentParagraph, finalBlocks.length)
      ),
    }));
    navigateTo('tela_5_leitura_mobile');
  };

  const handleSelectBlock = (block: MobileBlock, index: number) => {
    if (editingBlockId === block.id) {
      setEditingBlockId(null);
      setInsertAfterIndex(index);
      return;
    }
    setInsertAfterIndex(index);
    const segs = blockToSegments(block);
    const lastSeg = segs[segs.length - 1];
    setActiveStyle({
      bold: lastSeg ? Boolean(lastSeg.bold) : block.bold,
      italic: lastSeg ? Boolean(lastSeg.italic) : block.italic,
      underline: lastSeg ? Boolean(lastSeg.underline) : block.underline,
      align: block.align,
    });
    setEditingBlockId(block.id);
  };

  const activeStyleLabels: string[] = [];
  if (activeStyle.bold) activeStyleLabels.push(t.mobile.bold);
  if (activeStyle.italic) activeStyleLabels.push(t.mobile.italic);
  if (activeStyle.underline) activeStyleLabels.push(t.mobile.underline);
  activeStyleLabels.push(
    activeStyle.align === 'center'
      ? t.mobile.center
      : activeStyle.align === 'right'
        ? t.mobile.right
        : t.mobile.left
  );

  const isKeyUppercase = shiftMode === 'shift' || shiftMode === 'caps';

  return (
    <MobileFrame screenLabel={extra.screenLabel}>
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-touch-btn"
          aria-label={extra.cancelBackAria}
          onClick={() => navigateTo('tela_5_leitura_mobile')}
        >
          <ChevronLeftIcon size={18} />
          <span>{t.mobile.backToReader}</span>
        </button>

        <div className="mobile-header-titles">
          <span className="mobile-header-story">{extra.editModeKicker}</span>
          <span className="mobile-header-chapter">{t.mobile.editorTitle}</span>
        </div>

        <button
          type="button"
          className={`mobile-touch-btn ${
            isCompactPlayerExpanded ? 'mobile-touch-btn--active' : ''
          }`.trim()}
          aria-expanded={isCompactPlayerExpanded}
          aria-label={
            isCompactPlayerExpanded
              ? t.mobile.collapsePlayerAria
              : t.mobile.expandPlayerAria
          }
          onClick={() => setIsCompactPlayerExpanded((open) => !open)}
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

      {/* Player compacto expansível sem fechar o teclado virtual (R19) */}
      {isCompactPlayerExpanded && (
        <section
          className="mobile-compact-player-drawer"
          aria-label={t.mobile.compactPlayerTitle}
        >
          <div className="mobile-progress-track" aria-hidden="true">
            <div
              className="mobile-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mobile-compact-player-header">
            <div className="mobile-audio-meta-left">
              <LanguageBadge language="pt" showIcon={false} />
              <span className="mobile-audio-counter">
                {t.mobile.paragraphOf(currentParagraph, totalParagraphs)}
              </span>
            </div>
            <button
              type="button"
              className="mobile-compact-close-btn"
              aria-label={t.mobile.collapsePlayerAria}
              onClick={() => setIsCompactPlayerExpanded(false)}
            >
              <CloseIcon size={14} />
              <span>{extra.collapseLabel}</span>
            </button>
          </div>

          <div className="mobile-audio-controls">
            <button
              type="button"
              className="mobile-audio-btn mobile-audio-btn--primary"
              aria-pressed={isPlaying}
              aria-label={
                isPlaying ? extra.pauseNarrationAria : extra.playNarrationAria
              }
              onClick={togglePlay}
            >
              {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              <span>{isPlaying ? t.mobile.pause : t.mobile.play}</span>
            </button>

            <button
              type="button"
              className="mobile-audio-btn"
              aria-label={t.mobile.prevAria}
              onClick={prevParagraph}
            >
              <PrevParagraphIcon size={18} />
              <span>{t.mobile.prev}</span>
            </button>

            <button
              type="button"
              className="mobile-audio-btn"
              aria-label={t.mobile.nextAria}
              onClick={nextParagraph}
            >
              <NextParagraphIcon size={18} />
              <span>{t.mobile.next}</span>
            </button>

            <button
              type="button"
              className="mobile-audio-btn mobile-audio-btn--rate"
              aria-label={t.mobile.speedAria(localizedRate)}
              onClick={cyclePlaybackRate}
            >
              <SpeedIcon size={16} />
              <span>{localizedRate}</span>
            </button>
          </div>
        </section>
      )}

      <main className="mobile-editor-scroll" aria-label={extra.mainAria}>
        <div className="mobile-editor-context-hint">
          <span>{extra.contextHint}</span>
          <span>{extra.blocksCount(draftBlocks.length)}</span>
        </div>

        {draftBlocks.map((block, index) => {
          const isEditingThis = editingBlockId === block.id;
          const isAnchor = index === insertAfterIndex;
          const isPlayingThis = index + 1 === currentParagraph;
          const isSep = Boolean(
            block.isSeparator || block.text.trim() === '***'
          );
          const blockSegs = blockToSegments(block);

          return (
            <React.Fragment key={block.id}>
              {isEditingThis ? (
                <div
                  className="mobile-editor-composer"
                  aria-label={extra.editParagraphAria(index + 1)}
                >
                  <div className="mobile-editor-composer-top">
                    <span>{extra.editingBlockLabel(index + 1)}</span>
                    <span className="mobile-style-chips">
                      {activeStyleLabels.map((lbl) => (
                        <span key={lbl} className="mobile-style-chip">
                          {lbl}
                        </span>
                      ))}
                    </span>
                  </div>

                  <div
                    ref={composerBoxRef}
                    tabIndex={0}
                    role="textbox"
                    aria-multiline="true"
                    aria-label={extra.editParagraphAria(index + 1)}
                    className="mobile-composer-rich-box"
                    style={{ textAlign: block.align }}
                    onKeyDown={handlePhysicalKeyDown}
                  >
                    {renderInlineSegments(blockSegs, block.id)}
                    <span
                      className="mobile-caret-indicator"
                      aria-hidden="true"
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '6px',
                    }}
                  >
                    <button
                      type="button"
                      className="mobile-kbd-action-btn"
                      style={{ minHeight: '40px', padding: '0 12px' }}
                      onClick={() => {
                        setEditingBlockId(null);
                        setInsertAfterIndex(index);
                      }}
                    >
                      {extra.doneEditingBlockBtn}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={`mobile-editor-block ${
                    isAnchor ? 'mobile-editor-block--anchor' : ''
                  } ${isPlayingThis ? 'mobile-editor-block--playing' : ''}`.trim()}
                  style={{
                    textAlign: block.align,
                    letterSpacing: isSep ? '0.25em' : undefined,
                  }}
                  aria-label={extra.tapToEditAria(index + 1, block.text)}
                  onClick={() => handleSelectBlock(block, index)}
                >
                  {block.segments && block.segments.length > 0
                    ? renderInlineSegments(block.segments, block.id)
                    : (
                        <span
                          style={{
                            fontWeight: block.bold ? 700 : 400,
                            fontStyle: block.italic ? 'italic' : 'normal',
                            textDecoration: block.underline
                              ? 'underline'
                              : 'none',
                          }}
                        >
                          {block.text}
                        </span>
                      )}
                </button>
              )}

              {isAnchor && !editingBlockId && (
                <div
                  className="mobile-editor-composer"
                  aria-label={extra.composerAria}
                >
                  <div className="mobile-editor-composer-top">
                    <span>
                      {extra.cursorAfterLabel} {index + 1}
                      {(index === 3 ||
                        block.text.toLowerCase().includes('estalajadeiro')) &&
                        ` ${t.mobile.tavernaEndTag}`}
                    </span>
                    <span className="mobile-style-chips">
                      {activeStyleLabels.map((lbl) => (
                        <span key={lbl} className="mobile-style-chip">
                          {lbl}
                        </span>
                      ))}
                    </span>
                  </div>

                  <div
                    ref={composerBoxRef}
                    tabIndex={0}
                    role="textbox"
                    aria-multiline="true"
                    aria-label={extra.composerTextAria}
                    className="mobile-composer-rich-box"
                    style={{ textAlign: activeStyle.align }}
                    onKeyDown={handlePhysicalKeyDown}
                    onClick={() => composerBoxRef.current?.focus()}
                  >
                    {composerSegments.length > 0 ? (
                      <>
                        {renderInlineSegments(composerSegments, 'composer')}
                        <span
                          className="mobile-caret-indicator"
                          aria-hidden="true"
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className="mobile-caret-indicator"
                          aria-hidden="true"
                        />
                        <span className="mobile-composer-placeholder">
                          {extra.composerPlaceholder}
                        </span>
                      </>
                    )}
                  </div>

                  {dictationState !== 'idle' && (
                    <div className="mobile-dictation-status" role="status">
                      <MicIcon size={14} />
                      <span>
                        {dictationState === 'listening'
                          ? extra.dictationListeningMsg
                          : extra.dictationDoneMsg}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </main>

      {/* Barra de formatação horizontal ancorada acima do teclado virtual (R20) */}
      <div
        className="mobile-format-toolbar-wrap"
        role="toolbar"
        aria-label={extra.toolbarAria}
      >
        <div className="mobile-format-toolbar">
          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.bold}
            aria-label={t.mobile.bold}
            onClick={() => handleToggleStyle('bold')}
          >
            <BoldIcon size={18} />
            <span>{t.mobile.bold}</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.italic}
            aria-label={t.mobile.italic}
            onClick={() => handleToggleStyle('italic')}
          >
            <ItalicIcon size={18} />
            <span>{t.mobile.italic}</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.underline}
            aria-label={t.mobile.underline}
            onClick={() => handleToggleStyle('underline')}
          >
            <UnderlineIcon size={18} />
            <span>{t.mobile.underline}</span>
          </button>

          <span className="mobile-format-divider" aria-hidden="true" />

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.align === 'left'}
            aria-label={t.editor.alignLeftTooltip}
            onClick={() => handleSetAlign('left')}
          >
            <AlignLeftIcon size={18} />
            <span>{t.mobile.left}</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.align === 'center'}
            aria-label={t.editor.alignCenterTooltip}
            onClick={() => handleSetAlign('center')}
          >
            <AlignCenterIcon size={18} />
            <span>{t.mobile.center}</span>
          </button>

          <button
            type="button"
            className="mobile-format-btn"
            aria-pressed={activeStyle.align === 'right'}
            aria-label={t.editor.alignRightTooltip}
            onClick={() => handleSetAlign('right')}
          >
            <AlignRightIcon size={18} />
            <span>{t.mobile.right}</span>
          </button>

          <span className="mobile-format-divider" aria-hidden="true" />

          <button
            type="button"
            className="mobile-format-btn"
            aria-label={t.editor.sceneBreakTooltip}
            onClick={handleInsertSeparator}
          >
            <SceneSeparatorIcon size={18} />
            <span>{t.mobile.separatorBtn} ***</span>
          </button>
        </div>
      </div>

      {/* Teclado virtual simulado sempre aberto na edição */}
      <section className="mobile-keyboard" aria-label={extra.keyboardAria}>
        <div className="mobile-keyboard-actions">
          <button
            type="button"
            className={`mobile-dictate-btn ${
              dictationState === 'listening'
                ? 'mobile-dictate-btn--listening'
                : ''
            }`.trim()}
            onClick={handleDictate}
          >
            <MicIcon size={18} />
            <span>
              {dictationState === 'listening'
                ? t.mobile.voiceDictating
                : t.mobile.voiceDictationBtn}
            </span>
          </button>

          <button
            type="button"
            className="mobile-kbd-action-btn"
            aria-label={t.mobile.newLineBtn}
            onClick={handleNewLine}
          >
            <span>↵ {t.mobile.newLineBtn}</span>
          </button>

          <button
            type="button"
            className="mobile-kbd-action-btn"
            aria-label={extra.insertAsterisksAria}
            onClick={handleInsertSeparator}
          >
            <span>{t.mobile.separatorShort}</span>
          </button>
        </div>

        <div className="mobile-kbd-row">
          {QWERTY_ROW_1.map((key) => {
            const label = isKeyUppercase ? key : key.toLowerCase();
            return (
              <button
                key={key}
                type="button"
                className="mobile-kbd-key"
                onClick={() => handleVirtualKey(key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mobile-kbd-row">
          {QWERTY_ROW_2.map((key) => {
            const label = isKeyUppercase ? key : key.toLowerCase();
            return (
              <button
                key={key}
                type="button"
                className="mobile-kbd-key"
                onClick={() => handleVirtualKey(key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="mobile-kbd-row">
          <button
            type="button"
            className={`mobile-kbd-key mobile-kbd-key--shift ${
              shiftMode === 'shift'
                ? 'mobile-kbd-key--shift-active'
                : shiftMode === 'caps'
                  ? 'mobile-kbd-key--caps-active'
                  : ''
            }`.trim()}
            aria-pressed={shiftMode !== 'lower'}
            aria-label={extra.shiftAria(shiftMode)}
            title={extra.shiftAria(shiftMode)}
            onClick={handleToggleShift}
          >
            <span>{shiftMode === 'caps' ? '⇪' : '⇧'}</span>
          </button>

          {QWERTY_ROW_3.map((key) => {
            const label = isKeyUppercase ? key : key.toLowerCase();
            return (
              <button
                key={key}
                type="button"
                className="mobile-kbd-key"
                onClick={() => handleVirtualKey(key)}
              >
                {label}
              </button>
            );
          })}

          <button
            type="button"
            className="mobile-kbd-key mobile-kbd-key--wide"
            aria-label={extra.deleteCharAria}
            onClick={handleBackspace}
          >
            ⌫
          </button>
        </div>

        <div className="mobile-kbd-row">
          <button
            type="button"
            className="mobile-kbd-key"
            aria-label={extra.commaAria}
            onClick={() => handleVirtualPunctuation(', ')}
          >
            ,
          </button>
          <button
            type="button"
            className="mobile-kbd-key mobile-kbd-key--space"
            onClick={() => handleVirtualPunctuation(' ')}
          >
            {t.mobile.spaceKey}
          </button>
          <button
            type="button"
            className="mobile-kbd-key"
            aria-label={extra.periodAria}
            onClick={() => handleVirtualPunctuation('.')}
          >
            .
          </button>
          <button
            type="button"
            className="mobile-kbd-key mobile-kbd-key--wide"
            aria-label={extra.confirmLineAria}
            onClick={handleNewLine}
          >
            ↵
          </button>
        </div>
      </section>
    </MobileFrame>
  );
};
