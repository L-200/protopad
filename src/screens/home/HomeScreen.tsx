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
import { usePrototype } from '../../state/PrototypeContext';
import { CarouselData, StoryItem } from '../../types/prototype';
import {
  formatSiteLanguageLabel,
  formatStoryLanguageLabel,
} from '../language/LanguageSettingsForm';
import './HomeScreen.css';

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
  const statusTag = story.isReadingList
    ? 'Lista da comunidade'
    : story.isCompleted
      ? 'Concluída'
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
          aria-label={`${story.title}, por ${story.author}. Conteúdo em ${
            story.language === 'pt'
              ? 'Português'
              : story.language === 'en'
                ? 'English'
                : 'Español'
          }. Ouvir ou ler capítulo 1.`}
        >
          <StoryCoverSvg story={story} width="100%" />
          <span className="story-card-title">{story.title}</span>
          <span className="story-card-author">{story.author}</span>
          <span className="story-card-cta-pill">
            <HeadphonesIcon size={14} />
            <span>Ouvir ou ler</span>
          </span>
        </button>
        <span className="tooltip-bubble" role="tooltip">
          Abrir Cap. 1 para ler ou ouvir
        </span>
      </div>

      <div className="story-card-meta">
        {story.isReadingList ? (
          <span className="story-card-meta-item">
            <ListIcon size={13} />
            <span>{story.listStoryCount ?? story.parts} histórias</span>
          </span>
        ) : (
          <>
            <span className="story-card-meta-item" title="Leituras">
              <EyeIcon size={13} />
              <span>{story.reads}</span>
            </span>
            <span className="story-card-meta-item" title="Votos">
              <StarIcon size={13} />
              <span>{story.votes}</span>
            </span>
            <span className="story-card-meta-item">
              <span>{story.parts} partes</span>
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
 * Exibe o título traduzido em PT-BR (`R9`) ou indica visualmente quando o filtro R9
 * é desligado manualmente para demonstração de carrosséis sem tradução.
 */
const CarouselRow: React.FC<CarouselRowProps> = ({ carousel, onOpenStory }) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const headingTitle = carousel.hasPtTranslation
    ? carousel.titlePt
    : carousel.titleEn ?? carousel.titlePt;

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
        !carousel.hasPtTranslation ? 'home-carousel-section--untranslated' : ''
      }`}
    >
      <div className="home-carousel-header">
        <div className="home-carousel-title-wrap">
          <h2 className="home-carousel-title">{headingTitle}</h2>
          {!carousel.hasPtTranslation && (
            <span className="home-untranslated-tag">
              Sem tradução em PT-BR (filtro R9 desligado)
            </span>
          )}
        </div>

        <div className="home-carousel-controls">
          <div className="tooltip-wrapper">
            <button
              type="button"
              className="home-carousel-arrow"
              onClick={() => scrollTrack('left')}
              aria-label={`Rolar "${headingTitle}" para a esquerda`}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <span className="tooltip-bubble" role="tooltip">
              Rolar para a esquerda
            </span>
          </div>

          <div className="tooltip-wrapper">
            <button
              type="button"
              className="home-carousel-arrow"
              onClick={() => scrollTrack('right')}
              aria-label={`Rolar "${headingTitle}" para a direita`}
            >
              <ChevronRightIcon size={20} />
            </button>
            <span className="tooltip-bubble" role="tooltip">
              Rolar para a direita
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
 * Gerencia exibição do banner de idioma (`R18`), switch demonstrativo do filtro R9,
 * destaque editorial para abertura direta do Cap. 1 e busca global por título/autor/gênero/tags.
 */
export const HomeScreen: React.FC = () => {
  const {
    stories,
    carousels,
    hideUntranslatedCarousels,
    setHideUntranslatedCarousels,
    siteLanguage,
    storiesLanguage,
    languageConfirmation,
    undoLanguageChange,
    dismissLanguageConfirmation,
    openLanguageModal,
    searchQuery,
    setSearchQuery,
    setActiveStory,
    navigateTo,
  } = usePrototype();

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

  const hiddenUntranslatedCount = useMemo(
    () => carousels.filter((c) => !c.hasPtTranslation).length,
    [carousels]
  );

  const visibleCarousels = useMemo(
    () =>
      hideUntranslatedCarousels
        ? carousels.filter((c) => c.hasPtTranslation)
        : carousels,
    [carousels, hideUntranslatedCarousels]
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
      {languageConfirmation && (
        <div
          className="home-lang-confirmation"
          role="status"
          aria-live="polite"
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
                <span>Desfazer</span>
              </button>
            )}
            <button
              type="button"
              className="home-icon-btn"
              onClick={dismissLanguageConfirmation}
              aria-label="Dispensar aviso de idioma"
              title="Fechar aviso"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Faixa de resumo de idioma e demonstração do filtro R9 */}
      <section
        className="home-r9-bar"
        aria-label="Resumo de idioma e filtro de carrosséis sem tradução"
      >
        <div className="home-r9-summary-group">
          <div className="home-r9-status-pill">
            <GlobeIcon size={16} />
            <span>
              Site: {formatSiteLanguageLabel(siteLanguage)} · Histórias:{' '}
              {formatStoryLanguageLabel(storiesLanguage)}
            </span>
          </div>

          <div className="tooltip-wrapper">
            <button
              type="button"
              className="btn-pill-secondary"
              onClick={openLanguageModal}
            >
              <GlobeIcon size={16} />
              <span>Configurações de idioma</span>
            </button>
            <span className="tooltip-bubble" role="tooltip">
              Separar idioma do site e das histórias
            </span>
          </div>
        </div>

        <div className="home-r9-switch-group">
          <button
            type="button"
            role="switch"
            aria-checked={hideUntranslatedCarousels}
            className="home-r9-switch-btn"
            onClick={() =>
              setHideUntranslatedCarousels(!hideUntranslatedCarousels)
            }
          >
            <span
              className="home-r9-track"
              data-checked={hideUntranslatedCarousels}
              aria-hidden="true"
            >
              <span className="home-r9-thumb" />
            </span>
            <span>Ocultar carrosséis sem tradução em PT-BR (R9)</span>
          </button>
          <span className="home-r9-note">
            {hideUntranslatedCarousels
              ? hiddenUntranslatedCount > 0
                ? `${hiddenUntranslatedCount} carrossel sem tradução oculto`
                : 'Ativo por padrão'
              : 'Demonstração: exibindo carrossel sem tradução abaixo'}
          </span>
        </div>
      </section>

      {/* Hero Editorial com CTA para abrir Cap. 1 de "As Crônicas do Silêncio" */}
      {featuredStory && (
        <section className="home-hero" aria-labelledby="home-hero-heading">
          <div className="home-hero-content">
            <div className="home-hero-eyebrow-row">
              <span className="home-hero-eyebrow">
                <SparklesIcon size={15} />
                <span>Destaque editorial da semana</span>
              </span>
              <LanguageBadge language={featuredStory.language} />
            </div>

            <h1 id="home-hero-heading" className="home-hero-title">
              {featuredStory.title}
            </h1>

            <p className="home-hero-synopsis">{featuredStory.synopsis}</p>

            <div className="home-hero-meta">
              <span className="home-hero-meta-item">
                Por {featuredStory.author}
              </span>
              <span className="home-hero-meta-item">
                {featuredStory.genre}
              </span>
              <span className="home-hero-meta-item">
                <EyeIcon size={15} />
                <span>{featuredStory.reads} leituras</span>
              </span>
              <span className="home-hero-meta-item">
                <StarIcon size={15} />
                <span>{featuredStory.votes} votos</span>
              </span>
              <span className="home-hero-meta-item">
                {featuredStory.parts} capítulos
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
                  <span>Ouvir ou ler Cap. 1</span>
                </button>
                <span className="tooltip-bubble" role="tooltip">
                  Abrir Capítulo 1 no leitor com narração e áudio
                </span>
              </div>

              <div className="tooltip-wrapper">
                <button
                  type="button"
                  className="btn-pill-secondary"
                  onClick={openLanguageModal}
                >
                  <GlobeIcon size={18} />
                  <span>Configurações de idioma</span>
                </button>
                <span className="tooltip-bubble" role="tooltip">
                  Escolher idioma dos menus e das histórias
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
                Resultados da busca para &ldquo;{trimmedQuery}&rdquo;
              </h2>
              <p className="home-search-count">
                {filteredStories.length}{' '}
                {filteredStories.length === 1
                  ? 'história encontrada'
                  : 'histórias encontradas'}
              </p>
            </div>
            <button
              type="button"
              className="btn-pill-secondary"
              onClick={() => setSearchQuery('')}
            >
              <CloseIcon size={16} />
              <span>Limpar busca</span>
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
              <h3>Nenhuma história encontrada</h3>
              <p>
                Não encontramos histórias ou listas com &ldquo;{trimmedQuery}
                &rdquo;. Tente outro título, autor ou gênero.
              </p>
              <button
                type="button"
                className="btn-pill-primary"
                onClick={() => setSearchQuery('')}
              >
                <span>Limpar busca</span>
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
