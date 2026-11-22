/**
 * @fileoverview Cabeçalho global desktop do protótipo com marca, navegação principal,
 * busca acessível, aviso Premium e menu do usuário exibindo o estado dual de idioma.
 * Atende aos requisitos R15 (interface localizada conforme `siteLanguage`), R10/R18
 * (atalhos para modal e rota de idioma com estado dual `'Site: ... · Histórias: ...'`)
 * e R22 (alvos >= 44px e contraste >= 4,5:1).
 */
import React, { useEffect, useRef, useState } from 'react';
import { usePrototype } from '../../state/PrototypeContext';
import { SiteLanguage, StoryLanguage } from '../../types/prototype';
import {
  ChevronDownIcon,
  ContrastIcon,
  EditIcon,
  GlobeIcon,
  HeadphonesIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  WattpadMarkIcon,
} from './Icons';

/** Dicionário de textos localizados exibidos no cabeçalho desktop conforme `SiteLanguage`. */
interface HeaderCopy {
  explore: string;
  community: string;
  write: string;
  searchPlaceholder: string;
  searchLabel: string;
  searchApplied: (query: string) => string;
  logoAria: string;
  mainNavAria: string;
  premium: string;
  premiumNvda: string;
  premiumNotice: string;
  siteWord: string;
  siteShort: string;
  storiesShort: string;
  currentStatePrefix: string;
  languageSettingsModal: string;
  languageSettingsPage: string;
  desktopReader: string;
  desktopEditor: string;
  toggleContrast: string;
  menuLabel: string;
  statusOn: string;
  statusOff: string;
}

const HEADER_COPY: Record<SiteLanguage, HeaderCopy> = {
  'pt-BR': {
    explore: 'Explorar',
    community: 'Comunidade',
    write: 'Escrever',
    searchPlaceholder: 'Pesquisar',
    searchLabel: 'Pesquisar histórias e autores',
    searchApplied: (query) => `Busca aplicada para ${query}`,
    logoAria: 'Wattpad — Ir para a página inicial',
    mainNavAria: 'Navegação principal',
    premium: 'Experimente o Premium',
    premiumNvda: 'Informações do Wattpad Premium exibidas.',
    premiumNotice:
      'Leitura sem anúncios e histórias bônus incluídas no plano Premium.',
    siteWord: 'Site',
    siteShort: 'PT (BR)',
    storiesShort: 'Histórias',
    currentStatePrefix: 'Estado atual:',
    languageSettingsModal: 'Configurações de idioma',
    languageSettingsPage: 'Abrir página de idioma',
    desktopReader: 'Leitura de capítulo (Áudio)',
    desktopEditor: 'Editor de capítulos',
    toggleContrast: 'Alto Contraste Escuro',
    menuLabel: 'Menu do perfil e idioma',
    statusOn: 'Ativo',
    statusOff: 'Desligado',
  },
  'en-US': {
    explore: 'Browse',
    community: 'Community',
    write: 'Write',
    searchPlaceholder: 'Search',
    searchLabel: 'Search stories and authors',
    searchApplied: (query) => `Search applied for ${query}`,
    logoAria: 'Wattpad — Go to home page',
    mainNavAria: 'Main navigation',
    premium: 'Try Premium',
    premiumNvda: 'Wattpad Premium information displayed.',
    premiumNotice:
      'Ad-free reading and bonus stories included in the Premium plan.',
    siteWord: 'Site',
    siteShort: 'EN (US)',
    storiesShort: 'Stories',
    currentStatePrefix: 'Current status:',
    languageSettingsModal: 'Language settings',
    languageSettingsPage: 'Open language page',
    desktopReader: 'Chapter reader (Audio)',
    desktopEditor: 'Chapter editor',
    toggleContrast: 'High Contrast Dark',
    menuLabel: 'Profile and language menu',
    statusOn: 'On',
    statusOff: 'Off',
  },
  'es-ES': {
    explore: 'Explorar',
    community: 'Comunidad',
    write: 'Escribir',
    searchPlaceholder: 'Buscar',
    searchLabel: 'Buscar historias y autores',
    searchApplied: (query) => `Búsqueda aplicada para ${query}`,
    logoAria: 'Wattpad — Ir a la página de inicio',
    mainNavAria: 'Navegación principal',
    premium: 'Prueba Premium',
    premiumNvda: 'Información de Wattpad Premium mostrada.',
    premiumNotice:
      'Lectura sin anuncios e historias extra incluidas en el plan Premium.',
    siteWord: 'Sitio',
    siteShort: 'ES',
    storiesShort: 'Historias',
    currentStatePrefix: 'Estado actual:',
    languageSettingsModal: 'Configuración de idioma',
    languageSettingsPage: 'Abrir página de idioma',
    desktopReader: 'Lectura de capítulo (Audio)',
    desktopEditor: 'Editor de capítulos',
    toggleContrast: 'Alto Contraste Oscuro',
    menuLabel: 'Menú de perfil e idioma',
    statusOn: 'Activo',
    statusOff: 'Desactivado',
  },
};

