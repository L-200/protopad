/**
 * @fileoverview Tela 1 — Página Inicial (Home / Descoberta).
 * Exibe o destaque editorial, filtro de carrosséis sem tradução para PT-BR (`R9`),
 * selos de idioma nas histórias e listas da comunidade (`R17`), rótulos curtos com
 * ícones e tooltips explicativas (`R16`), além do banner de confirmação/desfazer de
 * idioma (`R18`) e busca global (Cenários 2 e 3).
 */
import React, { useMemo, useRef } from 'react';
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  GlobeIcon,
  HeadphonesIcon,
  ListIcon,
  SparklesIcon,
  StarIcon,
  UndoIcon,
} from '../../components/shared/Icons';
import { LanguageBadge } from '../../components/shared/LanguageBadge';
import { StoryCoverSvg } from '../../components/shared/StoryCoverSvg';
import {
  formatSiteLanguageName,
  formatStoryLanguageName,
  getCarouselTitle,
  hasCarouselTranslationForSiteLanguage,
} from '../../i18n/translations';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { CarouselData, SiteLanguage, StoryItem } from '../../types/prototype';
import './HomeScreen.css';

const HOME_EXTRA: Record<
  SiteLanguage,
  {
    cardAria: (title: string, author: string, lang: string) => string;
    listCount: (count: number) => string;
    readsTitle: string;
    votesTitle: string;
    untranslatedTag: string;
    scrollLeftTooltip: string;
    scrollRightTooltip: string;
    byAuthor: (author: string) => string;
    chaptersCount: (count: number) => string;
    searchHeading: (query: string) => string;
    searchCount: (count: number) => string;
    searchEmptyHeading: string;
    searchEmptyText: (query: string) => string;
  }
> = {
  'pt-BR': {
    cardAria: (title, author, lang) =>
      `${title}, por ${author}. Conteúdo em ${lang}. Ouvir ou ler capítulo 1.`,
    listCount: (count) => `${count} histórias`,
    readsTitle: 'Leituras',
    votesTitle: 'Votos',
    untranslatedTag: 'Sem tradução em PT-BR (visível só na demonstração)',
    scrollLeftTooltip: 'Rolar para a esquerda',
    scrollRightTooltip: 'Rolar para a direita',
    byAuthor: (author) => `Por ${author}`,
    chaptersCount: (count) => `${count} capítulos`,
    searchHeading: (query) => `Resultados da busca para “${query}”`,
    searchCount: (count) =>
      `${count} ${count === 1 ? 'história encontrada' : 'histórias encontradas'}`,
    searchEmptyHeading: 'Nenhuma história encontrada',
    searchEmptyText: (query) =>
      `Não encontramos histórias ou listas com “${query}”. Tente outro título, autor ou gênero.`,
  },
  'en-US': {
    cardAria: (title, author, lang) =>
      `${title}, by ${author}. Content in ${lang}. Listen or read chapter 1.`,
    listCount: (count) => `${count} stories`,
    readsTitle: 'Reads',
    votesTitle: 'Votes',
    untranslatedTag: 'No English translation (shown for demo only)',
    scrollLeftTooltip: 'Scroll left',
    scrollRightTooltip: 'Scroll right',
    byAuthor: (author) => `By ${author}`,
    chaptersCount: (count) => `${count} chapters`,
    searchHeading: (query) => `Search results for “${query}”`,
    searchCount: (count) =>
      `${count} ${count === 1 ? 'story found' : 'stories found'}`,
    searchEmptyHeading: 'No stories found',
    searchEmptyText: (query) =>
      `We could not find stories or reading lists matching “${query}”. Try another title, author, or genre.`,
  },
  'es-ES': {
    cardAria: (title, author, lang) =>
      `${title}, por ${author}. Contenido en ${lang}. Escuchar o leer capítulo 1.`,
    listCount: (count) => `${count} historias`,
    readsTitle: 'Lecturas',
    votesTitle: 'Votos',
    untranslatedTag: 'Sin traducción al español (visible solo en la demostración)',
    scrollLeftTooltip: 'Desplazar a la izquierda',
    scrollRightTooltip: 'Desplazar a la derecha',
    byAuthor: (author) => `Por ${author}`,
    chaptersCount: (count) => `${count} capítulos`,
    searchHeading: (query) => `Resultados de búsqueda para “${query}”`,
    searchCount: (count) =>
      `${count} ${count === 1 ? 'historia encontrada' : 'historias encontradas'}`,
    searchEmptyHeading: 'No se encontraron historias',
    searchEmptyText: (query) =>
      `No encontramos historias o listas para “${query}”. Prueba otro título, autor o género.`,
  },
};

