#!/usr/bin/env python3
"""Generate the public happs page from the happ packages published on the site.

Flow:
  1. Publish a package: put `haminn-install.json` plus the release ZIP under
     `public/downloads/happs/<happId>/`, optionally with `happ-info.json`
     holding the bilingual blurb shown on the page.
  2. Run this script. It renders the install QR (through tools/make-qr.py),
     writes `public/pages/happs.html` and adds the page to the site navigation.

Each card's QR carries that happ's own install address — the very link printed
under the code — so any scanner reads a real URL instead of a percent-encoded
deep link, and HaminnApp's add flow accepts it exactly the same. The bitmap is
written to `install-qr.png`, never to a name a previous release already used.
"""

from __future__ import annotations

import argparse
import html
import json
import pathlib
import subprocess
import sys
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
HAPPS_ROOT = ROOT / "public" / "downloads" / "happs"
MAKE_QR = ROOT / "tools" / "make-qr.py"
PAGE_PATH = ROOT / "public" / "pages" / "happs.html"
NAV_HREF = "/pages/happs.html"
NAV_LABEL = "应用广场"
CSS_VERSION = "20260922b"
# Cache-busting query for the favicon links in this page's head. Bump it with
# tools/make-site-icons.py whenever an icon bitmap changes.
ICON_VERSION = "20260926b"

TEXT = {
    "eyebrow": ("官方应用", "Official apps"),
    "title": ("应用广场", "Happ gallery"),
    "lead": ("用 Haminn 扫描二维码，就能把这里的官方 happ 装进手机。", "Scan a code with Haminn to install any official happ on this page."),
    "steps": [
        ("打开 Haminn，点“扫码添加”。", "Open Haminn and choose Scan to add."),
        ("扫描这个二维码，确认安装。", "Scan this code and confirm the install."),
        ("回到应用库，点开就能用。", "Back in your library, open it and start using it."),
    ],
    "copy_label": ("正在这台手机上看？复制地址，回到 Haminn 点“从网址”。", "On this phone? Copy the link, then use Add from URL in Haminn."),
    "copy": ("复制地址", "Copy link"),
    "copied": ("已复制。回到 Haminn，点“从网址”粘贴即可。", "Copied. Paste it in Haminn under Add from URL."),
    "download": ("下载安装包", "Download package"),
    "repository": ("GitHub 仓库", "GitHub repository"),
    "website": ("产品网站", "Product site"),
    "meta": ("{name}（{version}）", "{name} ({version})"),
    "qr_alt": ("{name} 安装二维码：在 Haminn 中点扫码添加扫描；也可复制下方地址。",
               "QR code to install {name}. In Haminn, choose Scan to add, then scan this code. You can also copy the link below."),
    "how_title": ("怎么安装", "How to install"),
    "how_body": ("每个二维码里就是这个应用自己的安装地址，用 Haminn 扫一下就会进入添加流程；也可以复制下面的地址，在 Haminn 里用“从网址”添加。",
                 "Each code is that app's own install address, so Haminn opens the add flow as soon as it scans it. You can also copy the link below and use Add from URL."),
    "publish_title": ("发布自己的 happ", "Publish your own happ"),
    "publish_body": ("把发布包和 haminn-install.json 放到本站 downloads/happs/<happId>/ 目录，再运行 tools/build-happs-page.py，页面和导航就会更新。",
                     "Drop your release ZIP and haminn-install.json under downloads/happs/<happId>/, then run tools/build-happs-page.py to refresh this page and the navigation."),
}


def pair(key: str, **format: str) -> str:
    """Visible text: both languages, switched by the html lang attribute."""
    zh, en = TEXT[key]
    value_zh = html.escape(zh.format(**format) if format else zh)
    value_en = html.escape(en.format(**format) if format else en)
    return f'<span class="lang-zh">{value_zh}</span><span class="lang-en">{value_en}</span>'


def phrase(key: str, **format: str) -> str:
    """Attribute text: one language only, translated by site.js when listed there."""
    zh, _ = TEXT[key]
    return html.escape(zh.format(**format) if format else zh)


def steps_markup() -> str:
    items = []
    for zh, en in TEXT["steps"]:
        items.append(f"<li><span class=\"lang-zh\">{html.escape(zh)}</span><span class=\"lang-en\">{html.escape(en)}</span></li>")
    return "<ol class=\"qr-steps\">" + "".join(items) + "</ol>"


def load_info(directory: pathlib.Path) -> dict:
    path = directory / "happ-info.json"
    if not path.is_file():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def blurb(info: dict, field: str, fallback: str) -> str:
    value = info.get(field)
    if isinstance(value, dict):
        zh = str(value.get("zh") or fallback)
        en = str(value.get("en") or zh)
    else:
        zh = en = str(value or fallback)
    return f'<span class="lang-zh">{html.escape(zh)}</span><span class="lang-en">{html.escape(en)}</span>'


