/**
 * @fileoverview Simulador visual de Lupa 200% para avaliação do Cenário 1 (Renata — Baixa Visão).
 *
 * O que a Lupa 200% faz (R2, R7, R22):
 * 1. **Alvo por Clique ou Mouse sobre o Texto**: Ao clicar ou passar o mouse sobre qualquer
 *    parágrafo do capítulo, amplia o texto real daquele parágrafo em 200% (`24px/34px`, alto
 *    contraste), permitindo ler confortavelmente cada trecho.
 * 2. **Acompanhamento de Foco do Teclado (`Tab`, `"Ir para o player"`, tecla `D`, `Alt+P`)**:
 *    Ao navegar pelos controles (cabeçalho, sub-header ou barra inferior fixa do player `#audio-player-region`),
 *    a lente acompanha o controle focado e exibe seu rótulo, atalho e estado (`Reproduzindo · 1,75x`)
 *    em tamanho 200%, comprovando o requisito R2 (o player fixo na base acompanha o foco e a Lupa).
 * 3. **Acompanhamento da Leitura em Áudio**: Quando o áudio avança para um novo parágrafo,
 *    a lupa atualiza automaticamente para exibir o parágrafo ativo ampliado em 200%.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { usePrototype } from '../../state/PrototypeContext';
import { PlaybackRate, SiteLanguage } from '../../types/prototype';
import { ZoomInIcon } from './Icons';

/** Instantâneo geométrico e semântico do elemento ou parágrafo atualmente ampliado pela Lupa 200%. */
interface MagnifierSnapshot {
  kind: 'paragraph' | 'control';
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
    hintText: string;
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
    badgeText: 'LUPA 200%',
    hintText: 'Clique ou passe o mouse em um parágrafo ou use Tab nos controles',
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
    badgeText: '200% MAGNIFIER',
    hintText: 'Click or hover any paragraph or press Tab across controls',
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
    badgeText: 'LUPA 200%',
    hintText: 'Haz clic o pasa el ratón por un párrafo o usa Tab en los controles',
  },
};

