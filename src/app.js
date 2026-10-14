import { STORAGE_KEY, loadState, initialState, dateKey, rollDay, signIn, watchAd, openBox } from './state.js';

const $ = (selector) => document.querySelector(selector);
const escape = (text) => String(text).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const icons = {
  panel:'M3 4h18v16H3z M9 4v16', arrow:'M19 12H5m6-6-6 6 6 6', edit:'m14 5 5 5M4 20l4-1L20 7a2 2 0 0 0-4-4L4 15z',
  clock:'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', plug:'M8 3v5m8-5v5M6 8h12v4a6 6 0 0 1-6 6v3m-6-9a6 6 0 0 0 6 6',
  branch:'M6 6v12m12-12v3a3 3 0 0 1-3 3H9 M8 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M8 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  flame:'M12 3c2 5 7 7 7 12a7 7 0 0 1-14 0c0-4 3-6 3-9 1 2 2 3 2 3s3-3 2-6z', trophy:'M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8',
  folder:'M3 6h7l2 2h9v12H3z', users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m3-4a4 4 0 0 1 0 8',
  gift:'M3 8h18v4H3z M5 12v9h14v-9M12 8v13m0-13C2 8 5 0 9 4l3 4c10 0 7-8 3-4z', coin:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12',
  image:'M3 4h18v16H3z M3 16l5-5 4 4 4-6 5 7 M9 8h.01', play:'m8 5 10 7-10 7z', check:'m5 12 4 4L19 6', box:'m12 3 9 5v9l-9 5-9-5V8z M3 8l9 5 9-5m-9 5v9m-5-17 10 5',
  diamond:'m12 3 9 9-9 9-9-9z', ticket:'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v3m0 3v2m0 3v3', crown:'m3 6 5 5 4-7 4 7 5-5-2 14H5z',
  target:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0 M12 12h.01', globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18',
  bulb:'M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 4H9z', lock:'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4', plus:'M12 4v16M4 12h16', up:'M12 20V4m-7 7 7-7 7 7', down:'m6 9 6 6 6-6',
  close:'m6 6 12 12M6 18 18 6', code:'m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18', file:'M4 3h10l6 6v12H4z M14 3v6h6 M8 13h8m-8 4h6', spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z', chart:'M4 3v18h17M8 16v-5m5 5V7m5 9v-8',
};
const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.spark}"/></svg>`;
const storage = { getItem: key => window.localStorage.getItem(key) };
let state = loadState(storage);
let activeTab = '推荐', view = 'dashboard', selectedLevel = 'A7', adHidden = false, web = false, thinking = false;
let draft = '', attachment = '', toastTimer, adTimer, modalAction, sidebarOpen = false, sidebarCollapsed = false;
const fmt = (n) => n.toLocaleString('zh-CN');
const signed = () => state.signedDate === dateKey();
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast('浏览器存储不可用，本次操作仍然有效'); } }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3200); }
const btn = (action, label, cls = 'primary', attrs = '') => `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;
function sidebar() {
  const nav = [['new','edit','新建任务',''],['scheduled','clock','已安排','3'],['plugins','plug','插件',''],['pulls','branch','拉取请求','12'],['home','flame','任务大厅','16'],['achievements','trophy','我的战绩','']];
  const done = Number(signed()) + Number(state.ads >= 3) + Number(state.invited);
  return `<div class="sidebar-overlay ${sidebarOpen?'visible':''}" data-action="sidebar"></div><aside class="sidebar ${sidebarOpen?'open':''}" aria-label="侧边导航">
    <div class="brand"><span class="brand-mark">✳</span>Claude Code <small>CN</small></div>
    <nav class="nav">${nav.map(([a,i,t,n])=>btn(a,`${icon(i)}<span>${t}</span>${n?`<span class="count">${n}</span>`:''}`,`nav-btn ${a==='home'&&view==='dashboard'?'active':''}`)).join('')}</nav>
    <div><div class="section-label">项目</div>${btn('project',`${icon('folder')}示例项目 A`,'nav-btn project selected')}${btn('frontend','前端功能迭代','nav-btn project-child')}${btn('performance','接口性能优化','nav-btn project-child')}${btn('mobile',`${icon('folder')}移动端应用`,'nav-btn project')}${btn('testing',`${icon('folder')}测试自动化框架`,'nav-btn project')}</div>
    ${btn('team',`${icon('users')} 智能研发团队<br><b>SVIP</b>`,'team')}
    <div class="trial">${icon('clock')} 体验卡剩余<br><span id="trial-clock">06:23:41</span></div>
    <div class="daily"><strong>今日任务 ${done}/4</strong><p class="${signed()?'done':''}">${signed()?'✓':'○'} 每日签到</p><p class="${state.ads>=3?'done':''}">${state.ads>=3?'✓':'○'} 看 3 条广告</p><p class="${state.invited?'done':''}">${state.invited?'✓':'○'} 邀请 1 位好友</p><p>○ 消耗 1 万 Token</p></div>
  </aside>`;
}
function dashboard() {
  return `<section aria-label="福利大厅">
    ${!adHidden?`<div class="ad-banner"><div class="ad-icon">${icon('image')}</div><div><h2>开屏广告 · 每次启动必看</h2><p>A5 及以上会员可免广告直达工作区</p></div><div class="ad-actions">${btn('skip','跳过 3s '+icon('lock'),'outline-btn','id="skip-ad" disabled')}${btn('upgrade','开通免广告','pill')}</div></div>`:''}
    <div class="grid three">
      <article class="card"><span class="corner-tag">双倍</span><h2>看广告得 Token</h2><p class="subtitle">每看 1 次送 20</p><div class="ad-illustration"><span class="play">${icon('play')}</span>${icon('coin','coin')}</div>${btn('watch','立即看','primary',state.ads>=10?'disabled':'')}<p class="footnote">今日 ${state.ads}/10 次</p></article>
      <article class="card"><h2>每日签到</h2><p class="subtitle">连续 7 天最高领 120</p><div class="streak"><div>${signed()?'✓':'1'}</div><div>20</div><div>40</div><div>80</div><div>120</div></div>${btn('sign',signed()?'今日已签到':'去签到','primary',signed()?'disabled':'')}<p class="footnote">${signed()?`已连续签到 ${state.streak} 天，明天再来`:'每天一个小目标，灵感不打烊'}</p></article>
      <article class="card finance"><h2>Claude 金融 <span class="tag">热门</span></h2><p class="subtitle">闲置 Token 也生息</p><div class="finance-box"><small>昨日收益 (USD)</small><strong>+23.68</strong><p>总收益 1,234.56</p></div>${btn('finance',state.subscription?'查看我的订阅':'立即订阅','primary dark')}</article>
    </div>
    <div class="grid two">
      <article class="card blind"><div class="card-head">${icon('box')}<h2>Token 盲盒</h2><span class="price-tag">0.99$ 抽</span></div><p class="subtitle">最高 50,000 Token · 100% 中奖</p><div class="boxes">${['coin','diamond','gift','ticket','crown'].map(i=>`<div class="box">${icon(i)}</div>`).join('')}</div>${btn('box','开一个试试','primary gold')}<p class="footnote">今日剩余 ${Math.max(0,3+Math.floor(state.ads/3)-state.boxes)} 次 · 每看 3 条广告 +1 次</p></article>
      <article class="card invite"><div class="card-head"><h2>好友助力 · 砍一刀</h2><span class="tag">解锁 Opus</span></div><p class="subtitle">砍到 0 元永久解锁 Opus 4.5 全量调用</p><div class="bargain"><strong>¥${state.invited?'0.02':'0.03'}</strong><del>¥1,200</del></div><div class="progress"><span style="width:${state.invited?98:96}%"></span></div><div class="progress-label"><span>已砍 ${state.invited?13:12} 刀</span><span>还差 ${state.invited?2:3} 位新用户</span></div>${btn('invite','分享邀请码找人砍','primary coral')}</article>
    </div>
    <section class="membership" aria-label="会员中心"><div class="membership-head"><h2>${icon('crown')} Claude 会员 A1–A10</h2>${btn('upgrade','A7 及以上享 1.5x 加速 · 会员中心 ›','')}</div><div class="membership-body"><div class="member-levels"><div class="levels">${['A1','A3','A5','A7','A9','A10'].map(l=>btn('level',l,`level ${selectedLevel===l?'active':''}`,`data-level="${l}" aria-pressed="${selectedLevel===l}"`)).join('')}</div><p class="growth-copy">当前 ${state.level} · ${state.growth}/1000 成长值 · ${state.growth<1000?`距 A7 还差 ${1000-state.growth}`:'已满足 A7 成长值'}</p><div class="progress"><span style="width:${Math.min(100,state.growth/10)}%"></span></div></div><div class="member-price"><strong>¥${({A1:29,A3:99,A5:198,A7:298,A9:598,A10:998})[selectedLevel]}<small>/年</small></strong><del>¥${({A1:49,A3:199,A5:398,A7:498,A9:998,A10:1998})[selectedLevel]}</del>${btn('upgrade','立即开通','primary purple')}</div></div></section>
    <div class="grid two"><article class="card loan"><h2>Token 借呗 <span class="tag">先写后付</span></h2><p class="subtitle">余额不足自动垫付，日息 0.05%</p><p class="loan-amount">可借额度 <strong>80,000</strong></p>${btn('loan','一键开通','primary green')}</article><article class="card rank"><h2>本周消耗榜 <span class="tag">PK</span></h2><p class="subtitle">冲进前 100 名瓜分 500 万 Token</p><p class="rank-line"><span>1. 卷王本王</span><span>1,240万</span></p><p class="rank-line"><span>你 · 第 8,412 名</span><span>23万</span></p>${btn('rank','去冲榜','primary amber')}</article></div>
    <nav class="quick-links" aria-label="快捷入口">${[['gift','福利中心','rewards'],['target','任务中心','tasks'],['users','邀好友得 2000','invite'],['ticket','兑换中心','redeem']].map(([i,t,a])=>btn(a,icon(i)+t,'')).join('')}</nav>
  </section>`;
}
const workspaces = {
  '代码助手': ['把想法，写成代码。','从第一个函数，到下一次上线。',[['code','审查一段代码','检查边界条件、可读性和性能'],['branch','设计一个 API','明确接口契约和异常处理'],['bulb','解释报错信息','逐步排查问题，找到修复思路']]],
  '智能问答': ['好问题，值得好答案。','从这里开始，探索你的下一个想法。',[['bulb','拆解一个复杂问题','把大问题变成可执行的小步骤'],['file','整理会议纪要','提炼结论、行动项与负责人'],['spark','帮我构思一篇文章','先确定主题，再梳理内容结构']]],
  '数据分析': ['让数据，讲得更清楚。','探索规律，提出假设，验证想法。',[['chart','分析一份业务报表','梳理指标口径和变化趋势'],['code','编写 SQL 查询','明确数据表和查询目标'],['target','设计一个指标体系','连接业务目标与可衡量的结果']]],
  'AI 绘图': ['让灵感，有个形状。','描绘你的画面，从一段提示词开始。',[['image','设计一张文章封面','明确主体、构图和整体色调'],['spark','构思一个角色','从性格特点推导视觉设定'],['image','优化绘图提示词','补充镜头、材质与光影细节']]],
};
function workspace() { const [title,desc,cards]=workspaces[activeTab]||workspaces['智能问答']; return `<section class="workspace"><h1 class="workspace-title">${title}</h1><p class="workspace-desc">${desc}</p><div class="prompt-grid">${cards.map(([i,t,d])=>btn('prompt',`${icon(i)}<strong>${t}</strong><small>${d}</small>`,'prompt-card',`data-prompt="${t}"`)).join('')}</div></section>`; }
function chat() { return `<section class="chat" aria-label="对话记录"><div class="chat-header"><h2>一起，把想法变成现实。</h2>${btn('home','返回大厅','tool-chip')}</div><div aria-live="polite">${state.messages.map(m=>`<article class="chat-message ${m.role}"><span class="chat-role">${m.role==='user'?'你':'✳ CLAUDE 中文版 · 本地演示'}</span>${escape(m.text)}</article>`).join('')}</div></section>`; }
function modelMenu() {
  return `<div class="model-menu" id="model-menu" hidden aria-label="选择演示模型">${['A6 Sonnet','A7 Sonnet','A9 Opus mini','A10 Opus 4.5'].map((m,i)=>`${i===1?`<div class="model-speed"><span>加速倍率</span>${btn('speed',state.speed+' ›','')}</div>`:''}${btn('model',`<div><strong>${i>0&&state.level==='A6'?icon('lock'):''} ${m}</strong>${i===0?'<small>日常写码 · 加速 0/3</small>':''}</div>${state.model===m?icon('check'):i>0?'<span class="tag">体验解锁</span>':''}`,`model-option ${i>0&&state.level==='A6'?'locked':''}`,`data-model="${m}" aria-pressed="${state.model===m}"`)}`).join('')}<p class="model-tip">看 3 条广告，临时体验 A7 一次 ›</p></div>`;
}
function render() {
  if ($('#prompt')) draft=$('#prompt').value;
  rollDay(state);
  document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  $('#app').innerHTML=`<header class="topbar">${btn('sidebar',icon('panel'),'icon-btn','aria-label="切换侧边栏"')}${btn('home',icon('arrow'),'icon-btn desktop-menu','aria-label="返回大厅"')}<span class="window-title">Claude 中文版</span>${['文件','编辑','视图','帮助'].map(t=>btn('menu',t,'desktop-menu',`data-menu="${t}"`)).join('')}<span class="top-note">趣味复刻 · 非官方</span></header>${sidebar()}<main class="main"><div class="content"><div class="promo">${icon('gift')}<strong>新人专享礼</strong><span class="promo-detail">首充 6 元送 12000 Token + A2 体验卡</span>${btn('welcome',state.welcome?'已领取':'立即领取','claim',state.welcome?'disabled':'')}<div class="wallet"><span class="balance">${icon('coin')}${fmt(state.balance)}</span>${btn('recharge','充值','recharge')}</div></div><nav class="tabs" aria-label="工作区分类">${['推荐','代码助手','智能问答','数据分析','AI 绘图','更多'].map(t=>btn('tab',t+(t==='更多'?'<span class="new">NEW</span>':''),`tab ${activeTab===t?'active':''}`,`data-tab="${t}" aria-current="${activeTab===t?'page':'false'}"`)).join('')}</nav>${view==='chat'?chat():activeTab==='推荐'?dashboard():workspace()}</div><div class="composer-wrap"><form class="composer" id="chat-form"><div class="file-chip" id="file-chip">${attachment?icon('file')+escape(attachment)+btn('remove-file','×','icon-btn','aria-label="移除附件"'):''}</div><textarea id="prompt" aria-label="输入你的需求" placeholder="输入你的需求，Shift + Enter 换行" rows="2" maxlength="6000">${escape(draft)}</textarea><div class="composer-tools">${btn('attach',icon('plus'),'tool-chip','type="button" aria-label="添加附件"')}${btn('web',icon('globe')+'联网搜索','tool-chip',`type="button" aria-pressed="${web}"`)}${btn('thinking',icon('bulb')+'深度思考','tool-chip',`type="button" aria-pressed="${thinking}"`)}<span class="composer-hint">${signed()?'今天的灵感已经到账':'今日签到领 Token'}</span><div class="model-wrap">${modelMenu()}${btn('model-menu',`${escape(state.model)}<span class="speed-label"> · 加速 0/3</span>${icon('down')}`,'model-button','type="button" aria-expanded="false" aria-controls="model-menu"')}</div><button type="submit" class="send" aria-label="发送消息">${icon('up')}</button></div><input type="file" id="file-input" hidden accept=".txt,.md,.csv,.json,.js,.ts,.java,.py,.png,.jpg,.jpeg,.pdf" /></form><p class="footer">Claude 中文版 · 非官方趣味演示。余额、会员与金融功能均为模拟，不产生真实交易。</p></div></main>`;
  document.querySelectorAll('button:not([type])').forEach(b=>b.type='button');
  if (!adHidden && view==='dashboard' && activeTab==='推荐') startSkip();
}
let skipTimer, skipDeadline = Date.now()+3000;
function startSkip() {
  clearInterval(skipTimer);
  const tick=()=>{const el=$('#skip-ad');if(!el)return clearInterval(skipTimer); const seconds=Math.max(0,Math.ceil((skipDeadline-Date.now())/1000));el.disabled=seconds>0;el.textContent=seconds?`跳过 ${seconds}s`:'跳过 ›';if(!seconds)clearInterval(skipTimer);};
  tick();skipTimer=setInterval(tick,250);
}
function showModal(title, body, action) {
  clearInterval(adTimer); modalAction=action;
  const modal=$('#modal');
  modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">${title}</h2>${btn('close',icon('close'),'icon-btn','aria-label="关闭弹窗"')}</div><div class="modal-body">${body}</div>`;
  if(!modal.open)modal.showModal();document.body.classList.add('modal-open');
}
function closeModal() { clearInterval(adTimer);$('#modal').close(); document.body.classList.remove('modal-open');modalAction=null; }
$('#modal').addEventListener('close',()=>{clearInterval(adTimer);document.body.classList.remove('modal-open');modalAction=null;});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
function showUpgrade() {
  showModal('解锁更多一点灵感',`<div class="modal-hero"><small>Claude 会员 ${selectedLevel}</small><strong>更多可能性</strong><span>模型切换 · 1.5x 加速 · 免广告体验</span></div><p>这是会员界面演示。点击下方按钮将模拟开通 A7，解锁本地模型选项，不会扣费或连接支付平台。</p>${btn('confirm','免费体验 A7','primary purple')}`,()=>{state.level='A7';state.growth=Math.max(1000,state.growth);state.speed='1.5x';adHidden=true;save();closeModal();render();toast('A7 演示会员已开通');});
}
function showAd() {
  if(state.ads>=10)return toast('今天已看满 10 次，明天再来');
  showModal('休息片刻，灵感继续',`<div class="modal-hero"><small>CLAUDE 中文版 · 演示广告</small><strong>好代码，值得等待。</strong><p>给大脑放个小假，把灵感留给下一行。</p><strong class="ad-countdown" id="ad-seconds">5</strong></div>${btn('ad-reward','观看中…','primary','disabled')}<div class="demo-label">完成 5 秒演示后领取 20 Token，提前关闭不会发放。</div>`);
  const end=Date.now()+5000;
  adTimer=setInterval(()=>{const s=Math.max(0,Math.ceil((end-Date.now())/1000));if(!$('#ad-seconds'))return clearInterval(adTimer);$('#ad-seconds').textContent=s;if(s===0){clearInterval(adTimer);const b=$('[data-action="ad-reward"]');b.disabled=false;b.textContent='领取 20 Token';}},200);
}
function invite() {
  showModal('好灵感，一起分享',`<div class="modal-hero">${icon('users')}<strong>CLAUDE-CN</strong><small>你的演示邀请码</small></div><p>邀请一位同样热爱 AI 的朋友，来看看这个有点不一样的中文工作台。</p>${btn('copy-invite','复制邀请文案')}${btn('mock-invite',state.invited?'已完成助力体验':'模拟一次好友助力','primary dark',state.invited?'disabled':'')}<div class="demo-label">演示不会向任何好友发送消息，也不追踪真实邀请。</div>`);
}
const list = (rows) => `<div class="modal-list">${rows.map(([a,b])=>`<div class="modal-row"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
function submit() {
  const input=$('#prompt');const message=input.value.trim();if(!message)return input.focus();
  state.messages.push({role:'user',text:message+(attachment?`\n附件：${attachment}`:'')});
  const response=activeTab==='代码助手'?'可以从「目标、输入输出、约束、验收标准」四个方面拆解这项开发任务。你可以继续补充代码片段和预期行为。':activeTab==='数据分析'?'可以先明确指标口径、时间范围和数据粒度，再检查缺失值、重复值与变化趋势。':activeTab==='AI 绘图'?'可以先描述画面主体、构图、风格和光线，我会把这些信息组织成一段绘图提示词。':'你的想法已记录。可以继续补充目标、背景和期望结果，把需求描述得更具体。';
  state.messages.push({role:'assistant',text:`${response}\n\n当前是本地界面演示，这是一条预设回复。尚未连接真实模型${web?'或联网搜索':''}。${thinking?'深度思考开关目前仅展示选中状态。':''}${attachment?'附件仅显示文件名，尚未上传或解析。':''}`});
  state.messages=state.messages.slice(-50);draft='';attachment='';input.value='';view='chat';save();render();requestAnimationFrame(()=>$('#prompt').focus());
}
document.addEventListener('submit',e=>{if(e.target.id==='chat-form'){e.preventDefault();submit();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('#model-menu');if(m){m.hidden=true;$('[data-action="model-menu"]').setAttribute('aria-expanded','false');}if(sidebarOpen){sidebarOpen=false;render();}}if(e.target.id==='prompt'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit();}});
document.addEventListener('change',e=>{if(e.target.id==='file-input'){const file=e.target.files[0];if(file){if(file.size>20*1024*1024)return toast('请选择 20 MB 以内的文件');attachment=file.name;render();toast('附件已选择，演示模式不上传文件');}}});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');
  if(!e.target.closest('.model-wrap')){const m=$('#model-menu');if(m){m.hidden=true;$('[data-action="model-menu"]').setAttribute('aria-expanded','false');}}
  if(!b||b.disabled)return;const a=b.dataset.action;
  if(a==='close')return closeModal();if(a==='confirm')return modalAction?.();
  if(a==='sidebar'){if(window.innerWidth>820)sidebarCollapsed=!sidebarCollapsed;else sidebarOpen=!sidebarOpen;return render();}
  if(['home','new'].includes(a)){view='dashboard';activeTab=a==='new'?'智能问答':'推荐';sidebarOpen=false;if(a==='new'){$('#prompt').value='';draft='';state.messages=[];save();}render();if(a==='new')$('#prompt').focus();return;}
  if(a==='tab'){if(b.dataset.tab==='更多')return showModal('更多工具',list([['文档处理','即将上线'],['工作流编排','即将上线'],['个人知识库','即将上线']])+'<p>先从代码、问答、数据和创作开始。</p>');activeTab=b.dataset.tab;view='dashboard';return render();}
  if(a==='prompt'){$('#prompt').value=b.dataset.prompt+'：';$('#prompt').focus();return;}
  if(a==='sign'){const reward=signIn(state);save();if($('#modal').open)closeModal();render();return toast(reward?`签到成功，+${reward} Token`:'今天已经签到啦');}
  if(a==='skip'){adHidden=true;return render();}
  if(a==='watch')return showAd();
  if(a==='ad-reward'){const reward=watchAd(state);save();closeModal();render();return toast(reward?`观看完成，+${reward} Token`:'今日观看次数已用完');}
  if(a==='welcome'){if(state.welcome)return;showModal('新人见面礼',`<div class="modal-hero"><small>欢迎来到 Claude 中文版</small><strong>12,000 Token</strong><span>你的第一份灵感补给</span></div><p>演示模式直接领取，不需要充值。同一浏览器仅可领取一次。</p>${btn('confirm','领取演示礼包')}`,()=>{if(!state.welcome){state.welcome=true;state.balance+=12000;save();}closeModal();render();toast('新人礼包已到账，+12,000 Token');});return;}
  if(a==='box'){const reward=openBox(state);if(!reward)return toast('今日次数用完了，每看 3 条广告可以再开一次');save();render();return showModal('这次的惊喜，属于你',`<div class="modal-hero confetti">${icon('gift')}<strong>+${fmt(reward)}</strong><span>Token 已存入演示余额</span></div><p>今天也要把灵感用在喜欢的事情上。</p>${btn('close','收下好运')}<div class="demo-label">免费本地抽取，不扣费。奖励档位与概率见 README。</div>`);}
  if(a==='level'){selectedLevel=b.dataset.level;return render();}
  if(a==='upgrade')return showUpgrade();
  if(a==='model-menu'){const m=$('#model-menu');m.hidden=!m.hidden;b.setAttribute('aria-expanded',String(!m.hidden));return;}
  if(a==='model'){if(b.dataset.model!=='A6 Sonnet'&&state.level==='A6')return showUpgrade();state.model=b.dataset.model;save();render();return toast(`已切换到 ${state.model} · 演示模型`);}
  if(a==='speed'){if(state.level==='A6')return showUpgrade();state.speed=state.speed==='1.0x'?'1.5x':'1.0x';save();render();return toast(`演示加速倍率：${state.speed}`);}
  if(a==='web'||a==='thinking'){if(a==='web')web=!web;else thinking=!thinking;render();return toast(`${a==='web'?'联网搜索':'深度思考'}${(a==='web'?web:thinking)?'已选中':'已取消'} · 仅演示`);}
  if(a==='attach')return $('#file-input').click();if(a==='remove-file'){attachment='';return render();}
  if(a==='invite')return invite();
  if(a==='copy-invite'){const text='来看看 Claude 中文版：一个有趣的非官方 AI 工作台。https://github.com/hutiefang76/claude-cn 邀请码：CLAUDE-CN';try{await navigator.clipboard.writeText(text);toast('邀请文案已复制');}catch{showModal('复制邀请文案',`<textarea class="modal-input" rows="5" readonly aria-label="邀请文案">${escape(text)}</textarea><p>浏览器暂不支持自动复制，可长按或选中文字复制。</p>`);}return;}
  if(a==='mock-invite'){if(!state.invited){state.invited=true;state.balance+=2000;save();}closeModal();render();return toast('助力体验完成，+2,000 演示 Token');}
  if(a==='finance')return showModal('Claude 金融',`<div class="modal-hero"><small>示例收益展示</small><strong>+23.68 USD</strong></div><p>这是参考图中的趣味金融卡片，数据为固定样例，不提供真实投资、存款或收益。</p>${btn('confirm',state.subscription?'取消模拟订阅':'模拟订阅','primary dark')}`,()=>{state.subscription=!state.subscription;save();closeModal();render();toast(state.subscription?'已开启模拟订阅':'已取消模拟订阅');});
  if(a==='loan')return showModal('Token 借呗',`<div class="modal-hero"><small>参考图中的模拟额度</small><strong>80,000 Token</strong></div><p>此入口只展示借贷页面设计，不提供真实借款，不查询征信，也不会产生债务。</p>${btn('close','了解了','primary green')}`);
  if(a==='recharge')return showModal('灵感补给站',`${list([['轻装上阵 · 6 元','12,000 Token'],['持续创作 · 30 元','80,000 Token'],['满格灵感 · 98 元','300,000 Token']])}<p>以上为页面演示套餐。你可以免费添加 1,000 演示 Token 体验余额变化。</p>${btn('confirm','添加 1,000 演示 Token')}`,()=>{state.balance+=1000;save();closeModal();render();toast('演示余额 +1,000 Token');});
  if(a==='rank')return showModal('本周消耗榜',list([['01 · 卷王本王','1,240万'],['02 · 凌晨四点还在写','980万'],['03 · 今天一定不加班','860万'],['04 · Ctrl+C 大师','750万'],['8,412 · 你','23万']])+'<p class="demo-label">排行榜为固定演示数据。</p>');
  if(a==='tasks'||a==='rewards')return showModal(a==='tasks'?'今日任务':'福利中心',list([['每日签到',signed()?'已完成':'待完成'],['看 3 条演示广告',`${Math.min(3,state.ads)}/3`],['模拟好友助力',state.invited?'已完成':'待完成'],['新人礼包',state.welcome?'已领取':'可领取']])+btn('sign',signed()?'今日已签到':'立即签到','primary',signed()?'disabled':''));
  if(a==='redeem')return showModal('兑换中心',`<p>输入体验兑换码 <strong>HELLOCLAUDE</strong>，领取新人礼包。</p><input class="modal-input" id="redeem-code" aria-label="兑换码" placeholder="输入兑换码" autocomplete="off" />${btn('confirm','兑换礼包')}`,()=>{if($('#redeem-code').value.trim().toUpperCase()!=='HELLOCLAUDE')return toast('兑换码不正确，请试试 HELLOCLAUDE');if(state.welcome)return toast('新人礼包已领取，不能重复兑换');state.welcome=true;state.balance+=12000;save();closeModal();render();toast('兑换成功，+12,000 Token');});
  if(a==='plugins')return showModal('你的工具箱',`<p>选择工作台工具。这里保存演示偏好，尚未连接外部服务。</p><div class="modal-list">${[['search','联网搜索'],['code','代码分析'],['files','文档解析']].map(([id,t])=>`<div class="modal-row"><span>${t}</span>${btn('plugin',state.plugins.includes(id)?'已启用':'启用','',`data-plugin="${id}" aria-pressed="${state.plugins.includes(id)}"`)}</div>`).join('')}</div>`);
  if(a==='plugin'){const id=b.dataset.plugin;state.plugins=state.plugins.includes(id)?state.plugins.filter(p=>p!==id):[...state.plugins,id];save();b.textContent=state.plugins.includes(id)?'已启用':'启用';b.setAttribute('aria-pressed',String(state.plugins.includes(id)));return;}
  if(a==='scheduled')return showModal('已安排',list([['每日代码审查','工作日 09:00'],['依赖版本检查','每周一 10:00'],['项目周报','每周五 18:00']])+'<p class="demo-label">示例日程，尚未接入后台调度。</p>');
  if(a==='pulls')return showModal('拉取请求',list([['#128 优化接口响应缓存','待审查'],['#127 升级前端组件','检查通过'],['#126 添加集成测试','进行中']])+'<p class="demo-label">项目样例，不读取真实 GitHub 数据。</p>');
  if(a==='achievements')return showModal('每一点进步，都算数',`<div class="modal-hero">${icon('trophy')}<strong>${fmt(state.balance)}</strong><span>当前演示 Token</span></div>${list([['连续签到',`${state.streak} 天`],['成长值',String(state.growth)],['对话消息',String(state.messages.filter(m=>m.role==='user').length)]])}`);
  if(a==='team')return showModal('智能研发团队',list([['架构师 Agent','方案与技术选型'],['开发 Agent','功能实现与重构'],['测试 Agent','验证与质量保障']])+'<p>团队角色展示，尚未接入真实多 Agent 执行。</p>');
  if(['project','frontend','performance','mobile','testing'].includes(a)){activeTab='代码助手';view='dashboard';sidebarOpen=false;render();$('#prompt').value=({project:'帮我梳理示例项目 A 的开发计划：',frontend:'帮我设计前端功能迭代方案：',performance:'帮我分析接口性能优化方案：',mobile:'帮我设计移动端应用：',testing:'帮我搭建测试自动化框架：'})[a];$('#prompt').focus();return;}
  if(a==='menu'){const m=b.dataset.menu;if(m==='文件')return showModal('文件',`<p>可以添加本地文件展示附件状态，演示模式不上传文件。</p>${btn('attach','选择本地文件')}`);if(m==='编辑')return showModal('编辑',`<p>清空当前草稿，开始一个新的想法。</p>${btn('confirm','清空草稿')}`,()=>{draft='';$('#prompt').value='';attachment='';closeModal();render();});if(m==='视图'){if(window.innerWidth>820)sidebarCollapsed=!sidebarCollapsed;else sidebarOpen=!sidebarOpen;return render();}return showModal('关于 Claude 中文版',`<div class="modal-hero"><span class="brand-mark">✳</span><strong>claude-cn</strong><small>版本 1.0.0</small></div><p>基于参考图制作的非官方中文工作台交互演示，与 Anthropic 无关联。模型名称、会员、金融及奖励均为界面创意，不代表官方产品或服务。</p><p>Enter 发送 · Shift + Enter 换行 · Esc 关闭弹窗</p>${btn('reset','重置演示数据','primary dark')}`);}
  if(a==='reset')return showModal('重置演示数据',`<p>将清空当前浏览器中的对话、余额变化、会员和签到记录，恢复初始状态。</p>${btn('confirm','确认重置','primary dark')}`,()=>{state=initialState();draft='';attachment='';$('#prompt').value='';adHidden=false;skipDeadline=Date.now()+3000;view='dashboard';activeTab='推荐';save();closeModal();render();toast('已恢复初始演示状态');});
});
render();
