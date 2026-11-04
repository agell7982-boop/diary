/* js/calendar.js - [달력] 탭, 월간 목표 및 반복 일정 */
/* month.js: 한 달 달력 */
let cm={y:new Date().getFullYear(),m:new Date().getMonth()};
const MOODS=['😀','🙂','😐','😟','😢'];
function setSel(k){sel=k;const s=dkey(k),t=new Date();s.setDate(s.getDate()-s.getDay());t.setHours(12,0,0,0);t.setDate(t.getDate()-t.getDay());wk=Math.round((s-t)/(7*DAY))}
function monthHTML(){const y=cm.y,m=cm.m,n=new Date(y,m+1,0).getDate(),f=new Date(y,m,1).getDay(),td=ymd(new Date());
const gd={};Object.values(S.goalsM).flat().forEach(g=>{if(g.done&&g.doneOn)gd[g.doneOn]=1});
let h=`<div class="mg" style="margin-top:12px">${[...WD].map((w,i)=>`<span class="mu${i===0?' hl':i===6?' bl':''}">${w}</span>`).join('')}</div><div class="mg">`+'<i></i>'.repeat(f);
for(let d=1;d<=n;d++){const k=ymd(new Date(y,m,d));h+=`<button class="mc${k===td?' mt':''}${isRed(k)?' mh':isSat(k)?' mb':''}${k===sel?' ms':''}" data-a="mp" data-d="${k}" aria-label="${k}">${gd[k]?'<span class="gf" aria-label="목표 달성">🚩</span>':''}<b>${d}</b><span class="dt">${dotsFor(k)}</span><span class="mo">${S.moods[k]||''}</span></button>`}
return h+'</div>'}
function dayPanelHTML(){const d=dkey(sel),hn=holiday(sel);return `<div class="mp"><div class="hd"><div><p class="mu${isRed(sel)?' hl':isSat(sel)?' bl':''}" style="margin:0">${WD[d.getDay()]}요일${hn?' · '+hn:''}</p><b style="font-size:18px;font-weight:500">${d.getMonth()+1}월 ${d.getDate()}일</b></div><span class="mu">${wxS(sel)}</span></div><div class="mr">${MOODS.map(e=>`<button class="mm${S.moods[sel]===e?' on':''}" data-a="mood" data-m="${e}" aria-label="기분 ${e}">${e}</button>`).join('')}</div>${goalDoneHTML()}${listHTML()}<button class="ch" style="margin:8px 0 16px" data-a="new">＋ 일정 추가</button></div>`}
function calHTML(){const t=new Date(),cur=cm.y===t.getFullYear()&&cm.m===t.getMonth();return `<div id="ls"><div class="hd" style="margin-top:16px"><div><p class="mu" style="margin:0">${cm.y}년</p><div class="rw" style="align-items:center;gap:10px;margin:0"><h1 style="margin:0">${cm.m+1}월</h1>${goalSumHTML()}</div></div><div>${cur?'':'<button class="tx" data-a="mtoday">오늘</button>'}<button class="nv" data-a="mm" data-n="-1" aria-label="지난달">‹</button><button class="nv" data-a="mm" data-n="1" aria-label="다음달">›</button></div></div>${monthHTML()}</div>`}
let DY=false,GS=false,GE=null;
const ymOf=()=>cm.y+'-'+pad(cm.m+1),mg=()=>S.goalsM[ymOf()]||[];
function migGoals(){if(S.goals&&S.goals.length){const ym=ymd(new Date()).slice(0,7),a=S.goalsM[ym]=S.goalsM[ym]||[];S.goals.forEach(t=>a.push({id:uid(),t,done:false}));S.goals=[];save()}}
function goalSumHTML(){const g=mg();return `<button class="gs" data-a="gtog" aria-label="이번 달 목표">${g.length?`<span class="gt">${g[0].done?'✓ ':''}${esc(g[0].t)}</span>${g.length>1?`<span>외 ${g.length-1}건</span>`:''}`:'<span>＋ 목표</span>'}</button>`}
function drawGoals(){GS=true;const g=mg(),n=g.filter(x=>x.done).length;SH.innerHTML=`<div class="ov" data-a="ovx"><div class="sh" role="dialog" aria-modal="true" aria-label="목표"><div class="hd"><div><p class="mu" style="margin:0">${cm.y}년</p><b style="font-size:18px;font-weight:500">${cm.m+1}월 목표</b></div><span class="mu">${g.length?n+'/'+g.length+' 달성':''}</span></div>${g.map(x=>x.id===GE?`<div class="r"><input id="ge" class="in" value="${esc(x.t)}" aria-label="목표 수정" style="margin:6px 0"><button class="ch on" data-a="gsave" data-id="${x.id}">저장</button><button class="ch" data-a="gcancel">취소</button></div>`:`<div class="r"><button class="ck${x.done?' dn':''}" role="checkbox" aria-checked="${!!x.done}" aria-label="달성 표시" data-a="gdone" data-id="${x.id}"></button><button class="rb" data-a="gedit" data-id="${x.id}"><span class="ti${x.done?' dd':''}">${esc(x.t)}</span></button><button class="rd" data-a="gedit" data-id="${x.id}">수정</button><button class="rd" data-a="gdel" data-id="${x.id}">삭제</button></div>`).join('')||'<p class="mu">이번 달 목표를 적어 보세요.</p>'}<div class="rw" style="margin:12px 0"><input id="gi" class="in" placeholder="목표 추가" aria-label="목표 입력" enterkeyhint="done"><button class="ch on" data-a="gadd">추가</button></div><button class="ch" data-a="dyc">닫기</button></div></div>`}
function goalDoneHTML(){const t=Object.values(S.goalsM).flat().filter(g=>g.done&&g.doneOn===sel).map(g=>esc(g.t));return t.length?`<p class="mu" style="margin:0 0 8px">🚩 달성한 목표 · ${t.join(', ')}</p>`:''}
A.gtog=()=>drawGoals();
A.gadd=()=>{const e=$('gi'),v=e?e.value.trim():'';if(!v)return;(S.goalsM[ymOf()]=mg()).push({id:uid(),t:v,done:false});save();drawGoals();render();$('gi').focus()};
A.gdone=d=>{const x=mg().find(y=>y.id===d.id);x.done=!x.done;x.doneOn=x.done?ymd(new Date()):null;save();drawGoals();render()};
A.gdel=d=>{const a=mg(),i=a.findIndex(y=>y.id===d.id),x=a[i];S.goalsM[ymOf()]=a.filter(y=>y.id!==d.id);save();drawGoals();render();toast('삭제했어요','되돌리기',()=>{const b=mg();b.splice(Math.min(i,b.length),0,x);S.goalsM[ymOf()]=b;save();drawGoals();render()})};
A.gedit=d=>{GE=d.id;drawGoals();const e=$('ge');e.focus();e.select()};
A.gsave=d=>{const v=$('ge').value.trim();if(!v){toast('내용을 적어 주세요');return}mg().find(y=>y.id===d.id).t=v;GE=null;save();drawGoals();render()};
A.gcancel=()=>{GE=null;drawGoals()};
document.addEventListener('keydown',e=>{if(e.target.id==='ge'&&e.key==='Enter'&&GE)A.gsave({id:GE})});
function drawDay(){DY=true;SH.innerHTML=`<div class="ov" data-a="ovx"><div class="sh" role="dialog" aria-modal="true" aria-label="선택한 날">${dayPanelHTML()}<button class="ch" style="margin:0 0 8px" data-a="dyc">닫기</button></div></div>`}
A.mp=d=>{setSel(d.d);DY=true;render()};
A.dyc=()=>closeSheet();
A.mm=d=>{const x=new Date(cm.y,cm.m+ +d.n,1),t=new Date();cm={y:x.getFullYear(),m:x.getMonth()};setSel(cm.y===t.getFullYear()&&cm.m===t.getMonth()?ymd(t):ymd(x));render()};
A.mtoday=()=>{const t=new Date();cm={y:t.getFullYear(),m:t.getMonth()};setSel(ymd(t));render()};
A.mood=d=>{if(S.moods[sel]===d.m)delete S.moods[sel];else S.moods[sel]=d.m;save();render()};
document.addEventListener('keydown',e=>{if(e.target.id==='gi'&&e.key==='Enter')A.gadd()});

