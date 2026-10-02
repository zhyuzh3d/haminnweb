/* Run: HAMINN_DOM_MODULE=/path/to/linkedom node --test tools/flows.test.cjs
 * linkedom is a test-only DOM implementation. The website has no runtime dependency.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),webcrypto=require('node:crypto').webcrypto;
const {parseHTML}=require(process.env.HAMINN_DOM_MODULE || 'linkedom');
const root=path.resolve(__dirname,'../public/shell');
const app={appId:'example-1',instanceId:'example-1',name:'随手记',source:'online',runtimeMode:'local',launchChannel:'stable',activeReleaseId:'release-1',activeVersion:{code:3,name:'2.4.0'},localAvailable:true,liveAvailable:true,liveUrl:'https://example.com/app/',startUrl:'https://example.com/app/',updateUrl:'https://example.com/update.json',downloadUrl:'https://example.com/app.zip',sourcePath:null,sourceRetained:false,sourceAdapter:'online-manifest',favorite:true,notificationEnabled:false,allowCrossOriginNetwork:false,iconUrl:null,customIconUrl:null,defaultIconUrl:null,hasCustomIcon:false,desktopShortcutState:'notPinned',devWorkspace:{state:'missing'}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(options={}) {
  const {window:w}=parseHTML(fs.readFileSync(root+'/index.html','utf8'));
  const storage=new Map(),calls=[],apps=options.apps || [structuredClone(app)];
  Object.assign(w,{window:w,URL,console,Promise,matchMedia:()=>({matches:false,addEventListener:()=>{},addListener:()=>{}}),localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},scrollTo:()=>{},requestAnimationFrame:fn=>fn(),setInterval:()=>0,setTimeout:()=>0,clearTimeout:()=>{},innerHeight:800});
  if(!Object.getOwnPropertyDescriptor(w,'crypto')?.get) w.crypto=webcrypto; else Object.defineProperty(w,'crypto',{value:webcrypto,configurable:true,writable:true});
  w.Element.prototype.getClientRects=function(){return this.closest('.hidden')?[]:[{}]};
  if (options.native!==false) w.haminn={isReady:true,system:{language:async()=>({language:options.systemLanguage || 'zh'})},call:async(method,params)=>{
    calls.push({method,params});
    if(options.respond) { const result=options.respond(method,params); if(result!==undefined) return result; }
    if(method==='host.apps.list') return {apps};
    if(method==='host.about.info') return {version:'1.8.0',versionCode:13,author:'Haminn',applicationId:'life.airen.haminn'};
    if(method==='host.shell.status') return {configuredMode:'local',runningMode:'local',localVersion:'1.8.0'};
    if(method==='host.agent.status') return {enabled:false,active:false,networkAvailable:false,addresses:[],events:[]};
    if(method==='host.voice.status') return {tts:{operational:true,effectiveEngine:'system.tts',fallbackFrom:null,preferences:{engineSelection:'system',voiceSelection:'automatic',language:null,rate:1,pitch:1},engines:[{id:'system.tts',label:'系统朗读',enabled:true}]},speech:{preferences:{serviceSelection:'system',activitySelection:'system',language:null,preferOffline:false},services:[],activities:[],capability:{state:'unavailable',streamingAvailable:false,oneShotAvailable:false,onDeviceAvailable:false,message:'系统未提供语音识别'}}};
    if(method==='host.voice.ttsVoices') return {voices:[{id:'voice.zh',locale:'zh-CN',networkRequired:false}]};
    if(method==='host.permissions.list') return {grants:[]};
    if(method==='host.apps.releases') return {releases:[{releaseId:'release-1',versionName:'1.0.0'}],activeReleaseId:'release-1'};
    return {cancelled:false};
  }};
  const context=vm.createContext(w);
  for(const script of w.document.querySelectorAll('script[src]')) vm.runInContext(fs.readFileSync(path.join(root,script.getAttribute('src')),'utf8'),context,{filename:script.getAttribute('src')});
  return {w,H:w.HaminnShell,$:s=>w.document.querySelector(s),calls,storage,apps};
}
test('all classic modules boot without Native and expose an actionable browser state',async()=>{
 const {H,$,calls}=setup({native:false});await tick();
 assert.equal($('#browserNotice').classList.contains('hidden'),false);assert.equal($('#loading').classList.contains('hidden'),true);assert.equal(calls.length,0);
 await assert.rejects(H.host.call('apps.list'),/HaminnApp/);
});
test('startup optional failures do not mark the app library as failed',async()=>{
 const {$}=setup({respond:m=>m==='host.about.info'?Promise.reject(new Error('about unavailable')):undefined});await tick();
 assert.equal($('#apps').children.length,1);assert.equal($('#libraryUnavailable').classList.contains('hidden'),true);assert.equal($('#topApkVersion').textContent,'暂不可用');assert.equal($('#resultsCount'),null);assert.equal($('#collectionPrompt').textContent,'已收藏【1】个HAPP应用');
});
test('list failure shows retry and recovers',async()=>{
 let fail=true;const {$}=setup({respond:m=>m==='host.apps.list'&&fail?Promise.reject(new Error('设备繁忙')):undefined});await tick();
 assert.equal($('#libraryUnavailable').classList.contains('hidden'),false);fail=false;$('#retryLibrary').click();await tick();
 assert.equal($('#libraryUnavailable').classList.contains('hidden'),true);assert.equal($('#apps').children.length,1);
});
test('source and execution remain orthogonal; names are rendered as text',async()=>{
 const hostile={...app,name:'<img src=x onerror=alert(1)>'};const {H,$}=setup({apps:[hostile]});await tick();
 assert.equal(H.features.library.appSource(hostile),'online');assert.equal(H.features.library.appRuntime(hostile),'local');
 assert.equal($('.app-card').dataset.source,'online');assert.equal($('.app-name').textContent,hostile.name);assert.equal($('.app-name').children.length,0);
 assert.equal($('.version-badge').textContent,'2.4.0');assert.equal($('.source-badge'),null);
});
test('a real happ icon keeps cover sizing and receives no placeholder color class',async()=>{
 const icon='/__haminn/object/images/icon.png';const {$}=setup({apps:[{...app,iconUrl:icon,defaultIconUrl:icon}]});await tick();
 const rendered=$('.app-icon');
 assert.equal(rendered.classList.contains('custom'),true);
 for(const color of ['blue','violet','orange','green']) assert.equal(rendered.classList.contains(color),false);
 assert.match(rendered.style.backgroundImage,/icon\.png/);
});
test('each collection reads fresh Native data without a search control',async()=>{
 const other={...app,appId:'other',favorite:false};const {$,calls}=setup({apps:[app,other]});await tick();
 $('#libraryTabs [data-collection="all"]').click();assert.equal($('#collectionPrompt').textContent,'已安装【2】个HAPP应用');
 $('#libraryTabs [data-collection="favorites"]').click();assert.equal($('#searchApps'),null);assert.equal($('#collectionPrompt').textContent,'已收藏【1】个HAPP应用');assert.ok(calls.filter(c=>c.method==='host.apps.list').length>=1);
});
test('home stays compact while every other tab uses the shared top title bar',async()=>{
 const {H,$}=setup();await tick();
 assert.equal($('#homeBrand').classList.contains('hidden'),false);assert.equal($('#topbarCopy').classList.contains('hidden'),true);
 assert.equal($('.topbar-versions').classList.contains('hidden'),false);
 assert.equal($('#homePrompt').classList.contains('hidden'),false);assert.equal($('#homePrompt').textContent,'添加一个HAPP应用');
 assert.equal($('#homePrompt').parentElement.id,'hostActions');assert.equal($('#homePrompt').nextElementSibling.classList.contains('quick-add'),true);
 assert.equal($('#collectionPrompt').classList.contains('hidden'),false);assert.equal($('#collectionPrompt').textContent,'已收藏【1】个HAPP应用');
 assert.equal($('#libraryView .page-heading'),null);
 for(const [view,title,description] of [
  ['development','开发服务','让任意电脑的智能体快速更新、刷新和发布 happ。'],
  ['settings','设置','调整外观、界面版本与常用工具。'],
  ['support','支持 Haminn','向项目提交反馈，并查看开源仓库。']
 ]) {
  await H.navigation.showView(view,false);
  assert.equal($('#homeBrand').classList.contains('hidden'),true);assert.equal($('#topbarCopy').classList.contains('hidden'),false);
  assert.equal($('.topbar-versions').classList.contains('hidden'),true);
  assert.equal($('#homePrompt').classList.contains('hidden'),true);assert.equal($('#collectionPrompt').classList.contains('hidden'),true);
  assert.equal($('#topbarTitle').textContent,title);assert.equal($('#topbarDescription').textContent,description);
 }
 await H.navigation.showView('favorites',false);assert.equal($('.topbar-versions').classList.contains('hidden'),false);assert.equal($('#homePrompt').classList.contains('hidden'),false);assert.equal($('#collectionPrompt').classList.contains('hidden'),false);
});
test('interface language follows the system and a manual choice overrides it',async()=>{
 const {H,$,storage}=setup({systemLanguage:'en'});await tick();
 assert.equal(H.i18n.current(),'en');assert.equal($('#homePrompt').textContent,'Add a happ');
 H.i18n.setPreference('zh-CN');assert.equal($('#homePrompt').textContent,'添加一个HAPP应用');assert.equal(storage.get('haminn.language'),'zh-CN');
 H.i18n.setPreference('system');await H.i18n.syncSystemLanguage();assert.equal($('#homePrompt').textContent,'Add a happ');
});
test('HaminnUI uses an exact theme-colored vector mask without raster inversion',async()=>{
 const {$}=setup();await tick();
 assert.ok($('#homeBrand .brand-mark .theme-logo'));
 const svg=fs.readFileSync(root+'/assets/haminn-mark.svg','utf8');
 assert.match(svg,/viewBox="0 0 512 512"/);assert.match(svg,/<path d=/);
 assert.equal(fs.existsSync(root+'/assets/haminn-icon.webp'),false);
});
test('simplified navigation and expanded happ settings remain structural contracts',()=>{
 const {window:w}=parseHTML(fs.readFileSync(root+'/index.html','utf8')),document=w.document;
  assert.equal(document.querySelectorAll('#appFilters,[data-filter]').length,0);
 assert.equal(document.querySelector('.bottom-nav [data-view="all"]'),null);
 assert.equal(document.querySelectorAll('.bottom-nav [data-view]').length,4);
 assert.deepEqual([...document.querySelectorAll('.quick-add > button')].map(button=>button.id),['addZip','addUrl','scanQr']);
 assert.deepEqual([...document.querySelectorAll('#libraryTabs [data-collection]')].map(button=>button.textContent.trim()),['收藏','全部']);
 assert.equal(document.querySelector('#addFolder'),null);
 assert.equal(document.querySelector('#searchApps'),null);
 assert.doesNotMatch(fs.readFileSync(root+'/features/manage.js','utf8'),/showView\("all"\)|views\.all/);
 assert.equal(document.querySelector('#settingsView [data-view="icons"]'),null);
 assert.equal(document.querySelector('#settingsView .settings-help'),null);
 assert.equal(document.querySelector('#useOnlineShell'),null);
 assert.equal(document.querySelector('#useLocalShell')?.textContent.trim(),'恢复使用本地界面');
 assert.equal(document.querySelector('#shellModeStatus'),null);
 assert.equal(document.querySelectorAll('#settingsView .glass-panel').length,0);
 assert.equal(document.querySelector('#supportView .settings-card'),null);
 assert.equal(document.querySelector('#supportRepository')?.id,'supportRepository');
 assert.equal(document.querySelectorAll('#managePanel details').length,0);
 assert.ok(document.querySelectorAll('#managePanel .detail-block').length>=6);
 for(const modal of document.querySelectorAll('.modal:not(.confirm-modal)')) {
  assert.ok(modal.querySelector('.panel-head > .icon-button[data-close]'),modal.id+' needs a title-aligned close button');
 }
 assert.equal(document.querySelector('#deployPanel'),null);
 for(const id of ['agentUrl','refreshAgentAddress','copyAgentAddress','agentUsb','startAgentUsb','agentEndpointPanel','developerDetails','switchToStable','exportDevApp','saveAppName','liveUrl','updateUrlBlock','qrLinkRow','devSwitchPanel','devSwitchDevVersion','devSwitchStableVersion','devSwitchUseStable','devSwitchPromote']) assert.ok(document.querySelector('#'+id),id+' must remain available');
 // Every control acts immediately now, so the batch save bar and the manual development controls are gone.
 for(const id of ['saveApp','runStableApp','runDevApp','resetDevApp','devVersionCode','devVersionName','editUrl','editUpdateUrl','runtimeHint','shareExpiry']) assert.equal(document.querySelector('#'+id),null,id+' must be gone');
 assert.equal(document.querySelector('#managePanel .manage-save-bar'),null);
 assert.equal(document.querySelectorAll('#managePanel .segmented').length,1);
 // A linkedom Window answers every global lookup with undefined, so a missing function
 // would be exported silently instead of throwing; assert the module really exports it.
 assert.match(fs.readFileSync(root+'/core/development-state.js','utf8'),/H\.features\.manage\.openDevSwitch\(\)/);
 assert.match(fs.readFileSync(root+'/features/manage.js','utf8'),/function openDevSwitch\(\)/);
 const settings=fs.readFileSync(root+'/features/settings.js','utf8'),host=fs.readFileSync(root+'/platform/host.js','utf8');
 assert.match(settings,/shellVersionTaps\s*<\s*3/);
 assert.match(settings,/host\.call\("shell\.setMode",\s*\{ mode:"online" \}\)/);
 assert.match(settings,/host\.call\("shell\.setMode",\s*\{ mode:"local" \}\)/);
 assert.match(host,/"shell\.status"/);assert.match(host,/"shell\.setMode"/);
});
test('the happ settings module exports only callable entry points',async()=>{
 const {H}=setup();await tick();
 for(const name of ['openManage','isDirty','renderManage','renderManageDraft','openDevSwitch']) {
  assert.equal(typeof H.features.manage[name],'function','features.manage.'+name+' must be a function');
 }
});
test('dev apps receive an explicit card state and badge',async()=>{
 const {$}=setup({apps:[{...app,launchChannel:'dev',devWorkspace:{state:'dirty',revision:4}}]});await tick();
 assert.equal($('.app-card').classList.contains('dev'),true);
 assert.equal($('.dev-badge').classList.contains('hidden'),false);
 assert.equal($('.app-source').textContent,'运行开发副本 · 本机代码');
});
test('voice settings keep provider details in the store UI and expose stable user choices',async()=>{
 const {H,$,calls}=setup();await tick();await H.navigation.showView('settings');await tick();
 assert.equal($('#ttsCapabilityStatus').classList.contains('ready'),true);
 assert.equal($('#ttsEngine').querySelectorAll('option').length,2);assert.equal($('#ttsVoice').querySelectorAll('option').length,2);
 assert.equal($('#speechCapabilityStatus').classList.contains('error'),true);
 const voices=calls.find(call=>call.method==='host.voice.ttsVoices');assert.ok(voices);assert.equal('engineId' in voices.params,false);
 $('#speechOfflineSwitch').click();assert.equal($('#speechOfflineSwitch').getAttribute('aria-checked'),'true');
 $('#saveVoiceSettings').click();await tick();
 const saved=calls.find(call=>call.method==='host.voice.configure');assert.ok(saved);
 assert.equal(saved.params.speech.preferOffline,true);
});
test('online HaminnUI exposes the local recovery action',async()=>{
 const {H,$,calls}=setup({respond:method=>method==='host.shell.status'?{configuredMode:'online',runningMode:'online',localVersion:'1.10.8'}:undefined});
 await tick();await H.navigation.showView('settings');await tick();
 assert.equal($('#useLocalShell').classList.contains('hidden'),false);
 assert.match($('#shellVersionSwitch').textContent,/实时在线/);
 $('#useLocalShell').click();await tick();
 assert.ok(calls.some(call=>call.method==='host.shell.setMode'&&call.params.mode==='local'));
});
test('host keeps actionable unsupported reasons from current capability adapters',async()=>{
 const {H}=setup({respond:method=>method==='host.voice.ttsVoices'?Promise.reject(Object.assign(new Error('所选系统声音已不可用'),{code:'E_UNSUPPORTED'})):undefined});
 await assert.rejects(H.host.call('voice.ttsVoices',{}),/所选系统声音已不可用/);
});
test('interaction outlines, switch geometry and spacing are explicit CSS contracts',()=>{
 const css=fs.readFileSync(root+'/theme/interface.css','utf8');
 assert.match(css,/button:focus,a:focus,summary:focus,input:focus,select:focus\s*\{[^}]*outline:none!important/);
 assert.doesNotMatch(css,/:focus-visible\s*\{\s*outline:3px/);
 assert.match(css,/\.search-wrap:focus-within\s*\{[^}]*box-shadow:none/);
 assert.match(css,/\.switch\s*\{[^}]*position:relative[^}]*width:54px[^}]*height:32px[^}]*overflow:hidden[^}]*padding:0/);
 assert.match(css,/\.switch span\s*\{[^}]*position:absolute[^}]*top:4px[^}]*left:4px[^}]*width:24px[^}]*height:24px/);
 assert.match(css,/\.switch\.on span\s*\{\s*transform:translateX\(22px\)/);
 assert.match(css,/\.bottom-nav button\.active \.nav-icon\s*\{[^}]*background:transparent/);
 assert.match(css,/\.bottom-nav button\s*\{[^}]*color:var\(--nav-inactive\)/);
 assert.match(css,/\.bottom-nav button\.active\s*\{[^}]*color:var\(--nav-active\)/);
 assert.match(css,/\.modal button\.primary\s*\{[^}]*background:var\(--primary\)[^}]*color:var\(--on-primary\)/);
 assert.match(css,/\.modal button\.danger\s*\{[^}]*background:var\(--surface\)[^}]*color:var\(--danger\)/);
 assert.match(css,/\.panel-head \.icon-button\s*\{[^}]*width:44px[^}]*height:44px[^}]*border-radius:50%[^}]*background:transparent/);
 assert.match(css,/\.launch\s*\{[^}]*gap:14px/);
 assert.match(css,/\.setting-row\s*\{[^}]*gap:14px/);
 assert.match(css,/\.card-footer > div\s*\{[^}]*gap:3px/);
 assert.match(css,/\.agent-secret button \{[^}]*margin:0 0 0 14px/);
 assert.match(css,/\.agent-address-row \.agent-address-actions \{[^}]*display:flex[^}]*gap:10px/);
 assert.match(css,/@media\(max-width:350px\)[\s\S]*?\.agent-secret button \{[^}]*margin-left:8px/);
  assert.match(css,/\.actions,\.action-grid\s*\{[^}]*display:grid[^}]*gap:10px/);
  assert.match(css,/\.legacy-webview \.actions,\.legacy-webview \.action-grid\{[^}]*display:flex[^}]*gap:0/);
  assert.match(css,/\.legacy-webview \.actions>\*,\.legacy-webview \.action-grid>\*\{[^}]*flex:1 1 0[^}]*min-width:0/);
  assert.match(css,/\.legacy-webview \.actions>\*\+\*,\.legacy-webview \.action-grid>\*\+\*\{margin-left:10px\}/);
 assert.match(css,/\.legacy-webview \.launch>\.app-icon\{margin-right:14px\}/);
 assert.match(css,/\.developer-card,\.settings-card\s*\{[^}]*border:0[^}]*background:transparent[^}]*box-shadow:none/);
});
test('semantic button colors keep readable contrast in light and dark themes',()=>{
 const source=fs.readFileSync(root+'/theme/tokens.css','utf8');
 const blocks=[source.match(/:root\s*\{([^}]*)\}/)?.[1],source.match(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1]];
 const luminance=hex=>{
  const channels=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
 };
 const contrast=(a,b)=>{const [low,high]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return (high+.05)/(low+.05);};
 for(const block of blocks) {
  assert.ok(block);
  const colors=Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(match=>[match[1],match[2]]));
  for(const [foreground,background] of [['ink','surface'],['on-primary','primary'],['danger','surface'],['disabled-ink','soft'],['primary','blue-bg'],['muted','surface'],['nav-active','blue-bg'],['nav-inactive','surface']]) {
   assert.ok(contrast(colors[foreground],colors[background])>=4.5,`${foreground} on ${background} must reach 4.5:1`);
  }
 }
 assert.match(blocks[1],/--bg:\s*#05050a/);
 assert.match(blocks[1],/--surface:\s*#15151e/);
 assert.match(blocks[1],/--surface-solid:\s*#1c1c27/);
 assert.match(blocks[1],/--chrome:\s*#0d0d15/);
 assert.match(source,/--blue:#006dff/);assert.match(source,/--blue:#2997ff/);
 const interfaceCss=fs.readFileSync(root+'/theme/interface.css','utf8');
 assert.match(interfaceCss,/\.theme-logo[^}]*mask:url\("\.\.\/assets\/haminn-mark\.svg"\)/);
 assert.doesNotMatch(interfaceCss,/\.brand-mark img[^}]*filter:invert/);
 assert.match(interfaceCss,/\.brand-mark[^}]*background:#fff[^}]*color:#000/);
 assert.match(interfaceCss,/:root\[data-theme="dark"\] \.brand-mark[^}]*background:#000[^}]*color:#fff/);
});
test('stale list request cannot overwrite a later response',async()=>{
 const {H,$,w}=setup();await tick();let resolveOld,n=0;
 w.haminn.call=async(method)=>{if(method==='host.apps.list'){n++;if(n===1)return new Promise(r=>resolveOld=r);return {apps:[{...app,name:'新版'}]};}return {};};
 const old=H.features.library.refresh();await H.features.library.refresh();resolveOld({apps:[{...app,name:'旧版'}]});await old;
 assert.equal($('.app-name').textContent,'新版');
});
test('returning to the foreground reuses the mounted library instead of replaying the view',async()=>{
 const {w,$,calls}=setup();await tick();
 const mounted=$('#apps').children[0];
 mounted.dataset.mounted='1';
 const reads=()=>calls.filter(call=>call.method==='host.apps.list').length,before=reads();
 // One return reports itself twice; the system signal and the Host signal must share one pass.
 w.document.hidden=false;
 w.dispatchEvent(new w.Event('haminnresume'));
 w.document.dispatchEvent(new w.Event('visibilitychange'));
 await tick();await tick();
 assert.equal($('#apps').children[0].dataset.mounted,'1','the mounted card was replaced by a resume');
 assert.equal(reads(),before+1);
});
test('a library answer that changed still rebuilds the cards on return',async()=>{
 const {w,$}=setup();await tick();
 $('#apps').children[0].dataset.mounted='1';
 w.haminn.call=async(method)=>method==='host.apps.list'?{apps:[{...app,name:'改名后'}]}:{};
 w.dispatchEvent(new w.Event('haminnresume'));
 await tick();await tick();
 assert.notEqual($('#apps').children[0].dataset.mounted,'1');
 assert.equal($('.app-name').textContent,'改名后');
});
test('a library read that changed nothing keeps the mounted cards in place',async()=>{
 const {H,$}=setup();await tick();
 $('#apps').children[0].dataset.mounted='1';
 await H.features.library.refresh();
 assert.equal($('#apps').children[0].dataset.mounted,'1','the card was rebuilt although the data did not change');
});
test('a cold start opens the home tab instead of the tab the previous session ended on',async()=>{
 const {H,storage}=setup();await tick();
 const remembered=()=>JSON.parse(storage.get(H.VIEW_STATE_KEY)).currentView;
 assert.equal(H.navigation.initialView(),'favorites');
 await H.navigation.showView('settings',false);
 assert.equal(remembered(),'settings');
 assert.equal(H.navigation.initialView(),'favorites');
});
test('desktop shortcut state controls the happ card pin affordance',async()=>{
 const pinned={...app,desktopShortcutState:'pinned'};const {H,$,calls}=setup({apps:[pinned]});await tick();
 const button=$('.app-card .pin');
 assert.equal(button.classList.contains('active'),true);assert.equal(button.getAttribute('aria-pressed'),'true');assert.match(button.title,/已添加/);
 button.click();await tick();
 assert.equal(calls.some(call=>call.method==='host.apps.pin'),false);assert.match($('#noticeText').textContent,/仍然存在/);
 await H.features.manage.openManage(H.state.apps[0]);
 // The desktop action is only offered while no icon for this instance was detected.
 assert.equal($('#managePin').classList.contains('hidden'),true);
});
test('unsupported launchers disable only the desktop pin action',async()=>{
 const unsupported={...app,desktopShortcutState:'unsupported'};const {H,$}=setup({apps:[unsupported]});await tick();
 assert.equal($('.app-card .pin').disabled,true);assert.equal($('.app-card .manage').disabled,false);
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#managePin').classList.contains('hidden'),true);
});
test('a not-pinned instance offers the desktop action inside the settings sheet',async()=>{
 const plain={...app,desktopShortcutState:'notPinned'};const {H,$}=setup({apps:[plain]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#managePin').classList.contains('hidden'),false);
 assert.equal($('#managePin').disabled,false);
});
test('cancelled ZIP picker neither closes existing state nor claims success',async()=>{
 const {$,calls}=setup({respond:m=>m==='host.apps.inspectZip'?{cancelled:true}:undefined});await tick();$('#addZip').click();await tick();
 const call=calls.find(c=>c.method==='host.apps.inspectZip');assert.ok(call);assert.equal(calls.some(c=>c.method==='host.apps.importZip'),false);
 assert.match($('#noticeText').textContent,/取消/);assert.equal($('#apps').children.length,1);
});
test('a picked ZIP keeps name and icon editing unavailable until inspection resolves',async()=>{
 const preview={cancelled:false,kind:'package',token:'token-zip',manifestFound:true,name:'chataxi',versionName:'0.6.15-web.1',happId:'life.airen.chataxi',entry:'index.html',iconDataUrl:'',bytes:974848};
 let finishInspection;const inspection=new Promise(resolve=>{finishInspection=resolve;});
 const {$,calls}=setup({respond:(m)=>m==='host.apps.inspectZip'?inspection:m==='host.apps.confirmInspect'?{cancelled:false,appId:'life.airen.chataxi',installStrategy:'local'}:undefined});await tick();
 $('#addZip').click();await tick();
 assert.equal($('#addPanel').classList.contains('hidden'),true);
 assert.equal($('#appEditor').classList.contains('hidden'),true);
 finishInspection(preview);await tick();await tick();
 assert.equal($('#addPanel').classList.contains('hidden'),false);assert.equal($('#confirmAddLabel').textContent,'确认安装');
 assert.equal($('#appEditor').classList.contains('hidden'),false);
 assert.equal($('#urlField').classList.contains('hidden'),true);assert.equal($('#name').value,'chataxi');
 assert.match($('#manifestStatus').textContent,/life\.airen\.chataxi/);assert.match($('#manifestStatus').textContent,/0\.6\.15-web\.1/);
 assert.equal(calls.some(c=>c.method==='host.apps.confirmInspect'),false);
 $('#confirmAdd').click();await tick();await tick();
 const confirm=calls.find(c=>c.method==='host.apps.confirmInspect');
 assert.equal(confirm.params.token,'token-zip');assert.equal(confirm.params.favorite,true);assert.equal(confirm.params.name,'chataxi');
});
test('a URL keeps name and icon editing unavailable until its package is resolved',async()=>{
 const preview={cancelled:false,kind:'package',token:'token-url',manifestFound:true,name:'chataxi',versionName:'0.6.15-web.1',happId:'life.airen.chataxi',entry:'index.html',iconDataUrl:'',bytes:974848};
 const {$,calls}=setup({respond:(m)=>m==='host.apps.inspectUrl'?preview:m==='host.apps.confirmInspect'?{cancelled:false,appId:'life.airen.chataxi',installStrategy:'local'}:undefined});await tick();
 $('#addUrl').click();
 assert.equal($('#appEditor').classList.contains('hidden'),true);assert.equal($('#name').value,'');
 $('#url').value='https://haminn.airen.life/downloads/happs/life.airen.chataxi/haminn-install.json';
 $('#confirmAdd').click();await tick();await tick();
 assert.equal(calls.some(c=>c.method==='host.apps.installOnline'),false);assert.equal($('#confirmAddLabel').textContent,'确认安装');
 assert.equal($('#appEditor').classList.contains('hidden'),false);assert.equal($('#name').value,'chataxi');
 assert.equal($('#urlField').classList.contains('hidden'),true);
 $('#confirmAdd').click();await tick();await tick();
 assert.equal(calls.find(c=>c.method==='host.apps.confirmInspect').params.token,'token-url');
});
test('a plain URL requires resolution before the editable confirmation and installation steps',async()=>{
 const {$,calls}=setup({respond:(m)=>m==='host.apps.inspectUrl'?{cancelled:false,kind:'live',pageUrl:'https://example.com/',suggestedName:'example.com'}:undefined});await tick();
 $('#addUrl').click();assert.equal($('#appEditor').classList.contains('hidden'),true);
 $('#url').value='https://example.com/';$('#confirmAdd').click();await tick();await tick();
 assert.equal($('#appEditor').classList.contains('hidden'),false);assert.equal($('#name').value,'example.com');
 assert.equal($('#confirmAddLabel').textContent,'确认添加');assert.equal(calls.some(c=>c.method==='host.apps.installOnline'),false);
 $('#name').value='Example';$('#confirmAdd').click();await tick();await tick();
 const installed=calls.find(c=>c.method==='host.apps.installOnline');assert.equal(installed.params.url,'https://example.com/');assert.equal(installed.params.name,'Example');
 assert.equal(calls.some(c=>c.method==='host.apps.confirmInspect'),false);
});
test('a QR-scanned package URL stays read-only until resolution and confirmation',async()=>{
 const preview={cancelled:false,kind:'package',token:'token-qr',manifestFound:true,name:'PoseGi',versionName:'0.1.17-web.1',happId:'life.airen.posegi',entry:'index.html',iconDataUrl:'',bytes:123456};
 const {$,calls}=setup({respond:(m)=>m==='host.apps.scanQr'?{cancelled:false,kind:'url',url:'https://posegi.example/install.json'}:m==='host.apps.inspectUrl'?preview:m==='host.apps.confirmInspect'?{cancelled:false,appId:'life.airen.posegi',installStrategy:'local'}:undefined});await tick();
 $('#scanQr').click();await tick();await tick();
 assert.equal($('#appEditor').classList.contains('hidden'),true);assert.equal($('#url').value,'https://posegi.example/install.json');
 $('#confirmAdd').click();await tick();await tick();
 assert.equal($('#appEditor').classList.contains('hidden'),false);assert.equal($('#addSourceLabel').textContent,'已解析安装包');
 assert.equal($('#confirmAddLabel').textContent,'确认安装');assert.equal(calls.some(c=>c.method==='host.apps.confirmInspect'),false);
 $('#name').value='PoseGi';$('#confirmAdd').click();await tick();await tick();
 const installed=calls.find(c=>c.method==='host.apps.confirmInspect');assert.equal(installed.params.token,'token-qr');assert.equal(installed.params.name,'PoseGi');
});
test('Native install decisions use the shared HaminnUI rounded prompt',async()=>{
 const {w,$,calls}=setup();await tick();
 const handled=w.haminnNativePrompt({token:'prompt-1',title:'发现相同 happId 的实例',message:'请选择安装方式。',choices:[
  {value:'cancel',label:'取消'},{value:'new',label:'全新安装'},{value:'update',label:'更新原实例',emphasis:'primary'}
 ]});
 assert.equal(handled,true);assert.equal($('#hostPromptPanel').classList.contains('hidden'),false);
 assert.equal($('#hostPromptTitle').textContent,'发现相同 happId 的实例');
 const buttons=$('#hostPromptActions').querySelectorAll('button');assert.equal(buttons.length,3);assert.equal(buttons[2].classList.contains('primary'),true);
 buttons[1].click();await tick();
 const resolved=calls.find(call=>call.method==='host.dialog.resolve');assert.equal(resolved.params.token,'prompt-1');assert.equal(resolved.params.choice,'new');
 assert.equal($('#hostPromptPanel').classList.contains('hidden'),true);
});
test('shared URLs require resolution before edits and HTTP confirmation stays in HaminnUI',async()=>{
 const {w,$,calls}=setup({respond:(method,params)=>method==='host.apps.inspectUrl'?{cancelled:false,kind:'live',suggestedName:'device.test'}:method==='host.apps.installOnline'?{cancelled:false,installStrategy:'live',installKind:'live',appId:'live-app'}:undefined});await tick();
 w.haminnOpenSharedUrl('http://device.test/page');
 assert.equal($('#addPanel').classList.contains('hidden'),false);assert.equal($('#url').value,'http://device.test/page');assert.equal($('#appEditor').classList.contains('hidden'),true);
 $('#confirmAdd').click();await tick();
 assert.equal($('#confirmPanel').classList.contains('hidden'),false);assert.match($('#confirmTitle').textContent,/未加密/);
 $('#acceptConfirm').click();await tick();await tick();
 assert.equal($('#appEditor').classList.contains('hidden'),false);assert.equal($('#name').value,'device.test');
 assert.equal(calls.some(call=>call.method==='host.apps.installOnline'),false);
 $('#name').value='设备网页';$('#confirmAdd').click();await tick();await tick();
 const installed=calls.find(call=>call.method==='host.apps.installOnline');assert.equal(installed.params.url,'http://device.test/page');assert.equal(installed.params.insecureConfirmed,true);assert.equal(installed.params.name,'设备网页');
});
test('the app name saves from its own button and never sends unrelated fields',async()=>{
 const live=structuredClone(app);
 const {H,$,calls}=setup({apps:[live],respond:(m,params)=>{if(m==='host.apps.update'){live.name=params.name;return live;}return undefined;}});await tick();
 await H.features.manage.openManage(H.state.apps[0]);calls.length=0;
 assert.equal($('#saveAppName').disabled,true);
 $('#editName').value='新名字';$('#saveAppName').disabled=false;$('#saveAppName').click();await tick();await tick();
 assert.deepEqual(calls.filter(c=>c.method!=='host.apps.list').map(c=>c.method),['host.apps.update']);
 assert.equal(calls.find(c=>c.method==='host.apps.update').params.name,'新名字');
 assert.equal('url' in calls.find(c=>c.method==='host.apps.update').params,false);
 assert.equal($('#editName').value,'新名字');assert.equal($('#saveAppName').disabled,true);
});
test('a picked icon is applied immediately without touching the addresses',async()=>{
 const icon='data:image/png;base64,aWNvbg==';const live=structuredClone(app);
 const {H,$,calls}=setup({apps:[live],respond:(m,params)=>{
  if(m==='host.apps.pickIcon') return {cancelled:false,preview:icon};
  if(m==='host.apps.updatePresentation'){live.iconUrl=params.iconPreviewDataUrl;live.customIconUrl=live.iconUrl;live.hasCustomIcon=true;return live;}
  return undefined;
 }});await tick();
 H.ui.cropIcon=async()=>icon;
 await H.features.manage.openManage(H.state.apps[0]);
 $('#editAppIcon').click();await tick();await tick();await tick();
 const update=calls.find(call=>call.method==='host.apps.updatePresentation');
 assert.ok(update);assert.equal(update.params.iconPreviewDataUrl,icon);
 assert.equal(calls.some(call=>call.method==='host.apps.updateUrls'),false);
 assert.equal($('#removeCustomAppIcon').classList.contains('hidden'),false);
 assert.match($('#noticeText').textContent,/图标已更新/);
});
test('removing a custom icon restores the happ icon but never removes the manifest icon',async()=>{
 const custom='data:image/png;base64,Y3VzdG9t',fallback='data:image/png;base64,ZGVmYXVsdA==';
 const live={...app,iconUrl:custom,customIconUrl:custom,defaultIconUrl:fallback,hasCustomIcon:true};
 const {H,$,calls}=setup({apps:[live],respond:(m)=>{
  if(m==='host.apps.updatePresentation'){live.iconUrl=null;live.customIconUrl=null;live.hasCustomIcon=false;return live;}
  return undefined;
 }});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#removeCustomAppIcon').classList.contains('hidden'),false);
 assert.equal($('#editIconPreview').style.backgroundImage.includes('Y3VzdG9t'),true);
 $('#removeCustomAppIcon').click();await tick();await tick();await tick();
 const update=calls.find(call=>call.method==='host.apps.updatePresentation');
 assert.equal(update.params.iconPreviewDataUrl,'');
 assert.equal($('#removeCustomAppIcon').classList.contains('hidden'),true);
 assert.equal($('#editIconPreview').style.backgroundImage.includes('ZGVmYXVsdA'),true);
});
test('a happ with no icon of its own previews the first character of its name',async()=>{
 const plain={...app,name:'chataxi',iconUrl:null,customIconUrl:null,defaultIconUrl:null,hasCustomIcon:false};
 const {H,$}=setup({apps:[plain]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#editIconPreview').textContent,'C');
 assert.equal($('#removeCustomAppIcon').classList.contains('hidden'),true);
});
test('icon picker keeps its preview mounted and crop geometry stays inside the source image',async()=>{
 const {H,$}=setup();await tick();const picker=$('#editAppIcon'),preview=$('#editIconPreview');let finish;
 const operation=H.ui.busy(picker,()=>new Promise(resolve=>finish=resolve));
 assert.equal($('#editIconPreview'),preview);finish();await operation;
 const crop=H.ui.iconCropGeometry(800,400,320,1,0,0);
 assert.deepEqual({sourceX:crop.sourceX,sourceY:crop.sourceY,sourceSize:crop.sourceSize},{sourceX:200,sourceY:0,sourceSize:400});
});
test('switches apply immediately and a failed switch keeps the stored value',async()=>{
 const live=structuredClone(app);
 const {H,$,calls}=setup({apps:[live],respond:(m,params)=>{
  if(m==='host.apps.setNotificationEnabled'){live.notificationEnabled=params.enabled;return live;}
  if(m==='host.apps.setCrossOriginNetwork') return Promise.reject(new Error('网络设置写入失败'));
  return undefined;
 }});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#managePanel .manage-save-bar'),null);
 $('#notificationSwitch').click();await tick();await tick();
 const notification=calls.find(c=>c.method==='host.apps.setNotificationEnabled');
 assert.equal(notification.params.enabled,true);assert.equal($('#notificationSwitch').getAttribute('aria-checked'),'true');
 $('#crossOriginSwitch').click();await tick();
 assert.equal($('#confirmPanel').classList.contains('hidden'),false);
 $('#acceptConfirm').click();await tick();
 await tick();await tick();
 assert.match($('#noticeText').textContent,/写入失败/);
 assert.equal($('#crossOriginSwitch').getAttribute('aria-checked'),'false');
});
test('runtime, update and install source controls reflect what the happ ships',async()=>{
 const localOnly={...app,liveUrl:null,liveAvailable:false,runtimeMode:'local',updateUrl:null,downloadUrl:null,sourcePath:'/storage/emulated/0/Download/chataxi.zip'};
 const {H,$}=setup({apps:[localOnly]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#runtimeChoices [data-runtime-mode="live"]').disabled,true);
 assert.equal($('#runtimeChoices [data-runtime-mode="local"]').disabled,false);
 assert.equal($('#updateUrlBlock').classList.contains('hidden'),true);
 assert.equal($('#liveUrl').textContent,'无');
 assert.equal($('#downloadUrl').textContent,'/storage/emulated/0/Download/chataxi.zip');
 assert.equal($('#downloadKind').textContent,'从本机文件安装');
 assert.equal($('#qrLinkRow').classList.contains('hidden'),true);
 assert.equal($('#reinstallApp').disabled,false);
});
test('a link install exposes the address together with its haminn:// QR link',async()=>{
 const link='https://haminn.airen.life/downloads/happs/life.airen.chataxi/haminn-install.json';
 const linked={...app,sourcePath:null,downloadUrl:link,liveUrl:null,liveAvailable:false};
 const {H,$}=setup({apps:[linked]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#runtimeChoices [data-runtime-mode="live"]').disabled,true);
 assert.equal($('#updateUrlBlock').classList.contains('hidden'),false);
 assert.equal($('#downloadUrl').textContent,link);
 assert.equal($('#downloadKind').textContent,'从链接地址安装');
 assert.equal($('#qrLinkRow').classList.contains('hidden'),false);
 assert.equal($('#qrLink').textContent,'haminn://add?url='+encodeURIComponent(link));
 assert.equal($('#reinstallApp').disabled,false);
});
test('reinstalling uses the recorded original source',async()=>{
 const {H,$,calls}=setup();await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 $('#reinstallApp').click();await tick();
 assert.equal($('#confirmPanel').classList.contains('hidden'),false);
 $('#acceptConfirm').click();await tick();await tick();
 const reinstall=calls.find(c=>c.method==='host.apps.reinstall');assert.equal(reinstall.params.appId,app.appId);
});
test('unsaved edits survive a cancelled discard prompt',async()=>{
 const {H,$}=setup();await tick();await H.features.manage.openManage(app);$('#editName').value='草稿';assert.equal(H.features.manage.isDirty(),true);
 const close=H.ui.requestClose('#managePanel');$('#cancelConfirm').click();await close;
 assert.equal($('#managePanel').classList.contains('hidden'),false);assert.equal($('#editName').value,'草稿');
});
test('destructive uninstall requires explicit final confirmation',async()=>{
 const {H,$,calls}=setup();await tick();await H.features.manage.openManage(app);$('#uninstallApp').click();$('#removeApp').click();await tick();
 assert.equal(calls.some(c=>c.method==='host.apps.remove'),false);$('#cancelConfirm').click();await tick();assert.equal(calls.some(c=>c.method==='host.apps.remove'),false);
 $('#removeApp').click();await tick();$('#acceptConfirm').click();await tick();assert.equal(calls.filter(c=>c.method==='host.apps.remove').length,1);
});
test('export backup is reachable and picker cancellation is a terminal state',async()=>{
 const {H,$,calls}=setup({respond:m=>m==='host.backup.export'?{cancelled:true}:undefined});await tick();await H.features.manage.openManage(app);
 $('#backupApp').click();await tick();$('#acceptConfirm').click();await tick();assert.equal(calls.find(c=>c.method==='host.backup.export').params.appId,app.appId);assert.match($('#noticeText').textContent,/取消导出/);
});
test('modal stack orders nested dialogs above their parent',async()=>{
 const {H,$}=setup();await tick();await H.features.manage.openManage(app);H.ui.open('#uninstallPanel');
 const pending=H.ui.confirmAction('确认','说明');assert.ok(Number($('#confirmPanel').style.zIndex)>Number($('#uninstallPanel').style.zIndex));$('#cancelConfirm').click();await pending;
 assert.equal($('#uninstallPanel').getAttribute('aria-hidden'),null);assert.equal($('#shell').getAttribute('aria-hidden'),'true');
});
test('unknown Host methods are blocked and development secrets are not persisted',async()=>{
 const {H,storage}=setup();await tick();await assert.rejects(H.host.call('admin.arbitrary'),/未登记/);
 await H.navigation.showView('development');H.navigation.captureViewState();const raw=[...storage.values()].join('');assert.equal(/password|token|8766/.test(raw),false);
});
test('developer endpoint refresh reports an address change once without persisting the address',async()=>{
 const status={enabled:true,active:true,networkAvailable:true,address:'http://192.168.8.9:8766',addresses:['192.168.8.9'],events:[],endpointChange:{revision:4,previousAddress:'http://192.168.8.8:8766',address:'http://192.168.8.9:8766',available:true}};
 const {H,$,calls,storage}=setup({respond:method=>method==='host.agent.status'||method==='host.agent.refresh'?status:undefined});await tick();await tick();
 assert.equal($('#agentEndpointPanel').classList.contains('hidden'),false);
 assert.equal($('#agentPreviousAddress').textContent,'http://192.168.8.8:8766');
 assert.equal($('#agentCurrentAddress').textContent,'http://192.168.8.9:8766');
 $('#ackAgentEndpoint').click();await tick();
 assert.equal($('#agentEndpointPanel').classList.contains('hidden'),true);
 assert.equal(storage.get('haminn.agent-endpoint-ack.v1'),'4');
 $('#refreshAgentAddress').click();await tick();
 assert.ok(calls.some(call=>call.method==='host.agent.refresh'));
 assert.equal($('#agentEndpointPanel').classList.contains('hidden'),true);
 assert.equal([...storage.values()].some(value=>String(value).includes('192.168.8.9')),false);
});
test('development password stays read only until the editor saves a six-digit replacement',async()=>{
 const base={enabled:true,active:true,networkAvailable:true,address:'http://192.168.8.9:8766',addresses:['192.168.8.9'],events:[],password:'123456'};
 const {H,$,calls}=setup({respond:(method,params)=>{
  if(method==='host.agent.status') return base;
  if(method==='host.agent.resetPassword') return {...base,password:params.password};
 }});await tick();await tick();
 assert.equal($('#agentPassword').hasAttribute('readonly'),true);assert.equal($('#agentPassword').value,'123456');assert.equal($('#saveAgentPassword').closest('#agentPasswordPanel')!==null,true);
 $('#editAgentPassword').click();await tick();assert.equal($('#agentPasswordPanel').classList.contains('hidden'),false);assert.equal($('#agentPasswordDraft').value,'123456');
 $('#randomAgentPassword').click();await tick();const generated=$('#agentPasswordDraft').value;assert.match(generated,/^[0-9]{6}$/);
 $('#saveAgentPassword').click();await tick();await tick();
 const reset=calls.find(call=>call.method==='host.agent.resetPassword');assert.equal(reset.params.password,generated);assert.equal($('#agentPassword').value,generated);assert.equal($('#agentPasswordPanel').classList.contains('hidden'),true);
 assert.equal(H.state.modals.some(item=>item.element===$('#agentPasswordPanel')),false);
});
test('the development section only reports the running channel, version and export',async()=>{
 const dev={...app,launchChannel:'dev',activeVersion:{code:3,name:'2.4.0'},devWorkspace:{state:'dirty',revision:4,devVersion:{code:9,name:'2.5.0'}}};
 const {H,$}=setup({apps:[dev]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#devWorkspaceStatus').textContent,'开发副本模式运行 · 版本 2.5.0');
 assert.equal($('#switchToStable').classList.contains('hidden'),false);
 assert.equal($('#exportDevApp').disabled,false);
 assert.equal($('#managePanel input[type="number"]'),null);
});
test('a stable instance hides the switch action and reports the stable version',async()=>{
 const {H,$}=setup();await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 assert.equal($('#devWorkspaceStatus').textContent,'正式运行 · 版本 2.4.0');
 assert.equal($('#switchToStable').classList.contains('hidden'),true);
});
test('switching back to stable shows both versions and promotes only on request',async()=>{
 const dev={...app,launchChannel:'dev',activeVersion:{code:3,name:'2.4.0'},devWorkspace:{state:'dirty',revision:4,devVersion:{code:9,name:'2.5.0'}}};
 const {H,$,calls}=setup({apps:[dev]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 $('#switchToStable').click();await tick();
 assert.equal($('#devSwitchPanel').classList.contains('hidden'),false);
 assert.equal($('#devSwitchDevVersion').textContent,'2.5.0');
 assert.equal($('#devSwitchStableVersion').textContent,'2.4.0');
 $('#devSwitchUseStable').click();await tick();await tick();
 assert.equal(calls.some(c=>c.method==='host.apps.leaveDev'),true);
 assert.equal(calls.some(c=>c.method==='host.apps.promoteDev'),false);
});
test('promoting the development workspace installs it as the stable version',async()=>{
 const dev={...app,launchChannel:'dev',activeVersion:{code:3,name:'2.4.0'},devWorkspace:{state:'dirty',revision:4,devVersion:{code:9,name:'2.5.0'}}};
 const {H,$,calls}=setup({apps:[dev]});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 $('#switchToStable').click();await tick();
 $('#devSwitchPromote').click();await tick();await tick();await tick();
 assert.equal(calls.some(c=>c.method==='host.apps.promoteDev'),true);
 assert.equal(calls.some(c=>c.method==='host.apps.leaveDev'),false);
});
test('the share sheet carries one QR hint and saves the session package',async()=>{
 const online={sessionId:'share-1',name:'随手记',versionName:'2.4.0',bytes:2048,snapshot:'release',networkAvailable:true,qrUrl:'/__haminn/share/out/share-1/qr.png'};
 const {H,$,calls}=setup({respond:m=>m==='host.apps.shareStart'?online:undefined});
 await tick();
 await H.features.share.openOutbound(H.state.apps[0]);
 assert.equal($('#shareQrBox').classList.contains('hidden'),false);
 assert.equal($('#shareNetworkHint').textContent,'让朋友使用Haminn应用扫码即可安装同款应用。二维码1小时有效。');
 assert.equal($('#shareExpiry'),null);
 $('#saveSharedPackage').click();await tick();
 const saved=calls.find(c=>c.method==='host.apps.shareSave');
 assert.equal(saved.params.sessionId,'share-1');
});
test('a share without a local network swaps the QR for the fallback hint',async()=>{
 const offline={sessionId:'share-2',name:'随手记',bytes:2048,snapshot:'release',networkAvailable:false,qrUrl:null};
 const {H,$}=setup({respond:m=>m==='host.apps.shareStart'?offline:undefined});
 await tick();
 await H.features.share.openOutbound(H.state.apps[0]);
 assert.equal($('#shareQrBox').classList.contains('hidden'),true);
 assert.equal($('#shareNetworkHint').textContent,'未检测到可用局域网，不会启动下载服务。你仍可保存或发送安装包。');
});
test('exporting the running version snapshots it without starting a share server',async()=>{
 const {H,$,calls}=setup({respond:m=>m==='host.apps.shareStart'?{sessionId:'share-1',name:'随手记',bytes:2048,snapshot:'release'}:m==='host.apps.shareSave'?{cancelled:false,saved:true}:undefined});await tick();
 await H.features.manage.openManage(H.state.apps[0]);
 $('#exportDevApp').click();await tick();await tick();await tick();
 const start=calls.find(c=>c.method==='host.apps.shareStart');
 assert.ok(start);assert.equal(start.params.network,false);
 assert.ok(calls.some(c=>c.method==='host.apps.shareSave'&&c.params.sessionId==='share-1'));
 assert.ok(calls.some(c=>c.method==='host.apps.shareStop'&&c.params.sessionId==='share-1'));
 assert.match($('#noticeText').textContent,/导出为 Zip/);
});
test('the fixed HaminnUI development hook restores its tab and a reachable manage draft',async()=>{
 const {w,H,$,storage}=setup();await tick();await tick();
 await H.navigation.showView('development',false);
 const viewSnapshot=w.haminnDevState.capture();
 assert.equal(viewSnapshot.view,'development');
 await H.navigation.showView('favorites',false);w.haminnDevState.restore(viewSnapshot);await tick();await tick();
 assert.equal(H.state.view,'development');

 await H.features.manage.openManage(H.state.apps[0]);
 $('#editName').value='尚未保存的名称';H.features.manage.renderManageDraft();
 const manageSnapshot=w.haminnDevState.capture();
 H.ui.close('#managePanel');w.haminnDevState.restore(manageSnapshot);await tick();await tick();
 assert.equal($('#managePanel').classList.contains('hidden'),false);
 assert.equal($('#editName').value,'尚未保存的名称');
 assert.equal(/password|token|8766/.test(JSON.stringify(manageSnapshot)+[...storage.values()].join('')),false);
});
test('pending modal operation locks editing and cannot be dismissed',async()=>{
 const {H,$}=setup();await tick();await H.features.manage.openManage(app);
 let finish;const operation=H.ui.busy($('#backupApp'),()=>new Promise(resolve=>finish=resolve));
 assert.equal($('#editName').disabled,true);await H.ui.requestClose('#managePanel');assert.equal($('#managePanel').classList.contains('hidden'),false);
 finish();await operation;assert.equal($('#editName').disabled,false);assert.equal($('#saveAppName').disabled,true);
});
const autoBackupConfig={enabled:false,directoryName:null,hasDirectory:false,keepCount:3,hour:3,minute:0,needsPermission:false,running:false,lastStatus:null,lastMessage:null,lastFileName:null,lastBytes:0,lastRunAt:0,exactAlarmAvailable:true,nextRunAt:1758520000000,batteryPercent:80,minBatteryPercent:20};
test('the backup folder label survives the picker button going busy',async()=>{
 let releasePick;
 const {$,calls}=setup({respond:(method,params)=>{
  if(method==='host.backup.autoBackup.get') return autoBackupConfig;
  if(method==='host.backup.autoBackup.pickDirectory') return new Promise(resolve=>{releasePick=()=>resolve({cancelled:false,directoryName:'HaminnAutoBackup'});});
  if(method==='host.backup.autoBackup.save') return {...autoBackupConfig,enabled:params.enabled,directoryName:'HaminnAutoBackup',saved:true};
 }});
 await tick();await tick();
 $('#openAutoBackup').click();await tick();
 assert.equal($('#autoBackupPanel').classList.contains('hidden'),false);
 assert.equal($('#autoBackupDirectory').textContent,'尚未选择');assert.equal($('#autoBackupTime').value,'03:00');
 // 份数 is a bottom sheet of our own style, never a native select.
 assert.equal($('#autoBackupKeepCount'),null);
 assert.equal($('#autoBackupKeepCountValue').textContent,'3 份');
 const countChoices=$('#autoBackupKeepCountChoices');
 assert.equal(countChoices.children.length,10);
 assert.equal(countChoices.firstElementChild.textContent,'1 份');
 assert.equal(countChoices.lastElementChild.textContent,'10 份');
 assert.equal(countChoices.querySelector('button[data-keep-count="3"]').classList.contains('selected'),true);

 // A busy button replaces its own children, so the label must not live inside it.
 $('#autoBackupPickDirectory').click();await tick();
 assert.equal($('#autoBackupDirectory').textContent,'尚未选择');
 releasePick();await tick();await tick();
 assert.equal($('#autoBackupDirectory').textContent,'HaminnAutoBackup');
 assert.equal($('#notice').classList.contains('hidden'),true);

 $('#autoBackupKeepCountPick').click();await tick();
 assert.equal($('#autoBackupKeepCountPanel').classList.contains('hidden'),false);
 countChoices.querySelector('button[data-keep-count="5"]').click();await tick();
 assert.equal($('#autoBackupKeepCountPanel').classList.contains('hidden'),true);
 assert.equal($('#autoBackupKeepCountValue').textContent,'5 份');
 assert.equal(countChoices.querySelector('button[data-keep-count="5"]').classList.contains('selected'),true);
 assert.equal(countChoices.querySelector('button[data-keep-count="3"]').classList.contains('selected'),false);

 $('#autoBackupSwitch').click();await tick();
 assert.equal($('#autoBackupSwitch').getAttribute('aria-checked'),'true');
 $('#autoBackupSave').click();await tick();await tick();
 const saved=calls.filter(call=>call.method==='host.backup.autoBackup.save').pop();
 assert.equal(saved.params.enabled,true);assert.equal(saved.params.hour,3);assert.equal(saved.params.minute,0);
 assert.equal(saved.params.keepCount,5);
 assert.equal(saved.params.applyPickedDirectory,true);assert.equal($('#autoBackupPanel').classList.contains('hidden'),true);
});
test('run now reports the outcome instead of a silent failure',async()=>{
 const {$,calls}=setup({respond:(method)=>{
  if(method==='host.backup.autoBackup.get') return autoBackupConfig;
  if(method==='host.backup.autoBackup.runNow') return {outcome:'failed',message:'请先选择备份目录'};
 }});
 await tick();await tick();
 $('#openAutoBackup').click();await tick();
 $('#autoBackupRunNow').click();await tick();await tick();
 assert.ok(calls.some(call=>call.method==='host.backup.autoBackup.runNow'));
 assert.equal($('#noticeText').textContent,'请先选择备份目录');assert.equal($('#notice').classList.contains('error'),true);
});
test('the interface theme lives in the Haminn database instead of local storage',async()=>{
 const {$,calls,storage}=setup({respond:(method)=>method==='host.settings.get'?{theme:'dark'}:undefined});
 await tick();await tick();
 const read=calls.find(call=>call.method==='host.settings.get');
 assert.ok(read);
 assert.equal($('#themeChoices [data-theme-choice="dark"]').classList.contains('selected'),true);
 assert.equal([...storage.keys()].some(key=>String(key).includes('theme')),false);
 $('#themeChoices [data-theme-choice="light"]').click();await tick();
 const written=calls.filter(call=>call.method==='host.settings.set').pop();
 assert.equal(written.params.key,'theme');assert.equal(written.params.value,'light');
 assert.equal([...storage.keys()].some(key=>String(key).includes('theme')),false);
});
