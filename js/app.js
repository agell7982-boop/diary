/* js/app.js - 앱 초기화, 라우팅, 액션 디스패처 및 서비스 워커 */
/* app.js: 하단 메뉴, 화면 그리기 (스크롤 위치 자동 복원) */
const TABS=['일정','달력','기록','설정'],NEXT={'달력':'한 달 달력은 2단계에서 만들어요.','기록':'기록 화면은 3단계에서 만들어요.','설정':'설정 화면은 5단계에서 만들어요.'};let tab='일정';
const app=document.getElementById('app');
function tabsHTML(){return `<nav class="tb" aria-label="메뉴">${TABS.map(t=>`<button class="${t===tab?'a':''}" data-a="tab" data-t="${t}">${t}</button>`).join('')}</nav>`}

function render(){
  // 리렌더링 전 스크롤 위치 기억
  const ls=document.getElementById('ls');
  const lsTop=ls?ls.scrollTop:0;
  const winTop=window.scrollY||document.documentElement.scrollTop;

  app.innerHTML=(tab==='일정'?headHTML()+weekHTML()+`<div id="ls">${itemsListHTML()}</div>${repListHTML()}`+barHTML():tab==='달력'?calHTML():tab==='기록'?recHTML():tab==='설정'?setHTML():`<div class="hd"><h1>${tab}</h1></div><p class="mu" style="margin-top:24px">${NEXT[tab]}</p><div id="ls"></div>`)+tabsHTML();
  if(tab==='달력'&&DY&&!T&&!R)drawDay();

  // 리렌더링 후 스크롤 위치 즉시 복원 (화면 튐 방지)
  requestAnimationFrame(()=>{
    const newLs=document.getElementById('ls');
    if(newLs&&lsTop)newLs.scrollTop=lsTop;
    if(winTop)window.scrollTo(0,winTop);
  });
}

const TAB_STACK = [];
document.addEventListener('click', e => {
  const aLink = e.target.closest('a[href^="http://"], a[href^="https://"]');
  if (aLink && isNativeApp()) {
    e.preventDefault();
    openExternalUrl(aLink.href);
    return;
  }
  const b = e.target.closest('[data-a]');
  if (!b) return;
  if (b.classList.contains('ov') && e.target !== b) return;
  if (A[b.dataset.a]) A[b.dataset.a](b.dataset);
});
A.tab=(d, fromBack=false)=>{
  DY=false;
  stopAlarmSound();
  if(tab==='기록'&&d.t!=='기록')U=false;
  if(tab==='설정'&&d.t!=='설정'){
    if(TEMP_CFG){TEMP_CFG=null;applyCfg()}
    TEMP_SND=null;
    TEMP_VOL=null;
  }
  if(!fromBack && tab !== d.t){
    TAB_STACK.push(tab);
    try {
      history.pushState({ tab: d.t }, '');
    } catch(e) {}
  }
  tab=d.t;
  if(tab==='달력')cm={y:+sel.slice(0,4),m:+sel.slice(5,7)-1};
  render();
};

// 시작
load();migGoals();applyCfg();render();wxLoad();syInit();
setInterval(checkAlarms, 3000);
setTimeout(checkAlarms, 500);
setTimeout(()=>{ if(typeof checkForUpdates==='function') checkForUpdates(false); }, 2500);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      window.SW_REG=reg;
      syncScheduledNotifications();
    }).catch(e=>console.warn('SW 등록 실패:',e));
  });
  navigator.serviceWorker.addEventListener('message',e=>{
    if(e.data&&e.data.type==='ALARM_CLICKED'){
      checkAlarms();
    }
  });
}
if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isPluginAvailable('LocalNotifications')) {
  window.Capacitor.Plugins.LocalNotifications.addListener('localNotificationActionPerformed', () => {
    checkAlarms();
  });
}

// 안드로이드 네이티브 및 브라우저 뒤로가기(Back Button) 제어
function closeTopOverlay(){
  const photo = document.getElementById('photo-lightbox');
  if(photo){
    photo.remove();
    return true;
  }
  const upd = document.getElementById('update-modal');
  if(upd){
    upd.remove();
    return true;
  }
  const alm = document.getElementById('alarm-dialog');
  if(alm){
    alm.remove();
    stopAlarmSound();
    return true;
  }
  if(T || (typeof SH !== 'undefined' && SH && SH.innerHTML.trim() !== '')){
    closeSheet();
    return true;
  }
  if(typeof R !== 'undefined' && R){
    closeSheet();
    return true;
  }
  if(typeof DY !== 'undefined' && DY){
    DY = false;
    render();
    return true;
  }
  if(typeof GS !== 'undefined' && GS){
    if(typeof closeGoalSheet === 'function') closeGoalSheet();
    return true;
  }
  if(tab === '기록' && typeof EDITING_DAY !== 'undefined' && EDITING_DAY !== null){
    EDITING_DAY = null;
    render();
    toast('일기 수정을 취소했어요');
    return true;
  }
  return false;
}

function handleAppBack(){
  if (closeTopOverlay()) {
    return true;
  }
  if (TAB_STACK.length > 0) {
    const prevTab = TAB_STACK.pop();
    A.tab({ t: prevTab }, true);
    return true;
  }
  if (tab !== '일정') {
    A.tab({ t: '일정' }, true);
    return true;
  }
  return false;
}

let lastBackPress = 0;
if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App && typeof window.Capacitor.Plugins.App.addListener === 'function') {
  window.Capacitor.Plugins.App.addListener('backButton', () => {
    if (handleAppBack()) {
      return;
    }
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      if (typeof window.Capacitor.Plugins.App.exitApp === 'function') {
        window.Capacitor.Plugins.App.exitApp();
      }
    } else {
      lastBackPress = now;
      toast('한 번 더 누르면 앱이 종료됩니다');
    }
  });
}

try {
  history.replaceState({ tab: '일정', root: true }, '');
} catch(e) {}

window.addEventListener('popstate', () => {
  if (handleAppBack()) {
    try {
      history.pushState({ tab }, '');
    } catch(err) {}
  } else {
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      // 2초 내 재터치
    } else {
      lastBackPress = now;
      toast('한 번 더 누르면 앱을 종료합니다');
      try {
        history.pushState({ tab }, '');
      } catch(err) {}
    }
  }
});

window.addEventListener('focus', checkAlarms);
window.addEventListener('pageshow', checkAlarms);
document.addEventListener('visibilitychange', ()=>{
  if(!document.hidden){
    checkAlarms();
    syncScheduledNotifications();
    updateBgKeepAlive();
  }else{
    updateBgKeepAlive();
  }
});
