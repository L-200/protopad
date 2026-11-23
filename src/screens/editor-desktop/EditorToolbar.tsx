/**
 * @fileoverview Barra de formatação fixa permanente do Editor Desktop (Tela 4).
 * Implementa visibilidade contínua sem seleção prévia (`R11`), tooltips em PT-BR com
 * atalhos no hover e no foco (`R12`), estado ativo com `aria-pressed` (`R13`), divisão
 * em 2 grupos com separador vertical para inserção de mídia/separador/enquete (`R14`),
 * rótulos simples com ícones (`R16`) e navegação completa por teclado (`Tab`, setas,
 * `Home` e `End`) preservando a seleção do `contentEditable`.
 */
import React, { useRef } from 'react';
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  HeadingIcon,
  ImageIcon,
  ItalicIcon,
  PollIcon,
  SceneSeparatorIcon,
  UnderlineIcon,
  VideoIcon,
} from '../../components/shared/Icons';
import { useTranslation } from '../../i18n/useTranslation';
import { SiteLanguage, TextAlign } from '../../types/prototype';

/** Estado consolidado das formatações ativas no cursor ou seleção do editor. */
export interface ActiveEditorFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  heading: boolean;
}

/** Comandos de formatação inline suportados via barra ou atalhos `Ctrl+B/I/U`. */
export type InlineFormatCommand = 'bold' | 'italic' | 'underline';

interface EditorToolbarProps {
  activeFormats: ActiveEditorFormats;
  onToggleInlineFormat: (command: InlineFormatCommand, fromKeyboardButton?: boolean) => void;
  onChangeAlign: (align: TextAlign) => void;
  onToggleHeading: () => void;
  onOpenImageModal: () => void;
  onOpenVideoModal: () => void;
  onInsertSeparator: () => void;
  onOpenPollModal: () => void;
  onToolbarFocusAnnounce: (message: string) => void;
}

interface ToolbarItemConfig {
  id: string;
  group: 1 | 2;
  label: string;
  tooltip: string;
  icon: React.ReactNode;
  isToggle?: boolean;
  pressed?: boolean;
  focusAnnouncement: string;
  onActivate: (fromKeyboard: boolean) => void;
}

const TOOLBAR_EXTRA_STRINGS: Record<
  SiteLanguage,
  {
    on: string;
    off: string;
    headingFocus: string;
    sceneFocus: string;
    group1Aria: string;
    group2Aria: string;
  }
> = {
  'pt-BR': {
    on: 'ativado',
    off: 'desativado',
    headingFocus: 'Título ou subtítulo',
    sceneFocus: 'Inserir separador de cena centralizado',
    group1Aria: 'Formatação de texto e alinhamento',
    group2Aria: 'Inserção de mídia e elementos no capítulo',
  },
  'en-US': {
    on: 'on',
    off: 'off',
    headingFocus: 'Heading or subtitle',
    sceneFocus: 'Insert centered scene break',
    group1Aria: 'Text formatting and alignment',
    group2Aria: 'Insert media and chapter elements',
  },
  'es-ES': {
    on: 'activado',
    off: 'desactivado',
    headingFocus: 'Título o subtítulo',
    sceneFocus: 'Insertar separador de escena centrado',
    group1Aria: 'Formato de texto y alineación',
    group2Aria: 'Inserción de medios y elementos del capítulo',
  },
};

/**
 * Toolbar ARIA (`role="toolbar"`) dividida em Grupo 1 (estilo/alinhamento) e Grupo 2
 * (inserção de mídia, separador de cena e enquete).
 * Usa `onMouseDown` com `preventDefault()` para evitar perda de foco/seleção no texto
 * ao clicar com o mouse, enquanto anuncia o estado ao receber foco via teclado.
 */
