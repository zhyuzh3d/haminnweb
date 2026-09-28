#!/usr/bin/env python3
"""Vendor the brand marks the two app sites show.

The published pages must not call out to a third party at runtime, so every
logo is fetched once, normalised and committed under
`public/assets/site/brands/`. Re-run this after a source URL changes.

Vector sources are copied verbatim: they stay crisp at any chip size and are
already small. Raster sources are converted to square 96 px WebP with alpha,
which is 2x the largest chip they are drawn at.

Usage:
  python3 tools/make-brand-logos.py            # fetch what is missing, then write
  python3 tools/make-brand-logos.py --check    # verify the outputs on disk
"""

from __future__ import annotations

import argparse
import pathlib
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "site" / "brands"
RASTER_PX = 96

# slug -> (format, source URL). The comment names the owner of the mark.
SOURCES: dict[str, tuple[str, str]] = {
    # xAI's Grok mark, via Wikimedia Commons.
    "grok": ("svg", "https://upload.wikimedia.org/wikipedia/commons/f/f9/Grok-icon.svg"),
    # ElevenLabs, Qwen, Gemini, Hugging Face, Ollama and LM Studio marks come
    # from Simple Icons, which ships the official geometry as a single path.
    "elevenlabs": ("svg", "https://cdn.simpleicons.org/elevenlabs"),
    "qwen": ("svg", "https://cdn.simpleicons.org/qwen"),
    "googlegemini": ("svg", "https://cdn.simpleicons.org/googlegemini"),
    "huggingface": ("svg", "https://cdn.simpleicons.org/huggingface"),
    "ollama": ("svg", "https://cdn.simpleicons.org/ollama"),
    "lmstudio": ("svg", "https://cdn.simpleicons.org/lmstudio"),
    "mistralai": ("svg", "https://cdn.simpleicons.org/mistralai"),
    "anthropic": ("svg", "https://cdn.simpleicons.org/anthropic"),
    "bytedance": ("svg", "https://cdn.simpleicons.org/bytedance"),
    # ComfyUI's own favicon from comfy.org.
    "comfyui": ("svg", "https://www.comfy.org/favicon.svg"),
    # fal.ai ships an opaque square touch icon.
    "fal": ("raster", "https://fal.ai/apple-touch-icon.png"),
    # Black Forest Labs (FLUX) publishes only a favicon.
    "blackforestlabs": ("raster", "https://blackforestlabs.ai/favicon.ico"),
}

# Marks that already live in the repository next to the site assets; the tool
# only re-encodes them so one directory holds every chip the pages need. The
# PNG stays where it is: it is the archived source of this mark.
#
# Codex is deliberately absent. It has no mark of its own — the pages show
# OpenAI's, which the vendored Font Awesome brand glyphs already carry, so no
# bitmap is needed.
LOCAL: dict[str, str] = {
    "workbuddy": "workbuddy.png",
}


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "haminnweb-brand-logos/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def square_raster(data: bytes) -> Image.Image:
    """Decode any PIL-readable raster and pad it to a transparent square."""
    import io

    image = Image.open(io.BytesIO(data))
    if hasattr(image, "seek"):
        image.seek(0)
    image = image.convert("RGBA")
    # Trim fully transparent padding so the mark fills the chip evenly.
    box = image.getbbox()
    if box:
        image = image.crop(box)
    side = max(image.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas.resize((RASTER_PX, RASTER_PX), Image.LANCZOS)


def build(check: bool) -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    missing: list[str] = []
    written: list[str] = []

    for slug, (kind, url) in SOURCES.items():
        target = OUTPUT / f"{slug}.{'svg' if kind == 'svg' else 'webp'}"
        if check:
            if not target.exists():
                missing.append(str(target.relative_to(ROOT)))
            continue
        data = fetch(url)
        if kind == "svg":
            if b"<svg" not in data[:400]:
                raise SystemExit(f"{slug}: {url} did not return an SVG")
            target.write_bytes(data)
        else:
            square_raster(data).save(target, format="WEBP", lossless=True, method=6)
        written.append(f"{target.relative_to(ROOT)} ({target.stat().st_size} bytes)")

    for slug, name in LOCAL.items():
        source = OUTPUT.parent / name
        target = OUTPUT / f"{slug}.webp"
        if check:
            if not target.exists():
                missing.append(str(target.relative_to(ROOT)))
            continue
        square_raster(source.read_bytes()).save(target, format="WEBP", lossless=True, method=6)
        written.append(f"{target.relative_to(ROOT)} ({target.stat().st_size} bytes)")

    if check:
        if missing:
            print("missing brand logos:\n  " + "\n  ".join(missing))
            return 1
        print(f"brand logos ok ({len(SOURCES) + len(LOCAL)} marks)")
        return 0

    print("\n".join(written))
    print(f"{len(written)} brand logos written to {OUTPUT.relative_to(ROOT)}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the outputs instead of writing")
    args = parser.parse_args()
    sys.exit(build(args.check))


if __name__ == "__main__":
    main()
