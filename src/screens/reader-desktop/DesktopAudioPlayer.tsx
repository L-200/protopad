/**
 * @fileoverview Barra fixa inferior do player de áudio da Tela 3 (Desktop).
 * Implementa a ordem canônica dos 5 controles em todos os capítulos (`R1`, `R2`, `R3`),
 * persistência visual da velocidade (`R6`), rótulos acessíveis em PT-BR (`R7`),
 * identidade única "Ouvir" com selo de idioma (`R8`, `R16`, `R17`), anúncios sob demanda
 * no `aria-live` (`R21`) e indicadores de foco/estado não dependentes apenas de cor (`R22`).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  HeadphonesIcon,
  InfoIcon,
  NextParagraphIcon,
  PauseIcon,
  PlayIcon,
  PrevParagraphIcon,
  SpeedIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import {
  PlaybackRate,
  SiteLanguage,
  StoryLanguage,
} from '../../types/prototype';

/** Opções fixas de velocidade suportadas pelo motor de voz e exibidas no popover (`R6`). */
export const PLAYBACK_RATE_OPTIONS: readonly PlaybackRate[] = [
  0.75,
  1.0,
  1.25,
  1.5,
  1.75,
  2.0,
];

const RATE_LABELS: Record<PlaybackRate, string> = {
  0.75: '0,75x',
  1.0: '1,0x',
  1.25: '1,25x',
  1.5: '1,5x',
  1.75: '1,75x',
  2.0: '2,0x',
};

const STORY_LANG_NAME: Record<StoryLanguage, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

const SITE_LANG_NAME: Record<SiteLanguage, string> = {
  'pt-BR': 'Português',
  'en-US': 'English',
  'es-ES': 'Español',
};

/**
 * Formata a velocidade de reprodução no padrão brasileiro com vírgula decimal (`1,75x`).
 *
 * @param rate Fator numérico de velocidade.
 * @returns Rótulo formatado para exibição no botão e anúncio no leitor de tela.
 */
export function formatPlaybackRate(rate: PlaybackRate): string {
  return RATE_LABELS[rate] ?? `${String(rate).replace('.', ',')}x`;
}

/** Propriedades controladas do player fixo inferior (`DesktopAudioPlayer`). */
export interface DesktopAudioPlayerProps {
  playerRegionRef: React.RefObject<HTMLElement>;
  storyLanguage: StoryLanguage;
  siteLanguage: SiteLanguage;
  isPlaying: boolean;
  currentParagraph: number;
  totalParagraphs: number;
  playbackRate: PlaybackRate;
  onTogglePlay: () => void;
  onPrevParagraph: () => void;
  onNextParagraph: () => void;
  onChangeRate: (rate: PlaybackRate) => void;
  onSeekParagraph: (paragraph: number) => void;
  onFocusProgress: () => void;
}

/**
 * Barra fixa inferior de áudio envolvida por `<section role="region" aria-label="Ouvir">`.
 * Recebe foco programático via skip link ou tecla `D` (`tabIndex={-1}`) sem iniciar ou
 * pausar a narração automaticamente (`R4`, `R21`).
 */