def read_package_manifest(zip_path: pathlib.Path) -> dict:
    with zipfile.ZipFile(zip_path) as archive:
        return json.loads(archive.read("haminn.json").decode("utf-8"))


def extract_icon(zip_path: pathlib.Path, icon: str | None, directory: pathlib.Path) -> str | None:
    if not icon:
        return None
    suffix = pathlib.Path(icon).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        return None
    target = directory / f"icon{suffix}"
    with zipfile.ZipFile(zip_path) as archive:
        try:
            data = archive.read(icon)
        except KeyError:
            return None
    if not target.is_file() or target.read_bytes() != data:
        target.write_bytes(data)
    return target.name


def render_qr(directory: pathlib.Path, text: str) -> None:
    """Write the card's install code next to the package it installs."""
    subprocess.run(
        [sys.executable, str(MAKE_QR), "--text", text, "--out", str(directory / "install-qr.png")],
        check=True, cwd=str(ROOT),
    )


def card_markup(happ: dict, base_url: str) -> str:
    anchor = "happ-" + happ["happId"].replace(".", "-")
    field_id = "url-" + happ["happId"].replace(".", "-")
    status_id = "copy-" + happ["happId"].replace(".", "-")
    icon = f'<img src="{happ["iconUrl"]}" alt="" width="62" height="62">' if happ["iconUrl"] else ""
    website = ""
    if happ.get("website"):
        website = (f'<a class="button small secondary" href="{html.escape(happ["website"])}">'
                   f'{pair("website")} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>')
    repository = ""
    repository_row = ""
    if happ.get("repository"):
        label = phrase("repository")
        repository = (f'<a class="app-github" href="{html.escape(happ["repository"])}" aria-label="{label}" '
                      f'title="{label}"><i class="fa-brands fa-github" aria-hidden="true"></i>'
                      f'<span>{pair("repository")}</span></a>')
        # The repository button gets its own row under the icon-and-name block,
        # not a seat beside the heading, so the name always stays on one line.
        repository_row = f'\n<p class="app-repo">{repository}</p>'
    return f'''<article class="card happ-card" id="{anchor}">
<div class="app-heading">{icon}<div><div class="app-title-row"><h2>{html.escape(happ["name"])}</h2></div><p>{happ["tagline"]}</p></div></div>{repository_row}
<p class="happ-desc">{happ["description"]}</p>
<div class="qr-install"><img class="qr" src="{happ["qrUrl"]}" alt="{phrase("qr_alt", name=happ["name"])}" width="172" height="172">{steps_markup()}</div>
<p class="fine">{pair("copy_label")}</p><div class="copy-field"><code class="address" id="{field_id}">{html.escape(happ["installUrl"])}</code><button class="button blue small" data-copy="{field_id}" data-status="{status_id}" data-success="{phrase("copied")}"><i class="fa-regular fa-copy" aria-hidden="true"></i><span>{pair("copy")}</span></button></div><p id="{status_id}" class="copy-status" role="status"></p>
<div class="happ-actions"><a class="button small" href="{html.escape(happ["packageUrl"])}" download>{pair("download")}</a>{website}</div>
<p class="fine">{html.escape(happ["happId"])} · {html.escape(happ["version"])}</p>
</article>'''


