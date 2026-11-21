/**
 * @fileoverview Rota dedicada da Tela 2 — Configurações de Idioma.
 * Disponibiliza os controles independentes de idioma do site e das histórias (`R10`,
 * `R15`, `R16`, `R18`) em página completa, preservando o retorno à tela de origem
 * (como Home ou Editor Desktop nos Cenários 2 e 3).
 */
import React from 'react';
import { ChevronLeftIcon, GlobeIcon } from '../../components/shared/Icons';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { LanguageSettingsForm } from './LanguageSettingsForm';
import './LanguageSettings.css';

/**
 * Página dedicada de Configurações de Idioma com botão de retorno contextual para
 * `previousScreen` (evitando loop caso a própria tela de idioma esteja registrada).
 */
export const LanguageSettingsScreen: React.FC = () => {
  const { previousScreen, navigateTo } = usePrototype();
  const { t } = useTranslation();
  const returnTarget =
    previousScreen && previousScreen !== 'tela_2_idioma'
      ? previousScreen
      : 'tela_1_home';

  return (
    <div className="lang-page-container">
      <div className="lang-page-topbar">
        <button
          type="button"
          className="btn-pill-secondary"
          aria-label={t.language.backToPrevious}
          onClick={() => navigateTo(returnTarget)}
        >
          <ChevronLeftIcon size={18} />
          <span>{t.language.backBtn}</span>
        </button>
      </div>

      <section className="lang-page-card" aria-labelledby="lang-page-title">
        <div className="lang-page-heading">
          <span className="lang-modal-title-icon" aria-hidden="true">
            <GlobeIcon size={20} />
          </span>
          <h1 id="lang-page-title">{t.language.pageTitle}</h1>
        </div>
        <p className="lang-page-subtitle">{t.language.subtitle}</p>

        <LanguageSettingsForm
          mode="page"
          onSecondaryAction={() => navigateTo(returnTarget)}
        />
      </section>
    </div>
  );
};
