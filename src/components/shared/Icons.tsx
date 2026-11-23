/**
 * @fileoverview Biblioteca local de ícones SVG inline acessíveis do protótipo.
 * Todos os ícones utilizam `aria-hidden="true"` e `focusable="false"` para que leitores de tela
 * anunciem apenas os rótulos curtos e `aria-label` dos controles (R7, R16, R22), além de usar
 * `currentColor` para preservar contraste mínimo de 3:1 inclusive em Alto Contraste Escuro.
 */
import React from 'react';

/**
 * Propriedades compartilhadas pelos componentes de ícone SVG.
 */
export interface IconProps {
  /** Dimensão quadrada (largura e altura) em pixels. */
  size?: number;
  /** Classe CSS opcional aplicada ao elemento `<svg>`. */
  className?: string;
}

/**
 * Monta os atributos padrão de traço e ocultação na árvore de acessibilidade para ícones 24×24.
 *
 * @param size Tamanho em pixels.
 * @param className Classe CSS opcional.
 * @returns Objeto de props padronizadas para `<svg>`.
 */
const defaultSvgProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  focusable: false as const,
  className,
});

/** Marca gráfica estilizada do Wattpad utilizada no cabeçalho desktop e no cabeçalho mobile. */
export const WattpadMarkIcon: React.FC<IconProps> = ({ size = 28, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <rect width="32" height="32" rx="8" fill="#FF6122" />
    <path
      d="M5.5 10.5L9.8 22.5L13.7 13.5L17.6 22.5L21.9 10.5M23.5 10.5L26.5 17.5"
      stroke="#FFFFFF"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Lupa de pesquisa utilizada na barra de busca global do cabeçalho. */
export const SearchIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <circle cx="11" cy="11" r="7.5" />
    <path d="M20.5 20.5L16.5 16.5" />
  </svg>
);

/** Fone de ouvido que identifica o recurso unificado "Ouvir" (R8, R16). */
export const HeadphonesIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 14V12a8 8 0 0 1 16 0v2" />
    <rect x="3" y="13" width="4" height="7" rx="2" fill="currentColor" stroke="none" />
    <rect x="17" y="13" width="4" height="7" rx="2" fill="currentColor" stroke="none" />
  </svg>
);

/** Ícone de reprodução ("Reproduzir") exibido no player de áudio quando pausado (R1, R3, R22). */
export const PlayIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M7.5 5.25a.75.75 0 0 1 1.14-.64l10.5 6.75a.75.75 0 0 1 0 1.28l-10.5 6.75A.75.75 0 0 1 7.5 18.75V5.25Z" />
  </svg>
);

/** Ícone de pausa ("Pausar") exibido no player de áudio durante a reprodução (R1, R3, R22). */
export const PauseIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
  </svg>
);

/** Seta de retrocesso para "Voltar parágrafo" no player de áudio (R3, R5). */
export const PrevParagraphIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M6 6v12" />
    <path d="M18 6l-8 6 8 6V6z" fill="currentColor" stroke="none" />
  </svg>
);

/** Seta de avanço para "Avançar parágrafo" no player de áudio (R3, R5). */
export const NextParagraphIcon: React.FC<IconProps> = ({ size = 20, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M18 6v12" />
    <path d="M6 6l8 6-8 6V6z" fill="currentColor" stroke="none" />
  </svg>
);

/** Velocímetro do controle de velocidade de leitura do player (R3, R6). */
export const SpeedIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M12 14l4-4" />
    <path d="M3.34 17A9 9 0 1 1 20.66 17" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Globo que acompanha selos e configurações de idioma (R10, R17). */
export const GlobeIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
  </svg>
);

/** Seta para baixo usada em seletores e menus expansíveis. */
export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** Seta à esquerda usada em navegação de volta e rolagem de carrosséis. */
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

/** Seta à direita usada em navegação e rolagem de carrosséis. */
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/** Ícone de perfil de usuário no cabeçalho desktop. */
export const UserIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

/** Estrelas decorativas do botão Wattpad Premium. */
export const SparklesIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M12 3l1.8 4.6L18.5 9.5l-4.7 1.9L12 16l-1.8-4.6L5.5 9.5l4.7-1.9L12 3z" fill="currentColor" stroke="none" />
    <path d="M19 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="currentColor" stroke="none" />
  </svg>
);

/** Lápis que sinaliza ações de escrita e transição para o editor (Telas 4 e 6). */
export const EditIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

/** Ícone de formatação Negrito (`Ctrl+B`) nas barras de edição (R11, R12, R20). */
export const BoldIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7V5z" />
    <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7v-7z" />
  </svg>
);

/** Ícone de formatação Itálico (`Ctrl+I`) nas barras de edição (R11, R12, R20). */
export const ItalicIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M10 5h8" />
    <path d="M6 19h8" />
    <path d="M14 5L10 19" />
  </svg>
);

