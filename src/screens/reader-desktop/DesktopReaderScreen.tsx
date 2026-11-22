/**
 * @fileoverview Tela 3 — Leitura de Capítulo com Player de Áudio (Desktop / Notebook).
 * Reúne a barra superior `#funbar` (Alto Contraste e Lupa 200% — `R22`, alternância de
 * história/capítulo), texto do capítulo com atributo `lang` específico da história (`R8`),
 * motor TTS via Web Speech API com fallback temporizado para ambientes sem vozes locais,
 * integração com Media Session API e atalhos globais `D`, `Alt+P`, `Alt+↑` e `Alt+↓`
 * (`R4`, `R5`), mantendo convivência silenciosa com o NVDA (`R21`) e barra fixa completa
 * desde `scrollY = 0` (`R1`–`R8`, `R16`, `R17`, Cenários 1 e 3).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  prefetchParagraphAudio,
  resetParagraphProgress,
  speakParagraph,
  TtsPlaybackHandle,
} from '../../audio/ttsEngine';
import {
  CheckIcon,
  PlusIcon,
  StarIcon,
} from '../../components/shared/Icons';
import { HEADSET_MEDIA_KEY_EVENT } from '../../components/shared/evaluatorEvents';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { StoryCoverSvg } from '../../components/shared/StoryCoverSvg';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import {
  PlaybackRate,
  SiteLanguage,
  StoryLanguage,
} from '../../types/prototype';
import {
  DesktopAudioPlayer,
  formatPlaybackRate,
} from './DesktopAudioPlayer';
import './DesktopReaderScreen.css';

const STORY_HTML_LANG: Record<StoryLanguage, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
};

const STORY_LANG_LABEL: Record<StoryLanguage, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

const READER_EXTRA: Record<
  SiteLanguage,
  {
    storySelectAria: string;
    removeFromListAria: string;
    inListText: string;
    byWord: string;
    currentParagraphLabel: string;
    paragraphShort: (current: number, total: number) => string;
    savedSpeedLabel: string;
    shortcutsPrefix: string;
    shortcutsKeys: (
      kbdD: React.ReactNode,
      kbdAlt: React.ReactNode,
      kbdP: React.ReactNode,
      kbdUp: React.ReactNode,
      kbdDown: React.ReactNode
    ) => React.ReactNode;
    activeReadingTag: (num: number) => string;
    activeSelectedTag: (num: number) => string;
    footerNavAria: string;
    endOfChapterTitle: (num: number) => string;
    continueReadingDesc: (rate: string) => string;
    endOfStoryDesc: string;
    backToChapter1: string;
  }
> = {
  'pt-BR': {
    storySelectAria: 'Selecionar história',
    removeFromListAria: 'Remover história da lista de leitura',
    inListText: 'Na lista',
    byWord: 'por',
    currentParagraphLabel: 'Parágrafo atual',
    paragraphShort: (current, total) => `${current} de ${total}`,
    savedSpeedLabel: 'Velocidade salva',
    shortcutsPrefix: 'Atalhos de leitura:',
    shortcutsKeys: (kbdD, kbdAlt, kbdP, kbdUp, kbdDown) => (
      <>
        {kbdD} ir para região Ouvir · {kbdAlt}+{kbdP} reproduzir/pausar ·{' '}
        {kbdAlt}+{kbdUp} / {kbdAlt}+{kbdDown} voltar/avançar parágrafo · clique em
        qualquer parágrafo para saltar.
      </>
    ),
    activeReadingTag: (num) => `▶ Em leitura · Parágrafo ${num}`,
    activeSelectedTag: (num) => `● Selecionado · Parágrafo ${num}`,
    footerNavAria: 'Navegação entre capítulos',
    endOfChapterTitle: (num) => `Fim do Capítulo ${num}`,
    continueReadingDesc: (rate) =>
      `Continue a leitura mantendo sua velocidade salva (${rate}) e o player na mesma posição.`,
    endOfStoryDesc:
      'Você chegou ao final dos capítulos disponíveis nesta história.',
    backToChapter1: 'Voltar ao Capítulo 1',
  },
  'en-US': {
    storySelectAria: 'Select story',
    removeFromListAria: 'Remove story from reading list',
    inListText: 'In list',
    byWord: 'by',
    currentParagraphLabel: 'Current paragraph',
    paragraphShort: (current, total) => `${current} of ${total}`,
    savedSpeedLabel: 'Saved speed',
    shortcutsPrefix: 'Reading shortcuts:',
    shortcutsKeys: (kbdD, kbdAlt, kbdP, kbdUp, kbdDown) => (
      <>
        {kbdD} jump to Listen region · {kbdAlt}+{kbdP} play/pause · {kbdAlt}+
        {kbdUp} / {kbdAlt}+{kbdDown} previous/next paragraph · click any
        paragraph to jump.
      </>
    ),
    activeReadingTag: (num) => `▶ Reading · Paragraph ${num}`,
    activeSelectedTag: (num) => `● Selected · Paragraph ${num}`,
    footerNavAria: 'Chapter navigation',
    endOfChapterTitle: (num) => `End of Chapter ${num}`,
    continueReadingDesc: (rate) =>
      `Continue reading while keeping your saved speed (${rate}) and the player in the same position.`,
    endOfStoryDesc:
      'You have reached the end of the available chapters in this story.',
    backToChapter1: 'Back to Chapter 1',
  },
  'es-ES': {
    storySelectAria: 'Seleccionar historia',
    removeFromListAria: 'Quitar historia de la lista de lectura',
    inListText: 'En lista',
    byWord: 'por',
    currentParagraphLabel: 'Párrafo actual',
    paragraphShort: (current, total) => `${current} de ${total}`,
    savedSpeedLabel: 'Velocidad guardada',
    shortcutsPrefix: 'Atajos de lectura:',
    shortcutsKeys: (kbdD, kbdAlt, kbdP, kbdUp, kbdDown) => (
      <>
        {kbdD} ir a región Escuchar · {kbdAlt}+{kbdP} reproducir/pausar ·{' '}
        {kbdAlt}+{kbdUp} / {kbdAlt}+{kbdDown} párrafo anterior/siguiente · haz
        clic en cualquier párrafo para saltar.
      </>
    ),
    activeReadingTag: (num) => `▶ Leyendo · Párrafo ${num}`,
    activeSelectedTag: (num) => `● Seleccionado · Párrafo ${num}`,
    footerNavAria: 'Navegación entre capítulos',
    endOfChapterTitle: (num) => `Fin del Capítulo ${num}`,
    continueReadingDesc: (rate) =>
      `Continúa leyendo manteniendo tu velocidad guardada (${rate}) y el reproductor en la misma posición.`,
    endOfStoryDesc:
      'Has llegado al final de los capítulos disponibles en esta historia.',
    backToChapter1: 'Volver al Capítulo 1',
  },
};

/**
 * Verifica se o alvo de um evento de teclado é um campo editável, evitando que o
 * atalho global de landmark (`D`) intercepte digitação em inputs ou `contentEditable`.
 * Inputs `range`, `button`, `checkbox` e `radio` continuam permitindo o atalho.
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  if (tag === 'input') {
    const inputType = (target as HTMLInputElement).type?.toLowerCase() ?? 'text';
    return (
      inputType !== 'range' &&
      inputType !== 'button' &&
      inputType !== 'checkbox' &&
      inputType !== 'radio'
    );
  }
  return false;
}

/**
 * Formata o rótulo de capítulo evitando prefixo duplicado quando o título já começa
 * com "Capítulo" ou "Chapter".
 */
