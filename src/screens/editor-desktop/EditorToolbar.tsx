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
import { TextAlign } from '../../types/prototype';

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
  onToolbarFocusAnnounce,
}) => {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointerDownRef = useRef<boolean>(false);

  const items: ToolbarItemConfig[] = [
    {
      id: 'negrito',
      group: 1,
      label: 'Negrito',
      tooltip: 'Negrito (Ctrl+B)',
      icon: <BoldIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.bold,
      focusAnnouncement: `Negrito (Ctrl+B), ${activeFormats.bold ? 'ativado' : 'desativado'}`,
      onActivate: (fromKeyboard) => onToggleInlineFormat('bold', fromKeyboard),
    },
    {
      id: 'italico',
      group: 1,
      label: 'Itálico',
      tooltip: 'Itálico (Ctrl+I)',
      icon: <ItalicIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.italic,
      focusAnnouncement: `Itálico (Ctrl+I), ${activeFormats.italic ? 'ativado' : 'desativado'}`,
      onActivate: (fromKeyboard) => onToggleInlineFormat('italic', fromKeyboard),
    },
    {
      id: 'sublinhado',
      group: 1,
      label: 'Sublinhado',
      tooltip: 'Sublinhado (Ctrl+U)',
      icon: <UnderlineIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.underline,
      focusAnnouncement: `Sublinhado (Ctrl+U), ${activeFormats.underline ? 'ativado' : 'desativado'}`,
      onActivate: (fromKeyboard) => onToggleInlineFormat('underline', fromKeyboard),
    },
    {
      id: 'alinhar-esquerda',
      group: 1,
      label: 'Esquerda',
      tooltip: 'Alinhar à esquerda',
      icon: <AlignLeftIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.align === 'left',
      focusAnnouncement: `Alinhar à esquerda, ${
        activeFormats.align === 'left' ? 'ativado' : 'desativado'
      }`,
      onActivate: () => onChangeAlign('left'),
    },
    {
      id: 'alinhar-centro',
      group: 1,
      label: 'Centro',
      tooltip: 'Centralizar texto',
      icon: <AlignCenterIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.align === 'center',
      focusAnnouncement: `Centralizar texto, ${
        activeFormats.align === 'center' ? 'ativado' : 'desativado'
      }`,
      onActivate: () => onChangeAlign('center'),
    },
    {
      id: 'alinhar-direita',
      group: 1,
      label: 'Direita',
      tooltip: 'Alinhar à direita',
      icon: <AlignRightIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.align === 'right',
      focusAnnouncement: `Alinhar à direita, ${
        activeFormats.align === 'right' ? 'ativado' : 'desativado'
      }`,
      onActivate: () => onChangeAlign('right'),
    },
    {
      id: 'titulo-subtitulo',
      group: 1,
      label: 'Título/Subtítulo',
      tooltip: 'Alternar título ou subtítulo',
      icon: <HeadingIcon size={17} />,
      isToggle: true,
      pressed: activeFormats.heading,
      focusAnnouncement: `Título ou subtítulo, ${
        activeFormats.heading ? 'ativado' : 'desativado'
      }`,
      onActivate: () => onToggleHeading(),
    },
    {
      id: 'inserir-imagem',
      group: 2,
      label: 'Inserir imagem',
      tooltip: 'Inserir imagem no capítulo',
      icon: <ImageIcon size={17} />,
      focusAnnouncement: 'Inserir imagem no capítulo',
      onActivate: () => onOpenImageModal(),
    },
    {
      id: 'inserir-video',
      group: 2,
      label: 'Inserir vídeo',
      tooltip: 'Inserir vídeo no capítulo',
      icon: <VideoIcon size={17} />,
      focusAnnouncement: 'Inserir vídeo no capítulo',
      onActivate: () => onOpenVideoModal(),
    },
    {
      id: 'separador-cena',
      group: 2,
      label: 'Separador de cena',
      tooltip: 'Inserir separador de cena (*** centralizado)',
      icon: <SceneSeparatorIcon size={17} />,
      focusAnnouncement: 'Inserir separador de cena centralizado',
      onActivate: () => onInsertSeparator(),
    },
    {
      id: 'adicionar-enquete',
      group: 2,
      label: 'Adicionar enquete',
      tooltip: 'Adicionar enquete ao final do capítulo',
      icon: <PollIcon size={17} />,
      focusAnnouncement: 'Adicionar enquete ao final do capítulo',
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
          onFocus={() => {
            if (!pointerDownRef.current) {
              onToolbarFocusAnnounce(item.focusAnnouncement);
            }
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
        aria-label="Barra de formatação do capítulo"
      >
        <div
          className="editor-toolbar-group"
          role="group"
          aria-label="Formatação de texto e alinhamento"
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
          aria-label="Inserção de mídia e elementos no capítulo"
        >
          {group2.map((item, idx) => renderButton(item, group1.length + idx))}
        </div>
      </div>
    </div>
  );
};