/** Ícone de formatação Sublinhado (`Ctrl+U`) nas barras de edição (R11, R12, R20). */
export const UnderlineIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M7 5v6a5 5 0 0 0 10 0V5" />
    <path d="M5 19h14" />
  </svg>
);

/** Ícone de subtítulo/título de seção na barra de formatação desktop (R11). */
export const HeadingIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 6h10" />
    <path d="M9 6v13" />
    <path d="M15 12h6" />
    <path d="M18 12v7" />
  </svg>
);

/** Ícone de alinhamento de texto à esquerda (R11, R20). */
export const AlignLeftIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 6h16" />
    <path d="M4 10h11" />
    <path d="M4 14h16" />
    <path d="M4 18h11" />
  </svg>
);

/** Ícone de alinhamento centralizado de texto ou separador (R11, R20). */
export const AlignCenterIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 6h16" />
    <path d="M7 10h10" />
    <path d="M4 14h16" />
    <path d="M7 18h10" />
  </svg>
);

/** Ícone de alinhamento de texto à direita (R11, R20). */
export const AlignRightIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 6h16" />
    <path d="M9 10h11" />
    <path d="M4 14h16" />
    <path d="M9 18h11" />
  </svg>
);

/** Ícone do botão "Inserir imagem" no grupo de inserção do editor desktop (R14). */
export const ImageIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
    <path d="M21 16l-5-5-6 6-3-3-4 4" />
  </svg>
);

/** Ícone do botão "Inserir vídeo" no grupo de inserção do editor desktop (R14). */
export const VideoIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <rect x="2.5" y="6" width="13.5" height="12" rx="2" />
    <path d="M16 10l5.5-3v10L16 14v-4z" />
  </svg>
);

/** Ícone do botão "Separador de cena" (`***` centralizado) no editor (R14, R20). */
export const SceneSeparatorIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 12h4" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <path d="M16 12h4" />
    <path d="M12 6v2M12 16v2" />
  </svg>
);

/** Ícone do botão "Adicionar enquete" no editor desktop (R14, R15). */
export const PollIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M4 19h16" />
    <rect x="5" y="10" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="10.5" y="5" width="3" height="11" rx="0.5" fill="currentColor" stroke="none" />
    <rect x="16" y="8" width="3" height="8" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Ícone de contagem de leituras exibido nos metadados das histórias. */
export const EyeIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Ícone de votos/estrelas exibido nos metadados das histórias. */
export const StarIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="M12 2.8l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.61l-5.8 3.06 1.11-6.47-4.7-4.58 6.49-.94L12 2.8z" />
  </svg>
);

/** Ícone de lista de leitura e seleção de capítulos/partes. */
export const ListIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/** Marca de verificação usada em confirmações e estados salvos. */
export const CheckIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** Ícone de fechamento ("X") de modais, painéis e avisos. */
export const CloseIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** Ícone da ação "Desfazer" na confirmação de alteração de idioma (R18). */
export const UndoIcon: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);

/** Ícone do alternador de Alto Contraste Escuro (R22). */
export const ContrastIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 0 0 18V3z" fill="currentColor" stroke="none" />
  </svg>
);

/** Ícone da lupa de foco 200% (R22). */
export const ZoomInIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <circle cx="10.5" cy="10.5" r="7" />
    <path d="M20 20l-4.5-4.5" />
    <path d="M10.5 7.5v6M7.5 10.5h6" />
  </svg>
);

/** Ícone de saída de áudio utilizado no monitor NVDA (R21). */
export const VolumeIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

/** Microfone do botão "Ditado por voz" no teclado virtual mobile (Tela 6 / R20). */
export const MicIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3M8 21h8" />
  </svg>
);

/** Ícone de teclado utilizado em dicas de atalhos de acessibilidade (R5, R12). */
export const KeyboardIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6" />
  </svg>
);

/** Prancheta de requisitos exibida no botão "Requisitos desta tela" do `EvaluatorHub`. */
export const ClipboardListIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4.5h6V3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v1.5z" />
    <path d="M9 10h6M9 14h6M9 18h4" />
  </svg>
);

/** Livro aberto utilizado em ações de leitura de histórias. */
export const BookOpenIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H12v17H4.5A2.5 2.5 0 0 0 2 22V5.5z" />
    <path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H12v17h7.5a2.5 2.5 0 0 1 2.5 2.5V5.5z" />
  </svg>
);

/** Sinal de adição ("+") usado em ações de criação e inserção. */
export const PlusIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Ícone informativo ("i") para avisos e explicações contextuais. */
export const InfoIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4" />
    <circle cx="12" cy="8.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

/** Ícone de envio/publicação utilizado no botão "Publicar" do editor (R16). */
export const UploadIcon: React.FC<IconProps> = ({ size = 18, className }) => (
  <svg {...defaultSvgProps(size, className)}>
    <path d="M12 15V4" />
    <path d="M7 9l5-5 5 5" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

