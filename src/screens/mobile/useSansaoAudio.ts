/**
 * @fileoverview Hook de reprodução de áudio compartilhado pelas Telas 5 e 6 (Cenário 4).
 * Mantém sincronizados posição do parágrafo, estado `isPlaying` e velocidade global
 * (`R6`, ex.: `1,25x`) entre leitura e edição mobile, utilizando Web Speech API (`pt-BR`)
 * com fallback temporizado para ambientes sem vozes TTS instaladas.
 */
import { useCallback, useEffect, useRef } from 'react';
import { usePrototype } from '../../state/PrototypeContext';
import { MobileBlock, PlaybackRate } from '../../types/prototype';

const PLAYBACK_RATES: PlaybackRate[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

/**
 * Formata a velocidade de reprodução com vírgula decimal para exibição nos botões (`1,25x`).
 *
 * @param rate Velocidade numérica atual.
 * @returns Texto formatado com sufixo `x`.
 */
export function formatPlaybackRate(rate: PlaybackRate): string {
  if (Number.isInteger(rate)) {
    return `${rate},0x`;
  }
  return `${String(rate).replace('.', ',')}x`;
}

/**
 * Controla a narração por blocos do Cap. 9 no fluxo mobile.
 * Quando o editor mobile está em andamento, recebe `blocksOverride` para permitir
 * conferência de áudio ao vivo sem exigir salvamento prévio (`R19`).
 *
 * @param blocksOverride Lista opcional de blocos em rascunho usada durante a edição na Tela 6.
 * @returns Estado do player, percentual de progresso e ações de controle por toque.
 */
export function useSansaoAudio(blocksOverride?: MobileBlock[]) {
  const {
    sansaoChapter,
    playbackRate,
    setPlaybackRate,
    setSansaoPlayback,
  } = usePrototype();

  const blocks = blocksOverride ?? sansaoChapter.blocks;
  const totalParagraphs = Math.max(1, blocks.length);
  const currentParagraph = Math.max(
    1,
    Math.min(sansaoChapter.currentParagraph, totalParagraphs)
  );
  const isPlaying = sansaoChapter.isPlaying;

  const fallbackTimerRef = useRef<number | null>(null);
  const utteranceStartRef = useRef<number>(0);

  /** Cancela qualquer síntese de voz ativa e limpa o timer de fallback pendente. */
  const stopSpeechAndTimers = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignora ambientes sem suporte completo a speechSynthesis
      }
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      stopSpeechAndTimers();
      return;
    }

    const activeIndex = currentParagraph - 1;
    const block = blocks[activeIndex];
    if (!block) {
      setSansaoPlayback({ isPlaying: false });
      return;
    }

    stopSpeechAndTimers();

    const textToSpeak =
      block.isSeparator || block.text.trim() === '***'
        ? 'Transição de cena.'
        : block.text;
    const words = Math.max(2, textToSpeak.trim().split(/\s+/).length);
    const estimatedMs = block.isSeparator
      ? Math.max(900, Math.round(1300 / playbackRate))
      : Math.max(2000, Math.round(((words / 2.6) * 1000) / playbackRate));

    let advanced = false;
    const advanceNext = () => {
      if (advanced) return;
      advanced = true;
      if (currentParagraph < totalParagraphs) {
        setSansaoPlayback({ currentParagraph: currentParagraph + 1 });
      } else {
        setSansaoPlayback({ isPlaying: false });
      }
    };

    // Fallback temporizado garante avanço mesmo sem vozes TTS instaladas
    fallbackTimerRef.current = window.setTimeout(advanceNext, estimatedMs);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'pt-BR';
        utterance.rate = playbackRate;
        utteranceStartRef.current = Date.now();

        utterance.onend = () => {
          const elapsed = Date.now() - utteranceStartRef.current;
          // Se onend disparou instantaneamente por falta de voz local, mantém o fallback
          if (elapsed > 350) {
            if (fallbackTimerRef.current !== null) {
              window.clearTimeout(fallbackTimerRef.current);
              fallbackTimerRef.current = null;
            }
            advanceNext();
          }
        };

        utterance.onerror = () => {
          // Mantém o fallback temporizado ativo
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback temporizado já está agendado
      }
    }

    return () => {
      stopSpeechAndTimers();
    };
  }, [
    isPlaying,
    currentParagraph,
    totalParagraphs,
    playbackRate,
    blocks,
    setSansaoPlayback,
    stopSpeechAndTimers,
  ]);

  useEffect(() => {
    return () => {
      stopSpeechAndTimers();
    };
  }, [stopSpeechAndTimers]);

  const togglePlay = useCallback(() => {
    setSansaoPlayback({ isPlaying: !isPlaying });
  }, [isPlaying, setSansaoPlayback]);

  const prevParagraph = useCallback(() => {
    const target = Math.max(1, currentParagraph - 1);
    setSansaoPlayback({ currentParagraph: target });
  }, [currentParagraph, setSansaoPlayback]);

  const nextParagraph = useCallback(() => {
    const target = Math.min(totalParagraphs, currentParagraph + 1);
    setSansaoPlayback({ currentParagraph: target });
  }, [currentParagraph, totalParagraphs, setSansaoPlayback]);

  const cyclePlaybackRate = useCallback(() => {
    const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIdx = currentIdx === -1 ? 2 : (currentIdx + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIdx]);
  }, [playbackRate, setPlaybackRate]);

  return {
    isPlaying,
    currentParagraph,
    totalParagraphs,
    playbackRate,
    rateLabel: formatPlaybackRate(playbackRate),
    progressPercent: Math.round((currentParagraph / totalParagraphs) * 100),
    togglePlay,
    prevParagraph,
    nextParagraph,
    cyclePlaybackRate,
  };
}
