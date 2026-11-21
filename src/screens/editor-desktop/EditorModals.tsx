/**
 * @fileoverview Modais auxiliares do Editor Desktop (Tela 4 — Cenário 2).
 * Contém os diálogos de inserção de imagem, vídeo/trilha e enquete (`R14`), pré-visualização
 * limpa do capítulo e fluxo de publicação integralmente em PT-BR (`R15`), todos equipados
 * com o hook acessível `useAccessibleDialog` (foco inicial, focus trap, `Escape` e
 * restauração do foco ao fecharem).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  CloseIcon,
  GlobeIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
} from '../../components/shared/Icons';
import { StoryCoverSvg } from '../../components/shared/StoryCoverSvg';
import { formatSiteLanguageName } from '../../i18n/translations';
import { useTranslation } from '../../i18n/useTranslation';
import {
  EditorBlock,
  LeonardoDraft,
  SiteLanguage,
  StoryItem,
} from '../../types/prototype';

/** Identificadores das ilustrações vetoriais embutidas disponíveis no modal de imagem. */
export type ImagePresetId = 'escadaria' | 'corredor';

/** Catálogo local de presets visuais para inserção rápida sem dependência externa (`R14`). */
export const IMAGE_PRESETS: Array<{
  id: ImagePresetId;
  title: string;
  description: string;
}> = [
  {
    id: 'escadaria',
    title: 'Escadaria antiga à meia-luz',
    description: 'Degraus em espiral iluminados por lanterna âmbar',
  },
  {
    id: 'corredor',
    title: 'Corredor sob neblina',
    description: 'Arcos da biblioteca antiga com feixes de luar',
  },
];

interface ModalExtraStrings {
  preset1Desc: string;
  preset2Desc: string;
  imageCloseAria: string;
  imageDefaultCaption: string;
  imageInsertAtTop: string;
  videoCloseAria: string;
  videoDefaultTitle: string;
  videoDefaultCaption: string;
  videoCaptionLabel: string;
  videoCaptionPlaceholder: string;
  videoTitleError: string;
  videoFallbackTitle: string;
  videoPlayingMeta: string;
  videoIdleMeta: string;
  pollCloseAria: string;
  pollDefaultQuestion: string;
  pollDefaultOptions: [string, string];
  pollQuestionError: string;
  pollOptionsError: string;
  pollRemoveOptionAria: (n: number) => string;
  pollFallbackQuestion: string;
  pollPreviewHint: string;
  chapterIllustrationAlt: string;
  previewLanguageLine: string;
  publishCloseAria: string;
  publishStoryLabel: string;
  publishElementsLabel: string;
  publishElementsValue: (sep: number, media: number, poll: number) => string;
  publishPublishedAt: (time: string) => string;
  publishContinueEditing: string;
}

