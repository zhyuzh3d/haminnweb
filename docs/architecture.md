# HaminnWeb 架构与维护

HaminnWeb 同时维护官网与 HaminnUI。官网负责介绍、下载、指南、隐私与支持；`public/shell/` 是 HaminnApp 默认加载的官方管理 happ，拥有宿主管理权限。两者共享品牌语言，不共享运行状态或 Host 权限。

## 公开边界

`public/` 是唯一发布根。`assets/site/` 是官网样式、脚本和品牌资源，`assets/vendor/` 保存已锁定的第三方资源，`pages/` 是指南、下载、隐私和支持页面，`downloads/` 保存不可覆盖的版本化 APK 与 Shell ZIP。`docs/`、`plans/`、`tools/`、`ops/` 和 Git 数据不公开。

`/__haminn/` 是保留 URL 空间，不能建立实体目录或放置 Native Bridge。App 内由 Native 网关提供；官网 Nginx 将已有 Font Awesome URL 映射到 `assets/vendor/fontawesome/`。Shell 除此项 Host 公共资源外自包含。

HaminnWeb 与 HaminnApp 是独立仓库，分别对应 `git@github.com:zhyuzh3d/haminnweb.git` 与 `git@github.com:zhyuzh3d/haminnapp.git`。父目录不建立仓库，不交叉提交。

## 官网

所有页面均为可直接访问的 HTML。`assets/site/site.css` 统一品牌、布局、移动端、深浅主题、焦点与减少动效偏好。页面导航和主要内容无需 JavaScript；`site.js` 仅增强下载页的校验值复制，剪贴板不可用时保留可选中文字。

首页引导到下载与指南，指南覆盖添加、使用、来源/运行、数据与开发。下载页公开已验证的 APK，元数据位于 `downloads/android.json`。`pages/donate.html` 保留现有宿主支持端点，提供帮助和项目反馈；目前没有官方收款入口。

## HaminnUI 模块

`index.html` 使用按依赖顺序加载的传统脚本，不要求 ES Modules、Shadow DOM、框架或编译。源文件就是运行文件。

| 位置 | 职责 |
| --- | --- |
| `core/runtime.js` | 兼容性补充、DOM 查询、版本与全局 UI 状态 |
| `platform/host.js` | 唯一 Bridge 调用入口、允许的方法集合、就绪判断与错误适配 |
| `components/ui.js` | 提示、进行中状态、确认、弹层栈、焦点和关闭协商 |
| `core/navigation.js` | 导航、独立视图缓存、滚动与 Native 返回键 |
| `features/library.js` | 应用读取、收藏、搜索、来源筛选、启动与桌面快捷方式 |
| `features/install.js` | 文件夹、网址、扫码和 ZIP 导入 |
| `features/app-settings.js` | 顺序保存变更，报告已成功字段和失败边界 |
| `features/manage.js` | 编辑草稿、地址、运行、授权、代码版本、备份与卸载 |
| `features/development.js` | 全局智能体开发、单应用连接及受限轮询 |
| `features/settings.js` | 外观、界面版本/运行方式、诊断、许可与支持 |
| `features/icons.js` | 延迟加载本地图标目录、搜索与复制 |
| `core/app.js` | 启动、连接状态、读取失败与重试 |
| `theme/` | 语义 token、深浅主题、响应式布局与交互样式 |

`window.HaminnShell` 是这些传统脚本之间的内部组合接口，不能作为普通 happ 的公开 API。组件不调用 Platform，也不直接调用业务功能；关闭时的草稿确认由 Core 注册协商函数。Host client 不保存业务数据或凭据，不替代 Native 权限和参数校验。

`store.css` 保留为样式入口，导入 theme 文件。原 `store.js` 仅保留迁移说明，不再是行为入口；当前脚本顺序以 `index.html` 为准。图标目录只在进入图标页时加载。

## 用户流程与状态

