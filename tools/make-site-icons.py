#!/usr/bin/env python3
"""Derive the rounded browser icons the Haminn sites publish.

A browser tab never honours `border-radius`, so the corner radius has to be
baked into the bitmap itself. Every site therefore ships one 192 px PNG —
`<app>-icon-192.png` — cut from the square brand art in `assets/site/<app>.webp`
with the same 24 % radius the app icons use everywhere else in the family.

The product site's own mark follows the same rule; its file was named
`haminn-icon-192.png` before this tool existed, and the name is kept because the
seven Haminn pages already point at it.

PoseGi is deliberately absent: `posegi.webp` and `posegi-icon-192.png` are
produced by the PoseGi repository's own `tools/make-icon.py`, and this directory
only mirrors those bytes.

Usage:
  python3 tools/make-site-icons.py            # write the icons
  python3 tools/make-site-icons.py --check    # fail if any icon is missing or stale
"""

from __future__ import annotations

import argparse
import hashlib
import pathlib
import sys

from PIL import Image, ImageChops, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets" / "site"

# The published icon size. 192 px covers a browser tab, a bookmarks bar entry,
# a taskbar pin and `apple-touch-icon` without shipping a large file.
SIDE = 192

# Corner radius as a fraction of the side. The Haminn host draws 50 px icons at
# 16 px (32 %) and site chrome at 38 px with 11 px (29 %), so 24 % sits inside
# every place the same mark already appears.
RADIUS = 0.24

# The mask is drawn oversized and downsampled, which is what keeps the corners
# from looking stepped at the sizes a tab actually renders.
SUPERSAMPLE = 4

# output name -> source brand art in this directory.
ICONS: dict[str, str] = {
    "haminn-icon-192.png": "haminn-icon.webp",
    "chataxi-icon-192.png": "chataxi.webp",
    "hamdraw-icon-192.png": "hamdraw.webp",
}


def rounded(source: pathlib.Path) -> Image.Image:
    """The square brand art as a rounded RGBA square of `SIDE` px."""
    canvas = Image.open(source).convert("RGBA")
    if canvas.size != (SIDE, SIDE):
        canvas = canvas.resize((SIDE, SIDE), Image.LANCZOS)

    edge = SIDE * SUPERSAMPLE
    mask = Image.new("L", (edge, edge), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, edge - 1, edge - 1), radius=round(edge * RADIUS), fill=255
    )
    mask = mask.resize((SIDE, SIDE), Image.LANCZOS)

    # Multiply instead of assign so a source that already carries transparency
    # keeps it; the icons here are opaque squares, so this is a no-op for them.
    canvas.putalpha(ImageChops.multiply(canvas.getchannel("A"), mask))
    return canvas


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report stale icons instead of writing them")
    args = parser.parse_args()

    stale = []
    for name, source_name in ICONS.items():
        source = ASSETS / source_name
        if not source.is_file():
            print(f"missing source: {source_name}", file=sys.stderr)
            return 1
        output = ASSETS / name
        icon = rounded(source)
        if args.check:
            if not output.is_file():
                print(f"missing {name}")
                stale.append(name)
                continue
            with output.open("rb") as handle:
                on_disk = handle.read()
            if on_disk != _encode(icon):
                print(f"stale   {name}")
                stale.append(name)
            else:
                print(f"ok      {name}")
            continue
        icon.save(output, format="PNG", optimize=True)
        print(f"wrote   {name} ({output.stat().st_size} bytes, sha256 {digest(output)[:12]})")

    if args.check and stale:
        print(f"{len(stale)} icon(s) need tools/make-site-icons.py", file=sys.stderr)
        return 1
    return 0


def _encode(icon: Image.Image) -> bytes:
    """The bytes `icon.save(..., optimize=True)` would write, for --check."""
    import io

    buffer = io.BytesIO()
    icon.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()


if __name__ == "__main__":
    raise SystemExit(main())
