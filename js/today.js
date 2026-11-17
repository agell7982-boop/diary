/* js/today.js - [오늘/일정] 탭 화면 및 시트 */

/* 1. 1주일 달력 렌더링 */
function weekDays(){
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  t.setDate(t.getDate() - t.getDay() + 7 * wk);
  return [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date(t);
    d.setDate(t.getDate() + i);
    return ymd(d);
  });
}

function headHTML(){
  const d = dkey(sel), home = sel === ymd(new Date()) && wk === 0, hn = holiday(sel);
  const hasD = typeof hasDiary === 'function' ? hasDiary(sel) : (S.diary && S.diary[sel] && ((S.diary[sel].title && S.diary[sel].title.trim()) || (S.diary[sel].text && S.diary[sel].text.trim()) || (S.diary[sel].photos && S.diary[sel].photos.length > 0)));
  return `<div class="hd"><div><p class="mu${isRed(sel)?' hl':isSat(sel)?' bl':''}" style="margin:0">${WD[d.getDay()]}요일${hn?' · '+hn:''}${wxT(sel)}</p><div style="display:flex;align-items:center"><h1 style="margin:0">${d.getMonth()+1}월 ${d.getDate()}일</h1>${hasD ? '<button class="today-diary-badge" data-a="gorec" title="이 날 작성된 일기 읽기">📝 일기 작성됨</button>' : ''}</div></div><div>${home?'':'<button class="tx" data-a="today">오늘</button>'}<button class="nv" data-a="wk" data-n="-1" aria-label="지난주">‹</button><button class="nv" data-a="wk" data-n="1" aria-label="다음주">›</button></div></div>`;
}

function weekHTML(){
  const td = ymd(new Date());
  return `<div class="wk">${weekDays().map((k, i) => {
    const hasD = typeof hasDiary === 'function' ? hasDiary(k) : (S.diary && S.diary[k] && ((S.diary[k].title && S.diary[k].title.trim()) || (S.diary[k].text && S.diary[k].text.trim()) || (S.diary[k].photos && S.diary[k].photos.length > 0)));
    return `<button class="d${k===sel?' a':''}${k===td?' t':''}${isRed(k)?' h':!isRed(k)&&isSat(k)?' b':''}" data-a="pick" data-d="${k}" aria-label="${k}"><span class="mu${i===0?' hl':i===6?' bl':''}">${'일월화수목금토'[i]}</span><b>${+k.slice(8)}${hasD ? '<span class="cal-diary-icon">📝</span>' : ''}</b><span class="dt">${dotsFor(k)}</span></button>`;
  }).join('')}</div>`;
}

A.pick = d => { sel = d.d; render(); };
A.wk = d => { wk += +d.n; sel = shift(sel, 7 * +d.n); render(); };
A.today = () => { sel = ymd(new Date()); wk = 0; render(); };

/* 2. 일정 목록 */
function listHTML(){ return itemsListHTML() + repListHTML(); }

function itemsListHTML(){
  const it = itemsOn(sel);
  if (!it.length) return '<p class="mu" style="margin-top:24px">' + (tab === '일정' ? '이 날은 비어 있어요. 아래에 적어 보세요.' : '이 날은 비어 있어요.') + '</p>';
  return it.map(i => `<div class="r"><button class="ck${i.done?' dn':''}" role="checkbox" aria-checked="${i.done}" aria-label="완료 표시" data-a="done" data-id="${i.id}"></button><button class="rb" data-a="open" data-id="${i.id}"><span class="mu tm">${fmtTime(i.time)}</span><span class="ti${i.done?' dd':''}">${esc(i.title)}</span><span class="mu">${i.detail?'메모 ':''}${i.alarm!==null?'⏰ ':''}</span></button><button class="rd" data-a="rm" data-id="${i.id}" aria-label="삭제">삭제</button></div>`).join('');
}

A.done = d => { const i = S.items.find(x => x.id === d.id); updItem(d.id, { done: !i.done }); render(); };
A.open = d => openSheet(d.id);
function removeWithUndo(id){
  const i = S.items.find(x => x.id === id);
  if (!i) return;
  const k = S.items.indexOf(i);
  delItem(id);
  render();
  toast('삭제했어요', '되돌리기', () => {
    S.items.splice(Math.min(k, S.items.length), 0, i);
    save();
    render();
  });
}
A.rm = d => removeWithUndo(d.id);