function formatPlaybackRate(
  rate: PlaybackRate,
  siteLanguage: SiteLanguage
): string {
  const raw = rate.toString();
  return siteLanguage === 'en-US' ? `${raw}x` : `${raw.replace('.', ',')}x`;
}

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
  if (text) return text.slice(0, 120);

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) return placeholder;

  return el.tagName.toLowerCase();
}

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
 * Lente flutuante de ampliação 200% que acompanha tanto parágrafos do texto
 * (por clique, hover ou leitura ativa) quanto controles focados por teclado (`Tab`).
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
  const [snapshot, setSnapshot] = useState<MagnifierSnapshot | null>(null);

  const totalParagraphs = Math.max(1, activeChapter.paragraphs.length);

  const isReaderDesktop = activeScreen === 'tela_3_leitura_desktop';
  const isActive = magnifierEnabled && isReaderDesktop;

  // Atualiza automaticamente para o parágrafo ativo quando a lupa é ligada ou o parágrafo muda
  useEffect(() => {
    if (!isActive) {
      setSnapshot(null);
      return;
    }

    const activeParagraphEl = document.querySelector<HTMLElement>(
      `[data-paragraph-number="${currentParagraph}"]`
    );
    const paragraphText = activeChapter.paragraphs[currentParagraph - 1];
    if (activeParagraphEl && paragraphText) {
      const rect = activeParagraphEl.getBoundingClientRect();
      setSnapshot({
        kind: 'paragraph',
        context: t.reader.paragraphOf(currentParagraph, totalParagraphs),
        label: paragraphText,
        stateText: `${isPlaying ? t.reader.nvdaPlaying : t.reader.nvdaPaused} · ${formatPlaybackRate(
          playbackRate,
          siteLanguage
        )}`,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        },
      });
    }
  }, [
    isActive,
    currentParagraph,
    activeChapter.id,
    activeChapter.paragraphs,
    totalParagraphs,
    isPlaying,
    playbackRate,
    siteLanguage,
    t,
  ]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const buildParagraphSnapshot = (
      paragraphEl: HTMLElement
    ): MagnifierSnapshot | null => {
      const numAttr = paragraphEl.getAttribute('data-paragraph-number');
      const pNum = numAttr ? parseInt(numAttr, 10) : currentParagraph;
      const rawText =
        activeChapter.paragraphs[pNum - 1] ||
        paragraphEl.querySelector('.reader-paragraph__text')?.textContent?.trim() ||
        paragraphEl.textContent?.trim() ||
        '';
      if (!rawText) return null;

      const rect = paragraphEl.getBoundingClientRect();
      return {
        kind: 'paragraph',
        context: t.reader.paragraphOf(pNum, totalParagraphs),
        label: rawText,
        stateText: `${
          pNum === currentParagraph
            ? isPlaying
              ? t.reader.nvdaPlaying
              : t.reader.nvdaPaused
            : labels.hintText
        } · ${formatPlaybackRate(playbackRate, siteLanguage)}`,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
        },
      };
    };

    const buildControlSnapshot = (el: HTMLElement): MagnifierSnapshot => {
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
        kind: 'control',
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

    const inspectTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-evaluator-hub="true"]')) return;

      const paragraphEl = target.closest<HTMLElement>('[data-paragraph-number]');
      if (paragraphEl) {
        const snap = buildParagraphSnapshot(paragraphEl);
        if (snap) setSnapshot(snap);
        return;
      }

      const controlEl = target.closest<HTMLElement>(
        'button, a, input, select, [role="region"], [role="button"], [role="switch"], [contenteditable="true"]'
      );
      if (controlEl) {
        // Ignora o próprio botão que acabou de ligar a lupa para mostrar o parágrafo atual logo de início
        if (controlEl.getAttribute('data-magnifier-toggle') === 'true') {
          return;
        }
        setSnapshot(buildControlSnapshot(controlEl));
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      inspectTarget(e.target);
    };

    const handleClick = (e: MouseEvent) => {
      inspectTarget(e.target);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const paragraphEl = target.closest<HTMLElement>('[data-paragraph-number]');
      if (paragraphEl) {
        const snap = buildParagraphSnapshot(paragraphEl);
        if (snap) setSnapshot(snap);
        return;
      }
      const inPlayerControl = target.closest<HTMLElement>(
        '#audio-player-region button, #audio-player-region input'
      );
      if (inPlayerControl) {
        setSnapshot(buildControlSnapshot(inPlayerControl));
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mouseover', handleMouseOver, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('mouseover', handleMouseOver, true);
    };
  }, [
    isActive,
    isPlaying,
    playbackRate,
    currentParagraph,
    activeChapter.id,
    activeChapter.paragraphs,
    totalParagraphs,
    siteLanguage,
    t,
    labels,
  ]);

  if (!isActive) return null;

  const isParagraphLens = snapshot?.kind === 'paragraph';
  const lensWidth = isParagraphLens ? 460 : 380;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const positionStyle: React.CSSProperties = {
    right: '20px',
    bottom: '88px',
  };

  if (snapshot && snapshot.kind === 'control') {
    delete positionStyle.right;
    delete positionStyle.bottom;
    const lensLeft = Math.max(
      16,
      Math.min(
        viewportWidth - lensWidth - 16,
        snapshot.rect.left + snapshot.rect.width / 2 - lensWidth / 2
      )
    );
    const isBottomHalf = snapshot.rect.top > viewportHeight * 0.52;

    if (isBottomHalf) {
      positionStyle.bottom = `${Math.max(82, viewportHeight - snapshot.rect.top + 12)}px`;
    } else {
      positionStyle.top = `${Math.min(
        viewportHeight - 160,
        Math.max(76, snapshot.rect.bottom + 12)
      )}px`;
    }
    positionStyle.left = `${lensLeft}px`;
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
        padding: '14px 18px',
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
          marginBottom: '8px',
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
            : t.reader.paragraphOf(currentParagraph, totalParagraphs)}
        </span>
      </div>

      <div
        style={{
          fontSize: isParagraphLens ? '24px' : '20px',
          fontWeight: isParagraphLens ? 600 : 700,
          lineHeight: isParagraphLens ? 1.42 : 1.25,
          wordBreak: 'break-word',
          maxHeight: '220px',
          overflow: 'hidden',
        }}
      >
        {snapshot
          ? snapshot.label
          : activeChapter.paragraphs[currentParagraph - 1] ||
            t.shared.magnifierWaiting}
      </div>

      <div
        style={{
          marginTop: '8px',
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--text-secondary)',
        }}
      >
        {snapshot?.stateText || labels.hintText}
      </div>
    </div>
  );
};
