#!/usr/bin/env python3
"""Own the shared top bar and footer of every Haminn website page.

The Haminn family publishes four sites from one `public/` tree:

  https://haminn.airen.life    the product site and happ gallery
  https://chataxi.airen.life   the chataxi product site
  https://hamdraw.airen.life  the HamDraw product site
  https://posegi.airen.life    the PoseGi product site

The four sites share one stylesheet, one script and one visual language, but
each carries its own identity: its own brand mark and wordmark in the top-left,
its own navigation, its own primary action and its own repository link. That is
what this file encodes, and it is the only place the top bar is written down.

Cross-site rule: the product site links to the three app sites from the happ
gallery only, and the app sites link back to Haminn wherever a user needs to
install it. Keeping that in one table is what keeps it from drifting.

The same file also substitutes the Android release placeholders that the app
sites use for their "install Haminn first" buttons, so the version and the APK
URL come from `public/downloads/android.json` — the metadata the release
pipeline already writes — instead of being typed into three pages.

Usage:
  python3 tools/build-site-nav.py            # rewrite every page
  python3 tools/build-site-nav.py --check    # fail if any page is stale
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
HAMINN = "https://haminn.airen.life"
ANDROID_JSON = PUBLIC / "downloads" / "android.json"

# Cache-busting query for the shared site stylesheet and script. Bump it
# whenever `assets/site/site.css` or `assets/site/site.js` changes.
ASSET_VERSION = "20260926c"

SITES = {
    "haminn": {
        "host": "haminn.airen.life",
        "brand": {"name": "haminn", "dot": True, "icon": "/assets/site/haminn-icon.webp", "plain": False, "href": "/"},
        "nav": [
            ("home", "认识 Haminn", "/"),
            ("guide", "开始使用", "/pages/guide.html"),
            ("faq", "常见问题", "/pages/faq.html"),
            ("happs", "应用广场", "/pages/happs.html"),
        ],
        "cta": ("下载", "/pages/download.html"),
        "github": "https://github.com/zhyuzh3d/haminnapp",
        "footer": [
            ("下载 Haminn", "/pages/download.html"),
            ("开始使用", "/pages/guide.html"),
            ("常见问题", "/pages/faq.html"),
            ("应用广场", "/pages/happs.html"),
            ("隐私与数据", "/pages/privacy.html"),
            ("帮助与反馈", "/pages/donate.html"),
        ],
    },
    "chataxi": {
        "host": "chataxi.airen.life",
        "brand": {"name": "chataxi", "dot": False, "icon": "/assets/site/chataxi.webp", "plain": True, "href": "/"},
        "nav": [
            ("voice", "真人语音", "#voice"),
            ("group", "多角色群聊", "#group"),
            ("setup", "模型配置", "#setup"),
            ("install", "上手", "#install"),
            ("happs", "应用广场", f"{HAMINN}/pages/happs.html"),
        ],
        "cta": ("安装 chataxi", "#install"),
        "github": "https://github.com/zhyuzh3d/chataxi",
        "footer": [
            ("下载 Haminn", f"{HAMINN}/pages/download.html"),
            ("应用广场", f"{HAMINN}/pages/happs.html"),
            ("安装 chataxi", "#install"),
            ("隐私与数据", f"{HAMINN}/pages/privacy.html"),
            ("帮助与反馈", f"{HAMINN}/pages/donate.html"),
        ],
    },
    "hamdraw": {
        "host": "hamdraw.airen.life",
        "brand": {"name": "HamDraw", "dot": False, "icon": "/assets/site/hamdraw.webp", "plain": True, "href": "/"},
        "nav": [
            ("realtime", "实时生图", "#realtime"),
            ("tools", "涂鸦工具", "#tools"),
            ("models", "模型接入", "#models"),
            ("install", "上手", "#install"),
            ("happs", "应用广场", f"{HAMINN}/pages/happs.html"),
        ],
        "cta": ("安装 HamDraw", "#install"),
        "github": "https://github.com/zhyuzh3d/hamdraw",
        "footer": [
            ("下载 Haminn", f"{HAMINN}/pages/download.html"),
            ("应用广场", f"{HAMINN}/pages/happs.html"),
            ("安装 HamDraw", "#install"),
            ("隐私与数据", f"{HAMINN}/pages/privacy.html"),
            ("帮助与反馈", f"{HAMINN}/pages/donate.html"),
        ],
    },
    "posegi": {
        "host": "posegi.airen.life",
        "brand": {"name": "PoseGi", "dot": False, "icon": "/assets/site/posegi.webp", "plain": True, "href": "/"},
        "nav": [
            ("pose", "摆姿", "#pose"),
            ("tools", "界面按钮", "#tools"),
            ("models", "模型接入", "#models"),
            ("install", "上手", "#install"),
            ("happs", "应用广场", f"{HAMINN}/pages/happs.html"),
        ],
        "cta": ("安装 PoseGi", "#install"),
        "github": "https://github.com/zhyuzh3d/PoseGi",
        "footer": [
            ("下载 Haminn", f"{HAMINN}/pages/download.html"),
            ("应用广场", f"{HAMINN}/pages/happs.html"),
            ("安装 PoseGi", "#install"),
            ("隐私与数据", f"{HAMINN}/pages/privacy.html"),
            ("帮助与反馈", f"{HAMINN}/pages/donate.html"),
        ],
    },
}

# Every page that carries the shared chrome, with the nav entry it represents.
PAGES = [
    ("haminn", "index.html", "home"),
    ("haminn", "pages/happs.html", "happs"),
    ("haminn", "pages/guide.html", "guide"),
    ("haminn", "pages/faq.html", "faq"),
    ("haminn", "pages/download.html", "download"),
    ("haminn", "pages/privacy.html", None),
    ("haminn", "pages/donate.html", None),
    ("chataxi", "chataxi/index.html", None),
    ("hamdraw", "hamdraw/index.html", None),
    ("posegi", "posegi/index.html", None),
]


def brand(site: str) -> str:
    config = SITES[site]["brand"]
    tone = "app-mark" if config["plain"] else "logo-mark"
    dot = '<span class="brand-dot">.</span>' if config["dot"] else ""
    return (
        f'<a class="brand" href="{config["href"]}" aria-label="{config["name"]} 首页">'
        f'<span class="brand-mark {tone}"><img src="{config["icon"]}" alt="" width="38" height="38"></span>'
        f'{config["name"]}{dot}</a>'
    )


def header(site: str, current: str | None) -> str:
    config = SITES[site]
    items = []
    for key, label, href in config["nav"]:
        current_attr = ' aria-current="page"' if key == current else ""
        items.append(f'<a href="{href}"{current_attr}>{label}</a>')
    cta_label, cta_href = config["cta"]
    cta_attr = ' aria-current="page"' if current == "download" else ""
    return (
        '<header class="site-header">\n'
        f"{brand(site)}\n"
        f'<nav aria-label="网站导航">{"".join(items)}</nav>\n'
        '<div class="header-tools">'
        f'<a class="button small" href="{cta_href}"{cta_attr}>{cta_label} '
        '<i class="fa-solid fa-download" aria-hidden="true"></i></a>'
        f'<a class="github-link" href="{config["github"]}" aria-label="GitHub 仓库" title="GitHub 仓库">'
        '<i class="fa-brands fa-github" aria-hidden="true"></i></a>'
        '<div class="language-switch" id="siteLanguage" role="group" aria-label="选择语言">'
        '<button type="button" data-language-choice="zh" aria-pressed="false">中</button>'
        '<button type="button" data-language-choice="en" aria-pressed="false">En</button></div>'
        '<div class="theme-switch" id="siteTheme" role="group" aria-label="选择明暗主题">'
        '<button type="button" data-theme-choice="dark" aria-pressed="false" aria-label="深色主题">'
        '<i class="fa-regular fa-moon" aria-hidden="true"></i></button>'
        '<button type="button" data-theme-choice="system" aria-pressed="true" aria-label="跟随系统">Auto</button>'
        '<button type="button" data-theme-choice="light" aria-pressed="false" aria-label="浅色主题">'
        '<i class="fa-regular fa-sun" aria-hidden="true"></i></button></div></div>\n'
        "</header>"
    )


def footer(site: str, current: str | None) -> str:
    config = SITES[site]
    items = []
    for label, href in config["footer"]:
        current_attr = ' aria-current="page"' if current and href.endswith(f"/{current}.html") else ""
        items.append(f'<a href="{href}"{current_attr}>{label}</a>')
    # On the app sites "/" is that app's own site, so the footer wordmark has to
    # point at the Haminn site explicitly.
    home = "/" if site == "haminn" else HAMINN
    return (
        f'<footer class="site-footer"><div><a class="brand" href="{home}">haminn'
        '<span class="brand-dot">.</span></a><p>我的应用，我做主。</p></div>'
        f'<nav aria-label="页脚导航">{"".join(items)}</nav></footer>'
    )


def android_release() -> tuple[str, str]:
    """The latest published Haminn release: (version, absolute APK URL)."""
    meta = json.loads(ANDROID_JSON.read_text(encoding="utf-8"))
    return str(meta["version"]), f"{HAMINN}/downloads/{meta['file']}"


def render(site: str, current: str | None, text: str) -> str:
    text = re.sub(r'<header class="site-header">.*?</header>', lambda _: header(site, current), text, count=1, flags=re.S)
    text = re.sub(r'<footer class="site-footer">.*?</footer>', lambda _: footer(site, current), text, count=1, flags=re.S)
    text = re.sub(r'((?:/assets/site/site\.(?:css|js)|styles\.css)\?v=)[0-9a-z]+', rf'\g<1>{ASSET_VERSION}', text)
    version, apk = android_release()
    return text.replace("{{haminn-version}}", version).replace("{{haminn-apk}}", apk)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report stale pages instead of rewriting them")
    args = parser.parse_args()

    stale = []
    for site, relative, current in PAGES:
        path = PUBLIC / relative
        if not path.is_file():
            print(f"missing page: {relative}", file=sys.stderr)
            stale.append(relative)
            continue
        text = path.read_text(encoding="utf-8")
        assert '<header class="site-header">' in text, f"{relative}: no site header"
        assert '<footer class="site-footer">' in text, f"{relative}: no site footer"
        updated = render(site, current, text)
        if updated == text:
            print(f"ok      {relative}")
            continue
        stale.append(relative)
        if args.check:
            print(f"stale   {relative}")
        else:
            path.write_text(updated, encoding="utf-8")
            print(f"updated {relative}")

    if args.check and stale:
        print(f"{len(stale)} page(s) need tools/build-site-nav.py", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
