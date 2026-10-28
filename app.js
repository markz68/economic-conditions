'use strict';
const $=s=>document.querySelector(s); let data,terms,group='Jobs and pay';
const today=()=>new Date().toISOString().slice(0,10);
const before=(d,n=1)=>new Date(Date.parse(d+'T00:00:00Z')-n*86400000).toISOString().slice(0,10);
function periodEnd(d,f){let [y,m]=d.split('-').map(Number);if(f==='Q')return new Date(Date.UTC(y,m+2,0)).toISOString().slice(0,10);if(f==='M')return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);if(f==='A')return `${y}-09-30`;return d;}
function baselineDate(t,m){const y=Number(t.start.slice(0,4));return m.frequency==='A'?`${y-1}-09-30`:m.frequency==='W'?before(t.start):`${y-1}-12-31`;}
function point(m,cut){const a=data.series[m.id]?.points||[];return a.filter(p=>periodEnd(p[0],m.frequency)<=cut).at(-1);}
function transformed(m,p){if(!p)return null;let v=p[1];if(m.transform==='negate')return -v;if(m.transform==='yoy'){const prior=(data.series[m.id]?.points||[]).find(x=>x[0]===`${Number(p[0].slice(0,4))-1}${p[0].slice(4)}`);return prior?100*(v/prior[1]-1):null;}return v;}
function endpoint(t,focus,mode,now=today()){let end=before(t.end);if(mode==='same'){let elapsed=Math.max(0,Date.parse(now)-Date.parse(focus.start));elapsed=Math.min(elapsed,Date.parse(focus.end)-Date.parse(focus.start)-86400000);end=new Date(Date.parse(t.start)+elapsed).toISOString().slice(0,10);}return [end,before(t.end),now].sort()[0];}
function measure(m,t,cut){const b=point(m,baselineDate(t,m)),p=point(m,cut);if(!b||!p||p[0]<b[0])return {value:null};let base=transformed(m,b),value=transformed(m,p);if(m.transform==='cumulative'){base=0;value=100*(p[1]/b[1]-1);}return {value,base,date:p[0],baseline:b[0],delta:value==null||base==null?null:m.format==='percent'?value-base:100*(value/base-1)};}
function fmt(v,m){if(v==null||!Number.isFinite(v))return 'Unavailable';if(m.format==='debt')return '$'+(v/1000000).toFixed(2)+' trillion';if(m.format==='jobs')return (v*1000).toLocaleString('en-US',{maximumFractionDigits:0});if(m.format==='currency')return v.toLocaleString('en-US',{style:'currency',currency:'USD'});if(m.format==='dollars')return v.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});return v.toFixed(1)+'%';}
function changeText(change,m){if(!Number.isFinite(change))return 'No comparison available';const rounded=Number(change.toFixed(1));return `${rounded>0?'+':''}${rounded.toFixed(1)} ${m.format==='percent'?'pp':'%'}`;}
const delta=(r,m)=>r.delta==null?'No comparison available':`${changeText(r.delta,m)} vs inherited level`;
const favorable={UNRATE:-1,PAYEMS:1,LNS12300060:1,LES1252881600Q:1,CUSR0000SAF11:-1,CUSR0000SAH1:-1,MORTGAGE30US:-1,GASREGW:-1,A229RX0:1,GFDEGDQ188S:-1,FYFSGDA188S:-1,APU0000708111:-1,TDSP:-1};
function judgment(m,change,recent=false){
 if(!Number.isFinite(change))return {kind:'neutral',text:'Comparison unavailable'};
 if(m.format==='debt')return {kind:'neutral',text:'Context needed'};
 if(m.transform==='cumulative')return {kind:'neutral',text:recent?'Price movement':'Price level change'};
 if(!favorable[m.id])return {kind:'neutral',text:'Context needed'};
 if(Math.abs(change)<(m.format==='percent'?0.1:0.5))return {kind:'neutral',text:'→ Little changed'};
 const good=change*favorable[m.id]>0;
 return {kind:good?'better':'worse',text:`${change>0?'↑':'↓'} ${recent?(good?'Improving':'Deteriorating'):(good?'Better':'Worse')}`};
}
function badge(m,change,recent=false){const j=judgment(m,change,recent);return `<span class="badge ${j.kind}">${j.text}</span>`;}
function recentChange(m,t,cut){
 const p=point(m,cut);if(!p||p[0]<=point(m,baselineDate(t,m))?.[0])return null;
 const end=periodEnd(p[0],m.frequency);let d=new Date(end+'T00:00:00Z');
 if(m.frequency==='W')d.setUTCDate(d.getUTCDate()-91);
 else {const months=m.frequency==='A'?12:3;d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-months+1,0));}
 const prior=point(m,d.toISOString().slice(0,10));
 if(!prior||prior[0]===p[0])return null;
 const value=transformed(m,p),base=transformed(m,prior);
 if(!Number.isFinite(value)||!Number.isFinite(base))return null;
 const change=m.transform==='cumulative'?100*(p[1]/prior[1]-1):m.format==='percent'?value-base:base===0?null:100*(value/base-1);
 return {change,start:prior[0],end:p[0],window:m.frequency==='A'?'previous fiscal year':m.frequency==='Q'?'previous quarter':m.frequency==='W'?'13 weeks':'3 months'};
}
function inherited(m,r){
 if(m.format==='debt')return r.value==null||r.base==null?'Comparison unavailable':`<span class="badge neutral">Debt ${r.value>=r.base?'increased':'decreased'}</span><span class="comparison-label">vs inherited level</span><div class="delta">${fmt(Math.abs(r.value-r.base),m)} ${r.value>=r.base?'higher':'lower'} · ${changeText(r.delta,m)}</div>`;
 if(m.transform==='cumulative')return r.value==null?'Comparison unavailable':`Prices are ${Math.abs(r.value).toFixed(1)}% ${r.value<0?'lower':'higher'} since inauguration`;
 return `${badge(m,r.delta)}<span class="comparison-label">vs inherited level</span><div class="delta">${delta(r,m)}</div>`;
}
function direction(m,t,cut){
 const r=recentChange(m,t,cut);if(!r||!Number.isFinite(r.change))return '<p class="recent">Recent direction: unavailable</p>';
 const label=m.transform==='cumulative'?`Prices ${r.change>0?'rising':r.change<0?'falling':'unchanged'}`:badge(m,r.change,true);
 return `<div class="recent">Recent direction: ${label}<small>${changeText(r.change,m.transform==='cumulative'?{format:'level'}:m)} over ${r.window}<br>${r.start} → ${r.end}</small></div>`;
}
function guidance(m){
 if(m.format==='debt')return 'Gross federal debt, including debt held by the public and federal government accounts. Quarterly, end-of-period data, not a live debt counter. Read alongside debt/GDP and interest costs.';
 if(m.transform==='cumulative')return 'Cumulative prices since the inherited baseline; lower inflation does not mean lower prices.';
 if(m.id==='CPIAUCSL')return 'Lower inflation is not always healthier; deflation also needs context.';
 if(m.id==='A191RL1Q225SBEA')return 'Faster growth needs context, including sustainability and volatility.';
 if(['GFDEGDQ188S','FYFSGDA188S'].includes(m.id))return 'Lower is generally favorable for fiscal sustainability; recessions, policy and fiscal-year timing matter.';
 return favorable[m.id]>0?'Higher is generally favorable for this measure.':'Lower is generally favorable for household costs or financial strain.';
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function spark(m,t,cut){const base=point(m,baselineDate(t,m));const points=(data.series[m.id]?.points||[]).filter(p=>periodEnd(p[0],m.frequency)<=cut&&p[0]>=`${Number(cut.slice(0,4))-5}${cut.slice(4)}`).map(p=>m.transform==='cumulative'?(base?100*(p[1]/base[1]-1):null):transformed(m,p)).filter(v=>v!=null);if(points.length<2)return '';const lo=Math.min(...points),hi=Math.max(...points);return `<svg viewBox="0 0 260 65" role="img" aria-label="Trend over up to five years ending at the comparison date"><polyline fill="none" stroke="#127a88" stroke-width="2.5" points="${points.map((v,i)=>`${i/(points.length-1)*260},${59-(v-lo)/(hi-lo||1)*52}`).join(' ')}"/></svg>`;}
function render(){const now=today(),focus=terms.find(t=>t.start===$('#focus').value)||terms.at(-1),mode=$('#mode').value;let visible=terms.filter(t=>t.start<=now);if($('#history').value==='recent')visible=visible.slice(-5);const cut=endpoint(focus,focus,mode);$('#context').textContent=`${focus.name} · comparison cutoff ${cut}. Baselines and observation periods differ by frequency; see rules below.`;
const metrics=data.metrics.filter(m=>m.group===group);$('#tabs').innerHTML=[...new Set([...data.metrics.map(m=>m.group),'Markets'])].map(g=>`<button aria-pressed="${g===group}" data-group="${esc(g)}">${esc(g)}</button>`).join('');$('#tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{group=b.dataset.group;render();});
$('#cards').innerHTML=metrics.map(m=>{const r=measure(m,focus,cut),s=data.series[m.id],age=s?.fetched?(Date.now()-Date.parse(s.fetched))/86400000:Infinity;return `<article class="card"><h3>${esc(m.label)}</h3><div class="value">${fmt(r.value,m)}</div><div class="inherited">${inherited(m,r)}</div>${direction(m,focus,cut)}<p class="guidance">${guidance(m)}</p>${spark(m,focus,cut)}<p class="meta">Observation: ${r.date||'Unavailable'} · ${m.frequency==='Q'?'quarter starting':m.frequency==='A'?'fiscal year':'period date'}<br>Inherited baseline: ${fmt(r.base,m)} · ${r.baseline||'Unavailable'}<br>${s?.error?'Update failed · retained data':age>3?'Snapshot older than 3 days':'Downloaded '+(s?.fetched?.slice(0,10)||'never')}</p><a href="https://fred.stlouisfed.org/series/${m.id}" target="_blank" rel="noopener">Source &amp; methodology ↗</a></article>`;}).join('');
if(group==='Markets')$('#cards').innerHTML=`<article class="card"><h3>S&amp;P 500 · primary market reference</h3><p>A broad measure of large U.S. companies. Open the source for the latest close and historical chart.</p><p class="guidance">Price index, excluding dividends. Stock performance is one part of the economic picture and does not directly measure household financial health.</p><a href="https://fred.stlouisfed.org/series/SP500" target="_blank" rel="noopener">Open S&amp;P 500 data ↗</a></article><article class="card"><h3>Market details · Dow Jones Industrial Average</h3><p>A price-weighted benchmark of 30 large U.S. companies.</p><a href="https://fred.stlouisfed.org/series/DJIA" target="_blank" rel="noopener">Open Dow Jones data ↗</a></article><article class="card"><h3>Market data availability</h3><p>Market figures and term returns are not copied into this app. The source requires permission for republication; these links open the authorized source.</p><p>FRED provides a rolling ten years of daily index history. Older term comparisons are not available there. Market links require internet access.</p></article>`;
$('.comparison').hidden=group==='Markets';
$('#comparison').innerHTML=`<thead><tr><th scope="col">Indicator</th>${visible.map(t=>`<th scope="col">${esc(t.name)}<small>${t.start} – ${t.end}<br>Cutoff ${endpoint(t,focus,mode)}</small></th>`).join('')}</tr></thead><tbody>${metrics.map(m=>`<tr><th scope="row">${esc(m.label)}</th>${visible.map(t=>{const r=measure(m,t,endpoint(t,focus,mode));return `<td>${fmt(r.value,m)}<div class="table-verdict">${inherited(m,r)}</div><small><br>Observation ${r.date||'unavailable'}<br>Baseline ${r.baseline||'unavailable'}</small></td>`;}).join('')}</tr>`).join('')}</tbody>`;
const failed=Object.values(data.series).filter(s=>s.error).length;$('#status').textContent=`${navigator.onLine?'Published snapshot':'Offline · cached snapshot'} · refresh attempted ${data.attempted?.slice(0,16).replace('T',' ')} UTC${failed?` · ${failed} series failed to update`:''}${now>=terms.at(-1).end?' · Term configuration needs updating':''}`;document.body.classList.toggle('offline',!navigator.onLine);
try{localStorage.setItem('economic-conditions.preferences.v1',JSON.stringify({history:$('#history').value,mode,focus:focus.start}));}catch{}}
async function load(check=false){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let responses,payload;try{responses=await Promise.all(['data.json','terms.json'].map(p=>fetch(check?p+'?check='+Date.now():p,{cache:check?'no-store':'no-cache',signal:controller.signal})));if(responses.some(r=>!r.ok))throw Error('Snapshot unavailable');payload=await Promise.all(responses.map(r=>r.json()));}finally{clearTimeout(timer);}if(responses.some(r=>!r.ok))throw Error('Snapshot unavailable');[data,terms]=payload;$('#focus').innerHTML=terms.filter(t=>t.start<=today()).map(t=>`<option value="${t.start}">${esc(t.name)}</option>`).join('');let prefs={};try{prefs=JSON.parse(localStorage.getItem('economic-conditions.preferences.v1')||'{}');}catch{}$('#history').value=['recent','all'].includes(prefs.history)?prefs.history:'recent';$('#mode').value=prefs.mode==='same'?'same':'end';$('#focus').value=terms.some(t=>t.start===prefs.focus&&t.start<=today())?prefs.focus:terms.filter(t=>t.start<=today()).at(-1).start;render();}
async function checkUpdates(){
 const b=$('#refresh');if(b.disabled)return;
 const previous=JSON.stringify(data);
 b.disabled=true;b.textContent='Checking…';b.setAttribute('aria-busy','true');
 $('#update-result').textContent='Checking the latest published data…';
 try{
  if(!navigator.onLine)throw Error('Offline');
  await load(true);
  const changed=previous!==JSON.stringify(data);
  $('#update-result').textContent=(changed?'Updated to the latest published data.':'Already up to date. No newer published data is available.')+' Checked '+new Date().toLocaleTimeString()+'. Source data refreshes daily; this button checks the published snapshot.';
 }catch{
  $('#update-result').textContent=navigator.onLine?'Could not check for updates. Your existing data is still displayed. Try again when your connection is available.':'You’re offline. Your cached data is still displayed; connect to check for updates.';
 }finally{b.disabled=false;b.textContent='Check for updates';b.removeAttribute('aria-busy');}
}
if(typeof document!=='undefined'){
$('#settings').onclick=()=>$('#dialog').showModal();['history','mode','focus'].forEach(id=>$('#'+id).onchange=render);$('#refresh').onclick=checkUpdates;
$('#export').onclick=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='economic-conditions-snapshot.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
window.addEventListener('online',()=>data&&render());window.addEventListener('offline',()=>data&&render());load().catch(()=>{$('#status').textContent='Unable to load observations. Connect and retry; first use requires internet.';});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{$('#status').textContent+=' · Offline caching unavailable';});
}
