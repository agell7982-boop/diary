/* js/alarm.js - 알람 체크 루프, 알림 모달 및 스케줄러 */
const ALARM_CHANNEL_ID = 'diary_loud_alarm_v3';

function showAlarmModal(title,sub,detail){
  const exist=document.getElementById('alarm-dialog');
  if(exist){ if(typeof exist.remove==='function') exist.remove(); else if(exist.parentNode) exist.parentNode.removeChild(exist); }
  const div=document.createElement('div');
  div.id='alarm-dialog';
  div.className='ov';
  div.style.zIndex='40';
  div.innerHTML=`<div class="sh" style="padding:24px 20px;text-align:center">
    <img src="icon-192.png" alt="알람 아이콘" style="width:64px;height:64px;border-radius:16px;margin:0 auto 10px;display:block;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.12));">
    <b style="font-size:18px;display:block;margin-bottom:4px">${esc(title)}</b>
    <p class="mu" style="margin:4px 0 12px">${esc(sub)}</p>
    ${detail?`<div style="background:var(--bg);border:1px solid var(--bd);padding:10px 14px;border-radius:12px;font-size:14px;margin:8px 0 16px;text-align:left;white-space:pre-wrap;">${esc(detail)}</div>`:''}
    <button class="ch pr" style="width:100%;margin-top:10px" id="alarm-ok-btn">확인</button>
  </div>`;
  document.body.appendChild(div);
  const btnOk = div.querySelector('#alarm-ok-btn');
  if (btnOk) {
    btnOk.onclick = () => {
      div.remove();
      stopAlarmSound();
    };
  }
}

function showDailyRoutineModal(title, msg, time){
  const exist=document.getElementById('alarm-dialog');
  if(exist){ if(typeof exist.remove==='function') exist.remove(); else if(exist.parentNode) exist.parentNode.removeChild(exist); }
  const div=document.createElement('div');
  div.id='alarm-dialog';
  div.className='ov';
  div.style.zIndex='40';
  div.innerHTML=`<div class="sh" style="padding:24px 20px;text-align:center">
    <div style="font-size:48px;line-height:1;margin:0 auto 10px">📋</div>
    <b style="font-size:18px;display:block;margin-bottom:4px">${esc(title)}</b>
    <p class="mu" style="margin:4px 0 12px">매일 ${fmtTime(time)} 정기 알림</p>
    <div style="background:var(--bg);border:1px solid var(--bd);padding:14px 16px;border-radius:14px;font-size:14px;line-height:1.5;margin:8px 0 16px;text-align:left;white-space:pre-wrap;font-weight:500;">${esc(msg)}</div>
    <div class="rw" style="gap:8px">
      <button class="ch pr" style="flex:1" id="daily-goto-today">오늘 일정 보러가기 📝</button>
      <button class="ch" id="alarm-ok-btn">닫기</button>
    </div>
  </div>`;
  document.body.appendChild(div);
  const btnGoto = div.querySelector('#daily-goto-today');
  if (btnGoto) {
    btnGoto.onclick = () => {
      div.remove();
      stopAlarmSound();
      if (typeof A.tab === 'function') {
        A.tab({ t: '일정' });
      }
    };
  }
  const btnOk2 = div.querySelector('#alarm-ok-btn');
  if (btnOk2) {
    btnOk2.onclick = () => {
      div.remove();
      stopAlarmSound();
    };
  }
}

function triggerAlarm(item, isRep){
  playAlarmSound(S.cfg.alarmSound||'chime');
  const offsetStr=item.alarm===0?'정시':item.alarm+'분 전';
  const label=isRep?'반복 일정':'일정';
  const subText=`${item.date} ${fmtTime(item.time)} ${label} (${offsetStr})`;
  const bodyText=subText+(item.detail?' · '+item.detail:'');

  if("Notification" in window && Notification.permission==='granted'){
    const notiOpts={
      body:bodyText,
      icon:'icon-192.png',
      badge:'favicon.png',
      tag:`diary_alarm_${item.id||uid()}_${Date.now()}`,
      vibrate:[500,200,500,200,500],
      requireInteraction:true,
      data:{url:'./index.html'}
    };
    if(window.SW_REG && window.SW_REG.showNotification){
      window.SW_REG.showNotification(`[다이어리 ${isRep?'반복 ':''}알람] ${item.title}`, notiOpts).catch(()=>{
        try{new Notification(`[다이어리 ${isRep?'반복 ':''}알람] ${item.title}`, notiOpts);}catch(e){}
      });
    }else{
      try{new Notification(`[다이어리 ${isRep?'반복 ':''}알람] ${item.title}`, notiOpts);}catch(e){}
    }
  }
  showAlarmModal(item.title,subText,item.detail);
}

