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
  CheckIcon,
  ContrastIcon,
  HeadphonesIcon,
  PlusIcon,
  StarIcon,
  ZoomInIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { StoryCoverSvg } from '../../components/shared/StoryCoverSvg';
import { usePrototype } from '../../state/PrototypeContext';
import { PlaybackRate, StoryLanguage } from '../../types/prototype';
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
function formatChapterLabel(number: number, title: string): string {
  const lower = title.trim().toLowerCase();
  if (lower.startsWith('capítulo') || lower.startsWith('chapter')) {
    return title;
  }
  return `Capítulo ${number} — ${title}`;
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
    theme,
    toggleHighContrast,
    magnifierEnabled,
    setMagnifierEnabled,
  } = usePrototype();

  const [votedStories, setVotedStories] = useState<Record<string, boolean>>({});
  const [listedStories, setListedStories] = useState<Record<string, boolean>>({});

  const hasVoted = Boolean(votedStories[activeStory.id]);
  const addedToList = Boolean(listedStories[activeStory.id]);

  const screenRootRef = useRef<HTMLDivElement | null>(null);
  const playerRegionRef = useRef<HTMLElement>(null);
  const paragraphRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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
  const isHighContrast = theme === 'high-contrast';

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
    announceNvda(next ? 'Reproduzindo' : 'Pausado', 'control');
  }, [isPlaying, setIsPlaying, announceNvda]);

  const handlePrevParagraph = useCallback(() => {
    const next = Math.max(1, currentParagraph - 1);
    hasUserNavigatedParagraphRef.current = true;
    setCurrentParagraph(next);
    announceNvda(`Parágrafo ${next} de ${totalParagraphs}`, 'control');
  }, [currentParagraph, totalParagraphs, setCurrentParagraph, announceNvda]);

  const handleNextParagraph = useCallback(() => {
    const next = Math.min(totalParagraphs, currentParagraph + 1);
    hasUserNavigatedParagraphRef.current = true;
    setCurrentParagraph(next);
    announceNvda(`Parágrafo ${next} de ${totalParagraphs}`, 'control');
  }, [currentParagraph, totalParagraphs, setCurrentParagraph, announceNvda]);

  const handleChangeRate = useCallback(
    (rate: PlaybackRate) => {
      setPlaybackRate(rate);
      announceNvda(`Velocidade ${formatPlaybackRate(rate)}`, 'control');
    },
    [setPlaybackRate, announceNvda]
  );

  const handleSeekParagraph = useCallback(
    (paragraph: number) => {
      const clamped = Math.max(1, Math.min(paragraph, totalParagraphs));
      hasUserNavigatedParagraphRef.current = true;
      setCurrentParagraph(clamped);
      announceNvda(`Parágrafo ${clamped} de ${totalParagraphs}`, 'progress');
    },
    [totalParagraphs, setCurrentParagraph, announceNvda]
  );

  const handleFocusProgress = useCallback(() => {
    announceNvda(
      `Parágrafo ${currentParagraph} de ${totalParagraphs}`,
      'progress'
    );
  }, [currentParagraph, totalParagraphs, announceNvda]);

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
        announceNvda('Região Ouvir', 'system');
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
          title: `${activeChapter.title} — Parágrafo ${currentParagraph} de ${totalParagraphs}`,
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
        announceNvda('Reproduzindo', 'control');
      }
    });
    safeSetAction('pause', () => {
      if (isPlaying) {
        setIsPlaying(false);
        announceNvda('Pausado', 'control');
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
  ]);

  // Motor de Reprodução: Web Speech API + Fallback Temporizado (R21: avanço automático silencioso)
  useEffect(() => {
    const hasSpeechApi =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    if (!isPlaying) {
      if (hasSpeechApi) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignora erro de cancelamento
        }
      }
      return;
    }

    const text = activeChapter.paragraphs[currentParagraph - 1];
    if (!text) {
      setIsPlaying(false);
      return;
    }

    let cancelled = false;
    let watchdogTimer: number | null = null;
    let fallbackTimer: number | null = null;
    let safetyTimer: number | null = null;
    let speechStarted = false;

    // Estima duração mínima/máxima proporcional à contagem de palavras e playbackRate
    const words = Math.max(6, text.trim().split(/\s+/).length);
    const baseMs = Math.min(5200, Math.max(2400, words * 155));
    const totalFallbackMs = Math.max(850, Math.round(baseMs / playbackRate));

    const advanceToNext = () => {
      if (cancelled) return;
      if (currentParagraph < totalParagraphs) {
        hasUserNavigatedParagraphRef.current = true;
        // R21: Avanço automático contínuo NUNCA anuncia no NVDA
        setCurrentParagraph(currentParagraph + 1);
      } else {
        setIsPlaying(false);
      }
    };

    const startFallbackTimer = (delayMs: number) => {
      if (cancelled || fallbackTimer !== null) return;
      fallbackTimer = window.setTimeout(() => {
        advanceToNext();
      }, delayMs);
    };

    if (hasSpeechApi) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        // R8: seleciona idioma e voz compatíveis com o idioma da história (não do site)
        const targetLang =
          activeStory.language === 'en'
            ? 'en-US'
            : activeStory.language === 'es'
            ? 'es-ES'
            : 'pt-BR';
        utterance.lang = targetLang;
        utterance.rate = playbackRate;

        const voices = window.speechSynthesis.getVoices();
        const shortLang = targetLang.slice(0, 2).toLowerCase();
        const matchedVoice =
          voices.find(
            (v) => v.lang.toLowerCase() === targetLang.toLowerCase()
          ) ?? voices.find((v) => v.lang.toLowerCase().startsWith(shortLang));

        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        utterance.onstart = () => {
          if (cancelled) return;
          speechStarted = true;
          if (watchdogTimer !== null) {
            window.clearTimeout(watchdogTimer);
            watchdogTimer = null;
          }
          // Timer de segurança evita travamento caso o navegador não dispare onend
          const maxSpeechMs = Math.max(
            16000,
            Math.round((words * 1100) / playbackRate)
          );
          safetyTimer = window.setTimeout(() => {
            if (!cancelled) {
              try {
                window.speechSynthesis.cancel();
              } catch {
                // Ignora
              }
              advanceToNext();
            }
          }, maxSpeechMs);
        };

        utterance.onend = () => {
          if (cancelled) return;
          if (watchdogTimer !== null) window.clearTimeout(watchdogTimer);
          if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
          if (safetyTimer !== null) window.clearTimeout(safetyTimer);
          advanceToNext();
        };

        utterance.onerror = () => {
          if (cancelled) return;
          if (!speechStarted && fallbackTimer === null) {
            startFallbackTimer(Math.max(700, totalFallbackMs - 300));
          }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);

        // Fallback automático caso o ambiente Linux/headless não tenha vozes TTS ativas
        watchdogTimer = window.setTimeout(() => {
          if (!cancelled && !speechStarted) {
            try {
              window.speechSynthesis.cancel();
            } catch {
              // Ignora
            }
            startFallbackTimer(Math.max(700, totalFallbackMs - 450));
          }
        }, 420);
      } catch {
        startFallbackTimer(totalFallbackMs);
      }
    } else {
      startFallbackTimer(totalFallbackMs);
    }

    return () => {
      cancelled = true;
      if (watchdogTimer !== null) window.clearTimeout(watchdogTimer);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      if (safetyTimer !== null) window.clearTimeout(safetyTimer);
      utteranceRef.current = null;
      if (hasSpeechApi) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignora
        }
      }
    };
  }, [
    isPlaying,
    currentParagraph,
    playbackRate,
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
      <div id="funbar" className="reader-funbar">
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
                  Selecionar capítulo
                </label>
                <select
                  id="reader-chapter-select"
                  className="reader-funbar__select"
                  aria-label="Selecionar capítulo"
                  value={activeChapterIndex}
                  onChange={(e) => setActiveChapter(Number(e.target.value))}
                >
                  {chapters.map((ch, idx) => (
                    <option key={ch.id} value={idx}>
                      {formatChapterLabel(ch.number, ch.title)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="reader-funbar__select-group">
                <label htmlFor="reader-story-select" className="sr-only">
                  Alternar história para teste de idioma
                </label>
                <select
                  id="reader-story-select"
                  className="reader-funbar__select"
                  aria-label="Selecionar história"
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
              role="switch"
              aria-checked={isHighContrast}
              className={`funbar-btn ${isHighContrast ? 'funbar-btn--active' : ''}`}
              onClick={toggleHighContrast}
            >
              <ContrastIcon size={16} />
              <span>Alto Contraste</span>
              <span className="funbar-btn__state">
                {isHighContrast ? 'Ativo' : 'Desligado'}
              </span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={magnifierEnabled}
              className={`funbar-btn ${
                magnifierEnabled ? 'funbar-btn--active' : ''
              }`}
              onClick={() => setMagnifierEnabled(!magnifierEnabled)}
            >
              <ZoomInIcon size={16} />
              <span>Lupa 200%</span>
              <span className="funbar-btn__state">
                {magnifierEnabled ? 'Ativa' : 'Desligada'}
              </span>
            </button>

            <button
              type="button"
              className="funbar-btn"
              aria-label="Tecla de mídia do headset: alternar reproduzir ou pausar"
              onClick={handleTogglePlay}
            >
              <HeadphonesIcon size={16} />
              <span>Tecla de mídia do headset</span>
            </button>

            <button
              type="button"
              className={`funbar-btn ${addedToList ? 'funbar-btn--active' : ''}`}
              aria-pressed={addedToList}
              aria-label={
                addedToList
                  ? 'Remover história da lista de leitura'
                  : 'Adicionar história à lista de leitura'
              }
              onClick={() =>
                setListedStories((prev) => ({
                  ...prev,
                  [activeStory.id]: !prev[activeStory.id],
                }))
              }
            >
              {addedToList ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
              <span>{addedToList ? 'Na lista' : '+'}</span>
            </button>

            <button
              type="button"
              className={`funbar-btn funbar-btn--vote ${
                hasVoted ? 'funbar-btn--voted' : ''
              }`}
              aria-pressed={hasVoted}
              onClick={() =>
                setVotedStories((prev) => ({
                  ...prev,
                  [activeStory.id]: !prev[activeStory.id],
                }))
              }
            >
              <StarIcon size={16} />
              <span>{hasVoted ? 'Votado' : 'Voto'}</span>
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
                {activeStory.title} · por {activeStory.author}
              </span>
            </div>

            <h1 className="reader-chapter-title">
              {formatChapterLabel(activeChapter.number, activeChapter.title)}
            </h1>

            <div className="reader-chapter-subtitle">
              <span>
                {totalParagraphs} parágrafos · Parágrafo atual:{' '}
                <strong>
                  {currentParagraph} de {totalParagraphs}
                </strong>
              </span>
              <span>
                Velocidade salva:{' '}
                <strong>{formatPlaybackRate(playbackRate)}</strong>
              </span>
            </div>

            <div className="reader-shortcuts-hint" lang="pt-BR">
              <strong>Atalhos de leitura:</strong>{' '}
              <kbd>D</kbd> ir para região Ouvir ·{' '}
              <kbd>Alt</kbd>+<kbd>P</kbd> reproduzir/pausar ·{' '}
              <kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>Alt</kbd>+<kbd>↓</kbd> voltar/avançar
              parágrafo · clique em qualquer parágrafo para saltar.
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
                  data-paragraph={paragraphNumber}
                  className={`reader-paragraph ${
                    isActive ? 'reader-paragraph--active' : ''
                  } ${
                    isActive && isPlaying ? 'reader-paragraph--playing' : ''
                  }`}
                  onClick={() => handleSelectParagraph(paragraphNumber)}
                  title={`Saltar para o parágrafo ${paragraphNumber}`}
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
                          ? `▶ Em leitura · Parágrafo ${paragraphNumber}`
                          : `● Selecionado · Parágrafo ${paragraphNumber}`}
                      </span>
                    )}
                  </span>
                </p>
              );
            })}
          </div>
        </article>

        {/* Navegação ao final do capítulo (Cap. 1 -> Cap. 2 preservando playbackRate e player fixo) */}
        <nav className="reader-chapter-footer" aria-label="Navegação entre capítulos">
          {nextChapter ? (
            <>
              <h2 className="reader-chapter-footer__title">
                Fim do Capítulo {activeChapter.number}
              </h2>
              <p className="reader-chapter-footer__desc">
                Continue a leitura mantendo sua velocidade salva (
                {formatPlaybackRate(playbackRate)}) e o player na mesma posição.
              </p>
              <div className="reader-chapter-footer__actions">
                <button
                  type="button"
                  className="btn-pill-primary"
                  onClick={() => setActiveChapter(activeChapterIndex + 1)}
                >
                  Próximo capítulo: Capítulo {nextChapter.number}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="reader-chapter-footer__title">
                Fim do Capítulo {activeChapter.number}
              </h2>
              <p className="reader-chapter-footer__desc">
                Você chegou ao final dos capítulos disponíveis nesta história.
              </p>
              <div className="reader-chapter-footer__actions">
                {chapters.length > 1 && (
                  <button
                    type="button"
                    className="btn-pill-secondary"
                    onClick={() => setActiveChapter(0)}
                  >
                    Voltar ao Capítulo 1
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
