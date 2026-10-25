#!/bin/zsh
# GEO 주간 측정 — 매주 **일요일 오후 3시**. 20문항을 돌리고 전주와 견준다.
#   설치: crontab -e 에 아래 한 줄
#   0 15 * * 0 "/Users/aram/Desktop/project/14. 나만의 os/아람미러(hyun-arch.github.io)/publish/geo-weekly.sh"
cd "/Users/aram/Desktop/project/14. 나만의 os/아람미러(hyun-arch.github.io)" || exit 1
M="/Users/aram/Desktop/project/31. 이니_GEO/geo/측정"
날짜=$(date +%Y-%m-%d)

# 지난 결과를 치우지 않고 날짜별로 남긴다 — 추이를 보려면 과거가 있어야 한다.
# ⚠ 폴더를 **먼저** 만든다. 전에는 cp 가 먼저라 첫 주 기록이 조용히 사라졌다. (2026-10-23 고침)
mkdir -p "$M/기록"
for f in 측정결과_perplexity.json 측정결과_chatgpt.json; do
  [ -f "$M/$f" ] && cp "$M/$f" "$M/기록/${날짜}_$f"
done

echo "[$날짜] GEO 주간 측정 시작"
node publish/geo-measure.mjs      2>&1 | tail -30
node publish/geo-measure-gpt.mjs  2>&1 | tail -30
node publish/geo-추이.mjs          2>&1 | tail -20