function triggerDailyRoutineAlarm(dr){
  playAlarmSound(S.cfg.alarmSound||'chime');
  const title=dr.title||'하루 일정 조절 알림';
  const bodyText=dr.msg||'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝';

  if("Notification" in window && Notification.permission==='granted'){
    const notiOpts={
      body:bodyText,
      icon:'icon-192.png',
      badge:'favicon.png',
      tag:`diary_daily_routine_${Date.now()}`,
      vibrate:[500,200,500,200,500],
      requireInteraction:true,
      data:{url:'./index.html',tab:'일정'}
    };
    if(window.SW_REG && window.SW_REG.showNotification){
      window.SW_REG.showNotification(`[${title}] 📋`, notiOpts).catch(()=>{
        try{new Notification(`[${title}] 📋`, notiOpts);}catch(e){}
      });
    }else{
      try{new Notification(`[${title}] 📋`, notiOpts);}catch(e){}
    }
  }
  showDailyRoutineModal(title, bodyText, dr.time);
}

function checkAlarms(){
  const now=Date.now();
  const fired=getFiredAlarms();

  // 1) 일반 일정 알람
  S.items.forEach(item=>{
    if(!item.time || item.alarm===null || item.done) return;
    const itemDateTime=new Date(`${item.date}T${item.time}:00`).getTime();
    if(isNaN(itemDateTime)) return;

    const triggerTime=itemDateTime - (item.alarm * 60 * 1000);
    const key=`${item.id}_${triggerTime}`;

    if(now >= triggerTime && now < (triggerTime + 300000) && !fired[key]){
      markAlarmFired(key);
      triggerAlarm(item, false);
      updateBgKeepAlive();
    }
  });

  // 2) 반복 일정 알람
  const td=ymd(new Date());
  (S.reps||[]).forEach(r=>{
    if(!r.time || r.alarm===null || r.alarm===undefined) return;
    if(!repOn(r,td)) return;
    if(S.rdone && S.rdone[td+'|'+r.id]) return;
    if(S.skip && S.skip[td+'|'+r.id]) return;

    const repDateTime=new Date(`${td}T${r.time}:00`).getTime();
    if(isNaN(repDateTime)) return;

    const triggerTime=repDateTime - (r.alarm * 60 * 1000);
    const key=`rep_${r.id}_${td}_${triggerTime}`;

    if(now >= triggerTime && now < (triggerTime + 300000) && !fired[key]){
      markAlarmFired(key);
      triggerAlarm({date:td,title:r.title,time:r.time,alarm:r.alarm,detail:r.detail}, true);
      updateBgKeepAlive();
    }
  });

  // 3) 하루 일정 조절 알림 (데일리 루틴 알림)
  const dr=S.cfg && S.cfg.dailyRoutine;
  if(dr && dr.enabled && dr.time){
    const drDateTime=new Date(`${td}T${dr.time}:00`).getTime();
    const key=`daily_routine_${td}_${dr.time}`;
    if(now >= drDateTime && now < (drDateTime + 300000) && !fired[key]){
      markAlarmFired(key);
      triggerDailyRoutineAlarm(dr);
      updateBgKeepAlive();
    }
  }
}

async function requestAlarmPermission(){
  if (isNativeApp() && window.Capacitor && window.Capacitor.isPluginAvailable('LocalNotifications')) {
    try {
      const { LocalNotifications } = window.Capacitor.Plugins;
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('Native permission error:', e);
      return false;
    }
  }
  if ("Notification" in window) {
    if (Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      return p === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return false;
}

async function ensureAlarmChannel(LocalNotifications){
  try{
    // 이전 저음질/기본 채널 삭제 시도
    await LocalNotifications.deleteChannel({ id: 'default' }).catch(()=>{});
    await LocalNotifications.deleteChannel({ id: 'diary_alarm_channel' }).catch(()=>{});

    // 고음질 벨소리 및 진동을 보장하는 고우선순위(IMPORTANCE_HIGH = 5) 알람 채널 등록
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: '다이어리 알람 및 일정 알림',
      description: '일정 및 데일리 루틴 알림 시 소리와 진동으로 알려줍니다.',
      importance: 5,
      visibility: 1,
      sound: 'alarm_bell.wav',
      vibration: true,
      lights: true,
      lightColor: '#4A7BD0'
    });
  }catch(e){
    console.warn('NotificationChannel 설정 경고:', e);
  }
}

