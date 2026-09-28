# HaminnWeb 项目开发总则

本仓库同时维护 Haminn 官网与 HaminnApp 内置 HaminnUI。每项任务开始时，先用一句话明确本轮对象、动作和验收点，只处理该边界。开发默认追求最短可验证闭环：快速理解局部代码、完成修改、运行与改动直接相关的必要检查，然后优先同步、刷新并让修改生效。不得因为习惯或形式完整而扩大检查范围、延迟部署或重复已经通过的验证。用户未要求部署时，不执行线上发布、Mutagen flush 或服务器变更；但用户要求开发或调整 HaminnUI 并通过真机查看时，视为已授权执行下文规定的实时开发同步与页面刷新流程。

## 仓库身份与提交边界

- `haminnweb/` 是独立 Git 仓库，唯一规范远程为 `git@github.com:zhyuzh3d/haminnweb.git`；同级 `haminnapp/` 是另一个独立仓库，唯一规范远程为 `git@github.com:zhyuzh3d/haminnapp.git`。共同父目录不是仓库，不得在父目录初始化 Git，也不得把两个目录合并提交、互相嵌套、改作 subtree 或 submodule。
- 同一任务修改两个仓库时，必须分别检查、暂存、提交和推送。每次提交或推送前都必须执行 `git rev-parse --show-toplevel` 与 `git remote get-url origin`，确认顶层目录以 `/haminnweb` 结尾且 `origin` 精确等于 HaminnWeb 远程；不匹配时立即停止，不得猜测或自动改写远程。变更远程、迁移仓库或强制推送必须由用户明确授权。
- 修改归属、跨仓顺序与缺陷处理统一遵循上级 `../AGENTS.md`。本仓库只处理其中判定为官网或 HaminnUI 的部分，不复制第二套跨仓规则。

## 统一术语

- “Haminn 项目”指同一 Codex 项目中的全部内容，包括 `haminnapp`、`haminnweb` 及以后新增的同项目目录；不能用它单指 APK。
- HaminnApp、HaminnAPK、APK 均指 `haminnapp` 目录对应的 Android 宿主应用；HaminnWeb、Web 均指本目录及其中的官网与 HaminnUI。
- HaminnUI、UI、Shell、原生 UI、原生 happ、官方 app 均指 `public/shell/`。它是 HaminnApp 默认加载且具有宿主管理权限的官方 happ。
- happ、WebApp，以及上下文明确指页面应用时的 app，均指 HaminnApp 加载的页面应用。
- “本地 happ / 线上 happ”只描述来源；URL 来源的 happ 即使下载了 ZIP 到手机仍是线上 happ。“本地运行 / 线上实时运行”只描述当前执行方式。实现和文档必须以 `source` 与 `runtimeMode` 分别表达，禁止用一个 `mode` 混合两者。
- 来源不再决定运行能力：有本地 release 才能本地运行，有 `liveUrl` 才能线上实时运行；有 `updateUrl` 才能一键更新，有 `downloadUrl` 才能从原地址重装。每个 happ 都是本机独立实例，来源只作记录。

## 项目职责

- 官网面向普通访问者，负责介绍 HaminnApp、使用指南、下载、隐私和支持。
- HaminnUI 是 HaminnApp 的原生管理界面前端，负责应用库、设置、授权、备份和开发功能的交互；Native 数据、权限、安装和 WebView 生命周期仍由 HaminnApp 持有。
- 官网和 HaminnUI 可以遵循同一品牌语言，但不得共享运行状态、业务逻辑或 Host 权限。

## 目录边界