export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeFormats,
  onToggleInlineFormat,
  onChangeAlign,
  onToggleHeading,
  onOpenImageModal,
  onOpenVideoModal,
  onInsertSeparator,
  onOpenPollModal,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = TOOLBAR_EXTRA_STRINGS[siteLanguage];
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointerDownRef = useRef<boolean>(false);

  const items: ToolbarItemConfig[] = [
    {
      id: 'negrito',
      group: 1,
      label: t.editor.bold,
      tooltip: t.editor.boldTooltip,
      icon: <BoldIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.bold,
      focusAnnouncement: `${t.editor.boldTooltip}, ${
        activeFormats.bold ? extra.on : extra.off
      }`,
      onActivate: (fromKeyboard) => onToggleInlineFormat('bold', fromKeyboard),
    },
    {
      id: 'italico',
      group: 1,
      label: t.editor.italic,
      tooltip: t.editor.italicTooltip,
      icon: <ItalicIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.italic,
      focusAnnouncement: `${t.editor.italicTooltip}, ${
        activeFormats.italic ? extra.on : extra.off
      }`,
      onActivate: (fromKeyboard) => onToggleInlineFormat('italic', fromKeyboard),
    },
    {
      id: 'sublinhado',
      group: 1,
      label: t.editor.underline,
      tooltip: t.editor.underlineTooltip,
      icon: <UnderlineIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.underline,
      focusAnnouncement: `${t.editor.underlineTooltip}, ${
        activeFormats.underline ? extra.on : extra.off
      }`,
      onActivate: (fromKeyboard) => onToggleInlineFormat('underline', fromKeyboard),
    },
    {
      id: 'alinhar-esquerda',
      group: 1,
      label: t.editor.alignLeft,
      tooltip: t.editor.alignLeftTooltip,
      icon: <AlignLeftIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.align === 'left',
      focusAnnouncement: `${t.editor.alignLeftTooltip}, ${
        activeFormats.align === 'left' ? extra.on : extra.off
      }`,
      onActivate: () => onChangeAlign('left'),
    },
    {
      id: 'alinhar-centro',
      group: 1,
      label: t.editor.alignCenter,
      tooltip: t.editor.alignCenterTooltip,
      icon: <AlignCenterIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.align === 'center',
      focusAnnouncement: `${t.editor.alignCenterTooltip}, ${
        activeFormats.align === 'center' ? extra.on : extra.off
      }`,
      onActivate: () => onChangeAlign('center'),
    },
    {
      id: 'alinhar-direita',
      group: 1,
      label: t.editor.alignRight,
      tooltip: t.editor.alignRightTooltip,
      icon: <AlignRightIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.align === 'right',
      focusAnnouncement: `${t.editor.alignRightTooltip}, ${
        activeFormats.align === 'right' ? extra.on : extra.off
      }`,
      onActivate: () => onChangeAlign('right'),
    },
    {
      id: 'titulo-subtitulo',
      group: 1,
      label: t.editor.heading,
      tooltip: t.editor.headingTooltip,
      icon: <HeadingIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.heading,
      focusAnnouncement: `${extra.headingFocus}, ${
        activeFormats.heading ? extra.on : extra.off
      }`,
      onActivate: () => onToggleHeading(),
    },
    {
      id: 'inserir-imagem',
      group: 2,
      label: t.editor.insertImage,
      tooltip: t.editor.insertImageTooltip,
      icon: <ImageIcon size={17} />,
      focusAnnouncement: t.editor.insertImageTooltip,
      onActivate: () => onOpenImageModal(),
    },
    {
      id: 'inserir-video',
      group: 2,
      label: t.editor.insertVideo,
      tooltip: t.editor.insertVideoTooltip,
      icon: <VideoIcon size={17} />,
      focusAnnouncement: t.editor.insertVideoTooltip,
      onActivate: () => onOpenVideoModal(),
    },
    {
      id: 'separador-cena',
      group: 2,
      label: t.editor.sceneBreak,
      tooltip: t.editor.sceneBreakTooltip,
      icon: <SceneSeparatorIcon size={17} />,
      focusAnnouncement: extra.sceneFocus,
      onActivate: () => onInsertSeparator(),
    },
    {
      id: 'adicionar-enquete',
      group: 2,
      label: t.editor.addPoll,
      tooltip: t.editor.addPollTooltip,
      icon: <PollIcon size={17} />,
      focusAnnouncement: t.editor.addPollTooltip,
      onActivate: () => onOpenPollModal(),
    },
  ];

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const total = items.length;
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % total;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + total) % total;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = total - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  const group1 = items.filter((item) => item.group === 1);
  const group2 = items.filter((item) => item.group === 2);

  const renderButton = (item: ToolbarItemConfig, globalIndex: number) => {
    const tooltipId = `editor-tooltip-${item.id}`;
    const isActive = Boolean(item.isToggle && item.pressed);

    return (
      <span
        key={item.id}
        className="tooltip-wrapper"
        data-tooltip-pos="bottom"
      >
        <button
          ref={(el) => {
            buttonRefs.current[globalIndex] = el;
          }}
          type="button"
          className={`editor-tool-btn ${
            item.group === 2 ? 'editor-tool-btn--insert' : ''
          } ${isActive ? 'is-active' : ''}`}
          aria-pressed={item.isToggle ? Boolean(item.pressed) : undefined}
          aria-describedby={tooltipId}
          onMouseDown={(e) => {
            // Preserva seleção/cursor no contentEditable durante clique com mouse
            pointerDownRef.current = true;
            e.preventDefault();
          }}
          onClick={(e) => {
            // e.detail === 0 indica ativação por teclado (Enter ou Espaço)
            const fromKeyboard = e.detail === 0;
            pointerDownRef.current = false;
            item.onActivate(fromKeyboard);
          }}
          onKeyDown={(e) => handleKeyDown(e, globalIndex)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
        <span id={tooltipId} role="tooltip" className="tooltip-bubble">
          {item.tooltip}
        </span>
      </span>
    );
  };

  return (
    <div className="editor-toolbar-container">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label={t.editor.toolbarAria}
      >
        <div
          className="editor-toolbar-group"
          role="group"
          aria-label={extra.group1Aria}
        >
          {group1.map((item, idx) => renderButton(item, idx))}
        </div>

        <div
          className="editor-toolbar-divider"
          role="separator"
          aria-orientation="vertical"
        />

        <div
          className="editor-toolbar-group"
          role="group"
          aria-label={extra.group2Aria}
        >
          {group2.map((item, idx) => renderButton(item, group1.length + idx))}
        </div>
      </div>
    </div>
  );
};
