/* js/state.js - 전역 상태, 공통 유틸리티, 공휴일 및 모달 상태 */

// 1. DOM 및 IndexedDB 코어 유틸
const $ = id => document.getElementById(id);
const SH = document.getElementById('sheet');

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

// 2. 알람 이력 관리
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

// 3. 전역 앱 상태 및 기본 헬퍼
const KEY = 'diary.v1', A = {};
let S = {
  items: [],
  fmt12: false,
  goals: [],
  goalsM: {},
  moods: {},
  weather: {},
  reps: [],
  skip: {},
  rdone: {},
  diary: {},
  cfg: {
    lock: true,
    showLunar: true,
    alarmSound: 'chime',
    alarmVol: 80,
    bgKeepAlive: true,
    dailyRoutine: {
      enabled: false,
      time: '08:30',
      title: '하루 일정 조절 알림',
      msg: '오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝'
    }
  }
};
let DR = { title: '', time: null, alarm: null };

function load() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      S = Object.assign(S, JSON.parse(r));
      if (!S.weather) S.weather = {};
      if (!S.cfg) S.cfg = {};
      if (S.cfg.lock === undefined) S.cfg.lock = true;
      if (S.cfg.showLunar === undefined) S.cfg.showLunar = true;
      if (!S.cfg.dailyRoutine) {
        S.cfg.dailyRoutine = {
          enabled: false,
          time: '08:30',
          title: '하루 일정 조절 알림',
          msg: '오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝'
        };
      }
    }
  } catch(e) {}
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch(e) {
    toast('저장 공간이 부족해요');
  }
  if (typeof syKick === 'function') syKick();
  if (typeof syncScheduledNotifications === 'function') syncScheduledNotifications();
  if (typeof updateBgKeepAlive === 'function') updateBgKeepAlive();
}

const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function isNativeApp() {
  if (typeof window === 'undefined') return false;
  if (window.Capacitor) {
    if (typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) return true;
    if (typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() !== 'web') return true;
  }
  return window.location.protocol === 'capacitor:' || (window.location.hostname === 'localhost' && window.location.port === '');
}

async function openExternalUrl(url) {
  if (!url) return;
  if (isNativeApp() && window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Browser')) {
    try {
      await window.Capacitor.Plugins.Browser.open({ url });
      return true;
    } catch (e) {
      console.warn('Capacitor Browser plugin error:', e);
    }
  }
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 500);
    return true;
  } catch (e) {
    try { window.open(url, '_blank'); } catch(err) {}
  }
}

const hash = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('dg' + s)))].map(b => b.toString(16).padStart(2, '0')).join('');

function itemsOn(d) {
  return S.items.filter(i => i.date === d).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}
function addItem(o) {
  S.items.push(Object.assign({ id: uid(), kind: 'event', time: null, alarm: null, done: false, detail: '' }, o));
  save();
}
function updItem(id, p) {
  const i = S.items.find(x => x.id === id);
  if (i) { Object.assign(i, p); save(); }
}
function delItem(id) {
  const i = S.items.find(x => x.id === id);
  if (i && i.rid) S.skip[i.date + '|' + i.rid] = 1;
  S.items = S.items.filter(x => x.id !== id);
  save();
}

// 4. 시간 변환 및 알람 옵션
function parseTime(s) {
  s = s.toLowerCase().replace(/\s+/g, '');
  const pm = /오후|pm|p\.m/.test(s), am = /오전|am|a\.m/.test(s);
  s = s.replace(/오전|오후|a\.m\.?|p\.m\.?|am|pm/g, '');
  let h, n = 0, m;
  if (m = s.match(/^(\d{1,2})시반$/)) { h = +m[1]; n = 30; }
  else if (m = s.match(/^(\d{1,2})(?:[:시.](\d{1,2})?)?분?$/)) { h = +m[1]; n = +(m[2] || 0); }
  else if (m = s.match(/^(\d{1,2})(\d{2})$/)) { h = +m[1]; n = +m[2]; }
  else return null;
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  return h > 23 || n > 59 ? null : pad(h) + ':' + pad(n);
}

