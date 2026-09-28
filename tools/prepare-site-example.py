#!/usr/bin/env python3
"""Publish a self-contained ChatTaxi example from its existing release, not its working tree."""
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "chataxi/release/chataxi-v0.6.8.zip"
SOURCE_SHA256 = "178c474b8fad4c3102d142134ce146c5b6a66edbca2b404238359cacdce54b09"
DEST = ROOT / "public/downloads/chataxi"
UPDATE_URL = "https://haminn.airen.life/downloads/chataxi/haminn-install.json"
NAME = "chataxi-v0.6.8-web.1.zip"

def main():
    raw = SOURCE.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise SystemExit("ChatTaxi source release differs from the verified 0.6.8 release")
    output = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(raw)) as source, zipfile.ZipFile(output, "w") as target:
        for item in source.infolist():
            data = source.read(item.filename)
            if item.filename == "haminn.json":
                manifest = json.loads(data)
                # A new immutable distribution revision; no LAN URL is published.
                manifest["version"] = {"code": 69, "name": "0.6.8-web.1"}
                manifest.pop("liveUrl", None)
                manifest["updateUrl"] = UPDATE_URL
                data = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
            info = zipfile.ZipInfo(item.filename, (2026, 9, 16, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            target.writestr(info, data)
    data = output.getvalue()
    digest = hashlib.sha256(data).hexdigest()
    DEST.mkdir(parents=True, exist_ok=True)
    bundle = DEST / NAME
    if bundle.exists() and bundle.read_bytes() != data:
        raise SystemExit("Refusing to overwrite a different versioned distribution")
    if not bundle.exists():
        bundle.write_bytes(data)
    descriptor = {"schema": 1, "package": NAME, "sha256": digest}
    (DEST / "haminn-install.json").write_text(json.dumps(descriptor, indent=2) + "\n")
    print(f"ChatTaxi example: {len(data)} bytes, SHA-256 {digest}")

if __name__ == "__main__":
    main()
