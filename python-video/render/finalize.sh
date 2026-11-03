#!/usr/bin/env bash
# Junta os blocos renderizados + trilha sonora no MP4 final.
#   bash render/finalize.sh build python-do-zero.mp4
set -euo pipefail
OUT=${1:-build}
DEST=${2:-python-do-zero.mp4}
node render/export-events.mjs "$OUT/events.json"
[ -f "$OUT/soundtrack.wav" ] || python3 audio/make_soundtrack.py "$OUT/events.json" "$OUT/soundtrack.wav"
ls "$OUT"/chunks/c*.mp4 | sort | sed "s#^$OUT/#file '#; s#\$#'#" > "$OUT/list.txt"
# capítulos (metadados) para players que suportam
node -e "
const tl = JSON.parse(require('fs').readFileSync('$OUT/events.json'));
const names = { opening: 'Abertura', map: 'Mapa da missão', finale: 'Conclusão e próximos passos' };
let s = ';FFMETADATA1\ntitle=Python do Zero ao Primeiro Jogo\n';
tl.chapters.forEach((c, i) => { const end = i + 1 < tl.chapters.length ? tl.chapters[i + 1].t : tl.duration;
  s += '[CHAPTER]\nTIMEBASE=1/1000\nSTART=' + Math.round(c.t * 1000) + '\nEND=' + Math.round(end * 1000) + '\ntitle=' + (names[c.kind] || c.title) + '\n'; });
require('fs').writeFileSync('$OUT/chapters.txt', s);"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$OUT/list.txt" -i "$OUT/soundtrack.wav" -i "$OUT/chapters.txt" \
  -map 0:v -map 1:a -map_metadata 2 -map_chapters 2 -c:v copy \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 160k -shortest -movflags +faststart "$DEST"
ls -lh "$DEST"
