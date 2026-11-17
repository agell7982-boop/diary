/* js/settings.js - [설정] 탭, 테마·글꼴·알람소리·백업 */
/* settings.js: 설정 탭 (실시간 미리보기 & 최종 저장 방식) */
const D0=[250,248,244],DEF={bg:D0,bg2:[236,232,224],tx:[43,42,39]};
const PAL=['#ffffff','#faf8f4','#f1ece3','#e8e4dc','#cfcac0','#8a857c','#4a4640','#2b2a27','#111111','#fde2e4','#fad2e1','#e2ece9','#bee1e6','#dfe7fd','#cddafd','#fff1e6','#fdf2b3','#e9f5db','#cfe1b9','#b7d3a8','#9fc5a0','#f4a6a6','#e57373','#d9534f','#f6b26b','#e0944a','#f1c232','#76a5af','#6fa8dc','#4a7bd0','#8e7cc3','#c27ba0'];
const GRAD_PRESETS=[
  {name:'🌿 아이콘 시그니처',bg:[242,250,244],bg2:[222,240,253],tx:[38,48,46]},
  {name:'온화한 베이지',bg:[250,248,244],bg2:[236,230,218],tx:[43,42,39]},
  {name:'노을빛 코랄',bg:[254,242,238],bg2:[253,226,218],tx:[58,40,36]},
  {name:'새벽 소프트블루',bg:[242,246,252],bg2:[220,233,248],tx:[35,46,58]},
  {name:'라벤더 미스트',bg:[247,243,250],bg2:[232,222,244],tx:[48,38,56]},
  {name:'모던 미드나잇',bg:[28,30,34],bg2:[18,20,24],tx:[240,242,245]}
];

let TEMP_CFG=null, TEMP_SND=null, TEMP_VOL=null, COLOR_DETAIL_OPEN=false, PW_BOX_OPEN=false, EMAIL_LOGIN_OPEN=false, ALARM_GUIDE_OPEN=false;
let SET_SEC_OPEN={account:false,theme:false,alarm:false,daily:false,font:false,lock:false};
const SOUND_NAMES={chime:'맑은 차임 (기본)',beep:'디지털 시계 비프',bell:'부드러운 종소리',marimba:'경쾌한 마림바',custom:'내 음원 파일'};
const APP_CURRENT_VERSION = '2.4.0';
let UPDATE_STATUS = {
  checked: false,
  hasUpdate: false,
  latestVersion: APP_CURRENT_VERSION,
  buildDate: '2026-11-17',
  notes: '',
  apkUrl: 'https://github.com/agell7982-boop/diary/raw/main/diary-debug.apk',
  apkShortUrl: 'https://is.gd/mydiaryapk',
  checking: false
};

function normalizeTimeInput(str){
  if(!str)return '08:30';
  let s=String(str).trim().replace(/\s+/g,'');
  if(s.includes(':')){
    const parts=s.split(':');
    if(parts.length>=2){
      const h=parseInt(parts[0],10);
      const m=parseInt(parts[1],10);
      if(!isNaN(h)&&!isNaN(m)&&h>=0&&h<=23&&m>=0&&m<=59){
        return pad(h)+':'+pad(m);
      }
    }
    return null;
  }
  if(/^\d{1,4}$/.test(s)){
    if(s.length<=2){
      const h=parseInt(s,10);
      if(h>=0&&h<=23)return pad(h)+':00';
    }else if(s.length===3){
      const h=parseInt(s.slice(0,1),10);
      const m=parseInt(s.slice(1),10);
      if(h>=0&&h<=23&&m>=0&&m<=59)return pad(h)+':'+pad(m);
    }else if(s.length===4){
      const h=parseInt(s.slice(0,2),10);
      const m=parseInt(s.slice(2),10);
      if(h>=0&&h<=23&&m>=0&&m<=59)return pad(h)+':'+pad(m);
    }
  }
  return null;
}

function isNewerVersion(remote,local){
  if(!remote||!local)return false;
  const r=String(remote).replace(/[^0-9.]/g,'').split('.').map(n=>parseInt(n,10)||0);
  const l=String(local).replace(/[^0-9.]/g,'').split('.').map(n=>parseInt(n,10)||0);
  for(let i=0;i<Math.max(r.length,l.length);i++){
    const rv=r[i]||0,lv=l[i]||0;
    if(rv>lv)return true;
    if(rv<lv)return false;
  }
  return false;
}

const GITHUB_VERSION_URL = 'https://raw.githubusercontent.com/agell7982-boop/diary/main/version.json';
const GITHUB_APK_URL = 'https://github.com/agell7982-boop/diary/raw/main/diary-debug.apk';
const SHORT_APK_URL = 'https://is.gd/mydiaryapk';

function showUpdateModal(ver, notes, isCurrent=false){
  const exist=document.getElementById('update-modal');
  if(exist)exist.remove();

  const div=document.createElement('div');
  div.id='update-modal';
  div.className='ov';
  div.style.zIndex='99';
  div.innerHTML=`
    <div class="sh" style="text-align:center;padding:24px 20px">
      <div style="font-size:44px;margin:0 auto 10px;line-height:1">🚀</div>
      <b style="font-size:18px;display:block;margin-bottom:4px;color:var(--tx)">
        ${isCurrent ? '현재 최신 버전을 사용 중입니다' : '새로운 업데이트가 있습니다!'}
      </b>
      <p class="mu" style="font-size:13px;margin:4px 0 12px">
        버전: <b>v${esc(ver)}</b> ${isCurrent ? '(최신 상태)' : `(현재 설치: v${APP_CURRENT_VERSION})`}
      </p>
      <div style="background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.55;text-align:left;margin-bottom:16px;white-space:pre-wrap;color:var(--tx)">
        ${esc(notes || '새로운 기능과 성능 개선이 포함되어 있습니다.')}
      </div>
      <div class="rw" style="gap:8px">
        <button class="ch pr update-btn-highlight" style="flex:1" data-a="applyupdate">
          ${isCurrent ? (isNativeApp() ? '최신 APK 다시 받기 📥' : '최신 버전 새로고침 🔄') : (isNativeApp() ? '지금 APK 다운로드 📥' : '지금 즉시 업데이트 🚀')}
        </button>
        <button class="ch" data-a="closeupdmodal">닫기</button>
      </div>
    </div>
  `;
  document.body.appendChild(div);
}

