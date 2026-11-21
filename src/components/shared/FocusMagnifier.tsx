/**
 * @fileoverview Simulador visual de lupa de foco em 200% para avaliação do Cenário 1 (Renata).
 * Acompanha dinamicamente o elemento com foco de teclado sem bloquear cliques (`pointerEvents: 'none'`)
 * e sem interferir na árvore de acessibilidade (`aria-hidden="true"`), evidenciando o atendimento
 * aos requisitos R2 (player sempre na mesma posição), R7 (nomes acessíveis em PT-BR) e R22.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { PlaybackRate, SiteLanguage } from '../../types/prototype';
import { ZoomInIcon } from './Icons';

/** Instantâneo geométrico e semântico do elemento atualmente focado na página. */
interface FocusSnapshot {
  context: string;
  label: string;
  stateText: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
  };
}

const MAGNIFIER_LABELS: Record<
  SiteLanguage,
  {
    selectorFallback: string;
    roles: {
      link: string;
      button: string;
      input: string;
      select: string;
      element: string;
    };
    landmarkPlayer: string;
    playerRegion: string;
    funbar: string;
    inactive: string;
    switchOn: string;
    badgeText: string;
  }
> = {
  'pt-BR': {
    selectorFallback: 'Seletor',
    roles: {
      link: 'link',
      button: 'botão',
      input: 'campo',
      select: 'lista',
      element: 'elemento',
    },
    landmarkPlayer: 'Landmark · Região Ouvir',
    playerRegion: 'Player · Região Ouvir',
    funbar: 'Sub-header do capítulo',
    inactive: 'Inativo',
    switchOn: 'Ligado',
    badgeText: 'LUPA 200% · FOCO',
  },
  'en-US': {
    selectorFallback: 'Select',
    roles: {
      link: 'link',
      button: 'button',
      input: 'input',
      select: 'select',
      element: 'element',
    },
    landmarkPlayer: 'Landmark · Listen Region',
    playerRegion: 'Player · Listen Region',
    funbar: 'Chapter sub-header',
    inactive: 'Inactive',
    switchOn: 'On',
    badgeText: '200% MAGNIFIER · FOCUS',
  },
  'es-ES': {
    selectorFallback: 'Selector',
    roles: {
      link: 'enlace',
      button: 'botón',
      input: 'campo',
      select: 'lista',
      element: 'elemento',
    },
    landmarkPlayer: 'Landmark · Región Escuchar',
    playerRegion: 'Reproductor · Región Escuchar',
    funbar: 'Subencabezado del capítulo',
    inactive: 'Inactivo',
    switchOn: 'Activo',
    badgeText: 'LUPA 200% · FOCO',
  },
};

/**
 * Formata a velocidade de reprodução conforme o idioma (`1,75x` em PT/ES, `1.75x` em EN).
 *
 * @param rate Velocidade numérica selecionada.
 * @param siteLanguage Idioma atual da interface.
 * @returns Rótulo formatado com separador decimal localizado.
 */
function formatPlaybackRate(
  rate: PlaybackRate,
  siteLanguage: SiteLanguage
): string {
  const raw = rate.toString();
  return siteLanguage === 'en-US' ? `${raw}x` : `${raw.replace('.', ',')}x`;
}

/**
 * Extrai o nome acessível prioritário de um elemento focado seguindo a ordem semântica
 * (`select`, `aria-valuetext`, `aria-label`, `aria-labelledby`, `title`, texto visível, `placeholder`).
 *
 * @param el Elemento HTML atualmente focado.
 * @param selectorFallback Texto padrão para selects sem opção visível.
 * @returns Descrição textual concisa para exibição ampliada na lupa.
 */
function describeElement(el: HTMLElement, selectorFallback: string): string {
  if (el instanceof HTMLSelectElement) {
    return (
      el.selectedOptions[0]?.textContent?.trim() ||
      el.getAttribute('aria-label') ||
      selectorFallback
    );
  }

  const ariaValueText = el.getAttribute('aria-valuetext');
  if (ariaValueText) return ariaValueText;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const ariaLabelledBy = el.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelEl = document.getElementById(ariaLabelledBy);
    if (labelEl?.textContent) return labelEl.textContent.trim();
  }

  const titleAttr = el.getAttribute('title');
  if (titleAttr) return titleAttr;

  const text = el.textContent?.replace(/\s+/g, ' ').trim();
  if (text) return text.slice(0, 72);

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) return placeholder;

  return el.tagName.toLowerCase();
}

/**
 * Traduz o papel ARIA ou tag nativa do elemento focado para exibição legível no idioma ativo.
 *
 * @param el Elemento HTML focado.
 * @param roles Mapa localizado de papéis nativos.
 * @returns Rótulo curto do papel do elemento.
 */
function describeRole(
  el: HTMLElement,
  roles: (typeof MAGNIFIER_LABELS)['pt-BR']['roles']
): string {
  const explicitRole = el.getAttribute('role');
  if (explicitRole) return explicitRole;
  const tag = el.tagName.toLowerCase();
  if (tag === 'a') return roles.link;
  if (tag === 'button') return roles.button;
  if (tag === 'input') return roles.input;
  if (tag === 'select') return roles.select;
  return roles.element;
}