/**
 * Normaliza texto removendo diacríticos (NFD) e convertendo para minúsculas
 * para permitir busca global tolerante a acentuação.
 *
 * @param value Texto original a normalizar.
 * @returns Texto sem acentos em caixa baixa.
 */
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

interface StoryCardProps {
  story: StoryItem;
  onOpen: (storyId: string) => void;
}

/**
 * Cartão individual de história ou lista da comunidade.
 * Exibe selo de idioma (`R17`), status editorial e botão acessível que descreve
 * título, autor e idioma antes de abrir o capítulo 1 (`R16`).
 */
const StoryCard: React.FC<StoryCardProps> = ({ story, onOpen }) => {
  const { t, siteLanguage } = useTranslation();
  const extra = HOME_EXTRA[siteLanguage];

  const statusTag = story.isReadingList
    ? t.home.readingListBadge
    : story.isCompleted
      ? t.common.completed
      : story.isWattys
        ? 'Wattys'
        : null;

  return (
    <article className="story-card">
      <div className="story-card-badges">
        <LanguageBadge language={story.language} />
        {statusTag && (
          <span className="story-status-tag">
            {story.isReadingList && <ListIcon size={12} />}
            <span>{statusTag}</span>
          </span>
        )}
      </div>

      <div className="tooltip-wrapper" data-tooltip-pos="top">
        <button
          type="button"
          className="story-card-trigger"
          onClick={() => onOpen(story.id)}
          aria-label={extra.cardAria(
            story.title,
            story.author,
            formatStoryLanguageName(story.language)
          )}
        >
          <StoryCoverSvg story={story} width="100%" />
          <span className="story-card-title">{story.title}</span>
          <span className="story-card-author">{story.author}</span>
          <span className="story-card-cta-pill">
            <HeadphonesIcon size={14} />
            <span>{t.home.cardCta}</span>
          </span>
        </button>
        <span className="tooltip-bubble" role="tooltip">
          {t.home.cardCtaTooltip}
        </span>
      </div>

      <div className="story-card-meta">
        {story.isReadingList ? (
          <span className="story-card-meta-item">
            <ListIcon size={13} />
            <span>{extra.listCount(story.listStoryCount ?? story.parts)}</span>
          </span>
        ) : (
          <>
            <span className="story-card-meta-item" title={extra.readsTitle}>
              <EyeIcon size={13} />
              <span>{story.reads}</span>
            </span>
            <span className="story-card-meta-item" title={extra.votesTitle}>
              <StarIcon size={13} />
              <span>{story.votes}</span>
            </span>
            <span className="story-card-meta-item">
              <span>
                {story.parts} {t.common.parts}
              </span>
            </span>
          </>
        )}
      </div>
    </article>
  );
};

interface CarouselRowProps {
  carousel: CarouselData;
  onOpenStory: (storyId: string) => void;
}

/**
 * Fileira horizontal de histórias/listas com botões de rolagem por teclado e mouse.
 * Exibe o título traduzido conforme `siteLanguage` (`R9`) ou indica visualmente quando o filtro R9
 * é desligado manualmente para demonstração de carrosséis sem tradução.
 */
