/**
 * @fileoverview Tela 5 — Leitura de Capítulo com Player Mobile (`390 × 844 px`).
 * Apresenta o Cap. 9 de Sansão com barra inferior fixa na zona do polegar contendo alvos
 * de toque `>= 48 × 48 px` (`R19`), player completo desde o início (`R1`, `R2`), ordem fixa
 * Reproduzir/Pausar, Voltar parágrafo, Avançar parágrafo e Velocidade (`R3`), persistência da velocidade `1,25x`
 * (`R6`) e transição direta para edição na Tela 6 (Cenário 4).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronLeftIcon,
  CloseIcon,
  EditIcon,
  ListIcon,
  NextParagraphIcon,
  PauseIcon,
  PlayIcon,
  PrevParagraphIcon,
  SpeedIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { SiteLanguage, StoryLanguage } from '../../types/prototype';
import { IS_PHONE_DEVICE } from './deviceMode';
import { formatLocalizedRate, MobileFrame } from './MobileFrame';
import { useSansaoAudio } from './useSansaoAudio';
import './MobileScreens.css';

function storyLangToHtmlLang(language: StoryLanguage): string {
  switch (language) {
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    default:
      return 'pt-BR';
  }
}

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
    chapterShort: (num: number) => string;
    switchChapterAria: string;
    switcherTitle: string;
    switcherSubtitle: string;
    editableTag: string;
    readOnlyTag: string;
    readOnlyHeaderBadge: string;
    readOnlyHeaderAria: string;
    currentChapterBadge: string;
    editedChapterBadge: string;
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
    chapterShort: (num) => `Cap. ${num}`,
    switchChapterAria: 'Trocar história ou capítulo',
    switcherTitle: 'Histórias e capítulos',
    switcherSubtitle: 'Escolha outro capítulo ou história para ouvir ou revisar:',
    editableTag: 'Seu capítulo (editável)',
    readOnlyTag: 'Somente leitura',
    readOnlyHeaderBadge: 'Leitura',
    readOnlyHeaderAria: 'História em modo somente leitura',
    currentChapterBadge: 'Atual',
    editedChapterBadge: 'Editado',
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
    chapterShort: (num) => `Ch. ${num}`,
    switchChapterAria: 'Switch story or chapter',
    switcherTitle: 'Stories & chapters',
    switcherSubtitle: 'Pick another story or chapter to listen or review:',
    editableTag: 'Your chapter (editable)',
    readOnlyTag: 'Read-only',
    readOnlyHeaderBadge: 'Read',
    readOnlyHeaderAria: 'Story is in read-only mode',
    currentChapterBadge: 'Current',
    editedChapterBadge: 'Edited',
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
    chapterShort: (num) => `Cap. ${num}`,
    switchChapterAria: 'Cambiar historia o capítulo',
    switcherTitle: 'Historias y capítulos',
    switcherSubtitle: 'Elige otro capítulo o historia para escuchar o revisar:',
    editableTag: 'Tu capítulo (editable)',
    readOnlyTag: 'Solo lectura',
    readOnlyHeaderBadge: 'Lectura',
    readOnlyHeaderAria: 'Historia en modo solo lectura',
    currentChapterBadge: 'Actual',
    editedChapterBadge: 'Editado',
  },
};

/**
 * Leitor mobile com suporte multi-capítulo (Tarefas A, B e C de Sansão), destaque do parágrafo
 * em reprodução, rolagem segura sem sobreposição pela barra inferior fixa e alvos >= 48×48 px.
 */
