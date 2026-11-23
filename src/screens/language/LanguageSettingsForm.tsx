/**
 * @fileoverview Formulário compartilhado da Tela 2 — Configurações de Idioma.
 * Implementa a separação explícita entre idioma do site e idioma das histórias com
 * exemplos concretos (`R10`), orientação de retorno sem perda de contexto (`R15`),
 * rótulos simples com ícones (`R16`), resumo de estado no topo e banner de confirmação
 * com ação "Desfazer" (`R18`) nos Cenários 2 e 3.
 */
import React, { useId } from 'react';
import {
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  EditIcon,
  InfoIcon,
  UndoIcon,
} from '../../components/shared/Icons';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { SiteLanguage, StoryLanguage } from '../../types/prototype';
import './LanguageSettings.css';

interface LanguageSettingsFormProps {
  mode: 'modal' | 'page';
  onSecondaryAction?: () => void;
}

/**
 * Converte o código do idioma da interface para o rótulo completo exibido ao usuário.
 *
 * @param lang Código de idioma do site (`pt-BR`, `en-US`, `es-ES`).
 * @returns Nome legível do idioma do site.
 */
export function formatSiteLanguageLabel(lang: SiteLanguage): string {
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
 * Converte o código do idioma das histórias para o rótulo curto exibido em selos e resumos.
 *
 * @param lang Código de idioma de histórias (`pt`, `en`, `es`).
 * @returns Nome curto do idioma das histórias.
 */
export function formatStoryLanguageLabel(lang: StoryLanguage): string {
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
 * Extrai o código-base de idioma (`pt`, `en`, `es`) a partir do locale do site
 * para detectar quando menus e histórias estão configurados em idiomas distintos.
 */
function getBaseLangCode(siteLang: SiteLanguage): StoryLanguage {
  if (siteLang.startsWith('en')) return 'en';
  if (siteLang.startsWith('es')) return 'es';
  return 'pt';
}

/**
 * Formulário acessível de configuração dual de idioma (`mode="modal"` ou `mode="page"`).
 * A mudança vale assim que o campo é alterado, sem botão "Salvar": a confirmação com
 * "Desfazer" aparece na hora (`R18`; Cenário 3 e HTA 2.3 > 2.4 > 2.5).
 */
export const LanguageSettingsForm: React.FC<LanguageSettingsFormProps> = ({
  mode,
  onSecondaryAction,
}) => {
  const {
    siteLanguage,
    storiesLanguage,
    languageConfirmation,
    updateLanguages,
    undoLanguageChange,
  } = usePrototype();
  const { t } = useTranslation();

  const baseId = useId();
  const siteSelectId = `${baseId}-site-lang`;
  const siteHintId = `${baseId}-site-hint`;
  const storiesSelectId = `${baseId}-stories-lang`;
  const storiesHintId = `${baseId}-stories-hint`;

  const languagesDiffer = getBaseLangCode(siteLanguage) !== storiesLanguage;

  /** Aplica o novo idioma do site na hora e mostra a confirmação com Desfazer (`R18`). */
  const handleSiteChange = (value: SiteLanguage) => {
    if (value !== siteLanguage) updateLanguages({ siteLanguage: value });
  };

  /** Aplica o novo idioma das histórias na hora e mostra a confirmação com Desfazer (`R18`). */
  const handleStoriesChange = (value: StoryLanguage) => {
    if (value !== storiesLanguage) updateLanguages({ storiesLanguage: value });
  };

  return (
    <form
      className="lang-form"
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      {/* R18: Frase curta de estado atual sempre visível no topo */}
      <div className="lang-status-summary">
        <span>
          {t.siteWord}: {formatSiteLanguageLabel(siteLanguage)} · {t.storiesWord}:{' '}
          {formatStoryLanguageLabel(storiesLanguage)}
        </span>
      </div>

      {/* R18: Confirmação + Ação Desfazer */}
      {languageConfirmation && (
        <div
          className="lang-confirmation-banner"
          role="status"
        >
          <div className="lang-confirmation-text">
            <CheckIcon size={18} className="lang-confirmation-icon" />
            <span>{languageConfirmation.message}</span>
          </div>
          {languageConfirmation.canUndo && (
            <button
              type="button"
              className="lang-undo-btn"
              onClick={undoLanguageChange}
            >
              <UndoIcon size={16} />
              <span>{t.common.undo}</span>
            </button>
          )}
        </div>
      )}

      {/* Campo 1: Idioma do site (menus e botões) */}
      <div className="lang-field">
        <label htmlFor={siteSelectId} className="lang-field-label">
          <EditIcon size={18} />
          <span>{t.language.siteFieldLabel}</span>
        </label>
        <div className="lang-select-wrapper">
          <select
            id={siteSelectId}
            className="lang-select"
            value={siteLanguage}
            onChange={(e) => handleSiteChange(e.target.value as SiteLanguage)}
            aria-describedby={siteHintId}
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
          <span className="lang-select-chevron" aria-hidden="true">
            <ChevronDownIcon size={18} />
          </span>
        </div>
        <p id={siteHintId} className="lang-field-example">
          {t.language.siteFieldExample}
        </p>
      </div>

      {/* Campo 2: Idioma das histórias recomendadas */}
      <div className="lang-field">
        <label htmlFor={storiesSelectId} className="lang-field-label">
          <BookOpenIcon size={18} />
          <span>{t.language.storiesFieldLabel}</span>
        </label>
        <div className="lang-select-wrapper">
          <select
            id={storiesSelectId}
            className="lang-select"
            value={storiesLanguage}
            onChange={(e) => handleStoriesChange(e.target.value as StoryLanguage)}
            aria-describedby={storiesHintId}
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
          <span className="lang-select-chevron" aria-hidden="true">
            <ChevronDownIcon size={18} />
          </span>
        </div>
        <p id={storiesHintId} className="lang-field-example">
          {t.language.storiesFieldExample}
        </p>
      </div>

      {/* Aviso contextual quando os dois eixos estão em idiomas diferentes */}
      {languagesDiffer && (
        <div className="lang-notice-card" role="note">
          <InfoIcon size={18} className="lang-notice-icon" />
          <div>
            <strong>{t.language.mismatchTitle}:</strong>{' '}
            {t.language.mismatchBody(
              formatSiteLanguageLabel(siteLanguage),
              formatStoryLanguageLabel(storiesLanguage)
            )}
          </div>
        </div>
      )}

      {/* R15: Orientação clara caso o usuário teste trocar o idioma do site */}
      {siteLanguage !== 'pt-BR' && (
        <div className="lang-notice-card" role="note">
          <InfoIcon size={18} className="lang-notice-icon" />
          <div>
            <strong>{t.language.nonPtTitle}:</strong> {t.language.nonPtBody}
          </div>
        </div>
      )}

      {/* Sem "Salvar": a mudança já vale. Só resta fechar a janela ou voltar (HTA 2.5). */}
      {onSecondaryAction && (
        <div className="lang-actions">
          <button
            type="button"
            className="btn-pill-primary"
            onClick={onSecondaryAction}
          >
            <CheckIcon size={18} />
            <span>{mode === 'modal' ? t.language.closeBtn : t.language.backBtn}</span>
          </button>
        </div>
      )}
    </form>
  );
};
