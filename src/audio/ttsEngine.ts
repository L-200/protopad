/**
 * @fileoverview Motor unificado de leitura em voz alta (TTS) compartilhado entre o
 * Leitor Desktop (Tela 3) e o Leitor Mobile (Telas 5 e 6) — atende W10 (`R1`, `R6`, `R8`, `R21`).
 *
 * Funcionalidades principais:
 * 1. **Piper TTS Neural Local (`/api/tts`)**: utiliza um elemento `<audio>` singleton
 *    persistente (`sharedAudio`) com verificação prévia silenciosa em `/api/tts/status`.
 * 2. **Pausa e Retomada Real (`pause()` vs `stop()` + `resetParagraphProgress()`)**:
 *    - No Piper (`HTMLAudioElement`), `pause()` preserva `audioEl.currentTime` e retoma
 *      exatamente do ponto pausado quando `speakParagraph` é chamado para o mesmo parágrafo.
 *    - Na Web Speech API (`speechSynthesis`), rastreia o offset da palavra atual via
 *      `utterance.onboundary` + estimador temporal contínuo, retomando a leitura a partir
 *      da palavra onde foi pausada (`text.slice(charIndex)`).
 * 3. **Atualização de Velocidade em Tempo Real (`setRate(nextRate)`)**:
 *    - No Piper, atualiza `audioEl.playbackRate` instantaneamente.
 *    - Na Web Speech API, reinicia a utterance imediatamente a partir da palavra atual
 *      (`currentCharIndex`) com a nova velocidade `nextRate`, sem reiniciar o parágrafo
 *      e sem exigir pausar/reproduzir manualmente.
 */

export interface SpeakOptions {
  /** Texto do parágrafo a ser narrado. */
  text: string;
  /** Código BCP-47 do idioma da história (`pt-BR`, `en-US` ou `es-ES`). */
  lang: string;
  /** Velocidade inicial de reprodução (`0.75` a `2.0`). */
  rate: number;
  /** Texto opcional do próximo parágrafo para pré-síntese silenciosa em segundo plano. */
  nextText?: string;
  /** Callback acionado ao terminar a leitura natural do parágrafo (usado para avançar). */
  onEnded: () => void;
}

export interface TtsPlaybackHandle {
  /** Pausa a leitura preservando a posição exata dentro do parágrafo atual para retomada. */
  pause: () => void;
  /** Interrompe completamente a leitura e zera o progresso do parágrafo atual. */
  stop: () => void;
  /** Atualiza a velocidade de reprodução em tempo real (no Piper e na Web Speech API). */
  setRate: (rate: number) => void;
}

/** Estado salvo de pausa dentro do parágrafo atual. */
interface PausedParagraphState {
  key: string;
  /** Posição em segundos no HTMLAudioElement (quando usando Piper). */
  audioTime: number;
  /** Índice de caractere alinhado a palavra no texto (quando usando Web Speech API). */
  charIndex: number;
}

/** Cache em memória de ObjectURLs (WAV já sintetizados nesta sessão). */
const memoryAudioCache = new Map<string, string>();
/** Cache de promessas em andamento para evitar chamadas duplicadas ao Piper. */
const inflightRequests = new Map<string, Promise<string | null>>();
/** Flag de disponibilidade do endpoint local `/api/tts` (`null` = ainda não verificado). */
let localPiperAvailable: boolean | null = null;
/** Promessa única de sondagem de `/api/tts/status` para evitar POSTs 503 em máquinas sem Piper. */
let statusProbePromise: Promise<boolean> | null = null;
/** Singleton `HTMLAudioElement` reutilizado entre todos os parágrafos, capítulos e histórias. */
let sharedAudio: HTMLAudioElement | null = null;
/** Identificador incremental de sessão de fala para invalidar callbacks antigos. */
let activeSessionId = 0;
/** Progresso pausado do parágrafo atual para retomada exata. */
let pausedState: PausedParagraphState | null = null;

function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null;
  }
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

function buildCacheKey(lang: string, text: string): string {
  return `${lang}::${text.trim()}`;
}

/**
 * Zera qualquer posição de pausa salva, garantindo que o próximo parágrafo
 * (ou parágrafo selecionado manualmente) comece do início.
 */
export function resetParagraphProgress(): void {
  pausedState = null;
  if (sharedAudio) {
    try {
      sharedAudio.currentTime = 0;
    } catch {
      // Ignora caso src ainda não esteja carregado
    }
  }
}