export const MobileReaderScreen: React.FC = () => {
  const { t, siteLanguage } = useTranslation();
  const extra = READER_EXTRA_STRINGS[siteLanguage];
  const {
    mobileChapters,
    activeMobileChapterId,
    activeMobileChapter,
    selectMobileChapter,
    navigateTo,
    setSansaoPlayback,
  } = usePrototype();
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

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const localizedRate = formatLocalizedRate(playbackRate, siteLanguage);
  const activeBlockRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const switcherBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeSwitcherBtnRef = useRef<HTMLButtonElement | null>(null);

  const prevChapterIdRef = useRef(activeMobileChapterId);
  const justSwitchedChapterRef = useRef(false);

  useLayoutEffect(() => {
    if (prevChapterIdRef.current !== activeMobileChapterId) {
      prevChapterIdRef.current = activeMobileChapterId;
      justSwitchedChapterRef.current = true;
      const scroller = scrollContainerRef.current;
      if (scroller) {
        const prevBehavior = scroller.style.scrollBehavior;
        scroller.style.scrollBehavior = 'auto';
        scroller.scrollTop = 0;
        scroller.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        scroller.style.scrollBehavior = prevBehavior;
      }
    }
  }, [activeMobileChapterId]);

  useEffect(() => {
    if (justSwitchedChapterRef.current) {
      justSwitchedChapterRef.current = false;
      return;
    }
    activeBlockRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [currentParagraph, activeMobileChapterId]);

  useEffect(() => {
    if (!isSwitcherOpen) return;
    closeSwitcherBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsSwitcherOpen(false);
        switcherBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSwitcherOpen]);

  const handleCloseSwitcher = () => {
    setIsSwitcherOpen(false);
    window.setTimeout(() => switcherBtnRef.current?.focus(), 0);
  };

  const handleSelectChapter = (chapterId: string) => {
    selectMobileChapter(chapterId);
    setIsSwitcherOpen(false);
    window.setTimeout(() => switcherBtnRef.current?.focus(), 0);
  };

  return (
    <MobileFrame screenLabel={extra.screenLabel}>
      <header className="mobile-header">
        {/* No celular real não existe página inicial desktop no fluxo */}
        {!IS_PHONE_DEVICE && (
          <button
            type="button"
            className="mobile-touch-btn mobile-touch-btn--icon-only"
            aria-label={t.mobile.backHomeAria}
            onClick={() => navigateTo('tela_1_home')}
          >
            <ChevronLeftIcon size={20} />
          </button>
        )}

        <div className="mobile-header-titles">
          <span className="mobile-header-story">
            {activeMobileChapter.storyTitle}
          </span>
          <span className="mobile-header-chapter">
            {activeMobileChapter.chapterTitle}
          </span>
        </div>

        <button
          ref={switcherBtnRef}
          type="button"
          className={`mobile-touch-btn mobile-chapter-switch-btn ${
            isSwitcherOpen ? 'mobile-touch-btn--active' : ''
          }`.trim()}
          aria-label={extra.switchChapterAria}
          aria-expanded={isSwitcherOpen}
          aria-haspopup="dialog"
          onClick={() => setIsSwitcherOpen((open) => !open)}
        >
          <ListIcon size={16} />
          <span>{extra.chapterShort(activeMobileChapter.chapterNumber)}</span>
        </button>

        {activeMobileChapter.editable ? (
          <button
            type="button"
            className="mobile-touch-btn"
            aria-label={t.mobile.editAria}
            onClick={() => navigateTo('tela_6_editor_mobile')}
          >
            <EditIcon size={16} />
            <span>{t.mobile.editBtn}</span>
          </button>
        ) : (
          <span
            className="mobile-readonly-badge"
            aria-label={extra.readOnlyHeaderAria}
          >
            {extra.readOnlyHeaderBadge}
          </span>
        )}
      </header>

      <main
        key={activeMobileChapterId}
        ref={scrollContainerRef}
        className="mobile-reader-scroll"
        aria-label={extra.mainAria}
      >
        <article
          className="mobile-reader-article"
          lang={storyLangToHtmlLang(activeMobileChapter.language)}
        >
          {activeMobileChapter.edited && (
            <div className="mobile-updated-banner" role="status">
              <CheckIcon size={16} />
              <span>{t.mobile.updatedBadge}</span>
            </div>
          )}

          <div className="mobile-reader-story-bar">
            <LanguageBadge language={activeMobileChapter.language} />
            <span className="mobile-reader-story-name">
              {activeMobileChapter.storyTitle}
            </span>
          </div>

          <h1 className="mobile-chapter-heading">
            {activeMobileChapter.chapterTitle}
          </h1>

          {activeMobileChapter.blocks.map((block, index) => {
            const paragraphNumber = index + 1;
            const isActive = paragraphNumber === currentParagraph;
            const isSep = Boolean(
              block.isSeparator || block.text.trim() === '***'
            );

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
                <span style={{ display: 'block' }}>
                  {block.segments && block.segments.length > 0
                    ? block.segments.map((seg, segIdx) => (
                        <span
                          key={`${block.id}-seg-${segIdx}`}
                          style={{
                            fontWeight: seg.bold ? 700 : 400,
                            fontStyle: seg.italic ? 'italic' : 'normal',
                            textDecoration: seg.underline ? 'underline' : 'none',
                          }}
                        >
                          {seg.text}
                        </span>
                      ))
                    : block.text}
                </span>
              </button>
            );
          })}
        </article>
      </main>

      {isSwitcherOpen && (
        <div
          className="mobile-chapter-sheet-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseSwitcher();
            }
          }}
        >
          <section
            className="mobile-chapter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={extra.switcherTitle}
          >
            <div className="mobile-chapter-sheet-header">
              <div>
                <h2 className="mobile-chapter-sheet-title">
                  {extra.switcherTitle}
                </h2>
                <p className="mobile-chapter-sheet-subtitle">
                  {extra.switcherSubtitle}
                </p>
              </div>
              <button
                ref={closeSwitcherBtnRef}
                type="button"
                className="mobile-touch-btn"
                aria-label={t.common.close}
                onClick={handleCloseSwitcher}
              >
                <CloseIcon size={18} />
                <span>{t.common.close}</span>
              </button>
            </div>

            <div className="mobile-chapter-sheet-list">
              {mobileChapters.map((ch) => {
                const isSelected = ch.id === activeMobileChapterId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    className={`mobile-chapter-option ${
                      isSelected ? 'mobile-chapter-option--active' : ''
                    }`.trim()}
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => handleSelectChapter(ch.id)}
                  >
                    <div className="mobile-chapter-option-top">
                      <span className="mobile-chapter-option-story">
                        {ch.storyTitle}
                      </span>
                      <LanguageBadge language={ch.language} showIcon={false} />
                    </div>
                    <span className="mobile-chapter-option-chapter">
                      {ch.chapterTitle}
                    </span>
                    <div className="mobile-chapter-option-badges">
                      <span
                        className={`mobile-chapter-pill ${
                          ch.editable
                            ? 'mobile-chapter-pill--editable'
                            : 'mobile-chapter-pill--readonly'
                        }`}
                      >
                        {ch.editable ? extra.editableTag : extra.readOnlyTag}
                      </span>
                      {isSelected && (
                        <span className="mobile-chapter-pill mobile-chapter-pill--current">
                          {extra.currentChapterBadge}
                        </span>
                      )}
                      {ch.edited && (
                        <span className="mobile-chapter-pill mobile-chapter-pill--edited">
                          {extra.editedChapterBadge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

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
            <LanguageBadge language={activeMobileChapter.language} />
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