export const DesktopAudioPlayer: React.FC<DesktopAudioPlayerProps> = ({
  playerRegionRef,
  storyLanguage,
  siteLanguage,
  isPlaying,
  currentParagraph,
  totalParagraphs,
  playbackRate,
  onTogglePlay,
  onPrevParagraph,
  onNextParagraph,
  onChangeRate,
  onSeekParagraph,
  onFocusProgress,
}) => {
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedWrapperRef = useRef<HTMLDivElement | null>(null);
  const speedButtonRef = useRef<HTMLButtonElement | null>(null);
  const speedOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const formattedRate = formatPlaybackRate(playbackRate);
  const languageDiffersFromSite = !siteLanguage.startsWith(storyLanguage);

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!speedMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        speedWrapperRef.current &&
        !speedWrapperRef.current.contains(event.target as Node)
      ) {
        setSpeedMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [speedMenuOpen]);

  // Move foco para a opção selecionada ao abrir o menu de velocidade
  useEffect(() => {
    if (!speedMenuOpen) return;
    const selectedIdx = PLAYBACK_RATE_OPTIONS.indexOf(playbackRate);
    const target =
      speedOptionRefs.current[selectedIdx >= 0 ? selectedIdx : 1];
    target?.focus();
  }, [speedMenuOpen, playbackRate]);

  /**
   * Navegação por teclado dentro do `role="listbox"` de velocidades (setas, Home/End,
   * Escape retornando o foco ao botão acionador e fechamento ao pressionar Tab).
   */
  const handleSpeedListKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    idx: number
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setSpeedMenuOpen(false);
      speedButtonRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIdx = (idx + 1) % PLAYBACK_RATE_OPTIONS.length;
      speedOptionRefs.current[nextIdx]?.focus();
      return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIdx =
        (idx - 1 + PLAYBACK_RATE_OPTIONS.length) %
        PLAYBACK_RATE_OPTIONS.length;
      speedOptionRefs.current[prevIdx]?.focus();
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      speedOptionRefs.current[0]?.focus();
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      speedOptionRefs.current[PLAYBACK_RATE_OPTIONS.length - 1]?.focus();
      return;
    }

    if (event.key === 'Tab') {
      setSpeedMenuOpen(false);
    }
  };

  return (
    <section
      id="audio-player-region"
      ref={playerRegionRef}
      role="region"
      aria-label="Ouvir"
      aria-describedby="player-ouvir-tooltip"
      tabIndex={-1}
      className="desktop-player-bar"
    >
      <div className="desktop-player-bar__inner">
        {/* Identificação consistente "Ouvir" + selo de idioma antes dos controles (R8, R16, R17) */}
        <div className="desktop-player-identity">
          <LanguageBadge
            language={storyLanguage}
            ariaLabel={`Idioma do áudio: ${STORY_LANG_NAME[storyLanguage]}`}
          />

          {languageDiffersFromSite && (
            <span
              className="player-lang-mismatch"
              role="note"
              aria-label={`Aviso de idioma: história e leitura em voz alta em ${STORY_LANG_NAME[storyLanguage]}, enquanto o site está em ${SITE_LANG_NAME[siteLanguage]}`}
            >
              <InfoIcon size={14} />
              <span>
                Voz em {STORY_LANG_NAME[storyLanguage]} (site em{' '}
                {SITE_LANG_NAME[siteLanguage]})
              </span>
            </span>
          )}

          <div className="tooltip-wrapper player-ouvir-tooltip">
            <span className="player-ouvir-badge">
              <HeadphonesIcon size={18} />
              <span>Ouvir</span>
            </span>
            <span id="player-ouvir-tooltip" role="tooltip" className="tooltip-bubble">
              Ouvir com leitura em voz alta (voz automática)
            </span>
          </div>
        </div>

        {/* Ordem FIXA dos 5 controles em todos os capítulos (R3, R7) */}
        <div className="desktop-player-controls">
          {/* 1. Reproduzir / Pausar */}
          <div className="tooltip-wrapper">
            <button
              type="button"
              className={`player-btn player-btn--play ${
                isPlaying ? 'player-btn--playing' : ''
              }`}
              aria-pressed={isPlaying}
              aria-describedby="tooltip-play-pause"
              onClick={onTogglePlay}
            >
              {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
              <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
            </button>
            <span id="tooltip-play-pause" role="tooltip" className="tooltip-bubble">
              {isPlaying ? 'Pausar (Alt+P)' : 'Reproduzir (Alt+P)'}
            </span>
          </div>

          {/* 2. Voltar parágrafo */}
          <div className="tooltip-wrapper">
            <button
              type="button"
              className="player-btn"
              aria-label="Voltar parágrafo"
              aria-disabled={currentParagraph <= 1}
              aria-describedby="tooltip-prev-paragraph"
              onClick={onPrevParagraph}
            >
              <PrevParagraphIcon size={18} />
              <span>Voltar</span>
            </button>
            <span id="tooltip-prev-paragraph" role="tooltip" className="tooltip-bubble">
              Voltar parágrafo (Alt+↑)
            </span>
          </div>

          {/* 3. Avançar parágrafo */}
          <div className="tooltip-wrapper">
            <button
              type="button"
              className="player-btn"
              aria-label="Avançar parágrafo"
              aria-disabled={currentParagraph >= totalParagraphs}
              aria-describedby="tooltip-next-paragraph"
              onClick={onNextParagraph}
            >
              <NextParagraphIcon size={18} />
              <span>Avançar</span>
            </button>
            <span id="tooltip-next-paragraph" role="tooltip" className="tooltip-bubble">
              Avançar parágrafo (Alt+↓)
            </span>
          </div>

          {/* 4. Velocidade */}
          <div className="player-speed-control" ref={speedWrapperRef}>
            <div className="tooltip-wrapper">
              <button
                ref={speedButtonRef}
                type="button"
                className="player-btn"
                aria-label={`Velocidade de leitura: ${formattedRate}`}
                aria-haspopup="listbox"
                aria-expanded={speedMenuOpen}
                aria-describedby={!speedMenuOpen ? 'tooltip-speed' : undefined}
                onClick={() => setSpeedMenuOpen((prev) => !prev)}
              >
                <SpeedIcon size={18} />
                <span>{formattedRate}</span>
              </button>
              {!speedMenuOpen && (
                <span id="tooltip-speed" role="tooltip" className="tooltip-bubble">
                  Velocidade de leitura ({formattedRate})
                </span>
              )}
            </div>

            {speedMenuOpen && (
              <div
                role="listbox"
                aria-label="Selecionar velocidade de leitura"
                className="player-speed-popover"
              >
                <div className="player-speed-popover__header">
                  Velocidade da voz
                </div>
                {PLAYBACK_RATE_OPTIONS.map((rateOption, idx) => {
                  const isSelected = rateOption === playbackRate;
                  const optionLabel = formatPlaybackRate(rateOption);
                  return (
                    <button
                      key={optionLabel}
                      ref={(el) => {
                        speedOptionRefs.current[idx] = el;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`player-speed-option ${
                        isSelected ? 'player-speed-option--selected' : ''
                      }`}
                      onClick={() => {
                        onChangeRate(rateOption);
                        setSpeedMenuOpen(false);
                        speedButtonRef.current?.focus();
                      }}
                      onKeyDown={(e) => handleSpeedListKeyDown(e, idx)}
                    >
                      <span>{optionLabel}</span>
                      {isSelected && <CheckIcon size={15} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Progresso */}
          <div className="player-progress-group">
            <input
              id="player-progress-slider"
              type="range"
              min={1}
              max={totalParagraphs}
              step={1}
              value={currentParagraph}
              className="player-progress-slider"
              aria-label="Progresso do capítulo"
              aria-valuetext={`Parágrafo ${currentParagraph} de ${totalParagraphs}`}
              onFocus={onFocusProgress}
              onChange={(e) => onSeekParagraph(Number(e.target.value))}
            />
            <span className="player-progress-text" aria-hidden="true">
              Parágrafo {currentParagraph} de {totalParagraphs}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