/* 3. 하단 입력줄 */
function barHTML(){
  return `<div class="ib"><input id="ti" placeholder="일정을 적어요" value="${esc(DR.title)}" aria-label="일정 입력" enterkeyhint="done"><button class="cb" data-a="dt">${DR.time?fmtTime(DR.time):'시간'}</button><button class="cb" data-a="rp">반복</button><button class="ad" data-a="new" aria-label="자세히 쓰기로 추가">+</button></div>`;
}
A.dt = () => openSheet(null, 'time');
A.new = () => openSheet(null, 'new');
A.add = () => {
  const t = DR.title.trim();
  if (!t) { const e = document.getElementById('ti'); if (e) e.focus(); return; }
  addItem({ date: sel, title: t, time: DR.time, alarm: DR.alarm });
  DR = { title: '', time: null, alarm: null };
  render();
};
document.addEventListener('input', e => { if (e.target.id === 'ti') DR.title = e.target.value; });
document.addEventListener('keydown', e => { if (e.target.id === 'ti' && e.key === 'Enter') A.add(); });

/* 4. 시간·알람 설정 시트 */
function openSheet(id, mode){
  const i = id && S.items.find(x => x.id === id);
  T = {
    id: id || null,
    full: !!(i || mode === 'new'),
    title: i ? i.title : (mode === 'new' ? DR.title : ''),
    detail: i ? (i.detail || '') : '',
    time: i ? i.time : DR.time,
    alarm: i ? i.alarm : DR.alarm,
    msg: ''
  };
  try {
    history.pushState({ overlay: 'sheet' }, '');
  } catch(e) {}
  drawSheet();
}

function closeSheet(){
  const back = DY && (T || R);
  T = null;
  R = null;
  if (SH) SH.innerHTML = '';
  if (back && typeof drawDay === 'function') drawDay();
  else { DY = false; GS = false; GE = null; }
}

function wheelPickerHTML(){
  const t = T ? T.time : null;
  const curH = t ? +t.slice(0, 2) : 9;
  const curM = t ? +t.slice(3) : 0;
  
  let hList = [];
  if (S.fmt12) {
    hList = [...Array(12).keys()].map(k => k + 1);
  } else {
    hList = [...Array(24).keys()];
  }
  const mList = [...Array(60).keys()];

  const dispH = S.fmt12 ? (curH % 12 || 12) : curH;
  const isPm = S.fmt12 && curH >= 12;

  return `
    <div class="time-input-box">
      ${S.fmt12 ? `<button type="button" class="ch" id="btn-ampm" style="padding:4px 10px;font-size:13px;font-weight:600">${isPm?'오후':'오전'}</button>` : ''}
      <input type="text" id="time-h-in" inputmode="numeric" maxlength="2" value="${t !== null ? pad(dispH) : ''}" placeholder="${pad(dispH)}" aria-label="시 직접 입력">
      <span class="time-colon">:</span>
      <input type="text" id="time-m-in" inputmode="numeric" maxlength="2" value="${t !== null ? pad(curM) : ''}" placeholder="${pad(curM)}" aria-label="분 직접 입력">
      <button type="button" class="ch${t===null?' on':''}" id="btn-allday" style="font-size:12px;padding:4px 8px;margin-left:6px">${t===null?'종일 일정':'시간 해제'}</button>
    </div>
    <div class="wheel-picker-wrap">
      <div class="wheel-highlight"></div>
      <div class="wheel-col" id="wheel-h" aria-label="시 선택">
        ${hList.map(h => `<div class="wheel-item${h === dispH ? ' active' : ''}" data-val="${h}">${pad(h)}시</div>`).join('')}
      </div>
      <div class="wheel-sep">:</div>
      <div class="wheel-col" id="wheel-m" aria-label="분 선택">
        ${mList.map(m => `<div class="wheel-item${m === curM ? ' active' : ''}" data-val="${m}">${pad(m)}분</div>`).join('')}
      </div>
    </div>
  `;
}

let isWheelSyncing = false;