const MODAL_EXTRA_STRINGS: Record<SiteLanguage, ModalExtraStrings> = {
  'pt-BR': {
    preset1Desc: 'Degraus em espiral iluminados por lanterna âmbar',
    preset2Desc: 'Arcos da biblioteca antiga com feixes de luar',
    imageCloseAria: 'Fechar janela de imagem',
    imageDefaultCaption: 'A escadaria levava ao andar fechado havia trinta anos.',
    imageInsertAtTop: 'Inserir no início do capítulo como imagem de abertura',
    videoCloseAria: 'Fechar janela de vídeo',
    videoDefaultTitle: 'Trilha sonora — Sombras da Biblioteca (Piano e Chuva)',
    videoDefaultCaption:
      'Sugestão de leitura: ouça esta trilha ambiente durante a leitura do capítulo.',
    videoCaptionLabel: 'Nota para os leitores (opcional)',
    videoCaptionPlaceholder: 'Ex.: Dica de ambientação para a cena...',
    videoTitleError: 'Informe um título para o vídeo ou trilha sonora.',
    videoFallbackTitle: 'Trilha sonora do capítulo',
    videoPlayingMeta: 'Reproduzindo prévia simulada • 00:42 / 02:14',
    videoIdleMeta: 'Mídia incorporada • 02:14',
    pollCloseAria: 'Fechar janela de enquete',
    pollDefaultQuestion: 'Qual segredo Rafael deveria investigar primeiro?',
    pollDefaultOptions: [
      'O diário escondido atrás do vitral',
      'A chave enferrujada do arquivo submerso',
    ],
    pollQuestionError: 'Digite a pergunta da enquete antes de salvar.',
    pollOptionsError: 'Preencha pelo menos 2 opções para a enquete.',
    pollRemoveOptionAria: (n) => `Remover opção ${n}`,
    pollFallbackQuestion: 'Enquete do capítulo',
    pollPreviewHint: 'Clique em uma opção para testar a enquete como leitor.',
    chapterIllustrationAlt: 'Ilustração do capítulo',
    previewLanguageLine: 'Idioma: Português',
    publishCloseAria: 'Fechar diálogo de publicação',
    publishStoryLabel: 'História',
    publishElementsLabel: 'Elementos incluídos',
    publishElementsValue: (sep, media, poll) =>
      `${sep} separador(es) • ${media} mídia(s) • ${poll} enquete(s)`,
    publishPublishedAt: (time) => `Publicado às ${time}`,
    publishContinueEditing: 'Continuar editando',
  },
  'en-US': {
    preset1Desc: 'Spiral steps lit by an amber lantern',
    preset2Desc: 'Old library arches bathed in moonlight',
    imageCloseAria: 'Close image dialog',
    imageDefaultCaption: 'The staircase led to the floor closed for thirty years.',
    imageInsertAtTop: 'Insert at the start of the chapter as an opening image',
    videoCloseAria: 'Close video dialog',
    videoDefaultTitle: 'Soundtrack — Shadows of the Library (Piano & Rain)',
    videoDefaultCaption:
      'Reading tip: listen to this ambient track while reading the chapter.',
    videoCaptionLabel: 'Note for readers (optional)',
    videoCaptionPlaceholder: 'e.g. Mood tip for this scene...',
    videoTitleError: 'Please enter a title for the video or soundtrack.',
    videoFallbackTitle: 'Chapter soundtrack',
    videoPlayingMeta: 'Playing simulated preview • 00:42 / 02:14',
    videoIdleMeta: 'Embedded media • 02:14',
    pollCloseAria: 'Close poll dialog',
    pollDefaultQuestion: 'Which secret should Rafael investigate first?',
    pollDefaultOptions: [
      'The diary hidden behind the stained glass',
      'The rusted key from the flooded archive',
    ],
    pollQuestionError: 'Enter the poll question before saving.',
    pollOptionsError: 'Fill in at least 2 options for the poll.',
    pollRemoveOptionAria: (n) => `Remove option ${n}`,
    pollFallbackQuestion: 'Chapter poll',
    pollPreviewHint: 'Click an option to test the poll as a reader.',
    chapterIllustrationAlt: 'Chapter illustration',
    previewLanguageLine: 'Language: Portuguese',
    publishCloseAria: 'Close publish dialog',
    publishStoryLabel: 'Story',
    publishElementsLabel: 'Included elements',
    publishElementsValue: (sep, media, poll) =>
      `${sep} break(s) • ${media} media • ${poll} poll(s)`,
    publishPublishedAt: (time) => `Published at ${time}`,
    publishContinueEditing: 'Continue editing',
  },
  'es-ES': {
    preset1Desc: 'Peldaños en espiral iluminados por un farol ámbar',
    preset2Desc: 'Arcos de la antigua biblioteca bajo la luz de la luna',
    imageCloseAria: 'Cerrar ventana de imagen',
    imageDefaultCaption: 'La escalera llevaba al piso cerrado hacía treinta años.',
    imageInsertAtTop: 'Insertar al inicio del capítulo como imagen de apertura',
    videoCloseAria: 'Cerrar ventana de vídeo',
    videoDefaultTitle: 'Banda sonora — Sombras de la Biblioteca (Piano y Lluvia)',
    videoDefaultCaption:
      'Sugerencia de lectura: escucha esta pista ambiental durante el capítulo.',
    videoCaptionLabel: 'Nota para los lectores (opcional)',
    videoCaptionPlaceholder: 'Ej.: Sugerencia de ambientación para la escena...',
    videoTitleError: 'Ingresa un título para el vídeo o la banda sonora.',
    videoFallbackTitle: 'Banda sonora del capítulo',
    videoPlayingMeta: 'Reproduciendo vista previa simulada • 00:42 / 02:14',
    videoIdleMeta: 'Multimedia incorporado • 02:14',
    pollCloseAria: 'Cerrar ventana de encuesta',
    pollDefaultQuestion: '¿Qué secreto debería investigar Rafael primero?',
    pollDefaultOptions: [
      'El diario escondido detrás del vitral',
      'La llave oxidada del archivo inundado',
    ],
    pollQuestionError: 'Escribe la pregunta de la encuesta antes de guardar.',
    pollOptionsError: 'Completa al menos 2 opciones para la encuesta.',
    pollRemoveOptionAria: (n) => `Eliminar opción ${n}`,
    pollFallbackQuestion: 'Encuesta del capítulo',
    pollPreviewHint: 'Haz clic en una opción para probar la encuesta como lector.',
    chapterIllustrationAlt: 'Ilustración del capítulo',
    previewLanguageLine: 'Idioma: Portugués',
    publishCloseAria: 'Cerrar diálogo de publicación',
    publishStoryLabel: 'Historia',
    publishElementsLabel: 'Elementos incluidos',
    publishElementsValue: (sep, media, poll) =>
      `${sep} separador(es) • ${media} recurso(s) • ${poll} encuesta(s)`,
    publishPublishedAt: (time) => `Publicado a las ${time}`,
    publishContinueEditing: 'Seguir editando',
  },
};

