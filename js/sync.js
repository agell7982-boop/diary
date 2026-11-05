/* js/sync.js - Firebase 클라우드 백업 및 동기화 */
/* sync.js: Firebase 로그인 & 클라우드 동기화 (스크롤 튐 방지 및 쿨다운 적용) */
const FBC = {
  apiKey: "AIzaSyCTjGJN87POXA6NPkLlyFRt7s2Fkfmrbq4",
  authDomain: "my-diary-449a0.firebaseapp.com",
  projectId: "my-diary-449a0",
  storageBucket: "my-diary-449a0.firebasestorage.app",
  messagingSenderId: "571869487303",
  appId: "1:571869487303:web:1ae31d5c2df9ca1be1dee2"
};

const SY = { ready: false, user: null, st: 'off', msg: '', busy: false, again: false, t: null, meta: { last: {}, u: {}, ph: {} } };
const SYMSG = { ok: '동기화됨', push: '올리는 중…', pull: '불러오는 중…', err: '동기화 오류', off: '' };
const SYERR = {
  'auth/invalid-credential': '이메일이나 비밀번호가 달라요.',
  'auth/wrong-password': '이메일이나 비밀번호가 달라요.',
  'auth/user-not-found': '가입되지 않은 이메일이에요. [회원가입]을 먼저 눌러주세요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. [로그인]을 진행해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
  'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔어요.',
  'auth/unauthorized-domain': '이 주소가 Firebase 승인된 도메인에 없어요.',
  'auth/network-request-failed': '인터넷 연결을 확인해 주세요.',
  'auth/too-many-requests': '시도가 많아요. 잠시 후 다시 해 주세요.'
};

const jst = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const clone = o => JSON.parse(JSON.stringify(o));
function h53(s) {
  let a = 0xdeadbeef, b = 0x41c6ce57;
  for (let i = 0, c; i < s.length; i++) {
    c = s.charCodeAt(i);
    a = Math.imul(a ^ c, 2654435761);
    b = Math.imul(b ^ c, 1597334677);
  }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return 4294967296 * (2097151 & b) + (a >>> 0);
}
const pid = d => 'p' + h53(d).toString(36);
const syBase = () => SY.db.collection('users').doc(SY.user.uid);
const syScript = src => new Promise((ok, no) => {
  const s = document.createElement('script');
  s.src = src;
  s.onload = ok;
  s.onerror = no;
  document.head.appendChild(s);
});

async function syInit() {
  try {
    const b = 'https://www.gstatic.com/firebasejs/10.12.2/';
    await syScript(b + 'firebase-app-compat.js');
    await syScript(b + 'firebase-auth-compat.js');
    await syScript(b + 'firebase-firestore-compat.js');
    firebase.initializeApp(FBC);
    SY.auth = firebase.auth();
    SY.db = firebase.firestore();
    SY.ready = true;
    SY.auth.onAuthStateChanged(syAuthChanged);
  } catch (e) {
    SY.st = 'nosdk';
  }
  syUi();
}

// 설정 탭에서 상태 텍스트만 업데이트하여 전체 리렌더링으로 인한 화면 튐 방지
const syUi = () => {
  const el = document.getElementById('sy-status-text');
  if (el) {
    el.textContent = (SYMSG[SY.st] || '') + (SY.msg ? ' · ' + SY.msg : '');
  } else if (tab === '설정' && !T && !R) {
    render();
  }
};

// 동기화 주기를 3.5초로 완화하여 잦은 깜빡임 완화
function syKick() {
  if (!SY.user) return;
  if (SY.busy) { SY.again = true; return; }
  clearTimeout(SY.t);
  SY.t = setTimeout(syCycle, 3500);
}
const syCycle = async () => { await syPull(); await syPush(); };
const syMetaKey = () => 'diary.sync.' + SY.user.uid;
function syMetaLoad() {
  let m = null;
  try { m = JSON.parse(localStorage.getItem(syMetaKey())); } catch (e) {}
  SY.meta = Object.assign({ last: {}, u: {}, ph: {} }, m);
}
function syMetaSave() {
  try { localStorage.setItem(syMetaKey(), JSON.stringify(SY.meta)); } catch (e) {}
}