主导航保持收藏、全部、开发、设置、支持。桌面布局使用左侧导航，手机使用底部导航；各视图都显示标题与用途。应用管理按运行、地址与更新、能力、授权、版本、开发和数据组织，保存按钮固定在弹层底部。

`source` 只表达来源，`runtimeMode` 只表达运行方式。本地代码、实时地址、更新地址、下载地址各自决定相应能力，不能由来源推断。线上来源下载后仍然是线上来源；本地来源如果有实时地址也可以实时运行。Origin 按完整 URL 推导，不把不同路径解释成隔离。

每次进入视图读取 Native 当前数据；搜索、筛选、滚动等非敏感状态单独缓存。开发密码、令牌、Host 状态和用户业务数据不进本地 UI 缓存。应用读取有请求序号，较早请求不能覆盖较新响应。开发状态仅在开发页可见且宿主就绪时轮询。

启动时应用库和可选状态分别处理。诊断、开发状态或版本读取失败不能让已加载的应用库整体失败。没有 Host 的普通浏览器显示安装与指南入口，不伪造应用或永久等待。

异步操作锁定发起弹层中的控件，阻止重复操作并保留明确终态。取消、失败和成功使用不同提示。危险清除必须再次确认；未保存修改关闭时可保留草稿。弹层栈同时管理视觉层级、ARIA、返回键与焦点。

当前 Native 没有一次性保存全部应用字段的事务 API。前端只提交变化字段；中途失败会明确列出已保存字段，重新读取实际状态并保留其余草稿。不得把这条多步流程描述成原子保存。

## 版本与制品

当前 Web 交付为 HaminnUI `1.9.7`（清单版本码 `14`），官网提供现有正式 HaminnApp `1.8.0`（APK versionCode `13`）。APK 与 UI 分别版本化，不要求同步版本号。

`tools/package-shell.py` 只做确定性 ZIP 归档，不构建页面。发布包包含完整脚本、样式与资源，不能依赖官网页面目录。ZIP 中不包含 manifest，避免摘要循环；稳定 `/shell/manifest.json` 在包外记录版本、包路径、字节数与 SHA-256。`shell/shell.zip` 保留为兼容副本。所有版本化 ZIP/APK 禁止覆盖。

HaminnWeb 是 Shell 唯一语义源码，HaminnApp 的 `app/src/main/assets/store/` 是生成快照。APK 快照同步必须递归包含这些模块；使用 HaminnApp 的 `node tools/sync-shell-assets.mjs`，不手工双写。先发布可访问的线上版本，再同步更高版本的 APK 内置快照。生成快照不等于生成或交付新 APK。

## 检查与上线

`python3 tools/check-site.py` 检查 HTML 结构、ID、ARIA 引用、本地链接/资源、JS 语法、Shell DOM 引用、Host 适配边界和 APK 摘要。可加 `--host-source` 指向 HaminnApp 的 MainActivity，直接核对真实 Host dispatcher。加 `--release` 检查 manifest、ZIP 摘要、字节数和全部归档文件与源码一致。

`tools/flows.test.cjs` 使用测试环境的 linkedom 做 DOM 与 Host 合同回归，覆盖启动失败、竞态、独立视图缓存、ZIP 取消、部分保存、草稿、备份和卸载。它不是浏览器视觉或真机验收；linkedom 不是网站运行依赖。

编辑 `public/` 前暂停发布同步。部署前核对 `haminnweb-public-sync`：Alpha 精确指向本仓库 `public/`，方向为 One Way Replica，Beta 为现有站点目录，文件/目录权限适合 Nginx。通过检查后 resume / flush，确认 Watching for changes，再核对公开页面、所有发布资源、manifest/ZIP/APK 摘要和内部路径 404。

签名清单、Native 更新事务或运行策略的进一步调整属于 HaminnApp 合同变更，不能通过前端代码伪装已实现。本轮保持现有清单与 HTTPS 更新合同。