const STORY_LANG_SHORT: Record<StoryLanguage, string> = {
  pt: 'PT',
  en: 'EN',
  es: 'ES',
};

const STORY_LANG_FULL: Record<StoryLanguage, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

const SITE_LANG_FULL: Record<SiteLanguage, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
  'es-ES': 'Español',
};

/**
 * Cabeçalho fixo exibido nas telas desktop (Telas 1 a 4).
 * Mantém o menu de perfil sincronizado com `siteLanguage` e `storiesLanguage`, fechando
 * por clique externo ou tecla `Escape`, e oferecendo acesso direto ao modal/página de idioma
 * e ao toggle de Alto Contraste Escuro (R22).
 */
export const WattpadHeader: React.FC = () => {
  const {
    activeScreen,
    navigateTo,
    openLanguageModal,
    siteLanguage,
    storiesLanguage,
    searchQuery,
    setSearchQuery,
    theme,
    toggleHighContrast,
    announceNvda,
  } = usePrototype();

  const [menuOpen, setMenuOpen] = useState(false);
  const [premiumNotice, setPremiumNotice] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const profileMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const t = HEADER_COPY[siteLanguage];

  // Mantém --header-height-live atualizado quando o header quebra em múltiplas linhas no zoom 200%
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateHeight = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--header-height-live', `${h}px`);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--header-height-live');
    };
  }, []);

  // Fecha o menu dropdown ao clicar fora ou pressionar Escape para navegação previsível por teclado
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        profileMenuTriggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  /**
   * Direciona o usuário à Home (Tela 1) ao submeter a busca global e anuncia o filtro aplicado.
   *
   * @param e Evento de submissão do formulário de busca.
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeScreen !== 'tela_1_home') {
      navigateTo('tela_1_home');
    }
    if (searchQuery.trim()) {
      announceNvda(t.searchApplied(searchQuery.trim()), 'system');
    }
  };

  const dualCompact = `${t.siteWord}: ${t.siteShort} · ${t.storiesShort}: ${STORY_LANG_SHORT[storiesLanguage]}`;
  const dualFull = `${t.siteWord}: ${SITE_LANG_FULL[siteLanguage]} · ${t.storiesShort}: ${STORY_LANG_FULL[storiesLanguage]}`;

  return (
    <header
      ref={headerRef}
      role="banner"
      className="wattpad-header"
      style={{
        minHeight: 'var(--header-height)',
        backgroundColor: 'var(--bg-page)',
        borderBottom: '1px solid var(--divider)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Esquerda: Marca + Navegação */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigateTo('tela_1_home')}
          aria-label={t.logoAria}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            minHeight: '44px',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <WattpadMarkIcon size={30} />
          <span
            style={{
              fontSize: '21px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--brand-aa)',
            }}
          >
            Wattpad
          </span>
        </button>

        <nav aria-label={t.mainNavAria} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => navigateTo('tela_1_home')}
            aria-current={activeScreen === 'tela_1_home' ? 'page' : undefined}
            style={{
              minHeight: '44px',
              padding: '0 12px',
              fontSize: '16px',
              fontWeight: activeScreen === 'tela_1_home' ? 700 : 600,
              color: 'var(--text-primary)',
              borderBottom:
                activeScreen === 'tela_1_home'
                  ? '3px solid var(--brand-aa)'
                  : '3px solid transparent',
            }}
          >
            {t.explore}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('tela_1_home')}
            style={{
              minHeight: '44px',
              padding: '0 12px',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-reading)',
              borderBottom: '3px solid transparent',
            }}
          >
            {t.community}
          </button>

          <button
            type="button"
            onClick={() => navigateTo('tela_4_editor_desktop')}
            aria-current={activeScreen === 'tela_4_editor_desktop' ? 'page' : undefined}
            style={{
              minHeight: '44px',
              padding: '0 12px',
              fontSize: '16px',
              fontWeight: activeScreen === 'tela_4_editor_desktop' ? 700 : 600,
              color: 'var(--text-primary)',
              borderBottom:
                activeScreen === 'tela_4_editor_desktop'
                  ? '3px solid var(--brand-aa)'
                  : '3px solid transparent',
            }}
          >
            {t.write}
          </button>
        </nav>
      </div>

      {/* Centro: Busca acessível (borda >= 4,5:1) */}
      <form
        role="search"
        onSubmit={handleSearchSubmit}
        style={{
          flex: '1 1 240px',
          maxWidth: '340px',
          position: 'relative',
        }}
      >
        <label htmlFor="wp-header-search" className="sr-only">
          {t.searchLabel}
        </label>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-secondary)',
            pointerEvents: 'none',
            display: 'inline-flex',
          }}
        >
          <SearchIcon size={17} />
        </span>
        <input
          id="wp-header-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          style={{
            width: '100%',
            minHeight: '44px',
            padding: '8px 14px 8px 38px',
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1.5px solid var(--border-input-aa)',
            borderRadius: 'var(--radius-cover)',
            fontSize: '16px',
          }}
        />
      </form>

      {/* Direita: Premium + Perfil com estado dual de idioma */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        <button
          type="button"
          className="btn-pill-premium"
          onClick={() => {
            setPremiumNotice((prev) => !prev);
            announceNvda(t.premiumNvda, 'system');
          }}
        >
          <SparklesIcon size={16} />
          <span>{t.premium}</span>
        </button>

        {premiumNotice && (
          <div
            role="status"
            style={{
              position: 'absolute',
              top: '54px',
              right: '180px',
              zIndex: 1115,
              width: '260px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              border: '2px solid var(--premium-text)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {t.premiumNotice}
          </div>
        )}

        <div ref={menuContainerRef} style={{ position: 'relative' }}>
          <button
            ref={profileMenuTriggerRef}
            type="button"
            aria-label={`${t.menuLabel}. ${t.currentStatePrefix} ${dualFull}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '44px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              border: '1.5px solid var(--border-input-aa)',
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserIcon size={16} />
            </span>
            <span>{dualCompact}</span>
            <ChevronDownIcon size={15} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label={t.menuLabel}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '310px',
                padding: '12px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-elevated)',
                border: '2px solid var(--border-input-aa)',
                boxShadow: 'var(--shadow-elevated)',
                zIndex: 1120,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-notice)',
                  border: '1px solid var(--divider)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {dualFull}
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  profileMenuTriggerRef.current?.focus();
                  setMenuOpen(false);
                  openLanguageModal();
                }}
                style={{
                  minHeight: '44px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--brand-aa)',
                  textAlign: 'left',
                }}
              >
                <GlobeIcon size={18} />
                <span>{t.languageSettingsModal}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigateTo('tela_2_idioma');
                }}
                style={{
                  minHeight: '44px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
              >
                <GlobeIcon size={18} />
                <span>{t.languageSettingsPage}</span>
              </button>

              <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--divider)', margin: '2px 0' }} />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigateTo('tela_3_leitura_desktop');
                }}
                style={{
                  minHeight: '44px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
              >
                <HeadphonesIcon size={18} />
                <span>{t.desktopReader}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigateTo('tela_4_editor_desktop');
                }}
                style={{
                  minHeight: '44px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
              >
                <EditIcon size={18} />
                <span>{t.desktopEditor}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toggleHighContrast();
                }}
                style={{
                  minHeight: '44px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                  <ContrastIcon size={18} />
                  <span>{t.toggleContrast}</span>
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--bg-notice)',
                    border: '1px solid var(--border-input-aa)',
                  }}
                >
                  {theme === 'high-contrast' ? t.statusOn : t.statusOff}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