async function checkForUpdates(manual=false){
  if(UPDATE_STATUS.checking)return;
  UPDATE_STATUS.checking=true;
  if(manual)toast('최신 업데이트를 확인하고 있어요... 🔍');
  render();

  try{
    let data=null;
    try{
      const res=await fetch(GITHUB_VERSION_URL+'?_t='+Date.now(),{cache:'no-store'});
      if(res&&res.ok){
        data=await res.json();
      }
    }catch(e){
      console.warn('GitHub version fetch failed, fallback to local',e);
    }

    if(!data){
      try{
        const localRes=await fetch('./version.json?_t='+Date.now(),{cache:'no-store'});
        if(localRes&&localRes.ok) data=await localRes.json();
      }catch(e){}
    }

    if(data&&data.version){
      UPDATE_STATUS.latestVersion=data.version;
      UPDATE_STATUS.notes=data.releaseNotes||'새로운 기능 및 안정화 패치가 준비되었어요.';
      UPDATE_STATUS.apkUrl=data.apkUrl||GITHUB_APK_URL;
      UPDATE_STATUS.apkShortUrl=data.apkShortUrl||SHORT_APK_URL;
      UPDATE_STATUS.buildDate=data.buildDate||UPDATE_STATUS.buildDate;
      UPDATE_STATUS.hasUpdate=isNewerVersion(data.version,APP_CURRENT_VERSION);
    }

    if('serviceWorker' in navigator&&window.SW_REG){
      window.SW_REG.update().catch(()=>{});
    }

    UPDATE_STATUS.checked=true;
    UPDATE_STATUS.checking=false;
    render();

    if(manual){
      if(UPDATE_STATUS.hasUpdate){
        showUpdateModal(UPDATE_STATUS.latestVersion,UPDATE_STATUS.notes,false);
      }else{
        showUpdateModal(APP_CURRENT_VERSION,'현재 최신 버전을 이용 중입니다.\n필요하신 경우 최신 안드로이드 설치 파일(APK)을 다시 다운로드할 수 있습니다.',true);
      }
    }else{
      if(UPDATE_STATUS.hasUpdate){
        showUpdateModal(UPDATE_STATUS.latestVersion,UPDATE_STATUS.notes,false);
      }
    }
  }catch(err){
    UPDATE_STATUS.checking=false;
    if(manual)toast('업데이트 확인 중 인터넷 연결을 확인해 주세요.');
    render();
  }
}

function getActiveCfg(){return TEMP_CFG||S.cfg}
const rgbOf=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hex=c=>'#'+c.map(n=>pad(n.toString(16))).join('');

async function useFont(buf){try{const f=new FontFace('UserFont',buf);await f.load();document.fonts.add(f);document.body.style.fontFamily="'UserFont','Noto Sans KR',system-ui,sans-serif"}catch(e){toast('글꼴을 읽지 못했어요')}}

function applyCfg(customCfg){
  const c=customCfg||getActiveCfg(),r=document.documentElement.style,g=a=>a?'rgb('+a+')':'';
  r.setProperty('--bg',g(c.bg));
  r.setProperty('--tx',g(c.tx));
  document.body.style.background=c.grad&&c.bg2?`linear-gradient(160deg,${g(c.bg||D0)},${g(c.bg2)}) fixed`:g(c.bg||D0);
  document.getElementById('app').style.zoom=(c.fs||15)/15;
}

function updateColorPreview(k,c,box){
  if(!TEMP_CFG)TEMP_CFG=JSON.parse(JSON.stringify(S.cfg));
  TEMP_CFG[k]=c;
  applyCfg(TEMP_CFG);
  box=box||document.querySelector(`.cp[data-k="${k}"]`);
  if(box){
    box.querySelectorAll('[data-i]').forEach(x=>{if(x!==document.activeElement)x.value=c[+x.dataset.i]});
    box.querySelector('.sw').style.background='rgb('+c+')';
    box.querySelector('.hx').textContent=hex(c);
    const pk=box.querySelector('.pk');if(pk)pk.value=hex(c);
  }
  const sv=document.getElementById('color-save-status');
  if(sv)sv.textContent='🎨 미리보기 중 (저장해야 영구 적용돼요)';
}

function rgbRow(k,label){
  const c=getActiveCfg()[k]||DEF[k];
  return `<div class="cp" data-k="${k}" style="margin:8px 0"><p class="mu" style="margin:0">${label}</p><div class="sw" style="background:rgb(${c})"></div>${['R','G','B'].map((n,i)=>`<label class="mu">${n}<input type="range" class="rg" min="0" max="255" value="${c[i]}" data-k="${k}" data-i="${i}" aria-label="${label} ${n}"><input type="number" class="in rn" min="0" max="255" value="${c[i]}" data-k="${k}" data-i="${i}" aria-label="${label} ${n} 숫자"></label>`).join('')}<div class="pal">${PAL.map(h=>`<button class="pc" style="background:${h}" data-a="pcol" data-k="${k}" data-h="${h}" aria-label="색 ${h}"></button>`).join('')}</div><label class="mu">직접 고르기 <input type="color" class="pk" data-k="${k}" value="${hex(c)}" aria-label="${label} 색 선택"></label><p class="mu hx" style="margin:0">${hex(c)}</p></div>`;
}

function notiStatusText(){
  if(isNativeApp()){
    return S.cfg.bgKeepAlive!==false?'✅ 안드로이드 시스템 알람 켜짐 (화면 꺼짐 100% 보장)':'꺼짐 (화면 꺼짐 시 알람 제한)';
  }
  if(!("Notification" in window))return '⚠️ 현재 브라우저는 백그라운드 푸시 알림 미지원';
  if(Notification.permission==='granted'){
    return S.cfg.bgKeepAlive!==false?'✅ 알림 허용됨 · 백그라운드 유지 켜짐':'꺼짐 (알림 권한은 허용됨)';
  }
  if(Notification.permission==='denied')return '❌ 알림 차단됨 (브라우저 주소창 설정 확인)';
  return '⚠️ 알림 권한 필요 (버튼 터치하여 허용)';
}

function secCardHead(secId, title, summary, badgeText){
  const isOpen=!!SET_SEC_OPEN[secId];
  return `<button class="set-card-toggle" data-a="settog" data-sec="${secId}" aria-expanded="${isOpen}">
    <div style="flex:1;min-width:0;text-align:left">
      <div class="set-card-title">
        <span>${title}</span>
        ${badgeText?`<span class="set-card-badge">${badgeText}</span>`:''}
      </div>
      <div class="set-card-summary">${summary}</div>
    </div>
    <div class="set-card-chevron">${isOpen?'▲':'▼'}</div>
  </button>`;
}

