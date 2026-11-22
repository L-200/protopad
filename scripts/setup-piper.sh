#!/usr/bin/env bash
set -euo pipefail

# Instala localmente o motor neural offline Piper TTS (Linux x86_64)
# e os modelos de voz pt_BR-faber-medium e en_US-lessac-medium em prototipo/app/.tts/

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TTS_DIR="$APP_DIR/.tts"
BIN_DIR="$TTS_DIR/piper"
MODELS_DIR="$TTS_DIR/models"
CACHE_DIR="$TTS_DIR/cache"

mkdir -p "$TTS_DIR" "$MODELS_DIR" "$CACHE_DIR"

PIPER_URL="https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz"
PT_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium"
EN_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium"

if [ ! -x "$BIN_DIR/piper" ]; then
  echo "[TTS] Baixando binário Piper TTS (Linux x86_64)..."
  curl -fL --progress-bar "$PIPER_URL" -o "$TTS_DIR/piper.tar.gz"
  tar -xzf "$TTS_DIR/piper.tar.gz" -C "$TTS_DIR"
  rm -f "$TTS_DIR/piper.tar.gz"
  chmod +x "$BIN_DIR/piper"
  echo "[TTS] Piper instalado em $BIN_DIR/piper"
else
  echo "[TTS] Binário Piper já instalado."
fi

download_if_missing() {
  local url="$1"
  local dest="$2"
  if [ ! -s "$dest" ]; then
    echo "[TTS] Baixando $(basename "$dest")..."
    curl -fL --progress-bar "$url" -o "$dest"
  else
    echo "[TTS] Modelo $(basename "$dest") já presente."
  fi
}

download_if_missing "$PT_BASE/pt_BR-faber-medium.onnx" "$MODELS_DIR/pt_BR-faber-medium.onnx"
download_if_missing "$PT_BASE/pt_BR-faber-medium.onnx.json" "$MODELS_DIR/pt_BR-faber-medium.onnx.json"
download_if_missing "$EN_BASE/en_US-lessac-medium.onnx" "$MODELS_DIR/en_US-lessac-medium.onnx"
download_if_missing "$EN_BASE/en_US-lessac-medium.onnx.json" "$MODELS_DIR/en_US-lessac-medium.onnx.json"

# Compatibiliza phoneme_id_map de configs mais recentes com Piper C++ 2023.11.14-2 (somente codepoints únicos)
python3 - "$MODELS_DIR" <<'PY'
import json, pathlib, sys
models_dir = pathlib.Path(sys.argv[1])
for cfg in models_dir.glob("*.onnx.json"):
    data = json.loads(cfg.read_text(encoding="utf-8"))
    pmap = data.get("phoneme_id_map", {})
    bad = [k for k in pmap if len(k) != 1]
    if bad:
        for k in bad:
            del pmap[k]
        cfg.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
PY

echo "[TTS] Setup concluído! Testando síntese local..."
echo "Olá! Leitura neural local configurada com sucesso." | \
  LD_LIBRARY_PATH="$BIN_DIR:${LD_LIBRARY_PATH:-}" \
  "$BIN_DIR/piper" \
  --model "$MODELS_DIR/pt_BR-faber-medium.onnx" \
  --espeak_data "$BIN_DIR/espeak-ng-data" \
  --output_file "$CACHE_DIR/_selftest.wav" >/dev/null 2>&1

if [ -s "$CACHE_DIR/_selftest.wav" ]; then
  SIZE=$(wc -c < "$CACHE_DIR/_selftest.wav")
  rm -f "$CACHE_DIR/_selftest.wav"
  echo "[TTS] Teste OK! Áudio WAV gerado (${SIZE} bytes)."
else
  echo "[TTS] ERRO: Falha ao gerar áudio de teste." >&2
  exit 1
fi
