// Task execution and commercial state share one persisted account.
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const STEPS = [
  {name:'理解需求与拆解计划',cost:3200,log:'需求已拆解；确定页面结构、交互和验收项。'},
  {name:'生成页面与组件',cost:6800,log:'写入 index.html；建立语义结构与表单。'},
  {name:'编写样式与交互',cost:9000,log:'写入 styles.css、app.js；增加移动端断点和事件处理。'},
  {name:'检查文件完整性',cost:4480,log:'检查入口、样式引用、脚本引用与 viewport 配置。'},
  {name:'整理执行报告',cost:21,log:'执行报告已写入 REPORT.md。'},
  {name:'打包预览资源',cost:800,log:'资源已内联，预览和交付文件准备完成。'},
];
export const PRODUCTS={
  tokens:{name:'灵感补给包',price:600,tokens:12000},
  large:{name:'高效创作包',price:3000,tokens:80000},
  member:{name:'A7 月度会员',price:2900,tokens:10000},
  export:{name:'源代码导出通行证',price:600,tokens:0},
  speed:{name:'1.5x 执行加速包',price:900,tokens:0},
};
export function initEngine(s){
  s.tasks=Array.isArray(s.tasks)?s.tasks:[];s.ledger=Array.isArray(s.ledger)?s.ledger:[];s.orders=Array.isArray(s.orders)?s.orders:[];
  s.entitlements=s.entitlements||{export:false,speed:false};s.account=s.account||{cash:50000,autoRenew:false,renewAt:null};
  s.tickets=Array.isArray(s.tickets)?s.tickets:[];s.activeTaskId=s.activeTaskId||null;
  if(!s.ledger.length)s.ledger.push({id:uid(),time:Date.now(),label:'账户期初余额',amount:s.balance,balance:s.balance,taskId:null});
  return s;
}
export function reconcile(s){
  initEngine(s);const last=s.ledger.at(-1);if(last.balance!==s.balance)s.ledger.push({id:uid(),time:Date.now(),label:'福利奖励入账',amount:s.balance-last.balance,balance:s.balance,taskId:null});
}
export function transact(s,amount,label,taskId=null,id=uid()){
  if(s.ledger.some(x=>x.id===id))return true;
  if(!Number.isFinite(amount)||s.balance+amount<0)return false;
  s.balance+=amount;s.ledger.push({id,time:Date.now(),label,amount,balance:s.balance,taskId});return true;
}
export const activeTask=s=>s.tasks.find(t=>t.id===s.activeTaskId);
export function createTask(s,prompt){
  const kind=/登录|登陆|login/i.test(prompt)?'login':/待办|todo|任务清单/i.test(prompt)?'todo':/数据|报表|dashboard|看板/i.test(prompt)?'dashboard':'landing';
  const t={id:uid(),prompt:prompt.slice(0,6000),title:prompt.slice(0,32),kind,createdAt:Date.now(),status:'ready',step:0,spent:0,files:{},original:{},logs:[],checks:[],revision:1,selectedFile:'index.html',tab:'preview',messages:[{role:'user',text:prompt},{role:'assistant',text:`我会制作${({login:'登录页面',todo:'待办清单',dashboard:'数据看板',landing:'产品展示页'})[kind]}，生成 HTML、CSS 和 JavaScript。完成后可以修改源码、检查页面并导出。计划共 6 步，预计使用 ${STEPS.reduce((n,x)=>n+x.cost,0).toLocaleString()} Token。`}]};
  s.tasks.unshift(t);s.activeTaskId=t.id;return t;
}
export function log(t,text,type='info'){t.logs.push({time:Date.now(),text,type});}
export function filesFor(prompt,kind){
  const color=/紫/.test(prompt)?'#7c5ce7':/绿/.test(prompt)?'#2e8b69':/橙/.test(prompt)?'#cf7654':'#4e6be8';
  const title=(prompt.match(/[“「"]([^”」"]+)[”」"]/u)||[])[1]||({login:'欢迎回来',todo:'今天，专注重要的事',dashboard:'业务概览',landing:'让好想法，成为下一步'})[kind];
  let body,js;
  if(kind==='login'){
    body=`<main class="shell"><aside><span class="eyebrow">WORKSPACE / 01</span><h1>把时间留给<br>真正重要的事。</h1><p>连接你的团队、项目和下一个好想法。</p><span class="note">一个工作空间，无限可能。</span></aside><section><span class="logo">✳</span><h2>${esc(title)}</h2><p>登录你的工作空间，继续今天的进展。</p><form id="form"><label>邮箱<input name="email" type="email" placeholder="you@example.com" required></label><label>密码<input name="password" type="password" minlength="6" placeholder="至少 6 位字符" required></label><label class="inline"><input type="checkbox">记住我</label><button>登录工作空间 →</button><p id="result" role="status"></p></form></section></main>`;
    js=`document.querySelector('#form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#result').textContent='表单校验通过，欢迎回来。';});`;
  }else if(kind==='todo'){
    body=`<main class="page"><span class="eyebrow">FOCUS / TODAY</span><h1>${esc(title)}</h1><p>把计划变成进展，一次完成一件事。</p><form id="form" class="add"><input id="item" placeholder="添加一件重要的事" required maxlength="100"><button>添加任务</button></form><div id="items"></div><p id="count"></p></main>`;
    js=`const tasks=[{text:'梳理本周目标',done:true},{text:'完成第一个版本',done:false}];function draw(){const root=document.querySelector('#items');root.replaceChildren();tasks.forEach((t,i)=>{const row=document.createElement('label');row.className='todo';const c=document.createElement('input');c.type='checkbox';c.checked=t.done;c.onchange=()=>{t.done=c.checked;draw()};const span=document.createElement('span');span.textContent=t.text;span.style.textDecoration=t.done?'line-through':'none';const b=document.createElement('button');b.type='button';b.textContent='删除';b.onclick=()=>{tasks.splice(i,1);draw()};row.append(c,span,b);root.append(row)});document.querySelector('#count').textContent=tasks.filter(t=>t.done).length+' / '+tasks.length+' 已完成'}document.querySelector('#form').onsubmit=e=>{e.preventDefault();const i=document.querySelector('#item');if(i.value.trim())tasks.push({text:i.value.trim(),done:false});i.value='';draw()};draw();`;
  }else if(kind==='dashboard'){
    body=`<main class="page"><span class="eyebrow">ANALYTICS / OVERVIEW</span><h1>${esc(title)}</h1><p>查看业务表现与变化趋势。</p><select id="range" aria-label="时间范围"><option value="1">本周</option><option value="4">本月</option></select><div class="stats"><article><small>访问量</small><h2 id="visits"></h2><span>↑ 12.8%</span></article><article><small>转化次数</small><h2 id="sales"></h2><span>↑ 8.2%</span></article><article><small>转化率</small><h2>4.2%</h2><span>↑ 0.3%</span></article></div><section class="chart"><h3>访问趋势</h3><div class="bars">${[35,58,46,72,62,83,95].map((n,i)=>`<div><b style="height:${n}%"></b><small>周${'一二三四五六日'[i]}</small></div>`).join('')}</div></section></main>`;
    js=`function update(){const k=+document.querySelector('#range').value;document.querySelector('#visits').textContent=(12480*k).toLocaleString();document.querySelector('#sales').textContent=(524*k).toLocaleString()}document.querySelector('#range').onchange=update;update();`;
  }else{
    body=`<main class="page"><nav><b>✳ STUDIO</b><a href="#features">功能</a><a href="#start">开始使用</a></nav><div class="hero"><span class="eyebrow">DESIGNED FOR YOUR NEXT IDEA</span><h1>${esc(title)}</h1><p>把分散的灵感，连接成清晰的计划。<br>从一个小目标开始，让每一步都有进展。</p><a class="button" href="#start">开始你的旅程 →</a></div><div class="stats" id="features">${['保持专注','清晰协作','看见进展'].map((x,i)=>`<article><small>0${i+1}</small><h2>${x}</h2><p>给重要的工作，留出更多空间。</p></article>`).join('')}</div><section id="start"><h2>准备好开始了吗？</h2><form id="form" class="add"><input type="email" placeholder="留下你的邮箱" required><button>加入候补名单</button></form><p id="result" role="status"></p></section></main>`;
    js=`document.querySelector('#form').onsubmit=e=>{e.preventDefault();document.querySelector('#result').textContent='谢谢，你的输入已确认。'};`;
  }
  const dark=/深色|黑色|暗色/.test(prompt);
  const css=`:root{--accent:${color};--bg:${dark?'#171b25':'#f4f6fb'};--fg:${dark?'#eef0fa':'#202a41'};--card:${dark?'#232a38':'#fff'}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:system-ui,sans-serif}h1{font-size:clamp(28px,4vw,48px);letter-spacing:-1px;line-height:1.2}h2{font-size:25px}p{color:#8791a6;line-height:1.8}button,.button{border:0;border-radius:8px;background:var(--accent);color:white;padding:13px 20px;cursor:pointer;text-decoration:none;font:inherit}a{color:var(--accent)}input,select{font:inherit;border:1px solid #b6bdcc66;padding:13px;border-radius:7px;background:var(--card);color:var(--fg)}input:focus{outline:2px solid var(--accent)}label{display:grid;gap:8px;font-size:13px;margin:18px 0}label input{width:100%}.inline{display:flex;align-items:center}.inline input{width:auto}.shell{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}.shell aside{background:var(--accent);color:white;padding:65px 40px;display:flex;flex-direction:column;justify-content:center}.shell aside p{color:#ffffffbb}.note{font-size:12px;margin-top:40px;opacity:.7}.shell section{padding:55px 40px;align-self:center;max-width:460px;width:100%;margin:auto}.logo{font-size:35px;color:var(--accent)}form>button{width:100%}.eyebrow{font-size:10px;letter-spacing:2px}.page{max-width:1000px;padding:35px;margin:auto}.add{display:flex;gap:10px;margin:25px 0}.add input{flex:1;min-width:0}.add button{width:auto;white-space:nowrap}.todo{display:flex;align-items:center;background:var(--card);padding:15px;border-radius:8px}.todo input{width:auto}.todo span{flex:1}.todo button{background:transparent;color:#8791a6;padding:3px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:25px 0}.stats article,.chart{background:var(--card);padding:23px;border-radius:14px}.stats small{color:#8791a6}.stats span{color:#3ba77c}.bars{height:210px;display:flex;align-items:end;gap:8%;padding-top:25px}.bars>div{height:100%;flex:1;display:flex;align-items:center;justify-content:end;flex-direction:column;gap:10px}.bars b{display:block;width:100%;background:var(--accent);border-radius:6px 6px 0 0}.bars small{white-space:nowrap;color:#8791a6}nav{display:flex;gap:28px;align-items:center;font-size:13px}nav b{margin-right:auto}.hero{text-align:center;padding:75px 10px}#start{text-align:center;padding:40px 0}#result{font-size:13px;color:var(--accent)}@media(max-width:550px){.shell{grid-template-columns:1fr}.shell aside{padding:25px}.shell aside h1{font-size:25px}.note{display:none}.shell section{padding:25px}.page{padding:20px}.stats{grid-template-columns:1fr}.hero{padding:45px 0}.add{flex-wrap:wrap}}`;
  return {'index.html':`<!doctype html>\n<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="styles.css"></head><body>${body}<script src="app.js"></script></body></html>`, 'styles.css':css,'app.js':js};
}
export function previewHTML(t){return (t.files['index.html']||'').replace('<link rel="stylesheet" href="styles.css">',`<style>${(t.files['styles.css']||'').replace(/<\/style/gi,'<\\/style')}</style>`).replace('<script src="app.js"></script>',`<script>${(t.files['app.js']||'').replace(/<\/script/gi,'<\\/script')}</script>`);}
export function advance(s,t){
  if(!t||t.status!=='running')return false;
  const step=STEPS[t.step];if(!step){t.status='completed';return false;}
  if(!transact(s,-step.cost,step.name,t.id,`${t.id}:${t.revision}:${t.step}`)){t.status='paused_balance';log(t,`余额不足：本步需要 ${step.cost} Token，当前 ${s.balance} Token。执行进度已保存。`,'warn');return false;}
  t.spent+=step.cost;
  const output=filesFor(t.prompt,t.kind);
  if(t.step===1)t.files['index.html']=output['index.html'];
  if(t.step===2){t.files['styles.css']=output['styles.css'];t.files['app.js']=output['app.js'];if(!Object.keys(t.original).length)t.original={...t.files};}
  if(t.step===3){t.checks=[['HTML 入口',!!t.files['index.html']],['样式文件',!!t.files['styles.css']],['交互脚本',!!t.files['app.js']],['移动端 viewport',/name="viewport"/.test(t.files['index.html']||'')]].map(([name,ok])=>({name,ok}));}
  if(t.step===4)t.files['REPORT.md']=`# 执行报告\n\n任务：${t.prompt}\n\n${t.checks.map(x=>`- ${x.ok?'通过':'失败'}：${x.name}`).join('\n')}\n\n文件生成与静态结构检查已完成。`;
  log(t,`${step.log}  −${step.cost.toLocaleString()} Token`,'success');t.step++;
  if(t.step===STEPS.length){t.status='completed';t.messages.push({role:'assistant',text:'页面已完成。右侧可以预览，切换「源码」直接修改文件。修改后预览会立即更新，导出保留当前内容。'});log(t,'任务完成。源代码导出需要独立通行证。','warn');}
  return true;
}
export function start(s,t){if(!t||t.status==='completed')return false;if(t.status==='paused_balance'&&s.balance<STEPS[t.step].cost)return false;t.status='running';log(t,t.step?'从检查点继续执行。':'工作区已就绪，开始执行。');return true;}
export function placeOrder(s,product){
  const p=PRODUCTS[product];if(!p)throw Error('无效商品');
  const order={id:uid(),number:'CN'+Date.now().toString().slice(-10),product,name:p.name,price:p.price,tokens:p.tokens,status:'pending',createdAt:Date.now()};s.orders.unshift(order);return order;
}
export function payOrder(s,id){
  const o=s.orders.find(x=>x.id===id);if(!o||o.status!=='pending')return false;
  if(s.account.cash<o.price)return false;
  s.account.cash-=o.price;o.status='paid';o.paidAt=Date.now();
  if(o.tokens)transact(s,o.tokens,o.name,null,`order:${o.id}`);
  if(o.product==='member'){s.level='A7';s.account.autoRenew=true;s.account.renewAt=Date.now()+30*86400000;}
  if(o.product==='export')s.entitlements.export=true;
  if(o.product==='speed'){s.entitlements.speed=true;s.speed='1.5x';}
  return true;
}
export function supportReply(s,question){
 const t=activeTask(s); const q=question.toLowerCase();
 if(/取消|续费|退订/.test(q))return `你的 A7 自动续费目前${s.account.autoRenew?'已开启。进入「会员与订阅」选择取消续费，可以保留本期权益。':'已关闭。当前不会产生下一期续费订单。'}`;
 if(/导出|下载|文件/.test(q))return `当前任务${t?.status==='completed'?'已完成':'尚在处理中'}。${s.entitlements.export?'导出通行证已生效，可以下载当前文件。':'A7 会员包含模型权益，源代码导出属于独立权益。你可以开通 ¥6 导出通行证。'}`;
 if(/扣|余额|钱|收费|token/i.test(q))return `当前余额 ${s.balance.toLocaleString()} Token。${t?`「${t.title}」累计使用 ${t.spent.toLocaleString()} Token，已完成 ${t.step}/6 步。`:''}每一笔扣除都可以在账单中查看。${t?.status==='paused_balance'?`恢复下一步还差 ${Math.max(0,STEPS[t.step].cost-s.balance)} Token，可看广告领取 20 Token。`:''}`;
 return `已收到你的问题：${question.slice(0,120)}。${t?`当前任务状态为 ${t.status==='completed'?'已完成':t.status==='paused_balance'?'余额不足暂停':'处理中'}。`:''}你可以选择查看账单、继续任务或管理订阅；需要进一步处理可提交工单。`;
}
