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
import { usePrototype } from '../../state/PrototypeContext';
import { MobileFrame } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';
import './MobileScreens.css';

/**
 * Leitor mobile do Cap. 9 com destaque do parágrafo em reprodução, rolagem segura sem
 * sobreposição pela barra inferior fixa e controles dimensionados para uso com uma mão.
 */
export const MobileReaderScreen: React.FC = () => {
  const { sansaoChapter, navigateTo, setSansaoPlayback } = usePrototype();
  const {
    isPlaying,
    currentParagraph,
    totalParagraphs,
    rateLabel,
    progressPercent,
    togglePlay,
    prevParagraph,
    nextParagraph,
    cyclePlaybackRate,
  } = useSansaoAudio();

  const activeBlockRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeBlockRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [currentParagraph]);

  return (
    <MobileFrame screenLabel="Tela 5 — Leitura Mobile">
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-touch-btn mobile-touch-btn--icon-only"
          aria-label="Voltar para a tela inicial"
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
          aria-label="Editar capítulo"
          onClick={() => navigateTo('tela_6_editor_mobile')}
        >
          <EditIcon size={16} />
          <span>Editar</span>
        </button>
      </header>

      <main
        className="mobile-reader-scroll"
        aria-label="Texto do capítulo para leitura e áudio"
      >
        {sansaoChapter.edited && (
          <div className="mobile-updated-banner" role="status">
            <CheckIcon size={16} />
            <span>Capítulo atualizado — pronto para conferir no áudio</span>
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
                  ? `Parágrafo ${paragraphNumber}: separador de cena`
                  : `Parágrafo ${paragraphNumber}: ${block.text}`
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
                  {isPlaying ? 'Em reprodução' : 'Parágrafo atual'} ·{' '}
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
        aria-label="Controles fixos de leitura em áudio"
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
            <span>Ouvir</span>
          </div>
          <span className="mobile-audio-counter">
            Parágrafo {currentParagraph} de {totalParagraphs}
          </span>
        </div>

        <div className="mobile-audio-controls">
          <button
            type="button"
            className="mobile-audio-btn mobile-audio-btn--primary"
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'Pausar narração' : 'Reproduzir narração'}
            onClick={togglePlay}
          >
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
          </button>

          <button
            type="button"
            className="mobile-audio-btn"
            aria-label="Voltar parágrafo"
            onClick={prevParagraph}
          >
            <PrevParagraphIcon size={20} />
            <span>Voltar</span>
          </button>

          <button
            type="button"
            className="mobile-audio-btn"
            aria-label="Avançar parágrafo"
            onClick={nextParagraph}
          >
            <NextParagraphIcon size={20} />
            <span>Avançar</span>
          </button>

          <button
            type="button"
            className="mobile-audio-btn mobile-audio-btn--rate"
            aria-label={`Alterar velocidade de reprodução, atual ${rateLabel}`}
            onClick={cyclePlaybackRate}
          >
            <SpeedIcon size={18} />
            <span>{rateLabel}</span>
          </button>
        </div>
      </section>
    </MobileFrame>
  );
};
