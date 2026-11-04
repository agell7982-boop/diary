/* js/today.js - [오늘/일정] 탭 화면 및 시트 */
/* week.js: 1주일 달력 */
const WD='일월화수목금토';let sel=ymd(new Date()),wk=0;
const dkey=k=>new Date(k+'T12:00:00');
function shift(k,n){const d=dkey(k);d.setDate(d.getDate()+n);return ymd(d)}
function weekDays(){const t=new Date();t.setHours(12,0,0,0);t.setDate(t.getDate()-t.getDay()+7*wk);return [0,1,2,3,4,5,6].map(i=>{const d=new Date(t);d.setDate(t.getDate()+i);return ymd(d)})}
const star=c=>`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="stroke:${c}" stroke-width="2" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`;
function dotsFor(k){const it=itemsOn(k);if(!it.length)return '';if(it.length>=5)return star(it.every(i=>i.done)?'var(--ok)':'var(--no)');return it.slice(0,4).map(i=>`<i class="${i.done?'y':'n'}"></i>`).join('')}
function headHTML(){const d=dkey(sel),home=sel===ymd(new Date())&&wk===0,hn=holiday(sel);return `<div class="hd"><div><p class="mu${isRed(sel)?' hl':isSat(sel)?' bl':''}" style="margin:0">${WD[d.getDay()]}요일${hn?' · '+hn:''}${wxT(sel)}</p><h1>${d.getMonth()+1}월 ${d.getDate()}일</h1></div><div>${home?'':'<button class="tx" data-a="today">오늘</button>'}<button class="nv" data-a="wk" data-n="-1" aria-label="지난주">‹</button><button class="nv" data-a="wk" data-n="1" aria-label="다음주">›</button></div></div>`}
function weekHTML(){const td=ymd(new Date());return `<div class="wk">${weekDays().map((k,i)=>`<button class="d${k===sel?' a':''}${k===td?' t':''}${isRed(k)?' h':!isRed(k)&&isSat(k)?' b':''}" data-a="pick" data-d="${k}" aria-label="${k}"><span class="mu${i===0?' hl':i===6?' bl':''}">${'일월화수목금토'[i]}</span><b>${+k.slice(8)}</b><span class="dt">${dotsFor(k)}</span></button>`).join('')}</div>`}
A.pick=d=>{sel=d.d;render()};
A.wk=d=>{wk+=+d.n;sel=shift(sel,7*+d.n);render()};
A.today=()=>{sel=ymd(new Date());wk=0;render()};

/* list.js: 선택한 날짜의 시간순 목록 */
function listHTML(){return itemsListHTML()+repListHTML()}
function itemsListHTML(){const it=itemsOn(sel);if(!it.length)return '<p class="mu" style="margin-top:24px">'+(tab==='일정'?'이 날은 비어 있어요. 아래에 적어 보세요.':'이 날은 비어 있어요.')+'</p>';
return it.map(i=>`<div class="r"><button class="ck${i.done?' dn':''}" role="checkbox" aria-checked="${i.done}" aria-label="완료 표시" data-a="done" data-id="${i.id}"></button><button class="rb" data-a="open" data-id="${i.id}"><span class="mu tm">${fmtTime(i.time)}</span><span class="ti${i.done?' dd':''}">${esc(i.title)}</span><span class="mu">${i.detail?'메모 ':''}${i.alarm!==null?'⏰ ':''}</span></button><button class="rd" data-a="rm" data-id="${i.id}" aria-label="삭제">삭제</button></div>`).join('')}
A.done=d=>{const i=S.items.find(x=>x.id===d.id);updItem(d.id,{done:!i.done});render()};
A.open=d=>openSheet(d.id);
function removeWithUndo(id){const i=S.items.find(x=>x.id===id);if(!i)return;const k=S.items.indexOf(i);delItem(id);render();toast('삭제했어요','되돌리기',()=>{S.items.splice(Math.min(k,S.items.length),0,i);save();render()})}
A.rm=d=>removeWithUndo(d.id);

/* input.js: 하단 입력줄 */
function barHTML(){return `<div class="ib"><input id="ti" placeholder="일정을 적어요" value="${esc(DR.title)}" aria-label="일정 입력" enterkeyhint="done"><button class="cb" data-a="dt">${DR.time?fmtTime(DR.time):'시간'}</button><button class="cb" data-a="rp">반복</button><button class="ad" data-a="new" aria-label="자세히 쓰기로 추가">+</button></div>`}
A.dt=()=>openSheet(null,'time');A.new=()=>openSheet(null,'new');
A.add=()=>{const t=DR.title.trim();if(!t){const e=document.getElementById('ti');if(e)e.focus();return}addItem({date:sel,title:t,time:DR.time,alarm:DR.alarm});DR={title:'',time:null,alarm:null};render()};
document.addEventListener('input',e=>{if(e.target.id==='ti')DR.title=e.target.value});
document.addEventListener('keydown',e=>{if(e.target.id==='ti'&&e.key==='Enter')A.add()});