/**
 * Consulta `/api/tts/status` uma única vez para descobrir silenciosamente se o
 * motor Piper local está disponível e funcional na máquina atual.
 */
async function checkLocalPiperStatus(): Promise<boolean> {
  if (localPiperAvailable !== null) {
    return localPiperAvailable;
  }
  if (statusProbePromise) {
    return statusProbePromise;
  }
  statusProbePromise = (async () => {
    try {
      const res = await fetch('/api/tts/status', { method: 'GET' });
      if (!res.ok) {
        localPiperAvailable = false;
        return false;
      }
      const data = (await res.json()) as { available?: boolean };
      localPiperAvailable = Boolean(data?.available);
      return localPiperAvailable;
    } catch {
      localPiperAvailable = false;
      return false;
    } finally {
      statusProbePromise = null;
    }
  })();
  return statusProbePromise;
}

/**
 * Busca ou sintetiza um parágrafo no endpoint local `/api/tts` (Piper neural offline)
 * retornando uma ObjectURL pronta para `HTMLAudioElement`, ou `null` se indisponível.
 */
async function fetchLocalPiperAudioUrl(
  text: string,
  lang: string
): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return null;

  const isAvailable = await checkLocalPiperStatus();
  if (!isAvailable) return null;

  const key = buildCacheKey(lang, clean);
  const cached = memoryAudioCache.get(key);
  if (cached) return cached;

  const existing = inflightRequests.get(key);
  if (existing) return existing;

  const requestPromise = (async () => {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, lang }),
      });

      if (response.status === 503 || response.status === 404) {
        localPiperAvailable = false;
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('audio')) {
        return null;
      }

      const blob = await response.blob();
      if (blob.size <= 44) {
        return null;
      }

      localPiperAvailable = true;
      const objectUrl = URL.createObjectURL(blob);
      memoryAudioCache.set(key, objectUrl);
      return objectUrl;
    } catch {
      return null;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, requestPromise);
  return requestPromise;
}

/**
 * Dispara a pré-síntese silenciosa de um parágrafo futuro no servidor Piper local
 * para eliminar latência na transição contínua de parágrafos.
 */
export function prefetchParagraphAudio(
  text: string | undefined,
  lang: string
): void {
  if (!text || !text.trim() || localPiperAvailable === false) return;
  void fetchLocalPiperAudioUrl(text, lang);
}

/**
 * Ajusta um índice de caractere para o início da palavra atual ou próxima,
 * evitando cortar palavras ao meio na retomada ou troca de velocidade na Web Speech API.
 */
function snapToWordStart(text: string, rawIndex: number): number {
  const clamped = Math.max(0, Math.min(rawIndex, text.length));
  if (clamped <= 0) return 0;
  if (clamped >= text.length) return text.length;
  // Recua até o espaço anterior para não cortar a palavra ao meio
  let idx = clamped;
  while (idx > 0 && !/\s/.test(text[idx - 1])) {
    idx--;
  }
  return idx;
}

/**
 * Seleciona a melhor voz disponível na Web Speech API (usada quando o servidor
 * Piper local não está instalado), priorizando vozes neurais e penalizando `eSpeak`.
 */
