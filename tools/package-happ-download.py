#!/usr/bin/env python3
"""Publish a happ release ZIP as an official download on the Haminn website.

The happ repositories keep development settings in their own `haminn.json`
(a LAN liveUrl for the agent dev server, a LAN updateUrl). The copy served
from the website must not carry those, so this tool repackages a release ZIP
with the public install manifest URL and no live runtime, then rewrites the
`haminn-install.json` descriptor next to it.

Usage:
  tools/package-happ-download.py --source ../chataxi/release/chataxi-v0.6.15.zip \
      --dir public/downloads/chataxi \
      --install-url https://haminn.airen.life/downloads/chataxi/haminn-install.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import sys
import zipfile

FIXED_TIMESTAMP = (2026, 9, 16, 0, 0, 0)
MANIFEST_NAME = "haminn.json"


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_manifest(archive: zipfile.ZipFile) -> dict:
    try:
        raw = archive.read(MANIFEST_NAME)
    except KeyError:
        raise SystemExit(f"source archive has no {MANIFEST_NAME}")
    return json.loads(raw.decode("utf-8"))


def public_manifest(manifest: dict, install_url: str, suffix: str) -> tuple[dict, str]:
    patched = json.loads(json.dumps(manifest))
    patched.pop("liveUrl", None)
    patched["updateUrl"] = install_url
    version = patched.get("version")
    if not isinstance(version, dict):
        raise SystemExit("source manifest has no version object")
    name = str(version.get("name") or "").strip()
    if not name:
        raise SystemExit("source manifest version has no name")
    if not suffix or not name.endswith(suffix):
        version["name"] = f"{name}-{suffix}" if suffix else name
    return patched, version["name"]


def write_archive(source: zipfile.ZipFile, output: pathlib.Path, patched: dict) -> None:
    names = sorted(name for name in source.namelist() if name != MANIFEST_NAME)
    temporary = output.with_suffix(output.suffix + ".tmp")
    with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        info = zipfile.ZipInfo(MANIFEST_NAME, FIXED_TIMESTAMP)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, json.dumps(patched, ensure_ascii=False, indent=2) + "\n")
        for name in names:
            item = zipfile.ZipInfo(name, FIXED_TIMESTAMP)
            item.compress_type = zipfile.ZIP_DEFLATED
            item.external_attr = 0o100644 << 16
            archive.writestr(item, source.read(name))
    temporary.replace(output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, help="happ release ZIP built by its own repository")
    parser.add_argument("--dir", required=True, help="public download directory, e.g. public/downloads/chataxi")
    parser.add_argument("--install-url", required=True, help="public URL of the haminn-install.json to publish")
    parser.add_argument("--suffix", default="web.1", help="version name suffix marking the website build")
    args = parser.parse_args()

    source_path = pathlib.Path(args.source)
    if not source_path.is_file():
        raise SystemExit(f"missing source archive: {source_path}")
    target_dir = pathlib.Path(args.dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(source_path) as source:
        manifest = read_manifest(source)
        patched, version_name = public_manifest(manifest, args.install_url, args.suffix)
        stem = str(patched.get("name") or "happ").strip() or "happ"
        output = target_dir / f"{stem}-v{version_name}.zip"
        write_archive(source, output, patched)

    digest = sha256(output)
    descriptor = target_dir / "haminn-install.json"
    descriptor.write_text(
        json.dumps({"schema": 1, "package": output.name, "sha256": digest}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"created {output} ({output.stat().st_size} bytes)")
    print(f"updated {descriptor} -> {output.name} sha256={digest}")


if __name__ == "__main__":
    sys.exit(main())
