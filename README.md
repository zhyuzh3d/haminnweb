# HaminnWeb

Haminn 的官网与 HaminnUI 官方管理页面，使用可直接运行的原生 HTML、CSS 和 JavaScript，无前端框架、远程字体或运行时 CDN。

官网入口是 `public/index.html`，HaminnUI 入口是 `public/shell/index.html`。只有 HaminnApp 中的官方管理页面可以使用 Host 能力；普通浏览器显示连接说明，并可阅读本站指南与下载 APK。

`public/` 同时发布两个 happ 的产品站点：`public/chataxi/` 对应 `https://chataxi.airen.life`，`public/hamdraw/` 对应 `https://hamdraw.airen.life`。三个站点共用 `public/assets/site/` 的版式、样式与脚本，各自的品牌标记、导航项和各站主题色由 `tools/build-site-nav.py` 从同一张配置表生成，页面里的头部与页脚不要手写。

开发前阅读 `AGENTS.md`，架构、数据边界、模块职责与上线流程见 [架构说明](docs/architecture.md)。`public/` 是唯一发布根，维护文档、脚本和运维配置不公开。

检查：

```sh
python3 tools/build-site-nav.py --check           # 10 个页面的头尾与各站主题色是否与配置表一致
python3 tools/check-site.py --host-source ../haminnapp/app/src/main/java/io/github/zhyuzh3d/haminn/MainActivity.kt
python3 tools/check-bilingual.py                  # 中英双份文案契约
python3 tools/make-brand-logos.py --check         # 品牌图标本地化资源是否齐全
HAMINN_DOM_MODULE=/path/to/test-only/linkedom node --test tools/flows.test.cjs
```

页面不允许在运行时请求第三方资源，所以品牌商标统一由 `tools/make-brand-logos.py` 一次性取回并落在 `public/assets/site/brands/`：矢量标记原样落盘（Grok、ElevenLabs、Qwen、Gemini、Claude、Ollama、LM Studio、Hugging Face、Mistral、ByteDance、ComfyUI），位图标记统一裁成透明底正方形并转成 96px WebP（fal.ai、Black Forest Labs、Codex、WorkBuddy）。Font Awesome 里已有的品牌（OpenAI 等）直接用字体图标，不另外存图。新增品牌时只改脚本里的 `SOURCES`/`LOCAL` 表再重跑，不要手工往目录里丢图。

DOM 测试需要维护者环境中的 linkedom，页面作者和运行环境不需要 Node/npm。静态站点可使用任何普通 HTTP 文件服务查看；这不会模拟手机能力。

Shell 发布前修改 `core/runtime.js` 与 HTML 中的 UI 版本，然后使用新版本与递增版本码归档：

```sh
python3 tools/package-shell.py --version <new-version> --code <next-code>
python3 tools/check-site.py --release
```

归档工具拒绝覆盖已有版本。部署须遵循项目总则，先确认同步方向和公开根，部署后核对清单、ZIP/APK 摘要及内部目录 404。官网上线与 APK 真机更新是独立交付。
