#!/usr/bin/env bash
# تجهيز أدوات الفيديو بأي جلسة جديدة (بيشتغل لحاله من SessionStart، وآمن تعيده).
# usage: bash scripts/video-setup.sh [--full]   (--full = كمان نماذج reverse-video الثقيلة ~3GB)
set -uo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
SK=$ROOT/.claude/skills
LOG=${VIDEO_SETUP_LOG:-/tmp/video-setup.log}
FULL=${1:-}
say(){ echo "[video-setup] $*"; }

# 0) متصفح: بالجلسات السحابية في Chromium جاهز؛ ما منحمّل واحد تاني.
if [[ -z "${CHROME:-}" ]]; then
  for c in /opt/pw-browsers/chromium /usr/bin/chromium /usr/bin/google-chrome; do [[ -x $c ]] && export CHROME=$c && break; done
fi
[[ -n "${CHROME:-}" ]] && export PUPPETEER_SKIP_DOWNLOAD=1 PUPPETEER_EXECUTABLE_PATH=$CHROME

command -v node >/dev/null || { say "Node مش موجود"; exit 1; }
command -v ffmpeg >/dev/null || say "ffmpeg ناقص (REV بيستعمل ffmpeg-static تبعه)"

# 1) REV: three.js + puppeteer + بايثون (yt-dlp, edge-tts)
REV=$SK/reverse-engineer-video
if [[ ! -d $REV/node_modules/puppeteer ]]; then
  say "REV: npm install"; (cd "$REV" && npm install --no-audit --no-fund --silent >>"$LOG" 2>&1) || say "REV npm فشل (شوف $LOG)"
fi
if [[ ! -x $REV/.venv/bin/python ]]; then
  say "REV: venv"; python3 -m venv "$REV/.venv" >>"$LOG" 2>&1
fi
"$REV/.venv/bin/python" -c "import numpy, PIL, yt_dlp, edge_tts" 2>/dev/null || {
  say "REV: pip"; "$REV/.venv/bin/pip" install -q numpy pillow yt-dlp edge-tts >>"$LOG" 2>&1 || say "pip فشل (شوف $LOG)"; }

# 2) HyperFrames: الـ CLI من npm (أحدث نسخة)، منسخّنه بالكاش
if ! node "$SK/hyperframes/scripts/plugin-cli.mjs" --version >>"$LOG" 2>&1; then say "HyperFrames CLI ما اشتغل (شوف $LOG)"; fi

# 2b) صوت مجاني محلي (Kokoro) لـ hyperframes tts — بيمشي بالسحابة (edge-tts لأ)
KV=$ROOT/.claude/kokoro-venv
if [[ ! -x $KV/bin/python ]] || ! "$KV/bin/python" -c "import kokoro_onnx, soundfile" 2>/dev/null; then
  say "Kokoro: venv"; python3 -m venv "$KV" >>"$LOG" 2>&1 && "$KV/bin/pip" install -q kokoro-onnx soundfile >>"$LOG" 2>&1 || say "Kokoro فشل (شوف $LOG)"
fi
say "للصوت: export HYPERFRAMES_PYTHON=$KV/bin/python"

# 3) reverse-video: venv خفيف دايماً؛ النماذج الثقيلة بس مع --full
RV=$SK/reverse-video
if [[ $FULL == --full && ! -x $RV/.venv/bin/python ]] && command -v uv >/dev/null; then
  say "reverse-video: تثبيت كامل (بطيء)"
  (cd "$RV" && uv venv -q --python 3.12 .venv && uv pip install -q -p .venv -r scripts/requirements.txt --torch-backend cpu && uv pip install -q -p .venv --no-deps rapidocr_onnxruntime) >>"$LOG" 2>&1 || say "reverse-video فشل (شوف $LOG)"
fi

# 4) الخطوط العربية: كل مشروع بيحمل ملفاته بـ assets/fonts (ما منعتمد على خطوط النظام)
say "خلص. CHROME=${CHROME:-none}"
