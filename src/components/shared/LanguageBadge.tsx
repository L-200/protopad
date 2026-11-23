/**
 * @fileoverview Selo visual e acessível de idioma para histórias, listas e prévia de voz TTS.
 * Atende aos requisitos R17 (identificação do idioma antes de abrir ou ouvir) e R22
 * (contraste >= 4,5:1 e distinção não dependente apenas de cor, com ícone + texto).
 */
import React from 'react';
import { StoryLanguage } from '../../types/prototype';
import { GlobeIcon } from './Icons';

/**
 * Propriedades do componente `LanguageBadge`.
 */
interface LanguageBadgeProps {
  /** Código do idioma da história ou lista (`'pt'`, `'en'` ou `'es'`). */
  language: StoryLanguage;
  /** Rótulo acessível customizado; quando omitido, usa rótulo localizado equivalente a `"Conteúdo em <idioma>"`. */
  ariaLabel?: string;
  /** Classes CSS adicionais aplicadas ao selo. */
  className?: string;
  /** Define se o ícone de globo acompanha o rótulo curto (padrão `true`, conforme R16/R22). */
  showIcon?: boolean;
}

const LANG_DISPLAY: Record<StoryLanguage, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

const LANG_HTML_CODE: Record<StoryLanguage, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
};

/**
 * Exibe um selo curto de idioma com contraste AA/AAA e ícone opcional de globo.
 * Utilizado nos cards da Home (Tela 1) e antes do player "Ouvir" na Leitura Desktop (Tela 3)
 * para antecipar o idioma da história e da voz sintetizada (R8, R17).
 *
 * @param props Propriedades do selo de idioma.
 */
export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  language,
  ariaLabel,
  className = '',
  showIcon = true,
}) => {
  const label = LANG_DISPLAY[language];
  const htmlLang = LANG_HTML_CODE[language];
  const isEnglish = language === 'en';

  return (
    <span
      className={`lang-badge ${isEnglish ? 'lang-badge--en' : ''} ${className}`.trim()}
      lang={htmlLang}
      aria-label={ariaLabel}
    >
      {showIcon && <GlobeIcon size={13} />}
      <span lang={htmlLang}>{label}</span>
    </span>
  );
};
