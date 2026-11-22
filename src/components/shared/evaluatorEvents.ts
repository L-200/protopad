/**
 * @fileoverview Eventos globais disparados pelo painel do avaliador (`EvaluatorHub`).
 * Permitem simular hardware externo (como a tecla de mídia do headset, `R5`) sem
 * colocar controles de teste dentro da interface que o usuário vê.
 */

/** Simula um toque na tecla de mídia do headset (Reproduzir/Pausar) no leitor desktop. */
export const HEADSET_MEDIA_KEY_EVENT = 'tp2:headset-media-key';

/** Dispara o evento de tecla de mídia do headset. */
export function dispatchHeadsetMediaKey(): void {
  window.dispatchEvent(new Event(HEADSET_MEDIA_KEY_EVENT));
}