function setHTML(){
  if(!TEMP_CFG)TEMP_CFG=JSON.parse(JSON.stringify(S.cfg));
  const c=getActiveCfg(),has=!!S.cfg.pw;
  const isModified=JSON.stringify(TEMP_CFG)!==JSON.stringify(S.cfg);
  const curSound=TEMP_SND||S.cfg.alarmSound||'chime';
  const curVol=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
  const isVolModified=TEMP_VOL!==null&&TEMP_VOL!==(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
  const isSndModified=(TEMP_SND!==null&&TEMP_SND!==(S.cfg.alarmSound||'chime'))||isVolModified;
  const hasCustomAudio=!!S.cfg.customAudioName;
  const dr=S.cfg.dailyRoutine||{enabled:false,time:'08:30',title:'하루 일정 조절 알림',msg:'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝'};

  return `<div class="hd"><h1>설정</h1></div><div id="ls">

<!-- 앱 상단 프로필 바 -->
<div style="display:flex;align-items:center;gap:14px;margin:12px 0 14px;padding:12px 16px;border-radius:18px;background:var(--sf);border:1px solid var(--bd)">
  <img src="icon-192.png" alt="앱 아이콘" style="width:48px;height:48px;border-radius:12px;flex:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.06))">
  <div style="flex:1;min-width:0">
    <input id="sn" style="border:0;outline:0;font-size:16px;font-weight:500;background:none;width:100%;color:var(--tx);padding:0" placeholder="내 이름 쓰기" value="${esc(S.cfg.name||'')}" aria-label="이름">
    <span class="mu" style="font-size:12px">나만의 감성 다이어리</span>
  </div>
</div>

<!-- 새 업데이트 알림 배너 (새 버전 감지 시 상단에 즉시 활성화) -->
${UPDATE_STATUS.hasUpdate ? `
  <div class="update-banner">
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:18px">🚀</span>
        <b style="font-size:14px;color:var(--tx)">새로운 버전(v${esc(UPDATE_STATUS.latestVersion)}) 업데이트</b>
      </div>
      <p class="mu" style="font-size:12px;margin:3px 0 0;line-height:1.4">${esc(UPDATE_STATUS.notes||'새로운 기능 및 안정화 패치가 준비되었어요.')}</p>
    </div>
    <button class="ch pr update-btn-highlight" data-a="applyupdate" style="flex:none;white-space:nowrap">지금 자동 업데이트</button>
  </div>
` : ''}

<!-- 1. 계정 & 백업 카드 -->
<div class="set-card${SET_SEC_OPEN.account?'':' closed'}">
  ${secCardHead('account', '☁️ 계정 & 백업', 'Firebase 계정 로그인, 클라우드 동기화 및 앱 버전 업데이트', UPDATE_STATUS.hasUpdate ? `<b style="color:var(--ac)">새 버전 v${esc(UPDATE_STATUS.latestVersion)}</b>` : (SYMSG[SY.st]||(SY.user?esc(SY.user.displayName||SY.user.email):'로그인 필요')))}
  ${SET_SEC_OPEN.account ? `
    <div class="set-card-body">
      ${accCardHTML()}

      <!-- 앱 버전 및 자동 업데이트 행 -->
      <div class="set-row" style="margin-top:8px">
        <div>
          <div style="font-size:14px;font-weight:500">앱 버전 및 업데이트</div>
          <div class="mu" style="font-size:12px;margin-top:2px">
            현재 v${APP_CURRENT_VERSION} ${UPDATE_STATUS.hasUpdate ? `· <b style="color:var(--ac)">새 버전 v${esc(UPDATE_STATUS.latestVersion)} 출시!</b>` : '· 최신 상태'}
          </div>
        </div>
        <button class="ch ${UPDATE_STATUS.hasUpdate ? 'on update-btn-highlight' : ''}" data-a="chkupdate" style="white-space:nowrap;flex:none">
          ${UPDATE_STATUS.checking ? '확인 중...' : (UPDATE_STATUS.hasUpdate ? '🚀 새 버전 업데이트' : '버전 확인 & 업데이트')}
        </button>
      </div>
    </div>
  ` : ''}
</div>

<!-- 2. 화면 테마 & 색상 카드 -->
<div class="set-card${SET_SEC_OPEN.theme?'':' closed'}">
  ${secCardHead('theme', '🎨 화면 테마 & 색상', '배경색, 은은한 그라데이션, 다크모드 및 프리셋 테마', c.grad?'그라데이션 ON':'단색 배경')}
  ${SET_SEC_OPEN.theme ? `
    <div class="set-card-body">
      <p class="set-card-desc">원하는 감성 테마를 터치하고 아래 <b>[색상 저장]</b>을 눌러주세요.</p>
      
      <div class="presets">${GRAD_PRESETS.map((p,idx)=>`<button class="pbtn" data-a="preset" data-i="${idx}"><span class="pdot" style="background:linear-gradient(135deg,rgb(${p.bg}),rgb(${p.bg2}))"></span><span>${p.name}</span></button>`).join('')}</div>

      <div class="set-row">
        <span style="font-size:14px">부드러운 그라데이션</span>
        <button class="ch${c.grad?' on':''}" data-a="grad">${c.grad?'켜짐':'꺼짐'}</button>
      </div>

      <button class="set-tog-btn" data-a="colortog">${COLOR_DETAIL_OPEN?'▲ 직접 색상 상세 설정 닫기':'▼ 직접 색상 상세 설정하기 (RGB / 팔레트)'}</button>

      ${COLOR_DETAIL_OPEN ? `
        <div style="margin-top:8px">
          ${rgbRow('bg','배경색')}
          ${c.grad?rgbRow('bg2','그라데이션 끝색'):''}
          ${rgbRow('tx','글자색')}
          <div style="text-align:right;margin:6px 0"><button class="ch" data-a="cfgreset">색상 기본값으로</button></div>
        </div>
      ` : ''}

      <div class="save-bar">
        <div style="flex:1"><span id="color-save-status" class="mu" style="font-size:12px">${isModified?'🎨 미리보기 중 (저장해야 유지돼요)':'현재 색상 적용됨'}</span></div>
        <button class="ch" data-a="cfgcancel">되돌리기</button>
        <button class="ch on" data-a="cfgsave">색상 저장</button>
      </div>
    </div>
  ` : ''}
</div>

<!-- 3. 알람 및 사운드 카드 (통합 백그라운드 & 시스템 알람) -->
<div class="set-card${SET_SEC_OPEN.alarm?'':' closed'}">
  ${secCardHead('alarm', '🔔 알람 및 사운드', '화면 꺼짐 시 알람 유지, 알람 벨소리 선택 및 음량 조절', `${curSound==='custom'&&(S.cfg.customAudioName)?esc(S.cfg.customAudioName):SOUND_NAMES[curSound]||curSound} · ${curVol}%`)}
  ${SET_SEC_OPEN.alarm ? `
    <div class="set-card-body">
      <!-- 통합된 화면 꺼짐 및 백그라운드 알람 스위치 -->
      <div class="set-row">
        <div style="padding-right:10px">
          <div style="font-size:14px;font-weight:500">화면 꺼짐 및 백그라운드 알람 유지</div>
          <div class="mu" style="font-size:12px;margin-top:2px">${notiStatusText()}</div>
          <div class="mu" style="font-size:11px;margin-top:2px;line-height:1.35">
            ${isNativeApp() 
              ? '안드로이드 시스템 알람 엔진으로 앱이 닫히거나 화면이 꺼져도 100% 정시에 울려요.' 
              : ('Notification' in window 
                ? '화면 꺼짐 시 절전 방지 무음 재생 및 정시 푸시 알림으로 소리를 울려요.' 
                : '현재 브라우저는 화면 꺼짐 푸시 알림을 지원하지 않습니다. 100% 정시 알람을 위해 전용 APK 앱 이용을 권장합니다.')}
          </div>
        </div>
        ${!isNativeApp() && !("Notification" in window) ? `
          <a href="https://github.com/agell7982-boop/diary/raw/main/diary-debug.apk" class="ch on" style="text-decoration:none;font-size:12px;padding:6px 10px;white-space:nowrap;flex:none">APK 받기</a>
        ` : `
          <button class="ch${(isNativeApp() ? S.cfg.bgKeepAlive!==false : (('Notification' in window && Notification.permission==='granted') && S.cfg.bgKeepAlive!==false)) ? ' on' : ''}" data-a="bgalmtog" style="flex:none;white-space:nowrap">
            ${(isNativeApp() 
              ? (S.cfg.bgKeepAlive!==false ? '켜짐' : '꺼짐') 
              : (!('Notification' in window) 
                ? '미지원' 
                : (Notification.permission!=='granted' ? '권한 허용 & 켜기' : (S.cfg.bgKeepAlive!==false ? '켜짐' : '꺼짐'))))}
          </button>
        `}
      </div>

      <!-- 알람 소리 선택 및 커스텀 MP3 -->
      <div class="set-col">
        <label class="mu" for="sel-snd" style="display:block;margin-bottom:6px">알람 소리 선택</label>
        <select id="sel-snd" class="in" style="margin:0 0 8px">
          <option value="chime"${curSound==='chime'?' selected':''}>맑은 차임 (기본)</option>
          <option value="beep"${curSound==='beep'?' selected':''}>디지털 시계 비프</option>
          <option value="bell"${curSound==='bell'?' selected':''}>부드러운 종소리</option>
          <option value="marimba"${curSound==='marimba'?' selected':''}>경쾌한 마림바</option>
          <option value="custom"${curSound==='custom'?' selected':''}${hasCustomAudio?'':' disabled'}>내 음원 파일 ${hasCustomAudio?'('+esc(S.cfg.customAudioName)+')':'(파일 등록 필요)'}</option>
        </select>
        <div class="rw" style="margin:4px 0">
          <button class="ch${isPreviewPlaying?' on':''}" data-a="testsnd">${isPreviewPlaying?'⏹️ 재생 정지':'소리 미리듣기 🔔'}</button>
          <button class="ch on" data-a="audp">내 음원(mp3) 첨부</button>
          ${hasCustomAudio?'<button class="ch" data-a="audx">음원 삭제</button>':''}
        </div>
        <p class="mu" style="font-size:12px;margin:6px 0 10px">내 폰에 있는 mp3 음악 파일을 알람음으로 등록할 수 있어요.</p>

        <!-- 알람 음량 조절 슬라이더 -->
        <div style="background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:10px 14px;margin:8px 0 10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:13px;font-weight:500">${curVol===0?'🔇 음소거':curVol<40?'🔈 알람 음량 (작게)':curVol<75?'🔉 알람 음량 (중간)':'🔊 알람 음량 (크게)'}</span>
            <b id="vol-val" style="font-size:13px;color:var(--ac)">${curVol}%</b>
          </div>
          <input id="alm-vol" type="range" min="0" max="100" step="5" value="${curVol}" style="width:100%" aria-label="알람 음량">
        </div>

        <div class="save-bar" style="margin:10px 0 4px">
          <div style="flex:1">
            <span id="snd-save-status" class="mu" style="font-size:12px">
              ${isSndModified?'🎵 소리/음량이 변경되었어요 (저장 필요)':`현재 적용: ${curSound==='custom'&&(S.cfg.customAudioName)?esc(S.cfg.customAudioName):SOUND_NAMES[curSound]||curSound} · ${curVol}%`}
            </span>
          </div>
          ${isSndModified?'<button class="ch" data-a="sndcancel">취소</button>':''}
          <button class="ch on" data-a="sendsave">알람 소리 저장</button>
        </div>
      </div>

      <!-- 꺼진 상태 / 백그라운드 알람 가이드 및 5초 테스트 -->
      <div class="set-col" style="margin-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:14px;font-weight:500">📱 꺼진 상태 / 백그라운드 알람 가이드</div>
            <div class="mu" style="font-size:12px">화면이 꺼져도 100% 알람을 받는 방법</div>
          </div>
          <button class="ch" data-a="almtog">${ALARM_GUIDE_OPEN?'닫기':'보기'}</button>
        </div>

        ${ALARM_GUIDE_OPEN ? `
          <div style="margin-top:10px;background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.6">
            ${isNativeApp() ? `
              <div style="background:var(--bg2,#f5f2eb);border:1px solid var(--bd);border-radius:12px;padding:10px 12px;text-align:center;margin:4px 0 10px;font-weight:600;color:var(--tx)">
                📱 현재 안드로이드 전용 알람 앱(APK) 실행 중입니다 ✅
              </div>
            ` : `
              <a href="https://github.com/agell7982-boop/diary/raw/main/diary-debug.apk" style="display:block;text-align:center;text-decoration:none;background:var(--ac);color:#fff;border-radius:12px;padding:12px;font-weight:600;font-size:14px;margin:4px 0 6px;">📥 안드로이드 전용 알람 앱(APK) 다운로드</a>
              <p class="mu" style="font-size:11px;margin:0 0 12px;text-align:center">화면이 완전히 꺼져도 100% 울리는 안드로이드 전용 설치 파일입니다.</p>
            `}
            <b style="color:var(--tx);display:block;margin-bottom:6px">📌 확실한 알람을 위한 팁:</b>
            <ol style="margin:0 0 10px;padding-left:18px" class="mu">
              ${isNativeApp() ? `
                <li><b>배터리 절전 예외 설정</b>: 스마트폰 설정 > 애플리케이션 > <b>다이어리</b> > 배터리 > <b>[제한 없음]</b>으로 설정하시면 기기가 깊은 절전(Doze) 모드에 들어가도 정시에 정확히 알람이 울립니다.</li>
                <li><b>알림 및 진동 권한 확인</b>: 스마트폰 알림 설정에서 소리와 팝업 알림이 켜져 있는지 확인해 주세요.</li>
              ` : `
                <li><b>홈 화면에 앱 설치 (PWA)</b>: 브라우저 메뉴에서 <b>[홈 화면에 추가]</b> 또는 <b>[앱 설치]</b>를 눌러주세요. 백그라운드 유지력이 대폭 강화됩니다.</li>
                <li><b>배터리 절전 예외 설정</b>: 스마트폰 설정 > 애플리케이션 > <b>다이어리(또는 브라우저)</b> > 배터리 > <b>[제한 없음]</b>으로 변경하면 기기가 잠들어도 알람이 중단되지 않습니다.</li>
                <li><b>전용 앱 사용 권장</b>: 웹 브라우저는 백그라운드 제약이 있을 수 있으므로 정밀한 알람이 필요할 때는 상단의 [전용 APK 앱] 설치를 권장합니다.</li>
              `}
            </ol>
            <button class="ch on" style="width:100%;margin-top:6px" data-a="testbg">⚡ 5초 뒤 백그라운드 알람 테스트하기</button>
            <p class="mu" style="font-size:11px;margin:6px 0 0;text-align:center">버튼 터치 후 즉시 화면을 끄거나 홈 화면으로 나가서 알람과 진동을 확인해 보세요.</p>
          </div>
        ` : ''}
      </div>
    </div>
  ` : ''}
</div>

<!-- 4. 하루 일정 조절 알림 카드 -->
<div class="set-card${SET_SEC_OPEN.daily?'':' closed'}">
  ${secCardHead('daily', '📋 하루 일정 조절 알림', '매일 지정한 시간에 오늘의 일정을 점검하고 계획을 조절', dr.enabled ? `${fmtTime(dr.time)} 켜짐` : '꺼짐')}
  ${SET_SEC_OPEN.daily ? `
    <div class="set-card-body">
      <div class="set-row">
        <div>
          <div style="font-size:14px;font-weight:500">매일 일정 조절 알림 받기</div>
          <div class="mu" style="font-size:12px">지정한 시간에 오늘 일정 안내 팝업과 소리를 울려요.</div>
        </div>
        <button class="ch${dr.enabled?' on':''}" data-a="drtog">${dr.enabled?'켜짐':'꺼짐'}</button>
      </div>

      <div class="set-col" style="margin-top:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <label class="mu" for="dr-time" style="font-size:13px;font-weight:500">알림 시간 직접 입력</label>
          <span style="font-size:13px;font-weight:600;color:var(--ac)">${fmtTime(dr.time)}</span>
        </div>
        <input id="dr-time" class="in" type="text" inputmode="numeric" placeholder="예: 08:30 또는 8:30" value="${esc(dr.time||'08:30')}" aria-label="하루 일정 조절 알림 시간" style="margin-bottom:4px">
        <p class="mu" style="font-size:11px;margin:0 0 10px">💡 시계 팝업 없이 원하는 시간을 키보드로 적어주세요 (예: 08:30, 8:30, 14:00)</p>

        <label class="mu" for="dr-msg" style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">알림 메시지 문구</label>
        <input id="dr-msg" class="in" value="${esc(dr.msg||'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝')}" placeholder="알림 메시지를 입력하세요" aria-label="알림 메시지" style="margin-bottom:10px">

        <div class="rw" style="gap:6px">
          <button class="ch" style="flex:1" data-a="drtest">⚡ 알림 미리보기</button>
          <button class="ch on" style="flex:1" data-a="drsave">설정 저장</button>
        </div>
      </div>
    </div>
  ` : ''}
</div>

<!-- 5. 글꼴 & 보기 설정 카드 -->
<div class="set-card${SET_SEC_OPEN.font?'':' closed'}">
  ${secCardHead('font', '🔤 글꼴 & 보기 설정', '글자 크기 조절, 나만의 글꼴(TTF) 첨부, 12/24시간제 표기', `${S.cfg.fs||15}px · ${S.fmt12?'12시간제':'24시간제'}`)}
  ${SET_SEC_OPEN.font ? `
    <div class="set-card-body">
      <div class="set-col">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <span style="font-size:14px">글자 크기</span>
          <b id="fsv" style="font-size:14px;color:var(--ac)">${S.cfg.fs||15}px</b>
        </div>
        <input id="fs" type="range" min="12" max="22" value="${S.cfg.fs||15}" style="width:100%" aria-label="글자 크기">
      </div>

      <div class="set-row">
        <div>
          <div style="font-size:14px">글꼴 파일</div>
          <div class="mu" style="font-size:12px">${esc(S.cfg.fontName||'기본 글꼴 (Noto Sans)')}</div>
        </div>
        <div class="rw" style="gap:6px">
          <button class="ch" data-a="fontp">파일 첨부</button>
          ${S.cfg.fontName?'<button class="ch" data-a="fontx">기본으로</button>':''}
        </div>
      </div>

      <div class="set-row">
        <div>
          <div style="font-size:14px">시간 표기 방식</div>
          <div class="mu" style="font-size:12px">${S.fmt12?'오전/오후 12시간제':'24시간제'}</div>
        </div>
        <button class="ch on" data-a="fmt2">변경</button>
      </div>
    </div>
  ` : ''}
</div>

<!-- 6. 일기 보안 & 잠금 카드 -->
<div class="set-card${SET_SEC_OPEN.lock?'':' closed'}" style="margin-bottom:28px">
  ${secCardHead('lock', '🔐 일기 보안 & 잠금', '비밀번호 설정 및 일기장 SHA-256 단방향 암호화 잠금', S.cfg.lock ? '🔒 잠금 켜짐' : '🔓 잠금 꺼짐')}
  ${SET_SEC_OPEN.lock ? `
    <div class="set-card-body">
      <div class="set-row">
        <div>
          <div style="font-size:14px">일기장 암호화 잠금</div>
          <div class="mu" style="font-size:12px">${S.cfg.lock ? '앱 실행 시 일기 조회에 비밀번호가 필요해요.' : '비밀번호 없이 일기를 바로 볼 수 있어요.'}</div>
        </div>
        <button class="ch${S.cfg.lock?' on':''}" data-a="lockt">${S.cfg.lock?'잠금 켜짐':'잠금 꺼짐'}</button>
      </div>

      <div class="set-col">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:14px">비밀번호 설정</div>
            <div class="mu" style="font-size:12px">${has?'비밀번호 설정됨':'아직 설정되지 않음'}</div>
          </div>
          <button class="ch" data-a="pwtog">${PW_BOX_OPEN?'닫기':(has?'비밀번호 변경':'비밀번호 등록')}</button>
        </div>
        ${PW_BOX_OPEN ? `
          <div style="margin-top:10px">
            <input id="sp0" class="in" type="password" placeholder="현재 비밀번호"${has?'':' hidden'} aria-label="현재 비밀번호">
            <input id="sp1" class="in" type="password" placeholder="새 비밀번호 (4자 이상)" aria-label="새 비밀번호" style="margin-top:4px">
            <button class="ch on" style="width:100%;margin-top:8px" data-a="chpw">비밀번호 저장</button>
          </div>
        ` : ''}
      </div>
    </div>
  ` : ''}
</div>

</div>`;
}

A.colortog=()=>{COLOR_DETAIL_OPEN=!COLOR_DETAIL_OPEN;render()};
A.pwtog=()=>{PW_BOX_OPEN=!PW_BOX_OPEN;render()};
A.emailtog=()=>{EMAIL_LOGIN_OPEN=!EMAIL_LOGIN_OPEN;render()};

A.preset=d=>{
  const p=GRAD_PRESETS[+d.i];
  if(!p)return;
  if(!TEMP_CFG)TEMP_CFG=JSON.parse(JSON.stringify(S.cfg));
  TEMP_CFG.bg=[...p.bg];
  TEMP_CFG.bg2=[...p.bg2];
  TEMP_CFG.tx=[...p.tx];
  TEMP_CFG.grad=true;
  applyCfg(TEMP_CFG);
  render();
  toast(`[${p.name}] 미리보기가 적용되었어요. 저장을 눌러주세요.`);
};
A.pcol=d=>updateColorPreview(d.k,rgbOf(d.h));
A.grad=()=>{
  if(!TEMP_CFG)TEMP_CFG=JSON.parse(JSON.stringify(S.cfg));
  TEMP_CFG.grad=!TEMP_CFG.grad;
  if(!TEMP_CFG.bg2)TEMP_CFG.bg2=[...DEF.bg2];
  applyCfg(TEMP_CFG);
  render();
};
A.cfgreset=()=>{
  TEMP_CFG=JSON.parse(JSON.stringify(S.cfg));
  delete TEMP_CFG.bg;
  delete TEMP_CFG.bg2;
  delete TEMP_CFG.tx;
  TEMP_CFG.grad=false;
  applyCfg(TEMP_CFG);
  render();
  toast('색상을 기본값으로 되돌렸어요. 저장을 눌러주세요.');
};
A.cfgsave=()=>{
  if(TEMP_CFG){
    S.cfg=Object.assign(S.cfg,TEMP_CFG);
    TEMP_CFG=null;
    save();
    applyCfg();
    render();
    toast('화면 색상이 성공적으로 저장되었어요 ✨');
  }
};
A.cfgcancel=()=>{
  TEMP_CFG=null;
  applyCfg();
  render();
  toast('원래 색상으로 되돌렸어요');
};

A.fmt2=()=>{S.fmt12=!S.fmt12;save();render()};
A.settog=d=>{const s=d.sec;if(s){SET_SEC_OPEN[s]=!SET_SEC_OPEN[s];render()}};
A.bgalmtog=async()=>{
  if(isNativeApp()){
    if(window.Capacitor && window.Capacitor.isPluginAvailable('LocalNotifications')){
      const { LocalNotifications } = window.Capacitor.Plugins;
      try{
        const perm = await LocalNotifications.checkPermissions();
        if(perm.display !== 'granted'){
          const req = await LocalNotifications.requestPermissions();
          if(req.display !== 'granted'){
            toast('안드로이드 시스템 알림 권한이 허용되지 않았어요');
            return;
          }
        }
      }catch(e){
        console.warn('Native permission error:', e);
      }
    }
    S.cfg.bgKeepAlive = S.cfg.bgKeepAlive === false ? true : false;
    save();
    updateBgKeepAlive();
    if(typeof syncScheduledNotifications === 'function') syncScheduledNotifications();
    render();
    toast(S.cfg.bgKeepAlive ? '화면 꺼짐 시 시스템 알람 유지가 켜졌어요 🔔' : '화면 꺼짐 알람 유지가 꺼졌어요');
    return;
  }

  if(!("Notification" in window)){
    S.cfg.bgKeepAlive = S.cfg.bgKeepAlive === false ? true : false;
    save();
    updateBgKeepAlive();
    render();
    toast(S.cfg.bgKeepAlive ? '앱 켜진 상태 알람 유지가 켜졌어요 🔋 (화면 꺼짐 알람은 전용 APK 앱 권장)' : '알람 유지가 꺼졌어요');
    return;
  }

  if(Notification.permission !== 'granted'){
    const p = await Notification.requestPermission();
    if(p === 'granted'){
      S.cfg.bgKeepAlive = true;
      save();
      updateBgKeepAlive();
      if(typeof syncScheduledNotifications === 'function') syncScheduledNotifications();
      render();
      toast('알림 권한이 허용되고 화면 꺼짐 알람 유지가 켜졌어요! 🔔');
    }else{
      render();
      toast('알림 권한이 허용되지 않아 백그라운드 알람이 제한될 수 있어요');
    }
  }else{
    S.cfg.bgKeepAlive = S.cfg.bgKeepAlive === false ? true : false;
    save();
    updateBgKeepAlive();
    if(typeof syncScheduledNotifications === 'function') syncScheduledNotifications();
    render();
    toast(S.cfg.bgKeepAlive ? '백그라운드 알람 유지가 켜졌어요 🔋' : '백그라운드 알람 유지가 꺼졌어요');
  }
};
A.reqnoti=A.bgalmtog;
A.bgaktog=A.bgalmtog;
A.almtog=()=>{ALARM_GUIDE_OPEN=!ALARM_GUIDE_OPEN;render()};
A.testsnd=()=>{
  if(isPreviewPlaying){
    stopAlarmSound();
    toast('재생을 멈췄어요 ⏹️');
  }else{
    const v=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
    playAlarmSound(TEMP_SND||S.cfg.alarmSound||'chime',v,true);
    toast(`소리를 재생 중이에요 🔔 (음량 ${v}%)`);
  }
};
A.sendsave=()=>{
  stopAlarmSound();
  let changed=false;
  if(TEMP_SND!==null){S.cfg.alarmSound=TEMP_SND;TEMP_SND=null;changed=true}
  if(TEMP_VOL!==null){S.cfg.alarmVol=TEMP_VOL;TEMP_VOL=null;changed=true}
  if(changed){
    save();
    render();
    toast('알람 소리 및 음량이 성공적으로 저장되었어요 🔔');
  }else{
    toast('현재 설정이 이미 적용되어 있어요.');
  }
};
A.sndcancel=()=>{
  stopAlarmSound();
  TEMP_SND=null;
  TEMP_VOL=null;
  render();
  toast('소리 및 음량 변경을 취소했어요.');
};
A.testbg=async()=>{
  if(isNativeApp()){
    if(window.Capacitor && window.Capacitor.isPluginAvailable('LocalNotifications')){
      const { LocalNotifications } = window.Capacitor.Plugins;
      try{
        const perm = await LocalNotifications.checkPermissions();
        if(perm.display !== 'granted'){
          const req = await LocalNotifications.requestPermissions();
          if(req.display !== 'granted'){
            toast('안드로이드 알림 권한을 먼저 허용해 주세요');
            return;
          }
        }
        await ensureAlarmChannel(LocalNotifications);
        const targetTime = new Date(Date.now() + 5000);
        await LocalNotifications.schedule({
          notifications: [{
            id: 999999,
            title: '[다이어리 알람 테스트] 🔔',
            body: '화면이 꺼진 상태에서도 안드로이드 시스템 알람이 성공적으로 도착했어요!',
            schedule: { at: targetTime, allowWhileIdle: true },
            channelId: ALARM_CHANNEL_ID,
            sound: 'alarm_bell.wav',
            foreground: true
          }]
        });
        toast('5초 뒤 시스템 알람이 울려요! 지금 바로 화면을 끄고 소리를 확인해 보세요 🔔');
        return;
      }catch(e){
        console.warn('Native test alarm error:', e);
      }
    }
  }

  if(!("Notification" in window)){
    toast('5초 뒤 소리 알람이 울려요! (이 브라우저는 푸시 팝업을 지원하지 않아 소리만 울립니다)');
    setTimeout(()=>{
      const v=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
      playAlarmSound(TEMP_SND||S.cfg.alarmSound||'chime',v);
      showAlarmModal('알람 테스트','소리 알람 테스트 성공!','웹 브라우저에서 알람 소리가 정상 재생되었습니다.');
    },5000);
    return;
  }

  if(Notification.permission!=='granted'){
    const p=await Notification.requestPermission();
    if(p!=='granted'){toast('알림 권한을 먼저 허용해 주세요');return}
  }
  toast('5초 뒤 알람이 울려요! 지금 바로 화면을 끄거나 홈 화면으로 나가보세요.');
  
  // 백그라운드 무음 오디오를 즉시 활성화하여 화면이 꺼져도 브라우저가 잠들지 않도록 방지
  initBgAudio();
  if(bgAudio){bgAudio.play().catch(()=>{})}

  const targetTime=Date.now()+5000;
  if(('showTrigger' in Notification.prototype)&&('TimestampTrigger' in window)&&window.SW_REG){
    try{
      await window.SW_REG.showNotification('[다이어리 알람 테스트] 🔔',{
        body:'화면이 꺼진 상태에서도 알람이 성공적으로 도착했어요!',
        icon:'icon-192.png',
        badge:'favicon.png',
        tag:'test_alarm_'+targetTime,
        showTrigger:new TimestampTrigger(targetTime),
        vibrate:[500,200,500,200,500],
        requireInteraction:true,
        data:{url:'./index.html'}
      });
    }catch(e){}
  }
  setTimeout(()=>{
    if(bgAudio){try{bgAudio.pause()}catch(e){}}
    const v=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
    playAlarmSound(TEMP_SND||S.cfg.alarmSound||'chime',v);
    const notiOpts={
      body:'화면이 꺼진 상태에서도 알람이 성공적으로 도착했어요!',
      icon:'icon-192.png',
      badge:'favicon.png',
      tag:'test_alarm_now_'+Date.now(),
      vibrate:[500,200,500,200,500],
      requireInteraction:true,
      data:{url:'./index.html'}
    };
    if(window.SW_REG&&window.SW_REG.showNotification){
      window.SW_REG.showNotification('[다이어리 알람 테스트] 🔔',notiOpts);
    }else{
      try{new Notification('[다이어리 알람 테스트] 🔔',notiOpts);}catch(e){}
    }
  },5000);
};

/* 앱 버전 확인 및 자동 업데이트 액션 핸들러 */
A.chkupdate=()=>{
  checkForUpdates(true);
};

A.applyupdate=()=>{
  const modal=document.getElementById('update-modal');
  if(modal)modal.remove();
  if(isNativeApp()){
    toast('최신 안드로이드 APK 다운로드를 시작합니다 📥');
    const dlUrl=UPDATE_STATUS.apkShortUrl||SHORT_APK_URL;
    const rawApk=UPDATE_STATUS.apkUrl||GITHUB_APK_URL;
    try{
      const a=document.createElement('a');
      a.href=rawApk;
      a.download='diary-debug.apk';
      a.target='_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>a.remove(),1000);
    }catch(e){}
    setTimeout(()=>{
      try{
        if(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App){
          window.open(dlUrl,'_system');
        }else{
          window.location.href=dlUrl;
        }
      }catch(err){
        window.location.href=dlUrl;
      }
    },400);
    return;
  }

  toast('최신 버전으로 자동 업데이트를 적용하고 새로고침합니다... 🔄');
  try{
    if('caches' in window){
      caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))));
    }
    if('serviceWorker' in navigator&&window.SW_REG){
      window.SW_REG.unregister().catch(()=>{});
    }
  }catch(e){}

  setTimeout(()=>{
    const cleanUrl=window.location.origin+window.location.pathname+'?_upd='+Date.now();
    window.location.replace(cleanUrl);
  },600);
};

