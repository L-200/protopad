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
import { useTranslation } from '../../i18n/useTranslation';
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

const RATE_DOT_LABELS: Record<PlaybackRate, string> = {
  0.75: '0.75x',
  1.0: '1.0x',
  1.25: '1.25x',
  1.5: '1.5x',
  1.75: '1.75x',
  2.0: '2.0x',
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

const PLAYER_EXTRA: Record<
  SiteLanguage,
  {
    audioLangAria: (lang: string) => string;
    mismatchAria: (storyLang: string, siteLang: string) => string;
    speedListboxAria: string;
    speedPopoverHeader: string;
  }
> = {
  'pt-BR': {
    audioLangAria: (lang) => `Idioma do áudio: ${lang}`,
    mismatchAria: (storyLang, siteLang) =>
      `Aviso de idioma: história e leitura em voz alta em ${storyLang}, enquanto o site está em ${siteLang}`,
    speedListboxAria: 'Selecionar velocidade de leitura',
    speedPopoverHeader: 'Velocidade da voz',
  },
  'en-US': {
    audioLangAria: (lang) => `Audio language: ${lang}`,
    mismatchAria: (storyLang, siteLang) =>
      `Language notice: story and text-to-speech in ${storyLang}, while the site is in ${siteLang}`,
    speedListboxAria: 'Select reading speed',
    speedPopoverHeader: 'Voice speed',
  },
  'es-ES': {
    audioLangAria: (lang) => `Idioma del audio: ${lang}`,
    mismatchAria: (storyLang, siteLang) =>
      `Aviso de idioma: historia y lectura en voz alta en ${storyLang}, mientras el sitio está en ${siteLang}`,
    speedListboxAria: 'Seleccionar velocidad de lectura',
    speedPopoverHeader: 'Velocidad de la voz',
  },
};

/**
 * Formata a velocidade de reprodução conforme o idioma do site:
 * vírgula decimal em `pt-BR` e `es-ES` (`1,75x`) e ponto em `en-US` (`1.75x`).
 *
 * @param rate Fator numérico de velocidade.
 * @param siteLanguage Idioma atual do site (padrão `pt-BR`).
 * @returns Rótulo formatado para exibição no botão e anúncio no leitor de tela.
 */
export function formatPlaybackRate(
  rate: PlaybackRate,
  siteLanguage: SiteLanguage = 'pt-BR'
): string {
  const dotLabel = RATE_DOT_LABELS[rate] ?? `${rate}x`;
  if (siteLanguage === 'en-US') {
    return dotLabel;
  }
  return dotLabel.replace('.', ',');
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
 * Barra fixa inferior de áudio envolvida por `<section role="region" aria-label={t.reader.playerRegionLabel}>`.
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
  const { t } = useTranslation();
  const extra = PLAYER_EXTRA[siteLanguage];
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedWrapperRef = useRef<HTMLDivElement | null>(null);
  const speedButtonRef = useRef<HTMLButtonElement | null>(null);
  const speedOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const formattedRate = formatPlaybackRate(playbackRate, siteLanguage);
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
      aria-label={t.reader.playerRegionLabel}
      aria-describedby="player-ouvir-tooltip"
      tabIndex={-1}
      className="desktop-player-bar"
    >
      <div className="desktop-player-bar__inner">
        {/* Identificação consistente "Ouvir"/"Listen"/"Escuchar" + selo de idioma antes dos controles (R8, R16, R17) */}
        <div className="desktop-player-identity">
          <LanguageBadge
            language={storyLanguage}
            ariaLabel={extra.audioLangAria(STORY_LANG_NAME[storyLanguage])}
          />

          {languageDiffersFromSite && (
            <span
              className="player-lang-mismatch"
              role="note"
              aria-label={extra.mismatchAria(
                STORY_LANG_NAME[storyLanguage],
                SITE_LANG_NAME[siteLanguage]
              )}
            >
              <InfoIcon size={14} />
              <span>
                {t.reader.voiceMismatch(
                  STORY_LANG_NAME[storyLanguage],
                  SITE_LANG_NAME[siteLanguage]
                )}
              </span>
            </span>
          )}

          <div className="tooltip-wrapper player-ouvir-tooltip">
            <span className="player-ouvir-badge">
              <HeadphonesIcon size={18} />
              <span>{t.reader.listenLabel}</span>
            </span>
            <span id="player-ouvir-tooltip" role="tooltip" className="tooltip-bubble">
              {t.reader.listenTooltip}
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
              <span>{isPlaying ? t.reader.pauseLabel : t.reader.playLabel}</span>
            </button>
            <span id="tooltip-play-pause" role="tooltip" className="tooltip-bubble">
              {isPlaying ? t.reader.pauseTooltip : t.reader.playTooltip}
            </span>
          </div>

          {/* 2. Voltar parágrafo */}
          <div className="tooltip-wrapper">
            <button
              type="button"
              className="player-btn"
              aria-label={t.reader.prevAria}
              aria-disabled={currentParagraph <= 1}
              aria-describedby="tooltip-prev-paragraph"
              onClick={onPrevParagraph}
            >
              <PrevParagraphIcon size={18} />
              <span>{t.reader.prevShort}</span>
            </button>
            <span id="tooltip-prev-paragraph" role="tooltip" className="tooltip-bubble">
              {t.reader.prevTooltip}
            </span>
          </div>

          {/* 3. Avançar parágrafo */}
          <div className="tooltip-wrapper">
            <button
              type="button"
              className="player-btn"
              aria-label={t.reader.nextAria}
              aria-disabled={currentParagraph >= totalParagraphs}
              aria-describedby="tooltip-next-paragraph"
              onClick={onNextParagraph}
            >
              <NextParagraphIcon size={18} />
              <span>{t.reader.nextShort}</span>
            </button>
            <span id="tooltip-next-paragraph" role="tooltip" className="tooltip-bubble">
              {t.reader.nextTooltip}
            </span>
          </div>

          {/* 4. Velocidade */}
          <div className="player-speed-control" ref={speedWrapperRef}>
            <div className="tooltip-wrapper">
              <button
                ref={speedButtonRef}
                type="button"
                className="player-btn"
                aria-label={t.reader.speedAria(formattedRate)}
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
                  {`${t.reader.speedMenuLabel} (${formattedRate})`}
                </span>
              )}
            </div>

            {speedMenuOpen && (
              <div
                role="listbox"
                aria-label={extra.speedListboxAria}
                className="player-speed-popover"
              >
                <div className="player-speed-popover__header">
                  {extra.speedPopoverHeader}
                </div>
                {PLAYBACK_RATE_OPTIONS.map((rateOption, idx) => {
                  const isSelected = rateOption === playbackRate;
                  const optionLabel = formatPlaybackRate(
                    rateOption,
                    siteLanguage
                  );
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
              aria-label={t.reader.progressAria}
              aria-valuetext={t.reader.paragraphOf(
                currentParagraph,
                totalParagraphs
              )}
              onFocus={onFocusProgress}
              onChange={(e) => onSeekParagraph(Number(e.target.value))}
            />
            <span className="player-progress-text" aria-hidden="true">
              {t.reader.paragraphOf(currentParagraph, totalParagraphs)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
