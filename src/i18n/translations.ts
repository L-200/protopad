/**
 * @fileoverview Dicionário centralizado de internacionalização (`pt-BR`, `en-US`, `es-ES`)
 * e hook `useTranslation` para todas as telas e componentes do protótipo Wattpad (W01 — R8, R9, R10, R15, R16, R18).
 *
 * Mantém 100% dos textos canônicos em português quando `siteLanguage === 'pt-BR'` (zero regressões
 * nos 22 requisitos R1–R22) e traduz integralmente menus, cabeçalhos, carrosséis, formulários,
 * leitor desktop, editor desktop, modais e telas mobile quando o usuário alterna o idioma do site
 * para Inglês (`en-US`) ou Espanhol (`es-ES`).
 */
import { CarouselData, SiteLanguage, StoryLanguage } from '../types/prototype';

/** Estrutura completa de textos localizados da interface do protótipo. */
export interface UITranslations {
  locale: string;
  siteWord: string;
  storiesWord: string;
  skipToPlayer: string;

  confirmations: {
    bothChanged: (site: string, stories: string) => string;
    storiesChanged: (stories: string) => string;
    siteChanged: (site: string) => string;
    unchanged: (site: string, stories: string) => string;
    undone: (site: string, stories: string) => string;
    undoneShort: string;
  };

  common: {
    undo: string;
    close: string;
    cancel: string;
    save: string;
    back: string;
    dismiss: string;
    remove: string;
    on: string;
    off: string;
    onFem: string;
    offFem: string;
    reads: string;
    votes: string;
    parts: string;
    completed: string;
  };

  home: {
    heroBadge: string;
    heroCta: string;
    heroCtaTooltip: string;
    heroSecondaryCta: string;
    languageBarLabel: string;
    languageSettingsBtn: string;
    languageSettingsTooltip: string;
    r9ToggleLabel: string;
    r9ToggleHintHidden: string;
    r9ToggleHintVisible: string;
    untranslatedWarning: string;
    readingListBadge: string;
    cardCta: string;
    cardCtaTooltip: string;
    prevCarousel: (title: string) => string;
    nextCarousel: (title: string) => string;
    searchResultsTitle: (query: string, count: number) => string;
    searchEmptyTitle: (query: string) => string;
    searchEmptyHint: string;
    clearSearch: string;
    dismissNotice: string;
  };

  language: {
    modalTitle: string;
    pageTitle: string;
    subtitle: string;
    backToPrevious: string;
    currentStateLabel: string;
    siteFieldLabel: string;
    siteFieldExample: string;
    storiesFieldLabel: string;
    storiesFieldExample: string;
    mismatchTitle: string;
    mismatchBody: (siteLabel: string, storiesLabel: string) => string;
    nonPtTitle: string;
    nonPtBody: string;
    saveBtn: string;
    closeBtn: string;
    backBtn: string;
    statusSavedRegion: string;
  };

  reader: {
    funbarLabel: string;
    chapterSelectLabel: string;
    storySelectLabel: string;
    highContrastBtn: string;
    highContrastTooltip: string;
    magnifierBtn: string;
    magnifierTooltip: string;
    headsetBtn: string;
    headsetTooltip: string;
    addToListTooltip: string;
    voteBtn: string;
    votedBtn: string;
    voteTooltip: string;
    chapterLabel: (num: number) => string;
    paragraphsCount: (total: number) => string;
    activeParagraphTag: string;
    jumpToParagraphTitle: (num: number) => string;
    nextChapterBtn: (title: string) => string;
    backToHomeBtn: string;
    playerRegionLabel: string;
    listenLabel: string;
    listenTooltip: string;
    voiceMismatch: (storyLang: string, siteLang: string) => string;
    playLabel: string;
    pauseLabel: string;
    playTooltip: string;
    pauseTooltip: string;
    prevShort: string;
    prevAria: string;
    prevTooltip: string;
    nextShort: string;
    nextAria: string;
    nextTooltip: string;
    speedAria: (rate: string) => string;
    speedTooltip: string;
    speedMenuLabel: string;
    progressAria: string;
    paragraphOf: (current: number, total: number) => string;
    nvdaRegionFocus: string;
    nvdaPlaying: string;
    nvdaPaused: string;
    nvdaSpeed: (rate: string) => string;
    nvdaChapterChanged: (title: string) => string;
  };

  editor: {
    backToHomeAria: string;
    draftWord: string;
    wordsCount: (formatted: string) => string;
    savedStatus: string;
    savingStatus: string;
    publishedBadge: string;
    chapterTitleAria: string;
    checkLanguageBtn: string;
    checkLanguageTooltip: string;
    previewBtn: string;
    previewTooltip: string;
    saveBtn: string;
    saveTooltip: string;
    publishBtn: string;
    publishTooltip: string;
    savedToast: string;
    restoreDraftBtn: string;
    scenarioGuide: string;
    toolbarAria: string;
    bold: string;
    boldTooltip: string;
    italic: string;
    italicTooltip: string;
    underline: string;
    underlineTooltip: string;
    alignLeft: string;
    alignLeftTooltip: string;
    alignCenter: string;
    alignCenterTooltip: string;
    alignRight: string;
    alignRightTooltip: string;
    heading: string;
    headingTooltip: string;
    insertImage: string;
    insertImageTooltip: string;
    insertVideo: string;
    insertVideoTooltip: string;
    sceneBreak: string;
    sceneBreakTooltip: string;
    addPoll: string;
    addPollTooltip: string;
    sceneBreakLabel: string;
    removeBlockAria: string;
    placeholderParagraph: string;
    nvdaActivated: (name: string) => string;
    nvdaDeactivated: (name: string) => string;
    nvdaAligned: (align: string) => string;
    nvdaSceneInserted: string;
    nvdaImageInserted: string;
    nvdaVideoInserted: string;
    nvdaPollInserted: string;
    nvdaDraftSaved: string;
    nvdaPublished: string;
    modals: {
      imageTitle: string;
      imageSubtitle: string;
      imagePreset1: string;
      imagePreset2: string;
      imageCaptionLabel: string;
      imageCaptionPlaceholder: string;
      imageConfirm: string;
      videoTitle: string;
      videoSubtitle: string;
      videoTitleLabel: string;
      videoTitlePlaceholder: string;
      videoUrlLabel: string;
      videoConfirm: string;
      pollTitle: string;
      pollSubtitle: string;
      pollQuestionLabel: string;
      pollQuestionPlaceholder: string;
      pollOptionsLabel: string;
      pollOptionPlaceholder: (n: number) => string;
      pollAddOption: string;
      pollConfirm: string;
      previewTitle: string;
      previewSubtitle: string;
      previewClose: string;
      publishTitle: string;
      publishSubtitle: string;
      publishSummaryTitle: string;
      publishLangLabel: string;
      publishWordsLabel: string;
      publishStatusLabel: string;
      publishReady: string;
      publishSuccessTitle: string;
      publishSuccessBody: string;
      publishConfirm: string;
      pollPreviewLabel: string;
      pollVoteThanks: string;
      videoCardBadge: string;
    };
  };

