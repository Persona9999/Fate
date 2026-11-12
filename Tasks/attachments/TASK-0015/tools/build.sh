#!/usr/bin/env bash
# 正式錄影＋混音＋量讀數（約 5 分鐘）。用法：bash tools/build.sh [cn|tw]  （在附件資料夾裡跑；預設 cn）
set -u
CH="C:/Program Files/Google/Chrome/Application/chrome.exe"
FFD="$LOCALAPPDATA/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin"
LANG_=${1:-cn}
OUT=site/out_$LANG_
mkdir -p $OUT
rm -f $OUT/frame_*.png $OUT/intro.webm $OUT/blackhole_$LANG_.mp4
python tools/rec.py site "$CH" 330 "?lang=$LANG_" out_$LANG_ | grep -v "^saved frame" || exit 1
python -I tools/mix.py "$FFD/ffmpeg.exe" site $LANG_ "$(pwd -W)/$OUT/blackhole_$LANG_.mp4" || exit 1
"$FFD/ffprobe.exe" -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,channels -of compact $OUT/blackhole_$LANG_.mp4
for seg in "0 3.5" "7.7 14" "81.7 98" "99 131" "134.5 147" "0 179"; do set -- $seg
  "$FFD/ffmpeg.exe" -hide_banner -ss $1 -to $2 -i $OUT/blackhole_$LANG_.mp4 -vn -af volumedetect -f null - 2>&1 | grep -o "mean_volume.*\|max_volume.*" | tr '\n' ' '; echo " [$1-$2]"; done
sha256sum $OUT/blackhole_$LANG_.mp4
rm -rf $OUT/final; mkdir -p $OUT/final
for t in 1.5 12.0 21.6 31.0 41.0 42.9 50.0 54.5 57.0 66.4 70.0 76.8 79.2 92.0 99.5 106.2 109.5 116.0 129.5 131.6 141.0 146.9 152.0 158.0 168.0 175.0; do
  "$FFD/ffmpeg.exe" -v error -ss $t -i $OUT/blackhole_$LANG_.mp4 -frames:v 1 "$OUT/final/frame_$(printf '%05.1f' $t).png"; done
python -I tools/sheet.py "$FFD/ffmpeg.exe" $OUT/final | tail -5
echo BUILD_DONE