/* sheet.js: 시간·알람 설정 시트 */
let T=null;const SH=document.getElementById('sheet'),$=id=>document.getElementById(id);
function openSheet(id,mode){const i=id&&S.items.find(x=>x.id===id);T={id:id||null,full:!!(i||mode==='new'),title:i?i.title:(mode==='new'?DR.title:''),detail:i?(i.detail||''):'',time:i?i.time:DR.time,alarm:i?i.alarm:DR.alarm,msg:''};drawSheet()}
function closeSheet(){const back=DY&&(T||R);T=null;R=null;SH.innerHTML='';if(back)drawDay();else{DY=false;GS=false;GE=null}}
function selHTML(){const t=T.time,h=t?+t.slice(0,2):'',m=t?+t.slice(3):0;
const mo=[...Array(12).keys()].map(k=>k*5);if(t&&!mo.includes(m)){mo.push(m);mo.sort((a,b)=>a-b)}
const mm=`<select id="q-m" class="in" aria-label="분">${mo.map(x=>`<option value="${x}"${x===m?' selected':''}>${pad(x)}분</option>`).join('')}</select>`;
if(S.fmt12){const pm=h!==''&&h>=12;return `<select id="q-a" class="in" aria-label="오전 오후"><option value="0"${pm?'':' selected'}>오전</option><option value="1"${pm?' selected':''}>오후</option></select><select id="q-h" class="in" aria-label="시"><option value="">시</option>${[...Array(12).keys()].map(k=>{const v=k+1;return `<option value="${v}"${h!==''&&(h%12||12)===v?' selected':''}>${v}시</option>`}).join('')}</select>${mm}`}
return `<select id="q-h" class="in" aria-label="시"><option value="">시</option>${[...Array(24).keys()].map(k=>`<option value="${k}"${h===k?' selected':''}>${k}시</option>`).join('')}</select>${mm}`}
function drawSheet(){SH.innerHTML=`<div class="ov" data-a="ovx"><div class="sh" role="dialog" aria-modal="true" aria-label="시간과 알람">`
+(T.full?`${S.reps.length?'<p class="mu" style="margin:0 0 4px">반복 틀</p><div class="rw" style="flex-wrap:wrap">'+S.reps.map(r=>`<button class="ch" data-a="tpl" data-id="${r.id}">${esc(r.title)}</button>`).join('')+'</div>':''}<label class="mu" for="q-t">제목</label><input id="q-t" class="in" value="${esc(T.title)}"><label class="mu" for="q-d">자세히 쓰기</label><textarea id="q-d" class="in" rows="5" placeholder="이 일정에 대해 자유롭게 적어 보세요">${esc(T.detail)}</textarea>`:'')
+`<label class="mu" for="q-x">시간 (직접 쓰기)</label><input id="q-x" class="in" value="${T.time?fmtTime(T.time):''}" placeholder="예: 7:30, 오후 7시 30분"><div class="rw">${selHTML()}</div>`
+`<p class="mu" style="margin:4px 0 8px">${T.msg||'비워 두면 종일 일정이에요.'}</p><div class="rw"><button class="ch" data-a="fmt">${S.fmt12?'오전·오후 표기':'24시간 표기'}</button></div>`
+`<label class="mu" for="q-l">알람</label><select id="q-l" class="in"${T.time?'':' disabled'}>${ALARMS.map(([v,l])=>`<option value="${v===null?'':v}"${T.alarm===v?' selected':''}>${l}</option>`).join('')}</select>`
+`<p class="mu" style="margin:4px 0 8px">설정한 시간에 소리와 알림창으로 알려드려요.</p>`
+`<div class="rw">${T.id?'<button class="ch" style="color:var(--no)" data-a="del">삭제</button>':''}<button class="ch pr" data-a="ok">완료</button></div></div></div>`}
SH.addEventListener('change',e=>{if(!T)return;const i=e.target.id;
if(i==='q-x'){const v=e.target.value.trim();if(!v){T.time=null;T.msg=''}else{const p=parseTime(v);if(p){T.time=p;T.msg=''}else T.msg='시간을 이해하지 못했어요. 예: 7:30, 오후 7시 30분'}if(T.time===null)T.alarm=null;drawSheet()}
else if(i==='q-h'||i==='q-m'||i==='q-a'){const hv=$('q-h').value;if(hv===''){T.time=null;T.alarm=null}else{let h=+hv;if(S.fmt12)h=(h%12)+(+$('q-a').value?12:0);T.time=pad(h)+':'+pad(+$('q-m').value);T.msg=''}drawSheet()}
else if(i==='q-l')T.alarm=e.target.value===''?null:+e.target.value;
else if(i==='q-t')T.title=e.target.value;
else if(i==='q-d')T.detail=e.target.value});
SH.addEventListener('input',e=>{if(!T)return;if(e.target.id==='q-d')T.detail=e.target.value;if(e.target.id==='q-t')T.title=e.target.value});
SH.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.a==='ovx'){if(e.target===b)closeSheet();return}if(A[b.dataset.a])A[b.dataset.a](b.dataset)});
A.fmt=()=>{S.fmt12=!S.fmt12;save();drawSheet();render()};
A.ok=()=>{if(!T)return;
if(T.alarm!==null && "Notification" in window && Notification.permission==='default'){Notification.requestPermission()}
if(T.id){const o=S.items.find(x=>x.id===T.id);updItem(T.id,{title:T.title.trim()||o.title,detail:T.detail,time:T.time,alarm:T.alarm})}else if(T.full){const t=T.title.trim();if(!t){T.msg='제목을 적어 주세요.';drawSheet();return}addItem({date:sel,title:t,detail:T.detail,time:T.time,alarm:T.alarm});DR={title:'',time:null,alarm:null}}else{DR.time=T.time;DR.alarm=T.alarm}closeSheet();render()};
A.del=()=>{const id=T.id;closeSheet();removeWithUndo(id)};