A.closeupdmodal=()=>{
  const modal=document.getElementById('update-modal');
  if(modal)modal.remove();
};

/* 하루 일정 조절 알림 (데일리 루틴) 액션 핸들러 */
A.drtog=()=>{
  if(!S.cfg.dailyRoutine) S.cfg.dailyRoutine={ enabled:false, time:'08:30', title:'하루 일정 조절 알림', msg:'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝' };
  S.cfg.dailyRoutine.enabled=!S.cfg.dailyRoutine.enabled;
  save();
  render();
  toast(S.cfg.dailyRoutine.enabled ? '하루 일정 조절 알림이 켜졌어요 📋' : '하루 일정 조절 알림이 꺼졌어요');
};

A.drsave=()=>{
  if(!S.cfg.dailyRoutine) S.cfg.dailyRoutine={ enabled:true, time:'08:30', title:'하루 일정 조절 알림', msg:'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝' };
  const rawTime=($('dr-time')?.value||'').trim();
  const normTime=normalizeTimeInput(rawTime);
  if(!normTime){
    toast('올바른 시간 형식으로 적어 주세요 (예: 08:30 또는 8:30)');
    return;
  }
  const m=($('dr-msg')?.value||'').trim()||'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝';
  S.cfg.dailyRoutine.time=normTime;
  S.cfg.dailyRoutine.msg=m;
  S.cfg.dailyRoutine.enabled=true;
  save();
  if(typeof syncScheduledNotifications==='function') syncScheduledNotifications();
  render();
  toast(`매일 ${fmtTime(normTime)} 하루 일정 조절 알림이 설정되었어요 📋`);
};

