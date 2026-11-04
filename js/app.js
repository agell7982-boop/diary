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

app.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset)});
A.tab=d=>{
  DY=false;
  stopAlarmSound();
  if(tab==='기록'&&d.t!=='기록')U=false;
  if(tab==='설정'&&d.t!=='설정'){
    if(TEMP_CFG){TEMP_CFG=null;applyCfg()}
    TEMP_SND=null;
    TEMP_VOL=null;
  }
  tab=d.t;
  if(tab==='달력')cm={y:+sel.slice(0,4),m:+sel.slice(5,7)-1};
  render();
};

// 시작
load();migGoals();applyCfg();render();wxLoad();syInit();
setInterval(checkAlarms, 3000);
setTimeout(checkAlarms, 500);

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