// 네이티브 Capacitor 안드로이드 시스템 알람 (앱이 완전히 꺼져 있어도 AlarmManager로 동작)
async function syncNativeAlarms() {
  if (typeof window === 'undefined' || !window.Capacitor || !window.Capacitor.isPluginAvailable('LocalNotifications')) {
    return false;
  }
  const { LocalNotifications } = window.Capacitor.Plugins;
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return false;
    }

    await ensureAlarmChannel(LocalNotifications);

    const pending = await LocalNotifications.getPending();
    if (pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const now = Date.now(), maxFuture = now + 48 * 3600 * 1000, fired = getFiredAlarms();
    const toSchedule = [];

    const makeId = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      return Math.abs(h % 2147483647);
    };

    // 1) 일반 일정
    (S.items || []).forEach(item => {
      if (!item.time || item.alarm === null || item.done) return;
      const itemDateTime = new Date(`${item.date}T${item.time}:00`).getTime();
      if (isNaN(itemDateTime)) return;
      const triggerTime = itemDateTime - (item.alarm * 60 * 1000);
      const key = `${item.id}_${triggerTime}`;

      if (triggerTime > now && triggerTime < maxFuture && !fired[key]) {
        const offsetStr = item.alarm === 0 ? '정시' : item.alarm + '분 전';
        toSchedule.push({
          id: makeId(key),
          title: `[다이어리 알람] ${item.title}`,
          body: `${item.date} ${fmtTime(item.time)} 일정 (${offsetStr})${item.detail ? ' · ' + item.detail : ''}`,
          schedule: { at: new Date(triggerTime), allowWhileIdle: true },
          channelId: ALARM_CHANNEL_ID,
          sound: 'alarm_bell.wav',
          foreground: true,
          extra: { key }
        });
      }
    });

    // 2) 반복 일정
    [ymd(new Date()), ymd(new Date(now + 864e5))].forEach(td => {
      (S.reps || []).forEach(r => {
        if (!r.time || r.alarm === null || r.alarm === undefined) return;
        if (!repOn(r, td)) return;
        if (S.rdone && S.rdone[td + '|' + r.id]) return;
        if (S.skip && S.skip[td + '|' + r.id]) return;

        const repDateTime = new Date(`${td}T${r.time}:00`).getTime();
        if (isNaN(repDateTime)) return;
        const triggerTime = repDateTime - (r.alarm * 60 * 1000);
        const key = `rep_${r.id}_${td}_${triggerTime}`;

        if (triggerTime > now && triggerTime < maxFuture && !fired[key]) {
          const offsetStr = r.alarm === 0 ? '정시' : r.alarm + '분 전';
          toSchedule.push({
            id: makeId(key),
            title: `[다이어리 반복 알람] ${r.title}`,
            body: `${td} ${fmtTime(r.time)} 반복 일정 (${offsetStr})${r.detail ? ' · ' + r.detail : ''}`,
            schedule: { at: new Date(triggerTime), allowWhileIdle: true },
            channelId: ALARM_CHANNEL_ID,
            sound: 'alarm_bell.wav',
            foreground: true,
            extra: { key }
          });
        }
      });
    });

    // 3) 하루 일정 조절 알림 (데일리 루틴 알림)
    const dr = S.cfg && S.cfg.dailyRoutine;
    if (dr && dr.enabled && dr.time) {
      [ymd(new Date()), ymd(new Date(now + 864e5))].forEach(td => {
        const drDateTime = new Date(`${td}T${dr.time}:00`).getTime();
        const key = `daily_routine_${td}_${dr.time}`;
        if (drDateTime > now && drDateTime < maxFuture && !fired[key]) {
          toSchedule.push({
            id: makeId(key),
            title: `[${dr.title || '하루 일정 조절 알림'}] 📋`,
            body: dr.msg || '오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝',
            schedule: { at: new Date(drDateTime), allowWhileIdle: true },
            channelId: ALARM_CHANNEL_ID,
            sound: 'alarm_bell.wav',
            foreground: true,
            extra: { key, isDailyRoutine: true }
          });
        }
      });
    }

    if (toSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: toSchedule });
    }
    return true;
  } catch (err) {
    console.warn('Native alarm sync error:', err);
    return false;
  }
}

