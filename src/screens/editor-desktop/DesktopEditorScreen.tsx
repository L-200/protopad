/**
 * @fileoverview Tela 4 — Editor de Capítulos Desktop (Cenário 2 — Leonardo).
 * Implementa o editor por blocos `contentEditable` com barra de formatação fixa permanente
 * (`R11`), tooltips com atalhos em PT-BR (`R12`), estado ativo destacado com `aria-pressed`,
 * toggle sem seleção e preservação de seleção ao navegar por Tab (`R13`), inserção de mídia,
 * separador centralizado e enquete (`R14`), status/publicação integralmente em PT-BR (`R15`)
 * e rótulos simples com ícones (`R16`).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronLeftIcon,
  GlobeIcon,
  EyeIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  PollIcon,
  UndoIcon,
  UploadIcon,
  VideoIcon,
  ImageIcon,
} from '../../components/shared/Icons';
import { StoryCoverSvg } from '../../components/shared/StoryCoverSvg';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import {
  EditorBlock,
  SiteLanguage,
  StoryItem,
  TextAlign,
} from '../../types/prototype';
import {
  ChapterIllustrationSvg,
  ImageInsertModal,
  ImagePresetId,
  PollInsertModal,
  PreviewChapterModal,
  PublishChapterModal,
  VideoInsertModal,
} from './EditorModals';
import {
  ActiveEditorFormats,
  EditorToolbar,
  InlineFormatCommand,
} from './EditorToolbar';
import './DesktopEditorScreen.css';

const LEONARDO_STORY_META: StoryItem = {
  id: 'sombras-da-biblioteca',
  title: 'Sombras da Biblioteca',
  author: 'Leonardo',
  genre: 'Mistério',
  language: 'pt',
  reads: '4,8 mil',
  votes: '612',
  parts: 3,
  synopsis: 'Mistério em uma biblioteca antiga onde cada andar guarda um segredo.',
  tags: ['mistério', 'suspense', 'biblioteca'],
  coverPalette: {
    bgPrimary: '#1A2438',
    bgSecondary: '#2C3E5B',
    accent: '#FF6122',
    textColor: '#FFFFFF',
    motif: 'constellation',
  },
};

/**
 * Sanitiza HTML do bloco editável removendo `<script>` e atributos `on*`
 * antes de persistir ou sincronizar no DOM.
 */
function sanitizeEditorHtml(html: string): string {
  // Remove scripts ou manipuladores de eventos caso haja colagem externa
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}

/**
 * Percorre ancestrais DOM até `root` para verificar se o cursor está dentro de
 * alguma tag semântica de formatação (fallback quando `queryCommandState` falha).
 */
function hasAncestorTag(
  node: Node | null,
  root: HTMLElement,
  tags: string[]
): boolean {
  let curr: Node | null = node;
  while (curr && curr !== root) {
    if (curr.nodeType === Node.ELEMENT_NODE) {
      const tagName = (curr as HTMLElement).tagName.toUpperCase();
      if (tags.includes(tagName)) {
        return true;
      }
    }
    curr = curr.parentNode;
  }
  return false;
}

/**
 * Consulta o estado real da formatação inline (`bold`, `italic`, `underline`) na
 * seleção atual combinando `document.queryCommandState` e inspeção da árvore DOM.
 */
function queryInlineFormatState(
  command: InlineFormatCommand,
  blockEl: HTMLElement | null
): boolean {
  let state = false;
  try {
    state = document.queryCommandState(command);
  } catch {
    state = false;
  }
  if (state) return true;

  if (!blockEl) return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !blockEl.contains(sel.anchorNode)) {
    return false;
  }

  const tagMap: Record<InlineFormatCommand, string[]> = {
    bold: ['B', 'STRONG'],
    italic: ['I', 'EM'],
    underline: ['U'],
  };
  return hasAncestorTag(sel.anchorNode, blockEl, tagMap[command]);
}

function createBlockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const EDITOR_EXTRA_STRINGS: Record<
  SiteLanguage,
  {
    headingAria: string;
    paragraphAria: string;
    headingPlaceholder: string;
    paragraphPlaceholder: string;
    headerAria: string;
    alignNvda: Record<TextAlign, string>;
    headingOnNvda: string;
    headingOffNvda: string;
    blockRemovedNvda: (label: string) => string;
    draftRestoredNvda: string;
    paperAria: string;
    paperTitleAria: string;
    chapterLangLine: string;
    centeredSceneBreak: string;
    imageBadge: string;
    removeImage: string;
    imageNoun: string;
    chapterIllustrationAlt: string;
    videoBadge: string;
    removeVideo: string;
    videoNoun: string;
    videoFallbackTitle: string;
    videoPlayingMeta: string;
    videoIdleMeta: string;
    pollBadge: string;
    removePoll: string;
    pollNoun: string;
    pollFallbackQuestion: string;
    pollVotedEditor: string;
    pollHintEditor: string;
  }
