/**
 * @fileoverview Hook de reprodução de áudio compartilhado pelas Telas 5 e 6 (Cenário 4).
 * Mantém sincronizados posição do parágrafo, estado `isPlaying` e velocidade global
 * (`R6`, ex.: `1,25x`) entre leitura e edição mobile, utilizando o motor unificado
 * `ttsEngine` (Piper TTS neural local ou Web Speech API com pausa/retomada real e
 * atualização de velocidade em tempo real).
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  prefetchParagraphAudio,
  resetParagraphProgress,
  speakParagraph,
  TtsPlaybackHandle,
} from '../../audio/ttsEngine';
import { usePrototype } from '../../state/PrototypeContext';
import { MobileBlock, PlaybackRate, StoryLanguage } from '../../types/prototype';

const PLAYBACK_RATES: PlaybackRate[] = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

function storyLangToTtsLang(language: StoryLanguage): string {
  switch (language) {
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    default:
      return 'pt-BR';
  }
}

function separatorSpokenText(language: StoryLanguage): string {
  switch (language) {
    case 'en':
      return 'Scene break.';
    case 'es':
      return 'Cambio de escena.';
    default:
      return 'Transição de cena.';
  }
}

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
 * Controla a narração por blocos do capítulo mobile ativo usando o motor unificado
 * (Piper TTS neural local offline com fallback automático para Web Speech / timer).
 * Suporta pausa e retomada real no meio do parágrafo e ajuste de velocidade em tempo real.
 *
 * @param blocksOverride Lista opcional de blocos em rascunho usada durante a edição na Tela 6.
 * @returns Estado do player, percentual de progresso e ações de controle por toque.
 */
export function useSansaoAudio(blocksOverride?: MobileBlock[]) {
  const {
    sansaoChapter,
    activeMobileChapter,
    playbackRate,
    setPlaybackRate,
    setSansaoPlayback,
  } = usePrototype();

  const blocks = blocksOverride ?? activeMobileChapter.blocks;
  const ttsLang = storyLangToTtsLang(activeMobileChapter.language);
  const sepText = separatorSpokenText(activeMobileChapter.language);
  const totalParagraphs = Math.max(1, blocks.length);
  const currentParagraph = Math.max(
    1,
    Math.min(sansaoChapter.currentParagraph, totalParagraphs)
  );
  const isPlaying = sansaoChapter.isPlaying;

  const ttsHandleRef = useRef<TtsPlaybackHandle | null>(null);
  const playbackRateRef = useRef<PlaybackRate>(playbackRate);
  playbackRateRef.current = playbackRate;
  const prevParagraphRef = useRef<number>(currentParagraph);
  const prevChapterIdRef = useRef<string>(activeMobileChapter.id);

  // Ao trocar de parágrafo ou de capítulo, limpa o offset de pausa para que o novo trecho inicie do começo
  useEffect(() => {
    if (
      prevParagraphRef.current !== currentParagraph ||
      prevChapterIdRef.current !== activeMobileChapter.id
    ) {
      prevParagraphRef.current = currentParagraph;
      prevChapterIdRef.current = activeMobileChapter.id;
      resetParagraphProgress();
    }
  }, [currentParagraph, activeMobileChapter.id]);

  // Ajusta a velocidade ao vivo (tanto no Piper quanto na Web Speech API) sem reiniciar o parágrafo
  useEffect(() => {
    ttsHandleRef.current?.setRate(playbackRate);
  }, [playbackRate]);

  // Pré-aquece o parágrafo atual no Piper local para início instantâneo ao tocar em Reproduzir
  useEffect(() => {
    const block = blocks[currentParagraph - 1];
    if (!block) return;
    const text =
      block.isSeparator || block.text.trim() === '***' ? sepText : block.text;
    prefetchParagraphAudio(text, ttsLang);
  }, [blocks, currentParagraph, sepText, ttsLang]);

  useEffect(() => {
    if (!isPlaying) {
      if (ttsHandleRef.current) {
        // Pausa preservando o ponto exato do parágrafo atual
        ttsHandleRef.current.pause();
        ttsHandleRef.current = null;
      }
      return;
    }

    const activeIndex = currentParagraph - 1;
    const block = blocks[activeIndex];
    if (!block) {
      setSansaoPlayback({ isPlaying: false });
      return;
    }

    if (ttsHandleRef.current) {
      ttsHandleRef.current.stop();
      ttsHandleRef.current = null;
    }

    const textToSpeak =
      block.isSeparator || block.text.trim() === '***' ? sepText : block.text;
    const nextBlock = blocks[activeIndex + 1];
    const nextTextToSpeak = nextBlock
      ? nextBlock.isSeparator || nextBlock.text.trim() === '***'
        ? sepText
        : nextBlock.text
      : undefined;

    const handle = speakParagraph({
      text: textToSpeak,
      lang: ttsLang,
      rate: playbackRateRef.current,
      nextText: nextTextToSpeak,
      onEnded: () => {
        resetParagraphProgress();
        if (currentParagraph < totalParagraphs) {
          setSansaoPlayback({ currentParagraph: currentParagraph + 1 });
        } else {
          setSansaoPlayback({ isPlaying: false });
        }
      },
    });
    ttsHandleRef.current = handle;

    return () => {
      // No cleanup de mudança de estado, pause() preserva o ponto caso isPlaying tenha ido para false
      handle.pause();
      if (ttsHandleRef.current === handle) {
        ttsHandleRef.current = null;
      }
    };
  }, [
    isPlaying,
    currentParagraph,
    totalParagraphs,
    blocks,
    ttsLang,
    sepText,
    setSansaoPlayback,
  ]);

  useEffect(() => {
    return () => {
      if (ttsHandleRef.current) {
        ttsHandleRef.current.stop();
        ttsHandleRef.current = null;
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    setSansaoPlayback({ isPlaying: !isPlaying });
  }, [isPlaying, setSansaoPlayback]);

  const prevParagraph = useCallback(() => {
    resetParagraphProgress();
    const target = Math.max(1, currentParagraph - 1);
    setSansaoPlayback({ currentParagraph: target });
  }, [currentParagraph, setSansaoPlayback]);

  const nextParagraph = useCallback(() => {
    resetParagraphProgress();
    const target = Math.min(totalParagraphs, currentParagraph + 1);
    setSansaoPlayback({ currentParagraph: target });
  }, [currentParagraph, totalParagraphs, setSansaoPlayback]);

  const cyclePlaybackRate = useCallback(() => {
    const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIdx =
      currentIdx === -1 ? 2 : (currentIdx + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIdx]);
  }, [playbackRate, setPlaybackRate]);

  const progressPercent = Math.round(
    (currentParagraph / totalParagraphs) * 100
  );

  return {
    isPlaying,
    currentParagraph,
    totalParagraphs,
    playbackRate,
    progressPercent,
    togglePlay,
    prevParagraph,
    nextParagraph,
    cyclePlaybackRate,
  };
}