function initWheelPicker(){
  const wh = document.getElementById('wheel-h');
  const wm = document.getElementById('wheel-m');
  const inH = document.getElementById('time-h-in');
  const inM = document.getElementById('time-m-in');
  const btnAmpm = document.getElementById('btn-ampm');
  const btnAllDay = document.getElementById('btn-allday');
  if (!wh || !wm) return;

  const ITEM_H = 40;
  const t = T ? T.time : null;
  const curH = t ? +t.slice(0, 2) : 9;
  const curM = t ? +t.slice(3) : 0;
  let dispH = S.fmt12 ? (curH % 12 || 12) : curH;
  let isPm = S.fmt12 && curH >= 12;

  const hIdx = S.fmt12 ? (dispH - 1) : dispH;
  wh.scrollTop = Math.max(0, hIdx * ITEM_H);
  wm.scrollTop = Math.max(0, curM * ITEM_H);

  const updateActiveItems = () => {
    if (!T) return;
    const curHIdx = Math.max(0, Math.min(wh.children.length - 1, Math.round(wh.scrollTop / ITEM_H)));
    const curMIdx = Math.max(0, Math.min(wm.children.length - 1, Math.round(wm.scrollTop / ITEM_H)));

    Array.from(wh.children).forEach((el, idx) => el.classList.toggle('active', idx === curHIdx));
    Array.from(wm.children).forEach((el, idx) => el.classList.toggle('active', idx === curMIdx));

    const selH = +wh.children[curHIdx].dataset.val;
    const selM = +wm.children[curMIdx].dataset.val;

    let finalH = selH;
    if (S.fmt12) {
      finalH = (selH % 12) + (isPm ? 12 : 0);
    }
    T.time = pad(finalH) + ':' + pad(selM);
    T.msg = '';

    if (inH && document.activeElement !== inH) inH.value = pad(selH);
    if (inM && document.activeElement !== inM) inM.value = pad(selM);

    const almSel = document.getElementById('q-l');
    if (almSel) almSel.disabled = false;
    if (btnAllDay) {
      btnAllDay.classList.remove('on');
      btnAllDay.textContent = '시간 해제';
    }
  };

  let scrollTimeoutH = null;
  wh.addEventListener('scroll', () => {
    if (isWheelSyncing) return;
    clearTimeout(scrollTimeoutH);
    scrollTimeoutH = setTimeout(updateActiveItems, 50);
  }, { passive: true });

  let scrollTimeoutM = null;
  wm.addEventListener('scroll', () => {
    if (isWheelSyncing) return;
    clearTimeout(scrollTimeoutM);
    scrollTimeoutM = setTimeout(updateActiveItems, 50);
  }, { passive: true });

  wh.addEventListener('click', e => {
    const item = e.target.closest('.wheel-item');
    if (item) {
      const idx = Array.from(wh.children).indexOf(item);
      wh.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    }
  });

  wm.addEventListener('click', e => {
    const item = e.target.closest('.wheel-item');
    if (item) {
      const idx = Array.from(wm.children).indexOf(item);
      wm.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    }
  });

  if (inH) {
    inH.addEventListener('input', () => {
      let val = inH.value.replace(/\D/g, '');
      if (val.length > 2) val = val.slice(-2);
      inH.value = val;
      let hNum = parseInt(val, 10);
      if (!isNaN(hNum)) {
        if (S.fmt12) {
          if (hNum > 12) hNum = 12;
          if (hNum < 1) hNum = 1;
          const idx = hNum - 1;
          isWheelSyncing = true;
          wh.scrollTop = idx * ITEM_H;
          isWheelSyncing = false;
        } else {
          if (hNum > 23) hNum = 23;
          isWheelSyncing = true;
          wh.scrollTop = hNum * ITEM_H;
          isWheelSyncing = false;
        }
        updateActiveItems();
      }
    });
  }

  if (inM) {
    inM.addEventListener('input', () => {
      let val = inM.value.replace(/\D/g, '');
      if (val.length > 2) val = val.slice(-2);
      inM.value = val;
      let mNum = parseInt(val, 10);
      if (!isNaN(mNum)) {
        if (mNum > 59) mNum = 59;
        isWheelSyncing = true;
        wm.scrollTop = mNum * ITEM_H;
        isWheelSyncing = false;
        updateActiveItems();
      }
    });
  }

  if (btnAmpm) {
    btnAmpm.addEventListener('click', () => {
      isPm = !isPm;
      btnAmpm.textContent = isPm ? '오후' : '오전';
      updateActiveItems();
    });
  }

  if (btnAllDay) {
    btnAllDay.addEventListener('click', () => {
      if (!T) return;
      if (T.time === null) {
        updateActiveItems();
      } else {
        T.time = null;
        T.alarm = null;
        if (inH) inH.value = '';
        if (inM) inM.value = '';
        btnAllDay.classList.add('on');
        btnAllDay.textContent = '종일 일정';
        const almSel = document.getElementById('q-l');
        if (almSel) { almSel.value = ''; almSel.disabled = true; }
        toast('종일 일정(시간 없음)으로 설정되었어요');
      }
    });
  }
}