function fmtTime(t) {
  if (!t) return '종일';
  if (!S.fmt12) return t;
  const h = +t.slice(0, 2);
  return (h < 12 ? '오전 ' : '오후 ') + (h % 12 || 12) + ':' + t.slice(3);
}

const ALARMS = [[null, '알람 없음'], [0, '정시'], [10, '10분 전'], [30, '30분 전']];

// 5. 날짜 공통 연산 및 상태
const WD = '일월화수목금토';
const DAY = 864e5;
let sel = ymd(new Date()), wk = 0;
const dkey = k => new Date(k + 'T12:00:00');
function shift(k, n) {
  const d = dkey(k);
  d.setDate(d.getDate() + n);
  return ymd(d);
}
const star = c => `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="vertical-align:-1px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${c}"/></svg>`;
function dotsFor(k) {
  const it = itemsOn(k);
  if (!it.length) return '';
  if (it.length >= 5) return star(it.every(i => i.done) ? 'var(--ok)' : 'var(--no)');
  return it.slice(0, 4).map(i => `<i class="${i.done ? 'y' : 'n'}"></i>`).join('');
}

function repOn(r, k) {
  if (k < r.start) return false;
  if (r.kind === 'every') return Math.round((dkey(k) - dkey(r.start)) / DAY) % r.every === 0;
  return r.days.includes(dkey(k).getDay());
}

// 6. 한국 공휴일 계산
const HX = { '2026-06-03': '지방선거' };
const HC = {};
const iso = t => t.toISOString().slice(0, 10);
const utc = (y, m, d) => new Date(Date.UTC(y, m, d));
function lunar(t) {
  const o = {};
  new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'UTC', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date(t.getTime() + 12 * 36e5))
    .forEach(x => o[x.type] = x.value);
  return { m: parseInt(o.month), leap: /\D/.test(o.month), d: +o.day };
}
function holidaysOf(y) {
  if (HC[y]) return HC[y];
  const M = {}, dup = {}, cand = [];
  const add = (t, n) => { const k = iso(t); if (M[k]) dup[k] = 1; M[k] = n; };
  [[0,1,'신정'],[2,1,'삼일절',1],[4,5,'어린이날',1],[5,6,'현충일'],[7,15,'광복절',1],[9,3,'개천절',1],[9,9,'한글날',1],[11,25,'성탄절',1]]
    .concat(y >= 2026 ? [[6,17,'제헌절',1]] : [], y >= 2027 ? [[4,1,'노동절',1]] : [])
    .forEach(([m, d, n, s]) => { const t = utc(y, m, d); add(t, n); if (s) cand.push({ e: t, n, s: 1 }); });
  for (let t = utc(y, 0, 1); t.getUTCFullYear() === y; t = new Date(t.getTime() + DAY)) {
    const l = lunar(t);
    if (l.leap) continue;
    if (l.m === 4 && l.d === 8) { add(t, '부처님오신날'); cand.push({ e: t, n: '부처님오신날', s: 1 }); }
    else if ((l.m === 1 && l.d === 1) || (l.m === 8 && l.d === 15)) {
      const n = l.m === 1 ? '설날' : '추석', b = [-1, 0, 1].map(i => new Date(t.getTime() + i * DAY));
      b.forEach((x, i) => add(x, i === 1 ? n : n + ' 연휴'));
      cand.push({ e: b[2], n, b });
    }
  }
  Object.keys(HX).forEach(k => { if (+k.slice(0, 4) === y) M[k] = HX[k]; });
  const isWeekend = t => t.getUTCDay() % 6 === 0, nx = t => {
    t = new Date(t.getTime() + DAY);
    while (isWeekend(t) || M[iso(t)]) t = new Date(t.getTime() + DAY);
    return t;
  }, done = {};
  cand.sort((a, b) => a.e - b.e).forEach(c => {
    const k = iso(c.e);
    if (done[k]) return;
    const hit = c.b ? c.b.some(x => x.getUTCDay() === 0 || dup[iso(x)]) : (isWeekend(c.e) || dup[k]);
    if (hit) { done[k] = 1; M[iso(nx(c.e))] = '대체공휴일(' + c.n + ')'; }
  });
  return HC[y] = M;
}
function holiday(k) { return holidaysOf(+k.slice(0, 4))[k] || null; }
function isRed(k) { return new Date(k + 'T12:00:00').getDay() === 0 || !!holiday(k); }
function isSat(k) { return new Date(k + 'T12:00:00').getDay() === 6; }

