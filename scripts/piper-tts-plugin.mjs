/**
 * @fileoverview Plugin Vite para síntese neural local offline via Piper TTS.
 * Expõe `/api/tts` (POST JSON `{ text, lang }` -> `audio/wav`) e `/api/tts/status` (GET)
 * tanto em `npm run dev` quanto em `npm run preview`, com cache em disco `.tts/cache/*.wav`.
 *
 * Proteções de estabilidade:
 * - Trata eventos `error` (`EPIPE` / `ERR_STREAM_DESTROYED`) em `child.stdin` para que
 *   uma falha do binário `piper` em máquinas incompatíveis nunca derrube o servidor Vite.
 * - Executa health-check único (`checkPiperBinaryHealth`) para validar se o binário e os
 *   modelos ONNX funcionam no SO/arquitetura atual antes de aceitar requisições de síntese.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TTS_ROOT = path.resolve(__dirname, '..', '.tts');
// No Windows o binário é `piper.exe` (instalado por `npm run setup:tts`).
const PIPER_BIN = path.join(TTS_ROOT, 'piper', process.platform === 'win32' ? 'piper.exe' : 'piper');
const MODELS_DIR = path.join(TTS_ROOT, 'models');
const CACHE_DIR = path.join(TTS_ROOT, 'cache');

const MODEL_MAP = {
  'pt-BR': path.join(MODELS_DIR, 'pt_BR-faber-medium.onnx'),
  pt: path.join(MODELS_DIR, 'pt_BR-faber-medium.onnx'),
  'en-US': path.join(MODELS_DIR, 'en_US-lessac-medium.onnx'),
  en: path.join(MODELS_DIR, 'en_US-lessac-medium.onnx'),
};

/** Cache do health-check do binário Piper (`null` = ainda não testado). */
let cachedBinaryHealthy = null;

/**
 * Verifica uma única vez se o binário `piper` existe, tem permissão de execução
 * e responde a `--version` no sistema operacional/arquitetura atual sem erro fatal.
 */
function checkPiperBinaryHealth() {
  if (cachedBinaryHealthy !== null) {
    return cachedBinaryHealthy;
  }
  try {
    if (!fs.existsSync(PIPER_BIN) || !fs.existsSync(MODEL_MAP['pt-BR'])) {
      cachedBinaryHealthy = false;
      return false;
    }
    const binDir = path.dirname(PIPER_BIN);
    const probe = spawnSync(PIPER_BIN, ['--version'], {
      timeout: 3000,
      stdio: 'ignore',
      env: {
        ...process.env,
        LD_LIBRARY_PATH: `${binDir}:${process.env.LD_LIBRARY_PATH ?? ''}`,
      },
    });
    cachedBinaryHealthy = !probe.error && probe.status === 0;
    return cachedBinaryHealthy;
  } catch {
    cachedBinaryHealthy = false;
    return false;
  }
}

/** Resolve o modelo ONNX correspondente ao idioma da história (fallback PT-BR). */
function resolveModelPath(lang) {
  const exact = MODEL_MAP[lang];
  if (exact && fs.existsSync(exact)) return exact;
  const short = String(lang || '').slice(0, 2).toLowerCase();
  const byShort = MODEL_MAP[short];
  if (byShort && fs.existsSync(byShort)) return byShort;
  const fallbackPt = MODEL_MAP['pt-BR'];
  return fs.existsSync(fallbackPt) ? fallbackPt : null;
}

