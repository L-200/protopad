/**
 * @fileoverview Tela 5 — Leitura de Capítulo com Player Mobile (`390 × 844 px`).
 * Apresenta o Cap. 9 de Sansão com barra inferior fixa na zona do polegar contendo alvos
 * de toque `>= 48 × 48 px` (`R19`), player completo desde o início (`R1`, `R2`), ordem fixa
 * Reproduzir/Pausar, Voltar, Avançar e Velocidade (`R3`), persistência da velocidade `1,25x`
 * (`R6`) e transição direta para edição na Tela 6 (Cenário 4).
 */
import React, { useEffect, useRef } from 'react';
import {
  CheckIcon,
  ChevronLeftIcon,
  EditIcon,
  NextParagraphIcon,
  PauseIcon,
  PlayIcon,
  PrevParagraphIcon,
  SpeedIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { SiteLanguage } from '../../types/prototype';
import { formatLocalizedRate, MobileFrame } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';
import './MobileScreens.css';

const READER_EXTRA_STRINGS: Record<
  SiteLanguage,
  {
    screenLabel: string;
    mainAria: string;
    sepAria: (num: number) => string;
    paragraphAria: (num: number, text: string) => string;
    playingTag: string;
    currentTag: string;
    dockAria: string;
    playNarrationAria: string;
    pauseNarrationAria: string;
  }
> = {
  'pt-BR': {
    screenLabel: 'Tela 5 — Leitura Mobile',
    mainAria: 'Texto do capítulo para leitura e áudio',
    sepAria: (num) => `Parágrafo ${num}: separador de cena`,
    paragraphAria: (num, text) => `Parágrafo ${num}: ${text}`,
    playingTag: 'Em reprodução',
    currentTag: 'Parágrafo atual',
    dockAria: 'Controles fixos de leitura em áudio',
    playNarrationAria: 'Reproduzir narração',
    pauseNarrationAria: 'Pausar narração',
  },
  'en-US': {
    screenLabel: 'Screen 5 — Mobile Reader',
    mainAria: 'Chapter text for reading and audio',
    sepAria: (num) => `Paragraph ${num}: scene break`,
    paragraphAria: (num, text) => `Paragraph ${num}: ${text}`,
    playingTag: 'Playing',
    currentTag: 'Current paragraph',
    dockAria: 'Fixed audio reading controls',
    playNarrationAria: 'Play narration',
    pauseNarrationAria: 'Pause narration',
  },
  'es-ES': {
    screenLabel: 'Pantalla 5 — Lectura Móvil',
    mainAria: 'Texto del capítulo para lectura y audio',
    sepAria: (num) => `Párrafo ${num}: separador de escena`,
    paragraphAria: (num, text) => `Párrafo ${num}: ${text}`,
    playingTag: 'Reproduciendo',
    currentTag: 'Párrafo actual',
    dockAria: 'Controles fijos de lectura en audio',
    playNarrationAria: 'Reproducir narración',
    pauseNarrationAria: 'Pausar narración',
  },
};

/**
 * Leitor mobile do Cap. 9 com destaque do parágrafo em reprodução, rolagem segura sem
 * sobreposição pela barra inferior fixa e controles dimensionados para uso com uma mão.
 */
export const MobileReaderScreen: React.FC = () => {
  const { t, siteLanguage } = useTranslation();
  const extra = READER_EXTRA_STRINGS[siteLanguage];
  const { sansaoChapter, navigateTo, setSansaoPlayback } = usePrototype();
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
  } = useSansaoAudio();

  const localizedRate = formatLocalizedRate(playbackRate, siteLanguage);
  const activeBlockRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeBlockRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [currentParagraph]);

  return (
    <MobileFrame screenLabel={extra.screenLabel}>
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-touch-btn mobile-touch-btn--icon-only"
          aria-label={t.mobile.backHomeAria}
          onClick={() => navigateTo('tela_1_home')}
        >
          <ChevronLeftIcon size={20} />
        </button>

        <div className="mobile-header-titles">
          <span className="mobile-header-story">{sansaoChapter.storyTitle}</span>
          <span className="mobile-header-chapter">
            {sansaoChapter.chapterTitle}
          </span>
        </div>

        <button
          type="button"
          className="mobile-touch-btn"
          aria-label={t.mobile.editAria}
          onClick={() => navigateTo('tela_6_editor_mobile')}
        >
          <EditIcon size={16} />
          <span>{t.mobile.editBtn}</span>
        </button>
      </header>

      <main
        className="mobile-reader-scroll"
        aria-label={extra.mainAria}
      >
        {sansaoChapter.edited && (
          <div className="mobile-updated-banner" role="status">
            <CheckIcon size={16} />
            <span>{t.mobile.updatedBadge}</span>
          </div>
        )}

        <h1 className="mobile-chapter-heading">{sansaoChapter.chapterTitle}</h1>

        {sansaoChapter.blocks.map((block, index) => {
          const paragraphNumber = index + 1;
          const isActive = paragraphNumber === currentParagraph;
          const isSep = Boolean(block.isSeparator || block.text.trim() === '***');

          return (
            <button
              key={block.id}
              ref={isActive ? activeBlockRef : null}
              type="button"
              className={`mobile-paragraph-block ${
                isActive ? 'mobile-paragraph-block--active' : ''
              } ${isSep ? 'mobile-paragraph-block--separator' : ''}`.trim()}
              aria-current={isActive ? 'true' : undefined}
              aria-label={
                isSep
                  ? extra.sepAria(paragraphNumber)
                  : extra.paragraphAria(paragraphNumber, block.text)
              }
              style={{
                textAlign: block.align,
                fontWeight: block.bold ? 700 : 400,
                fontStyle: block.italic ? 'italic' : 'normal',
                textDecoration: block.underline ? 'underline' : 'none',
              }}
              onClick={() =>
                setSansaoPlayback({ currentParagraph: paragraphNumber })
              }
            >
              {isActive && (
                <span className="mobile-paragraph-tag" aria-hidden="true">
                  {isPlaying ? extra.playingTag : extra.currentTag} ·{' '}
                  {paragraphNumber}
                </span>
              )}
              <span style={{ display: 'block' }}>{block.text}</span>
            </button>
          );
        })}
      </main>

      <section
        className="mobile-audio-dock"
        aria-label={extra.dockAria}
      >
        <div
          className="mobile-progress-track"
          aria-hidden="true"
        >
          <div
            className="mobile-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mobile-audio-meta">
          <div className="mobile-audio-meta-left">
            <LanguageBadge language="pt" />
            <span>{t.mobile.listenLabel}</span>
          </div>
          <span className="mobile-audio-counter">
            {t.mobile.paragraphOf(currentParagraph, totalParagraphs)}
          </span>
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
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            <span>{isPlaying ? t.mobile.pause : t.mobile.play}</span>
          </button>

          <button
            type="button"
            className="mobile-audio-btn"
            aria-label={t.mobile.prevAria}
            onClick={prevParagraph}
          >
            <PrevParagraphIcon size={20} />
            <span>{t.mobile.prev}</span>
          </button>

          <button
            type="button"
            className="mobile-audio-btn"
            aria-label={t.mobile.nextAria}
            onClick={nextParagraph}
          >
            <NextParagraphIcon size={20} />
            <span>{t.mobile.next}</span>
          </button>

          <button
            type="button"
            className="mobile-audio-btn mobile-audio-btn--rate"
            aria-label={t.mobile.speedAria(localizedRate)}
            onClick={cyclePlaybackRate}
          >
            <SpeedIcon size={18} />
            <span>{localizedRate}</span>
          </button>
        </div>
      </section>
    </MobileFrame>
  );
};