- `public/` 是唯一公开发布根；Mutagen 只能同步此目录。
- `public/assets/` 统一存放公开静态资源，包括官网资源、公共品牌资源和第三方资源。
- `public/pages/` 存放官网二级页面。
- `public/downloads/` 存放面向用户或 HaminnApp 的版本化发布制品。
- `public/shell/` 是 Shell 唯一可编辑源码及稳定更新清单所在位置。
- `docs/` 存放长期有效的架构、规范和合同；`plans/` 存放阶段性开发计划；`ops/` 存放非公开部署配置；维护脚本出现时放入 `tools/`。
- 仓库根、`AGENTS.md`、`docs/`、`plans/`、`ops/`、`tools/`、隐藏文件和 Git 数据不得进入线上网站根。

## 页面技术基线

- 官网与 Shell 使用原生 HTML、CSS、JavaScript，源文件可直接运行。
- 不引入 React、Vue、Vite、Webpack、转译器、运行时 CDN 或面向页面作者的 Node/npm 前置依赖。
- 维护工具可以使用 Node，但不得把网站运行变成构建产物依赖。
- 核心功能不依赖 GMS、海外 CDN、海外账号、远程字体或运行时下载模块。

## Shell 架构

- `public/shell/core/` 只负责启动、导航、全局状态和弹层调度；`components/` 只放与业务无关的 UI 组件；`features/` 按用户任务组织；`platform/` 是 Host Bridge 唯一入口；`theme/` 统一视觉与交互语言。对应任务开始前再创建具体文件，不预建空目录和样板。
- 组件负责 DOM、状态呈现和语义事件；功能模块负责用例编排；Platform 内的 Host client 是唯一 Bridge 入口。依赖保持单向，组件不得反向依赖功能或 Platform。
- 组件不得直接调用 `haminn.host.*`，不得读取 Native 内部实现，也不得把宿主管理权限扩散到官网代码。
- 组件使用轻量原生 JavaScript 生命周期与事件合同，不依赖第三方 UI 框架。未经兼容性验证，不把 ES Modules、Shadow DOM 或新 Web API 设为唯一运行路径。
- `theme/` 统一管理语义色彩、字体、间距、圆角、层级、动效、深浅主题和安全区域；组件只消费语义 token，不自行定义品牌色和随意数值。
- 统一 UX 状态包括加载、空、成功、失败、取消、禁用和进行中；危险操作必须确认；异步操作必须有明确终态；返回键、焦点、键盘和弹层行为保持一致。
- `bind` 与 `ui.busy` 在操作进行期间会替换按钮自身的子节点（仅在按钮工作态结束时按原引用还原），因此需要随操作更新的文本或状态节点必须放在该按钮之外；在 busy 按钮的子节点里查询元素会得到 null。
- Shell 重构先保持行为等价，再分别修改功能或视觉，不在同一步同时大拆分、重设计和修改 Native 合同。

## 公共资源与 `__haminn` 合同

- 物理资源统一位于 `public/assets/`，不再建立实体 `public/__haminn/` 目录。
- `/__haminn/` 仍是 Haminn 保留 URL：App 内由 Native 网关提供，官网由 Nginx 映射到 `public/assets/` 中对应资源，以兼容现有 APK 和 Shell。
- `__haminn` URL 只用于 Native 认可的公共资源，不得扩展为普通官网素材目录，也不得在服务器物理发布 Native runtime bridge。
- Shell 发布包除 Host 提供的保留资源外必须自包含，不得依赖官网页面目录。

## 源码与制品所有权

- HaminnWeb 的 `public/shell/` 是 Shell HTML/CSS/JS 的语义所有者。
- HaminnApp 的 `app/src/main/assets/store/` 是由工具生成并提交的 APK 内置快照，不允许两边手工修改。
- Host API、安全权限和 APK 构建签名属于 HaminnApp；HaminnWeb 只消费合同和导入已验证的 release APK。
- APK 沿用 `haminn-v<version>-release.apk`；Shell 包使用 `haminnshell-v<versionName>-release.zip`。
- 版本化制品发布后不得覆盖；ZIP、摘要、字节数和 manifest 必须由工具生成并相互校验。
- `/shell/manifest.json` 是现有 APK 依赖的稳定端点；迁移它之前必须先发布兼容客户端。
- 不发布 debug APK，不提交密钥、密码、token、签名材料、私有数据或本地路径配置。