function splitS() {
  const photos = {}, months = {}, ym = d => String(d).slice(0, 7);
  const get = k => months[k] || (months[k] = { items: [], diary: {}, moods: {}, goals: [], rdone: {}, skip: {} });
  S.items.forEach(i => { const { photos: _, ...r } = i; get(ym(i.date)).items.push(r); });
  Object.entries(S.diary).forEach(([d, e]) => {
    const ids = (e.photos || []).map(p => { const id = pid(p); photos[id] = p; return id; });
    if (e.text || e.title || ids.length) get(ym(d)).diary[d] = { title: e.title || '', text: e.text || '', photos: ids };
  });
  Object.entries(S.moods).forEach(([d, m]) => { get(ym(d)).moods[d] = m; });
  Object.entries(S.goalsM).forEach(([k, g]) => { if (g.length) get(k).goals = g; });
  ['rdone', 'skip'].forEach(f => Object.keys(S[f]).forEach(k => { get(ym(k))[f][k] = 1; }));
  return { meta: clone({ reps: S.reps, cfg: S.cfg, fmt12: S.fmt12 }), months: clone(months), photos };
}
const emptyDoc = r => !(r.items || []).length && !Object.keys(r.diary || {}).length && !Object.keys(r.moods || {}).length && !(r.goals || []).length && !Object.keys(r.rdone || {}).length && !Object.keys(r.skip || {}).length;
const mstrip = r => { const { u, ...x } = r; return clone(x); };
const emptyLocal = () => !S.items.length && !S.reps.length && !Object.keys(S.diary).length && !Object.keys(S.goalsM).length && !Object.keys(S.moods).length;

async function syPush() {
  if (!SY.user || SY.busy) return;
  SY.busy = true; SY.st = 'push'; syUi(); let merged = false;
  try {
    const base = syBase(), M = SY.meta, { meta, photos } = splitS();
    let months = splitS().months;
    const t = Date.now();
    for (const [id, data] of Object.entries(photos)) {
      if (!M.ph[id]) { await base.collection('photos').doc(id).set({ data, t }); M.ph[id] = 1; }
    }
    for (const ym of Object.keys(months)) {
      let doc = months[ym], j = jst(doc);
      if (M.last[ym] === j) continue;
      const rd = await base.collection('months').doc(ym).get();
      if (rd.exists && (rd.data().u || 0) > (M.u[ym] || 0)) {
        const pho = {};
        Object.values(S.diary).forEach(e => (e.photos || []).forEach(p => { pho[pid(p)] = p; }));
        await applyMonth(ym, rd.data(), pho, true);
        merged = true;
        months = splitS().months;
        doc = months[ym];
        j = jst(doc);
      }
      await base.collection('months').doc(ym).set(Object.assign({}, doc, { u: t }));
      M.last[ym] = j;
      M.u[ym] = t;
    }
    for (const ym of Object.keys(M.last)) {
      if (ym !== '_meta' && !months[ym]) {
        await base.collection('months').doc(ym).set({ items: [], diary: {}, moods: {}, goals: [], rdone: {}, skip: {}, u: t });
        delete M.last[ym];
        M.u[ym] = t;
      }
    }
    const mj = jst(meta);
    if (M.last._meta !== mj) {
      await base.collection('meta').doc('main').set(Object.assign({}, meta, { u: t }));
      M.last._meta = mj;
      M.u._meta = t;
    }
    syMetaSave();
    SY.st = 'ok';
    SY.msg = '';
  } catch (e) {
    SY.st = 'err';
    SY.msg = e.code || e.message;
  }
  if (merged) {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (!T && !R) render();
  }
  SY.busy = false;
  syUi();
  if (SY.again) { SY.again = false; syKick(); }
}

async function applyMonth(ym, r, pho, union) {
  const inM = k => String(k).startsWith(ym), rd = r.diary || {};
  const need = new Set();
  Object.values(rd).forEach(e => (e.photos || []).forEach(id => { if (!pho[id]) need.add(id); }));
  for (const id of need) {
    const p = await syBase().collection('photos').doc(id).get();
    if (p.exists) pho[id] = p.data().data;
  }
  if (!union) {
    S.items = S.items.filter(i => !inM(i.date)).concat(r.items || []);
    Object.keys(S.diary).filter(inM).forEach(k => delete S.diary[k]);
    Object.keys(S.moods).filter(inM).forEach(k => delete S.moods[k]);
    S.goalsM[ym] = r.goals || [];
    ['rdone', 'skip'].forEach(f => {
      Object.keys(S[f]).filter(inM).forEach(k => delete S[f][k]);
      Object.assign(S[f], r[f] || {});
    });
  } else {
    const ids = new Set(S.items.map(i => i.id));
    (r.items || []).forEach(i => { if (!ids.has(i.id)) S.items.push(i); });
    const gl = S.goalsM[ym] || [], gi = new Set(gl.map(g => g.id));
    (r.goals || []).forEach(g => { if (!gi.has(g.id)) gl.push(g); });
    S.goalsM[ym] = gl;
    ['rdone', 'skip'].forEach(f => Object.assign(S[f], Object.assign({}, r[f] || {}, S[f])));
  }
  for (const [d, e] of Object.entries(rd)) {
    const ph = (e.photos || []).map(id => pho[id]).filter(Boolean);
    if (!union || !S.diary[d]) S.diary[d] = { title: e.title || '', text: e.text || '', photos: ph };
    else {
      const l = S.diary[d];
      if (!l.text) l.text = e.text || '';
      if (!l.title) l.title = e.title || '';
      l.photos = l.photos || [];
      const have = new Set(l.photos.map(pid));
      ph.forEach(p => { if (!have.has(pid(p))) l.photos.push(p); });
    }
  }
  Object.entries(r.moods || {}).forEach(([d, m]) => { if (!union || !S.moods[d]) S.moods[d] = m; });
}