> = {
  'pt-BR': {
    headingAria: 'Subtítulo do capítulo',
    paragraphAria: 'Parágrafo do capítulo',
    headingPlaceholder: 'Escreva o subtítulo aqui...',
    paragraphPlaceholder: 'Escreva seu texto aqui...',
    headerAria: 'Cabeçalho do editor',
    alignNvda: {
      left: 'Alinhado à esquerda',
      center: 'Alinhado ao centro',
      right: 'Alinhado à direita',
    },
    headingOnNvda: 'Formato de subtítulo ativado',
    headingOffNvda: 'Formato de parágrafo restaurado',
    blockRemovedNvda: (label) => `${label} removido.`,
    draftRestoredNvda: 'Rascunho inicial restaurado.',
    paperAria: 'Área de escrita do capítulo',
    paperTitleAria: 'Título principal do capítulo no rascunho',
    chapterLangLine: 'Idioma do capítulo: Português',
    centeredSceneBreak: 'Separador de cena centralizado',
    imageBadge: 'Imagem do capítulo',
    removeImage: 'Remover imagem',
    imageNoun: 'Imagem',
    chapterIllustrationAlt: 'Ilustração do capítulo',
    videoBadge: 'Vídeo / Trilha do capítulo',
    removeVideo: 'Remover vídeo',
    videoNoun: 'Vídeo',
    videoFallbackTitle: 'Trilha sonora do capítulo',
    videoPlayingMeta: 'Reproduzindo prévia simulada • 00:42 / 02:14',
    videoIdleMeta: 'Mídia incorporada • 02:14',
    pollBadge: 'Enquete para os leitores',
    removePoll: 'Remover enquete',
    pollNoun: 'Enquete',
    pollFallbackQuestion: 'Enquete do capítulo',
    pollVotedEditor: 'Prévia de votação simulada registrada.',
    pollHintEditor: 'Clique em uma opção para testar a resposta dos leitores.',
  },
  'en-US': {
    headingAria: 'Chapter subtitle',
    paragraphAria: 'Chapter paragraph',
    headingPlaceholder: 'Write subtitle here...',
    paragraphPlaceholder: 'Write your text here...',
    headerAria: 'Editor header',
    alignNvda: {
      left: 'Aligned left',
      center: 'Aligned center',
      right: 'Aligned right',
    },
    headingOnNvda: 'Subtitle format on',
    headingOffNvda: 'Paragraph format restored',
    blockRemovedNvda: (label) => `${label} removed.`,
    draftRestoredNvda: 'Initial draft restored.',
    paperAria: 'Chapter writing area',
    paperTitleAria: 'Main chapter title in draft',
    chapterLangLine: 'Chapter language: Portuguese',
    centeredSceneBreak: 'Centered scene break',
    imageBadge: 'Chapter image',
    removeImage: 'Remove image',
    imageNoun: 'Image',
    chapterIllustrationAlt: 'Chapter illustration',
    videoBadge: 'Chapter video / soundtrack',
    removeVideo: 'Remove video',
    videoNoun: 'Video',
    videoFallbackTitle: 'Chapter soundtrack',
    videoPlayingMeta: 'Playing simulated preview • 00:42 / 02:14',
    videoIdleMeta: 'Embedded media • 02:14',
    pollBadge: 'Reader poll',
    removePoll: 'Remove poll',
    pollNoun: 'Poll',
    pollFallbackQuestion: 'Chapter poll',
    pollVotedEditor: 'Simulated preview vote recorded.',
    pollHintEditor: 'Click an option to test reader response.',
  },
  'es-ES': {
    headingAria: 'Subtítulo del capítulo',
    paragraphAria: 'Párrafo del capítulo',
    headingPlaceholder: 'Escribe el subtítulo aquí...',
    paragraphPlaceholder: 'Escribe tu texto aquí...',
    headerAria: 'Encabezado del editor',
    alignNvda: {
      left: 'Alineado a la izquierda',
      center: 'Alineado al centro',
      right: 'Alineado a la derecha',
    },
    headingOnNvda: 'Formato de subtítulo activado',
    headingOffNvda: 'Formato de párrafo restaurado',
    blockRemovedNvda: (label) => `${label} eliminado.`,
    draftRestoredNvda: 'Borrador inicial restaurado.',
    paperAria: 'Área de escritura del capítulo',
    paperTitleAria: 'Título principal del capítulo en el borrador',
    chapterLangLine: 'Idioma del capítulo: Portugués',
    centeredSceneBreak: 'Separador de escena centrado',
    imageBadge: 'Imagen del capítulo',
    removeImage: 'Eliminar imagen',
    imageNoun: 'Imagen',
    chapterIllustrationAlt: 'Ilustración del capítulo',
    videoBadge: 'Vídeo / Banda sonora del capítulo',
    removeVideo: 'Eliminar vídeo',
    videoNoun: 'Vídeo',
    videoFallbackTitle: 'Banda sonora del capítulo',
    videoPlayingMeta: 'Reproduciendo vista previa simulada • 00:42 / 02:14',
    videoIdleMeta: 'Multimedia incorporado • 02:14',
    pollBadge: 'Encuesta para lectores',
    removePoll: 'Eliminar encuesta',
    pollNoun: 'Encuesta',
    pollFallbackQuestion: 'Encuesta del capítulo',
    pollVotedEditor: 'Voto simulado registrado en la vista previa.',
    pollHintEditor: 'Haz clic en una opción para probar la respuesta de los lectores.',
  },
};

/* --------------------------------------------------------------------------
   Subcomponente de Bloco Editável sem Salto de Cursor
   -------------------------------------------------------------------------- */
interface EditableBlockProps {
  block: EditorBlock;
  isFocused: boolean;
  registerRef: (blockId: string, el: HTMLDivElement | null) => void;
  onFocusBlock: (blockId: string) => void;
  onMouseDownBlock: (blockId: string) => void;
  onBeforeInputBlock: (blockId: string) => void;
  onInputHtml: (blockId: string, html: string) => void;
  onKeyDownBlock: (
    e: React.KeyboardEvent<HTMLDivElement>,
    block: EditorBlock
  ) => void;
  onSelectionCheck: (blockId: string) => void;
}

