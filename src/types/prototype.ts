/**
 * @fileoverview Contrato de tipos compartilhados entre todas as 6 telas e o `PrototypeContext`
 * (Fase 1 — TP2 IHC 2026). Modela navegação, presets dos 4 cenários (Renata, Leonardo, Adriana e Sansão),
 * preferências duais de idioma (R9, R10, R17, R18), player de áudio (R1–R8, R21), editor desktop/mobile
 * (R11–R15, R19, R20) e estado de acessibilidade (R21, R22).
 *
 * CONTRATO CONGELADO — FASE 1 (TP2 IHC 2026)
 * Tipos compartilhados entre todas as 6 telas e o PrototypeContext.
 */

/** Identificador canônico de cada uma das 6 telas do protótipo. */
export type ScreenId =
  | 'tela_1_home'
  | 'tela_2_idioma'
  | 'tela_3_leitura_desktop'
  | 'tela_4_editor_desktop'
  | 'tela_5_leitura_mobile'
  | 'tela_6_editor_mobile';

/** Identificador dos presets de avaliação correspondentes às 4 personas dos cenários de IHC. */
export type PersonaPresetId = 'renata' | 'leonardo' | 'adriana' | 'sansao';

/** Idioma da interface do site (menus, botões, dicas e `lang` do documento, conforme R8/R15). */
export type SiteLanguage = 'pt-BR' | 'en-US' | 'es-ES';

/** Idioma das histórias recomendadas e da voz TTS selecionada (R8, R10, R17). */
export type StoryLanguage = 'pt' | 'en' | 'es';

/** Velocidades discretas persistidas no player de áudio entre capítulos e telas (R6). */
export type PlaybackRate = 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;

/** Tema visual ativo; `'high-contrast'` ativa o modo Alto Contraste Escuro (R22). */
export type ThemeMode = 'light' | 'high-contrast';

/** Padrão geométrico vetorial aplicado às capas geradas offline em `StoryCoverSvg`. */
export type CoverMotif =
  | 'waves'
  | 'horizon'
  | 'geometric'
  | 'arcs'
  | 'prism'
  | 'constellation';

/** Paleta de cores e motivo visual de uma capa SVG offline. */
export interface StoryCoverPalette {
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  textColor: string;
  motif: CoverMotif;
}

/** Estrutura de um capítulo consumido pelo leitor desktop (Tela 3). */
export interface ChapterData {
  id: string;
  number: number;
  title: string;
  paragraphs: string[];
}

/** Metadados de história ou lista de leitura exibida nos carrosséis da Home e no leitor. */
export interface StoryItem {
  id: string;
  title: string;
  author: string;
  genre: string;
  language: StoryLanguage;
  reads: string;
  votes: string;
  parts: number;
  synopsis: string;
  tags: string[];
  coverPalette: StoryCoverPalette;
  chapters?: ChapterData[];
  isReadingList?: boolean;
  listStoryCount?: number;
  isCompleted?: boolean;
  isWattys?: boolean;
}

/** Configuração de um carrossel da Home (Tela 1), com flag de tradução para o requisito R9. */
export interface CarouselData {
  id: string;
  titlePt: string;
  titleEn?: string;
  titleEs?: string;
  /** Indica se o carrossel possui título traduzido para PT-BR; quando `false`, pode ser ocultado (R9). */
  hasPtTranslation: boolean;
  kind: 'stories' | 'reading-lists';
  items: StoryItem[];
}

/** Tipos de bloco suportados pelo editor de capítulos desktop (Tela 4 / R11, R14). */
export type EditorBlockType =
  | 'paragraph'
  | 'heading'
  | 'separator'
  | 'image'
  | 'video'
  | 'poll';

/** Alinhamento horizontal aplicável a blocos de texto e separadores nos editores desktop e mobile. */
export type TextAlign = 'left' | 'center' | 'right';

/** Metadados específicos de blocos não-textuais inseridos pela barra do editor (R14). */
export interface EditorBlockMeta {
  caption?: string;
  imagePreset?: string;
  videoTitle?: string;
  pollQuestion?: string;
  pollOptions?: string[];
}

/** Bloco individual do rascunho no editor desktop (Tela 4). */
export interface EditorBlock {
  id: string;
  type: EditorBlockType;
  html: string;
  align: TextAlign;
  meta?: EditorBlockMeta;
}

