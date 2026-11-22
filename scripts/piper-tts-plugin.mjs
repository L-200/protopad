/**
 * @fileoverview Plugin Vite para síntese neural local offline via Piper TTS.
 * Expõe `/api/tts` (POST JSON `{ text, lang }` -> `audio/wav`) e `/api/tts/status` (GET)
 * tanto em `npm run dev` quanto em `npm run preview`, com cache em disco `.tts/cache/*.wav`.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TTS_ROOT = path.resolve(__dirname, '..', '.tts');
const PIPER_BIN = path.join(TTS_ROOT, 'piper', 'piper');
const MODELS_DIR = path.join(TTS_ROOT, 'models');
const CACHE_DIR = path.join(TTS_ROOT, 'cache');

const MODEL_MAP = {
  'pt-BR': path.join(MODELS_DIR, 'pt_BR-faber-medium.onnx'),
  pt: path.join(MODELS_DIR, 'pt_BR-faber-medium.onnx'),
  'en-US': path.join(MODELS_DIR, 'en_US-lessac-medium.onnx'),
  en: path.join(MODELS_DIR, 'en_US-lessac-medium.onnx'),
};

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
    const tmpPath = `${outputPath}.${process.pid}.${Date.now()}.tmp.wav`;
    const binDir = path.dirname(PIPER_BIN);
    const child = spawn(
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

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (err) => {
      fs.rmSync(tmpPath, { force: true });
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0 && fs.existsSync(tmpPath) && fs.statSync(tmpPath).size > 44) {
        try {
          fs.renameSync(tmpPath, outputPath);
          resolve();
        } catch (err) {
          fs.rmSync(tmpPath, { force: true });
          reject(err);
        }
      } else {
        fs.rmSync(tmpPath, { force: true });
        reject(new Error(`Piper encerrou com código ${code}: ${stderr.trim()}`));
      }
    });

    child.stdin.write(`${text.trim()}\n`, 'utf8');
    child.stdin.end();
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

/** Cria o middleware HTTP compartilhado entre `vite dev` e `vite preview`. */
function createTtsMiddleware() {
  const inflight = new Map();

  return async (req, res, next) => {
    const urlPath = (req.url ?? '').split('?')[0];

    if (urlPath === '/api/tts/status' && req.method === 'GET') {
      const hasBin = fs.existsSync(PIPER_BIN);
      const hasPt = fs.existsSync(MODEL_MAP['pt-BR']);
      const hasEn = fs.existsSync(MODEL_MAP['en-US']);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          available: hasBin && hasPt,
          engine: 'piper-neural-local',
          voices: {
            'pt-BR': hasPt ? 'pt_BR-faber-medium' : null,
            'en-US': hasEn ? 'en_US-lessac-medium' : null,
          },
        })
      );
      return;
    }

    if (urlPath !== '/api/tts' || req.method !== 'POST') {
      next();
      return;
    }

    try {
      if (!fs.existsSync(PIPER_BIN)) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(
          JSON.stringify({
            error: 'Piper TTS local não instalado. Rode npm run setup:tts.',
          })
        );
        return;
      }

      const body = await readJsonBody(req);
      const text = String(body.text ?? '').trim();
      const lang = String(body.lang ?? 'pt-BR').trim();

      if (!text) {
        res.statusCode = 400;
        res.end('Texto vazio');
        return;
      }

      const modelPath = resolveModelPath(lang);
      if (!modelPath) {
        res.statusCode = 503;
        res.end('Modelo de voz ONNX não encontrado');
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

      const wavBuffer = fs.readFileSync(cachedWav);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(wavBuffer.length));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(wavBuffer);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          error: err instanceof Error ? err.message : 'Erro interno de TTS',
        })
      );
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