function pickBestBrowserVoice(lang: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return undefined;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  const targetLower = lang.toLowerCase();
  const shortLang = targetLower.slice(0, 2);

  const candidates = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(shortLang)
  );
  if (!candidates.length) return undefined;

  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    const name = voice.name.toLowerCase();
    const vLang = voice.lang.toLowerCase();
    let score = 0;

    if (vLang === targetLower) score += 40;
    if (name.includes('natural') || name.includes('neural')) score += 100;
    if (name.includes('google')) score += 70;
    if (
      name.includes('francisca') ||
      name.includes('thalita') ||
      name.includes('antonio') ||
      name.includes('luciana') ||
      name.includes('jenny') ||
      name.includes('aria')
    ) {
      score += 65;
    }
    if (name.includes('microsoft') || name.includes('apple')) score += 30;
    if (name.includes('espeak') || name.includes('mbrola')) score -= 80;
    return score;
  };

  return [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

/**
 * Inicia ou retoma a reprodução em voz alta de um parágrafo utilizando o Piper neural local
 * (com fallback para Web Speech API ranqueada), suportando pausa/retomada exata e
 * atualização de velocidade em tempo real em ambos os motores.
 */
export function speakParagraph(options: SpeakOptions): TtsPlaybackHandle {
  const { text, lang, rate, nextText, onEnded } = options;
  const cleanText = text.trim();
  const paragraphKey = buildCacheKey(lang, cleanText);
  const sessionId = ++activeSessionId;

  let stopped = false;
  let usingWebSpeech = false;
  let fallbackTimer: number | null = null;
  let watchdogTimer: number | null = null;
  let safetyTimer: number | null = null;
  let currentRate = rate;

  // Recupera progresso pausado se estivermos retomando exatamente o mesmo parágrafo
  const initialPaused =
    pausedState && pausedState.key === paragraphKey ? pausedState : null;
  pausedState = null;

  let currentCharOffset = initialPaused ? initialPaused.charIndex : 0;
  let segmentStartCharOffset = currentCharOffset;
  let segmentStartTimestamp = Date.now();
  // Taxa média de leitura (~14.5 caracteres/segundo em 1.0x) para estimar posição caso onboundary não dispare
  const BASE_CHARS_PER_SEC = 14.5;

  const audioEl = getSharedAudio();

  if (audioEl) {
    try {
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.pause();
    } catch {
      // Ignora erro ao pausar
    }
  }

  if (nextText) {
    prefetchParagraphAudio(nextText, lang);
  }

  const isCurrentSession = () => !stopped && sessionId === activeSessionId;

  const clearTimers = () => {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    if (watchdogTimer !== null) {
      window.clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
    if (safetyTimer !== null) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  };

  /** Calcula o índice de caractere atual combinando `onboundary` com estimativa por tempo decorrido. */
  const estimateCurrentCharOffset = (): number => {
    const elapsedSec = Math.max(0, (Date.now() - segmentStartTimestamp) / 1000);
    const estimatedAdvance = Math.floor(
      elapsedSec * BASE_CHARS_PER_SEC * currentRate
    );
    const timeBasedOffset = Math.min(
      cleanText.length - 1,
      segmentStartCharOffset + estimatedAdvance
    );
    // Usa o maior entre o último onboundary confirmado e a estimativa temporal
    const raw = Math.max(currentCharOffset, timeBasedOffset);
    return snapToWordStart(cleanText, raw);
  };

  const pause = () => {
    if (stopped) return;
    stopped = true;
    clearTimers();

    if (usingWebSpeech) {
      const savedChar = estimateCurrentCharOffset();
      pausedState = {
        key: paragraphKey,
        audioTime: 0,
        charIndex: savedChar < cleanText.length - 3 ? savedChar : 0,
      };
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignora erro
        }
      }
      return;
    }

    if (audioEl && sessionId === activeSessionId) {
      try {
        const currentTime = audioEl.currentTime || 0;
        const duration = audioEl.duration || 0;
        audioEl.onended = null;
        audioEl.onerror = null;
        audioEl.pause();
        pausedState = {
          key: paragraphKey,
          audioTime:
            duration > 0 && currentTime >= duration - 0.15 ? 0 : currentTime,
          charIndex: 0,
        };
      } catch {
        // Ignora erro
      }
    }
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimers();
    pausedState = null;

    if (audioEl && sessionId === activeSessionId) {
      try {
        audioEl.onended = null;
        audioEl.onerror = null;
        audioEl.pause();
        audioEl.currentTime = 0;
      } catch {
        // Ignora erro ao parar elemento de áudio
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignora erro de cancelamento
      }
    }
  };

  const finishOnce = () => {
    if (!isCurrentSession()) return;
    stopped = true;
    clearTimers();
    pausedState = null;
    onEnded();
  };

  const startTimedOnlyFallback = (fromCharOffset = 0) => {
    if (!isCurrentSession()) return;
    clearTimers();
    const remainingText = cleanText.slice(fromCharOffset).trim() || cleanText;
    const words = Math.max(2, remainingText.split(/\s+/).length);
    const baseMs = Math.min(5400, Math.max(1400, words * 165));
    const estimatedMs = Math.max(600, Math.round(baseMs / currentRate));
    fallbackTimer = window.setTimeout(finishOnce, estimatedMs);
  };

  /**
   * Inicia ou reinicia a fala via Web Speech API a partir de `fromCharOffset`,
   * permitindo tanto retomar após pausa quanto atualizar a velocidade em tempo real.
   */
  const speakWebSpeechFromOffset = (fromCharOffset: number) => {
    if (!isCurrentSession()) return;
    clearTimers();

    if (localPiperAvailable === true) {
      startTimedOnlyFallback(fromCharOffset);
      return;
    }

    usingWebSpeech = true;
    const safeOffset = snapToWordStart(cleanText, fromCharOffset);
    const remainingText = cleanText.slice(safeOffset).trim();
    if (!remainingText) {
      finishOnce();
      return;
    }

    currentCharOffset = safeOffset;
    segmentStartCharOffset = safeOffset;
    segmentStartTimestamp = Date.now();

    const words = Math.max(2, remainingText.split(/\s+/).length);
    const baseMs = Math.min(5400, Math.max(1500, words * 165));
    const estimatedMs = Math.max(650, Math.round(baseMs / currentRate));

    const startFallbackTimer = (delayMs: number) => {
      if (!isCurrentSession() || fallbackTimer !== null) return;
      fallbackTimer = window.setTimeout(finishOnce, delayMs);
    };

    const hasSpeechApi =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined';

    if (!hasSpeechApi) {
      startFallbackTimer(estimatedMs);
      return;
    }

    let speechStarted = false;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(remainingText);
      utterance.lang = lang;
      utterance.rate = currentRate;
      const bestVoice = pickBestBrowserVoice(lang);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        if (!isCurrentSession()) return;
        speechStarted = true;
        segmentStartTimestamp = Date.now();
        if (watchdogTimer !== null) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        safetyTimer = window.setTimeout(
          finishOnce,
          Math.max(12000, estimatedMs * 4)
        );
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (!isCurrentSession()) return;
        if (typeof event.charIndex === 'number' && event.charIndex >= 0) {
          currentCharOffset = Math.min(
            cleanText.length,
            safeOffset + event.charIndex
          );
        }
      };

      utterance.onend = () => {
        if (!isCurrentSession()) return;
        finishOnce();
      };

      utterance.onerror = () => {
        if (!isCurrentSession()) return;
        startFallbackTimer(estimatedMs);
      };

      window.speechSynthesis.speak(utterance);

      watchdogTimer = window.setTimeout(() => {
        if (isCurrentSession() && !speechStarted) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // Ignora erro
          }
          startFallbackTimer(Math.max(600, estimatedMs - 450));
        }
      }, 450);
    } catch {
      startFallbackTimer(estimatedMs);
    }
  };

  const setRate = (nextRate: number) => {
    if (nextRate === currentRate) return;
    currentRate = nextRate;
    if (!isCurrentSession()) return;

    if (usingWebSpeech) {
      // Na Web Speech API, reinicia imediatamente da palavra atual com a nova velocidade
      const resumeOffset = estimateCurrentCharOffset();
      speakWebSpeechFromOffset(resumeOffset);
      return;
    }

    if (audioEl) {
      audioEl.playbackRate = nextRate;
    }
  };

  void (async () => {
    const audioUrl = await fetchLocalPiperAudioUrl(cleanText, lang);
    if (!isCurrentSession()) return;

    if (!audioUrl || !audioEl) {
      speakWebSpeechFromOffset(currentCharOffset);
      return;
    }

    try {
      usingWebSpeech = false;
      audioEl.onended = null;
      audioEl.onerror = null;

      if (audioEl.src !== audioUrl) {
        audioEl.src = audioUrl;
      }

      const resumeTime = initialPaused ? initialPaused.audioTime : 0;
      if (resumeTime > 0) {
        try {
          audioEl.currentTime = resumeTime;
        } catch {
          // Caso metadata ainda não esteja pronta, ajusta em loadedmetadata
          audioEl.addEventListener(
            'loadedmetadata',
            () => {
              try {
                if (isCurrentSession() && resumeTime < (audioEl.duration || Infinity)) {
                  audioEl.currentTime = resumeTime;
                }
              } catch {
                // Ignora erro
              }
            },
            { once: true }
          );
        }
      } else {
        audioEl.currentTime = 0;
      }

      audioEl.playbackRate = currentRate;
      if ('preservesPitch' in audioEl) {
        audioEl.preservesPitch = true;
      }

      audioEl.onended = () => {
        finishOnce();
      };

      audioEl.onerror = () => {
        if (!isCurrentSession()) return;
        startTimedOnlyFallback();
      };

      await audioEl.play();
      if (isCurrentSession()) {
        audioEl.playbackRate = currentRate;
      }
    } catch {
      if (isCurrentSession()) {
        startTimedOnlyFallback();
      }
    }
  })();

  return { pause, stop, setRate };
}