// 지원 브라우저(Chromium 등)의 시스템 알람 스케줄러(TimestampTrigger)에 미리 예약
async function syncScheduledNotifications(){
  const nativeOk = await syncNativeAlarms();
  if(nativeOk) return;

  if(!('serviceWorker' in navigator) || !window.SW_REG) return;
  if(!("Notification" in window) || Notification.permission !== 'granted') return;
  const hasTriggers = ('showTrigger' in Notification.prototype) && ('TimestampTrigger' in window);
  if(!hasTriggers) return;

  try {
    const existing = await window.SW_REG.getNotifications({ includeTriggered: false });
    const existingTags = new Set(existing.map(n => n.tag));
    const now = Date.now(), maxFuture = now + 48 * 3600 * 1000, fired = getFiredAlarms();

    (S.items||[]).forEach(item => {
      if(!item.time || item.alarm === null || item.done) return;
      const itemDateTime = new Date(`${item.date}T${item.time}:00`).getTime();
      if(isNaN(itemDateTime)) return;
      const triggerTime = itemDateTime - (item.alarm * 60 * 1000);
      const key = `trig_${item.id}_${triggerTime}`;

      if(triggerTime > now && triggerTime < maxFuture && !fired[`${item.id}_${triggerTime}`] && !existingTags.has(key)){
        const offsetStr = item.alarm === 0 ? '정시' : item.alarm + '분 전';
        window.SW_REG.showNotification(`[다이어리 알람] ${item.title}`, {
          body: `${item.date} ${fmtTime(item.time)} 일정 (${offsetStr})${item.detail ? ' · ' + item.detail : ''}`,
          icon: 'icon-192.png',
          badge: 'favicon.png',
          tag: key,
          showTrigger: new TimestampTrigger(triggerTime),
          vibrate: [500, 200, 500, 200, 500],
          requireInteraction: true,
          data: { url: './index.html' }
        }).catch(()=>{});
      }
    });

    [ymd(new Date()), ymd(new Date(now + 864e5))].forEach(td => {
      (S.reps || []).forEach(r => {
        if(!r.time || r.alarm === null || r.alarm === undefined) return;
        if(!repOn(r, td)) return;
        if(S.rdone && S.rdone[td + '|' + r.id]) return;
        if(S.skip && S.skip[td + '|' + r.id]) return;

        const repDateTime = new Date(`${td}T${r.time}:00`).getTime();
        if(isNaN(repDateTime)) return;
        const triggerTime = repDateTime - (r.alarm * 60 * 1000);
        const key = `trig_rep_${r.id}_${td}_${triggerTime}`;

        if(triggerTime > now && triggerTime < maxFuture && !fired[`rep_${r.id}_${td}_${triggerTime}`] && !existingTags.has(key)){
          const offsetStr = r.alarm === 0 ? '정시' : r.alarm + '분 전';
          window.SW_REG.showNotification(`[다이어리 반복 알람] ${r.title}`, {
            body: `${td} ${fmtTime(r.time)} 반복 일정 (${offsetStr})${r.detail ? ' · ' + r.detail : ''}`,
            icon: 'icon-192.png',
            badge: 'favicon.png',
            tag: key,
            showTrigger: new TimestampTrigger(triggerTime),
            vibrate: [500, 200, 500, 200, 500],
            requireInteraction: true,
            data: { url: './index.html' }
          }).catch(()=>{});
        }
      });
    });

    // 3) 하루 일정 조절 알림 (웹 PWA 지원)
    const dr = S.cfg && S.cfg.dailyRoutine;
    if (dr && dr.enabled && dr.time) {
      [ymd(new Date()), ymd(new Date(now + 864e5))].forEach(td => {
        const drDateTime = new Date(`${td}T${dr.time}:00`).getTime();
        const key = `trig_dr_${td}_${dr.time}`;
        if (drDateTime > now && drDateTime < maxFuture && !fired[`daily_routine_${td}_${dr.time}`] && !existingTags.has(key)) {
          window.SW_REG.showNotification(`[${dr.title || '하루 일정 조절 알림'}] 📋`, {
            body: dr.msg || '오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝',
            icon: 'icon-192.png',
            badge: 'favicon.png',
            tag: key,
            showTrigger: new TimestampTrigger(drDateTime),
            vibrate: [500, 200, 500, 200, 500],
            requireInteraction: true,
            data: { url: './index.html', tab: '일정' }
          }).catch(()=>{});
        }
      });
    }
  } catch(e) {
    console.warn('알람 스케줄링 예외:', e);
  }
}