// 6-1. 음력, 24절기 및 주요 기념일
const LUNAR_CACHE = {};
function lunarOf(k) {
  if (LUNAR_CACHE[k]) return LUNAR_CACHE[k];
  try {
    const [y, m, d] = k.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const o = {};
    new Intl.DateTimeFormat('en-u-ca-chinese', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })
      .formatToParts(t)
      .forEach(x => { o[x.type] = x.value; });
    const lm = parseInt(o.month);
    const isLeap = /\D/.test(o.month);
    const ld = +o.day;
    const res = { m: lm, d: ld, leap: isLeap, text: (isLeap ? '윤' : '') + lm + '.' + ld, full: '음 ' + (isLeap ? '윤' : '') + lm + '월 ' + ld + '일' };
    return LUNAR_CACHE[k] = res;
  } catch (e) {
    return { m: 1, d: 1, leap: false, text: '', full: '' };
  }
}

const SOLAR_TERMS_C = [
  { n: '소한', m: 1, c: 5.4055 }, { n: '대한', m: 1, c: 20.12 },
  { n: '입춘', m: 2, c: 3.87 },   { n: '우수', m: 2, c: 18.73 },
  { n: '경칩', m: 3, c: 5.63 },   { n: '춘분', m: 3, c: 20.646 },
  { n: '청명', m: 4, c: 4.81 },   { n: '곡우', m: 4, c: 20.1 },
  { n: '입하', m: 5, c: 5.52 },   { n: '소만', m: 5, c: 21.04 },
  { n: '망종', m: 6, c: 5.678 },  { n: '하지', m: 6, c: 21.37 },
  { n: '소서', m: 7, c: 7.108 },  { n: '대서', m: 7, c: 22.83 },
  { n: '입추', m: 8, c: 7.5 },    { n: '처서', m: 8, c: 23.13 },
  { n: '백로', m: 9, c: 7.646 },  { n: '추분', m: 9, c: 23.042 },
  { n: '한로', m: 10, c: 8.318 }, { n: '상강', m: 10, c: 23.438 },
  { n: '입동', m: 11, c: 7.438 }, { n: '소설', m: 11, c: 22.36 },
  { n: '대설', m: 12, c: 7.18 },  { n: '동지', m: 12, c: 21.94 }
];
const TERMS_CACHE = {};
function termsOf(y) {
  if (TERMS_CACHE[y]) return TERMS_CACHE[y];
  const map = {};
  const yDiff = y - 2000;
  SOLAR_TERMS_C.forEach(t => {
    const d = Math.floor(yDiff * 0.2422 + t.c) - Math.floor(yDiff / 4);
    map[y + '-' + pad(t.m) + '-' + pad(d)] = t.n;
  });
  return TERMS_CACHE[y] = map;
}

const SPECIAL_DAYS = {
  '02-14': '밸런타인', '03-14': '화이트데이', '04-05': '식목일', '05-01': '근로자의날',
  '05-08': '어버이날', '05-15': '스승의날', '06-25': '6·25', '07-17': '제헌절',
  '10-01': '국군의날', '10-25': '독도의날', '10-31': '핼러윈', '11-11': '농업인의날', '12-31': '그믐'
};

function dayEvent(k) {
  const h = holiday(k);
  if (h) return { name: h, isHoli: true };
  const md = k.slice(5);
  if (SPECIAL_DAYS[md]) return { name: SPECIAL_DAYS[md], isHoli: false };
  const y = +k.slice(0, 4);
  const term = termsOf(y)[k];
  if (term) return { name: term, isHoli: false };
  const l = lunarOf(k);
  if (!l.leap) {
    if (l.m === 1 && l.d === 15) return { name: '정월대보름', isHoli: false };
    if (l.m === 5 && l.d === 5) return { name: '단오', isHoli: false };
    if (l.m === 7 && l.d === 7) return { name: '칠석', isHoli: false };
  }
  return null;
}

