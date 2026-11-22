/**
 * @fileoverview Motor unificado de leitura em voz alta (TTS) compartilhado entre o
 * Leitor Desktop (Tela 3) e o Leitor Mobile (Telas 5 e 6) — atende W10 (`R1`, `R6`, `R8`, `R21`).
 *
 * Estratégia em camadas para qualidade de voz máxima sem nunca travar a demonstração:
 * 1. **Piper TTS Neural Local (`/api/tts`)**: sintetiza áudio WAV humano 100% offline em
 *    `pt-BR` (`pt_BR-faber-medium`) e `en-US` (`en_US-lessac-medium`), com cache em memória
 *    (ObjectURL), pré-carregamento do próximo parágrafo e ajuste dinâmico de `playbackRate`
 *    em tempo real sem reiniciar a frase.
 * 2. **Fallback Web Speech API ranqueada**: se o servidor Piper não estiver disponível,
 *    prioriza vozes neurais/naturais do navegador (`Natural`, `Neural`, `Google`, `Francisca`,
 *    `Luciana`, `Antonio`) em vez de sintetizadores robóticos (`eSpeak`).
 * 3. **Fallback temporizado silencioso**: garante o avanço contínuo dos parágrafos mesmo
 *    em ambientes sem nenhuma saída de áudio configurada.
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
  /** Interrompe imediatamente áudio, requisições em andamento e timers associados. */
  stop: () => void;
  /** Atualiza a velocidade de reprodução em tempo real sem reiniciar o parágrafo atual. */
  setRate: (rate: number) => void;
}

/** Cache em memória de ObjectURLs (WAV já sintetizados nesta sessão). */
const memoryAudioCache = new Map<string, string>();
/** Cache de promessas em andamento para evitar chamadas duplicadas ao Piper. */
const inflightRequests = new Map<string, Promise<string | null>>();
/** Flag de disponibilidade do endpoint local `/api/tts` (`null` = ainda não verificado). */
let localPiperAvailable: boolean | null = null;

function buildCacheKey(lang: string, text: string): string {
  return `${lang}::${text.trim()}`;
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
  if (localPiperAvailable === false) return null;

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
export function prefetchParagraphAudio(text: string | undefined, lang: string): void {
  if (!text || !text.trim() || localPiperAvailable === false) return;
  void fetchLocalPiperAudioUrl(text, lang);
}

/**
 * Seleciona a melhor voz disponível na Web Speech API (fallback quando Piper não está ativo),
 * dando forte preferência a vozes neurais/naturais e penalizando `eSpeak`.
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
 * Inicia a reprodução em voz alta de um parágrafo utilizando Piper neural local
 * com fallback automático para Web Speech API ranqueada e temporizador seguro.
 *
 * @param options Texto, idioma da história, velocidade, próximo parágrafo e callback de término.
 * @returns Controle para pausar/interromper e ajustar `playbackRate` ao vivo.
 */
export function speakParagraph(options: SpeakOptions): TtsPlaybackHandle {
  const { text, lang, rate, nextText, onEnded } = options;
  let stopped = false;
  let activeAudio: HTMLAudioElement | null = null;
  let fallbackTimer: number | null = null;
  let watchdogTimer: number | null = null;
  let safetyTimer: number | null = null;
  let currentRate = rate;

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

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimers();

    if (activeAudio) {
      try {
        activeAudio.onended = null;
        activeAudio.onerror = null;
        activeAudio.pause();
        activeAudio.src = '';
      } catch {
        // Ignora erro ao encerrar elemento de áudio
      }
      activeAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignora erro de cancelamento
      }
    }
  };

  const setRate = (nextRate: number) => {
    currentRate = nextRate;
    if (activeAudio) {
      activeAudio.playbackRate = nextRate;
    }
  };

  const finishOnce = () => {
    if (stopped) return;
    stopped = true;
    clearTimers();
    onEnded();
  };

  const startTimedAndSpeechFallback = () => {
    if (stopped) return;
    const words = Math.max(4, text.trim().split(/\s+/).length);
    const baseMs = Math.min(5400, Math.max(2200, words * 165));
    const estimatedMs = Math.max(850, Math.round(baseMs / currentRate));

    const startFallbackTimer = (delayMs: number) => {
      if (stopped || fallbackTimer !== null) return;
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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = currentRate;
      const bestVoice = pickBestBrowserVoice(lang);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        if (stopped) return;
        speechStarted = true;
        if (watchdogTimer !== null) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        safetyTimer = window.setTimeout(finishOnce, Math.max(12000, estimatedMs * 4));
      };

      utterance.onend = () => {
        if (stopped) return;
        finishOnce();
      };

      utterance.onerror = () => {
        if (stopped) return;
        startFallbackTimer(estimatedMs);
      };

      window.speechSynthesis.speak(utterance);

      watchdogTimer = window.setTimeout(() => {
        if (!stopped && !speechStarted) {
          try {
            window.speechSynthesis.cancel();
          } catch {
            // Ignora erro
          }
          startFallbackTimer(Math.max(700, estimatedMs - 450));
        }
      }, 450);
    } catch {
      startFallbackTimer(estimatedMs);
    }
  };

  // Executa síntese neural local primeiro; só usa fallback se indisponível
  void (async () => {
    const audioUrl = await fetchLocalPiperAudioUrl(text, lang);
    if (stopped) return;

    if (!audioUrl) {
      startTimedAndSpeechFallback();
      return;
    }

    // Pré-aquece o próximo parágrafo enquanto este toca
    if (nextText) {
      prefetchParagraphAudio(nextText, lang);
    }

    try {
      const audio = new Audio(audioUrl);
      activeAudio = audio;
      audio.playbackRate = currentRate;
      // Preserva o timbre natural da voz ao acelerar para 1,25x / 1,75x
      if ('preservesPitch' in audio) {
        audio.preservesPitch = true;
      }

      audio.onended = () => {
        finishOnce();
      };

      audio.onerror = () => {
        if (stopped) return;
        activeAudio = null;
        startTimedAndSpeechFallback();
      };

      await audio.play();
    } catch {
      if (!stopped) {
        activeAudio = null;
        startTimedAndSpeechFallback();
      }
    }
  })();

  return { stop, setRate };
}
