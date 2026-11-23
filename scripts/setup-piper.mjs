#!/usr/bin/env node
/**
 * @fileoverview Verifica e instala o Piper TTS (voz neural offline) usado pelo endpoint `/api/tts`.
 *
 * - `npm run setup:tts`  → verifica e, se faltar algo, baixa o Piper e as vozes pt-BR e en-US para `.tts/`.
 * - `npm run check:tts`  → só verifica e explica como instalar (também roda antes do `npm run dev`).
 *
 * Funciona no Linux (x86_64 e ARM64) e no Windows (x64). No macOS o Piper não é instalado:
 * o protótipo usa a voz do navegador. Sem o Piper, nada quebra; a leitura usa a voz do navegador.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TTS_DIR = path.join(ROOT, '.tts');
const BIN_DIR = path.join(TTS_DIR, 'piper');
const MODELS_DIR = path.join(TTS_DIR, 'models');
const CACHE_DIR = path.join(TTS_DIR, 'cache');
const IS_WINDOWS = process.platform === 'win32';
const PIPER_BIN = path.join(BIN_DIR, IS_WINDOWS ? 'piper.exe' : 'piper');

const RELEASE = 'https://github.com/rhasspy/piper/releases/download/2023.11.14-2';
const ARCHIVES = {
  'linux-x64': 'piper_linux_x86_64.tar.gz',
  'linux-arm64': 'piper_linux_aarch64.tar.gz',
  'win32-x64': 'piper_windows_amd64.zip',
};
const VOICES = 'https://huggingface.co/rhasspy/piper-voices/resolve/main';
const MODELS = [
  `pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx`,
  `pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json`,
  `en/en_US/lessac/medium/en_US-lessac-medium.onnx`,
  `en/en_US/lessac/medium/en_US-lessac-medium.onnx.json`,
];

const log = (msg) => console.log(`[TTS] ${msg}`);
const modelPath = (rel) => path.join(MODELS_DIR, path.basename(rel));
const isFilled = (file) => fs.existsSync(file) && fs.statSync(file).size > 0;

/** Situação atual: binário presente e respondendo, e quais vozes faltam. */
function status() {
  let binaryOk = false;
  if (fs.existsSync(PIPER_BIN)) {
    const probe = spawnSync(PIPER_BIN, ['--version'], {
      timeout: 5000,
      stdio: 'ignore',
      env: { ...process.env, LD_LIBRARY_PATH: `${BIN_DIR}:${process.env.LD_LIBRARY_PATH ?? ''}` },
    });
    binaryOk = !probe.error && probe.status === 0;
  }
  const missingModels = MODELS.filter((rel) => !isFilled(modelPath(rel)));
  return { binaryOk, missingModels, ready: binaryOk && missingModels.length === 0 };
}

async function download(url, dest) {
  log(`Baixando ${path.basename(dest)}...`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`falha ao baixar ${url} (HTTP ${res.status})`);
  const tmp = `${dest}.part`;
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  fs.renameSync(tmp, dest);
}

/** Configs de voz mais novas trazem chaves com mais de um caractere que o Piper 2023.11.14-2 não aceita. */
function patchVoiceConfigs() {
  for (const file of fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith('.onnx.json'))) {
    const full = path.join(MODELS_DIR, file);
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    const map = data.phoneme_id_map ?? {};
    const bad = Object.keys(map).filter((k) => [...k].length !== 1);
    if (bad.length) {
      bad.forEach((k) => delete map[k]);
      fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
    }
  }
}

async function install() {
  const archive = ARCHIVES[`${process.platform}-${process.arch}`];
  if (!archive) {
    log(`O Piper não tem versão para este sistema (${process.platform}/${process.arch}).`);
    log('Sem problema: o protótipo usa a voz do navegador.');
    return;
  }
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (!status().binaryOk) {
    const archiveFile = path.join(TTS_DIR, archive);
    await download(`${RELEASE}/${archive}`, archiveFile);
    // `tar` existe no Linux e no Windows 10+ (o do Windows também abre .zip).
    const extract = spawnSync('tar', ['-xf', archiveFile, '-C', TTS_DIR], { stdio: 'inherit' });
    if (extract.error || extract.status !== 0) {
      throw new Error(`não foi possível extrair ${archive}. Extraia o arquivo manualmente em .tts/`);
    }
    fs.rmSync(archiveFile, { force: true });
    if (!IS_WINDOWS) fs.chmodSync(PIPER_BIN, 0o755);
  } else {
    log('Piper já instalado.');
  }

  for (const rel of MODELS) {
    if (isFilled(modelPath(rel))) log(`${path.basename(rel)} já presente.`);
    else await download(`${VOICES}/${rel}`, modelPath(rel));
  }
  patchVoiceConfigs();

  const result = status();
  if (!result.ready) throw new Error('o Piper foi baixado, mas não respondeu ao teste. Veja o README.');
  log('Pronto! Reinicie o `npm run dev` para o protótipo usar a voz neural.');
}

function printCheck() {
  const { ready, binaryOk, missingModels } = status();
  if (ready) {
    log('Piper instalado: a leitura em voz alta usa a voz neural offline.');
    return;
  }
  const faltando = [!binaryOk && 'programa Piper', missingModels.length && `${missingModels.length} arquivo(s) de voz`]
    .filter(Boolean)
    .join(' e ');
  log(`Piper não instalado (falta ${faltando}). A leitura usa a voz do navegador, e tudo funciona.`);
  if (ARCHIVES[`${process.platform}-${process.arch}`]) {
    log('Para instalar a voz neural (opcional, mais de 100 MB): npm run setup:tts');
  }
}

if (process.argv.includes('--check')) {
  printCheck();
} else {
  install().catch((err) => {
    console.error(`[TTS] Erro: ${err.message}`);
    console.error('[TTS] O protótipo continua funcionando com a voz do navegador.');
    process.exitCode = 1;
  });
}
