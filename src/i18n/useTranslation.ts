/**
 * @fileoverview Hook `useTranslation` que retorna o dicionário localizado (`pt-BR`, `en-US` ou `es-ES`)
 * correspondente ao `siteLanguage` ativo no `PrototypeContext` (W01 — R8, R10, R15).
 */
import { usePrototype } from '../state/PrototypeContext';
import { SiteLanguage } from '../types/prototype';
import { TRANSLATIONS, UITranslations } from './translations';

/**
 * Retorna o dicionário `t` e o código `siteLanguage` atual para internacionalização
 * em tempo real das telas e componentes do protótipo.
 *
 * @returns Dicionário `t` e código `siteLanguage`.
 */
export function useTranslation(): {
  t: UITranslations;
  siteLanguage: SiteLanguage;
} {
  const { siteLanguage } = usePrototype();
  return {
    t: TRANSLATIONS[siteLanguage],
    siteLanguage,
  };
}
