/**
 * @fileoverview Moldura simuladora de smartphone (`390 × 844 px`) compartilhada pelas
 * Telas 5 e 6 (Cenário 4 — Sansão no metrô).
 * Isola o viewport mobile com barra de status realista e painel lateral de apoio
 * exibindo o passo a passo de demonstração, estado sincronizado do Cap. 9 e botão
 * de restauração inicial (`R19`, `R20`).
 */
import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { PlaybackRate, SiteLanguage } from '../../types/prototype';
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

interface MobileFrameExtraStrings {
  bezelAria: (screenLabel: string) => string;
  asideAria: string;
  demoDescPrefix: string;
  demoDescMid: string;
  demoDescSuffix: string;
  step1: (rateLabel: string) => React.ReactNode;
  step2: React.ReactNode;
  step3: React.ReactNode;
  step4: React.ReactNode;
  currentPosLabel: string;
  globalSpeedLabel: string;
  chapterStatusLabel: string;
  statusEdited: string;
  statusInitial: string;
}

const MOBILE_FRAME_STRINGS: Record<SiteLanguage, MobileFrameExtraStrings> = {
  'pt-BR': {
    bezelAria: (screenLabel) =>
      `Simulador de smartphone 390 por 844 pixels — ${screenLabel}`,
    asideAria: 'Guia de demonstração do Cenário 4',
    demoDescPrefix: 'Viewport mobile dedicado de ',
    demoDescMid: ' com alvos de toque ',
    demoDescSuffix:
      ' na zona do polegar, sem sobrepor nenhuma linha de texto.',
    step1: (rateLabel) => (
      <>
        Na <strong>Tela 5</strong>, use <em>Reproduzir</em> e <em>Voltar</em>{' '}
        (múltiplos toques) com velocidade <strong>{rateLabel}</strong>.
      </>
    ),
    step2: (
      <>
        Toque em <strong>Editar</strong> para abrir a <strong>Tela 6</strong>{' '}
        já posicionada entre a taverna e a floresta.
      </>
    ),
    step3: (
      <>
        Role a barra acima do teclado para ativar <em>Itálico</em> (ou desativar
        um toque acidental), use <strong>Ditado por voz</strong>, adicione{' '}
        <code>***</code> centralizado e expanda o player pelo ícone de fones sem
        fechar o teclado.
      </>
    ),
    step4: (
      <>
        Toque em <strong>Salvar</strong> para conferir o capítulo atualizado na
        Tela 5 com velocidade preservada.
      </>
    ),
    currentPosLabel: 'Posição atual:',
    globalSpeedLabel: 'Velocidade global:',
    chapterStatusLabel: 'Estado do Cap. 9:',
    statusEdited: 'Editado e salvo',
    statusInitial: 'Versão inicial (taverna + floresta coladas)',
  },
  'en-US': {
    bezelAria: (screenLabel) =>
      `Smartphone simulator 390 by 844 pixels — ${screenLabel}`,
    asideAria: 'Scenario 4 demo guide',
    demoDescPrefix: 'Dedicated mobile viewport of ',
    demoDescMid: ' with touch targets ',
    demoDescSuffix:
      ' inside the thumb zone, without overlapping any line of text.',
    step1: (rateLabel) => (
      <>
        On <strong>Screen 5</strong>, tap <em>Play</em> and <em>Previous</em>{' '}
        (multiple taps) at <strong>{rateLabel}</strong> speed.
      </>
    ),
    step2: (
      <>
        Tap <strong>Edit</strong> to open <strong>Screen 6</strong> already
        positioned between the tavern and forest scenes.
      </>
    ),
    step3: (
      <>
        Scroll the bar above the keyboard to toggle <em>Italic</em> (or undo an
        accidental tap), use <strong>Voice dictation</strong>, insert centered{' '}
        <code>***</code>, and expand the audio player via the Listen button
        without closing the keyboard.
      </>
    ),
    step4: (
      <>
        Tap <strong>Save</strong> to verify the updated chapter on Screen 5 with
        the playback speed preserved.
      </>
    ),
    currentPosLabel: 'Current position:',
    globalSpeedLabel: 'Global speed:',
    chapterStatusLabel: 'Ch. 9 status:',
    statusEdited: 'Edited and saved',
    statusInitial: 'Initial version (tavern + forest merged)',
  },
  'es-ES': {
    bezelAria: (screenLabel) =>
      `Simulador de teléfono inteligente 390 por 844 píxeles — ${screenLabel}`,
    asideAria: 'Guía de demostración del Escenario 4',
    demoDescPrefix: 'Viewport móvil dedicado de ',
    demoDescMid: ' con objetivos táctiles ',
    demoDescSuffix:
      ' en la zona del pulgar, sin superponer ninguna línea de texto.',
    step1: (rateLabel) => (
      <>
        En la <strong>Pantalla 5</strong>, usa <em>Reproducir</em> y{' '}
        <em>Anterior</em> (varios toques) con velocidad{' '}
        <strong>{rateLabel}</strong>.
      </>
    ),
    step2: (
      <>
        Toca <strong>Editar</strong> para abrir la <strong>Pantalla 6</strong>{' '}
        ya situada entre la taberna y el bosque.
      </>
    ),
    step3: (
      <>
        Desplaza la barra sobre el teclado para activar <em>Cursiva</em> (o
        deshacer un toque accidental), usa <strong>Dictado por voz</strong>,
        añade <code>***</code> centrado y expande el reproductor sin cerrar el
        teclado.
      </>
    ),
    step4: (
      <>
        Toca <strong>Guardar</strong> para revisar el capítulo actualizado en la
        Pantalla 5 con la velocidad conservada.
      </>
    ),
    currentPosLabel: 'Posición actual:',
    globalSpeedLabel: 'Velocidad global:',
    chapterStatusLabel: 'Estado del Cap. 9:',
    statusEdited: 'Editado y guardado',
    statusInitial: 'Versión inicial (taberna + bosque unidos)',
  },
};