A.drtest=()=>{
  toast('2초 뒤 하루 일정 조절 알림이 울립니다 🔔');
  setTimeout(()=>{
    const dr=S.cfg.dailyRoutine||{ time:'08:30', title:'하루 일정 조절 알림', msg:'오늘의 일정을 확인하고 하루 계획을 조절해 보세요! 📝' };
    triggerDailyRoutineAlarm(dr);
  }, 2000);
};

/* 커스텀 음원 파일 업로드 및 삭제 */
const AF=document.createElement('input');AF.type='file';AF.accept='audio/*';AF.hidden=true;document.body.appendChild(AF);
AF.onchange=async()=>{
  const f=AF.files[0];AF.value='';if(!f)return;
  if(f.size>35*1024*1024){toast('35MB 이하의 음원 파일만 가능해요');return}
  const reader=new FileReader();
  reader.onload=async()=>{
    try{
      const dataUrl=reader.result;
      await idb('put','alarmSoundCustom',{url:dataUrl,name:f.name});
      S.cfg.customAudioName=f.name;
      S.cfg.alarmSound='custom'; // 즉시 저장 반영
      TEMP_SND='custom';
      save();
      render();
      toast(`🎵 [${f.name}] 음악이 알람 소리로 등록 및 저장되었어요!`);
      const v=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
      playAlarmSound('custom',v,true);
    }catch(e){
      toast('음원 저장 중 오류가 발생했어요');
    }
  };
  reader.onerror=()=>toast('음원 파일을 읽지 못했어요');
  reader.readAsDataURL(f);
};
A.audp=()=>AF.click();
A.audx=async()=>{
  await idb('put','alarmSoundCustom',null);
  delete S.cfg.customAudioName;
  if(S.cfg.alarmSound==='custom')S.cfg.alarmSound='chime';
  if(TEMP_SND==='custom')TEMP_SND='chime';
  save();
  render();
  toast('등록한 음원을 삭제했어요');
};