const CarouselRow: React.FC<CarouselRowProps> = ({ carousel, onOpenStory }) => {
  const { t, siteLanguage } = useTranslation();
  const extra = HOME_EXTRA[siteLanguage];
  const trackRef = useRef<HTMLDivElement | null>(null);
  const headingTitle = getCarouselTitle(carousel, siteLanguage);
  const isTranslatedForSite = hasCarouselTranslationForSiteLanguage(
    carousel,
    siteLanguage
  );

  const scrollTrack = (direction: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -420 : 420;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section
      aria-label={headingTitle}
      className={`home-carousel-section ${
        !isTranslatedForSite ? 'home-carousel-section--untranslated' : ''
      }`}
    >
      <div className="home-carousel-header">
        <div className="home-carousel-title-wrap">
          <h2 className="home-carousel-title">{headingTitle}</h2>
          {!isTranslatedForSite && (
            <span className="home-untranslated-tag">
              {extra.untranslatedTag}
            </span>
          )}
        </div>

        <div className="home-carousel-controls">
          <div className="tooltip-wrapper">
            <button
              type="button"
              className="home-carousel-arrow"
              onClick={() => scrollTrack('left')}
              aria-label={t.home.prevCarousel(headingTitle)}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <span className="tooltip-bubble" role="tooltip">
              {extra.scrollLeftTooltip}
            </span>
          </div>

          <div className="tooltip-wrapper">
            <button
              type="button"
              className="home-carousel-arrow"
              onClick={() => scrollTrack('right')}
              aria-label={t.home.nextCarousel(headingTitle)}
            >
              <ChevronRightIcon size={20} />
            </button>
            <span className="tooltip-bubble" role="tooltip">
              {extra.scrollRightTooltip}
            </span>
          </div>
        </div>
      </div>

      <div ref={trackRef} className="home-carousel-track">
        {carousel.items.map((story) => (
          <StoryCard key={story.id} story={story} onOpen={onOpenStory} />
        ))}
      </div>
    </section>
  );
};

/**
 * Tela 1 (Home / Descoberta).
 * Gerencia exibição do banner de idioma (`R18`), filtro de carrosséis sem tradução (`R9`),
 * destaque editorial para abertura direta do Cap. 1 e busca global por título/autor/gênero/tags.
 */
