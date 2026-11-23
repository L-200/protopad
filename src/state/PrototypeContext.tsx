/**
 * @fileoverview Provedor de estado global e hook `usePrototype` do protótipo TP2 IHC 2026.
 * Centraliza a navegação entre as 6 telas, preferências duais de idioma com desfazer (R8, R10, R15, R18),
 * controle do player de áudio desktop com persistência de velocidade entre capítulos (R1–R6),
 * anúncios silenciosos sob demanda para o NVDA (R7, R21), tema Alto Contraste e lupa de foco (R22),
 * além dos rascunhos compartilhados de Leonardo (Tela 4) e Sansão (Telas 5 e 6) e dos presets de cenários.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { stopAllAudioPlayback } from '../audio/ttsEngine';
import { TRANSLATIONS } from '../i18n/translations';
import {
  buildCarousels,
  computeLeonardoWordCount,
  createInitialLeonardoDraft,
  createInitialMobileChapters,
  MOCK_STORIES,
} from '../data/mockStories';
import {
  ChapterData,
  LanguageConfirmation,
  LeonardoDraft,
  MobileBlock,
  MobileStoryChapter,
  NvdaLogEntry,
  NvdaLogSource,
  PersonaPresetId,
  PlaybackRate,
  PrototypeContextValue,
  SansaoChapter,
  ScreenId,
  SiteLanguage,
  StoryItem,
  StoryLanguage,
  ThemeMode,
  UpdateLanguagesPayload,
} from '../types/prototype';

const PrototypeContext = createContext<PrototypeContextValue | null>(null);

/**
 * Converte o código do idioma de interface em rótulo legível para mensagens de confirmação (R10, R18).
 *
 * @param lang Código do idioma do site.
 * @returns Nome formatado do idioma.
 */
function formatSiteLangLabel(lang: SiteLanguage): string {
  switch (lang) {
    case 'pt-BR':
      return 'Português (Brasil)';
    case 'en-US':
      return 'English (US)';
    case 'es-ES':
      return 'Español';
  }
}

/**
 * Converte o código do idioma das histórias em rótulo legível para confirmações e selos (R10, R17, R18).
 *
 * @param lang Código do idioma das histórias.
 * @returns Nome formatado do idioma.
 */
function formatStoryLangLabel(lang: StoryLanguage): string {
  switch (lang) {
    case 'pt':
      return 'Português';
    case 'en':
      return 'English';
    case 'es':
      return 'Español';
  }
}

/**
 * Gera o horário local formatado (`HH:MM:SS`) para carimbar entradas do monitor NVDA.
 *
 * @returns String de horário no padrão pt-BR.
 */