/**
 * Bloco `contentEditable` controlado com proteção contra salto de cursor.
 * Evita sobrescrever `innerHTML` enquanto o valor emitido pelo próprio bloco coincidir
 * com `lastCommittedHtmlRef`, só atualizando o DOM em mudanças externas (ex.: restaurar rascunho).
 */
const EditableBlock: React.FC<EditableBlockProps> = ({
  block,
  isFocused,
  registerRef,
  onFocusBlock,
  onMouseDownBlock,
  onBeforeInputBlock,
  onInputHtml,
  onKeyDownBlock,
  onSelectionCheck,
}) => {
  const { siteLanguage } = useTranslation();
  const extra = EDITOR_EXTRA_STRINGS[siteLanguage];
  const elRef = useRef<HTMLDivElement | null>(null);
  const lastCommittedHtmlRef = useRef<string>(block.html);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    el.innerHTML = block.html;
    lastCommittedHtmlRef.current = block.html;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const currentDomHtml = sanitizeEditorHtml(el.innerHTML);
    if (
      block.html !== lastCommittedHtmlRef.current &&
      currentDomHtml !== block.html
    ) {
      el.innerHTML = block.html;
    }
    lastCommittedHtmlRef.current = block.html;
  }, [block.html]);

  const isHeading = block.type === 'heading';

  return (
    <div className={`editor-block-wrapper ${isFocused ? 'is-focused' : ''}`}>
      <div
        ref={(node) => {
          elRef.current = node;
          registerRef(block.id, node);
        }}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={isHeading ? extra.headingAria : extra.paragraphAria}
        data-placeholder={
          isHeading ? extra.headingPlaceholder : extra.paragraphPlaceholder
        }
        className={`editor-editable ${
          isHeading ? 'editor-editable--heading' : ''
        }`}
        style={{ textAlign: block.align }}
        onFocus={() => onFocusBlock(block.id)}
        onMouseDown={() => onMouseDownBlock(block.id)}
        onBeforeInput={() => onBeforeInputBlock(block.id)}
        onInput={(e) => {
          const clean = sanitizeEditorHtml(e.currentTarget.innerHTML);
          lastCommittedHtmlRef.current = clean;
          onInputHtml(block.id, clean);
          onSelectionCheck(block.id);
        }}
        onKeyDown={(e) => onKeyDownBlock(e, block)}
        onKeyUp={() => onSelectionCheck(block.id)}
        onMouseUp={() => onSelectionCheck(block.id)}
      />
    </div>
  );
};

/* --------------------------------------------------------------------------
   Tela Principal — Editor Desktop (Tela 4)
   -------------------------------------------------------------------------- */
/**
 * Tela 4 (Editor de Capítulos Desktop).
 * Coordena foco entre blocos editáveis, preservação de `Range` para acionamento via teclado
 * da barra, modos de formatação com e sem seleção (`pendingFormatsRef`) e inserções localizadas.
 */
