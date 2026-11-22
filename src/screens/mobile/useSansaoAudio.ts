/**
 * @fileoverview Hook de reprodução de áudio compartilhado pelas Telas 5 e 6 (Cenário 4).
 * Mantém sincronizados posição do parágrafo, estado `isPlaying` e velocidade global
 * (`R6`, ex.: `1,25x`) entre leitura e edição mobile, utilizando Web Speech API (`pt-BR`)
 * com fallback temporizado para ambientes sem vozes TTS instaladas.
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  prefetchParagraphAudio,
  speakParagraph,
  TtsPlaybackHandle,
} from '../../audio/ttsEngine';
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
 * Controla a narração por blocos do Cap. 9 no fluxo mobile usando o motor unificado
 * (Piper TTS neural local offline com fallback automático para Web Speech / timer).
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

  const ttsHandleRef = useRef<TtsPlaybackHandle | null>(null);
  const playbackRateRef = useRef<PlaybackRate>(playbackRate);
  playbackRateRef.current = playbackRate;

  /** Interrompe imediatamente qualquer áudio ou timer pendente. */
  const stopSpeechAndTimers = useCallback(() => {
    if (ttsHandleRef.current) {
      ttsHandleRef.current.stop();
      ttsHandleRef.current = null;
    }
  }, []);

  // Ajusta a velocidade ao vivo sem reiniciar o parágrafo atual
  useEffect(() => {
    ttsHandleRef.current?.setRate(playbackRate);
  }, [playbackRate]);

  // Pré-aquece o parágrafo atual no Piper local para início instantâneo ao tocar em Reproduzir
  useEffect(() => {
    const block = blocks[currentParagraph - 1];
    if (!block) return;
    const text =
      block.isSeparator || block.text.trim() === '***'
        ? 'Transição de cena.'
        : block.text;
    prefetchParagraphAudio(text, 'pt-BR');
  }, [blocks, currentParagraph]);

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
    const nextBlock = blocks[activeIndex + 1];
    const nextTextToSpeak = nextBlock
      ? nextBlock.isSeparator || nextBlock.text.trim() === '***'
        ? 'Transição de cena.'
        : nextBlock.text
      : undefined;

    ttsHandleRef.current = speakParagraph({
      text: textToSpeak,
      lang: 'pt-BR',
      rate: playbackRateRef.current,
      nextText: nextTextToSpeak,
      onEnded: () => {
        if (currentParagraph < totalParagraphs) {
          setSansaoPlayback({ currentParagraph: currentParagraph + 1 });
        } else {
          setSansaoPlayback({ isPlaying: false });
        }
      },
    });

    return () => {
      stopSpeechAndTimers();
    };
  }, [
    isPlaying,
    currentParagraph,
    totalParagraphs,
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