/**
 * Ilustração vetorial SVG acessível (`role="img"`) exibida no editor, no seletor
 * de presets e na pré-visualização do capítulo.
 */
export const ChapterIllustrationSvg: React.FC<{
  preset?: string;
  altTitle?: string;
}> = ({ preset = 'escadaria', altTitle }) => {
  const { t } = useTranslation();
  const isCorridor = preset === 'corredor';
  const label =
    altTitle ||
    (isCorridor
      ? t.editor.modals.imagePreset2
      : t.editor.modals.imagePreset1);

  if (isCorridor) {
    return (
      <svg
        viewBox="0 0 640 280"
        width="100%"
        role="img"
        aria-label={label}
        focusable="false"
      >
        <defs>
          <linearGradient id="corridor-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#131B2E" />
            <stop offset="100%" stopColor="#263653" />
          </linearGradient>
          <linearGradient id="corridor-beam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A9D6E5" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#A9D6E5" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect width="640" height="280" fill="url(#corridor-bg)" />
        {/* Arcos e pilares */}
        <path
          d="M80 280 V110 A240 120 0 0 1 560 110 V280"
          fill="#1B2740"
          stroke="#4A628A"
          strokeWidth="3"
        />
        <path
          d="M155 280 V125 A165 88 0 0 1 485 125 V280"
          fill="#141E33"
          stroke="#3E547A"
          strokeWidth="2.5"
        />
        <path
          d="M230 280 V142 A90 54 0 0 1 410 142 V280"
          fill="#0E1526"
          stroke="#5C79A6"
          strokeWidth="2"
        />
        {/* Janela iluminada ao fundo */}
        <path
          d="M294 205 V150 A26 26 0 0 1 346 150 V205 Z"
          fill="#CFEBF5"
          fillOpacity="0.88"
        />
        <polygon points="294,155 346,155 470,280 170,280" fill="url(#corridor-beam)" />
        {/* Neblina no chão */}
        <ellipse cx="320" cy="258" rx="250" ry="28" fill="#DCEEF6" fillOpacity="0.16" />
        <ellipse cx="260" cy="240" rx="140" ry="18" fill="#DCEEF6" fillOpacity="0.14" />
        <ellipse cx="400" cy="248" rx="150" ry="16" fill="#DCEEF6" fillOpacity="0.12" />
        {/* Silhuetas de estantes laterais */}
        <rect x="24" y="40" width="44" height="240" fill="#0B101D" />
        <rect x="572" y="40" width="44" height="240" fill="#0B101D" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 640 280"
      width="100%"
      role="img"
      aria-label={label}
      focusable="false"
    >
      <defs>
        <linearGradient id="stair-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B1826" />
          <stop offset="100%" stopColor="#2F263B" />
        </linearGradient>
        <radialGradient id="lantern-glow" cx="52%" cy="38%" r="42%">
          <stop offset="0%" stopColor="#FFC966" stopOpacity="0.72" />
          <stop offset="55%" stopColor="#FF7A2F" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#1B1826" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="640" height="280" fill="url(#stair-bg)" />
      <rect width="640" height="280" fill="url(#lantern-glow)" />
      {/* Arco superior */}
      <path
        d="M140 280 V88 C140 30 500 30 500 88 V280"
        fill="none"
        stroke="#6A5A7E"
        strokeWidth="3"
        strokeOpacity="0.55"
      />
      {/* Degraus curvos */}
      <path d="M110 264 H530 V280 H110 Z" fill="#12101A" />
      <path d="M145 236 H495 V262 H145 Z" fill="#181523" />
      <path d="M180 210 H460 V234 H180 Z" fill="#211C2F" />
      <path d="M215 186 H425 V208 H215 Z" fill="#2A243C" />
      <path d="M250 164 H390 V184 H250 Z" fill="#352D4A" />
      {/* Corrimão e lanterna */}
      <path d="M138 258 L254 162" stroke="#D89D5A" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M502 258 L386 162" stroke="#D89D5A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="332" y1="22" x2="332" y2="88" stroke="#D89D5A" strokeWidth="2.5" />
      <rect
        x="318"
        y="88"
        width="28"
        height="38"
        rx="6"
        fill="#FFE39E"
        stroke="#D89D5A"
        strokeWidth="2.5"
      />
      <circle cx="332" cy="107" r="7" fill="#FF7A2F" />
    </svg>
  );
};

/* --------------------------------------------------------------------------
   Hook de Acessibilidade para Modais (Focus Trap, Foco Inicial, Escape e Restauração)
   -------------------------------------------------------------------------- */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Hook de acessibilidade para diálogos modais (`role="dialog"`, `aria-modal="true"`).
 * Move o foco inicial para o primeiro elemento interativo, implementa focus trap
 * circular com `Tab`/`Shift+Tab`, fecha com `Escape` e restaura o foco anterior ao fechar.
 */
function useAccessibleDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialogEl = dialogRef.current;

    if (dialogEl) {
      const initialFocusable =
        dialogEl.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (initialFocusable) {
        initialFocusable.focus();
      } else {
        dialogEl.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !dialogRef.current.contains(active)) {
          e.preventDefault();
          first.focus();
          return;
        }

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (
        previouslyFocused &&
        document.contains(previouslyFocused) &&
        typeof previouslyFocused.focus === 'function'
      ) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  return dialogRef;
}

/* --------------------------------------------------------------------------
   Modal 1: Inserir Imagem (R14)
   -------------------------------------------------------------------------- */
interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    preset: ImagePresetId;
    caption: string;
    insertAtTop: boolean;
  }) => void;
}