async function syPull() {
  if (!SY.user || SY.busy) return;
  SY.busy = true; SY.st = 'pull'; syUi(); let changed = false;
  try {
    const base = syBase(), M = SY.meta, [ms, mt] = await Promise.all([base.collection('months').get(), base.collection('meta').doc('main').get()]);
    const local = splitS().months, pho = {}, wasEmpty = emptyLocal();
    Object.values(S.diary).forEach(e => (e.photos || []).forEach(p => { pho[pid(p)] = p; }));
    for (const d of ms.docs) {
      const ym = d.id, r = d.data();
      if (emptyDoc(r) && !local[ym]) continue;
      const lj = local[ym] ? jst(local[ym]) : null, was = M.last[ym], remoteNew = (r.u || 0) > (M.u[ym] || 0);
      if (was !== undefined && !remoteNew) continue;
      await applyMonth(ym, r, pho, was === undefined ? !local[ym] : lj !== was);
      changed = true;
      M.last[ym] = jst(mstrip(r));
      M.u[ym] = r.u || 0;
    }
    if (mt.exists) {
      const rm = mt.data(), cur = jst(splitS().meta), was = M.last._meta;
      if (was !== undefined && cur === was) {
        if ((rm.u || 0) > (M.u._meta || 0)) {
          S.reps = rm.reps || []; S.cfg = Object.assign({ lock: true }, rm.cfg); S.fmt12 = !rm.fmt12; changed = true;
        }
      } else if (wasEmpty) {
        S.reps = rm.reps || []; S.cfg = Object.assign({ lock: true }, rm.cfg); S.fmt12 = !rm.fmt12; changed = true;
      } else {
        const ri = new Set(S.reps.map(x => x.id));
        (rm.reps || []).forEach(x => { if (!ri.has(x.id)) S.reps.push(x); });
        changed = true;
      }
      M.last._meta = jst(mstrip(rm));
      M.u._meta = rm.u || 0;
    }
    if (changed) { SY.busy = false; save(); SY.busy = true; applyCfg(); }
    syMetaSave();
    SY.st = 'ok';
    SY.msg = '';
  } catch (e) {
    SY.st = 'err';
    SY.msg = e.code || e.message;
  }
  SY.busy = false;
  syUi();
  if (changed && !T && !R) render();
}

async function syAuthChanged(u) {
  SY.user = u;
  SY.msg = '';
  if (u) {
    let o = null;
    try { o = localStorage.getItem('diary.owner'); } catch (e) {}
    if (o && o !== u.uid) {
      if (!confirm('이 기기에는 다른 계정의 데이터가 있어요. 새 계정으로 바꾸면 이 기기의 기존 데이터를 지우고 새 계정 데이터를 불러와요. 계속할까요?')) {
        SY.user = null;
        await SY.auth.signOut();
        return;
      }
      Object.assign(S, { items: [], goals: [], goalsM: {}, moods: {}, reps: [], skip: {}, rdone: {}, diary: {} });
      SY.user = null;
      save();
      SY.user = u;
    }
    try { localStorage.setItem('diary.owner', u.uid); } catch (e) {}
    syMetaLoad();
    await syPull();
    await syPush();
    toast('클라우드 동기화가 연결되었어요 ✨');
  } else {
    SY.st = 'off';
  }
  if (!T && !R) render();
}

function syErr(e) {
  SY.msg = SYERR[e.code] || e.message || '오류가 발생했어요.';
  toast(SY.msg);
  syUi();
}

