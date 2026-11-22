/**
 * @fileoverview Detecção do "modo celular real" do Cenário 4 (Sansão).
 * Num celular de verdade, as Telas 5 e 6 ocupam a tela inteira (sem a moldura 390 × 844),
 * o editor usa o teclado do próprio aparelho (inclusive o ditado por voz dele) e a barra
 * de formatação fica logo acima do teclado (`R19`, `R20`).
 *
 * Parâmetros de URL para forçar um modo:
 * - `?celular`: força o modo celular real (útil para testar no navegador do computador).
 * - `?simulador`: força a moldura simulada mesmo num celular.
 */
import { useEffect, useState } from 'react';

function detectPhoneDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('simulador')) return false;
  if (params.has('celular')) return true;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.screen.width, window.screen.height) <= 600;
  return coarsePointer && smallScreen;
}

/** `true` quando o protótipo está aberto num celular (ou com `?celular`). Fixo durante a sessão. */
export const IS_PHONE_DEVICE = detectPhoneDevice();

export interface VisualViewportBox {
  /** Altura visível em px (diminui quando o teclado virtual abre). */
  height: number;
  /** Deslocamento do topo visível em px (o iOS rola a página ao abrir o teclado). */
  offsetTop: number;
}

function readViewport(): VisualViewportBox {
  const vv = window.visualViewport;
  return vv
    ? { height: vv.height, offsetTop: vv.offsetTop }
    : { height: window.innerHeight, offsetTop: 0 };
}

/**
 * Acompanha a área realmente visível da tela. Com o teclado aberto, a altura encolhe,
 * e o layout em coluna mantém a barra de formatação logo acima do teclado (`R20`).
 */
export function useVisualViewport(enabled: boolean): VisualViewportBox | null {
  const [box, setBox] = useState<VisualViewportBox | null>(() =>
    enabled && typeof window !== 'undefined' ? readViewport() : null
  );

  useEffect(() => {
    if (!enabled) return;
    const update = () => setBox(readViewport());
    update();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled]);

  return box;
}