const DEFAULT_IMAGE_CAPTIONS = Object.values(MODAL_EXTRA_STRINGS).map(
  (s) => s.imageDefaultCaption
);

/** Modal de seleção de ilustração vetorial e legenda opcional para o capítulo (`R14`). */
export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = MODAL_EXTRA_STRINGS[siteLanguage];

  const [selectedPreset, setSelectedPreset] = useState<ImagePresetId>('escadaria');
  const [caption, setCaption] = useState<string>(extra.imageDefaultCaption);
  const [insertAtTop, setInsertAtTop] = useState<boolean>(true);

  useEffect(() => {
    setCaption((prev) =>
      DEFAULT_IMAGE_CAPTIONS.includes(prev) ? extra.imageDefaultCaption : prev
    );
  }, [extra.imageDefaultCaption]);

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const localizedPresets: Array<{
    id: ImagePresetId;
    title: string;
    description: string;
  }> = [
    {
      id: 'escadaria',
      title: t.editor.modals.imagePreset1,
      description: extra.preset1Desc,
    },
    {
      id: 'corredor',
      title: t.editor.modals.imagePreset2,
      description: extra.preset2Desc,
    },
  ];

  return (
    <div
      className="editor-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="editor-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-inserir-imagem-titulo"
      >
        <div className="editor-modal-header">
          <h2 id="modal-inserir-imagem-titulo" className="editor-modal-title">
            {t.editor.modals.imageTitle}
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label={extra.imageCloseAria}
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <div className="editor-field">
            <span className="editor-field-label">
              {t.editor.modals.imageSubtitle}
            </span>
            <div className="editor-preset-grid">
              {localizedPresets.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`editor-preset-card ${
                      isSelected ? 'is-selected' : ''
                    }`}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedPreset(preset.id)}
                  >
                    <div className="editor-image-svg-frame">
                      <ChapterIllustrationSvg
                        preset={preset.id}
                        altTitle={preset.title}
                      />
                    </div>
                    <span className="editor-preset-name">{preset.title}</span>
                    <span className="editor-preset-desc">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="editor-field">
            <label htmlFor="editor-image-caption" className="editor-field-label">
              {t.editor.modals.imageCaptionLabel}
            </label>
            <input
              id="editor-image-caption"
              type="text"
              className="editor-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.editor.modals.imageCaptionPlaceholder}
            />
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={insertAtTop}
              onChange={(e) => setInsertAtTop(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>{extra.imageInsertAtTop}</span>
          </label>
        </div>

        <div className="editor-modal-footer">
          <button
            type="button"
            className="btn-pill-secondary editor-action-btn"
            onClick={onClose}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="btn-pill-primary editor-action-btn"
            onClick={() => {
              onConfirm({
                preset: selectedPreset,
                caption: caption.trim(),
                insertAtTop,
              });
              onClose();
            }}
          >
            {t.editor.modals.imageConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 2: Inserir Vídeo (R14)
   -------------------------------------------------------------------------- */
interface VideoInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { videoTitle: string; caption: string }) => void;
}

const DEFAULT_VIDEO_TITLES = Object.values(MODAL_EXTRA_STRINGS).map(
  (s) => s.videoDefaultTitle
);
const DEFAULT_VIDEO_CAPTIONS = Object.values(MODAL_EXTRA_STRINGS).map(
  (s) => s.videoDefaultCaption
);

/** Modal de inserção de vídeo ou trilha sonora com validação de título (`R14`). */
export const VideoInsertModal: React.FC<VideoInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = MODAL_EXTRA_STRINGS[siteLanguage];

  const [videoTitle, setVideoTitle] = useState<string>(extra.videoDefaultTitle);
  const [caption, setCaption] = useState<string>(extra.videoDefaultCaption);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setVideoTitle((prev) =>
      DEFAULT_VIDEO_TITLES.includes(prev) ? extra.videoDefaultTitle : prev
    );
    setCaption((prev) =>
      DEFAULT_VIDEO_CAPTIONS.includes(prev) ? extra.videoDefaultCaption : prev
    );
    setError('');
  }, [extra.videoDefaultTitle, extra.videoDefaultCaption]);

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!videoTitle.trim()) {
      setError(extra.videoTitleError);
      return;
    }
    setError('');
    onConfirm({
      videoTitle: videoTitle.trim(),
      caption: caption.trim(),
    });
    onClose();
  };

  return (
    <div
      className="editor-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="editor-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-inserir-video-titulo"
      >
        <div className="editor-modal-header">
          <h2 id="modal-inserir-video-titulo" className="editor-modal-title">
            {t.editor.modals.videoTitle}
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label={extra.videoCloseAria}
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            {t.editor.modals.videoSubtitle}
          </p>

          <div className="editor-field">
            <label htmlFor="editor-video-title" className="editor-field-label">
              {t.editor.modals.videoTitleLabel}
            </label>
            <input
              id="editor-video-title"
              type="text"
              className="editor-input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder={t.editor.modals.videoTitlePlaceholder}
            />
          </div>

          <div className="editor-field">
            <label htmlFor="editor-video-caption" className="editor-field-label">
              {extra.videoCaptionLabel}
            </label>
            <input
              id="editor-video-caption"
              type="text"
              className="editor-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={extra.videoCaptionPlaceholder}
            />
          </div>

          {error && (
            <div className="editor-error-msg" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="editor-modal-footer">
          <button
            type="button"
            className="btn-pill-secondary editor-action-btn"
            onClick={onClose}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="btn-pill-primary editor-action-btn"
            onClick={handleSubmit}
          >
            {t.editor.modals.videoConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 3: Adicionar Enquete (R14)
   -------------------------------------------------------------------------- */
interface PollInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { question: string; options: string[] }) => void;
}

const DEFAULT_POLL_QUESTIONS = Object.values(MODAL_EXTRA_STRINGS).map(
  (s) => s.pollDefaultQuestion
);
const DEFAULT_POLL_OPT_0 = Object.values(MODAL_EXTRA_STRINGS).map(
  (s) => s.pollDefaultOptions[0]
);
const DEFAULT_POLL_OPT_1 = Object.values(MODAL_EXTRA_STRINGS).map(
  (s) => s.pollDefaultOptions[1]
);

/** Modal de criação de enquete (2 a 4 opções) para o final do capítulo (`R14`, `R15`). */
export const PollInsertModal: React.FC<PollInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = MODAL_EXTRA_STRINGS[siteLanguage];

  const [question, setQuestion] = useState<string>(extra.pollDefaultQuestion);
  const [options, setOptions] = useState<string[]>([
    extra.pollDefaultOptions[0],
    extra.pollDefaultOptions[1],
  ]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setQuestion((prev) =>
      DEFAULT_POLL_QUESTIONS.includes(prev) ? extra.pollDefaultQuestion : prev
    );
    setOptions((prev) =>
      prev.map((opt, idx) => {
        if (idx === 0 && DEFAULT_POLL_OPT_0.includes(opt)) {
          return extra.pollDefaultOptions[0];
        }
        if (idx === 1 && DEFAULT_POLL_OPT_1.includes(opt)) {
          return extra.pollDefaultOptions[1];
        }
        return opt;
      })
    );
    setError('');
  }, [extra.pollDefaultQuestion, extra.pollDefaultOptions]);

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? value : opt)));
  };

  const handleAddOption = () => {
    if (options.length >= 4) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const cleanQuestion = question.trim();
    const cleanOptions = options.map((opt) => opt.trim()).filter(Boolean);

    if (!cleanQuestion) {
      setError(extra.pollQuestionError);
      return;
    }
    if (cleanOptions.length < 2) {
      setError(extra.pollOptionsError);
      return;
    }

    setError('');
    onConfirm({ question: cleanQuestion, options: cleanOptions });
    onClose();
  };

  return (
    <div
      className="editor-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="editor-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-adicionar-enquete-titulo"
      >
        <div className="editor-modal-header">
          <h2 id="modal-adicionar-enquete-titulo" className="editor-modal-title">
            {t.editor.modals.pollTitle}
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label={extra.pollCloseAria}
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            {t.editor.modals.pollSubtitle}
          </p>

          <div className="editor-field">
            <label htmlFor="editor-poll-question" className="editor-field-label">
              {t.editor.modals.pollQuestionLabel}
            </label>
            <input
              id="editor-poll-question"
              type="text"
              className="editor-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t.editor.modals.pollQuestionPlaceholder}
            />
          </div>

          <div className="editor-field">
            <span className="editor-field-label">
              {t.editor.modals.pollOptionsLabel}
            </span>
            {options.map((opt, idx) => (
              <div key={idx} className="editor-poll-option-row">
                <input
                  type="text"
                  className="editor-input"
                  aria-label={t.editor.modals.pollOptionPlaceholder(idx + 1)}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={t.editor.modals.pollOptionPlaceholder(idx + 1)}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="editor-block-remove-btn"
                    aria-label={extra.pollRemoveOptionAria(idx + 1)}
                    onClick={() => handleRemoveOption(idx)}
                  >
                    {t.common.remove}
                  </button>
                )}
              </div>
            ))}

            {options.length < 4 && (
              <div>
                <button
                  type="button"
                  className="btn-pill-secondary"
                  style={{ minHeight: '40px', padding: '0 14px', fontSize: '14px' }}
                  onClick={handleAddOption}
                >
                  <PlusIcon size={16} />
                  <span>{t.editor.modals.pollAddOption}</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="editor-error-msg" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="editor-modal-footer">
          <button
            type="button"
            className="btn-pill-secondary editor-action-btn"
            onClick={onClose}
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            className="btn-pill-primary editor-action-btn"
            onClick={handleSubmit}
          >
            {t.editor.modals.pollConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 4: Pré-visualização Limpa do Capítulo
   -------------------------------------------------------------------------- */
interface PreviewChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: LeonardoDraft;
  storyMeta: StoryItem;
  wordCountText: string;
}

/** Modal de pré-visualização limpa do capítulo como será exibido ao leitor (`R15`). */
export const PreviewChapterModal: React.FC<PreviewChapterModalProps> = ({
  isOpen,
  onClose,
  draft,
  storyMeta,
  wordCountText,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = MODAL_EXTRA_STRINGS[siteLanguage];
  const [selectedVote, setSelectedVote] = useState<Record<string, number>>({});
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const renderPreviewBlock = (block: EditorBlock) => {
    switch (block.type) {
      case 'separator':
        return (
          <div
            key={block.id}
            style={{
              textAlign: 'center',
              margin: '28px 0',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '0.45em',
              color: 'var(--text-secondary)',
            }}
            aria-label={t.editor.sceneBreakLabel}
          >
            ***
          </div>
        );

      case 'image':
        return (
          <figure key={block.id} className="editor-image-figure" style={{ margin: '24px 0' }}>
            <div className="editor-image-svg-frame">
              <ChapterIllustrationSvg
                preset={block.meta?.imagePreset}
                altTitle={block.meta?.caption || extra.chapterIllustrationAlt}
              />
            </div>
            {block.meta?.caption && (
              <figcaption className="editor-image-caption">
                {block.meta.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'video': {
        const isPlaying = playingVideoId === block.id;
        return (
          <div key={block.id} className="editor-video-box" style={{ margin: '24px 0' }}>
            <div className="editor-video-screen">
              <div className="editor-video-info">
                <span className="editor-video-title">
                  {block.meta?.videoTitle || extra.videoFallbackTitle}
                </span>
                <span className="editor-video-meta">
                  {isPlaying ? extra.videoPlayingMeta : extra.videoIdleMeta}
                </span>
              </div>
              <button
                type="button"
                className="editor-video-play-btn"
                onClick={() =>
                  setPlayingVideoId(isPlaying ? null : block.id)
                }
              >
                {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
                <span>{isPlaying ? t.reader.pauseLabel : t.reader.playLabel}</span>
              </button>
            </div>
            {block.meta?.caption && (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                {block.meta.caption}
              </p>
            )}
          </div>
        );
      }

      case 'poll': {
        const options = block.meta?.pollOptions ?? [];
        const picked = selectedVote[block.id];
        return (
          <div key={block.id} className="editor-poll-card" style={{ margin: '28px 0 8px' }}>
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
                            (100 - (Math.round(100 / options.length) + 14)) /
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
                      setSelectedVote((prev) => ({ ...prev, [block.id]: idx }))
                    }
                  >
                    <span>{opt}</span>
                    {percent !== null && (
                      <span className="editor-poll-percent">{percent}%</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="editor-poll-footer">
              {picked !== undefined
                ? t.editor.modals.pollVoteThanks
                : extra.pollPreviewHint}
            </div>
          </div>
        );
      }

      case 'heading':
        return (
          <h3
            key={block.id}
            className="editor-preview-heading"
            style={{ textAlign: block.align }}
            dangerouslySetInnerHTML={{ __html: block.html || '<br />' }}
          />
        );

      case 'paragraph':
      default:
        return (
          <p
            key={block.id}
            className="editor-preview-paragraph"
            style={{ textAlign: block.align }}
            dangerouslySetInnerHTML={{ __html: block.html || '<br />' }}
          />
        );
    }
  };

  return (
    <div
      className="editor-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="editor-modal-dialog editor-modal-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-preview-capitulo-titulo"
      >
        <div className="editor-modal-header">
          <h2 id="modal-preview-capitulo-titulo" className="editor-modal-title">
            {t.editor.modals.previewTitle}
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label={t.editor.modals.previewClose}
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {t.editor.modals.previewSubtitle}
          </p>
          <div className="editor-preview-reader">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                paddingBottom: '18px',
                marginBottom: '22px',
                borderBottom: '1px solid var(--divider)',
              }}
            >
              <StoryCoverSvg story={storyMeta} width={54} decorative />
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--brand-aa)',
                    textTransform: 'uppercase',
                  }}
                >
                  {draft.storyTitle}
                </div>
                <h3 style={{ margin: '2px 0 4px', fontSize: '24px', fontWeight: 700 }}>
                  {draft.chapterTitle}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {t.editor.wordsCount(wordCountText)} • {extra.previewLanguageLine}
                </div>
              </div>
            </div>

            {draft.blocks.map(renderPreviewBlock)}
          </div>
        </div>

        <div className="editor-modal-footer">
          <button
            type="button"
            className="btn-pill-primary editor-action-btn"
            onClick={onClose}
          >
            {t.editor.modals.previewClose}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 5: Publicar Capítulo (R15)
   -------------------------------------------------------------------------- */
interface PublishChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: LeonardoDraft;
  wordCountText: string;
  onConfirmPublish: () => void;
  onGoHome: () => void;
}

/** Modal de revisão e confirmação de publicação com retorno à Home (`R15`). */
export const PublishChapterModal: React.FC<PublishChapterModalProps> = ({
  isOpen,
  onClose,
  draft,
  wordCountText,
  onConfirmPublish,
  onGoHome,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = MODAL_EXTRA_STRINGS[siteLanguage];
  const [justPublished, setJustPublished] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setJustPublished(false);
    }
  }, [isOpen]);

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const separatorCount = draft.blocks.filter((b) => b.type === 'separator').length;
  const pollCount = draft.blocks.filter((b) => b.type === 'poll').length;
  const mediaCount = draft.blocks.filter(
    (b) => b.type === 'image' || b.type === 'video'
  ).length;

  return (
    <div
      className="editor-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="editor-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-publicar-capitulo-titulo"
      >
        <div className="editor-modal-header">
          <h2 id="modal-publicar-capitulo-titulo" className="editor-modal-title">
            {justPublished
              ? t.editor.modals.publishSuccessTitle
              : t.editor.modals.publishTitle}
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label={extra.publishCloseAria}
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          {justPublished ? (
            <div className="editor-success-box" role="status">
              <div className="editor-success-title">
                <CheckIcon size={20} />
                <span>
                  &ldquo;{draft.chapterTitle}&rdquo; — {t.editor.modals.publishSuccessTitle}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '15px' }}>
                {t.editor.modals.publishSuccessBody}{' '}
                <strong>{draft.storyTitle}</strong>
                {draft.publishedAt
                  ? ` (${extra.publishPublishedAt(draft.publishedAt)})`
                  : ''}
                .
              </p>
            </div>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>
                {t.editor.modals.publishSubtitle}
              </p>

              <ul className="editor-summary-list">
                <li className="editor-summary-item">
                  <span>{extra.publishStoryLabel}</span>
                  <strong>{draft.storyTitle}</strong>
                </li>
                <li className="editor-summary-item">
                  <span>{t.editor.chapterTitleAria}</span>
                  <strong>{draft.chapterTitle}</strong>
                </li>
                <li className="editor-summary-item">
                  <span>{t.editor.modals.publishWordsLabel}</span>
                  <strong>{t.editor.wordsCount(wordCountText)}</strong>
                </li>
                <li className="editor-summary-item">
                  <span>{t.editor.modals.publishLangLabel}</span>
                  <span className="lang-badge">
                    <GlobeIcon size={13} />
                    {formatSiteLanguageName(siteLanguage)}
                  </span>
                </li>
                <li className="editor-summary-item">
                  <span>{t.editor.modals.publishStatusLabel}</span>
                  <strong>{t.editor.modals.publishReady}</strong>
                </li>
                <li className="editor-summary-item">
                  <span>{extra.publishElementsLabel}</span>
                  <strong>
                    {extra.publishElementsValue(
                      separatorCount,
                      mediaCount,
                      pollCount
                    )}
                  </strong>
                </li>
              </ul>
            </>
          )}
        </div>

        <div className="editor-modal-footer">
          {justPublished ? (
            <>
              <button
                type="button"
                className="btn-pill-secondary editor-action-btn"
                onClick={onClose}
              >
                {extra.publishContinueEditing}
              </button>
              <button
                type="button"
                className="btn-pill-primary editor-action-btn"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
              >
                {t.reader.backToHomeBtn}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-pill-secondary editor-action-btn"
                onClick={onClose}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                className="btn-pill-primary editor-action-btn"
                onClick={() => {
                  onConfirmPublish();
                  setJustPublished(true);
                }}
              >
                <CheckIcon size={16} />
                <span>{t.editor.modals.publishConfirm}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
