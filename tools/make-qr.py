#!/usr/bin/env python3
"""Render a QR code image. The only tool dependency is `pip install segno`.

Haminn install codes carry `haminn://add?url=<urlencoded install manifest>` so
that HaminnApp recognises the scan and goes straight to the add flow.
"""

from __future__ import annotations

import argparse
import pathlib
import sys

try:
    import segno
except ModuleNotFoundError:  # pragma: no cover - environment hint
    raise SystemExit("missing dependency: install it with `pip install segno`")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--text", required=True, help="content to encode")
    parser.add_argument("--out", required=True, help="output PNG path")
    parser.add_argument("--svg", help="optional extra SVG output path")
    parser.add_argument("--scale", type=int, default=9, help="pixels per module; default 9")
    parser.add_argument("--border", type=int, default=3, help="quiet zone in modules; default 3")
    parser.add_argument("--dark", default="#111418", help="module colour; default #111418")
    parser.add_argument("--light", default="#ffffff", help="background colour; default #ffffff")
    args = parser.parse_args()

    code = segno.make(args.text, error="m", micro=False)
    output = pathlib.Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    code.save(output, kind="png", scale=args.scale, border=args.border, dark=args.dark, light=args.light)
    print(f"created {output} ({output.stat().st_size} bytes)")
    if args.svg:
        svg_path = pathlib.Path(args.svg)
        svg_path.parent.mkdir(parents=True, exist_ok=True)
        code.save(svg_path, kind="svg", scale=args.scale, border=args.border, dark=args.dark, light=args.light)
        print(f"created {svg_path} ({svg_path.stat().st_size} bytes)")
    sys.exit(0)


if __name__ == "__main__":
    main()
