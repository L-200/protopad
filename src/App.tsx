/**
 * @fileoverview Shell principal do protótipo interativo TP2 IHC 2026.
 * Orquestra a alternância entre as 6 telas (Home, Idioma, Leitura/Editor Desktop e Mobile),
 * o modal global de idioma (R10, R18), o cabeçalho desktop, o monitor NVDA (R21), a lupa de foco (R22)
 * e a ordem rigorosa do primeiro foco na Tela 3 via skip link (R4).
 */
import React from 'react';
import { EvaluatorHub } from './components/shared/EvaluatorHub';
import { FocusMagnifier } from './components/shared/FocusMagnifier';
import { NvdaAnnouncer } from './components/shared/NvdaAnnouncer';
import { WattpadHeader } from './components/shared/WattpadHeader';
import { DesktopEditorScreen } from './screens/editor-desktop/DesktopEditorScreen';
import { HomeScreen } from './screens/home/HomeScreen';
import { LanguageSettingsModal } from './screens/language/LanguageSettingsModal';
import { LanguageSettingsScreen } from './screens/language/LanguageSettingsScreen';
import { MobileEditorScreen } from './screens/mobile/MobileEditorScreen';
import { MobileReaderScreen } from './screens/mobile/MobileReaderScreen';
import { DesktopReaderScreen } from './screens/reader-desktop/DesktopReaderScreen';
import { TRANSLATIONS } from './i18n/translations';
import { PrototypeProvider, usePrototype } from './state/PrototypeContext';

/**
 * Invólucro interno que consome o `PrototypeContext` para renderizar a tela ativa,
 * suprimir o cabeçalho desktop nos viewports mobile (Telas 5 e 6) e posicionar os
 * simuladores de acessibilidade sem interferir na ordem inicial de tabulação.
 */
const PrototypeShell: React.FC = () => {
  const { activeScreen, isLanguageModalOpen, siteLanguage } = usePrototype();
  const t = TRANSLATIONS[siteLanguage];

  const isMobileScreen =
    activeScreen === 'tela_5_leitura_mobile' ||
    activeScreen === 'tela_6_editor_mobile';
  const showGlobalHeader =
    !isMobileScreen && activeScreen !== 'tela_4_editor_desktop';

  /**
   * Transfere o foco diretamente para o landmark do player de áudio (`#audio-player-region`)
   * sem iniciar ou interromper a reprodução (R4).
   *
   * @param e Evento de clique no skip link.
   */
  const handleSkipToPlayer = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const region = document.getElementById('audio-player-region');
    if (region) {
      region.focus();
    }
  };

  /**
   * Seleciona o componente de tela correspondente ao identificador `activeScreen`.
   *
   * @returns Elemento React da tela ativa.
   */
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'tela_1_home':
        return <HomeScreen />;
      case 'tela_2_idioma':
        return <LanguageSettingsScreen />;
      case 'tela_3_leitura_desktop':
        return <DesktopReaderScreen />;
      case 'tela_4_editor_desktop':
        return <DesktopEditorScreen />;
      case 'tela_5_leitura_mobile':
        return <MobileReaderScreen />;
      case 'tela_6_editor_mobile':
        return <MobileEditorScreen />;
    }
  };

  return (
    <div className="app-shell">
      {/* R4: Primeiro elemento focável da Tela 3 é rigorosamente o skip link "Ir para o player" */}
      {activeScreen === 'tela_3_leitura_desktop' && (
        <a
          href="#audio-player-region"
          className="skip-link"
          onClick={handleSkipToPlayer}
        >
          {t.skipToPlayer}
        </a>
      )}

      {showGlobalHeader && <WattpadHeader />}

      <main id="main-content" className="app-main" tabIndex={-1}>
        {renderActiveScreen()}
      </main>

      {isLanguageModalOpen && <LanguageSettingsModal />}

      <NvdaAnnouncer />
      <FocusMagnifier />

      {/* Renderizado no final do DOM para nunca roubar o 1.º foco do skip link (R4) */}
      <EvaluatorHub />
    </div>
  );
};

/**
 * Componente raiz da aplicação que encapsula o shell no `PrototypeProvider` global.
 */
export const App: React.FC = () => {
  return (
    <PrototypeProvider>
      <PrototypeShell />
    </PrototypeProvider>
  );
};

export default App;
