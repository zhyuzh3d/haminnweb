(() => {
  "use strict";
  const themeKey = "haminn-site-theme";
  const languageKey = "haminn-site-language";
  // haminn.airen.life, chataxi.airen.life and hamdraw.airen.life are three
  // separate origins, so localStorage alone cannot carry a language choice from
  // one site to the next. A first-party cookie scoped to the parent domain can.
  // localStorage stays as the per-origin record and the offline fallback.
  const languageCookie = "haminn-language";
  const languageChoices = ["auto", "zh", "en"];
  const validThemes = ["dark", "system", "light"];
  const setting = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } };
  const readCookie = () => {
    try {
      const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + languageCookie + "=([^;]*)"));
      return match ? decodeURIComponent(match[1]) : "";
    } catch (_) { return ""; }
  };
  const writeCookie = value => {
    try {
      const host = location.hostname;
      // The Domain attribute is only accepted on the sites themselves; a local
      // preview keeps a host-only cookie so it still works.
      const domain = host === "airen.life" || host.endsWith(".airen.life") ? "; Domain=.airen.life" : "";
      document.cookie = languageCookie + "=" + encodeURIComponent(value) + "; Path=/; Max-Age=31536000; SameSite=Lax" + domain;
    } catch (_) {}
  };
  // `auto` follows the visitor: Chinese when the browser's first language
  // preference is Chinese, English otherwise.
  const detectLanguage = () => {
    const list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    return String(list[0] || "").toLowerCase().indexOf("zh") === 0 ? "zh" : "en";
  };
  let theme = setting(themeKey, "system");
  let languageChoice = readCookie() || setting(languageKey, "auto");
  if (!languageChoices.includes(languageChoice)) languageChoice = "auto";
  let language = languageChoice === "auto" ? detectLanguage() : languageChoice;
  if (!validThemes.includes(theme)) theme = "system";
  const setTheme = value => {
    if (value === "dark" || value === "light") document.documentElement.dataset.theme = value;
    else document.documentElement.removeAttribute("data-theme");
  };
  setTheme(theme);
  // Resolved here rather than on DOMContentLoaded: this script sits in <head>,
  // so the language spans are already correct on the first paint instead of
  // flashing Chinese at an English visitor.
  document.documentElement.lang = language === "en" ? "en" : "zh-CN";

  const EN = Object.fromEntries([
    ["跳到主要内容", "Skip to main content"], ["Haminn 首页", "Haminn home"], ["网站导航", "Site navigation"], ["页脚导航", "Footer navigation"],
    ["认识 Haminn", "Why Haminn"], ["开始使用", "Get started"], ["常见问题", "FAQ"], ["下载", "Download"], ["下载 Haminn", "Get Haminn"],
    ["应用广场", "Happ gallery"], ["官方应用", "Official apps"], ["产品网站", "Product site"],
    ["Chataxi 网站", "Chataxi site"], ["HamDraw 网站", "HamDraw site"], ["PoseGi 网站", "PoseGi site"],
    ["隐私与数据", "Privacy & Data"], ["帮助与反馈", "Help & Feedback"], ["我的应用，我做主。", "My software. My way."],

    ["欢迎来到自己的软件时代", "Welcome to software on your terms"], ["你的软件，", "Your software."], ["你说了算。", "Your rules."],
    ["先用上喜欢的应用。想换个界面、加个功能，或做一个全新的小工具？告诉 AI，让软件适应你的生活。", "Start with an app you love. Change the look, add what’s missing, or create something new from scratch—just tell AI what you want. Your software should adapt to you."],
    ["马上开始", "Start now"], ["适用于 Android 10 及以上手机", "Android 10 or later"], ["为我而用。", "Made for me."], ["把喜欢的，都放在这里。", "Everything I need, all in one place."],
    ["和 AI 聊天，也和灵感碰面", "Chat with AI. Follow the spark."], ["我的今日清单", "Today’s priorities"], ["只留下今天最重要的事", "Only what matters today"],
    ["阳台小花园", "My balcony garden"], ["记住每一株的喜好", "Remember what each plant needs"], ["换成我喜欢的颜色", "Use my favorite colors"],
    ["再加一个浇水提醒", "Add a watering reminder"], ["个性化应用创意示意", "One idea for a personalized app"],
    ["从“有什么用什么”，到“想要什么就做什么”", "Stop settling for what ships. Start making what fits."], ["让软件合你心意。", "Software that fits the way you live."],
    ["不必每次都等官方更新。借助 AI，你可以改造自己的应用，也可以从一个小想法开始。", "No more waiting for a vendor to add the feature you need. With AI, you can reshape an app—or build a new one around a simple idea."],
    ["先用起来", "Start with something useful"], ["安装 Haminn，再添加喜欢的应用。打开就像日常使用手机软件一样自然。", "Install Haminn, add an app, and use it like any other app on your phone."],
    ["改成喜欢的样子", "Make it yours"], ["字体大一点，按钮少一点，功能更顺手一点。把想法告诉你的 AI 助手。", "Bigger type. Fewer buttons. A feature that works the way you do. Tell your AI coding agent what to change."],
    ["扫一扫，分享给身边的人", "Share it with a scan"], ["在应用卡片点“分享”，另一台手机用 Haminn 扫码确认，就能安装同一个 happ。", "Tap “Share” on the app card. A friend can scan the QR code in Haminn, review the details, and install their own copy."],
    ["第一个应用,从 Chataxi 开始。", "Start with Chataxi."], ["安装 Haminn 后扫码添加即可。也可以先看它们各自的网站:Chataxi 做多角色群聊与流式语音,HamDraw 做随手涂鸦,实时成图,PoseGi 做 3D 摆姿生图。", "Install Haminn and scan to add. You can also visit their own sites first: Chataxi for multi-role group chat with streaming speech, HamDraw for real-time doodle-to-image, and PoseGi for 3D posing."],
    ["去安装第一个应用", "Add your first app"], ["你说想法，AI 帮你实现", "Bring the idea. AI helps you build it."],
    ["想怎么改，", "Want it different?"], ["就跟它说。", "Just ask."], ["在 Haminn 开启开发模式，连接你熟悉的智能体。接下来，用平常说话的方式描述你的需要。", "Turn on Development Mode in Haminn and connect Codex or WorkBuddy. Then describe what you want in your own words."],
    ["访问官网", "Open website"], ["看看怎么连接", "How to connect"], ["一个小小的改变，就更适合自己", "Small changes. A much better fit."],
    ["“我想给爸妈用。字放大一点，首页只留三个常用按钮。”", "“I’m making this for my parents. Make the text larger and keep just three everyday actions on the home screen.”"],
    ["你的习惯，可以成为软件的样子。", "Your software can reflect the way you live."], ["从界面到功能，一点点调整，边用边发现更好的想法。", "Tune the design and features as you use them. Each improvement starts with something you notice."],
    ["从 Vibe Coding 到 Vibe Programming", "From vibe coding to Vibe Programming"], ["Vibe Coding 已经过时", "Vibe coding isn’t enough"], ["进入", "Welcome to"], ["时代。", "."],
    ["不只和 AI 写代码，而是把完整应用做出来、安装部署、真正用起来。", "The goal isn’t to produce code. It’s to ship a complete app: built, installed, deployed, and used in real life."],
    ["做出完整应用", "Build a complete app"], ["从想法到可以运行的界面和功能。", "Turn an idea into a working product, with the interface and features it needs."],
    ["完成安装部署", "Install and ship"], ["把应用安装到设备，部署到真实环境。", "Put it on a real device and deploy it where it will actually run."],
    ["进入真实使用", "Use it for real"], ["让它进入每天的生活，再持续改进。", "Let it earn a place in your daily life—and keep improving it."],
    ["我们相信的 Vibe Programming", "Vibe Programming, the Haminn way"], ["想出来。做出来。", "Imagine it. Build it."], ["真正用起来。", "Put it to work."],
    ["你的想法，值得成为一个应用。", "Your idea deserves to become something you can use."], ["和 AI 一起创造的乐趣，不只在对话里。让做好的软件出现在手机上，每天帮上忙，再随着你的生活慢慢变好。", "The point of creating with AI isn’t the chat or the code. It’s having software on your phone that helps every day—and evolves with you."],
    ["从今天起，软件也可以为你而变。", "Software can finally adapt to you."], ["从一个应用开始，把更多可能留给自己。", "Start with one app. Keep the possibilities open."], ["看看怎么玩", "See how it works"],

    ["先用起来，其他慢慢来", "Start simple. Go deeper when you’re ready."], ["两步，开始用。", "Two steps. That’s it."],
    ["Haminn 是装应用的地方。先安装 Haminn，再添加一个应用，就有得玩了。", "Haminn is a home for the apps you choose and create. Install Haminn, add one app, and you’re ready."],
    ["01 · 安装 Haminn", "01 · Install Haminn"], ["给应用一个家。", "Give your apps a home."], ["用 Android 手机下载安装，完成后打开 Haminn。", "Download Haminn on your Android phone, install it, and open the app."],
    ["Android 10 及以上 · 已安装？直接看第二步。", "Android 10 or later · Already have Haminn? Skip to step 2."], ["02 · 添加第一个应用", "02 · Add your first app"],
    ["试试 Chataxi", "Try Chataxi"], ["把喜欢的 AI，放在一起聊。", "Chat with all your favorite AI models in one place."], ["打开 Haminn，点", "Open Haminn and tap"],
    ["“扫码添加”", "“Scan to add”"], ["扫描这个二维码，确认安装。", "Scan this QR code, then review and confirm the install."], ["点开 Chataxi，就能开始设置。", "Open Chataxi and follow the setup."],
    ["正在这台手机上看？复制地址，回到 Haminn 点“从网址”。", "Viewing this page on the same phone? Copy the link, switch back to Haminn, and choose “From URL.”"],
    ["复制地址", "Copy link"], ["已复制。回到 Haminn，点“从网址”粘贴即可。", "Copied. Switch back to Haminn, choose “From URL,” and paste the link."],
    ["首次聊天需连接自己的 AI 服务。", "To start chatting, connect your preferred AI provider."], ["怎么连接？", "How does that work?"],
    ["玩熟了，再让它更懂你", "Once it feels familiar, make it yours"], ["想改哪里，", "Want something different?"], ["直接告诉 AI。", "Tell AI what to change."],
    ["换个颜色、调整布局、增加一个功能。让你熟悉的智能体帮忙做。", "Change the colors, rethink the layout, add a feature—your AI coding agent can handle the implementation."],
    ["手机和电脑连上同一个 Wi-Fi。", "Connect your phone and computer to the same Wi-Fi network."], ["在 Haminn 的", "In Haminn, open the"], ["“开发”", "“Development”"], ["页开启开发模式。", "tab and turn on Development Mode."],
    ["把页面显示的", "Copy the"], ["地址和密码", "address and password"], ["发给电脑上的 Codex 或 WorkBuddy，请它连接。", "shown on screen into Codex or WorkBuddy on your computer, then ask it to connect."],
    ["“帮我把 Chataxi 的文字放大一些，再换成我喜欢的紫色。”", "“Make the text in Chataxi larger, and switch the accent color to my favorite shade of purple.”"],
    ["连接后，想改什么就继续说。做完回到手机里试一试。", "Once connected, keep describing the changes you want. Try each version on your phone and refine it from there."], ["连接遇到问题？", "Having trouble connecting?"],
    ["没有合适的？做一个自己的", "Can’t find the right app? Make your own."], ["从一个小心愿开始。", "Start with one small need."],
    ["不用一次想得很完整。先说你想解决的那件小事，做出来试试，再一点点变成最合你心意的样子。", "You don’t need a perfect spec. Start with one everyday problem, try the first version, and shape it around what actually works for you."],
    ["为家人做个大字记事本", "A large-type notes app for a family member"], ["给花草安排浇水提醒", "Watering reminders for my plants"], ["做一份自己的旅行清单", "A travel checklist that works my way"],
    ["说一说，试一试，再改一改。", "Describe it. Try it. Refine it."], ["告诉 AI：“帮我做一个旅行清单，可以按行程分组，出发前一项项打勾。做好后放进 Haminn。”", "Tell AI: “Build me a travel checklist organized by trip, with items I can tick off before I leave. When it’s ready, install it in Haminn.”"],
    ["在手机上用一遍，把不顺手的地方告诉它。喜欢了，就能在 Haminn 里直接分享给身边的人。", "Use it on your phone. Tell AI what feels off, then keep improving it. Once you love it, share it with someone nearby—right from Haminn."],
    ["更多关于创作的问答", "More about creating apps"], ["不用一次学会所有事情。", "You don’t have to learn everything today."], ["先把第一个应用装好。需要时，再来找答案。", "Install your first app. Come back whenever you need the next answer."], ["查看常见问题", "Browse the FAQ"],
    ["把好用的，传给身边的人", "Pass a great app along"], ["扫一扫，另一台手机也能装。", "One scan. One more phone ready to go."],
    ["两台手机都装好 Haminn，连接同一个 Wi-Fi，或让一台手机开启热点，就能直接把 happ 传过去。", "Install Haminn on both phones, then put them on the same Wi-Fi network—or connect one to the other’s hotspot. You can transfer the app directly."],
    ["三步就好。", "It only takes three steps."], ["在要分享的手机上，找到 happ 并点“分享”。", "On the phone with the app, open its card and tap “Share.”"],
    ["另一台手机打开 Haminn，点“扫码添加”。", "On the other phone, open Haminn and choose “Scan to add.”"], ["扫描二维码，查看应用信息并确认安装。", "Scan the QR code, review the app details, and confirm the install."],
    ["分享只包含应用本身，不会带上你的使用数据、登录状态、权限或开发连接信息。没有可用的局域网时，也可以保存或发送安装包。", "Only the app is shared. Your data, sign-ins, permissions, and Development Mode details stay on your phone. No local network? Save the install package or send it through Android’s share sheet."],

    ["把喜欢的应用，装进生活", "Bring better apps into everyday life"], ["你的应用，从这里开始。", "Your next app starts here."], ["给手机添一个新入口，让软件有更多属于你的可能。", "Give your phone a home for software you can actually make your own."],
    ["Android 版 · 1.12.7", "Android · 1.12.7"], ["适用于 Android 10 及以上手机。无需 Google Play 服务。", "Works on Android 10 or later. No Google Play services required."],
    ["下载 Android 安装包 · 3.2 MB", "Download for Android · 3.2 MB"], ["下载完成后，点击文件，按手机提示安装。", "When the download finishes, open the file and follow Android’s prompts."], ["正在手机上查看？下载完成后，点击文件并按提示安装。", "On your phone? When the download finishes, open the file and follow Android’s prompts."], ["遇到安装提示？", "Need help with the install?"],
    ["Haminn Android 安装包下载二维码", "QR code to download Haminn for Android"], ["用手机扫码下载", "Scan to download"], ["正在电脑上查看？打开手机相机扫描。", "On a computer? Scan with your phone’s camera."],
    ["装好了？再加一个应用。", "Haminn is installed. What’s next?"], ["Haminn 安装完成后，还需要添加你想用的软件。我们准备了 Chataxi，扫码就能添加。", "Haminn is the home; now add an app to use. Start with Chataxi—scan once and it’s ready to install."],
    ["去安装 Chataxi", "Get Chataxi"], ["已经在用 Haminn？日常界面更新可以直接在应用内完成。", "Already use Haminn? You can update its everyday interface from inside the app."], ["了解更新", "How updates work"],

    ["遇到问题，来这里找答案", "Answers when you need them"], ["有疑问？慢慢看。", "Questions? Start here."], ["刚开始用，或想再多玩一点，都可以从一个问题开始。", "Whether you’re setting up your first app or exploring what’s possible, find the answer that matches what you’re trying to do."],
    ["安装与上手", "Getting started"], ["日常使用", "Using Haminn"], ["AI 与定制", "Create & customize"], ["或", "or"], ["任何支持 MCP 的智能体都可以", "any MCP-capable agent works"], ["深入了解", "Technical details"], ["想深入了解", "Under the hood"], ["问题分类", "Browse by topic"], ["查找你的问题", "Search the FAQ"],
    ["Haminn 和里面的应用是什么关系？", "What’s the difference between Haminn and the apps inside it?"], ["Haminn 是手机上用来安装和打开应用的地方。里面的应用叫 happ，可以是 AI 聊天工具、清单、记事本，或为自己做的小工具。先安装 Haminn，再添加 happ，就能开始用。", "Haminn is the app that installs and opens your personal software. Apps inside Haminn are called happs. A happ might be an AI chat app, a list, a notebook, or a tool made just for you. Install Haminn, add a happ, and you’re ready."],
    ["下载后怎么安装？手机提示“未知来源”怎么办？", "How do I install Haminn if Android warns about unknown apps?"], ["点击下载完成的 APK 文件，按手机提示安装。如果系统要求，允许这次用于下载的浏览器或文件管理器安装应用。安装完成后可以关闭这项权限。Haminn 适用于 Android 10 及以上设备。", "Open the APK you downloaded and follow Android’s prompts. If asked, allow installs from the browser or file manager you used, then turn that permission off again after Haminn is installed. Haminn requires Android 10 or later."],
    ["支持 iPhone 吗？需要 Google Play 吗？", "Does Haminn work on iPhone? Does it need Google Play?"], ["目前提供 Android 版，iPhone 暂不支持。Haminn 的安装和核心使用不需要 Google Play 服务，具体应用所需的网络服务由该应用决定。", "Haminn is currently available for Android, not iPhone. It does not depend on Google Play services. Individual apps may still need their own online services."],
    ["安装后怎么是空的？", "Why is Haminn empty after installation?"], ["这是正常的，你还需要添加一个 happ。在 Haminn 中点“扫码添加”或“从网址”，就可以安装应用。", "That’s expected. Haminn is the home; you choose what goes inside it. Tap “Scan to add” or “From URL” to install your first happ."], ["先试试 Chataxi", "Try Chataxi first"],
    ["网页和 Haminn 都在同一台手机上，怎么扫码？", "How can I scan the code if I’m viewing this page on the same phone?"], ["不用扫码。在", "You don’t need to scan. On the"], ["入门页", "Get Started page"], ["点“复制地址”，回到 Haminn 点“从网址”，粘贴并确认。无法复制时，也可以长按地址手动复制。", "choose “Copy link,” switch back to Haminn, tap “From URL,” paste, and confirm. If copying doesn’t work, press and hold the link to copy it manually."],
    ["Chataxi 装好了，为什么还不能聊天？", "I installed Chataxi. Why can’t I chat yet?"], ["Chataxi 用来连接你选择的 AI 模型，本身不附送模型服务或额度。打开后按应用中的连接引导添加服务，填入服务商提供的 API 密钥并选择模型，再创建角色开始聊天。网络和费用以你选择的服务为准。", "Chataxi connects to an AI provider you choose; model access and usage credits are not included. Follow the in-app setup to add a provider, enter its API key, choose a model, and create a character. Availability and cost depend on your provider."], ["密钥只填写在 Chataxi 的服务配置中，不要放进问题反馈或分享给其他人。", "Enter API keys only in Chataxi’s provider settings. Never include them in feedback or share them with anyone."],
    ["Haminn 和应用怎么更新？", "How do updates work?"], ["Haminn 的管理界面已包含在安装包内。需要更新界面时，在 Haminn“设置”中点“更新本地版本”即可，无需单独下载界面包。", "Haminn’s management interface is built into the app. When an interface update is available, open Settings and choose “Update local version.” There’s no separate UI package to download."],
    ["你安装的 happ 有更新地址时，可以在应用管理中检查更新。需要升级 HaminnApp 本身时，从", "When an installed happ includes an update URL, check for updates from App management. To update Haminn itself, download the latest APK from the"], ["下载页", "Download page"], ["获取新版 APK 并覆盖安装。", "and install it over your current version."],
    ["可以把常用应用放到桌面吗？", "Can I add an app to my home screen?"], ["可以。在 Haminn 中找到应用，使用添加到桌面的入口，按系统提示确认。也可以点亮爱心，放进 Haminn 的收藏。", "Yes. Open the app in Haminn, choose “Add to Home screen,” and confirm Android’s prompt. Tap the heart to add it to Favorites inside Haminn."],
    ["没有网络还能用吗？", "Do apps work offline?"], ["取决于应用。安装到本机的应用可以从本地打开；离线清单、笔记等可以由作者做成无需联网。AI 聊天、在线内容和其他服务器功能仍需要网络。", "It depends on the app. Installed code can open locally, and apps such as lists or notebooks can be designed to work entirely offline. AI chat, live content, and other server-backed features still need a connection."],
    ["怎么把 happ 分享到另一台手机？", "How do I send an app to another phone?"], ["先让两台手机都安装 Haminn，并连接同一个 Wi-Fi；也可以由一台手机开启热点。分享方在应用卡片点“分享”，另一台手机在 Haminn 点“扫码添加”，扫描二维码并查看应用信息后确认安装。", "Install Haminn on both phones and connect them to the same Wi-Fi network—or use one phone’s hotspot. On the sending phone, tap “Share” on the app card. On the other phone, choose “Scan to add,” scan the code, review the details, and confirm."],
    ["分享只包含可安装的应用本身，不会带上使用数据、Cookie、登录状态、文件、应用授权或开发连接信息。没有可用的局域网时，可以在分享页保存安装包或通过系统分享发送。分享他人的作品前，请遵守原作者的许可。", "Only the installable app is shared. Your data, cookies, sign-ins, files, permissions, and Development Mode details stay behind. If there’s no local network, save the install package or send it with Android’s share sheet. Make sure you have permission to share someone else’s work."],
    ["怎么备份？换手机会丢失内容吗？", "How do backups work when I switch phones?"], ["在应用管理里导出应用备份，再在新设备的 Haminn 设置中恢复。备份可以保存代码、Haminn 数据和附件，但不包括网页的 Cookie 和登录状态。备份默认不加密，请妥善保存。", "Export a backup from App management, then restore it from Haminn Settings on the new phone. A backup can include app code, Haminn data, and attachments, but not website cookies or sign-in sessions. Backups are not encrypted by default, so keep them somewhere secure."],
    ["为什么会请求相机、麦克风或通知权限？", "Why is Haminn asking for camera, microphone, or notification access?"], ["扫描、录音、提醒等功能需要对应能力。Android 系统权限与每个 happ 的授权分别生效，你可以按实际需要允许，并在应用管理中查看或重置。", "Features such as scanning, recording, and reminders need those capabilities. Android permissions and Haminn’s per-app permissions are separate. Grant only what you need; review or reset access from App management at any time."], ["了解数据与权限", "About data and permissions"],

    ["怎么把 Codex 或 WorkBuddy 连到手机？", "How do I connect Codex or WorkBuddy to my phone?"], ["让手机与电脑连接同一个可信 Wi-Fi，在 Haminn 的“开发”页开启开发模式。把当前显示的地址和密码交给你信任的电脑智能体，请它打开地址并按连接说明接入。", "Connect your phone and computer to the same trusted Wi-Fi network. In Haminn, open the Development tab and turn on Development Mode. Give the displayed address and password to the AI coding agent you trust, and ask it to follow the connection instructions."],
    ["不同智能体的接入方式可能不同，需要添加工具或完成客户端设置时，让它按说明继续操作。连接完成后，就可以描述你想修改或新建的应用。", "Setup varies by agent. If it needs to add a tool or finish configuring its client, let it follow the on-screen instructions. Once connected, describe the app you want to change—or the one you want to create."],
    ["智能体连不上，该检查什么？", "Why can’t my AI coding agent connect?"], ["确认开发模式仍然开启，使用的是手机当前显示的地址和密码，且电脑与手机在同一网络。先让智能体访问连接地址；如果访问不到，检查访客 Wi-Fi 隔离、电脑代理和防火墙。服务停止或地址变化后，重新连接。", "Make sure Development Mode is still on, the address and password match what your phone currently shows, and both devices are on the same network. Ask the agent to open the connection address first. If it can’t, check guest-network isolation, your computer’s proxy, and firewall settings. Reconnect whenever the service restarts or the address changes."],
    ["把密码交给智能体安全吗？", "Is it safe to give an AI coding agent the password?"], ["开发连接允许修改应用，只应交给你信任的智能体，在可信网络中临时使用。不要把地址和密码放到公开网页、代码仓库或群聊。完成后关闭开发模式；如怀疑泄露，可以更换密码。", "Development Mode lets the connected agent change apps on your phone. Use it only with an agent you trust and on a trusted network. Never post the address or password on a public page, in a repository, or in a group chat. Turn Development Mode off when you’re done; change the password if you think it was exposed."],
    ["不懂编程，也能做自己的应用吗？", "Can I make my own app without knowing how to code?"], ["可以从描述需求开始，让智能体完成具体实现。先挑一个小场景，比如“每天三件事的清单”，做出来用一遍，再告诉它哪里不顺手。涉及复杂功能时，可能需要多轮调整。", "Yes. Describe the outcome you want and let the agent handle the implementation. Start small—say, a list for today’s three priorities. Use the first version, then explain what feels wrong. More ambitious apps may take a few rounds."],
    ["所有应用都能随便改吗？", "Can I customize any app?"], ["Haminn 中具有本地代码的 happ 可以在开发模式下创建开发副本并修改。只有网址的在线网页不一定有可修改的本地代码；商业 Android APK 也不能直接放进 Haminn 改造。分享他人的代码时，应遵守原作者的许可。", "Apps with local code can be opened as an editable development copy in Development Mode. A webpage that exists only at a URL may not have local code to change, and Haminn cannot turn a commercial Android APK into an editable happ. Respect the author’s license when you share or modify someone else’s code."],
    ["本地来源、线上来源，和运行方式有什么区别？", "What do source and run mode mean?"], ["来源记录应用从哪里添加；运行方式决定这一次怎样打开。网址下载的应用仍是线上来源，但安装了代码后可以本地运行。有实时地址时，也可以线上实时运行。", "Source tells you where an app was added from. Run mode tells Haminn how to open it right now. An app installed from a URL still has an online source, but its downloaded code can run locally. If the app also has a live URL, it can run live from the web."], ["本地运行并不总等于离线：带有实时地址的应用会优先使用包内资源，动态请求仍可能访问网络。", "Local doesn’t always mean offline. For an app with a live URL, Haminn serves packaged files first, but dynamic requests may still use the network."],
    ["给智能体的技术资料在哪里？", "Where can my AI coding agent find the technical docs?"], ["开启开发模式后，先让智能体访问手机显示的连接地址，读取与当前 HaminnApp 匹配的工具和开发说明。发现入口为", "After you turn on Development Mode, ask the agent to open the connection address shown on your phone. It will find the tools and docs that match your version of Haminn. The discovery endpoint is"], ["，标准 MCP 接口为", ", and the standard MCP endpoint is"], ["需要进一步查看时，可阅读项目的", "For deeper reference, see the project’s"], ["happ 创作指南", "happ authoring guide"], ["与", "and"], ["公开接口合同", "public API contracts"], ["。这些资料给你或智能体按需查阅，普通使用无需阅读。", ". These references are for you or your agent when needed; you don’t need them for everyday use."],
    ["happ 用什么技术做？需要构建工具吗？", "How are happs built? Do I need a build system?"], ["最简单的 happ 就是 HTML、CSS 和 JavaScript 页面，可直接运行，不要求 React、Vue 或构建步骤。规范发布包在根目录提供", "A basic happ can be plain HTML, CSS, and JavaScript that runs as-is—no React, Vue, package manager, or build step required. A standard release includes"], ["，声明稳定的", ", which declares a stable"], ["、版本和入口。ZIP 只是传输文件的方式。", ", version, and entry point. The ZIP file is simply the delivery format."],
    ["相机、文件、通知等功能如何接入？", "How can a happ use the camera, files, notifications, and other device features?"], ["通过 Haminn 的公开 Bridge 接口，并为当前 happ 申请相应授权。先让智能体读取手机提供的当前合同；普通 happ 无法使用官方管理界面的宿主管理权限。", "Use Haminn’s public Bridge APIs and request the appropriate permission for that happ. Ask the agent to read the current API contracts from your phone first. Regular happs cannot access the host-management privileges reserved for Haminn’s official interface."], ["Haminn 支持规定类型的通知计划与服务端通知轮询，但不会替 happ 持续在后台执行任意 JavaScript。", "Haminn supports defined notification schedules and polling for server notifications. It does not run arbitrary happ JavaScript continuously in the background."],
    ["不同应用的数据是完全隔离的吗？", "Is every app completely isolated?"], ["Haminn 自有数据、文件和授权按应用实例隔离。WebView 的 Cookie 与站点存储遵循浏览器同源规则：同一协议、主机和有效端口的页面可能共享网站数据，不同路径不构成隔离。", "Haminn keeps its own data, files, and permissions separate for each app instance. WebView cookies and site storage still follow the browser’s same-origin policy: pages with the same scheme, host, and effective port may share site data, and different URL paths are not a security boundary."],
    ["怎么发布更新，又不影响用户已有数据？", "How do I ship an update without replacing user data?"], ["保持同一", "Keep the same"], ["，递增版本号，发布新的版本化 ZIP，再更新安装清单。Haminn 用新的只读代码版本替换旧代码；用户设置与业务数据应单独保存，不应写入代码目录。业务数据格式变化仍需应用作者正确处理。", ", increment the version, publish a new versioned ZIP, then update the install manifest. Haminn activates the new read-only code release while keeping user settings and app data separate. App authors are still responsible for migrating their own data formats when necessary."],
    ["如何核对 Android 安装包？", "How can I verify the Android download?"], ["当前正式版本为 1.12.7，应用标识为", "The current release is 1.12.7. Its application ID is"], ["，文件大小 3,384,780 字节。SHA-256：", ", and the file is 3,384,780 bytes. SHA-256:"], ["复制校验值", "Copy hash"], ["下载校验文件", "Download .sha256 file"], ["还没找到答案？", "Still need help?"],

    ["用得自在，也心里有数", "Clear choices. No surprises."], ["你的数据，清清楚楚。", "Know where your data goes."], ["了解什么留在手机里、什么会连接网络，以及你能在哪里管理。", "See what stays on your phone, what can connect to the internet, and where you stay in control."],
    ["应用和数据保存在手机上", "Your apps and Haminn data stay on your phone"], ["Haminn 保存已添加的应用、代码版本、设置和逐应用授权。通过 Haminn 保存的记录与附件按应用实例管理。修改名称或切换运行方式，不会自动清除这些记录。", "Haminn stores the apps you add, their code releases, settings, and per-app permissions. Records and attachments saved through Haminn are kept with their app instance. Renaming an app or changing its run mode does not erase them."],
    ["需要能力时，由你允许", "Access is requested when it’s needed"], ["相机、麦克风、位置、剪贴板和通知等功能按应用申请授权。Android 系统权限与 Haminn 的应用授权是两层决定，你可以在应用管理中查看或重置。", "Each app asks before it uses the camera, microphone, location, clipboard, notifications, or similar capabilities. Android permissions and Haminn’s per-app permissions are separate; review or reset either from App management."],
    ["在线功能由应用连接相应服务", "Online features connect to the services they use"], ["添加在线应用、检查更新、AI 聊天或加载实时页面时，可能连接应用使用的服务器。每个应用负责自己的账号、内容和隐私说明，Haminn 不替第三方服务保存或管理账号。", "Adding an online app, checking for updates, chatting with AI, or opening a live page may connect to servers used by that app. Each app is responsible for its own accounts, content, and privacy practices. Haminn does not manage accounts for third-party services."],
    ["网站登录状态遵循同源规则", "Website sign-ins follow the browser’s same-origin policy"], ["来自同一网站的页面可能共享 Cookie、登录状态和站点存储。同一网站下的不同路径，并不意味着数据相互隔离。这与 Haminn 按应用管理的自有数据是两回事。", "Pages from the same website may share cookies, sign-in sessions, and site storage. Different paths on the same site are not separate data boundaries. This is independent of the data Haminn stores for each app."],
    ["分享 happ，不会带走你的个人内容", "Sharing an app leaves your personal data behind"], ["设备间分享只传递可安装的 happ 本身，不包含使用数据、Cookie、登录状态、Haminn 文件、应用授权或开发连接信息。接收方会先看到应用信息，确认后才安装。", "Device-to-device sharing sends only the installable app. Your usage data, cookies, sign-in sessions, Haminn files, app permissions, and Development Mode details stay on your phone. The recipient reviews the app details before choosing to install."],
    ["备份与删除", "Backups and deletion"], ["应用备份可包含代码、Haminn 数据和附件，默认不加密，也不包括网页登录状态和 Cookie。请保存在可信位置。卸载时可以选择保留数据，或确认彻底清除该应用的 Haminn 数据。", "A backup can include app code, Haminn data, and attachments. It is not encrypted by default and does not include website cookies or sign-in sessions, so keep it somewhere secure. When removing an app, you can keep its data or explicitly erase all Haminn data for that app."],
    ["只连接你信任的智能体", "Only connect agents you trust"], ["开发模式允许电脑修改应用。只在可信网络开启，把当前连接信息交给你信任的智能体，用完后关闭。不要把密码、API 密钥或私人数据放进公开反馈和分享的应用包。", "Development Mode allows a computer to change apps on your phone. Turn it on only on a trusted network, share the connection details only with an agent you trust, and turn it off when you’re done. Never put passwords, API keys, or private data in public feedback or an app package you plan to share."],
    ["官网设置与访问", "Website preferences and access logs"], ["官网会在当前浏览器保存你选择的语言和明暗主题。默认跟随浏览器语言。语言选择还会写入一个本站自己的 Cookie，供 haminn.airen.life 及其子域名的站点共用，这样换到另一个站点不用重选；你可以在浏览器里随时清除它。本站没有接入第三方统计脚本或远程字体；服务器仍可能产生常规访问日志。", "This site saves your language and appearance choices in this browser and follows your browser language by default. Your language choice is also written to a first-party cookie shared by haminn.airen.life and its subdomains, so the other sites open in the same language without asking again; you can clear it in your browser at any time. No third-party analytics or remote fonts are used. The server may still keep standard access logs."], ["查看更多常见问题", "See all FAQs"],
    ["一起，让它更好用", "Help make Haminn better"], ["你的使用感受，很重要。", "Your experience shapes the product."], ["哪里不顺手，哪里还想改，或者遇到了问题，都欢迎告诉我们。", "Tell us what got in your way, what you wish worked differently, or what went wrong."],
    ["找一个答案", "Find an answer"], ["从安装到定制，按你遇到的问题查找。", "Browse help for everything from installation to customization."], ["反馈使用问题", "Report a problem"], ["告诉我们你做了什么、希望发生什么，以及实际遇到了什么。", "Tell us what you did, what you expected, and what happened instead."], ["前往 GitHub 反馈", "Open an issue on GitHub"],
    ["参与 Haminn", "Contribute to Haminn"], ["分享使用经验、贡献代码，或把自己的好用应用带给更多人。", "Share what you’ve learned, contribute code, or help a useful app reach more people."], ["查看项目", "View on GitHub"], ["让问题更容易被解决", "Help us understand the issue"], ["反馈时附上 Haminn 版本和操作步骤会很有帮助。必要时，可在设置中复制运行诊断；发送前请移除密码、账号凭据和私人内容。", "Include your Haminn version and the steps that reproduce the problem. If needed, copy Runtime Diagnostics from Settings. Remove passwords, account credentials, and private content before posting."], ["关于支持项目", "Ways to support Haminn"], ["目前没有开放官方捐赠收款入口。认真使用、分享建议、完善文档，都是对 Haminn 的支持。", "Haminn does not currently accept donations. Using it, sharing thoughtful feedback, and improving the docs are all meaningful ways to help."],

    ["应用广场", "Happs"], ["官方应用", "Official apps"], ["还没有发布任何 happ。", "No happ has been published yet."],
    ["选择语言", "Choose language"], ["选择明暗主题", "Choose theme"], ["深色主题", "Dark"], ["浅色主题", "Light"], ["跟随系统", "Use system setting"], ["在 GitHub 查看 Chataxi 项目", "View Chataxi on GitHub"], ["GitHub 仓库", "GitHub repository"],
    ["两步开始使用", "Get started in two steps"], ["Chataxi 安装二维码：在 Haminn 中点扫码添加扫描；也可复制下方地址。", "QR code to install Chataxi. In Haminn, choose Scan to add, then scan this code. You can also copy the link below."], ["Chataxi 安装地址", "Chataxi install link"], ["试试：扫码、分享、更新……", "Try “scan,” “share,” or “update”…"],

    // 三个站点各自的身份与导航：每个站点左上角有自己的品牌与栏目名。
    ["haminn 首页", "Haminn home"], ["Chataxi 首页", "Chataxi home"], ["HamDraw 首页", "HamDraw home"],
    ["真人语音", "Real voices"], ["多角色群聊", "Group chat"], ["模型配置", "Models"], ["上手", "Get started"],
    ["实时生图", "Real time"], ["涂鸦工具", "Drawing tools"], ["模型接入", "Connecting models"],
    ["安装 Chataxi", "Install Chataxi"], ["安装 HamDraw", "Install HamDraw"], ["查看 Chataxi 产品网站", "Open the Chataxi site"],

    // Chataxi 首页的角色模板：名称与职业取自应用内的真实模板数据。
    ["角色模板分类", "Role template categories"], ["角色模板列表", "Role template list"],
    ["全部", "All"], ["男性", "Male"], ["女性", "Female"], ["其他", "Other"],
    ["云", "Yun"], ["云舒", "Yunshu"], ["岩", "Yan"], ["阿秋", "Aqiu"],
    ["@ 云舒", "@ Yunshu"], ["@ 岩", "@ Yan"], ["@ 阿秋", "@ Aqiu"],
    ["陈野", "Chen Ye"], ["摄影专业大一学生", "Photography freshman"],
    ["林小雨", "Lin Xiaoyu"], ["动画专业大一学生", "Animation freshman"],
    ["顾川", "Gu Chuan"], ["精品咖啡师", "Specialty barista"],
    ["唐果然", "Tang Guoran"], ["地理系学生", "Geography student"],
    ["陆沉舟", "Lu Chenzhou"], ["航天器姿态控制工程师", "Spacecraft control engineer"],
    ["许知夏", "Xu Zhixia"], ["机器人控制算法工程师", "Robotics control engineer"],
    ["谢闻笙", "Xie Wensheng"], ["古籍装帧修复师", "Rare-book restorer"],
    ["沈清和", "Shen Qinghe"], ["博物馆纺织品修复师", "Textile conservator"],
    ["贺临", "He Lin"], ["急诊科医生", "Emergency physician"],
    ["周眠", "Zhou Mian"], ["深夜电台主持人", "Late-night radio host"],
    ["周既白", "Zhou Jibai"], ["野生动物纪录片导演", "Wildlife film director"],
    ["骆星澜", "Luo Xinglan"], ["海洋生物学博士", "Marine biologist"],
    ["沈砚", "Shen Yan"], ["现代中餐厅主厨兼合伙人", "Restaurant chef and partner"],
    ["何南枝", "He Nanzhi"], ["川味小馆主理人", "Sichuan eatery owner"],
    ["裴知行", "Pei Zhixing"], ["公共空间城市规划师", "Urban planner"],
    ["秦砚书", "Qin Yanshu"], ["法律援助律师", "Legal-aid lawyer"],
    ["江屿", "Jiang Yu"], ["海岛民宿主理人", "Island guesthouse owner"],
    ["蒋晚照", "Jiang Wanzhao"], ["历史建筑修复建筑师", "Heritage architect"],
    ["泡绒", "Pao Rong"], ["未寄信邮差", "Unsent-letter courier"],
    ["慢十三", "Man Shisan"], ["走慢一秒的钟表人", "A clockwork second slow"],
    ["墨点先生", "Mr. Inkblot"], ["从画稿中逃出的墨团", "Ink that fled the sketch"],
    ["温丘", "Wen Qiu"], ["水豚温泉店主", "Capybara onsen keeper"],
    ["米格", "Mi Ge"], ["仓鼠空间规划师", "Hamster space planner"],
    ["八问", "Ba Wen"], ["章鱼多角度顾问", "Octopus advisor"],
    ["零差", "Ling Cha"], ["概率审计智能体", "Probability audit agent"],
    ["晚班四号", "Night Shift Four"], ["无人城市末班车司机", "Last-bus driver"],
    ["航标九", "Beacon Nine"], ["失联星路信标", "Lost signal beacon"],

    // HamDraw 首页与两张安装卡片的可访问文本。
    ["HamDraw 安装二维码：在 Haminn 中点扫码添加扫描；也可复制下方地址。", "QR code to install HamDraw. In Haminn, choose Scan to add, then scan this code. You can also copy the link below."],
    ["HamDraw 安装地址", "HamDraw install link"], ["HamDraw 应用图标", "HamDraw app icon"], ["Chataxi 应用图标", "Chataxi app icon"],

    // PoseGi 首页：底部按钮页、章节导航与安装卡片的可访问文本。
    ["PoseGi 首页", "PoseGi home"], ["安装 PoseGi", "Install PoseGi"], ["摆姿", "Posing"], ["界面按钮", "The interface"],
    ["PoseGi 安装二维码：在 Haminn 中点扫码添加扫描；也可复制下方地址。", "QR code to install PoseGi. In Haminn, choose Scan to add, then scan this code. You can also copy the link below."],
    ["PoseGi 安装地址", "PoseGi install link"]
  ]);
  const ZH = Object.fromEntries(Object.entries(EN).map(([zh, en]) => [en, zh]));
  const defaultMeta = {
    "/": { zh: ["你的软件，你说了算 · Haminn", "安装、定制并分享喜欢的应用。Haminn 让每个人都能拥有适合自己的手机软件。"], en: ["Software on your terms · Haminn", "Install, reshape, create, and share apps with AI. Haminn is a home for software that fits the way you live."] },
    "/pages/guide.html": { zh: ["开始使用 · Haminn", "安装 Haminn 和第一个 happ，再按自己的想法定制、创造或分享应用。"], en: ["Get started with Haminn", "Install Haminn, add your first app, then learn how to customize, create, and share software of your own."] },
    "/pages/download.html": { zh: ["下载 · Haminn", "下载 Haminn Android 安装包，开始添加和使用适合自己的应用。"], en: ["Download Haminn for Android", "Get Haminn for Android and start using apps you can make your own."] },
    "/pages/faq.html": { zh: ["常见问题 · Haminn", "关于安装、设备间分享、Chataxi、连接智能体、应用更新和数据的常见问题。"], en: ["Haminn Help & FAQ", "Get clear answers about setup, sharing apps between phones, Chataxi, AI coding agents, updates, privacy, and data."] },
    "/pages/privacy.html": { zh: ["隐私与数据 · Haminn", "了解 Haminn 如何保存应用、数据、授权，以及在线功能如何连接网络。"], en: ["Privacy & Data in Haminn", "See what stays on your phone, what can connect to the internet, and how Haminn keeps you in control."] },
    "/pages/donate.html": { zh: ["帮助与反馈 · Haminn", "查找帮助、反馈使用问题，或参与 Haminn 项目。"], en: ["Help improve Haminn", "Find an answer, report a problem, or contribute to the Haminn project."] },
    "/pages/happs.html": { zh: ["应用广场 · Haminn", "扫描二维码，把官方 happ 装进 Haminn。"], en: ["Happ gallery · Haminn", "Scan a code to install an official happ into Haminn."] }
  };

  document.addEventListener("DOMContentLoaded", () => {
    // App sites (Chataxi, hamdraw) ship their own titles by declaring
    // window.HAMINN_SITE_META before this script; the product site falls
    // straight through to the defaults below.
    const meta = Object.assign({}, defaultMeta, window.HAMINN_SITE_META || {});
    const path = value => value.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
    const currentPath = path(location.pathname);
    const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const refreshTheme = () => {
      setTheme(theme);
      const control = document.getElementById("siteTheme");
      if (!control) return;
      control.setAttribute("aria-label", language === "en" ? "Choose appearance" : "选择明暗主题");
      const labels = language === "en" ? { dark: "Use dark theme", system: "Follow system appearance", light: "Use light theme" } : { dark: "使用深色主题", system: "跟随系统主题", light: "使用浅色主题" };
      control.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
        button.setAttribute("aria-label", labels[button.dataset.themeChoice]);
      });
    };
    const translate = dictionary => {
      const walker = document.createTreeWalker(document.body, 4);
      const nodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (!node.parentElement || ["SCRIPT", "STYLE"].includes(node.parentElement.tagName)) continue;
        const clean = node.nodeValue.replace(/\s+/g, " ").trim();
        if (clean && dictionary[clean]) nodes.push([node, clean]);
      }
      nodes.forEach(([text, clean]) => { text.nodeValue = text.nodeValue.replace(clean, dictionary[clean]); });
      document.querySelectorAll("*").forEach(element => ["aria-label", "title", "placeholder", "alt", "data-success"].forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (value && dictionary[value]) element.setAttribute(attribute, dictionary[value]);
      }));
    };
    const refreshLanguage = () => {
      language = languageChoice === "auto" ? detectLanguage() : languageChoice;
      translate(language === "en" ? EN : ZH);
      document.documentElement.lang = language === "en" ? "en" : "zh-CN";
      const description = meta[currentPath];
      if (description) {
        document.title = description[language][0];
        const node = document.querySelector('meta[name="description"]');
        if (node) node.setAttribute("content", description[language][1]);
      }
      const control = document.getElementById("siteLanguage");
      if (control) {
        control.setAttribute("aria-label", language === "en" ? "Choose language" : "选择语言");
        // The pressed button is the language being read, not the stored choice:
        // with no stored choice the site follows the browser, and the switch
        // still has to show which language that resolved to.
        control.querySelectorAll("[data-language-choice]").forEach(button => {
          const choice = button.dataset.languageChoice;
          button.setAttribute("aria-pressed", String(choice === language));
          button.setAttribute("aria-label", choice === "en" ? "English" : "中文");
        });
      }
      refreshTheme();
    };

    document.querySelectorAll(".site-header a[href], .site-footer nav a[href]").forEach(link => {
      const raw = link.getAttribute("href");
      // An in-page anchor such as "#install" resolves to the current path, so
      // path comparison alone would mark the header CTA as "you are here".
      if (raw.charAt(0) === "#") { link.removeAttribute("aria-current"); return; }
      const url = new URL(raw, location.href);
      const active = url.origin === location.origin && !url.hash && path(url.pathname) === currentPath;
      if (active && !link.classList.contains("brand")) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    document.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => {
      theme = button.dataset.themeChoice;
      try { localStorage.setItem(themeKey, theme); } catch (_) {}
      refreshTheme();
    }));
    document.querySelectorAll("[data-language-choice]").forEach(button => button.addEventListener("click", () => {
      const next = button.dataset.languageChoice;
      // Clicking the language already on screen changes nothing, so the site
      // stays on "follow the browser" instead of pinning it for no reason.
      if (next === language) return;
      languageChoice = next;
      try { localStorage.setItem(languageKey, languageChoice); } catch (_) {}
      writeCookie(languageChoice);
      document.querySelectorAll(".copy-status, #searchStatus").forEach(status => { status.textContent = ""; });
      refreshLanguage();
    }));
    window.addEventListener("storage", event => {
      if (event.key === themeKey) { theme = validThemes.includes(event.newValue) ? event.newValue : "system"; refreshTheme(); }
      if (event.key === languageKey) { languageChoice = languageChoices.includes(event.newValue) ? event.newValue : "auto"; refreshLanguage(); }
    });
    if (media && media.addEventListener) media.addEventListener("change", () => { if (theme === "system") refreshTheme(); });
    else if (media && media.addListener) media.addListener(() => { if (theme === "system") refreshTheme(); });
    refreshLanguage();

    // The Chataxi role-template row ships all 27 templates; the filter chips
    // above it narrow the row down without a second page load.
    const roleRow = document.querySelector("[data-role-row]");
    if (roleRow) {
      const chips = Array.from(document.querySelectorAll("[data-role-filter]"));
      chips.forEach(chip => chip.addEventListener("click", () => {
        const group = chip.dataset.roleFilter;
        chips.forEach(other => other.setAttribute("aria-pressed", String(other === chip)));
        roleRow.querySelectorAll("[data-role-group]").forEach(card => { card.hidden = group !== "all" && card.dataset.roleGroup !== group; });
        roleRow.scrollLeft = 0;
      }));
    }

    document.querySelectorAll("[data-copy]").forEach(button => button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copy);
      const status = document.getElementById(button.dataset.status);
      if (!target || !status) return;
      const icon = button.querySelector("i");
      try {
        if (!navigator.clipboard) throw new Error("clipboard unavailable");
        await navigator.clipboard.writeText(target.value || target.textContent);
        status.textContent = button.dataset.success || (language === "en" ? "Copied." : "已复制。");
        if (icon) icon.className = "fa-solid fa-check";
        button.classList.add("copied");
      } catch (_) {
        if (typeof target.select === "function") { target.focus(); target.select(); target.setSelectionRange(0, target.value.length); }
        else { const range = document.createRange(); const selection = window.getSelection(); range.selectNodeContents(target); selection.removeAllRanges(); selection.addRange(range); }
        status.textContent = language === "en" ? "Selected. Press and hold or use your system copy command." : "已选中，请长按或使用系统复制。";
        if (icon) icon.className = "fa-regular fa-copy";
        button.classList.remove("copied");
      }
    }));

    const search = document.getElementById("faqSearch");
    if (search) {
      const groups = Array.from(document.querySelectorAll(".faq-group"));
      const status = document.getElementById("searchStatus");
      search.addEventListener("input", () => {
        const query = search.value.trim().toLocaleLowerCase();
        let count = 0;
        groups.forEach(group => {
          let visible = 0;
          group.querySelectorAll("details").forEach(detail => {
            const match = !query || detail.textContent.toLocaleLowerCase().includes(query);
            detail.hidden = !match;
            if (match) visible++;
            detail.open = !!query && match;
          });
          group.hidden = visible === 0;
          count += visible;
        });
        status.textContent = !query ? "" : count ? (language === "en" ? "Found " + count + " matching questions." : "找到 " + count + " 个相关问题。") : (language === "en" ? "No matching questions. Try “install”, “connect”, or “update”." : "没有找到相关问题。试试“安装”“连接”或“更新”，也可以前往帮助与反馈。");
      });
      document.querySelectorAll(".contents a").forEach(link => link.addEventListener("click", () => { search.value = ""; search.dispatchEvent(new Event("input")); }));
    }
    const showLinkedAnswer = () => {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
      const answer = document.getElementById(id);
      if (!answer || answer.tagName !== "DETAILS") return;
      if (search && search.value) { search.value = ""; search.dispatchEvent(new Event("input")); }
      answer.open = true;
    };
    showLinkedAnswer();
    window.addEventListener("hashchange", showLinkedAnswer);
  });
})();