A.lockt=async()=>{if(S.cfg.lock&&S.cfg.pw&&await hash($('sp0').value)!==S.cfg.pw){toast('아래 현재 비밀번호 칸에 적고 눌러 주세요');return}S.cfg.lock=!S.cfg.lock;save();render()};
A.chpw=async()=>{const n=$('sp1').value;if(S.cfg.pw&&await hash($('sp0').value)!==S.cfg.pw){toast('현재 비밀번호가 달라요');return}if(n.length<4){toast('새 비밀번호는 4자 이상이에요');return}S.cfg.pw=await hash(n);save();render();toast('비밀번호를 저장했어요')};
const FF=document.createElement('input');FF.type='file';FF.accept='.ttf,.otf,.woff,.woff2';FF.hidden=true;document.body.appendChild(FF);
FF.onchange=async()=>{const f=FF.files[0];FF.value='';if(!f)return;const b=await f.arrayBuffer();await idb('put','font',b);S.cfg.fontName=f.name;save();await useFont(b);render()};
A.fontp=()=>FF.click();
A.fontx=async()=>{await idb('put','font',null);S.cfg.fontName='';save();document.body.style.fontFamily='';render()};

document.addEventListener('change',e=>{
  if(e.target.id==='sel-snd'){
    TEMP_SND=e.target.value;
    const v=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
    playAlarmSound(e.target.value,v,true);
    render();
  }else if(e.target.id==='alm-vol'){
    TEMP_VOL=+e.target.value;
    if(activeMasterGain&&activeAudioCtx&&activeAudioCtx.state==='running'){
      updatePlayingVolume(TEMP_VOL);
    }else{
      playAlarmSound(TEMP_SND||S.cfg.alarmSound||'chime',TEMP_VOL,true);
    }
  }
});

