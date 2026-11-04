/* js/state.js - 전역 상태 및 공통 유틸리티 */
const $ = id => document.getElementById(id);

const idb = (m, k, v) => new Promise(ok => {
  try {
    const q = indexedDB.open('diary-fs', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('f');
    q.onsuccess = () => {
      const s = q.result.transaction('f', m === 'get' ? 'readonly' : 'readwrite').objectStore('f');
      const r = m === 'get' ? s.get(k) : s.put(v, k);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    };
    q.onerror = () => ok(null);
  } catch (e) {
    ok(null);
  }
});

function toast(m, label, fn) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  if (label) {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = 'tu';
    b.onclick = () => { fn(); t.className = ''; };
    t.appendChild(b);
  }
  t.className = label ? 'on act' : 'on';
  clearTimeout(toast.h);
  toast.h = setTimeout(() => { t.className = ''; }, label ? 5000 : 2200);
}

const ALARM_KEY = 'diary.alarms.fired';
function getFiredAlarms() {
  try { return JSON.parse(localStorage.getItem(ALARM_KEY)) || {}; } catch(e) { return {}; }
}
function markAlarmFired(k) {
  try {
    const f = getFiredAlarms();
    f[k] = Date.now();
    const old = Date.now() - 7 * 864e5;
    for (const x in f) { if (f[x] < old) delete f[x]; }
    localStorage.setItem(ALARM_KEY, JSON.stringify(f));
  } catch(e) {}
}

/* data.js: 항목 저장 구조 */
const KEY='diary.v1',A={};
let S={items:[],fmt12:false,goals:[],goalsM:{},moods:{},reps:[],skip:{},rdone:{},diary:{},cfg:{lock:true,alarmSound:'chime',alarmVol:80,bgKeepAlive:true}},DR={title:'',time:null,alarm:null};
function load(){try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('저장 공간이 부족해요')}syKick();syncScheduledNotifications();updateBgKeepAlive()}
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function itemsOn(d){return S.items.filter(i=>i.date===d).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))}
function addItem(o){S.items.push(Object.assign({id:uid(),kind:'event',time:null,alarm:null,done:false,detail:''},o));save()}
function updItem(id,p){const i=S.items.find(x=>x.id===id);if(i){Object.assign(i,p);save()}}
function delItem(id){const i=S.items.find(x=>x.id===id);if(i&&i.rid)S.skip[i.date+'|'+i.rid]=1;S.items=S.items.filter(x=>x.id!==id);save()}

/* time.js: 시간 해석·표기, 알람 선택지 */
function parseTime(s){s=s.toLowerCase().replace(/\s+/g,'');const pm=/오후|pm|p\.m/.test(s),am=/오전|am|a\.m/.test(s);s=s.replace(/오전|오후|a\.m\.?|p\.m\.?|am|pm/g,'');let h,n=0,m;
if(m=s.match(/^(\d{1,2})시반$/)){h=+m[1];n=30}else if(m=s.match(/^(\d{1,2})(?:[:시.](\d{1,2})?)?분?$/)){h=+m[1];n=+(m[2]||0)}else if(m=s.match(/^(\d{1,2})(\d{2})$/)){h=+m[1];n=+m[2]}else return null;
if(pm&&h<12)h+=12;if(am&&h===12)h=0;return h>23||n>59?null:pad(h)+':'+pad(n)}
function fmtTime(t){if(!t)return '종일';if(!S.fmt12)return t;const h=+t.slice(0,2);return (h<12?'오전 ':'오후 ')+(h%12||12)+':'+t.slice(3)}
const ALARMS=[[null,'알람 없음'],[0,'정시'],[10,'10분 전'],[30,'30분 전']];

/* holidays.js: 한국 공휴일 */
const HX={'2026-06-03':'지방선거'};
const HC={},DAY=864e5;
const iso=t=>t.toISOString().slice(0,10);
const utc=(y,m,d)=>new Date(Date.UTC(y,m,d));
function lunar(t){const o={};new Intl.DateTimeFormat('en-u-ca-chinese',{timeZone:'UTC',month:'numeric',day:'numeric'}).formatToParts(new Date(t.getTime()+12*36e5)).forEach(x=>o[x.type]=x.value);return {m:parseInt(o.month),leap:/\D/.test(o.month),d:+o.day}}
function holidaysOf(y){if(HC[y])return HC[y];const M={},dup={},cand=[];
const add=(t,n)=>{const k=iso(t);if(M[k])dup[k]=1;M[k]=n};
[[0,1,'신정'],[2,1,'삼일절',1],[4,5,'어린이날',1],[5,6,'현충일'],[7,15,'광복절',1],[9,3,'개천절',1],[9,9,'한글날',1],[11,25,'성탄절',1]].concat(y>=2026?[[6,17,'제헌절',1]]:[],y>=2027?[[4,1,'노동절',1]]:[]).forEach(([m,d,n,s])=>{const t=utc(y,m,d);add(t,n);if(s)cand.push({e:t,n,s:1})});
for(let t=utc(y,0,1);t.getUTCFullYear()===y;t=new Date(t.getTime()+DAY)){const l=lunar(t);if(l.leap)continue;
if(l.m===4&&l.d===8){add(t,'부처님오신날');cand.push({e:t,n:'부처님오신날',s:1})}
else if((l.m===1&&l.d===1)||(l.m===8&&l.d===15)){const n=l.m===1?'설날':'추석',b=[-1,0,1].map(i=>new Date(t.getTime()+i*DAY));b.forEach((x,i)=>add(x,i===1?n:n+' 연휴'));cand.push({e:b[2],n,b})}}
Object.keys(HX).forEach(k=>{if(+k.slice(0,4)===y)M[k]=HX[k]});
const wk=t=>t.getUTCDay()%6===0,nx=t=>{t=new Date(t.getTime()+DAY);while(wk(t)||M[iso(t)])t=new Date(t.getTime()+DAY);return t},done={};
cand.sort((a,b)=>a.e-b.e).forEach(c=>{const k=iso(c.e);if(done[k])return;const hit=c.b?c.b.some(x=>x.getUTCDay()===0||dup[iso(x)]):(wk(c.e)||dup[k]);if(hit){done[k]=1;M[iso(nx(c.e))]='대체공휴일('+c.n+')'}});
return HC[y]=M}
function holiday(k){return holidaysOf(+k.slice(0,4))[k]||null}
function isRed(k){return new Date(k+'T12:00:00').getDay()===0||!!holiday(k)}
function isSat(k){return new Date(k+'T12:00:00').getDay()===6}