/** Estado completo do rascunho de capítulo do Leonardo na Tela 4 (Cenário 2 / W22). */
export interface LeonardoDraft {
  storyTitle: string;
  chapterTitle: string;
  blocks: EditorBlock[];
  /** Deslocamento calibrado para iniciar o Capítulo 3 em 1.240 palavras mesmo com poucos blocos visíveis. */
  baseWordCountOffset: number;
  saveStatus: 'Salvo' | 'Salvando...';
  published: boolean;
  publishedAt: string | null;
}

/** Bloco textual ou separador do capítulo mobile editável por Sansão (Telas 5 e 6 / R19, R20). */
export interface MobileBlock {
  id: string;
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  isSeparator?: boolean;
}

/** Estado compartilhado do Capítulo 9 entre leitura mobile (Tela 5) e edição mobile (Tela 6). */
export interface SansaoChapter {
  storyTitle: string;
  chapterTitle: string;
  blocks: MobileBlock[];
  currentParagraph: number;
  isPlaying: boolean;
  edited: boolean;
}

/** Origem de um anúncio emitido para a região viva e monitor NVDA (R21). */
export type NvdaLogSource = 'control' | 'progress' | 'editor' | 'system';

/** Registro individual exibido no monitor visual do NVDA (`NvdaAnnouncer`). */
export interface NvdaLogEntry {
  id: string;
  timestamp: string;
  text: string;
  source: NvdaLogSource;
}

/** Feedback de confirmação após salvar idiomas, com snapshot anterior para suportar "Desfazer" (R18). */
export interface LanguageConfirmation {
  message: string;
  previousSite: SiteLanguage;
  previousStories: StoryLanguage;
  canUndo: boolean;
}

/** Carga parcial aceita por `updateLanguages` para atualizar site e/ou histórias (R10). */
export interface UpdateLanguagesPayload {
  siteLanguage?: SiteLanguage;
  storiesLanguage?: StoryLanguage;
}

/**
 * Contrato completo do estado global exposto pelo `PrototypeContext` às 6 telas e componentes compartilhados.
 */
export interface PrototypeContextValue {
  // Navegação e Modal de Idioma
  activeScreen: ScreenId;
  previousScreen: ScreenId | null;
  navigateTo: (screen: ScreenId) => void;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;

  // Idioma (W01)
  siteLanguage: SiteLanguage;
  storiesLanguage: StoryLanguage;
  languageConfirmation: LanguageConfirmation | null;
  updateLanguages: (payload: UpdateLanguagesPayload) => void;
  undoLanguageChange: () => void;
  dismissLanguageConfirmation: () => void;
  hideUntranslatedCarousels: boolean;
  setHideUntranslatedCarousels: (hide: boolean) => void;

  // Catálogo e Busca Global
  stories: StoryItem[];
  carousels: CarouselData[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Leitura Desktop (W10)
  activeStoryId: string;
  activeChapterIndex: number;
  activeStory: StoryItem;
  activeChapter: ChapterData;
  isPlaying: boolean;
  currentParagraph: number;
  playbackRate: PlaybackRate;
  setActiveStory: (storyId: string, chapterIndex?: number) => void;
  setActiveChapter: (chapterIndex: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentParagraph: (paragraph: number) => void;
  setPlaybackRate: (rate: PlaybackRate) => void;

  // NVDA, Lupa e Alto Contraste (W10 / R21 / R22)
  nvdaLiveMessage: string;
  nvdaLog: NvdaLogEntry[];
  announceNvda: (text: string, source?: NvdaLogSource) => void;
  clearNvdaLog: () => void;
  showNvdaMonitor: boolean;
  setShowNvdaMonitor: (show: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleHighContrast: () => void;
  magnifierEnabled: boolean;
  setMagnifierEnabled: (enabled: boolean) => void;

  // Editor Desktop — Leonardo (W22)
  leonardoDraft: LeonardoDraft;
  updateLeonardoDraft: (
    updater:
      | Partial<LeonardoDraft>
      | ((prev: LeonardoDraft) => LeonardoDraft)
  ) => void;
  publishLeonardoChapter: () => void;
  resetLeonardoDraft: () => void;
  getLeonardoWordCount: (draft?: LeonardoDraft) => number;

  // Mobile — Sansão (W10 / W22)
  sansaoChapter: SansaoChapter;
  updateSansaoChapter: (
    updater:
      | Partial<SansaoChapter>
      | ((prev: SansaoChapter) => SansaoChapter)
  ) => void;
  setSansaoPlayback: (updates: {
    isPlaying?: boolean;
    currentParagraph?: number;
  }) => void;
  resetSansaoChapter: () => void;

  // Presets de Cenários
  activePreset: PersonaPresetId;
  applyPersonaPreset: (preset: PersonaPresetId) => void;
}
