/**
 * @fileoverview Moldura das Telas 5 e 6 (Cenário 4 — Sansão no metrô).
 * - No computador: simulador de smartphone `390 × 844 px` com barra de status.
 * - No celular (`IS_PHONE_DEVICE`): tela inteira, acompanhando a área visível para que
 *   a barra de formatação fique logo acima do teclado do aparelho (`R19`, `R20`).
 * Os controles de demonstração (como restaurar o Cap. 9) ficam no painel do avaliador.
 */
import React, { useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { PlaybackRate, SiteLanguage } from '../../types/prototype';
import { IS_PHONE_DEVICE, useVisualViewport } from './deviceMode';
import './MobileScreens.css';

interface MobileFrameProps {
  screenLabel: string;
  children: React.ReactNode;
}

/**
 * Formata a velocidade de reprodução respeitando o separador decimal do idioma
 * (`1,25x` em `pt-BR`/`es-ES` e `1.25x` em `en-US`).
 */
export function formatLocalizedRate(
  rate: PlaybackRate,
  siteLanguage: SiteLanguage
): string {
  const base = Number.isInteger(rate) ? `${rate}.0` : String(rate);
  const localized = siteLanguage === 'en-US' ? base : base.replace('.', ',');
  return `${localized}x`;
}

const BEZEL_ARIA: Record<SiteLanguage, (screenLabel: string) => string> = {
  'pt-BR': (screenLabel) =>
    `Simulador de smartphone 390 por 844 pixels — ${screenLabel}`,
  'en-US': (screenLabel) =>
    `Smartphone simulator 390 by 844 pixels — ${screenLabel}`,
  'es-ES': (screenLabel) =>
    `Simulador de teléfono inteligente 390 por 844 píxeles — ${screenLabel}`,
};

/** Tela inteira no celular real, presa à área visível (encolhe quando o teclado abre). */
const DeviceRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const viewport = useVisualViewport(true);

  // Impede que a página por trás role junto (efeito "elástico" do iOS).
  useEffect(() => {
    const { documentElement, body } = document;
    documentElement.classList.add('mobile-device-lock');
    body.classList.add('mobile-device-lock');
    return () => {
      documentElement.classList.remove('mobile-device-lock');
      body.classList.remove('mobile-device-lock');
    };
  }, []);

  // Teclado aberto: a área visível fica bem menor que a janela.
  const keyboardOpen = Boolean(
    viewport && viewport.height < window.innerHeight - 120
  );

  return (
    <div
      className={`mobile-device-root ${
        keyboardOpen ? 'mobile-device-root--keyboard' : ''
      }`.trim()}
      style={
        viewport
          ? {
              height: `${viewport.height}px`,
              transform: `translateY(${viewport.offsetTop}px)`,
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

/**
 * Container das telas mobile: moldura 390×844 no computador ou tela inteira no celular.
 */
export const MobileFrame: React.FC<MobileFrameProps> = ({
  screenLabel,
  children,
}) => {
  if (IS_PHONE_DEVICE) {
    return <DeviceRoot>{children}</DeviceRoot>;
  }
  return <SimulatedFrame screenLabel={screenLabel}>{children}</SimulatedFrame>;
};

const SimulatedFrame: React.FC<MobileFrameProps> = ({
  screenLabel,
  children,
}) => {
  const { siteLanguage } = useTranslation();
  const bezelAria = BEZEL_ARIA[siteLanguage](screenLabel);

  return (
    <div className="mobile-stage">
      <div className="mobile-device-bezel" aria-label={bezelAria}>
        <div className="mobile-frame">
          <div className="mobile-status-bar" aria-hidden="true">
            <span>08:14</span>
            <span className="mobile-status-notch" />
            <span className="mobile-status-indicators">
              <span className="mobile-signal-bars">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span>5G</span>
              <span className="mobile-battery">
                <span className="mobile-battery-level" />
              </span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
