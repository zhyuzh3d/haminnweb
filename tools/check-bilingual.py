#!/usr/bin/env python3
"""Guard the bilingual contract of the shared site chrome and app pages.

Two mechanisms share the work on these sites:

* every piece of running copy is written twice, inside a `.lang-zh` / `.lang-en`
  span pair, and CSS decides which one shows;
* short, repeated strings (navigation, buttons, aria-labels, alt text, toast
  messages) live in the `EN` dictionary in `assets/site/site.js`, keyed by the
  exact Chinese string, with `ZH` derived by inverting it.

The failure mode is silent: add a button without a dictionary entry and the
English site keeps showing Chinese. This script walks every page, ignores text
already covered by a span pair, and reports any remaining Chinese string the
dictionary does not know about.

Usage:
  python3 tools/check-bilingual.py           # list every missing key
  python3 tools/check-bilingual.py --quiet   # exit code only
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SITE_JS = PUBLIC / "assets" / "site" / "site.js"
HAN = re.compile(r"[\u4e00-\u9fff]")
# Attributes the runtime dictionary rewrites, mirroring `translate()` in site.js.
TRANSLATED_ATTRS = ("aria-label", "title", "placeholder", "alt", "data-success")
# `<title>` is rewritten from the per-path meta table rather than the dictionary,
# and `<script>`/`<style>` never render — neither needs a key.
SKIP_TAGS = {"script", "style", "title"}
# Strings that are deliberately identical in both languages.
EXEMPT = {
    "中",  # the language switch itself
}
SKIP_PATHS = ("shell/",)


def dictionary_keys() -> set[str]:
    source = SITE_JS.read_text(encoding="utf-8")
    block = source.split("const EN = Object.fromEntries([", 1)[1].split("\n  ]);", 1)[0]
    keys = set()
    for match in re.finditer(r'\["((?:[^"\\]|\\.)*)",\s*"(?:[^"\\]|\\.)*"\]', block):
        keys.add(match.group(1).replace('\\"', '"').replace("\\\\", "\\"))
    assert keys, "no dictionary entries found in site.js"
    return keys


class Page(HTMLParser):
    """Collects Chinese text nodes that no `.lang-zh` / `.lang-en` span covers."""

    def __init__(self, path: pathlib.Path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.missing: dict[str, list[str]] = {}
        # Stack of (tag, in_lang_span) — a text node is exempt when any open
        # ancestor is a lang span, a script, a style block or the title.
        self.stack: list[tuple[str, bool]] = []

    def _covers(self) -> bool:
        return any(flag or tag in SKIP_TAGS for tag, flag in self.stack)

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set((attributes.get("class") or "").split())
        if tag not in ("br", "img", "input", "meta", "link", "hr"):
            self.stack.append((tag, bool(classes & {"lang-zh", "lang-en"})))
        else:
            self.stack.append((tag, False))
        if self._covers():
            return
        for name in TRANSLATED_ATTRS:
            value = attributes.get(name)
            if value and HAN.search(value):
                self.missing.setdefault(value, []).append(f"{tag}[{name}]")

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        if self._covers():
            return
        clean = " ".join(data.split())
        if clean and HAN.search(clean):
            self.missing.setdefault(clean, []).append("text")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quiet", action="store_true", help="suppress the listing")
    args = parser.parse_args()

    known = dictionary_keys()
    total = 0
    for path in sorted(PUBLIC.rglob("*.html")):
        relative = path.relative_to(PUBLIC).as_posix()
        if relative.startswith(SKIP_PATHS):
            continue
        page = Page(path)
        page.feed(path.read_text(encoding="utf-8"))
        page.close()
        unknown = {text: where for text, where in page.missing.items() if text not in known and text not in EXEMPT}
        if not unknown:
            continue
        total += len(unknown)
        if not args.quiet:
            print(f"{relative}: {len(unknown)} string(s) missing from the EN dictionary")
            for text, where in unknown.items():
                print(f'    ["{text}", ""],   # {", ".join(sorted(set(where)))}')

    if total:
        print(f"{total} string(s) need assets/site/site.js", file=sys.stderr)
        return 1
    print("bilingual contract ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