function formatTimeNow(): string {
  const now = new Date();
  return now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Provedor global que mantém e sincroniza todo o estado do protótipo entre as 6 telas.
 * Também sincroniza `document.documentElement.lang` com `siteLanguage` (R8) e `data-theme`
 * com o modo Alto Contraste Escuro (R22).
 *
 * @param props Conteúdo filho envolvido pelo provedor.
 */
export const PrototypeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Navegação e Modal
  const [activeScreen, setActiveScreen] = useState<ScreenId>('tela_1_home');
  const [previousScreen, setPreviousScreen] = useState<ScreenId | null>(null);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);

  // Idioma (W01)
  const [siteLanguage, setSiteLanguage] = useState<SiteLanguage>('pt-BR');
  // Começa igual ao preset do Cenário 3 (Adriana), que o painel do avaliador mostra como ativo.
  const [storiesLanguage, setStoriesLanguage] = useState<StoryLanguage>('en');
  const [languageConfirmation, setLanguageConfirmation] =
    useState<LanguageConfirmation | null>(null);
  const [hideUntranslatedCarousels, setHideUntranslatedCarousels] =
    useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Leitura Desktop (W10)
  const [activeStoryId, setActiveStoryId] = useState<string>(
    'cronicas-do-silencio'
  );
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentParagraph, setCurrentParagraphState] = useState<number>(1);
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1.0);

  // NVDA, Lupa e Tema (R21 / R22)
  const [nvdaLiveMessage, setNvdaLiveMessage] = useState<string>('');
  const [nvdaLog, setNvdaLog] = useState<NvdaLogEntry[]>([]);
  const [showNvdaMonitor, setShowNvdaMonitor] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [magnifierEnabled, setMagnifierEnabled] = useState<boolean>(false);

  // Editor Desktop — Leonardo (W22)
  const [leonardoDraft, setLeonardoDraft] = useState<LeonardoDraft>(() =>
    createInitialLeonardoDraft()
  );

  // Mobile — Sansão (W10 / W22, múltiplos capítulos para Tarefas A, B e C)
  const [mobileChapters, setMobileChapters] = useState<MobileStoryChapter[]>(() =>
    createInitialMobileChapters()
  );
  const [activeMobileChapterId, setActiveMobileChapterId] =
    useState<string>('sansao-cap-9');
  const [mobileCurrentParagraph, setMobileCurrentParagraph] =
    useState<number>(1);
  const [mobileIsPlaying, setMobileIsPlaying] = useState<boolean>(false);

  // Preset Ativo
  const [activePreset, setActivePreset] = useState<PersonaPresetId>('adriana');

  const saveTimerRef = useRef<number | null>(null);
  const liveReplayTimerRef = useRef<number | null>(null);
  const siteLanguageRef = useRef<SiteLanguage>(siteLanguage);
  siteLanguageRef.current = siteLanguage;

  // Sincronizar lang no <html> e data-theme no root (R8 e R22)
  useEffect(() => {
    document.documentElement.lang = siteLanguage;
  }, [siteLanguage]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (liveReplayTimerRef.current !== null) {
        window.clearTimeout(liveReplayTimerRef.current);
      }
    };
  }, []);

  // Catálogo derivado
  const stories = useMemo(() => MOCK_STORIES, []);

  const carousels = useMemo(
    () => buildCarousels(storiesLanguage),
    [storiesLanguage]
  );

  const activeStory: StoryItem = useMemo(() => {
    return (
      stories.find((s) => s.id === activeStoryId) ?? stories[0]
    );
  }, [stories, activeStoryId]);

  const activeChapter: ChapterData = useMemo(() => {
    const chapters = activeStory.chapters;
    if (!chapters || chapters.length === 0) {
      return stories[0].chapters![0];
    }
    const safeIndex = Math.max(
      0,
      Math.min(activeChapterIndex, chapters.length - 1)
    );
    return chapters[safeIndex];
  }, [activeStory, activeChapterIndex, stories]);

  const activeMobileChapter: MobileStoryChapter = useMemo(() => {
    return (
      mobileChapters.find((c) => c.id === activeMobileChapterId) ??
      mobileChapters[0]
    );
  }, [mobileChapters, activeMobileChapterId]);

  const sansaoChapter: SansaoChapter = useMemo(() => {
    const total = Math.max(1, activeMobileChapter.blocks.length);
    return {
      storyTitle: activeMobileChapter.storyTitle,
      chapterTitle: activeMobileChapter.chapterTitle,
      blocks: activeMobileChapter.blocks,
      currentParagraph: Math.max(1, Math.min(mobileCurrentParagraph, total)),
      isPlaying: mobileIsPlaying,
      edited: Boolean(activeMobileChapter.edited),
    };
  }, [activeMobileChapter, mobileCurrentParagraph, mobileIsPlaying]);

  // NVDA Live Announcer (R21)
  /**
   * Emite anúncio curto para a região `aria-live="polite"` e registra no histórico do monitor NVDA (R21).
   * Caso o texto seja idêntico ao último anunciado, limpa e reemite após 25 ms para garantir nova leitura.
   */
  const announceNvda = useCallback(
    (text: string, source: NvdaLogSource = 'system') => {
      const clean = text.trim();
      if (!clean) return;

      const entry: NvdaLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatTimeNow(),
        text: clean,
        source,
      };

      setNvdaLog((prev) => [entry, ...prev].slice(0, 40));

      if (liveReplayTimerRef.current !== null) {
        window.clearTimeout(liveReplayTimerRef.current);
      }

      setNvdaLiveMessage((prevMsg) => {
        if (prevMsg === clean) {
          liveReplayTimerRef.current = window.setTimeout(() => {
            setNvdaLiveMessage(clean);
          }, 25);
          return '';
        }
        return clean;
      });
    },
    []
  );

  /** Limpa o histórico visual do monitor NVDA e zera a mensagem viva atual. */
  const clearNvdaLog = useCallback(() => {
    setNvdaLog([]);
    setNvdaLiveMessage('');
  }, []);

  /**
   * Navega para uma das 6 telas do protótipo, preservando `previousScreen` para retorno contextual
   * e pausando reproduções ativas ao sair das telas de leitura/mobile.
   */
  const navigateTo = useCallback(
    (screen: ScreenId) => {
      setActiveScreen((current) => {
        if (current !== screen) {
          setPreviousScreen(current);
        }
        return screen;
      });
      if (screen === 'tela_2_idioma') {
        setIsLanguageModalOpen(false);
      }
      if (screen !== 'tela_3_leitura_desktop') {
        setMagnifierEnabled(false);
      }
      setIsPlaying(false);
      setMobileIsPlaying(false);
      stopAllAudioPlayback();
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    []
  );

  /** Abre o modal global de configurações de idioma (Tela 2 em modo modal). */
  const openLanguageModal = useCallback(() => {
    setIsLanguageModalOpen(true);
  }, []);

  /** Fecha o modal global de configurações de idioma. */
  const closeLanguageModal = useCallback(() => {
    setIsLanguageModalOpen(false);
  }, []);

  /**
   * Atualiza o idioma do site e/ou das histórias recomendadas (R10), gerando confirmação
   * localizada em português com suporte a "Desfazer" (R18) e anúncio curto para o NVDA.
   */
  const updateLanguages = useCallback(
    (payload: UpdateLanguagesPayload) => {
      const prevSite = siteLanguage;
      const prevStories = storiesLanguage;
      const nextSite = payload.siteLanguage ?? prevSite;
      const nextStories = payload.storiesLanguage ?? prevStories;

      const siteChanged = nextSite !== prevSite;
      const storiesChanged = nextStories !== prevStories;

      setSiteLanguage(nextSite);
      setStoriesLanguage(nextStories);

      const conf = TRANSLATIONS[nextSite].confirmations;
      let message: string;
      if (siteChanged && storiesChanged) {
        message = conf.bothChanged(
          formatSiteLangLabel(nextSite),
          formatStoryLangLabel(nextStories)
        );
      } else if (storiesChanged) {
        message = conf.storiesChanged(formatStoryLangLabel(nextStories));
      } else if (siteChanged) {
        message = conf.siteChanged(formatSiteLangLabel(nextSite));
      } else {
        message = conf.unchanged(
          formatSiteLangLabel(nextSite),
          formatStoryLangLabel(nextStories)
        );
      }

      setLanguageConfirmation({
        message,
        previousSite: prevSite,
        previousStories: prevStories,
        canUndo: siteChanged || storiesChanged,
      });
    },
    [siteLanguage, storiesLanguage]
  );

  /** Reverte a última alteração de idioma usando o snapshot armazenado em `languageConfirmation` (R18). */
  const undoLanguageChange = useCallback(() => {
    if (!languageConfirmation || !languageConfirmation.canUndo) return;
    const { previousSite, previousStories } = languageConfirmation;
    setSiteLanguage(previousSite);
    setStoriesLanguage(previousStories);
    const conf = TRANSLATIONS[previousSite].confirmations;
    const restoredMessage = conf.undone(
      formatSiteLangLabel(previousSite),
      formatStoryLangLabel(previousStories)
    );
    setLanguageConfirmation({
      message: restoredMessage,
      previousSite,
      previousStories,
      canUndo: false,
    });
  }, [languageConfirmation]);

  /** Dispensa o banner de confirmação de idioma após leitura pelo usuário. */
  const dismissLanguageConfirmation = useCallback(() => {
    setLanguageConfirmation(null);
  }, []);

  /**
   * Seleciona a história ativa no leitor desktop (Tela 3), limitando o capítulo ao intervalo válido
   * e reiniciando a posição de leitura no parágrafo 1.
   */
  const setActiveStory = useCallback(
    (storyId: string, chapterIndex = 0) => {
      const target = stories.find((s) => s.id === storyId);
      const maxIdx = Math.max(0, (target?.chapters?.length ?? 1) - 1);
      const clampedIdx = Math.max(0, Math.min(chapterIndex, maxIdx));
      setActiveStoryId(storyId);
      setActiveChapterIndex(clampedIdx);
      setCurrentParagraphState(1);
      setIsPlaying(false);
      stopAllAudioPlayback();
    },
    [stories]
  );

  /**
   * Troca o capítulo ativo na história atual, reiniciando o parágrafo para 1 e pausando o áudio
   * enquanto preserva a velocidade preferida (`playbackRate`, conforme R6).
   */
  const setActiveChapter = useCallback(
    (chapterIndex: number) => {
      const maxIdx = Math.max(0, (activeStory.chapters?.length ?? 1) - 1);
      const clampedIdx = Math.max(0, Math.min(chapterIndex, maxIdx));
      // Trocar capítulo zera parágrafo para 1 e pausa, preservando playbackRate (R6)
      setActiveChapterIndex(clampedIdx);
      setCurrentParagraphState(1);
      setIsPlaying(false);
      stopAllAudioPlayback();
    },
    [activeStory]
  );

  /** Atualiza o índice 1-based do parágrafo atual no leitor desktop, limitado ao total do capítulo. */
  const setCurrentParagraph = useCallback(
    (paragraph: number) => {
      const total = Math.max(1, activeChapter.paragraphs.length);
      const clamped = Math.max(1, Math.min(paragraph, total));
      setCurrentParagraphState(clamped);
    },
    [activeChapter]
  );

  /** Alterna entre o tema claro padrão e o Modo Alto Contraste Escuro (R22) com anúncio acessível. */
  const toggleHighContrast = useCallback(() => {
    const sharedCopy = TRANSLATIONS[siteLanguageRef.current].shared;
    setTheme((prev) => {
      const next: ThemeMode = prev === 'light' ? 'high-contrast' : 'light';
      announceNvda(
        next === 'high-contrast'
          ? sharedCopy.highContrastOnNvda
          : sharedCopy.highContrastOffNvda,
        'system'
      );
      return next;
    });
  }, [announceNvda]);

  /**
   * Atualiza o rascunho do Leonardo (Tela 4) e simula salvamento automático assíncrono (320 ms)
   * exibido no indicador `"Salvando..."` / `"Salvo"` do cabeçalho do editor (R15).
   */
  const updateLeonardoDraft = useCallback(
    (
      updater:
        | Partial<LeonardoDraft>
        | ((prev: LeonardoDraft) => LeonardoDraft)
    ) => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      setLeonardoDraft((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        const explicitStatus =
          typeof updater === 'object' && updater.saveStatus !== undefined;
        return explicitStatus
          ? next
          : { ...next, saveStatus: 'Salvando...' };
      });

      saveTimerRef.current = window.setTimeout(() => {
        setLeonardoDraft((curr) =>
          curr.saveStatus === 'Salvo' ? curr : { ...curr, saveStatus: 'Salvo' }
        );
      }, 320);
    },
    []
  );

  /** Publica o Capítulo 3 do Leonardo com carimbo de horário e feedback acessível localizado (R15). */
  const publishLeonardoChapter = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    const loc = TRANSLATIONS[siteLanguageRef.current];
    const nowTime = new Date().toLocaleTimeString(loc.locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
    setLeonardoDraft((prev) => ({
      ...prev,
      saveStatus: 'Salvo',
      published: true,
      publishedAt: nowTime,
    }));
    announceNvda(loc.editor.nvdaPublished, 'editor');
  }, [announceNvda]);

  /** Restaura o rascunho inicial de Leonardo (1.240 palavras) cancelando timers pendentes. */
  const resetLeonardoDraft = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    setLeonardoDraft(createInitialLeonardoDraft());
  }, []);

  /** Calcula a contagem de palavras do rascunho informado ou do estado atual de Leonardo. */
  const getLeonardoWordCount = useCallback(
    (draft?: LeonardoDraft) => computeLeonardoWordCount(draft ?? leonardoDraft),
    [leonardoDraft]
  );

  const mobileChaptersRef = useRef(mobileChapters);
  mobileChaptersRef.current = mobileChapters;
  const activeMobileChapterIdRef = useRef(activeMobileChapterId);
  activeMobileChapterIdRef.current = activeMobileChapterId;
  const mobileCurrentParagraphRef = useRef(mobileCurrentParagraph);
  mobileCurrentParagraphRef.current = mobileCurrentParagraph;
  const mobileIsPlayingRef = useRef(mobileIsPlaying);
  mobileIsPlayingRef.current = mobileIsPlaying;

  /** Seleciona um capítulo do catálogo mobile preservando a velocidade de leitura (R6). */
  const selectMobileChapter = useCallback((chapterId: string) => {
    const exists = mobileChaptersRef.current.some((c) => c.id === chapterId);
    if (!exists) return;
    setActiveMobileChapterId(chapterId);
    setMobileCurrentParagraph(1);
    setMobileIsPlaying(false);
    stopAllAudioPlayback();
  }, []);

  /** Atualiza os blocos de um capítulo mobile específico por ID. */
  const updateMobileChapterBlocks = useCallback(
    (chapterId: string, blocks: MobileBlock[], markEdited = true) => {
      setMobileChapters((prev) =>
        prev.map((ch) =>
          ch.id === chapterId ? { ...ch, blocks, edited: markEdited } : ch
        )
      );
      if (chapterId === activeMobileChapterIdRef.current) {
        const total = Math.max(1, blocks.length);
        setMobileCurrentParagraph((p) => Math.max(1, Math.min(p, total)));
      }
    },
    []
  );

  /** Atalho compatível para atualizar os blocos do capítulo mobile ativo. */
  const updateSansaoChapterBlocks = useCallback(
    (blocks: MobileBlock[], markEdited = true) => {
      updateMobileChapterBlocks(
        activeMobileChapterIdRef.current,
        blocks,
        markEdited
      );
    },
    [updateMobileChapterBlocks]
  );

  /** Atualiza o estado do capítulo mobile ativo compartilhado entre leitura e edição (Telas 5 e 6). */
  const updateSansaoChapter = useCallback(
    (
      updater:
        | Partial<SansaoChapter>
        | ((prev: SansaoChapter) => SansaoChapter)
    ) => {
      const targetId = activeMobileChapterIdRef.current;
      const targetCh =
        mobileChaptersRef.current.find((c) => c.id === targetId) ??
        mobileChaptersRef.current[0];
      if (!targetCh) return;

      const currentProjection: SansaoChapter = {
        storyTitle: targetCh.storyTitle,
        chapterTitle: targetCh.chapterTitle,
        blocks: targetCh.blocks,
        currentParagraph: Math.max(
          1,
          Math.min(
            mobileCurrentParagraphRef.current,
            Math.max(1, targetCh.blocks.length)
          )
        ),
        isPlaying: mobileIsPlayingRef.current,
        edited: Boolean(targetCh.edited),
      };

      const next =
        typeof updater === 'function'
          ? updater(currentProjection)
          : { ...currentProjection, ...updater };

      setMobileChapters((prevChapters) =>
        prevChapters.map((ch) =>
          ch.id === targetId
            ? {
                ...ch,
                storyTitle: next.storyTitle,
                chapterTitle: next.chapterTitle,
                blocks: next.blocks,
                edited: next.edited,
              }
            : ch
        )
      );

      const total = Math.max(1, next.blocks.length);
      setMobileCurrentParagraph(
        Math.max(1, Math.min(next.currentParagraph, total))
      );
      setMobileIsPlaying(next.isPlaying);
    },
    []
  );

  /** Atualiza reprodução e parágrafo atual do player mobile garantindo limites válidos. */
  const setSansaoPlayback = useCallback(
    (updates: { isPlaying?: boolean; currentParagraph?: number }) => {
      if (updates.isPlaying !== undefined) {
        setMobileIsPlaying(updates.isPlaying);
      }
      if (updates.currentParagraph !== undefined) {
        const targetCh =
          mobileChaptersRef.current.find(
            (c) => c.id === activeMobileChapterIdRef.current
          ) ?? mobileChaptersRef.current[0];
        const total = Math.max(1, targetCh?.blocks.length ?? 1);
        setMobileCurrentParagraph(
          Math.max(1, Math.min(updates.currentParagraph, total))
        );
      }
    },
    []
  );

  /** Restaura o catálogo mobile e retorna ao Capítulo 9 inicial da taverna/floresta. */
  const resetSansaoChapter = useCallback(() => {
    setMobileChapters(createInitialMobileChapters());
    setActiveMobileChapterId('sansao-cap-9');
    setMobileCurrentParagraph(1);
    setMobileIsPlaying(false);
    stopAllAudioPlayback();
  }, []);

  /**
   * Aplica o estado completo de um dos 4 cenários de avaliação (Renata, Leonardo, Adriana ou Sansão),
   * ajustando tela inicial, tema, lupa, monitor NVDA, idiomas, velocidade e rascunhos.
   * No preset Renata, remove o foco do botão clicado para que o primeiro Tab atinja o skip link (R4).
   */
  const applyPersonaPreset = useCallback(
    (preset: PersonaPresetId) => {
      setActivePreset(preset);
      setIsLanguageModalOpen(false);
      setLanguageConfirmation(null);
      setSearchQuery('');
      setIsPlaying(false);
      setMobileIsPlaying(false);
      stopAllAudioPlayback();

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      switch (preset) {
        case 'renata': {
          setTheme('high-contrast');
          setMagnifierEnabled(true);
          setShowNvdaMonitor(true);
          setSiteLanguage('pt-BR');
          setStoriesLanguage('pt');
          setPlaybackRate(1.75);
          setActiveStoryId('cronicas-do-silencio');
          setActiveChapterIndex(0);
          setCurrentParagraphState(1);
          setIsPlaying(false);
          setPreviousScreen(null);
          setActiveScreen('tela_3_leitura_desktop');
          setNvdaLog([
            {
              id: 'preset-renata-init',
              timestamp: formatTimeNow(),
              text: 'Preset Renata ativo: Alto Contraste, Lupa 200%, Cap. 1 (40 parágrafos) e velocidade 1,75x.',
              source: 'system',
            },
          ]);
          setNvdaLiveMessage('');
          // Permite que o próximo Tab foque imediatamente o skip link "Ir para o player" (R4)
          document.querySelector<HTMLElement>('.app-shell')?.focus({ preventScroll: true });
          break;
        }
        case 'leonardo': {
          setTheme('light');
          setMagnifierEnabled(false);
          setShowNvdaMonitor(false);
          setSiteLanguage('pt-BR');
          setStoriesLanguage('pt');
          setPlaybackRate(1.0);
          setLeonardoDraft(createInitialLeonardoDraft());
          setPreviousScreen(null);
          setActiveScreen('tela_4_editor_desktop');
          setNvdaLog([]);
          setNvdaLiveMessage('');
          break;
        }
        case 'adriana': {
          setTheme('light');
          setMagnifierEnabled(false);
          setShowNvdaMonitor(false);
          setSiteLanguage('pt-BR');
          setStoriesLanguage('en');
          setPlaybackRate(1.0);
          setActiveStoryId('cronicas-do-silencio');
          setActiveChapterIndex(0);
          setCurrentParagraphState(1);
          setIsPlaying(false);
          setPreviousScreen(null);
          setActiveScreen('tela_1_home');
          setNvdaLog([]);
          setNvdaLiveMessage('');
          break;
        }
        case 'sansao': {
          setTheme('light');
          setMagnifierEnabled(false);
          setShowNvdaMonitor(false);
          setSiteLanguage('pt-BR');
          setStoriesLanguage('pt');
          setPlaybackRate(1.25);
          setMobileChapters(createInitialMobileChapters());
          setActiveMobileChapterId('sansao-cap-9');
          setMobileCurrentParagraph(1);
          setMobileIsPlaying(false);
          setPreviousScreen(null);
          setActiveScreen('tela_5_leitura_mobile');
          setNvdaLog([]);
          setNvdaLiveMessage('');
          break;
        }
      }

      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    []
  );

  const value: PrototypeContextValue = {
    activeScreen,
    previousScreen,
    navigateTo,
    isLanguageModalOpen,
    openLanguageModal,
    closeLanguageModal,

    siteLanguage,
    storiesLanguage,
    languageConfirmation,
    updateLanguages,
    undoLanguageChange,
    dismissLanguageConfirmation,
    hideUntranslatedCarousels,
    setHideUntranslatedCarousels,

    stories,
    carousels,
    searchQuery,
    setSearchQuery,

    activeStoryId,
    activeChapterIndex,
    activeStory,
    activeChapter,
    isPlaying,
    currentParagraph,
    playbackRate,
    setActiveStory,
    setActiveChapter,
    setIsPlaying,
    setCurrentParagraph,
    setPlaybackRate,

    nvdaLiveMessage,
    nvdaLog,
    announceNvda,
    clearNvdaLog,
    showNvdaMonitor,
    setShowNvdaMonitor,
    theme,
    setTheme,
    toggleHighContrast,
    magnifierEnabled,
    setMagnifierEnabled,

    leonardoDraft,
    updateLeonardoDraft,
    publishLeonardoChapter,
    resetLeonardoDraft,
    getLeonardoWordCount,

    sansaoChapter,
    updateSansaoChapter,
    updateSansaoChapterBlocks,
    setSansaoPlayback,
    resetSansaoChapter,
    mobileChapters,
    activeMobileChapterId,
    activeMobileChapter,
    selectMobileChapter,
    updateMobileChapterBlocks,

    activePreset,
    applyPersonaPreset,
  };

  return (
    <PrototypeContext.Provider value={value}>
      {children}
    </PrototypeContext.Provider>
  );
};

/**
 * Hook de acesso ao estado global do protótipo (`PrototypeContextValue`).
 * Deve ser invocado exclusivamente dentro de `PrototypeProvider`.
 *
 * @returns Objeto completo de estado e ações do protótipo.
 * @throws Error Se utilizado fora da árvore de `PrototypeProvider`.
 */
export function usePrototype(): PrototypeContextValue {
  const ctx = useContext(PrototypeContext);
  if (!ctx) {
    throw new Error('usePrototype deve ser usado dentro de PrototypeProvider');
  }
  return ctx;
}