function drawSheet(){
  if (!SH) return;
  SH.innerHTML = `<div class="ov" data-a="ovx"><div class="sh" role="dialog" aria-modal="true" aria-label="시간과 알람">`
    + (T.full ? `${S.reps.length?'<p class="mu" style="margin:0 0 4px">반복 틀</p><div class="rw" style="flex-wrap:wrap">'+S.reps.map(r=>`<button class="ch" data-a="tpl" data-id="${r.id}">${esc(r.title)}</button>`).join('')+'</div>':''}<label class="mu" for="q-t">제목</label><input id="q-t" class="in" value="${esc(T.title)}"><label class="mu" for="q-d">자세히 쓰기</label><textarea id="q-d" class="in" rows="5" placeholder="이 일정에 대해 자유롭게 적어 보세요">${esc(T.detail)}</textarea>` : '')
    + `<label class="mu">시간 설정 (직접 쓰거나 위아래로 드래그)</label>`
    + wheelPickerHTML()
    + `<div class="rw" style="margin-bottom:8px"><button class="ch" data-a="fmt">${S.fmt12?'오전·오후 표기':'24시간 표기'}</button></div>`
    + `<label class="mu" for="q-l">알람</label><select id="q-l" class="in"${T.time?'':' disabled'}>${ALARMS.map(([v, l]) => `<option value="${v===null?'':v}"${T.alarm===v?' selected':''}>${l}</option>`).join('')}</select>`
    + `<p class="mu" style="margin:4px 0 8px">설정한 시간에 소리와 알림창으로 알려드려요.</p>`
    + `<div class="rw">${T.id?'<button class="ch" style="color:var(--no)" data-a="del">삭제</button>':''}<button class="ch pr" data-a="ok">완료</button></div></div></div>`;

  requestAnimationFrame(() => {
    initWheelPicker();
  });
}

if (SH) {
  SH.addEventListener('change', e => {
    if (!T) return;
    const i = e.target.id;
    if (i === 'q-l') T.alarm = e.target.value === '' ? null : +e.target.value;
    else if (i === 'q-t') T.title = e.target.value;
    else if (i === 'q-d') T.detail = e.target.value;
  });

  SH.addEventListener('input', e => {
    if (!T) return;
    if (e.target.id === 'q-d') T.detail = e.target.value;
    if (e.target.id === 'q-t') T.title = e.target.value;
  });

  SH.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'ovx') { if (e.target === b) closeSheet(); return; }
    if (A[b.dataset.a]) A[b.dataset.a](b.dataset);
  });
}

A.fmt = () => { S.fmt12 = !S.fmt12; save(); drawSheet(); render(); };
A.ok = () => {
  if (!T) return;
  if (T.alarm !== null) {
    if (typeof requestAlarmPermission === 'function') requestAlarmPermission();
    else if ("Notification" in window && Notification.permission === 'default') Notification.requestPermission();
  }
  if (T.id) {
    const o = S.items.find(x => x.id === T.id);
    updItem(T.id, { title: T.title.trim() || o.title, detail: T.detail, time: T.time, alarm: T.alarm });
  } else if (T.full) {
    const t = T.title.trim();
    if (!t) { T.msg = '제목을 적어 주세요.'; drawSheet(); return; }
    addItem({ date: sel, title: t, detail: T.detail, time: T.time, alarm: T.alarm });
    DR = { title: '', time: null, alarm: null };
  } else {
    DR.time = T.time;
    DR.alarm = T.alarm;
  }
  closeSheet();
  render();
};
A.del = () => { const id = T.id; closeSheet(); removeWithUndo(id); };