function accCardHTML() {
  const u = SY.user;
  if (!SY.ready) {
    return `<p class="mu" style="margin:4px 0">${SY.st === 'nosdk' ? '로그인 모듈을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.' : '클라우드 모듈 준비 중…'}</p>`;
  }
  if (u) {
    return `<div class="set-row">
      <div>
        <div style="font-size:14px;font-weight:500">${esc(u.email || '')}</div>
        <div class="mu" style="font-size:12px">동기화 연동됨</div>
      </div>
      <div class="rw" style="gap:6px">
        <button class="ch on" data-a="sysync">동기화</button>
        <button class="ch" data-a="syout">로그아웃</button>
      </div>
    </div>`;
  }

  // 모바일 APK 환경
  if (isNativeApp()) {
    return `<div style="background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:12px 14px;margin:4px 0 8px">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:var(--tx)">📱 앱 계정 로그인 / 가입</div>
      <p class="mu" style="font-size:12px;line-height:1.45;margin:0 0 10px">
        구글 Gmail 등 사용하시는 이메일과 비밀번호로 로그인해 주세요. (웹과 앱 간 100% 동일하게 실시간 동기화됩니다)
      </p>
      <input id="sy-e" class="in" type="email" placeholder="이메일 주소 (예: user@gmail.com)" autocomplete="email" aria-label="이메일" style="margin-bottom:6px">
      <input id="sy-p" class="in" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password" aria-label="비밀번호" style="margin-bottom:8px">
      ${SY.msg ? `<p class="mu" style="margin:0 0 8px;font-size:12px;color:var(--no,#d9534f)">${esc(SY.msg)}</p>` : ''}
      <div class="rw" style="gap:6px">
        <button class="ch on" style="flex:1" data-a="syin">로그인</button>
        <button class="ch" style="flex:1" data-a="syup">회원가입</button>
      </div>
      <div style="text-align:right;margin-top:8px">
        <button class="tx mu" style="font-size:12px" data-a="sypwreset">비밀번호 재설정 메일 발송</button>
      </div>
    </div>`;
  }

  // 웹 브라우저 환경
  return `<button class="ch on" data-a="sygoogle" style="width:100%;margin:4px 0 8px">Google로 간편 로그인</button>
  <button class="set-tog-btn" style="margin:4px 0" data-a="emailtog">${EMAIL_LOGIN_OPEN ? '▲ 이메일 로그인 닫기' : '▼ 이메일로 로그인 / 회원가입'}</button>
  ${EMAIL_LOGIN_OPEN ? `
    <div style="margin-top:8px">
      <input id="sy-e" class="in" type="email" placeholder="이메일 주소" autocomplete="email" aria-label="이메일">
      <input id="sy-p" class="in" type="password" placeholder="비밀번호 (6자 이상)" autocomplete="current-password" aria-label="비밀번호" style="margin-top:4px">
      <p class="mu" style="margin:4px 0 8px;font-size:12px;color:var(--no,#d9534f)">${esc(SY.msg || '')}</p>
      <div class="rw" style="gap:6px">
        <button class="ch on" style="flex:1" data-a="syin">로그인</button>
        <button class="ch" style="flex:1" data-a="syup">회원가입</button>
      </div>
      <div style="text-align:right;margin-top:6px">
        <button class="tx mu" style="font-size:12px" data-a="sypwreset">비밀번호 재설정 메일 발송</button>
      </div>
    </div>
  ` : ''}`;
}

A.sygoogle = async () => {
  if (isNativeApp()) {
    toast('앱에서는 외부 브라우저 튕김 방지를 위해 아래 이메일 로그인을 이용해 주세요.');
    const el = $('sy-e');
    if (el) el.focus();
    return;
  }
  const p = new firebase.auth.GoogleAuthProvider();
  try {
    await SY.auth.signInWithPopup(p);
  } catch (e) {
    if (['auth/popup-blocked'].includes(e.code)) {
      SY.auth.signInWithRedirect(p);
      return;
    }
    syErr(e);
  }
};

const syMail = async f => {
  const e = ($('sy-e')?.value || '').trim(), p = $('sy-p')?.value || '';
  if (!e || !p) {
    syErr({ message: '이메일과 비밀번호를 적어 주세요.' });
    return;
  }
  try {
    await SY.auth[f](e, p);
  } catch (x) {
    syErr(x);
  }
};

A.syin = () => syMail('signInWithEmailAndPassword');
A.syup = () => syMail('createUserWithEmailAndPassword');
A.sypwreset = async () => {
  const el = $('sy-e');
  const e = (el ? el.value : '').trim();
  if (!e) {
    toast('비밀번호를 재설정할 이메일 주소를 입력해 주세요.');
    if (el) el.focus();
    return;
  }
  try {
    await SY.auth.sendPasswordResetEmail(e);
    toast('비밀번호 재설정 메일을 보냈어요. 메일함을 확인해 주세요!');
  } catch (x) {
    syErr(x);
  }
};
A.syout = async () => { await SY.auth.signOut(); };
A.sysync = async () => { await syPull(); await syPush(); };

// 모바일 화면 전환 쿨다운 (최소 60초 간격)
let lastVisSync = 0;
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && SY.user && (Date.now() - lastVisSync > 60000)) {
    lastVisSync = Date.now();
    syPull().then(syPush);
  }
});

document.addEventListener('keydown', e => {
  if ((e.target.id === 'sy-e' || e.target.id === 'sy-p') && e.key === 'Enter') {
    A.syin();
  }
});