## HaminnUI 实时开发流程

- 本流程适用于 `public/shell/` 及会直接影响 HaminnUI 的公开资源。官网介绍页、下载页、隐私页和纯文档修改不显示在 HaminnApp 中，不得为了形式统一而强行启动开发连接或刷新 APK 页面。
- 本 thread 首次连接 HaminnUI 时确认 HaminnAPK 已开启智能体开发模式，并取得设备实际显示的开发地址与当前六位密码；同一设备的 `serverVersion/runId` 未变化时复用当前连接、能力清单和内存中的认证，不重复 discovery、索要密码或读取完整工具列表。地址、runId 或认证变化后才重新发现。后续每轮先尝试当前 thread 的已认证连接，再读取 helper 管理的本机私密凭据缓存 `~/.config/haminn-agent/<sha256(base)前24位>.json`；缓存 JSON 格式为 `{ "address": "http://设备地址:8766", "password": "六位密码" }`，目录权限必须为 `700`、文件权限必须为 `600`。USB 转发地址优先于局域网地址；缓存连接失败后才通过 ADB 转发重新发现服务，并把新值写回该私密缓存。
- 密码只用于当前开发连接，不得写入 `AGENTS.md`、其他源码、提交、报告、普通日志或 URL；具体地址也不得作为稳定配置写入仓库文档，因其可能随网络变化。设备未开启开发模式、地址不可达、认证失败或缺少 `haminn_reload_shell` 时，必须如实说明阻塞点，不能把服务器文件同步成功当成设备刷新成功。
- 每轮修改只编辑 HaminnWeb 的语义源码并运行与改动直接相关的最小检查。文案修改只核对目标文本与基本 HTML；局部 CSS 只检查语法和相关样式合同；单模块 JavaScript 只做语法检查及真正覆盖该行为的定向测试。不得默认运行完整 `flows.test.cjs`、全站 `check-site.py`、所有发布校验或与改动无关的回归。
- 最小检查通过后立即优先考虑让用户看到结果：确认本轮 `public/` 修改已经完整，再运行 `tools/deploy-public.sh <需核对的 public 相对路径...>`，由脚本校验仓库、远程和既有 Mutagen 单向会话，flush 后只核对指定公开 URL；随后通过开发服务原位刷新 HaminnUI。多文件、多步骤且存在半成品窗口时，在首个编辑前运行 `tools/deploy-public.sh --pause`，整组检查通过后再正常调用脚本恢复并发布，禁止上线中间态。
- 只要本轮修改涉及 `public/shell/` 或会直接影响 HaminnUI 的公开资源，`tools/deploy-public.sh` 同步并核对成功后必须立即调用 `haminn_reload_shell`；默认使用 `strategy: "reload"`，首次刷新或运行模式不确定时传入 `runtimeMode: "online"`，并恢复此前保存的 `page.appState`。刷新未成功或缺少认证时必须明确报告阻塞，不得把同步成功当成界面已生效。
- 修改前若当前 APK 提供 `haminn_get_page_state`，先在 HaminnUI 前台调用它保存 `page.appState`。HaminnUI 是受保护例外：全局开发服务开启且密码授权后可以读取白名单快照，但仍不是可写开发副本；快照不得包含开发密码，APK 也不接受 HaminnUI 任意脚本文本。
- 首次刷新或设备当前不确定是否处于线上实时模式时，调用 `haminn_reload_shell` 并传入 `runtimeMode: "online"`；后续迭代保持当前模式。默认使用 `strategy: "reload"` 在原 WebView 中无缓存刷新，并将此前的 `page.appState` 序列化为 `restoreStateJson`，由 Shell 固定的 `window.haminnDevState.restore(state)` 恢复 tab、滚动位置和仍然可达的弹窗。只有明确需要重建运行时才使用 `strategy: "recreate"`。服务器同步与 MCP 刷新是两个独立验收点，两者都成功后才可通知用户查看和测试。
- 同一 thread 已成功连接并授权同一设备后，后续 HaminnUI 刷新的固定快速路径只有：必要时调用一次 `haminn_get_page_state` 保存现场，然后调用一次 `haminn_reload_shell`。若不需要恢复现场，直接调用 `haminn_reload_shell`；纯 CSS、文案或局部布局修改不得增加其他刷新步骤。
- 普通刷新禁止重复枚举 ADB 设备、重新 discovery、启动 HaminnApp、打开或点击开发页、读取屏幕中的密码、截图、调用浏览器或桌面自动化、重读工具 schema/完整指南、调用 `tools/list`，也禁止刷新后为了形式完整再次读取页面状态。只有连接失效、`runId` 变化、认证失败、设备不在 HaminnUI 前台或用户明确要求视觉验收时，才执行对应的最小诊断。
- 实时迭代默认直接更新线上 Shell 源文件，不因每个微小修改自动升版本、生成发布 ZIP、更新 manifest、同步 HaminnApp 内置快照、构建或安装 APK。只有用户明确要求更新内置版本、APK、正式发布制品，或改动已经形成需要保存的稳定发布节点时，才进入版本化发布流程。
- 除非用户明确要求界面视觉测试，不自动打开浏览器、不截图、不做真机截图、像素对比或主观视觉验收。默认由用户在刷新后的设备上直接查看效果；MCP 返回刷新已调度只证明刷新请求被接受，不能擅自宣称视觉效果已经通过验收。