export const DesktopEditorScreen: React.FC = () => {
  const { t, siteLanguage } = useTranslation();
  const extra = EDITOR_EXTRA_STRINGS[siteLanguage];
  const {
    leonardoDraft,
    updateLeonardoDraft,
    publishLeonardoChapter,
    resetLeonardoDraft,
    getLeonardoWordCount,
    navigateTo,
    announceNvda,
  } = usePrototype();

  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const savedRangeRef = useRef<{ blockId: string; range: Range } | null>(null);
  const pendingFormatsRef = useRef<
    Partial<Record<InlineFormatCommand, boolean>> | null
  >(null);
  const saveToastTimerRef = useRef<number | null>(null);

  const firstEditableId = useMemo(
    () =>
      leonardoDraft.blocks.find(
        (b) => b.type === 'paragraph' || b.type === 'heading'
      )?.id ?? null,
    [leonardoDraft.blocks]
  );

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(
    firstEditableId
  );
  const [activeFormats, setActiveFormats] = useState<ActiveEditorFormats>({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    heading: false,
  });

  const [saveToastVisible, setSaveToastVisible] = useState<boolean>(false);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);
  const [pollModalOpen, setPollModalOpen] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);

  // Votos simulados na prévia inline da enquete e vídeo no editor
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current !== null) {
        window.clearTimeout(saveToastTimerRef.current);
      }
    };
  }, []);

  // Garante que focusedBlockId sempre aponte para um bloco válido
  useEffect(() => {
    if (
      focusedBlockId &&
      leonardoDraft.blocks.some((b) => b.id === focusedBlockId)
    ) {
      return;
    }
    setFocusedBlockId(firstEditableId);
  }, [focusedBlockId, leonardoDraft.blocks, firstEditableId]);

  const registerBlockRef = useCallback(
    (blockId: string, el: HTMLDivElement | null) => {
      blockRefs.current[blockId] = el;
    },
    []
  );

  /**
   * Salva o `Range` ativo do bloco para restaurá-lo caso o usuário navegue via `Tab`
   * até a barra de formatação e acione um botão por teclado.
   */
  const captureCurrentRange = useCallback((blockId: string) => {
    const el = blockRefs.current[blockId];
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = {
        blockId,
        range: range.cloneRange(),
      };
    }
  }, []);

  /**
   * Atualiza o estado dos botões da toolbar com base no bloco focado e na seleção atual,
   * respeitando formatações pendentes de toggle sem seleção (`pendingFormatsRef`).
   */
  const syncFormatsFromBlockAndSelection = useCallback(
    (blockId: string | null) => {
      const targetBlock =
        leonardoDraft.blocks.find((b) => b.id === blockId) ??
        leonardoDraft.blocks.find(
          (b) => b.type === 'paragraph' || b.type === 'heading'
        );

      const el = targetBlock ? blockRefs.current[targetBlock.id] ?? null : null;
      const sel = window.getSelection();
      const selectionInBlock = Boolean(
        el &&
          sel &&
          sel.rangeCount > 0 &&
          el.contains(sel.anchorNode)
      );

      if (selectionInBlock && targetBlock) {
        captureCurrentRange(targetBlock.id);
        if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
          pendingFormatsRef.current = null;
        }
      }

      const pending = pendingFormatsRef.current;

      setActiveFormats({
        bold:
          pending?.bold !== undefined
            ? pending.bold
            : selectionInBlock
              ? queryInlineFormatState('bold', el)
              : false,
        italic:
          pending?.italic !== undefined
            ? pending.italic
            : selectionInBlock
              ? queryInlineFormatState('italic', el)
              : false,
        underline:
          pending?.underline !== undefined
            ? pending.underline
            : selectionInBlock
              ? queryInlineFormatState('underline', el)
              : false,
        align: targetBlock?.align ?? 'left',
        heading: targetBlock?.type === 'heading',
      });
    },
    [leonardoDraft.blocks, captureCurrentRange]
  );

  // Sincroniza barra quando usuário altera seleção via teclado/mouse dentro do documento
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const anchor = sel.anchorNode;
      if (!anchor) return;

      const matchedEntry = Object.entries(blockRefs.current).find(
        ([, el]) => el && el.contains(anchor)
      );
      if (matchedEntry) {
        const [matchedId] = matchedEntry;
        if (matchedId !== focusedBlockId) {
          setFocusedBlockId(matchedId);
        }
        syncFormatsFromBlockAndSelection(matchedId);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [focusedBlockId, syncFormatsFromBlockAndSelection]);

  const handleUpdateBlockHtml = useCallback(
    (blockId: string, html: string) => {
      updateLeonardoDraft((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === blockId ? { ...b, html } : b)),
      }));
    },
    [updateLeonardoDraft]
  );

  const announceInlineFormat = useCallback(
    (command: InlineFormatCommand, enabled: boolean) => {
      const labels: Record<InlineFormatCommand, string> = {
        bold: t.editor.bold,
        italic: t.editor.italic,
        underline: t.editor.underline,
      };
      announceNvda(
        enabled
          ? t.editor.nvdaActivated(labels[command])
          : t.editor.nvdaDeactivated(labels[command]),
        'editor'
      );
    },
    [announceNvda, t.editor]
  );

  /**
   * Alterna negrito, itálico ou sublinhado (`R13`), tratando dois fluxos:
   * 1) Seleção não colapsada (ou restaurada de `savedRangeRef` ao usar teclado na barra);
   * 2) Toggle sem seleção prévia (`pendingFormatsRef`), mantendo o foco no botão se
   *    acionado via teclado para não quebrar a navegação por Tab/setas.
   */
  const handleToggleInlineFormat = useCallback(
    (command: InlineFormatCommand, fromKeyboardButton = false) => {
      const activeButton = fromKeyboardButton
        ? (document.activeElement as HTMLElement | null)
        : null;

      const targetId = focusedBlockId ?? firstEditableId;
      const targetEl = targetId ? blockRefs.current[targetId] ?? null : null;
      const sel = window.getSelection();

      // Caso 1: Há seleção dentro do editor (ou seleção salva antes de usar Tab até a barra)
      let hasNonCollapsedSelection = Boolean(
        targetEl &&
          sel &&
          sel.rangeCount > 0 &&
          !sel.getRangeAt(0).collapsed &&
          targetEl.contains(sel.anchorNode)
      );

      if (
        !hasNonCollapsedSelection &&
        fromKeyboardButton &&
        savedRangeRef.current &&
        !savedRangeRef.current.range.collapsed
      ) {
        const saved = savedRangeRef.current;
        const savedEl = blockRefs.current[saved.blockId];
        if (savedEl && sel) {
          savedEl.focus();
          sel.removeAllRanges();
          sel.addRange(saved.range);
          hasNonCollapsedSelection = true;
        }
      }

      if (hasNonCollapsedSelection) {
        pendingFormatsRef.current = null;
        document.execCommand(command, false);

        const activeBlockId =
          Object.entries(blockRefs.current).find(
            ([, el]) =>
              el && sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)
          )?.[0] ?? targetId;

        const finalEl = activeBlockId
          ? blockRefs.current[activeBlockId] ?? null
          : targetEl;

        if (activeBlockId && finalEl) {
          const updatedHtml = sanitizeEditorHtml(finalEl.innerHTML);
          captureCurrentRange(activeBlockId);
          handleUpdateBlockHtml(activeBlockId, updatedHtml);
        }

        const nextBold = queryInlineFormatState('bold', finalEl);
        const nextItalic = queryInlineFormatState('italic', finalEl);
        const nextUnderline = queryInlineFormatState('underline', finalEl);

        setActiveFormats((prev) => ({
          ...prev,
          bold: nextBold,
          italic: nextItalic,
          underline: nextUnderline,
        }));

        const commandStateMap: Record<InlineFormatCommand, boolean> = {
          bold: nextBold,
          italic: nextItalic,
          underline: nextUnderline,
        };
        announceInlineFormat(command, commandStateMap[command]);

        if (fromKeyboardButton && activeButton) {
          activeButton.focus();
        }
        return;
      }

      // Caso 2: Modo Toggle Sem Seleção (Variação 1 do Cenário 2)
      const nextValue = !activeFormats[command];
      pendingFormatsRef.current = {
        ...(pendingFormatsRef.current ?? {}),
        [command]: nextValue,
      };

      // Se clicado com mouse e nenhum bloco estiver focado ainda, foca o bloco-alvo ao final
      if (!fromKeyboardButton && targetEl) {
        if (document.activeElement !== targetEl) {
          targetEl.focus();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(targetEl);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        const nativeNow = queryInlineFormatState(command, targetEl);
        if (nativeNow !== nextValue) {
          document.execCommand(command, false);
        }
      }

      setActiveFormats((prev) => ({
        ...prev,
        [command]: nextValue,
      }));
      announceInlineFormat(command, nextValue);
    },
    [
      focusedBlockId,
      firstEditableId,
      activeFormats,
      handleUpdateBlockHtml,
      captureCurrentRange,
      announceInlineFormat,
    ]
  );

  /**
   * Aplica formatações pendentes (`pendingFormatsRef`) imediatamente antes do primeiro
   * caractere digitado quando o usuário ativou o estilo sem seleção prévia (`R13`).
   */
  const handleBeforeInputBlock = useCallback(
    (blockId: string) => {
      const pending = pendingFormatsRef.current;
      if (!pending) return;

      const el = blockRefs.current[blockId];
      if (!el) return;

      (['bold', 'italic', 'underline'] as InlineFormatCommand[]).forEach(
        (cmd) => {
          const desired = pending[cmd];
          if (desired === undefined) return;
          const actual = queryInlineFormatState(cmd, el);
          if (actual !== desired) {
            document.execCommand(cmd, false);
          }
        }
      );

      pendingFormatsRef.current = null;
    },
    []
  );

  const handleFocusBlock = useCallback(
    (blockId: string) => {
      setFocusedBlockId(blockId);
      syncFormatsFromBlockAndSelection(blockId);
    },
    [syncFormatsFromBlockAndSelection]
  );

  const handleMouseDownBlock = useCallback((blockId: string) => {
    // Se o foco estava fora dos blocos editáveis (ex.: botão da barra acionado por teclado),
    // preserva os formatos pendentes até o usuário digitar ou fazer uma seleção real (R13).
    const activeEl = document.activeElement;
    const isFocusInsideEditableBlock = Object.values(blockRefs.current).some(
      (el) => Boolean(el && activeEl && el.contains(activeEl))
    );
    if (isFocusInsideEditableBlock) {
      pendingFormatsRef.current = null;
    }
    setFocusedBlockId(blockId);
  }, []);

  const handleChangeAlign = useCallback(
    (align: TextAlign) => {
      const targetId = focusedBlockId ?? firstEditableId;
      if (!targetId) return;

      updateLeonardoDraft((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === targetId ? { ...b, align } : b
        ),
      }));

      setActiveFormats((prev) => ({ ...prev, align }));

      announceNvda(extra.alignNvda[align], 'editor');
    },
    [focusedBlockId, firstEditableId, updateLeonardoDraft, announceNvda, extra]
  );

  const handleToggleHeading = useCallback(() => {
    const targetId = focusedBlockId ?? firstEditableId;
    if (!targetId) return;

    let nextIsHeading = false;
    updateLeonardoDraft((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== targetId) return b;
        if (b.type !== 'paragraph' && b.type !== 'heading') return b;
        nextIsHeading = b.type === 'paragraph';
        return {
          ...b,
          type: nextIsHeading ? 'heading' : 'paragraph',
        };
      }),
    }));

    setActiveFormats((prev) => ({ ...prev, heading: nextIsHeading }));
    announceNvda(
      nextIsHeading ? extra.headingOnNvda : extra.headingOffNvda,
      'editor'
    );
  }, [focusedBlockId, firstEditableId, updateLeonardoDraft, announceNvda, extra]);

  const handleKeyDownBlock = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, block: EditorBlock) => {
      // Atalhos Ctrl+B / Ctrl+I / Ctrl+U (Variação 3 do Cenário 2)
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const lower = e.key.toLowerCase();
        if (lower === 'b') {
          e.preventDefault();
          handleToggleInlineFormat('bold', false);
          return;
        }
        if (lower === 'i') {
          e.preventDefault();
          handleToggleInlineFormat('italic', false);
          return;
        }
        if (lower === 'u') {
          e.preventDefault();
          handleToggleInlineFormat('underline', false);
          return;
        }
      }

      // Se tecla de navegação é pressionada, limpa formato pendente de toggle
      // (Home/End mantêm o formato pendente ao posicionar o cursor no início/fim da linha)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        pendingFormatsRef.current = null;
        return;
      }

      // Enter divide o bloco em um novo parágrafo limpo
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const el = blockRefs.current[block.id];
        const sel = window.getSelection();
        let beforeHtml = el ? el.innerHTML : block.html;
        let afterHtml = '';

        if (el && sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const tailRange = document.createRange();
          tailRange.setStart(range.endContainer, range.endOffset);
          tailRange.setEnd(el, el.childNodes.length);
          const frag = tailRange.extractContents();
          const temp = document.createElement('div');
          temp.appendChild(frag);
          afterHtml = sanitizeEditorHtml(temp.innerHTML);
          beforeHtml = sanitizeEditorHtml(el.innerHTML);
        }

        const newId = createBlockId('p');
        updateLeonardoDraft((prev) => {
          const idx = prev.blocks.findIndex((b) => b.id === block.id);
          const insertIdx = idx >= 0 ? idx + 1 : prev.blocks.length;
          const nextBlocks = [...prev.blocks];
          if (idx >= 0) {
            nextBlocks[idx] = { ...nextBlocks[idx], html: beforeHtml };
          }
          nextBlocks.splice(insertIdx, 0, {
            id: newId,
            type: 'paragraph',
            html: afterHtml,
            align: block.align,
          });
          return { ...prev, blocks: nextBlocks };
        });

        window.setTimeout(() => {
          const newEl = blockRefs.current[newId];
          if (newEl) {
            newEl.focus();
            setFocusedBlockId(newId);
          }
        }, 0);
        return;
      }

      // Backspace no bloco vazio remove o bloco e foca o anterior
      if (e.key === 'Backspace') {
        const el = blockRefs.current[block.id];
        if (!el) return;
        const textEmpty = (el.textContent ?? '').length === 0;
        const editableBlocks = leonardoDraft.blocks.filter(
          (b) => b.type === 'paragraph' || b.type === 'heading'
        );
        if (textEmpty && editableBlocks.length > 1) {
          e.preventDefault();
          const currentIdx = leonardoDraft.blocks.findIndex(
            (b) => b.id === block.id
          );
          const prevEditable = [...leonardoDraft.blocks.slice(0, currentIdx)]
            .reverse()
            .find((b) => b.type === 'paragraph' || b.type === 'heading');

          updateLeonardoDraft((prev) => ({
            ...prev,
            blocks: prev.blocks.filter((b) => b.id !== block.id),
          }));

          if (prevEditable) {
            window.setTimeout(() => {
              const prevEl = blockRefs.current[prevEditable.id];
              if (prevEl) {
                prevEl.focus();
                const range = document.createRange();
                range.selectNodeContents(prevEl);
                range.collapse(false);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
                setFocusedBlockId(prevEditable.id);
              }
            }, 0);
          }
        }
      }
    },
    [
      handleToggleInlineFormat,
      leonardoDraft.blocks,
      updateLeonardoDraft,
    ]
  );

  // Inserções do Grupo 2 (R14)
  const insertBlockAfterFocused = useCallback(
    (newBlock: EditorBlock, options?: { atTop?: boolean; atEnd?: boolean }) => {
      updateLeonardoDraft((prev) => {
        const nextBlocks = [...prev.blocks];
        if (options?.atTop) {
          nextBlocks.unshift(newBlock);
        } else if (options?.atEnd) {
          nextBlocks.push(newBlock);
        } else {
          const targetId = focusedBlockId ?? firstEditableId;
          const idx = nextBlocks.findIndex((b) => b.id === targetId);
          const insertIdx = idx >= 0 ? idx + 1 : nextBlocks.length;
          nextBlocks.splice(insertIdx, 0, newBlock);
        }
        return { ...prev, blocks: nextBlocks };
      });
    },
    [focusedBlockId, firstEditableId, updateLeonardoDraft]
  );

  const handleInsertSeparator = useCallback(() => {
    insertBlockAfterFocused({
      id: createBlockId('sep'),
      type: 'separator',
      html: '***',
      align: 'center',
    });
    announceNvda(t.editor.nvdaSceneInserted, 'editor');
  }, [insertBlockAfterFocused, announceNvda, t.editor]);

  const handleInsertImage = useCallback(
    (payload: {
      preset: ImagePresetId;
      caption: string;
      insertAtTop: boolean;
    }) => {
      insertBlockAfterFocused(
        {
          id: createBlockId('img'),
          type: 'image',
          html: '',
          align: 'center',
          meta: {
            imagePreset: payload.preset,
            caption: payload.caption || undefined,
          },
        },
        { atTop: payload.insertAtTop }
      );
      announceNvda(t.editor.nvdaImageInserted, 'editor');
    },
    [insertBlockAfterFocused, announceNvda, t.editor]
  );

  const handleInsertVideo = useCallback(
    (payload: { videoTitle: string; caption: string }) => {
      insertBlockAfterFocused({
        id: createBlockId('vid'),
        type: 'video',
        html: '',
        align: 'center',
        meta: {
          videoTitle: payload.videoTitle,
          caption: payload.caption || undefined,
        },
      });
      announceNvda(t.editor.nvdaVideoInserted, 'editor');
    },
    [insertBlockAfterFocused, announceNvda, t.editor]
  );

  const handleInsertPoll = useCallback(
    (payload: { question: string; options: string[] }) => {
      insertBlockAfterFocused(
        {
          id: createBlockId('poll'),
          type: 'poll',
          html: '',
          align: 'left',
          meta: {
            pollQuestion: payload.question,
            pollOptions: payload.options,
          },
        },
        { atEnd: true }
      );
      announceNvda(t.editor.nvdaPollInserted, 'editor');
    },
    [insertBlockAfterFocused, announceNvda, t.editor]
  );

  const handleRemoveBlock = useCallback(
    (blockId: string, label: string) => {
      updateLeonardoDraft((prev) => ({
        ...prev,
        blocks: prev.blocks.filter((b) => b.id !== blockId),
      }));
      announceNvda(extra.blockRemovedNvda(label), 'editor');
    },
    [updateLeonardoDraft, announceNvda, extra]
  );

  const handleManualSave = useCallback(() => {
    updateLeonardoDraft({ saveStatus: 'Salvo' });
    setSaveToastVisible(true);
    announceNvda(t.editor.nvdaDraftSaved, 'editor');
    if (saveToastTimerRef.current !== null) {
      window.clearTimeout(saveToastTimerRef.current);
    }
    saveToastTimerRef.current = window.setTimeout(() => {
      setSaveToastVisible(false);
    }, 3200);
  }, [updateLeonardoDraft, announceNvda, t.editor]);

  const wordCountText = getLeonardoWordCount(leonardoDraft).toLocaleString(
    t.locale
  );
  const displaySaveStatus =
    leonardoDraft.saveStatus === 'Salvando...'
      ? t.editor.savingStatus
      : t.editor.savedStatus;

  return (
    <div className="desktop-editor-page">
      {/* Header do Editor + Barra Fixa Permanente */}
      <div className="editor-sticky-chrome">
        <header className="editor-header" aria-label={extra.headerAria}>
          <div className="editor-header-inner">
            <div className="editor-header-left">
              <span className="tooltip-wrapper" data-tooltip-pos="bottom">
                <button
                  type="button"
                  className="editor-back-btn"
                  aria-label={t.editor.backToHomeAria}
                  onClick={() => navigateTo('tela_1_home')}
                >
                  <ChevronLeftIcon size={20} />
                </button>
                <span role="tooltip" className="tooltip-bubble">
                  {t.editor.backToHomeAria}
                </span>
              </span>

              <StoryCoverSvg
                story={LEONARDO_STORY_META}
                width={38}
                className="editor-cover-thumb"
                decorative
              />

              <div className="editor-title-meta">
                <div className="editor-story-kicker">
                  <span>{leonardoDraft.storyTitle}</span>
                  {leonardoDraft.published && (
                    <span className="editor-published-badge">
                      <CheckIcon size={13} />
                      {t.editor.publishedBadge}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  className="editor-chapter-input"
                  aria-label={t.editor.chapterTitleAria}
                  value={leonardoDraft.chapterTitle}
                  onChange={(e) =>
                    updateLeonardoDraft({ chapterTitle: e.target.value })
                  }
                  placeholder={t.editor.chapterTitleAria}
                />

                <div className="editor-status-line">
                  <span
                    className={`editor-status-dot ${
                      leonardoDraft.saveStatus === 'Salvando...'
                        ? 'is-saving'
                        : ''
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    {t.editor.draftWord} • {t.editor.wordsCount(wordCountText)} •{' '}
                    {displaySaveStatus}
                  </span>
                  {saveToastVisible && (
                    <span className="editor-save-toast" role="status">
                      <CheckIcon size={13} />
                      {t.editor.savedToast}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="editor-header-actions">
              <button
                type="button"
                className="btn-pill-secondary editor-action-btn"
                title={t.editor.checkLanguageTooltip}
                onClick={() => navigateTo('tela_2_idioma')}
              >
                <GlobeIcon size={16} />
                <span>{t.editor.checkLanguageBtn}</span>
              </button>

              <button
                type="button"
                className="btn-pill-secondary editor-action-btn"
                title={t.editor.previewTooltip}
                onClick={() => setPreviewModalOpen(true)}
              >
                <EyeIcon size={16} />
                <span>{t.editor.previewBtn}</span>
              </button>

              <button
                type="button"
                className="btn-pill-secondary editor-action-btn"
                title={t.editor.saveTooltip}
                onClick={handleManualSave}
              >
                <CheckIcon size={16} />
                <span>{t.editor.saveBtn}</span>
              </button>

              <button
                type="button"
                className="btn-pill-primary editor-action-btn"
                title={t.editor.publishTooltip}
                onClick={() => setPublishModalOpen(true)}
              >
                <UploadIcon size={16} />
                <span>{t.editor.publishBtn}</span>
              </button>
            </div>
          </div>
        </header>

        <EditorToolbar
          activeFormats={activeFormats}
          onToggleInlineFormat={handleToggleInlineFormat}
          onChangeAlign={handleChangeAlign}
          onToggleHeading={handleToggleHeading}
          onOpenImageModal={() => setImageModalOpen(true)}
          onOpenVideoModal={() => setVideoModalOpen(true)}
          onInsertSeparator={handleInsertSeparator}
          onOpenPollModal={() => setPollModalOpen(true)}
          onToolbarFocusAnnounce={(msg) => announceNvda(msg, 'editor')}
        />
      </div>

      {/* Área de Escrita Centralizada */}
      <div className="editor-workspace">
        <div className="editor-helper-banner">
          <div className="editor-helper-text">
            <InfoIcon size={18} />
            <span>{t.editor.scenarioGuide}</span>
          </div>
          <button
            type="button"
            className="editor-reset-btn"
            onClick={() => {
              resetLeonardoDraft();
              pendingFormatsRef.current = null;
              announceNvda(extra.draftRestoredNvda, 'editor');
            }}
          >
            <UndoIcon size={15} />
            <span>{t.editor.restoreDraftBtn}</span>
          </button>
        </div>

        <article
          className="editor-paper"
          aria-label={extra.paperAria}
        >
          <div className="editor-paper-header">
            <div className="editor-paper-story-label">
              {leonardoDraft.storyTitle}
            </div>
            <input
              type="text"
              className="editor-paper-title"
              aria-label={extra.paperTitleAria}
              value={leonardoDraft.chapterTitle}
              onChange={(e) =>
                updateLeonardoDraft({ chapterTitle: e.target.value })
              }
              placeholder={t.editor.chapterTitleAria}
            />
            <div className="editor-paper-subtitle">
              {t.editor.wordsCount(wordCountText)} • {extra.chapterLangLine}
            </div>
          </div>

          <div className="editor-blocks-list">
            {leonardoDraft.blocks.map((block) => {
              if (block.type === 'paragraph' || block.type === 'heading') {
                return (
                  <EditableBlock
                    key={block.id}
                    block={block}
                    isFocused={focusedBlockId === block.id}
                    registerRef={registerBlockRef}
                    onFocusBlock={handleFocusBlock}
                    onMouseDownBlock={handleMouseDownBlock}
                    onBeforeInputBlock={handleBeforeInputBlock}
                    onInputHtml={handleUpdateBlockHtml}
                    onKeyDownBlock={handleKeyDownBlock}
                    onSelectionCheck={syncFormatsFromBlockAndSelection}
                  />
                );
              }

              if (block.type === 'separator') {
                return (
                  <div
                    key={block.id}
                    className="editor-separator-block"
                    aria-label={extra.centeredSceneBreak}
                  >
                    <span className="editor-separator-line" aria-hidden="true" />
                    <span className="editor-separator-stars">***</span>
                    <span className="editor-separator-line" aria-hidden="true" />
                    <button
                      type="button"
                      className="editor-block-remove-btn"
                      onClick={() =>
                        handleRemoveBlock(block.id, t.editor.sceneBreakLabel)
                      }
                    >
                      {t.common.remove}
                    </button>
                  </div>
                );
              }

              if (block.type === 'image') {
                return (
                  <div key={block.id} className="editor-media-card">
                    <div className="editor-media-card-header">
                      <span className="editor-media-badge">
                        <ImageIcon size={16} />
                        {extra.imageBadge}
                      </span>
                      <button
                        type="button"
                        className="editor-block-remove-btn"
                        onClick={() => handleRemoveBlock(block.id, extra.imageNoun)}
                      >
                        {extra.removeImage}
                      </button>
                    </div>
                    <figure className="editor-image-figure">
                      <div className="editor-image-svg-frame">
                        <ChapterIllustrationSvg
                          preset={block.meta?.imagePreset}
                          altTitle={
                            block.meta?.caption || extra.chapterIllustrationAlt
                          }
                        />
                      </div>
                      {block.meta?.caption && (
                        <figcaption className="editor-image-caption">
                          {block.meta.caption}
                        </figcaption>
                      )}
                    </figure>
                  </div>
                );
              }

              if (block.type === 'video') {
                const isPlaying = playingVideoId === block.id;
                return (
                  <div key={block.id} className="editor-media-card">
                    <div className="editor-media-card-header">
                      <span className="editor-media-badge">
                        <VideoIcon size={16} />
                        {extra.videoBadge}
                      </span>
                      <button
                        type="button"
                        className="editor-block-remove-btn"
                        onClick={() => handleRemoveBlock(block.id, extra.videoNoun)}
                      >
                        {extra.removeVideo}
                      </button>
                    </div>
                    <div className="editor-video-box">
                      <div className="editor-video-screen">
                        <div className="editor-video-info">
                          <span className="editor-video-title">
                            {block.meta?.videoTitle || extra.videoFallbackTitle}
                          </span>
                          <span className="editor-video-meta">
                            {isPlaying
                              ? extra.videoPlayingMeta
                              : extra.videoIdleMeta}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="editor-video-play-btn"
                          onClick={() =>
                            setPlayingVideoId(isPlaying ? null : block.id)
                          }
                        >
                          {isPlaying ? (
                            <PauseIcon size={16} />
                          ) : (
                            <PlayIcon size={16} />
                          )}
                          <span>
                            {isPlaying ? t.reader.pauseLabel : t.reader.playLabel}
                          </span>
                        </button>
                      </div>
                      {block.meta?.caption && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {block.meta.caption}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              if (block.type === 'poll') {
                const options = block.meta?.pollOptions ?? [];
                const picked = pollVotes[block.id];
                return (
                  <div key={block.id} className="editor-media-card">
                    <div className="editor-media-card-header">
                      <span className="editor-media-badge">
                        <PollIcon size={16} />
                        {extra.pollBadge}
                      </span>
                      <button
                        type="button"
                        className="editor-block-remove-btn"
                        onClick={() => handleRemoveBlock(block.id, extra.pollNoun)}
                      >
                        {extra.removePoll}
                      </button>
                    </div>
                    <div className="editor-poll-card">
                      <h3 className="editor-poll-question">
                        {block.meta?.pollQuestion || extra.pollFallbackQuestion}
                      </h3>
                      <div className="editor-poll-options">
                        {options.map((opt, idx) => {
                          const isSelected = picked === idx;
                          const percent =
                            picked !== undefined
                              ? isSelected
                                ? Math.round(100 / options.length) + 14
                                : Math.max(
                                    8,
                                    Math.round(
                                      (100 -
                                        (Math.round(100 / options.length) +
                                          14)) /
                                        Math.max(1, options.length - 1)
                                    )
                                  )
                              : null;

                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`editor-poll-option-btn ${
                                isSelected ? 'is-selected' : ''
                              }`}
                              aria-pressed={isSelected}
                              onClick={() =>
                                setPollVotes((prev) => ({
                                  ...prev,
                                  [block.id]: idx,
                                }))
                              }
                            >
                              <span>{opt}</span>
                              {percent !== null && (
                                <span className="editor-poll-percent">
                                  {percent}%
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="editor-poll-footer">
                        {picked !== undefined
                          ? extra.pollVotedEditor
                          : extra.pollHintEditor}
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </article>
      </div>

      {/* Modais localizados */}
      <ImageInsertModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onConfirm={handleInsertImage}
      />

      <VideoInsertModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        onConfirm={handleInsertVideo}
      />

      <PollInsertModal
        isOpen={pollModalOpen}
        onClose={() => setPollModalOpen(false)}
        onConfirm={handleInsertPoll}
      />

      <PreviewChapterModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        draft={leonardoDraft}
        storyMeta={LEONARDO_STORY_META}
        wordCountText={wordCountText}
      />

      <PublishChapterModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        draft={leonardoDraft}
        wordCountText={wordCountText}
        onConfirmPublish={publishLeonardoChapter}
        onGoHome={() => navigateTo('tela_1_home')}
      />
    </div>
  );
};
