/**
 * @fileoverview Motor unificado de leitura em voz alta (TTS) compartilhado entre o
 * Leitor Desktop (Tela 3) e o Leitor Mobile (Telas 5 e 6) — atende W10 (`R1`, `R6`, `R8`, `R21`).
 *
 * Correção crítica de persistência de voz neural no Firefox/Linux:
 * - Reutiliza um **único elemento `HTMLAudioElement` persistente (`sharedAudio`)** desbloqueado
 *   sincronamente no gesto de clique do usuário. Criar `new Audio()` dentro de callbacks
 *   assíncronos (`onended` após ~10s de leitura ou após `await fetch('/api/tts')`) faz o Firefox
 *   rejeitar `audio.play()` com `NotAllowedError` quando a ativação transiente expira (~5s),
 *   o que antes acionava o fallback `window.speechSynthesis` (`eSpeak-NG` robótico) a partir do
 *   3.º parágrafo.
 * - Quando o servidor local Piper (`/api/tts`) está ativo e retorna o WAV neural, o motor
 *   **nunca** invoca `window.speechSynthesis` (`eSpeak-NG`), mantendo 100% de consistência
 *   na voz neural em todos os parágrafos, capítulos e livros (`pt-BR` e `en-US`).
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
/**
 * Singleton `HTMLAudioElement` reutilizado entre todos os parágrafos, capítulos e histórias.
 * Reutilizar o mesmo elemento mantém a permissão de reprodução contínua no Firefox/Chrome
 * mesmo após dezenas de transições automáticas (`onended`) e awaits de rede.
 */
let sharedAudio: HTMLAudioElement | null = null;
/** Identificador incremental de sessão de fala para invalidar callbacks de parágrafos anteriores. */
let activeSessionId = 0;

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
 * Busca ou sintetiza um parágrafo no endpoint local `/api/tts` (Piper neural offline)
 * retornando uma ObjectURL pronta para `HTMLAudioElement`, ou `null` se indisponível.
 */
async function fetchLocalPiperAudioUrl(
  text: string,
  lang: string
): Promise<string | null> {
  const clean = text.trim();
  if (!clean) return null;

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
 * Seleciona a melhor voz disponível na Web Speech API (usada SOMENTE se o servidor
 * Piper local não estiver instalado), priorizando vozes neurais e penalizando `eSpeak`.
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
 * Inicia a reprodução em voz alta de um parágrafo utilizando o Piper neural local
 * através do elemento `<audio>` singleton persistente.
 */
export function speakParagraph(options: SpeakOptions): TtsPlaybackHandle {
  const { text, lang, rate, nextText, onEnded } = options;
  const sessionId = ++activeSessionId;
  let stopped = false;
  let fallbackTimer: number | null = null;
  let watchdogTimer: number | null = null;
  let safetyTimer: number | null = null;
  let currentRate = rate;

  const audioEl = getSharedAudio();

  // Interrompe imediatamente qualquer reprodução anterior no elemento singleton
  if (audioEl) {
    try {
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.pause();
    } catch {
      // Ignora erro ao pausar
    }
  }

  // Dispara o pré-carregamento do próximo parágrafo desde já em paralelo
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

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimers();

    if (audioEl && sessionId === activeSessionId) {
      try {
        audioEl.onended = null;
        audioEl.onerror = null;
        audioEl.pause();
      } catch {
        // Ignora erro ao pausar elemento de áudio
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

  const setRate = (nextRate: number) => {
    currentRate = nextRate;
    if (audioEl && isCurrentSession()) {
      audioEl.playbackRate = nextRate;
    }
  };

  const finishOnce = () => {
    if (!isCurrentSession()) return;
    stopped = true;
    clearTimers();
    onEnded();
  };

  const startTimedOnlyFallback = () => {
    if (!isCurrentSession()) return;
    const words = Math.max(4, text.trim().split(/\s+/).length);
    const baseMs = Math.min(5400, Math.max(2200, words * 165));
    const estimatedMs = Math.max(850, Math.round(baseMs / currentRate));
    fallbackTimer = window.setTimeout(finishOnce, estimatedMs);
  };

  const startBrowserSpeechFallback = () => {
    if (!isCurrentSession()) return;
    // Se o Piper local já está ativo nesta máquina, NUNCA cai no eSpeak robótico do navegador
    if (localPiperAvailable === true) {
      startTimedOnlyFallback();
      return;
    }

    const words = Math.max(4, text.trim().split(/\s+/).length);
    const baseMs = Math.min(5400, Math.max(2200, words * 165));
    const estimatedMs = Math.max(850, Math.round(baseMs / currentRate));

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
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = currentRate;
      const bestVoice = pickBestBrowserVoice(lang);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        if (!isCurrentSession()) return;
        speechStarted = true;
        if (watchdogTimer !== null) {
          window.clearTimeout(watchdogTimer);
          watchdogTimer = null;
        }
        safetyTimer = window.setTimeout(
          finishOnce,
          Math.max(12000, estimatedMs * 4)
        );
      };

      utterance.onend = () => {
        finishOnce();
      };

      utterance.onerror = () => {
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
          startFallbackTimer(Math.max(700, estimatedMs - 450));
        }
      }, 450);
    } catch {
      startFallbackTimer(estimatedMs);
    }
  };

  void (async () => {
    const audioUrl = await fetchLocalPiperAudioUrl(text, lang);
    if (!isCurrentSession()) return;

    if (!audioUrl || !audioEl) {
      startBrowserSpeechFallback();
      return;
    }

    try {
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.src = audioUrl;
      audioEl.currentTime = 0;
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
      // Reaplica playbackRate após play() pois alguns navegadores resetam playbackRate ao trocar src
      if (isCurrentSession()) {
        audioEl.playbackRate = currentRate;
      }
    } catch {
      if (isCurrentSession()) {
        // Se play() falhar momentaneamente, avança com timer sem invocar eSpeak
        startTimedOnlyFallback();
      }
    }
  })();

  return { stop, setRate };
}