## 高效发布路径

- 官网或现有 Host 合同内的 HaminnUI 小改：只做改动文件的语法/DOM 检查，调用 `tools/deploy-public.sh` 增量同步并核对目标 URL，随后自动执行一次 `haminn_reload_shell` 的 `strategy: "reload"` 刷新。不升版本、不打 ZIP、不碰 HaminnApp。
- 正式 Shell 发布：代码冻结后一次性确定版本，运行 `tools/package-shell.py --version <version> --code <code>`，再执行直接相关检查、增量部署和 manifest/ZIP 核对。版本化 ZIP 生成后不得因无关修改重复打包。
- APK 内置 Shell 更新：先完成并验证正式 Shell 发布，再到 HaminnApp 运行同步脚本和一次 APK 构建安装。本仓库不运行 Gradle，也不直接写 `app/src/main/assets/store/`。
- 发布失败只重试失败阶段。源码未变化时不重复语法测试，公开文件未变化时不重复 flush，manifest/ZIP 未变化时不重复打包；只有正式发布才运行全站和完整制品校验。

## 工作与验证规则

- 默认执行“理解边界 → 最少必要分析 → 修改目标 → 直接相关检查”。
- 测试必须由改动风险驱动。文档修改只做差异和格式检查；纯文案不跑业务流程；局部布局只检查相关 CSS/DOM；Host 方法变更才检查 Host 白名单与 Native 合同；manifest、ZIP、APK 或下载元数据变化才运行对应发布制品校验。
- 用户未明确要求时，不做完整测试套件、全站审计、Android 构建、设备矩阵、浏览器视觉验收或重复通过的检查。已确认缺陷按上级规则直接修复；仅有疑点时报告证据并询问。HaminnUI 真机实时开发按上节约定尽快执行服务器同步与页面刷新。
- 修改完成后的默认决策顺序是：能否用一次定向检查确认风险；能否立即同步目标文件；能否使用 `strategy: "reload"` 原位刷新并恢复页面状态。只有这三个步骤不足以证明本轮技术正确性时，才逐级增加测试或改用重建 WebView。
- 修改 `public/` 前确认不会把半成品自动上线；需要部署时，先核对 Mutagen Alpha 精确指向 `public/`。
- 部署后检查公开 URL、manifest/制品摘要以及内部路径 404。保留用户已有修改，不清理或覆盖无关文件。