/**
 * Container que emoldura as telas mobile em 390×844 px sem sobrepor conteúdo e
 * apresenta o painel lateral de estado em tempo real para o Cenário 4.
 */
export const MobileFrame: React.FC<MobileFrameProps> = ({
  screenLabel,
  children,
}) => {
  const { t, siteLanguage } = useTranslation();
  const extra = MOBILE_FRAME_STRINGS[siteLanguage];
  const { sansaoChapter, playbackRate, resetSansaoChapter } = usePrototype();
  const totalBlocks = sansaoChapter.blocks.length;
  const formattedRate = formatLocalizedRate(playbackRate, siteLanguage);

  return (
    <div className="mobile-stage">
      <div
        className="mobile-device-bezel"
        aria-label={extra.bezelAria(screenLabel)}
      >
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

      <aside
        className="mobile-demo-aside"
        aria-label={extra.asideAria}
      >
        <span className="mobile-demo-badge">{t.mobile.demoPanelTitle}</span>
        <h2 className="mobile-demo-title">{screenLabel}</h2>
        <p className="mobile-demo-desc">
          {extra.demoDescPrefix}
          <strong>390 × 844 px</strong>
          {extra.demoDescMid}
          <strong>≥ 48 × 48 px</strong>
          {extra.demoDescSuffix}
        </p>

        <ol className="mobile-demo-steps">
          <li>{extra.step1(formattedRate)}</li>
          <li>{extra.step2}</li>
          <li>{extra.step3}</li>
          <li>{extra.step4}</li>
        </ol>

        <div className="mobile-demo-status" aria-live="polite">
          <span>
            <strong>{extra.currentPosLabel}</strong>{' '}
            {t.mobile.paragraphOf(sansaoChapter.currentParagraph, totalBlocks)}
          </span>
          <span>
            <strong>{extra.globalSpeedLabel}</strong> {formattedRate}
          </span>
          <span>
            <strong>{extra.chapterStatusLabel}</strong>{' '}
            {sansaoChapter.edited ? extra.statusEdited : extra.statusInitial}
          </span>
        </div>

        <button
          type="button"
          className="btn-pill-secondary"
          style={{ minHeight: '48px', width: '100%' }}
          onClick={resetSansaoChapter}
        >
          {t.mobile.demoResetBtn}
        </button>
      </aside>
    </div>
  );
};