/** Sintetiza o texto via binário Piper local gravando atomicamente em `outputPath`. */
function synthesizeWithPiper(text, modelPath, outputPath) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const safeResolve = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    const safeReject = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    const tmpPath = `${outputPath}.${process.pid}.${Date.now()}.tmp.wav`;
    const binDir = path.dirname(PIPER_BIN);

    let child;
    try {
      child = spawn(
        PIPER_BIN,
        [
          '--model',
          modelPath,
          '--espeak_data',
          path.join(binDir, 'espeak-ng-data'),
          '--output_file',
          tmpPath,
        ],
        {
          stdio: ['pipe', 'ignore', 'pipe'],
          env: {
            ...process.env,
            LD_LIBRARY_PATH: `${binDir}:${process.env.LD_LIBRARY_PATH ?? ''}`,
          },
        }
      );
    } catch (err) {
      fs.rmSync(tmpPath, { force: true });
      safeReject(err);
      return;
    }

    let stderr = '';
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.stderr.on('error', () => {
        // Ignora erro de stream de stderr
      });
    }

    // CRÍTICO: captura EPIPE/EOF em stdin caso o processo filho encerre prematuramente
    if (child.stdin) {
      child.stdin.on('error', () => {
        // O evento 'close' ou 'error' do processo tratará a falha sem derrubar o Vite
      });
    }

    child.on('error', (err) => {
      cachedBinaryHealthy = false;
      fs.rmSync(tmpPath, { force: true });
      safeReject(err);
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 44) {
        try {
          fs.renameSync(tmpPath, outputPath);
          safeResolve();
        } catch (err) {
          fs.rmSync(tmpPath, { force: true });
          safeReject(err);
        }
      } else {
        fs.rmSync(tmpPath, { force: true });
        safeReject(
          new Error(`Piper encerrou com código ${code}: ${stderr.trim()}`)
        );
      }
    });

    try {
      if (child.stdin && !child.stdin.destroyed && child.stdin.writable) {
        child.stdin.write(`${text.trim()}\n`, 'utf8');
        child.stdin.end();
      }
    } catch {
      // Capturado pelo listener de close/error
    }
  });
}

/** Lê corpo JSON de requisição HTTP (limite 16 KB). */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 16384) {
        reject(new Error('Payload muito grande'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/** Envia resposta JSON de forma segura verificando se os headers já foram enviados. */
function sendJsonSafe(res, statusCode, payload) {
  if (res.writableEnded) return;
  if (!res.headersSent) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  res.end(JSON.stringify(payload));
}

/** Cria o middleware HTTP compartilhado entre `vite dev` e `vite preview`. */
function createTtsMiddleware() {
  const inflight = new Map();

  return async (req, res, next) => {
    const urlPath = (req.url ?? '').split('?')[0];

    if (urlPath === '/api/tts/status' && req.method === 'GET') {
      const healthy = checkPiperBinaryHealth();
      const hasPt = healthy && fs.existsSync(MODEL_MAP['pt-BR']);
      const hasEn = healthy && fs.existsSync(MODEL_MAP['en-US']);
      sendJsonSafe(res, 200, {
        available: Boolean(healthy && hasPt),
        engine: healthy ? 'piper-neural-local' : 'web-speech-fallback',
        voices: {
          'pt-BR': hasPt ? 'pt_BR-faber-medium' : null,
          'en-US': hasEn ? 'en_US-lessac-medium' : null,
        },
      });
      return;
    }

    if (urlPath !== '/api/tts' || req.method !== 'POST') {
      next();
      return;
    }

    try {
      if (!checkPiperBinaryHealth()) {
        sendJsonSafe(res, 503, {
          error:
            'Piper TTS local indisponível neste ambiente. Usando fallback Web Speech API.',
        });
        return;
      }

      const body = await readJsonBody(req);
      const text = String(body.text ?? '').trim();
      const lang = String(body.lang ?? 'pt-BR').trim();

      if (!text) {
        sendJsonSafe(res, 400, { error: 'Texto vazio' });
        return;
      }

      const modelPath = resolveModelPath(lang);
      if (!modelPath) {
        sendJsonSafe(res, 503, { error: 'Modelo de voz ONNX não encontrado' });
        return;
      }

      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const hash = createHash('sha256')
        .update(`${path.basename(modelPath)}::${text}`)
        .digest('hex')
        .slice(0, 24);
      const cachedWav = path.join(CACHE_DIR, `${hash}.wav`);

      if (!fs.existsSync(cachedWav)) {
        let pending = inflight.get(hash);
        if (!pending) {
          pending = synthesizeWithPiper(text, modelPath, cachedWav).finally(() => {
            inflight.delete(hash);
          });
          inflight.set(hash, pending);
        }
        await pending;
      }

      if (res.writableEnded) return;
      const wavBuffer = fs.readFileSync(cachedWav);
      if (!res.headersSent) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', String(wavBuffer.length));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      res.end(wavBuffer);
    } catch (err) {
      sendJsonSafe(res, 500, {
        error: err instanceof Error ? err.message : 'Erro interno de TTS',
      });
    }
  };
}

/**
 * Plugin Vite que serve os endpoints locais `/api/tts` e `/api/tts/status`
 * durante `npm run dev` e `npm run preview`.
 */
export function piperTtsPlugin() {
  const middleware = createTtsMiddleware();
  return {
    name: 'wattpad-local-piper-tts',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