/**
 * Lente flutuante que amplia em texto de alto contraste o nome acessível, papel e estado
 * do elemento focado, posicionando-se acima ou abaixo do alvo conforme a metade da viewport.
 */
export const FocusMagnifier: React.FC = () => {
  const {
    magnifierEnabled,
    isPlaying,
    playbackRate,
    currentParagraph,
    activeChapter,
    activeScreen,
  } = usePrototype();
  const { t, siteLanguage } = useTranslation();
  const labels = MAGNIFIER_LABELS[siteLanguage];
  const [snapshot, setSnapshot] = useState<FocusSnapshot | null>(null);

  useEffect(() => {
    if (!magnifierEnabled) {
      setSnapshot(null);
      return;
    }

    const buildSnapshot = (el: HTMLElement): FocusSnapshot => {
      const rect = el.getBoundingClientRect();
      const inPlayer =
        el.id === 'audio-player-region' ||
        Boolean(el.closest('#audio-player-region'));
      const inFunbar = Boolean(el.closest('#funbar'));

      let context = describeRole(el, labels.roles);
      if (el.id === 'audio-player-region') {
        context = labels.landmarkPlayer;
      } else if (inPlayer) {
        context = labels.playerRegion;
      } else if (inFunbar) {
        context = labels.funbar;
      }

      const stateParts: string[] = [];
      const pressed = el.getAttribute('aria-pressed');
      const checked = el.getAttribute('aria-checked');
      if (pressed !== null) {
        stateParts.push(pressed === 'true' ? t.common.on : labels.inactive);
      } else if (checked !== null) {
        stateParts.push(checked === 'true' ? labels.switchOn : t.common.off);
      }
      if (inPlayer) {
        stateParts.push(isPlaying ? t.reader.nvdaPlaying : t.reader.nvdaPaused);
        stateParts.push(formatPlaybackRate(playbackRate, siteLanguage));
      }

      return {
        context,
        label: describeElement(el, labels.selectorFallback),
        stateText: stateParts.join(' · '),
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        },
      };
    };

    const updateFromActive = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        active !== document.documentElement
      ) {
        setSnapshot(buildSnapshot(active));
      } else {
        setSnapshot(null);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement) {
        setSnapshot(buildSnapshot(target));
      }
    };

    updateFromActive();
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('input', updateFromActive, true);
    document.addEventListener('change', updateFromActive, true);
    window.addEventListener('scroll', updateFromActive, true);
    window.addEventListener('resize', updateFromActive);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('input', updateFromActive, true);
      document.removeEventListener('change', updateFromActive, true);
      window.removeEventListener('scroll', updateFromActive, true);
      window.removeEventListener('resize', updateFromActive);
    };
  }, [
    magnifierEnabled,
    isPlaying,
    playbackRate,
    currentParagraph,
    activeChapter.id,
    activeScreen,
    siteLanguage,
    t,
    labels,
  ]);

  if (!magnifierEnabled) return null;

  const lensWidth = 380;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const totalParagraphs = Math.max(1, activeChapter.paragraphs.length);
  const positionStyle: React.CSSProperties = {
    left: '16px',
    top: '78px',
  };

  if (snapshot) {
    const lensLeft = Math.max(
      16,
      Math.min(
        viewportWidth - lensWidth - 16,
        snapshot.rect.left + snapshot.rect.width / 2 - lensWidth / 2
      )
    );
    const isBottomHalf = snapshot.rect.top > viewportHeight * 0.52;

    if (isBottomHalf) {
      delete positionStyle.top;
      positionStyle.bottom = `${Math.max(16, viewportHeight - snapshot.rect.top + 12)}px`;
    } else {
      positionStyle.top = `${Math.min(
        viewportHeight - 150,
        Math.max(76, snapshot.rect.bottom + 12)
      )}px`;
    }
    positionStyle.left = `${lensLeft}px`;
  } else if (activeScreen === 'tela_3_leitura_desktop') {
    delete positionStyle.top;
    delete positionStyle.left;
    positionStyle.right = '16px';
    positionStyle.bottom = '150px';
  }

  return (
    <div
      aria-hidden="true"
      data-magnifier-overlay="true"
      style={{
        position: 'fixed',
        ...positionStyle,
        width: `${lensWidth}px`,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 1500,
        pointerEvents: 'none',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '3px solid var(--warning-bg)',
        boxShadow: 'var(--shadow-elevated)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-text)',
          }}
        >
          <ZoomInIcon size={14} />
          <span>{labels.badgeText}</span>
        </span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
          }}
        >
          {snapshot
            ? snapshot.context
            : activeScreen === 'tela_3_leitura_desktop'
              ? t.reader.paragraphOf(currentParagraph, totalParagraphs)
              : t.common.onFem}
        </span>
      </div>

      <div
        style={{
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: 1.25,
          wordBreak: 'break-word',
        }}
      >
        {snapshot ? snapshot.label : t.shared.magnifierWaiting}
      </div>

      {snapshot?.stateText && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
          }}
        >
          {snapshot.stateText}
        </div>
      )}
    </div>
  );
};
