import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,loadState,watchAd,STORAGE_KEY} from '../src/state.js';
import {initEngine,createTask,advance,start,activeTask,placeOrder,payOrder,previewHTML,reconcile,supportReply,filesFor} from '../src/engine.js';
import {zipFiles} from '../src/archive.js';
import {workbench,ledgerPage,subscriptionsPage} from '../src/workbench.js';
test('任务在真实余额不足处暂停，广告入账后从检查点继续，不重复扣费',()=>{
 const s=initEngine(initialState());const t=createTask(s,'做一个紫色登录页');start(s,t);
 while(t.status==='running')advance(s,t);
 assert.equal(t.status,'paused_balance');assert.equal(t.step,3);assert.equal(s.balance,4456);assert.equal(t.spent,19000);assert.match(t.files['styles.css'],/#7c5ce7/);
 watchAd(s);reconcile(s);assert.equal(start(s,t),false);
 watchAd(s);reconcile(s);assert.equal(start(s,t),true);advance(s,t);assert.equal(t.step,4);assert.equal(s.balance,16);
 advance(s,t);assert.equal(t.status,'paused_balance');assert.equal(t.step,4);
 const o=placeOrder(s,'tokens');assert.equal(payOrder(s,o.id),true);start(s,t);while(t.status==='running')advance(s,t);
 assert.equal(t.status,'completed');assert.equal(t.step,6);assert.ok(t.files['REPORT.md']);assert.equal(t.spent,24301);
 assert.equal(s.ledger.filter(r=>r.taskId===t.id).length,6);
 assert.equal(s.ledger.reduce((n,r)=>n+r.amount,0),s.balance);
 assert.match(previewHTML(t),/<style>/);assert.match(previewHTML(t),/表单校验通过/);
});
test('订单只扣款一次；会员不隐含导出权限，导出订单单独授权',()=>{
 const s=initEngine(initialState());const o=placeOrder(s,'member');assert.ok(payOrder(s,o.id));assert.equal(s.account.cash,47100);assert.equal(s.account.autoRenew,true);assert.equal(s.level,'A7');assert.equal(s.entitlements.export,false);
 assert.equal(payOrder(s,o.id),false);assert.equal(s.account.cash,47100);
 const x=placeOrder(s,'export');assert.ok(payOrder(s,x.id));assert.equal(s.entitlements.export,true);assert.equal(s.account.cash,46500);
});
test('刷新保留文件、待支付订单和检查点；旧账户可无损升级',()=>{
 const s=initEngine(initialState());const t=createTask(s,'待办清单');start(s,t);advance(s,t);advance(s,t);t.files['index.html']+='<!-- edited -->';placeOrder(s,'speed');
 const r=initEngine(loadState({getItem:()=>JSON.stringify(s)}));assert.equal(activeTask(r).step,2);assert.match(activeTask(r).files['index.html'],/edited/);assert.equal(r.orders[0].status,'pending');assert.equal(r.balance,s.balance);
 const old=initEngine(loadState({getItem:()=>JSON.stringify(initialState())}));assert.equal(old.balance,23456);assert.deepEqual(old.tasks,[]);
});
test('余额不足的订单不改变钱包或发放权益',()=>{const s=initEngine(initialState());s.account.cash=0;const o=placeOrder(s,'tokens');assert.equal(payOrder(s,o.id),false);assert.equal(o.status,'pending');assert.equal(s.balance,23456);});
test('生成的标题做 HTML 转义，预览仅内联当前文件；页面读取同一账户',()=>{
 const s=initEngine(initialState());const t=createTask(s,'登录页标题“<img src=x onerror=alert(1)>”');t.files=filesFor(t.prompt,t.kind);t.step=3;
 assert.match(t.files['index.html'],/&lt;img/);assert.ok(!t.files['index.html'].includes('<img src=x'));
 t.files['styles.css']='body{color:red}';assert.match(previewHTML(t),/body\{color:red\}/);
 assert.match(workbench(s),/sandbox="allow-scripts"/);assert.match(ledgerPage(s),/23,456/);assert.match(subscriptionsPage(s),/源代码导出/);
 assert.match(supportReply(s,'为什么导出还要收费'),/独立权益/);
});
test('ZIP 产生标准文件头与中央目录',()=>{const bytes=zipFiles({'index.html':'你好','app.js':'console.log(1)'});const v=new DataView(bytes.buffer);assert.equal(v.getUint32(0,true),0x04034b50);assert.equal(v.getUint32(bytes.length-22,true),0x06054b50);assert.equal(v.getUint16(bytes.length-14,true),2);});
