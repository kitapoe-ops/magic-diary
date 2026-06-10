#!/usr/bin/env python3
"""
Iteration 10 - Resize + compress the 10 raw diary stamps.

Input:  C:\\Users\\kitap\\.openclaw\\workspace\\output\\stamps-raw\\{name}.jpg
Output: C:\\Users\\kitap\\.openclaw\\workspace\\magic-diary-work\\public\\images\\diary-stamps\\{name}.jpg

Stamps render at 32px (corner) / 22px (inline). Source images come back
from the model at 1024x1024, ~300KB JPEG. We:
  1) Resize to 128x128 (4x our max display size — gives retina + 2x
     future-proofing; the round div clips the rest).
  2) Re-save as JPEG quality 80 (visually lossless for stamp art).
  3) Target file size: 5-50 KB each (most should land at 8-25 KB).
"""

import os
import sys
from pathlib import Path
from PIL import Image

RAW_DIR = Path(r"C:\Users\kitap\.openclaw\workspace\output\stamps-raw")
OUT_DIR = Path(r"C:\Users\kitap\.openclaw\workspace\magic-diary-work\public\images\diary-stamps")
OUT_DIR.mkdir(parents=True, exist_ok=True)

STAMP_SIZE = 256  # 8x the 32px display size — high-DPI + future-proof
JPEG_QUALITY = 85

names = [
    "sorting-hat", "wand", "broom", "owl", "spellbook",
    "potion", "candle", "key", "mandrake", "scroll",
]

ok = 0
failed = []
for name in names:
    src = RAW_DIR / f"{name}.jpg"
    dst = OUT_DIR / f"{name}.jpg"
    if not src.exists():
        print(f"  MISSING: {src}")
        failed.append(name)
        continue
    try:
        with Image.open(src) as im:
            im = im.convert("RGB")
            im = im.resize((STAMP_SIZE, STAMP_SIZE), Image.LANCZOS)
            im.save(dst, "JPEG", quality=JPEG_QUALITY, optimize=True)
        size = dst.stat().st_size
        marker = "OK" if 1_500 < size < 60_000 else "WARN"
        print(f"  {marker:4s}  {name}.jpg  {size:>7d} bytes  ({size/1024:.1f} KB)")
        if marker == "OK":
            ok += 1
    except Exception as e:
        print(f"  FAIL  {name}: {e}")
        failed.append(name)

print(f"\nSummary: {ok} ok, {len(failed)} failed")
if failed:
    print(f"Failed: {failed}")
    sys.exit(1)