document.addEventListener('input',e=>{const t=e.target,k=t.dataset.k;
if(k&&(t.classList.contains('rg')||t.classList.contains('rn'))){
  if(!TEMP_CFG)TEMP_CFG=JSON.parse(JSON.stringify(S.cfg));
  const i=+t.dataset.i,v=Math.max(0,Math.min(255,Math.round(+t.value||0))),c=[...(TEMP_CFG[k]||DEF[k])];c[i]=v;
  updateColorPreview(k,c,t.closest('.cp'));
}
else if(k&&t.classList.contains('pk'))updateColorPreview(k,rgbOf(t.value),t.closest('.cp'))
else if(t.id==='alm-vol'){
  TEMP_VOL=+t.value;
  const el=$('vol-val');if(el)el.textContent=t.value+'%';
  const st=$('snd-save-status');if(st)st.textContent='🎵 소리/음량이 변경되었어요 (저장 필요)';
  if(activeMasterGain&&activeAudioCtx&&activeAudioCtx.state==='running'){
    updatePlayingVolume(TEMP_VOL);
  }
}
else if(t.id==='fs'){S.cfg.fs=+t.value;save();applyCfg();$('fsv').textContent=t.value+'px'}
else if(t.id==='sn'){S.cfg.name=t.value;save()}});
idb('get','font').then(b=>{if(b)useFont(b)});