  mobile: {
    demoPanelTitle: string;
    demoPanelHint: string;
    demoResetBtn: string;
    backHomeAria: string;
    editBtn: string;
    editAria: string;
    updatedBadge: string;
    listenLabel: string;
    paragraphOf: (current: number, total: number) => string;
    play: string;
    pause: string;
    prev: string;
    prevAria: string;
    next: string;
    nextAria: string;
    speedAria: (rate: string) => string;
    editorTitle: string;
    backToReader: string;
    expandPlayerAria: string;
    collapsePlayerAria: string;
    compactPlayerTitle: string;
    tavernaEndTag: string;
    insertHereLabel: string;
    inputPlaceholder: string;
    voiceDictationBtn: string;
    voiceDictating: string;
    newLineBtn: string;
    spaceKey: string;
    deleteKey: string;
    separatorBtn: string;
    bold: string;
    italic: string;
    underline: string;
    left: string;
    center: string;
    right: string;
    separatorShort: string;
  };

  shared: {
    nvdaTitle: string;
    nvdaClear: string;
    nvdaEmpty: string;
    nvdaPolicyNote: string;
    magnifierTitle: string;
    magnifierWaiting: string;
    highContrastOnNvda: string;
    highContrastOffNvda: string;
  };
}

/** Retorna o rótulo legível do idioma do site conforme o idioma selecionado. */
export function formatSiteLanguageName(lang: SiteLanguage): string {
  switch (lang) {
    case 'pt-BR':
      return 'Português (Brasil)';
    case 'en-US':
      return 'English (US)';
    case 'es-ES':
      return 'Español';
  }
}