export const HomeScreen: React.FC = () => {
  const {
    stories,
    carousels,
    hideUntranslatedCarousels,
    siteLanguage,
    storiesLanguage,
    languageConfirmation,
    isLanguageModalOpen,
    undoLanguageChange,
    dismissLanguageConfirmation,
    openLanguageModal,
    searchQuery,
    setSearchQuery,
    setActiveStory,
    navigateTo,
  } = usePrototype();
  const { t } = useTranslation();
  const extra = HOME_EXTRA[siteLanguage];

  const openStory = (storyId: string) => {
    setActiveStory(storyId, 0);
    navigateTo('tela_3_leitura_desktop');
  };

  const featuredStory = useMemo(() => {
    return (
      stories.find(
        (s) =>
          s.id === 'cronicas-do-silencio' ||
          s.title === 'As Crônicas do Silêncio'
      ) ?? stories[0]
    );
  }, [stories]);

  const visibleCarousels = useMemo(
    () =>
      hideUntranslatedCarousels
        ? carousels.filter((c) =>
            hasCarouselTranslationForSiteLanguage(c, siteLanguage)
          )
        : carousels,
    [carousels, hideUntranslatedCarousels, siteLanguage]
  );

  const trimmedQuery = searchQuery.trim();
  const filteredStories = useMemo(() => {
    if (!trimmedQuery) return [];
    const needle = normalizeText(trimmedQuery);
    return stories.filter((story) => {
      const haystack = normalizeText(
        `${story.title} ${story.author} ${story.genre} ${story.synopsis} ${story.tags.join(' ')}`
      );
      return haystack.includes(needle);
    });
  }, [stories, trimmedQuery]);

  return (
    <div className="home-container">
      {/* Banner de confirmação de idioma (R18) */}
      {languageConfirmation && !isLanguageModalOpen && (
        <div
          className="home-lang-confirmation"
          role="status"
        >
          <div className="home-lang-confirmation-msg">
            <CheckIcon size={18} className="home-lang-confirmation-icon" />
            <span>{languageConfirmation.message}</span>
          </div>
          <div className="home-lang-confirmation-actions">
            {languageConfirmation.canUndo && (
              <button
                type="button"
                className="btn-pill-primary"
                onClick={undoLanguageChange}
              >
                <UndoIcon size={16} />
                <span>{t.common.undo}</span>
              </button>
            )}
            <button
              type="button"
              className="home-icon-btn"
              onClick={dismissLanguageConfirmation}
              aria-label={t.home.dismissNotice}
              title={t.home.dismissNotice}
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Faixa de resumo de idioma (R18). O filtro R9 é demonstrado pelo painel do avaliador. */}
      <section className="home-r9-bar" aria-label={t.home.languageBarLabel}>
        <div className="home-r9-summary-group">
          <div className="home-r9-status-pill">
            <GlobeIcon size={16} />
            <span>
              {t.siteWord}: {formatSiteLanguageName(siteLanguage)} ·{' '}
              {t.storiesWord}: {formatStoryLanguageName(storiesLanguage)}
            </span>
          </div>

          <div className="tooltip-wrapper">
            <button
              type="button"
              className="btn-pill-secondary"
              onClick={openLanguageModal}
            >
              <GlobeIcon size={16} />
              <span>{t.home.languageSettingsBtn}</span>
            </button>
            <span className="tooltip-bubble" role="tooltip">
              {t.home.languageSettingsTooltip}
            </span>
          </div>
        </div>

      </section>

      {/* Hero Editorial com CTA para abrir Cap. 1 de "As Crônicas do Silêncio" */}
      {featuredStory && (
        <section className="home-hero" aria-labelledby="home-hero-heading">
          <div className="home-hero-content">
            <div className="home-hero-eyebrow-row">
              <span className="home-hero-eyebrow">
                <SparklesIcon size={15} />
                <span>{t.home.heroBadge}</span>
              </span>
              <LanguageBadge language={featuredStory.language} />
            </div>

            <h1 id="home-hero-heading" className="home-hero-title">
              {featuredStory.title}
            </h1>

            <p className="home-hero-synopsis">{featuredStory.synopsis}</p>

            <div className="home-hero-meta">
              <span className="home-hero-meta-item">
                {extra.byAuthor(featuredStory.author)}
              </span>
              <span className="home-hero-meta-item">
                {featuredStory.genre}
              </span>
              <span className="home-hero-meta-item">
                <EyeIcon size={15} />
                <span>
                  {featuredStory.reads} {t.common.reads}
                </span>
              </span>
              <span className="home-hero-meta-item">
                <StarIcon size={15} />
                <span>
                  {featuredStory.votes} {t.common.votes}
                </span>
              </span>
              <span className="home-hero-meta-item">
                {extra.chaptersCount(featuredStory.parts)}
              </span>
            </div>

            <div className="home-hero-actions">
              <div className="tooltip-wrapper">
                <button
                  type="button"
                  className="btn-pill-brand"
                  onClick={() => openStory(featuredStory.id)}
                >
                  <HeadphonesIcon size={18} />
                  <span>{t.home.heroCta}</span>
                </button>
                <span className="tooltip-bubble" role="tooltip">
                  {t.home.heroCtaTooltip}
                </span>
              </div>

              <div className="tooltip-wrapper">
                <button
                  type="button"
                  className="btn-pill-secondary"
                  onClick={openLanguageModal}
                >
                  <GlobeIcon size={18} />
                  <span>{t.home.languageSettingsBtn}</span>
                </button>
                <span className="tooltip-bubble" role="tooltip">
                  {t.home.languageSettingsTooltip}
                </span>
              </div>
            </div>
          </div>

          <div className="home-hero-cover-wrap">
            <div className="home-hero-cover-shadow">
              <StoryCoverSvg
                story={featuredStory}
                width={182}
                decorative={false}
              />
            </div>
          </div>
        </section>
      )}

      {/* Resultados de Busca Global ou Carrosséis de Descoberta */}
      {trimmedQuery ? (
        <section
          className="home-search-section"
          aria-labelledby="home-search-heading"
        >
          <div className="home-search-header">
            <div>
              <h2 id="home-search-heading" className="home-search-title">
                {extra.searchHeading(trimmedQuery)}
              </h2>
              <p className="home-search-count">
                {extra.searchCount(filteredStories.length)}
              </p>
            </div>
            <button
              type="button"
              className="btn-pill-secondary"
              onClick={() => setSearchQuery('')}
            >
              <CloseIcon size={16} />
              <span>{t.home.clearSearch}</span>
            </button>
          </div>

          {filteredStories.length > 0 ? (
            <div className="home-search-grid">
              {filteredStories.map((story) => (
                <StoryCard key={story.id} story={story} onOpen={openStory} />
              ))}
            </div>
          ) : (
            <div className="home-search-empty" role="status">
              <h3>{extra.searchEmptyHeading}</h3>
              <p>{extra.searchEmptyText(trimmedQuery)}</p>
              <button
                type="button"
                className="btn-pill-primary"
                onClick={() => setSearchQuery('')}
              >
                <span>{t.home.clearSearch}</span>
              </button>
            </div>
          )}
        </section>
      ) : (
        visibleCarousels.map((carousel) => (
          <CarouselRow
            key={carousel.id}
            carousel={carousel}
            onOpenStory={openStory}
          />
        ))
      )}
    </div>
  );
};
