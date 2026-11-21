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
import {
  EditorBlock,
  LeonardoDraft,
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

/**
 * Ilustração vetorial SVG acessível (`role="img"`) exibida no editor, no seletor
 * de presets e na pré-visualização do capítulo.
 */
export const ChapterIllustrationSvg: React.FC<{
  preset?: string;
  altTitle?: string;
}> = ({ preset = 'escadaria', altTitle }) => {
  const isCorridor = preset === 'corredor';
  const label =
    altTitle ||
    (isCorridor ? 'Corredor sob neblina' : 'Escadaria antiga à meia-luz');

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
   Modal 1: Inserir Imagem (R14 — 100% PT-BR)
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

/** Modal de seleção de ilustração vetorial e legenda opcional para o capítulo (`R14`). */
export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ImagePresetId>('escadaria');
  const [caption, setCaption] = useState<string>(
    'A escadaria levava ao andar fechado havia trinta anos.'
  );
  const [insertAtTop, setInsertAtTop] = useState<boolean>(true);

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

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
            Inserir imagem de abertura
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label="Fechar janela de imagem"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <div className="editor-field">
            <span className="editor-field-label">
              Escolha uma ilustração vetorial pronta:
            </span>
            <div className="editor-preset-grid">
              {IMAGE_PRESETS.map((preset) => {
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
              Legenda da imagem (opcional)
            </label>
            <input
              id="editor-image-caption"
              type="text"
              className="editor-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva uma legenda breve em português..."
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
            <span>Inserir no início do capítulo como imagem de abertura</span>
          </label>
        </div>

        <div className="editor-modal-footer">
          <button
            type="button"
            className="btn-pill-secondary editor-action-btn"
            onClick={onClose}
          >
            Cancelar
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
            Inserir imagem
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 2: Inserir Vídeo (R14 — 100% PT-BR)
   -------------------------------------------------------------------------- */
interface VideoInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { videoTitle: string; caption: string }) => void;
}

/** Modal de inserção de vídeo ou trilha sonora com validação de título em PT-BR (`R14`). */
export const VideoInsertModal: React.FC<VideoInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [videoTitle, setVideoTitle] = useState<string>(
    'Trilha sonora — Sombras da Biblioteca (Piano e Chuva)'
  );
  const [caption, setCaption] = useState<string>(
    'Sugestão de leitura: ouça esta trilha ambiente durante a leitura do capítulo.'
  );
  const [error, setError] = useState<string>('');

  const dialogRef = useAccessibleDialog(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!videoTitle.trim()) {
      setError('Informe um título para o vídeo ou trilha sonora.');
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
            Inserir vídeo ou trilha no capítulo
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label="Fechar janela de vídeo"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <div className="editor-field">
            <label htmlFor="editor-video-title" className="editor-field-label">
              Título do vídeo ou trilha sonora
            </label>
            <input
              id="editor-video-title"
              type="text"
              className="editor-input"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Ex.: Booktrailer oficial — Capítulo 3"
            />
          </div>

          <div className="editor-field">
            <label htmlFor="editor-video-caption" className="editor-field-label">
              Nota para os leitores (opcional)
            </label>
            <input
              id="editor-video-caption"
              type="text"
              className="editor-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex.: Dica de ambientação para a cena..."
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
            Cancelar
          </button>
          <button
            type="button"
            className="btn-pill-primary editor-action-btn"
            onClick={handleSubmit}
          >
            Inserir vídeo
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 3: Adicionar Enquete (R14 — 100% PT-BR)
   -------------------------------------------------------------------------- */
interface PollInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: { question: string; options: string[] }) => void;
}

/** Modal de criação de enquete (2 a 4 opções) para o final do capítulo (`R14`, `R15`). */
export const PollInsertModal: React.FC<PollInsertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [question, setQuestion] = useState<string>(
    'Qual segredo Rafael deveria investigar primeiro?'
  );
  const [options, setOptions] = useState<string[]>([
    'O diário escondido atrás do vitral',
    'A chave enferrujada do arquivo submerso',
  ]);
  const [error, setError] = useState<string>('');

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
      setError('Digite a pergunta da enquete antes de salvar.');
      return;
    }
    if (cleanOptions.length < 2) {
      setError('Preencha pelo menos 2 opções para a enquete.');
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
            Adicionar enquete ao final do capítulo
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label="Fechar janela de enquete"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
          <div className="editor-field">
            <label htmlFor="editor-poll-question" className="editor-field-label">
              Pergunta da enquete
            </label>
            <input
              id="editor-poll-question"
              type="text"
              className="editor-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex.: Qual pista você acha mais suspeita?"
            />
          </div>

          <div className="editor-field">
            <span className="editor-field-label">Opções de resposta</span>
            {options.map((opt, idx) => (
              <div key={idx} className="editor-poll-option-row">
                <input
                  type="text"
                  className="editor-input"
                  aria-label={`Opção ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Opção ${idx + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    className="editor-block-remove-btn"
                    aria-label={`Remover opção ${idx + 1}`}
                    onClick={() => handleRemoveOption(idx)}
                  >
                    Remover
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
                  <span>Adicionar opção</span>
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
            Cancelar
          </button>
          <button
            type="button"
            className="btn-pill-primary editor-action-btn"
            onClick={handleSubmit}
          >
            Adicionar enquete
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 4: Pré-visualização Limpa do Capítulo (100% PT-BR)
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
            aria-label="Separador de cena"
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
                altTitle={block.meta?.caption || 'Ilustração do capítulo'}
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
                  {block.meta?.videoTitle || 'Trilha sonora do capítulo'}
                </span>
                <span className="editor-video-meta">
                  {isPlaying
                    ? 'Reproduzindo prévia simulada • 00:42 / 02:14'
                    : 'Mídia incorporada • 02:14'}
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
                <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
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
              {block.meta?.pollQuestion || 'Enquete do capítulo'}
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
                ? 'Voto simulado registrado na pré-visualização.'
                : 'Clique em uma opção para testar a enquete como leitor.'}
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
            Pré-visualização do leitor
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label="Fechar pré-visualização"
            onClick={onClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="editor-modal-body">
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
                  {wordCountText} palavras • Idioma: Português
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
            Voltar ao editor
          </button>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
   Modal 5: Publicar Capítulo (R15 — 100% PT-BR)
   -------------------------------------------------------------------------- */
interface PublishChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  draft: LeonardoDraft;
  wordCountText: string;
  onConfirmPublish: () => void;
  onGoHome: () => void;
}

/** Modal de revisão e confirmação de publicação 100% em PT-BR com retorno à Home (`R15`). */
export const PublishChapterModal: React.FC<PublishChapterModalProps> = ({
  isOpen,
  onClose,
  draft,
  wordCountText,
  onConfirmPublish,
  onGoHome,
}) => {
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
              ? 'Capítulo publicado!'
              : 'Publicar capítulo em Português'}
          </h2>
          <button
            type="button"
            className="editor-modal-close"
            aria-label="Fechar diálogo de publicação"
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
                  &ldquo;{draft.chapterTitle}&rdquo; foi publicado com sucesso!
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '15px' }}>
                Os leitores de língua portuguesa já podem acessar este capítulo em{' '}
                <strong>{draft.storyTitle}</strong>
                {draft.publishedAt ? ` (publicado às ${draft.publishedAt})` : ''}.
              </p>
            </div>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>
                Revise os detalhes abaixo antes de publicar o capítulo para seus
                leitores no Wattpad.
              </p>

              <ul className="editor-summary-list">
                <li className="editor-summary-item">
                  <span>História</span>
                  <strong>{draft.storyTitle}</strong>
                </li>
                <li className="editor-summary-item">
                  <span>Título do capítulo</span>
                  <strong>{draft.chapterTitle}</strong>
                </li>
                <li className="editor-summary-item">
                  <span>Extensão</span>
                  <strong>{wordCountText} palavras</strong>
                </li>
                <li className="editor-summary-item">
                  <span>Idioma da publicação</span>
                  <span className="lang-badge">
                    <GlobeIcon size={13} />
                    Português
                  </span>
                </li>
                <li className="editor-summary-item">
                  <span>Elementos incluídos</span>
                  <strong>
                    {separatorCount} separador(es) • {mediaCount} mídia(s) •{' '}
                    {pollCount} enquete(s)
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
                Continuar editando
              </button>
              <button
                type="button"
                className="btn-pill-primary editor-action-btn"
                onClick={() => {
                  onClose();
                  onGoHome();
                }}
              >
                Ir à página inicial
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-pill-secondary editor-action-btn"
                onClick={onClose}
              >
                Cancelar
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
                <span>Confirmar publicação</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