/* weather.js: 선택한 날짜의 날씨 */
const WX={lat:36.274,lon:127.249,data:{},state:'idle'};
const WIC=c=>c===0?'☀️':c<=2?'🌤️':c===3?'☁️':c<=48?'🌫️':c<=57?'🌦️':c<=67?'🌧️':c<=77?'🌨️':c<=82?'🌧️':c<=86?'🌨️':'⛈️';
async function wxLoad(){if(WX.state!=='idle')return;WX.state='load';try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${WX.lat}&longitude=${WX.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&past_days=7&forecast_days=14`);const j=await r.json();j.daily.time.forEach((d,i)=>WX.data[d]={c:j.daily.weathercode[i],hi:Math.round(j.daily.temperature_2m_max[i]),lo:Math.round(j.daily.temperature_2m_min[i])});WX.state='ok'}catch(e){WX.state='fail'}if(!T&&!R)render()}
function wxS(k){const w=WX.data[k];return w?`${WIC(w.c)} ${w.hi}°/${w.lo}°`:WX.state==='fail'?'날씨 연동 예정':''}
const wxT=k=>wxS(k)?' · '+wxS(k):'';

/* repeat.js: 반복 일정 */
let R=null;
const rerr=m=>{R.msg=m;const e=$('r-m');if(e){e.textContent=m;e.style.color='var(--rd)';e.scrollIntoView({block:'center'})}toast(m)};
const rdays=r=>r.kind==='every'?r.every+'일마다':(r.days.length===7?'매일':r.days.map(i=>WD[i]).join('·'));
function repOn(r,k){if(k<r.start)return false;if(r.kind==='every')return Math.round((dkey(k)-dkey(r.start))/DAY)%r.every===0;return r.days.includes(dkey(k).getDay())}
let RPO=true;
function repListHTML(){const rs=S.reps.filter(r=>repOn(r,sel)).sort((a,b)=>(a.time||'').localeCompare(b.time||''));if(!rs.length)return '';
const rows=rs.map(r=>{const dn=!!S.rdone[sel+'|'+r.id];return `<div class="r"><button class="ck${dn?' dn':''}" role="checkbox" aria-checked="${dn}" aria-label="완료 표시" data-a="rtg" data-id="${r.id}"></button><button class="rb" data-a="redit" data-id="${r.id}"><span class="mu tm">${fmtTime(r.time)}</span><span class="ti${dn?' dd':''}">${esc(r.title)}</span><span class="mu">${r.detail?'메모 ':''}${r.alarm!==null&&r.alarm!==undefined?'⏰ ':''}${rdays(r)}</span></button></div>`}).join('');
return `<div class="rpn"><button class="rph" data-a="rptog" aria-expanded="${RPO}"><span>↻ 반복 일정 ${rs.length}</span><span class="mu">${RPO?'접기':'펼치기'}</span></button>${RPO?`<div class="rpl">${rows}</div>`:''}</div>`}
A.rptog=()=>{RPO=!RPO;render()};
function drawRep(){const L=R.mode==='list';SH.innerHTML=`<div class="ov" data-a="ovx"><div class="sh" role="dialog" aria-modal="true" aria-label="반복 일정">`+(L?
(S.reps.map(r=>`<div class="r"><button class="rb" data-a="redit" data-id="${r.id}"><span class="mu tm">${fmtTime(r.time)}</span><span class="ti">${esc(r.title)}</span><span class="mu">${r.detail?'메모 ':''}${r.alarm!==null&&r.alarm!==undefined?'⏰ ':''}${rdays(r)}</span></button><button class="rd" data-a="rdel" data-id="${r.id}">삭제</button></div>`).join('')||'<p class="mu">아직 반복 틀이 없어요.</p>')+`<p class="mu">반복 일정은 일정 화면 아래에 날짜별로 나와요. 틀을 누르면 수정해요.</p><div class="rw"><button class="ch on" data-a="rnew">＋ 새 반복</button></div>`
:`<label class="mu" for="r-t">내용</label><input id="r-t" class="in" value="${esc(R.title)}"><label class="mu" for="r-x">시간 (비우면 종일)</label><input id="r-x" class="in" value="${R.time?fmtTime(R.time):''}" placeholder="예: 7:30, 오후 7시 30분"><p class="mu" id="r-m" style="margin:0 0 8px">${R.msg||''}</p><label class="mu" for="r-l">알람</label><select id="r-l" class="in"${R.time?'':' disabled'}>${ALARMS.map(([v,l])=>`<option value="${v===null?'':v}"${R.alarm===v?' selected':''}>${l}</option>`).join('')}</select><p class="mu" style="margin:4px 0 8px">반복 일정 당일 설정한 시간에 소리와 알림창으로 알려드려요.</p><div class="rw"><button class="ch${R.kind==='wd'?' on':''}" data-a="rkind" data-v="wd">요일마다</button><button class="ch${R.kind==='every'?' on':''}" data-a="rkind" data-v="every">며칠마다</button></div>`
+(R.kind==='wd'?`<div class="rw" style="flex-wrap:wrap;margin-top:8px">${[0,1,2,3,4,5,6].map(i=>`<button class="ch${R.days.includes(i)?' on':''}" data-a="rday" data-d="${i}">${WD[i]}</button>`).join('')}</div>`:`<label class="mu" for="r-n">몇 일에 한 번</label><input id="r-n" class="in" type="number" min="1" max="365" value="${R.every}">`)
+`<label class="mu" for="r-s">시작일</label><input id="r-s" class="in" type="date" value="${R.start}"><label class="mu" for="r-d">자세히 (선택)</label><textarea id="r-d" class="in" rows="3">${esc(R.detail)}</textarea><div class="rw" style="margin-top:12px"><button class="ch" data-a="rback">목록</button><button class="ch on" style="margin-left:auto" data-a="rsave">저장</button></div>`)+`</div></div>`}
A.rp=()=>{R={mode:'list'};drawRep()};
A.rnew=()=>{R={mode:'edit',id:null,title:'',time:null,alarm:null,kind:'wd',days:[0,1,2,3,4,5,6],every:2,start:ymd(new Date()),detail:'',msg:''};drawRep()};
A.redit=d=>{const r=S.reps.find(x=>x.id===d.id);R={mode:'edit',id:r.id,title:r.title,time:r.time,alarm:r.alarm!==undefined?r.alarm:null,kind:r.kind||'wd',days:[...r.days||[]],every:r.every||2,start:r.start,detail:r.detail||'',msg:''};drawRep()};
A.rdel=d=>{S.reps=S.reps.filter(x=>x.id!==d.id);save();drawRep();render()};
A.rkind=d=>{R.kind=d.v;drawRep()};
A.rday=d=>{const i=+d.d,k=R.days.indexOf(i);k<0?R.days.push(i):R.days.splice(k,1);drawRep()};
A.rback=()=>{R={mode:'list'};drawRep()};
A.rtg=d=>{const k=sel+'|'+d.id;S.rdone[k]?delete S.rdone[k]:S.rdone[k]=1;save();render()};
A.rsave=()=>{const g=id=>{const e=$(id);return e?e.value:null};
const x=g('r-x');if(x!==null){const v=x.trim(),p=v?parseTime(v):null;if(!v)R.time=null;else if(p)R.time=p;else{rerr('시간을 이해하지 못했어요. 예: 7:30, 오후 7시 30분');return}}
const alEl=$('r-l');if(alEl)R.alarm=alEl.value===''?null:+alEl.value;if(!R.time)R.alarm=null;
if(g('r-n')!==null)R.every=Math.floor(+g('r-n'));if(g('r-s'))R.start=g('r-s');
const bad=!R.title.trim()?'내용을 적어 주세요.':R.kind==='wd'&&!R.days.length?'요일을 하나 이상 골라 주세요.':R.kind==='every'&&!(R.every>=1)?'1 이상의 숫자를 적어 주세요.':!R.start?'시작일을 골라 주세요.':'';
if(bad){rerr(bad);return}
if(R.alarm!==null&&"Notification" in window&&Notification.permission==='default'){Notification.requestPermission()}
const o={title:R.title.trim(),time:R.time,alarm:R.alarm,kind:R.kind,days:[...R.days].sort(),every:R.every,start:R.start,detail:R.detail};
if(R.id)Object.assign(S.reps.find(x=>x.id===R.id),o);else S.reps.push(Object.assign({id:uid()},o));save();closeSheet();render();toast('반복 일정을 저장했어요')};
A.tpl=d=>{const r=S.reps.find(x=>x.id===d.id);T.title=r.title;T.time=r.time;T.alarm=r.alarm!==undefined?r.alarm:null;T.detail=r.detail||T.detail;drawSheet()};
SH.addEventListener('change',e=>{if(!R)return;const i=e.target.id;if(i==='r-x'){const v=e.target.value.trim(),p=v?parseTime(v):null;if(!v){R.time=null;R.alarm=null;$('r-m').textContent='';const el=$('r-l');if(el){el.disabled=true;el.value=''}}else if(p){R.time=p;$('r-m').textContent='';const el=$('r-l');if(el)el.disabled=false}else $('r-m').textContent='시간을 이해하지 못했어요. 예: 7:30, 오후 7시 30분'}else if(i==='r-l'){R.alarm=e.target.value===''?null:+e.target.value}});
SH.addEventListener('input',e=>{if(!R)return;const i=e.target.id;if(i==='r-t')R.title=e.target.value;if(i==='r-d')R.detail=e.target.value;if(i==='r-n')R.every=Math.floor(+e.target.value);if(i==='r-s')R.start=e.target.value});
