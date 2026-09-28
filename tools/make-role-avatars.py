#!/usr/bin/env python3
"""Cut the chataxi role-template portraits out of the app's sprite sheets.

`chataxi/templates/char/*.json` describes 27 role templates (9 male, 9 female,
9 other). Each sheet is one PNG with a 3x3 grid of square portraits, and every
template entry carries the cell index it belongs to. The chataxi product site
shows those same roles in a scrolling card row, so it needs the real faces
rather than placeholders.

The output is one circular `webp` per role id under `public/assets/site/roles/`.
Circular here means real alpha: the mask is drawn at 4x and downsampled, because
Pillow has no antialiased ellipse primitive.

Usage:
  python3 tools/make-role-avatars.py
  python3 tools/make-role-avatars.py --size 192 --preview
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys

from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "assets" / "site" / "roles"

# The three sheets live in the chataxi repository. Point at it explicitly so a
# missing sibling checkout fails with a readable message instead of a traceback.
DEFAULT_SOURCE = ROOT.parent / "chataxi" / "templates" / "char"
SHEETS = [
    ("boys.json", "boys"),
    ("girls.json", "girls"),
    ("others.json", "others"),
]


def circle_mask(size: int, supersample: int = 4) -> Image.Image:
    """An antialiased full-bleed circle, drawn large and downsampled."""
    big = size * supersample
    mask = Image.new("L", (big, big), 0)
    draw = ImageDraw.Draw(mask)
    inset = big * 0.005
    draw.ellipse((inset, inset, big - inset, big - inset), fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def load_roles(source: pathlib.Path) -> list[tuple[str, pathlib.Path, tuple[int, int, int, int]]]:
    """(role id, sheet path, crop box) for every template, in file order."""
    roles: list[tuple[str, pathlib.Path, tuple[int, int, int, int]]] = []
    for filename, key in SHEETS:
        data = json.loads((source / filename).read_text(encoding="utf-8"))
        sprite = data["sprite"]
        sheet = source / sprite["image"]
        assert sheet.is_file(), f"missing sprite sheet: {sheet}"
        for entry in data[key]:
            # `boys`/`girls` use the English key, `others` the Chinese one.
            avatar = entry.get("avatar") or entry["头像图片裁切数据"]
            assert avatar["sprite"] == sprite["image"], f"{entry['id']}: sprite mismatch"
            box = (
                avatar["x"],
                avatar["y"],
                avatar["x"] + avatar["width"],
                avatar["y"] + avatar["height"],
            )
            roles.append((entry["id"], sheet, box))
    return roles


def build(source: pathlib.Path, size: int, preview: bool) -> int:
    roles = load_roles(source)
    assert len(roles) == 27, f"expected 27 role templates, found {len(roles)}"
    mask = circle_mask(size)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cache: dict[pathlib.Path, Image.Image] = {}
    for role_id, sheet, box in roles:
        if sheet not in cache:
            cache.clear()  # one sheet at a time: each is roughly 3 MB decoded
            cache[sheet] = Image.open(sheet).convert("RGB")
        cell = cache[sheet].crop(box).resize((size, size), Image.LANCZOS)
        # JPEG-ish source cells carry their own backdrop; clip it to a circle so
        # the portrait sits cleanly on both the light and the dark theme.
        cell = cell.convert("RGBA")
        cell.putalpha(mask)
        target = OUT_DIR / f"{role_id}.webp"
        cell.save(target, "WEBP", quality=88, method=6)
        if preview:
            row = Image.new("RGB", (size, size), (245, 246, 248))
            row.paste(cell, (0, 0), cell)
            row.save(OUT_DIR / f"{role_id}.preview.png")
    total = sum((OUT_DIR / f"{r}.webp").stat().st_size for r, _, _ in roles)
    print(f"wrote {len(roles)} avatars at {size}px to {OUT_DIR.relative_to(ROOT)} ({total // 1024} KB)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=pathlib.Path, default=DEFAULT_SOURCE)
    parser.add_argument("--size", type=int, default=144)
    parser.add_argument("--preview", action="store_true", help="also write square PNG previews")
    args = parser.parse_args()
    if not args.source.is_dir():
        print(f"chataxi sprite directory not found: {args.source}", file=sys.stderr)
        return 2
    return build(args.source, args.size, args.preview)


if __name__ == "__main__":
    raise SystemExit(main())
