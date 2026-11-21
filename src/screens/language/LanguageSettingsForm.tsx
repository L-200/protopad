/**
 * @fileoverview Formulário compartilhado da Tela 2 — Configurações de Idioma.
 * Implementa a separação explícita entre idioma do site e idioma das histórias com
 * exemplos concretos (`R10`), orientação de retorno sem perda de contexto (`R15`),
 * rótulos simples com ícones (`R16`), resumo de estado no topo e banner de confirmação
 * com ação "Desfazer" (`R18`) nos Cenários 2 e 3.
 */
import React, { useEffect, useId, useState } from 'react';
import {
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  EditIcon,
  InfoIcon,
  UndoIcon,
} from '../../components/shared/Icons';
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
 * Mantém estado local de rascunho para permitir pré-visualização de avisos antes de
 * confirmar via "Salvar" e ressincroniza automaticamente quando "Desfazer" é acionado.
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

  const [draftSite, setDraftSite] = useState<SiteLanguage>(siteLanguage);
  const [draftStories, setDraftStories] = useState<StoryLanguage>(storiesLanguage);

  // Mantém os selects sincronizados com o contexto (inclusive ao clicar em "Desfazer")
  useEffect(() => {
    setDraftSite(siteLanguage);
  }, [siteLanguage]);

  useEffect(() => {
    setDraftStories(storiesLanguage);
  }, [storiesLanguage]);

  const baseId = useId();
  const siteSelectId = `${baseId}-site-lang`;
  const siteHintId = `${baseId}-site-hint`;
  const storiesSelectId = `${baseId}-stories-lang`;
  const storiesHintId = `${baseId}-stories-hint`;

  const hasPendingChanges =
    draftSite !== siteLanguage || draftStories !== storiesLanguage;
  const languagesDiffer = getBaseLangCode(draftSite) !== draftStories;

  /** Persiste os dois eixos de idioma no estado global e dispara a confirmação com Desfazer (`R18`). */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateLanguages({
      siteLanguage: draftSite,
      storiesLanguage: draftStories,
    });
  };

  return (
    <form className="lang-form" onSubmit={handleSubmit} noValidate>
      {/* R18: Frase curta de estado atual sempre visível no topo */}
      <div className="lang-status-summary" aria-live="polite">
        <span>
          Site: {formatSiteLanguageLabel(siteLanguage)} · Histórias:{' '}
          {formatStoryLanguageLabel(storiesLanguage)}
        </span>
        {hasPendingChanges && (
          <span className="lang-status-pending">Alteração pendente</span>
        )}
      </div>

      {/* R18: Confirmação + Ação Desfazer */}
      {languageConfirmation && (
        <div
          className="lang-confirmation-banner"
          role="status"
          aria-live="polite"
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
              <span>Desfazer</span>
            </button>
          )}
        </div>
      )}

      {/* Campo 1: Idioma do site (menus e botões) */}
      <div className="lang-field">
        <label htmlFor={siteSelectId} className="lang-field-label">
          <EditIcon size={18} />
          <span>Idioma do site (menus e botões)</span>
        </label>
        <div className="lang-select-wrapper">
          <select
            id={siteSelectId}
            className="lang-select"
            value={draftSite}
            onChange={(e) => setDraftSite(e.target.value as SiteLanguage)}
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
          Ex.: menus, botões, editor e mensagens como &apos;Publicar&apos;,
          &apos;Salvar&apos; e &apos;Escrever&apos;.
        </p>
      </div>

      {/* Campo 2: Idioma das histórias recomendadas */}
      <div className="lang-field">
        <label htmlFor={storiesSelectId} className="lang-field-label">
          <BookOpenIcon size={18} />
          <span>Idioma das histórias recomendadas</span>
        </label>
        <div className="lang-select-wrapper">
          <select
            id={storiesSelectId}
            className="lang-select"
            value={draftStories}
            onChange={(e) => setDraftStories(e.target.value as StoryLanguage)}
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
          Ex.: histórias e listas recomendadas na página inicial, como romances
          em Português ou English.
        </p>
      </div>

      {/* Aviso contextual quando os dois eixos estão em idiomas diferentes */}
      {languagesDiffer && (
        <div className="lang-notice-card" role="note">
          <InfoIcon size={18} className="lang-notice-icon" />
          <div>
            <strong>Os dois idiomas são independentes:</strong> os menus e botões
            continuarão em{' '}
            <strong>{formatSiteLanguageLabel(draftSite)}</strong>, enquanto as
            histórias e listas recomendadas na página inicial serão exibidas em{' '}
            <strong>{formatStoryLanguageLabel(draftStories)}</strong>.
          </div>
        </div>
      )}

      {/* R15: Orientação clara caso o usuário teste trocar o idioma do site */}
      {draftSite !== 'pt-BR' && (
        <div className="lang-notice-card" role="note">
          <InfoIcon size={18} className="lang-notice-icon" />
          <div>
            Você selecionou <strong>{formatSiteLanguageLabel(draftSite)}</strong>{' '}
            para menus e botões. Você pode retornar para{' '}
            <strong>Português (Brasil)</strong> a qualquer momento neste painel
            sem afetar suas histórias.
          </div>
        </div>
      )}

      {/* Hierarquia clara dos botões: Primário Salvar + Secundário Fechar/Voltar */}
      <div className="lang-actions">
        {onSecondaryAction && (
          <button
            type="button"
            className="btn-pill-secondary"
            onClick={onSecondaryAction}
          >
            {mode === 'modal' ? 'Fechar' : 'Voltar'}
          </button>
        )}
        <button type="submit" className="btn-pill-primary">
          <CheckIcon size={18} />
          <span>Salvar</span>
        </button>
      </div>
    </form>
  );
};