/** Retorna o rótulo legível do idioma das histórias conforme o idioma selecionado. */
export function formatStoryLanguageName(lang: StoryLanguage): string {
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
 * Verifica se o carrossel possui título traduzido para o idioma de exibição ativo do site (`R9`).
 */
export function hasCarouselTranslationForSiteLanguage(
  carousel: CarouselData,
  siteLanguage: SiteLanguage
): boolean {
  let rawTitle: string | undefined;
  if (siteLanguage === 'en-US') {
    rawTitle = carousel.titleEn;
  } else if (siteLanguage === 'es-ES') {
    rawTitle = carousel.titleEs;
  } else {
    rawTitle = carousel.titlePt;
  }
  if (!rawTitle || rawTitle.trim().length === 0) {
    return false;
  }
  if (siteLanguage === 'pt-BR' && carousel.hasPtTranslation === false) {
    return false;
  }
  return true;
}

/** Retorna o título traduzido de um carrossel conforme `siteLanguage` (com fallback apenas quando exibido em modo de demonstração). */
export function getCarouselTitle(
  carousel: CarouselData,
  siteLanguage: SiteLanguage
): string {
  if (siteLanguage === 'en-US') {
    return (carousel.titleEn ?? '').trim() || (carousel.titlePt ?? '').trim() || (carousel.titleEs ?? '').trim();
  }
  if (siteLanguage === 'es-ES') {
    return (carousel.titleEs ?? '').trim() || (carousel.titlePt ?? '').trim() || (carousel.titleEn ?? '').trim();
  }
  return (carousel.titlePt ?? '').trim() || (carousel.titleEn ?? '').trim() || (carousel.titleEs ?? '').trim();
}

/** Dicionário completo de traduções indexado por `SiteLanguage`. */
export const TRANSLATIONS: Record<SiteLanguage, UITranslations> = {
  'pt-BR': {
    locale: 'pt-BR',
    siteWord: 'Site',
    storiesWord: 'Histórias',
    skipToPlayer: 'Ir para o player',
    confirmations: {
      bothChanged: (site, stories) =>
        `Idioma do site alterado para ${site} e das histórias para ${stories}.`,
      storiesChanged: (stories) =>
        `Idioma das histórias alterado para ${stories}.`,
      siteChanged: (site) => `Idioma do site alterado para ${site}.`,
      unchanged: (site, stories) =>
        `Preferências mantidas: Site ${site} · Histórias ${stories}.`,
      undone: (site, stories) =>
        `Alteração desfeita. Site: ${site} · Histórias: ${stories}.`,
      undoneShort: 'Alteração de idioma desfeita.',
    },
    common: {
      undo: 'Desfazer',
      close: 'Fechar',
      cancel: 'Cancelar',
      save: 'Salvar',
      back: 'Voltar',
      dismiss: 'Dispensar',
      remove: 'Remover',
      on: 'Ativo',
      off: 'Desligado',
      onFem: 'Ativa',
      offFem: 'Desligada',
      reads: 'leituras',
      votes: 'votos',
      parts: 'partes',
      completed: 'Concluída',
    },
    home: {
      heroBadge: 'Destaque editorial em Português',
      heroCta: 'Ouvir ou ler Cap. 1',
      heroCtaTooltip: 'Abrir Capítulo 1 com leitura em voz alta disponível',
      heroSecondaryCta: 'Abrir editor (Cap. 3)',
      languageBarLabel: 'Preferências de idioma e filtro de carrosséis',
      languageSettingsBtn: 'Configurações de idioma',
      languageSettingsTooltip: 'Alterar o idioma do site e das histórias recomendadas',
      r9ToggleLabel: 'Ocultar carrosséis sem tradução em PT-BR (R9)',
      r9ToggleHintHidden: 'Carrosséis sem tradução oficial permanecem ocultos.',
      r9ToggleHintVisible:
        'Modo demonstração: exibindo carrossel sem tradução para comprovar o comportamento de R9.',
      untranslatedWarning:
        'Carrossel sem tradução oficial para PT-BR (ocultado por padrão conforme R9)',
      readingListBadge: 'Lista da comunidade',
      cardCta: 'Ouvir ou ler',
      cardCtaTooltip: 'Abrir história com leitura em voz alta',
      prevCarousel: (title) => `Rolar carrossel ${title} para a esquerda`,
      nextCarousel: (title) => `Rolar carrossel ${title} para a direita`,
      searchResultsTitle: (query, count) =>
        `Resultados para "${query}" (${count})`,
      searchEmptyTitle: (query) =>
        `Nenhuma história encontrada para "${query}".`,
      searchEmptyHint:
        'Tente buscar por título, autor, gênero ou limpe o filtro para ver todos os carrosséis.',
      clearSearch: 'Limpar busca',
      dismissNotice: 'Dispensar aviso',
    },
    language: {
      modalTitle: 'Configurações de idioma',
      pageTitle: 'Configurações de idioma',
      subtitle:
        'Escolha separadamente o idioma dos menus do site e o idioma das histórias recomendadas.',
      backToPrevious: 'Voltar para a tela anterior',
      currentStateLabel: 'Configuração atual',
      siteFieldLabel: 'Idioma do site (menus e botões)',
      siteFieldExample:
        "Ex.: menus, botões, editor e mensagens como 'Publicar', 'Salvar' e 'Escrever'.",
      storiesFieldLabel: 'Idioma das histórias recomendadas',
      storiesFieldExample:
        'Ex.: histórias e listas recomendadas na página inicial, como romances em Português ou English.',
      mismatchTitle: 'Os dois idiomas estão diferentes',
      mismatchBody: (siteLabel, storiesLabel) =>
        `Os menus e botões continuam em ${siteLabel}, enquanto as histórias e listas recomendadas aparecem em ${storiesLabel}.`,
      nonPtTitle: 'Interface em outro idioma selecionada',
      nonPtBody:
        'Os menus, o leitor, o editor e as mensagens de confirmação foram atualizados para o idioma escolhido. Você pode voltar para Português (Brasil) a qualquer momento.',
      saveBtn: 'Salvar',
      closeBtn: 'Fechar',
      backBtn: 'Voltar',
      statusSavedRegion: 'Confirmação de alteração de idioma',
    },
    reader: {
      funbarLabel: 'Controles do capítulo e acessibilidade',
      chapterSelectLabel: 'Selecionar capítulo',
      storySelectLabel: 'Alternar história (PT / EN)',
      highContrastBtn: 'Alto Contraste',
      highContrastTooltip: 'Alternar tema escuro de alto contraste (WCAG AAA)',
      magnifierBtn: 'Lupa 200%',
      magnifierTooltip: 'Ativar lupa visual que acompanha o elemento em foco',
      headsetBtn: 'Tecla de mídia do headset',
      headsetTooltip: 'Simular o botão físico Play/Pausa do fone de ouvido (R5)',
      addToListTooltip: 'Adicionar história à lista de leitura',
      voteBtn: 'Voto',
      votedBtn: 'Votado',
      voteTooltip: 'Votar neste capítulo',
      chapterLabel: (num) => `Capítulo ${num}`,
      paragraphsCount: (total) => `${total} parágrafos`,
      activeParagraphTag: 'Lendo agora',
      jumpToParagraphTitle: (num) => `Ir para o parágrafo ${num}`,
      nextChapterBtn: (title) => `Próximo capítulo: ${title}`,
      backToHomeBtn: 'Voltar à página inicial',
      playerRegionLabel: 'Ouvir',
      listenLabel: 'Ouvir',
      listenTooltip: 'Ouvir com leitura em voz alta (voz automática)',
      voiceMismatch: (storyLang, siteLang) =>
        `Voz em ${storyLang} (site em ${siteLang})`,
      playLabel: 'Reproduzir',
      pauseLabel: 'Pausar',
      playTooltip: 'Reproduzir (Alt+P)',
      pauseTooltip: 'Pausar (Alt+P)',
      prevShort: 'Voltar parágrafo',
      prevAria: 'Voltar parágrafo',
      prevTooltip: 'Voltar parágrafo (Alt+↑)',
      nextShort: 'Avançar parágrafo',
      nextAria: 'Avançar parágrafo',
      nextTooltip: 'Avançar parágrafo (Alt+↓)',
      speedAria: (rate) => `Velocidade de leitura: ${rate}`,
      speedTooltip: 'Alterar velocidade de leitura (preferência salva)',
      speedMenuLabel: 'Velocidade de leitura',
      progressAria: 'Progresso do capítulo',
      paragraphOf: (current, total) => `Parágrafo ${current} de ${total}`,
      nvdaRegionFocus: 'Região Ouvir',
      nvdaPlaying: 'Reproduzindo',
      nvdaPaused: 'Pausado',
      nvdaSpeed: (rate) => `Velocidade ${rate}`,
      nvdaChapterChanged: (title) => `Capítulo alterado para ${title}`,
    },
    editor: {
      backToHomeAria: 'Voltar para a página inicial preservando o rascunho',
      draftWord: 'Rascunho',
      wordsCount: (formatted) => `${formatted} palavras`,
      savedStatus: 'Salvo',
      savingStatus: 'Salvando...',
      publishedBadge: 'Publicado',
      chapterTitleAria: 'Título do capítulo',
      checkLanguageBtn: 'Conferir idioma',
      checkLanguageTooltip: 'Abrir configurações de idioma preservando o rascunho',
      previewBtn: 'Pré-visualização',
      previewTooltip: 'Visualizar capítulo como os leitores verão',
      saveBtn: 'Gravar',
      saveTooltip: 'Gravar rascunho agora',
      publishBtn: 'Publicar',
      publishTooltip: 'Revisar e publicar este capítulo',
      savedToast: 'Rascunho salvo com sucesso.',
      restoreDraftBtn: 'Restaurar rascunho inicial',
      scenarioGuide:
        'Dica do Cenário 2: destaque os pensamentos em itálico (parágrafos 3 e 7), centralize os dois separadores "***", insira um novo "Separador de cena" entre os parágrafos 9 e 10 e teste imagem, vídeo ou enquete.',
      toolbarAria: 'Barra de formatação do capítulo',
      bold: 'Negrito',
      boldTooltip: 'Negrito (Ctrl+B)',
      italic: 'Itálico',
      italicTooltip: 'Itálico (Ctrl+I)',
      underline: 'Sublinhado',
      underlineTooltip: 'Sublinhado (Ctrl+U)',
      alignLeft: 'Esquerda',
      alignLeftTooltip: 'Alinhar à esquerda',
      alignCenter: 'Centro',
      alignCenterTooltip: 'Centralizar texto',
      alignRight: 'Direita',
      alignRightTooltip: 'Alinhar à direita',
      heading: 'Título/Subtítulo',
      headingTooltip: 'Alternar título ou subtítulo',
      insertImage: 'Inserir imagem',
      insertImageTooltip: 'Inserir imagem no capítulo',
      insertVideo: 'Inserir vídeo',
      insertVideoTooltip: 'Inserir vídeo no capítulo',
      sceneBreak: 'Separador de cena',
      sceneBreakTooltip: 'Inserir separador de cena (*** centralizado)',
      addPoll: 'Adicionar enquete',
      addPollTooltip: 'Adicionar enquete ao final do capítulo',
      sceneBreakLabel: 'Separador de cena',
      removeBlockAria: 'Remover elemento inserido',
      placeholderParagraph: 'Digite seu texto aqui...',
      nvdaActivated: (name) => `${name} ativado`,
      nvdaDeactivated: (name) => `${name} desativado`,
      nvdaAligned: (align) => `Alinhado: ${align}`,
      nvdaSceneInserted: 'Separador de cena inserido e centralizado',
      nvdaImageInserted: 'Imagem inserida no capítulo',
      nvdaVideoInserted: 'Vídeo inserido no capítulo',
      nvdaPollInserted: 'Enquete adicionada ao final do capítulo',
      nvdaDraftSaved: 'Rascunho salvo',
      nvdaPublished: 'Capítulo publicado com sucesso',
      modals: {
        imageTitle: 'Inserir imagem no capítulo',
        imageSubtitle: 'Escolha uma ilustração de abertura e adicione uma legenda opcional.',
        imagePreset1: 'Escadaria antiga à meia-luz',
        imagePreset2: 'Corredor sob neblina',
        imageCaptionLabel: 'Legenda da imagem (opcional)',
        imageCaptionPlaceholder: 'Ex.: A escadaria silenciosa do terceiro andar',
        imageConfirm: 'Inserir imagem',
        videoTitle: 'Inserir vídeo no capítulo',
        videoSubtitle: 'Adicione um vídeo de trilha sonora ou apresentação da cena.',
        videoTitleLabel: 'Título do vídeo',
        videoTitlePlaceholder: 'Ex.: Trilha ambiente — Escadaria à meia-luz',
        videoUrlLabel: 'Endereço ou identificador do vídeo',
        videoConfirm: 'Inserir vídeo',
        pollTitle: 'Adicionar enquete ao capítulo',
        pollSubtitle: 'Crie uma pergunta para engajar os leitores ao final do capítulo.',
        pollQuestionLabel: 'Pergunta da enquete',
        pollQuestionPlaceholder: 'Qual segredo Rafael deveria investigar primeiro?',
        pollOptionsLabel: 'Opções de resposta',
        pollOptionPlaceholder: (n) => `Opção ${n}`,
        pollAddOption: 'Adicionar opção',
        pollConfirm: 'Salvar enquete',
        previewTitle: 'Pré-visualização do capítulo',
        previewSubtitle: 'Veja como o capítulo formatado aparecerá para os leitores.',
        previewClose: 'Fechar pré-visualização',
        publishTitle: 'Publicar capítulo',
        publishSubtitle: 'Revise os detalhes abaixo antes de tornar o capítulo público.',
        publishSummaryTitle: 'Resumo da publicação',
        publishLangLabel: 'Idioma da interface e publicação',
        publishWordsLabel: 'Total de palavras',
        publishStatusLabel: 'Situação',
        publishReady: 'Pronto para publicar',
        publishSuccessTitle: 'Capítulo publicado com sucesso!',
        publishSuccessBody:
          'Seu capítulo já está disponível para leitura com toda a formatação e recursos inseridos.',
        publishConfirm: 'Confirmar publicação',
        pollPreviewLabel: 'Enquete dos leitores',
        pollVoteThanks: 'Voto registrado na prévia!',
        videoCardBadge: 'Vídeo incorporado',
      },
    },
    mobile: {
      demoPanelTitle: 'Cenário 4 — Sansão (Mobile 390×844)',
      demoPanelHint:
        'Uso com uma mão só no metrô: alvos ≥ 48×48 px, espaçamento ≥ 8 px, ditado por voz e player compacto que expande sem fechar o teclado.',
      demoResetBtn: 'Restaurar Cap. 9 inicial',
      backHomeAria: 'Voltar para a página inicial',
      editBtn: 'Editar',
      editAria: 'Editar capítulo',
      updatedBadge: 'Capítulo atualizado — pronto para conferir no áudio',
      listenLabel: 'Ouvir',
      paragraphOf: (current, total) => `Parágrafo ${current} de ${total}`,
      play: 'Reproduzir',
      pause: 'Pausar',
      prev: 'Voltar parágrafo',
      prevAria: 'Voltar parágrafo',
      next: 'Avançar parágrafo',
      nextAria: 'Avançar parágrafo',
      speedAria: (rate) => `Velocidade de leitura: ${rate}`,
      editorTitle: 'Editar Cap. 9',
      backToReader: 'Voltar',
      expandPlayerAria: 'Expandir player de áudio sem fechar o teclado',
      collapsePlayerAria: 'Recolher player de áudio',
      compactPlayerTitle: 'Conferir áudio (teclado mantido aberto)',
      tavernaEndTag: '(fim da taverna)',
      insertHereLabel: 'Inserir após parágrafo',
      inputPlaceholder: 'Digite ou use o ditado por voz...',
      voiceDictationBtn: 'Ditado por voz',
      voiceDictating: 'Ouvindo voz...',
      newLineBtn: 'Nova linha',
      spaceKey: 'Espaço',
      deleteKey: 'Apagar',
      separatorBtn: 'Separador',
      bold: 'Negrito',
      italic: 'Itálico',
      underline: 'Sublinhado',
      left: 'Esquerda',
      center: 'Centro',
      right: 'Direita',
      separatorShort: '***',
    },
    shared: {
      nvdaTitle: 'Monitor NVDA (aria-live="polite")',
      nvdaClear: 'Limpar',
      nvdaEmpty:
        'Nenhum anúncio ainda. Acione um controle do player ou foque o Progresso.',
      nvdaPolicyNote:
        'R21: sem anúncios automáticos na troca contínua de parágrafos.',
      magnifierTitle: 'Lupa 200%',
      magnifierWaiting: 'Use Tab ou clique em um controle para ampliar o foco.',
      highContrastOnNvda: 'Modo Alto Contraste Escuro ativado.',
      highContrastOffNvda: 'Tema claro padrão ativado.',
    },
  },

  'en-US': {
    locale: 'en-US',
    siteWord: 'Site',
    storiesWord: 'Stories',
    skipToPlayer: 'Skip to player',
    confirmations: {
      bothChanged: (site, stories) =>
        `Site language changed to ${site} and stories language changed to ${stories}.`,
      storiesChanged: (stories) => `Stories language changed to ${stories}.`,
      siteChanged: (site) => `Site language changed to ${site}.`,
      unchanged: (site, stories) =>
        `Preferences kept: Site ${site} · Stories ${stories}.`,
      undone: (site, stories) =>
        `Change undone. Site: ${site} · Stories: ${stories}.`,
      undoneShort: 'Language change undone.',
    },
    common: {
      undo: 'Undo',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      back: 'Back',
      dismiss: 'Dismiss',
      remove: 'Remove',
      on: 'On',
      off: 'Off',
      onFem: 'On',
      offFem: 'Off',
      reads: 'reads',
      votes: 'votes',
      parts: 'parts',
      completed: 'Completed',
    },
    home: {
      heroBadge: 'Editorial Spotlight',
      heroCta: 'Listen or read Ch. 1',
      heroCtaTooltip: 'Open Chapter 1 with text-to-speech audio available',
      heroSecondaryCta: 'Open editor (Ch. 3)',
      languageBarLabel: 'Language preferences and carousel filter',
      languageSettingsBtn: 'Language settings',
      languageSettingsTooltip: 'Change the site language and recommended stories language',
      r9ToggleLabel: 'Hide carousels without translation (R9)',
      r9ToggleHintHidden: 'Carousels missing an official translation stay hidden.',
      r9ToggleHintVisible:
        'Demo mode: showing untranslated carousel to verify R9 behavior.',
      untranslatedWarning:
        'Untranslated carousel (hidden by default in PT-BR per R9)',
      readingListBadge: 'Community list',
      cardCta: 'Listen or read',
      cardCtaTooltip: 'Open story with text-to-speech audio',
      prevCarousel: (title) => `Scroll ${title} carousel left`,
      nextCarousel: (title) => `Scroll ${title} carousel right`,
      searchResultsTitle: (query, count) =>
        `Results for "${query}" (${count})`,
      searchEmptyTitle: (query) => `No stories found for "${query}".`,
      searchEmptyHint:
        'Try searching by title, author, genre, or clear the search filter to browse all carousels.',
      clearSearch: 'Clear search',
      dismissNotice: 'Dismiss notice',
    },
    language: {
      modalTitle: 'Language settings',
      pageTitle: 'Language settings',
      subtitle:
        'Choose the language of site menus separately from the language of recommended stories.',
      backToPrevious: 'Back to previous screen',
      currentStateLabel: 'Current setting',
      siteFieldLabel: 'Site language (menus and buttons)',
      siteFieldExample:
        "e.g. menus, buttons, editor, and messages such as 'Publish', 'Save', and 'Write'.",
      storiesFieldLabel: 'Recommended stories language',
      storiesFieldExample:
        'e.g. stories and reading lists shown on the home page, such as novels in English or Português.',
      mismatchTitle: 'The two languages are different',
      mismatchBody: (siteLabel, storiesLabel) =>
        `Menus and buttons remain in ${siteLabel}, while recommended stories and lists appear in ${storiesLabel}.`,
      nonPtTitle: 'English interface active',
      nonPtBody:
        'Menus, reader, editor, modals, and status messages are now displayed in English. You can switch back to Português (Brasil) anytime.',
      saveBtn: 'Save',
      closeBtn: 'Close',
      backBtn: 'Back',
      statusSavedRegion: 'Language change confirmation',
    },
    reader: {
      funbarLabel: 'Chapter and accessibility controls',
      chapterSelectLabel: 'Select chapter',
      storySelectLabel: 'Switch story (PT / EN)',
      highContrastBtn: 'High Contrast',
      highContrastTooltip: 'Toggle dark high-contrast theme (WCAG AAA)',
      magnifierBtn: '200% Magnifier',
      magnifierTooltip: 'Enable visual magnifier following the focused element',
      headsetBtn: 'Headset media key',
      headsetTooltip: 'Simulate physical headset Play/Pause button (R5)',
      addToListTooltip: 'Add story to reading list',
      voteBtn: 'Vote',
      votedBtn: 'Voted',
      voteTooltip: 'Vote on this chapter',
      chapterLabel: (num) => `Chapter ${num}`,
      paragraphsCount: (total) => `${total} paragraphs`,
      activeParagraphTag: 'Reading now',
      jumpToParagraphTitle: (num) => `Jump to paragraph ${num}`,
      nextChapterBtn: (title) => `Next chapter: ${title}`,
      backToHomeBtn: 'Back to Home',
      playerRegionLabel: 'Listen',
      listenLabel: 'Listen',
      listenTooltip: 'Listen with text-to-speech (automatic voice)',
      voiceMismatch: (storyLang, siteLang) =>
        `Voice in ${storyLang} (site in ${siteLang})`,
      playLabel: 'Play',
      pauseLabel: 'Pause',
      playTooltip: 'Play (Alt+P)',
      pauseTooltip: 'Pause (Alt+P)',
      prevShort: 'Previous paragraph',
      prevAria: 'Previous paragraph',
      prevTooltip: 'Previous paragraph (Alt+↑)',
      nextShort: 'Next paragraph',
      nextAria: 'Next paragraph',
      nextTooltip: 'Next paragraph (Alt+↓)',
      speedAria: (rate) => `Reading speed: ${rate}`,
      speedTooltip: 'Change reading speed (saved preference)',
      speedMenuLabel: 'Reading speed',
      progressAria: 'Chapter progress',
      paragraphOf: (current, total) => `Paragraph ${current} of ${total}`,
      nvdaRegionFocus: 'Listen region',
      nvdaPlaying: 'Playing',
      nvdaPaused: 'Paused',
      nvdaSpeed: (rate) => `Speed ${rate}`,
      nvdaChapterChanged: (title) => `Chapter changed to ${title}`,
    },
    editor: {
      backToHomeAria: 'Back to Home preserving your draft',
      draftWord: 'Draft',
      wordsCount: (formatted) => `${formatted} words`,
      savedStatus: 'Saved',
      savingStatus: 'Saving...',
      publishedBadge: 'Published',
      chapterTitleAria: 'Chapter title',
      checkLanguageBtn: 'Check language',
      checkLanguageTooltip: 'Open language settings preserving your draft',
      previewBtn: 'Preview',
      previewTooltip: 'Preview how readers will see this chapter',
      saveBtn: 'Save',
      saveTooltip: 'Save draft now',
      publishBtn: 'Publish',
      publishTooltip: 'Review and publish this chapter',
      savedToast: 'Draft saved successfully.',
      restoreDraftBtn: 'Restore initial draft',
      scenarioGuide:
        'Scenario 2 tip: italicize the protagonist thoughts (paragraphs 3 and 7), center both "***" breaks, insert a new "Scene break" between paragraphs 9 and 10, and test image, video, or poll.',
      toolbarAria: 'Chapter formatting toolbar',
      bold: 'Bold',
      boldTooltip: 'Bold (Ctrl+B)',
      italic: 'Italic',
      italicTooltip: 'Italic (Ctrl+I)',
      underline: 'Underline',
      underlineTooltip: 'Underline (Ctrl+U)',
      alignLeft: 'Left',
      alignLeftTooltip: 'Align left',
      alignCenter: 'Center',
      alignCenterTooltip: 'Center text',
      alignRight: 'Right',
      alignRightTooltip: 'Align right',
      heading: 'Heading/Subtitle',
      headingTooltip: 'Toggle heading or subtitle',
      insertImage: 'Insert image',
      insertImageTooltip: 'Insert image into chapter',
      insertVideo: 'Insert video',
      insertVideoTooltip: 'Insert video into chapter',
      sceneBreak: 'Scene break',
      sceneBreakTooltip: 'Insert scene break (centered ***)',
      addPoll: 'Add poll',
      addPollTooltip: 'Add poll at the end of the chapter',
      sceneBreakLabel: 'Scene break',
      removeBlockAria: 'Remove inserted element',
      placeholderParagraph: 'Write your text here...',
      nvdaActivated: (name) => `${name} on`,
      nvdaDeactivated: (name) => `${name} off`,
      nvdaAligned: (align) => `Aligned: ${align}`,
      nvdaSceneInserted: 'Centered scene break inserted',
      nvdaImageInserted: 'Image inserted into chapter',
      nvdaVideoInserted: 'Video inserted into chapter',
      nvdaPollInserted: 'Poll added to the end of the chapter',
      nvdaDraftSaved: 'Draft saved',
      nvdaPublished: 'Chapter published successfully',
      modals: {
        imageTitle: 'Insert image into chapter',
        imageSubtitle: 'Pick an opening illustration and add an optional caption.',
        imagePreset1: 'Old staircase in dim light',
        imagePreset2: 'Hallway under mist',
        imageCaptionLabel: 'Image caption (optional)',
        imageCaptionPlaceholder: 'e.g. The silent third-floor staircase',
        imageConfirm: 'Insert image',
        videoTitle: 'Insert video into chapter',
        videoSubtitle: 'Add a soundtrack or scene preview video.',
        videoTitleLabel: 'Video title',
        videoTitlePlaceholder: 'e.g. Ambient soundtrack — Dim staircase',
        videoUrlLabel: 'Video URL or identifier',
        videoConfirm: 'Insert video',
        pollTitle: 'Add poll to chapter',
        pollSubtitle: 'Create a question to engage readers at the end of the chapter.',
        pollQuestionLabel: 'Poll question',
        pollQuestionPlaceholder: 'Which secret should Rafael investigate first?',
        pollOptionsLabel: 'Answer options',
        pollOptionPlaceholder: (n) => `Option ${n}`,
        pollAddOption: 'Add option',
        pollConfirm: 'Save poll',
        previewTitle: 'Chapter preview',
        previewSubtitle: 'See how the formatted chapter will appear to readers.',
        previewClose: 'Close preview',
        publishTitle: 'Publish chapter',
        publishSubtitle: 'Review the details below before making the chapter public.',
        publishSummaryTitle: 'Publication summary',
        publishLangLabel: 'Interface and publication language',
        publishWordsLabel: 'Total words',
        publishStatusLabel: 'Status',
        publishReady: 'Ready to publish',
        publishSuccessTitle: 'Chapter published successfully!',
        publishSuccessBody:
          'Your chapter is now live with all formatting and inserted elements preserved.',
        publishConfirm: 'Confirm publication',
        pollPreviewLabel: 'Reader poll',
        pollVoteThanks: 'Vote recorded in preview!',
        videoCardBadge: 'Embedded video',
      },
    },
    mobile: {
      demoPanelTitle: 'Scenario 4 — Sansão (Mobile 390×844)',
      demoPanelHint:
        'One-handed subway use: ≥ 48×48 px touch targets, ≥ 8 px gap, voice dictation, and compact player that expands without closing the keyboard.',
      demoResetBtn: 'Restore initial Ch. 9',
      backHomeAria: 'Back to Home',
      editBtn: 'Edit',
      editAria: 'Edit chapter',
      updatedBadge: 'Chapter updated — ready to check in audio',
      listenLabel: 'Listen',
      paragraphOf: (current, total) => `Paragraph ${current} of ${total}`,
      play: 'Play',
      pause: 'Pause',
      prev: 'Previous paragraph',
      prevAria: 'Previous paragraph',
      next: 'Next paragraph',
      nextAria: 'Next paragraph',
      speedAria: (rate) => `Reading speed: ${rate}`,
      editorTitle: 'Edit Ch. 9',
      backToReader: 'Back',
      expandPlayerAria: 'Expand audio player without closing keyboard',
      collapsePlayerAria: 'Collapse audio player',
      compactPlayerTitle: 'Check audio (keyboard stays open)',
      tavernaEndTag: '(end of tavern scene)',
      insertHereLabel: 'Insert after paragraph',
      inputPlaceholder: 'Type or use voice dictation...',
      voiceDictationBtn: 'Voice dictation',
      voiceDictating: 'Listening...',
      newLineBtn: 'New line',
      spaceKey: 'Space',
      deleteKey: 'Delete',
      separatorBtn: 'Break',
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      left: 'Left',
      center: 'Center',
      right: 'Right',
      separatorShort: '***',
    },
    shared: {
      nvdaTitle: 'NVDA Monitor (aria-live="polite")',
      nvdaClear: 'Clear',
      nvdaEmpty:
        'No announcements yet. Trigger a player control or focus Progress.',
      nvdaPolicyNote:
        'R21: no automatic announcements during continuous paragraph playback.',
      magnifierTitle: '200% Magnifier',
      magnifierWaiting: 'Press Tab or click a control to magnify focus.',
      highContrastOnNvda: 'High Contrast Dark mode enabled.',
      highContrastOffNvda: 'Default light theme enabled.',
    },
  },

  'es-ES': {
    locale: 'es-ES',
    siteWord: 'Sitio',
    storiesWord: 'Historias',
    skipToPlayer: 'Ir al reproductor',
    confirmations: {
      bothChanged: (site, stories) =>
        `Idioma del sitio cambiado a ${site} y de las historias a ${stories}.`,
      storiesChanged: (stories) =>
        `Idioma de las historias cambiado a ${stories}.`,
      siteChanged: (site) => `Idioma del sitio cambiado a ${site}.`,
      unchanged: (site, stories) =>
        `Preferencias mantenidas: Sitio ${site} · Historias ${stories}.`,
      undone: (site, stories) =>
        `Cambio deshecho. Sitio: ${site} · Historias: ${stories}.`,
      undoneShort: 'Cambio de idioma deshecho.',
    },
    common: {
      undo: 'Deshacer',
      close: 'Cerrar',
      cancel: 'Cancelar',
      save: 'Guardar',
      back: 'Volver',
      dismiss: 'Descartar',
      remove: 'Eliminar',
      on: 'Activo',
      off: 'Desactivado',
      onFem: 'Activa',
      offFem: 'Desactivada',
      reads: 'lecturas',
      votes: 'votos',
      parts: 'partes',
      completed: 'Completa',
    },
    home: {
      heroBadge: 'Destacado editorial',
      heroCta: 'Escuchar o leer Cap. 1',
      heroCtaTooltip: 'Abrir Capítulo 1 con lectura en voz alta disponible',
      heroSecondaryCta: 'Abrir editor (Cap. 3)',
      languageBarLabel: 'Preferencias de idioma y filtro de carruseles',
      languageSettingsBtn: 'Configuración de idioma',
      languageSettingsTooltip: 'Cambiar idioma del sitio y de las historias recomendadas',
      r9ToggleLabel: 'Ocultar carruseles sin traducción (R9)',
      r9ToggleHintHidden: 'Los carruseles sin traducción oficial permanecen ocultos.',
      r9ToggleHintVisible:
        'Modo demostración: mostrando carrusel sin traducción para comprobar R9.',
      untranslatedWarning:
        'Carrusel sin traducción oficial (oculto por defecto según R9)',
      readingListBadge: 'Lista comunitaria',
      cardCta: 'Escuchar o leer',
      cardCtaTooltip: 'Abrir historia con lectura en voz alta',
      prevCarousel: (title) => `Desplazar carrusel ${title} a la izquierda`,
      nextCarousel: (title) => `Desplazar carrusel ${title} a la derecha`,
      searchResultsTitle: (query, count) =>
        `Resultados para "${query}" (${count})`,
      searchEmptyTitle: (query) =>
        `No se encontraron historias para "${query}".`,
      searchEmptyHint:
        'Prueba buscando por título, autor, género o limpia el filtro para ver todos los carruseles.',
      clearSearch: 'Limpiar búsqueda',
      dismissNotice: 'Descartar aviso',
    },
    language: {
      modalTitle: 'Configuración de idioma',
      pageTitle: 'Configuración de idioma',
      subtitle:
        'Elige por separado el idioma de los menús del sitio y el de las historias recomendadas.',
      backToPrevious: 'Volver a la pantalla anterior',
      currentStateLabel: 'Configuración actual',
      siteFieldLabel: 'Idioma del sitio (menús y botones)',
      siteFieldExample:
        "Ej.: menús, botones, editor y mensajes como 'Publicar', 'Guardar' y 'Escribir'.",
      storiesFieldLabel: 'Idioma de las historias recomendadas',
      storiesFieldExample:
        'Ej.: historias y listas recomendadas en la página de inicio, como novelas en Português o English.',
      mismatchTitle: 'Los dos idiomas son diferentes',
      mismatchBody: (siteLabel, storiesLabel) =>
        `Los menús y botones continúan en ${siteLabel}, mientras las historias recomendadas aparecen en ${storiesLabel}.`,
      nonPtTitle: 'Interfaz en español activa',
      nonPtBody:
        'Los menús, el lector, el editor y los mensajes ahora se muestran en español. Puedes volver a Português (Brasil) en cualquier momento.',
      saveBtn: 'Guardar',
      closeBtn: 'Cerrar',
      backBtn: 'Volver',
      statusSavedRegion: 'Confirmación de cambio de idioma',
    },
    reader: {
      funbarLabel: 'Controles del capítulo y accesibilidad',
      chapterSelectLabel: 'Seleccionar capítulo',
      storySelectLabel: 'Cambiar historia (PT / EN)',
      highContrastBtn: 'Alto Contraste',
      highContrastTooltip: 'Alternar tema oscuro de alto contraste (WCAG AAA)',
      magnifierBtn: 'Lupa 200%',
      magnifierTooltip: 'Activar lupa visual que sigue el elemento enfocado',
      headsetBtn: 'Tecla multimedia de auriculares',
      headsetTooltip: 'Simular el botón físico Reproducir/Pausar de los auriculares (R5)',
      addToListTooltip: 'Añadir historia a lista de lectura',
      voteBtn: 'Voto',
      votedBtn: 'Votado',
      voteTooltip: 'Votar en este capítulo',
      chapterLabel: (num) => `Capítulo ${num}`,
      paragraphsCount: (total) => `${total} párrafos`,
      activeParagraphTag: 'Leyendo ahora',
      jumpToParagraphTitle: (num) => `Ir al párrafo ${num}`,
      nextChapterBtn: (title) => `Siguiente capítulo: ${title}`,
      backToHomeBtn: 'Volver al inicio',
      playerRegionLabel: 'Escuchar',
      listenLabel: 'Escuchar',
      listenTooltip: 'Escuchar con lectura en voz alta (voz automática)',
      voiceMismatch: (storyLang, siteLang) =>
        `Voz en ${storyLang} (sitio en ${siteLang})`,
      playLabel: 'Reproducir',
      pauseLabel: 'Pausar',
      playTooltip: 'Reproducir (Alt+P)',
      pauseTooltip: 'Pausar (Alt+P)',
      prevShort: 'Párrafo anterior',
      prevAria: 'Párrafo anterior',
      prevTooltip: 'Párrafo anterior (Alt+↑)',
      nextShort: 'Párrafo siguiente',
      nextAria: 'Párrafo siguiente',
      nextTooltip: 'Párrafo siguiente (Alt+↓)',
      speedAria: (rate) => `Velocidad de lectura: ${rate}`,
      speedTooltip: 'Cambiar velocidad de lectura (preferencia guardada)',
      speedMenuLabel: 'Velocidad de lectura',
      progressAria: 'Progreso del capítulo',
      paragraphOf: (current, total) => `Párrafo ${current} de ${total}`,
      nvdaRegionFocus: 'Región Escuchar',
      nvdaPlaying: 'Reproduciendo',
      nvdaPaused: 'Pausado',
      nvdaSpeed: (rate) => `Velocidad ${rate}`,
      nvdaChapterChanged: (title) => `Capítulo cambiado a ${title}`,
    },
    editor: {
      backToHomeAria: 'Volver al inicio conservando el borrador',
      draftWord: 'Borrador',
      wordsCount: (formatted) => `${formatted} palabras`,
      savedStatus: 'Guardado',
      savingStatus: 'Guardando...',
      publishedBadge: 'Publicado',
      chapterTitleAria: 'Título del capítulo',
      checkLanguageBtn: 'Revisar idioma',
      checkLanguageTooltip: 'Abrir configuración de idioma conservando el borrador',
      previewBtn: 'Vista previa',
      previewTooltip: 'Ver cómo aparecerá el capítulo para los lectores',
      saveBtn: 'Guardar',
      saveTooltip: 'Guardar borrador ahora',
      publishBtn: 'Publicar',
      publishTooltip: 'Revisar y publicar este capítulo',
      savedToast: 'Borrador guardado con éxito.',
      restoreDraftBtn: 'Restaurar borrador inicial',
      scenarioGuide:
        'Consejo del Escenario 2: pon los pensamientos en cursiva (párrafos 3 y 7), centra ambos separadores "***", inserta un nuevo "Separador de escena" entre los párrafos 9 y 10 y prueba imagen, vídeo o encuesta.',
      toolbarAria: 'Barra de formato del capítulo',
      bold: 'Negrita',
      boldTooltip: 'Negrita (Ctrl+B)',
      italic: 'Cursiva',
      italicTooltip: 'Cursiva (Ctrl+I)',
      underline: 'Subrayado',
      underlineTooltip: 'Subrayado (Ctrl+U)',
      alignLeft: 'Izquierda',
      alignLeftTooltip: 'Alinear a la izquierda',
      alignCenter: 'Centro',
      alignCenterTooltip: 'Centrar texto',
      alignRight: 'Derecha',
      alignRightTooltip: 'Alinear a la derecha',
      heading: 'Título/Subtítulo',
      headingTooltip: 'Alternar título o subtítulo',
      insertImage: 'Insertar imagen',
      insertImageTooltip: 'Insertar imagen en el capítulo',
      insertVideo: 'Insertar vídeo',
      insertVideoTooltip: 'Insertar vídeo en el capítulo',
      sceneBreak: 'Separador de escena',
      sceneBreakTooltip: 'Insertar separador de escena (*** centrado)',
      addPoll: 'Añadir encuesta',
      addPollTooltip: 'Añadir encuesta al final del capítulo',
      sceneBreakLabel: 'Separador de escena',
      removeBlockAria: 'Eliminar elemento insertado',
      placeholderParagraph: 'Escribe tu texto aquí...',
      nvdaActivated: (name) => `${name} activado`,
      nvdaDeactivated: (name) => `${name} desactivado`,
      nvdaAligned: (align) => `Alineado: ${align}`,
      nvdaSceneInserted: 'Separador de escena centrado insertado',
      nvdaImageInserted: 'Imagen insertada en el capítulo',
      nvdaVideoInserted: 'Vídeo insertado en el capítulo',
      nvdaPollInserted: 'Encuesta añadida al final del capítulo',
      nvdaDraftSaved: 'Borrador guardado',
      nvdaPublished: 'Capítulo publicado con éxito',
      modals: {
        imageTitle: 'Insertar imagen en el capítulo',
        imageSubtitle: 'Elige una ilustración inicial y añade una leyenda opcional.',
        imagePreset1: 'Escalera antigua a media luz',
        imagePreset2: 'Pasillo bajo la niebla',
        imageCaptionLabel: 'Leyenda de la imagen (opcional)',
        imageCaptionPlaceholder: 'Ej.: La escalera silenciosa del tercer piso',
        imageConfirm: 'Insertar imagen',
        videoTitle: 'Insertar vídeo en el capítulo',
        videoSubtitle: 'Añade un vídeo de banda sonora o avance de la escena.',
        videoTitleLabel: 'Título del vídeo',
        videoTitlePlaceholder: 'Ej.: Música ambiental — Escalera a media luz',
        videoUrlLabel: 'Dirección o identificador del vídeo',
        videoConfirm: 'Insertar vídeo',
        pollTitle: 'Añadir encuesta al capítulo',
        pollSubtitle: 'Crea una pregunta para los lectores al final del capítulo.',
        pollQuestionLabel: 'Pregunta de la encuesta',
        pollQuestionPlaceholder: '¿Qué secreto debería investigar Rafael primero?',
        pollOptionsLabel: 'Opciones de respuesta',
        pollOptionPlaceholder: (n) => `Opción ${n}`,
        pollAddOption: 'Añadir opción',
        pollConfirm: 'Guardar encuesta',
        previewTitle: 'Vista previa del capítulo',
        previewSubtitle: 'Mira cómo aparecerá el capítulo formateado para los lectores.',
        previewClose: 'Cerrar vista previa',
        publishTitle: 'Publicar capítulo',
        publishSubtitle: 'Revisa los detalles antes de publicar el capítulo.',
        publishSummaryTitle: 'Resumen de publicación',
        publishLangLabel: 'Idioma de la interfaz y publicación',
        publishWordsLabel: 'Total de palabras',
        publishStatusLabel: 'Estado',
        publishReady: 'Listo para publicar',
        publishSuccessTitle: '¡Capítulo publicado con éxito!',
        publishSuccessBody:
          'Tu capítulo ya está disponible con todo el formato y recursos insertados.',
        publishConfirm: 'Confirmar publicación',
        pollPreviewLabel: 'Encuesta de lectores',
        pollVoteThanks: '¡Voto registrado en la vista previa!',
        videoCardBadge: 'Vídeo incorporado',
      },
    },
    mobile: {
      demoPanelTitle: 'Escenario 4 — Sansão (Móvil 390×844)',
      demoPanelHint:
        'Uso con una sola mano en el metro: objetivos ≥ 48×48 px, espacio ≥ 8 px, dictado por voz y reproductor compacto que se expande sin cerrar el teclado.',
      demoResetBtn: 'Restaurar Cap. 9 inicial',
      backHomeAria: 'Volver al inicio',
      editBtn: 'Editar',
      editAria: 'Editar capítulo',
      updatedBadge: 'Capítulo actualizado — listo para revisar en audio',
      listenLabel: 'Escuchar',
      paragraphOf: (current, total) => `Párrafo ${current} de ${total}`,
      play: 'Reproducir',
      pause: 'Pausar',
      prev: 'Párrafo anterior',
      prevAria: 'Párrafo anterior',
      next: 'Párrafo siguiente',
      nextAria: 'Párrafo siguiente',
      speedAria: (rate) => `Velocidad de lectura: ${rate}`,
      editorTitle: 'Editar Cap. 9',
      backToReader: 'Volver',
      expandPlayerAria: 'Expandir reproductor sin cerrar el teclado',
      collapsePlayerAria: 'Contraer reproductor de audio',
      compactPlayerTitle: 'Revisar audio (teclado permanece abierto)',
      tavernaEndTag: '(fin de la taberna)',
      insertHereLabel: 'Insertar tras párrafo',
      inputPlaceholder: 'Escribe o usa el dictado por voz...',
      voiceDictationBtn: 'Dictado por voz',
      voiceDictating: 'Escuchando...',
      newLineBtn: 'Nueva línea',
      spaceKey: 'Espacio',
      deleteKey: 'Borrar',
      separatorBtn: 'Separador',
      bold: 'Negrita',
      italic: 'Cursiva',
      underline: 'Subrayado',
      left: 'Izquierda',
      center: 'Centro',
      right: 'Derecha',
      separatorShort: '***',
    },
    shared: {
      nvdaTitle: 'Monitor NVDA (aria-live="polite")',
      nvdaClear: 'Limpiar',
      nvdaEmpty:
        'Sin anuncios todavía. Activa un control del reproductor o enfoca Progreso.',
      nvdaPolicyNote:
        'R21: sin anuncios automáticos al avanzar de párrafo continuamente.',
      magnifierTitle: 'Lupa 200%',
      magnifierWaiting: 'Usa Tab o haz clic en un control para ampliar el foco.',
      highContrastOnNvda: 'Modo Alto Contraste Oscuro activado.',
      highContrastOffNvda: 'Tema claro predeterminado activado.',
    },
  },
};