function formatChapterLabel(
  title: string,
  chapterLabelPrefix: string
): string {
  const lower = title.trim().toLowerCase();
  if (lower.startsWith('capítulo') || lower.startsWith('chapter')) {
    return title;
  }
  return `${chapterLabelPrefix} — ${title}`;
}

/**
 * Tela de leitura desktop com narração contínua por parágrafo e controles acessíveis.
 * Coordena TTS (`speechSynthesis`), fallback temporizado, `MediaSession` e anúncios
 * restritos a ações explícitas do usuário (`R21`).
 */
export const DesktopReaderScreen: React.FC = () => {
  const {
    stories,
    activeStory,
    activeChapter,
    activeChapterIndex,
    siteLanguage,
    isPlaying,
    setIsPlaying,
    currentParagraph,
    setCurrentParagraph,
    playbackRate,
    setPlaybackRate,
    setActiveStory,
    setActiveChapter,
    announceNvda,
  } = usePrototype();
  const { t } = useTranslation();
  const extra = READER_EXTRA[siteLanguage];

  const [votedStories, setVotedStories] = useState<Record<string, boolean>>({});
  const [listedStories, setListedStories] = useState<Record<string, boolean>>({});

  const hasVoted = Boolean(votedStories[activeStory.id]);
  const addedToList = Boolean(listedStories[activeStory.id]);

  const screenRootRef = useRef<HTMLDivElement | null>(null);
  const playerRegionRef = useRef<HTMLElement>(null);
  const paragraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const ttsHandleRef = useRef<TtsPlaybackHandle | null>(null);
  const playbackRateRef = useRef<PlaybackRate>(playbackRate);
  playbackRateRef.current = playbackRate;
  const hasUserNavigatedParagraphRef = useRef(false);

  const chapters = useMemo(
    () => activeStory.chapters ?? [activeChapter],
    [activeStory.chapters, activeChapter]
  );

  const readableStories = useMemo(() => {
    const withChapters = stories.filter(
      (s) =>
        (s.chapters && s.chapters.length > 0) ||
        s.id === 'cronicas-do-silencio' ||
        s.id === 'echoes-beyond-the-harbor'
    );
    return withChapters.length > 0 ? withChapters : [activeStory];
  }, [stories, activeStory]);

  const totalParagraphs = Math.max(1, activeChapter.paragraphs.length);
  const progressPercent = Math.round(
    (currentParagraph / totalParagraphs) * 100
  );
  const hasNextChapter = activeChapterIndex < chapters.length - 1;
  const nextChapter = hasNextChapter ? chapters[activeChapterIndex + 1] : null;

  // Reseta flag de scroll ao trocar história ou capítulo para abrir sempre em scrollY = 0 (R1/R2)
  useEffect(() => {
    hasUserNavigatedParagraphRef.current = false;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeStory.id, activeChapter.id]);

  // Rola suavemente até o parágrafo ativo sem roubar foco do teclado
  useEffect(() => {
    if (!isPlaying && !hasUserNavigatedParagraphRef.current) {
      return;
    }
    const targetEl = paragraphRefs.current[currentParagraph - 1];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentParagraph, isPlaying]);

  // Handlers explícitos de controle do usuário (R21: só anunciam quando acionados pelo usuário)
  const handleTogglePlay = useCallback(() => {
    const next = !isPlaying;
    setIsPlaying(next);
    announceNvda(next ? t.reader.nvdaPlaying : t.reader.nvdaPaused, 'control');
  }, [isPlaying, setIsPlaying, announceNvda, t]);

  // R5 (Simular): a tecla de mídia do headset é disparada pelo painel do avaliador,
  // fora da interface do usuário, e chega aqui como evento global.
  useEffect(() => {
    const onHeadsetKey = () => handleTogglePlay();
    window.addEventListener(HEADSET_MEDIA_KEY_EVENT, onHeadsetKey);
    return () => window.removeEventListener(HEADSET_MEDIA_KEY_EVENT, onHeadsetKey);
  }, [handleTogglePlay]);

  const handlePrevParagraph = useCallback(() => {
    const next = Math.max(1, currentParagraph - 1);
    hasUserNavigatedParagraphRef.current = true;
    setCurrentParagraph(next);
    announceNvda(t.reader.paragraphOf(next, totalParagraphs), 'control');
  }, [currentParagraph, totalParagraphs, setCurrentParagraph, announceNvda, t]);

  const handleNextParagraph = useCallback(() => {
    const next = Math.min(totalParagraphs, currentParagraph + 1);
    hasUserNavigatedParagraphRef.current = true;
    setCurrentParagraph(next);
    announceNvda(t.reader.paragraphOf(next, totalParagraphs), 'control');
  }, [currentParagraph, totalParagraphs, setCurrentParagraph, announceNvda, t]);

  const handleChangeRate = useCallback(
    (rate: PlaybackRate) => {
      setPlaybackRate(rate);
      announceNvda(
        t.reader.nvdaSpeed(formatPlaybackRate(rate, siteLanguage)),
        'control'
      );
    },
    [setPlaybackRate, announceNvda, t, siteLanguage]
  );

  const handleSeekParagraph = useCallback(
    (paragraph: number) => {
      const clamped = Math.max(1, Math.min(paragraph, totalParagraphs));
      hasUserNavigatedParagraphRef.current = true;
      setCurrentParagraph(clamped);
      announceNvda(t.reader.paragraphOf(clamped, totalParagraphs), 'progress');
    },
    [totalParagraphs, setCurrentParagraph, announceNvda, t]
  );

  const handleFocusProgress = useCallback(() => {
    announceNvda(
      t.reader.paragraphOf(currentParagraph, totalParagraphs),
      'progress'
    );
  }, [currentParagraph, totalParagraphs, announceNvda, t]);

  const handleSelectParagraph = useCallback(
    (paragraphNumber: number) => {
      hasUserNavigatedParagraphRef.current = true;
      setCurrentParagraph(paragraphNumber);
    },
    [setCurrentParagraph]
  );

  // Atalhos de teclado globais: D (Landmark Ouvir), Alt+P, Alt+↑, Alt+↓ (R4, R5, R21)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tecla D: simula atalho de landmark do NVDA -> foca #audio-player-region SEM iniciar/pausar áudio
      if (
        !event.repeat &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'd' &&
        !isEditableElement(event.target)
      ) {
        event.preventDefault();
        playerRegionRef.current?.focus({ preventScroll: true });
        announceNvda(t.reader.nvdaRegionFocus, 'system');
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const keyLower = event.key.toLowerCase();
        if (!event.repeat && keyLower === 'p') {
          event.preventDefault();
          handleTogglePlay();
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          handlePrevParagraph();
          return;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          handleNextParagraph();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    announceNvda,
    handleTogglePlay,
    handlePrevParagraph,
    handleNextParagraph,
    t,
  ]);

  // Integração com Media Session API (R5)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    try {
      if (typeof MediaMetadata !== 'undefined') {
        mediaSession.metadata = new MediaMetadata({
          title: `${activeChapter.title} — ${t.reader.paragraphOf(currentParagraph, totalParagraphs)}`,
          artist: activeStory.author,
          album: activeStory.title,
        });
      }
      mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // Ignora em navegadores com suporte parcial a MediaMetadata
    }

    const safeSetAction = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch {
        // Ação não suportada pelo navegador
      }
    };

    safeSetAction('play', () => {
      if (!isPlaying) {
        setIsPlaying(true);
        announceNvda(t.reader.nvdaPlaying, 'control');
      }
    });
    safeSetAction('pause', () => {
      if (isPlaying) {
        setIsPlaying(false);
        announceNvda(t.reader.nvdaPaused, 'control');
      }
    });
    safeSetAction('previoustrack', () => {
      handlePrevParagraph();
    });
    safeSetAction('nexttrack', () => {
      handleNextParagraph();
    });

    return () => {
      safeSetAction('play', null);
      safeSetAction('pause', null);
      safeSetAction('previoustrack', null);
      safeSetAction('nexttrack', null);
    };
  }, [
    activeStory.title,
    activeStory.author,
    activeChapter.title,
    currentParagraph,
    totalParagraphs,
    isPlaying,
    setIsPlaying,
    announceNvda,
    handlePrevParagraph,
    handleNextParagraph,
    t,
  ]);

  // Ao mudar de parágrafo, capítulo ou história, reseta a posição de pausa para começar do início
  useEffect(() => {
    resetParagraphProgress();
  }, [currentParagraph, activeChapter.id, activeStory.id]);

  // Ajusta a velocidade de reprodução ao vivo sem reiniciar o parágrafo em andamento (R6)
  useEffect(() => {
    ttsHandleRef.current?.setRate(playbackRate);
  }, [playbackRate]);

  // Pré-aquece o parágrafo atual no Piper TTS local para resposta instantânea ao dar Play
  useEffect(() => {
    const text = activeChapter.paragraphs[currentParagraph - 1];
    if (!text) return;
    const targetLang =
      activeStory.language === 'en'
        ? 'en-US'
        : activeStory.language === 'es'
        ? 'es-ES'
        : 'pt-BR';
    prefetchParagraphAudio(text, targetLang);
  }, [activeChapter.paragraphs, currentParagraph, activeStory.language]);

  // Motor de Reprodução: Piper TTS Neural Local + Fallback Web Speech/Temporizado (R21: avanço silencioso)
  useEffect(() => {
    if (!isPlaying) {
      if (ttsHandleRef.current) {
        // Pausa preservando o ponto exato dentro do parágrafo atual
        ttsHandleRef.current.pause();
        ttsHandleRef.current = null;
      }
      return;
    }

    const text = activeChapter.paragraphs[currentParagraph - 1];
    if (!text) {
      setIsPlaying(false);
      return;
    }

    const nextText = activeChapter.paragraphs[currentParagraph];
    // R8: seleciona idioma e voz compatíveis com o idioma da história (não do site)
    const targetLang =
      activeStory.language === 'en'
        ? 'en-US'
        : activeStory.language === 'es'
        ? 'es-ES'
        : 'pt-BR';

    const handle = speakParagraph({
      text,
      lang: targetLang,
      rate: playbackRateRef.current,
      nextText,
      onEnded: () => {
        resetParagraphProgress();
        if (currentParagraph < totalParagraphs) {
          hasUserNavigatedParagraphRef.current = true;
          // R21: Avanço automático contínuo NUNCA anuncia no NVDA
          setCurrentParagraph(currentParagraph + 1);
        } else {
          setIsPlaying(false);
        }
      },
    });
    ttsHandleRef.current = handle;

    return () => {
      handle.pause();
      if (ttsHandleRef.current === handle) {
        ttsHandleRef.current = null;
      }
    };
  }, [
    isPlaying,
    currentParagraph,
    activeChapter.id,
    activeChapter.paragraphs,
    activeStory.language,
    totalParagraphs,
    setCurrentParagraph,
    setIsPlaying,
  ]);

  return (
    <div ref={screenRootRef} className="reader-desktop">
      {/* Sub-header sticky #funbar abaixo do WattpadHeader (top: 68px) */}
      <div id="funbar" className="reader-funbar" role="region" aria-label={t.reader.funbarLabel}>
        <div className="reader-funbar__inner">
          <div className="reader-funbar__story">
            <StoryCoverSvg
              story={activeStory}
              width={28}
              className="reader-funbar__cover"
              decorative
            />

            <div className="reader-funbar__meta">
              <span className="reader-funbar__title" title={activeStory.title}>
                {activeStory.title}
              </span>

              <div className="reader-funbar__select-group">
                <label htmlFor="reader-chapter-select" className="sr-only">
                  {t.reader.chapterSelectLabel}
                </label>
                <select
                  id="reader-chapter-select"
                  className="reader-funbar__select"
                  aria-label={t.reader.chapterSelectLabel}
                  value={activeChapterIndex}
                  onChange={(e) => setActiveChapter(Number(e.target.value))}
                >
                  {chapters.map((ch, idx) => (
                    <option key={ch.id} value={idx}>
                      {formatChapterLabel(
                        ch.title,
                        t.reader.chapterLabel(ch.number)
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reader-funbar__select-group">
                <label htmlFor="reader-story-select" className="sr-only">
                  {t.reader.storySelectLabel}
                </label>
                <select
                  id="reader-story-select"
                  className="reader-funbar__select"
                  aria-label={extra.storySelectAria}
                  value={activeStory.id}
                  onChange={(e) => setActiveStory(e.target.value, 0)}
                >
                  {readableStories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.title} ({STORY_LANG_LABEL[story.language]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="reader-funbar__actions">
            <button
              type="button"
              className={`funbar-btn ${addedToList ? 'funbar-btn--active' : ''}`}
              aria-pressed={addedToList}
              aria-label={
                addedToList
                  ? extra.removeFromListAria
                  : t.reader.addToListTooltip
              }
              title={
                addedToList
                  ? extra.removeFromListAria
                  : t.reader.addToListTooltip
              }
              onClick={() =>
                setListedStories((prev) => ({
                  ...prev,
                  [activeStory.id]: !prev[activeStory.id],
                }))
              }
            >
              {addedToList ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
              <span>{addedToList ? extra.inListText : '+'}</span>
            </button>

            <button
              type="button"
              className={`funbar-btn funbar-btn--vote ${
                hasVoted ? 'funbar-btn--voted' : ''
              }`}
              aria-pressed={hasVoted}
              title={t.reader.voteTooltip}
              onClick={() =>
                setVotedStories((prev) => ({
                  ...prev,
                  [activeStory.id]: !prev[activeStory.id],
                }))
              }
            >
              <StarIcon size={16} />
              <span>{hasVoted ? t.reader.votedBtn : t.reader.voteBtn}</span>
            </button>
          </div>
        </div>

        {/* Barra fina de progresso de leitura (#00B2B2) */}
        <div
          className="reader-funbar__progress-track"
          aria-hidden="true"
        >
          <div
            className="reader-funbar__progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Área de Leitura (coluna centralizada 580px, 18px/30px) */}
      <div className="reader-main">
        <article
          className="reader-article"
          lang={STORY_HTML_LANG[activeStory.language]}
        >
          <header className="reader-chapter-header">
            <div className="reader-chapter-kicker">
              <LanguageBadge language={activeStory.language} />
              <span>
                {activeStory.title} · {extra.byWord} {activeStory.author}
              </span>
            </div>

            <h1 className="reader-chapter-title">
              {formatChapterLabel(
                activeChapter.title,
                t.reader.chapterLabel(activeChapter.number)
              )}
            </h1>

            <div className="reader-chapter-subtitle">
              <span>
                {t.reader.paragraphsCount(totalParagraphs)} ·{' '}
                {extra.currentParagraphLabel}:{' '}
                <strong>
                  {extra.paragraphShort(currentParagraph, totalParagraphs)}
                </strong>
              </span>
              <span>
                {extra.savedSpeedLabel}:{' '}
                <strong>{formatPlaybackRate(playbackRate, siteLanguage)}</strong>
              </span>
            </div>

            <div className="reader-shortcuts-hint" lang={t.locale}>
              <strong>{extra.shortcutsPrefix}</strong>{' '}
              {extra.shortcutsKeys(
                <kbd>D</kbd>,
                <kbd>Alt</kbd>,
                <kbd>P</kbd>,
                <kbd>↑</kbd>,
                <kbd>↓</kbd>
              )}
            </div>
          </header>

          <div className="reader-paragraphs">
            {activeChapter.paragraphs.map((text, idx) => {
              const paragraphNumber = idx + 1;
              const isActive = currentParagraph === paragraphNumber;
              return (
                <p
                  key={`${activeChapter.id}-p-${paragraphNumber}`}
                  ref={(el) => {
                    paragraphRefs.current[idx] = el;
                  }}
                  tabIndex={0}
                  data-paragraph={paragraphNumber}
                  data-paragraph-number={paragraphNumber}
                  className={`reader-paragraph ${
                    isActive ? 'reader-paragraph--active' : ''
                  } ${
                    isActive && isPlaying ? 'reader-paragraph--playing' : ''
                  }`}
                  onClick={() => handleSelectParagraph(paragraphNumber)}
                  title={t.reader.jumpToParagraphTitle(paragraphNumber)}
                >
                  <span className="reader-paragraph__num" aria-hidden="true">
                    {paragraphNumber}
                  </span>
                  <span className="reader-paragraph__body">
                    <span className="reader-paragraph__text">{text}</span>
                    {isActive && (
                      <span
                        className="reader-paragraph__status"
                        aria-hidden="true"
                      >
                        {isPlaying
                          ? extra.activeReadingTag(paragraphNumber)
                          : extra.activeSelectedTag(paragraphNumber)}
                      </span>
                    )}
                  </span>
                </p>
              );
            })}
          </div>
        </article>

        {/* Navegação ao final do capítulo (Cap. 1 -> Cap. 2 preservando playbackRate e player fixo) */}
        <nav className="reader-chapter-footer" aria-label={extra.footerNavAria}>
          {nextChapter ? (
            <>
              <h2 className="reader-chapter-footer__title">
                {extra.endOfChapterTitle(activeChapter.number)}
              </h2>
              <p className="reader-chapter-footer__desc">
                {extra.continueReadingDesc(
                  formatPlaybackRate(playbackRate, siteLanguage)
                )}
              </p>
              <div className="reader-chapter-footer__actions">
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={() => setActiveChapter(activeChapterIndex + 1)}
                >
                  {t.reader.nextChapterBtn(
                    t.reader.chapterLabel(nextChapter.number)
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="reader-chapter-footer__title">
                {extra.endOfChapterTitle(activeChapter.number)}
              </h2>
              <p className="reader-chapter-footer__desc">
                {extra.endOfStoryDesc}
              </p>
              <div className="reader-chapter-footer__actions">
                {chapters.length > 1 && (
                  <button
                    type="button"
                    className="btn-pill-secondary"
                    onClick={() => setActiveChapter(0)}
                  >
                    {extra.backToChapter1}
                  </button>
                )}
              </div>
            </>
          )}
        </nav>
      </div>

      {/* Barra fixa inferior do player — renderizada completa desde scrollY = 0 (R1–R8, R16, R17, R21) */}
      <DesktopAudioPlayer
        playerRegionRef={playerRegionRef}
        storyLanguage={activeStory.language}
        siteLanguage={siteLanguage}
        isPlaying={isPlaying}
        currentParagraph={currentParagraph}
        totalParagraphs={totalParagraphs}
        playbackRate={playbackRate}
        onTogglePlay={handleTogglePlay}
        onPrevParagraph={handlePrevParagraph}
        onNextParagraph={handleNextParagraph}
        onChangeRate={handleChangeRate}
        onSeekParagraph={handleSeekParagraph}
        onFocusProgress={handleFocusProgress}
      />
    </div>
  );
};
