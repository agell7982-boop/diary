/* js/alarm.js - 알람 체크 루프, 알림 모달 및 스케줄러 */
function showAlarmModal(title,sub,detail){
  const exist=document.getElementById('alarm-dialog');
  if(exist)exist.remove();
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
  div.querySelector('#alarm-ok-btn').onclick=()=>{
    div.remove();
    stopAlarmSound();
  };
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
            extra: { key }
          });
        }
      });
    });

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
  } catch(e) {
    console.warn('알람 스케줄링 예외:', e);
  }
}