def page_markup(happs: list[dict]) -> str:
    cards = "\n".join(card_markup(happ, "") for happ in happs)
    empty = "" if happs else '<p class="lead">还没有发布任何 happ。</p>'
    return f'''<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark"><meta name="description" content="扫描二维码，把官方 happ 装进 Haminn。">
<title>应用广场 · Haminn</title>
<link rel="icon" href="/assets/site/haminn-icon-192.png?v={ICON_VERSION}" type="image/png">
<link rel="apple-touch-icon" href="/assets/site/haminn-icon-192.png?v={ICON_VERSION}">
<script src="/assets/site/site.js?v={CSS_VERSION}"></script>
<link rel="stylesheet" href="/assets/vendor/fontawesome/css/all.min.css">
<link rel="stylesheet" href="/assets/site/site.css?v={CSS_VERSION}">
</head><body>
<a class="skip" href="#main">跳到主要内容</a>
<header class="site-header">
<a class="brand" href="/" aria-label="Haminn 首页"><span class="brand-mark"><img src="/assets/site/haminn-icon.webp" alt="" width="38" height="38"></span>haminn<span class="brand-dot">.</span></a>
<nav aria-label="网站导航"><a href="/">认识 Haminn</a><a href="/pages/guide.html">开始使用</a><a href="/pages/faq.html">常见问题</a><a href="{NAV_HREF}">{NAV_LABEL}</a></nav>
<div class="header-tools"><a class="button small" href="/pages/download.html">下载 <i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a><div class="language-switch" id="siteLanguage" role="group" aria-label="选择语言"><button type="button" data-language-choice="zh" aria-pressed="true">中</button><span aria-hidden="true"></span><button type="button" data-language-choice="en" aria-pressed="false">En</button></div><div class="theme-switch" id="siteTheme" role="group" aria-label="选择明暗主题"><button type="button" data-theme-choice="dark" aria-pressed="false" aria-label="深色主题"><i class="fa-regular fa-moon" aria-hidden="true"></i></button><button type="button" data-theme-choice="system" aria-pressed="true" aria-label="跟随系统">Auto</button><button type="button" data-theme-choice="light" aria-pressed="false" aria-label="浅色主题"><i class="fa-regular fa-sun" aria-hidden="true"></i></button></div></div>
</header>
<main id="main">
<section class="page-hero wrap"><p class="eyebrow">{pair("eyebrow")}</p><h1>{pair("title")}</h1><p class="lead">{pair("lead")}</p></section>
<section class="wrap happ-list">
{cards}{empty}
</section>
<article class="wrap prose"><section><h2>{pair("how_title")}</h2><p>{pair("how_body")}</p></section><section><h2>{pair("publish_title")}</h2><p>{pair("publish_body")}</p></section></article>
</main>
<footer class="site-footer"><div><a class="brand" href="/">haminn<span class="brand-dot">.</span></a><p>我的应用，我做主。</p></div><nav aria-label="页脚导航"><a href="/pages/download.html">下载 Haminn</a><a href="/pages/guide.html">开始使用</a><a href="/pages/faq.html">常见问题</a><a href="{NAV_HREF}">{NAV_LABEL}</a><a href="/pages/privacy.html">隐私与数据</a><a href="/pages/donate.html">帮助与反馈</a></nav></footer>
</body></html>
'''


def update_nav() -> None:
    """The shared top bar and footer belong to tools/build-site-nav.py."""
    subprocess.run([sys.executable, str(ROOT / "tools" / "build-site-nav.py")], check=True, cwd=str(ROOT))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://haminn.airen.life", help="public site origin used in install links")
    parser.add_argument("--no-nav", action="store_true", help="only regenerate the page, leave navigation untouched")
    args = parser.parse_args()
    if not HAPPS_ROOT.is_dir():
        raise SystemExit(f"no happ directory: {HAPPS_ROOT}")
    happs = []
    for directory in sorted(path for path in HAPPS_ROOT.iterdir() if path.is_dir()):
        descriptor_path = directory / "haminn-install.json"
        if not descriptor_path.is_file():
            print(f"skip {directory.name}: missing haminn-install.json")
            continue
        descriptor = json.loads(descriptor_path.read_text(encoding="utf-8"))
        package = directory / descriptor["package"]
        if not package.is_file():
            raise SystemExit(f"{directory.name}: package missing: {descriptor['package']}")
        manifest = read_package_manifest(package)
        version = manifest.get("version") or {}
        version_name = str(version.get("name") or "1.0.0")
        info = load_info(directory)
        happ_id = directory.name
        install_url = f"{args.base_url}/downloads/happs/{happ_id}/haminn-install.json"
        render_qr(directory, install_url)
        icon_name = extract_icon(package, manifest.get("icon"), directory)
        happs.append({
            "happId": happ_id,
            "name": str(manifest.get("name") or happ_id),
            "version": version_name,
            "tagline": blurb(info, "tagline", "把喜欢的 AI，放在一起聊。"),
            "description": blurb(info, "description", ""),
            "repository": info.get("repository"),
            "website": info.get("website"),
            "installUrl": install_url,
            "packageUrl": f"{args.base_url}/downloads/happs/{happ_id}/{package.name}",
            "qrUrl": f"/downloads/happs/{happ_id}/install-qr.png",
            "iconUrl": f"/downloads/happs/{happ_id}/{icon_name}" if icon_name else None,
            "order": int(info.get("order") or 100),
        })
        print(f"prepared {happ_id} {version_name}")

    happs.sort(key=lambda item: (item["order"], item["name"]))
    PAGE_PATH.parent.mkdir(parents=True, exist_ok=True)
    PAGE_PATH.write_text(page_markup(happs), encoding="utf-8")
    print(f"wrote {PAGE_PATH} ({len(happs)} happ)")

    if args.no_nav:
        return
    update_nav()


if __name__ == "__main__":
    main()
