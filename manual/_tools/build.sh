#!/bin/bash
# 매뉴얼 전체 재생성: 캡처 → WebP → HTML → PDF → 좁은 화면 점검   usage: bash build.sh <repoDir> <rawDir>
# 환경: MM_PW(playwright 경로)
set -e; REPO="$(cd "$1" && pwd)"; RAW="$2"; mkdir -p "$RAW"; RAW="$(cd "$RAW" && pwd)"; cd "$(dirname "$0")"; M="$REPO/manual"; mkdir -p "$M/images"
node capture_lu.js "$REPO" "$RAW" > "$RAW/_log.json"
python3 - "$RAW" "$M" <<'PY'
import sys,glob,os,shutil
from PIL import Image
raw,M=sys.argv[1],sys.argv[2]
for f in sorted(glob.glob(raw+'/s*.png')):
    if f.endswith('_t.png'): continue
    Image.open(f).convert('RGB').save(M+'/images/'+os.path.basename(f)[:-4]+'.webp',quality=82,method=6)
shutil.copy(raw+'/_marks.json',M+'/images/_marks.json'); shutil.copy(raw+'/_example.json',M+'/_tools/_example.json')
PY
MANUAL_DIR="$M" python3 gen_manual_lu.py
node pdf_lu.js "$M" 건폐율용적률_사용자매뉴얼_Ver-5.1.pdf "건폐율 · 용적률 조례 적용 계산기 사용자 매뉴얼 Ver-5.1"
node audit_responsive.js "$M/index.html" > "$RAW/_audit.json"