// 7. 실시간 날씨 연동 (wttr.in 초고속 연동 & 로컬 캐싱)
const WX_CACHE_KEY = 'diary.weather.cache';
function loadWeatherCache(){
  try {
    const raw = localStorage.getItem(WX_CACHE_KEY);
    if(raw) return JSON.parse(raw);
  } catch(e){}
  return {};
}
const WX = { lat: 37.5665, lon: 126.9780, data: loadWeatherCache(), state: 'idle' };

function getWttrIcon(code, desc){
  const d = String(desc || '').toLowerCase();
  const c = +code || 113;
  if(c >= 386 || c === 200 || d.includes('thunder')) return '⛈️';
  if(c >= 323 || c >= 227 || d.includes('snow') || d.includes('blizzard') || d.includes('sleet')) return '🌨️';
  if(c >= 263 || c >= 176 || d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return '🌧️';
  if(c === 143 || c === 248 || c === 260 || d.includes('fog') || d.includes('mist')) return '🌫️';
  if(c === 119 || c === 122 || d.includes('overcast') || d.includes('cloudy')) return '☁️';
  if(c === 116 || d.includes('partly')) return '🌤️';
  return '☀️';
}

async function wxLoad() {
  if (WX.state === 'load') return;
  WX.state = 'load';

  let success = false;
  // 1순위: wttr.in (초고속 한국 날씨)
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('https://wttr.in/Seoul?format=j1', { signal: ctrl.signal });
    clearTimeout(tid);
    if (res && res.ok) {
      const j = await res.json();
      if (j && j.weather && Array.isArray(j.weather)) {
        j.weather.forEach(day => {
          const d = day.date;
          const hi = Math.round(+day.maxtempC);
          const lo = Math.round(+day.mintempC);
          const hItem = (day.hourly && (day.hourly[4] || day.hourly[0])) || {};
          const code = hItem.weatherCode;
          const desc = hItem.weatherDesc && hItem.weatherDesc[0] ? hItem.weatherDesc[0].value : '';
          WX.data[d] = {
            icon: getWttrIcon(code, desc),
            hi,
            lo
          };
        });
        success = true;
      }
    }
  } catch(e) {
    console.warn('wttr.in fetch failed:', e);
  }

  // 2순위: open-meteo 폴백
  if (!success) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FSeoul&past_days=3&forecast_days=7`, { signal: ctrl.signal });
      clearTimeout(tid);
      if (r && r.ok) {
        const j = await r.json();
        const WIC = c => c === 0 ? '☀️' : c <= 2 ? '🌤️' : c === 3 ? '☁️' : c <= 48 ? '🌫️' : c <= 57 ? '🌦️' : c <= 67 ? '🌧️' : c <= 77 ? '🌨️' : c <= 82 ? '🌧️' : c <= 86 ? '🌨️' : '⛈️';
        j.daily.time.forEach((d, i) => {
          WX.data[d] = {
            icon: WIC(j.daily.weather_code[i]),
            hi: Math.round(j.daily.temperature_2m_max[i]),
            lo: Math.round(j.daily.temperature_2m_min[i])
          };
        });
        success = true;
      }
    } catch(err) {
      console.warn('open-meteo fallback failed:', err);
    }
  }

  if (success) {
    WX.state = 'ok';
    if (!S.weather) S.weather = {};
    Object.assign(S.weather, WX.data);
    try {
      localStorage.setItem(WX_CACHE_KEY, JSON.stringify(WX.data));
    } catch(e){}
    save();
  } else {
    WX.state = (Object.keys(WX.data).length || Object.keys(S.weather || {}).length) ? 'ok' : 'fail';
  }

  if (typeof render === 'function' && !T && !R) render();
}

function wxS(k) {
  const w = (S.weather && S.weather[k]) || WX.data[k];
  return w ? `${w.icon} ${w.hi}°/${w.lo}°` : '';
}
const wxT = k => wxS(k) ? ' · ' + wxS(k) : '';

// 8. 전역 모달 상태
let T = null;
let R = null;
let DY = false, GS = false, GE = null;
A.ovx = () => { if (typeof closeSheet === 'function') closeSheet(); };
