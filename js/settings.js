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
const SOUND_NAMES={chime:'맑은 차임 (기본)',beep:'디지털 시계 비프',bell:'부드러운 종소리',marimba:'경쾌한 마림바',custom:'내 음원 파일'};
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
  if(!("Notification" in window))return '이 기기는 알림을 지원하지 않아요.';
  if(Notification.permission==='granted')return '✅ 허용됨 (백그라운드 알림 가능)';
  if(Notification.permission==='denied')return '❌ 차단됨 (브라우저 주소창 설정 확인)';
  return '⚠️ 권한 필요 (아래 버튼 터치)';
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

  return `<div class="hd"><h1>설정</h1></div><div id="ls">

<!-- 1. 앱 헤더 & 프로필 -->
<div style="display:flex;align-items:center;gap:14px;margin:12px 0 14px;padding:12px 16px;border-radius:18px;background:var(--sf);border:1px solid var(--bd)">
  <img src="icon-192.png" alt="앱 아이콘" style="width:48px;height:48px;border-radius:12px;flex:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.06))">
  <div style="flex:1;min-width:0">
    <input id="sn" style="border:0;outline:0;font-size:16px;font-weight:500;background:none;width:100%;color:var(--tx);padding:0" placeholder="내 이름 쓰기" value="${esc(S.cfg.name||'')}" aria-label="이름">
    <span class="mu" style="font-size:12px">나만의 감성 다이어리</span>
  </div>
</div>

<!-- 2. 계정 & 클라우드 백업 카드 -->
<div class="set-card">
  <div class="set-card-head">
    <div class="set-card-title"><span>☁️ 계정 & 백업</span></div>
    <span class="mu" style="font-size:12px" id="sy-status-text">${SYMSG[SY.st]||''}${SY.msg?' · '+esc(SY.msg):''}</span>
  </div>
  ${accCardHTML()}
</div>

<!-- 3. 화면 테마 & 색상 카드 -->
<div class="set-card">
  <div class="set-card-head">
    <div class="set-card-title"><span>🎨 화면 테마 & 색상</span></div>
    <span class="mu" style="font-size:12px">${c.grad?'그라데이션 ON':'단색 배경'}</span>
  </div>
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

<!-- 4. 알람 및 사운드 카드 -->
<div class="set-card">
  <div class="set-card-head">
    <div class="set-card-title"><span>🔔 알람 및 사운드</span></div>
    <span class="mu" style="font-size:12px">${curSound==='custom'&&(S.cfg.customAudioName)?esc(S.cfg.customAudioName):SOUND_NAMES[curSound]||curSound}</span>
  </div>
  
  <div class="set-row">
    <div>
      <div style="font-size:14px">푸시 알림 권한</div>
      <div class="mu" style="font-size:12px">${notiStatusText()}</div>
    </div>
    <button class="ch on" data-a="reqnoti">권한 받기</button>
  </div>

  <div class="set-row">
    <div>
      <div style="font-size:14px">화면 꺼짐 시 알람 유지 (백그라운드)</div>
      <div class="mu" style="font-size:12px">${S.cfg.bgKeepAlive!==false?'켜짐 (화면 꺼짐 시 절전 차단 및 정시 알람)':'꺼짐 (화면 꺼지면 알람 안 옴)'}</div>
    </div>
    <button class="ch${S.cfg.bgKeepAlive!==false?' on':''}" data-a="bgaktog">${S.cfg.bgKeepAlive!==false?'켜짐':'꺼짐'}</button>
  </div>

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

  <div class="set-col" style="margin-top:6px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:14px;font-weight:500">📱 꺼진 상태 / 백그라운드 알람 가이드</div>
        <div class="mu" style="font-size:12px">앱이 닫혀 있거나 화면이 꺼져도 알림 받기</div>
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
          <p class="mu" style="font-size:11px;margin:0 0 12px;text-align:center">앱이 완전히 꺼져도 100% 울리는 안드로이드 전용 설치 파일입니다.</p>
        `}
        <b style="color:var(--tx);display:block;margin-bottom:6px">📌 확실한 알람을 위한 필수 팁:</b>
        <ol style="margin:0 0 10px;padding-left:18px" class="mu">
          ${isNativeApp() ? `
            <li><b>배터리 절전 예외 설정</b>: 스마트폰 설정 > 애플리케이션 > <b>다이어리</b> > 배터리 > <b>[제한 없음]</b>으로 설정하시면 기기가 깊은 절전(Doze) 모드에 들어가도 정시에 정확히 알람이 울립니다.</li>
            <li><b>알림 및 진동 권한 확인</b>: 스마트폰 알림 설정에서 소리와 팝업 알림이 켜져 있는지 확인해 주세요.</li>
          ` : `
            <li><b>홈 화면에 앱 설치 (PWA)</b>: 브라우저 메뉴(⋮ 또는 공유 버튼)에서 <b>[홈 화면에 추가]</b> 또는 <b>[앱 설치]</b>를 눌러주세요. 독립 앱으로 등록되어 백그라운드 유지력이 대폭 강화됩니다.</li>
            <li><b>배터리 절전 예외 설정</b>: 스마트폰 설정 > 애플리케이션 > <b>나만의 다이어리(또는 브라우저)</b> > 배터리 > <b>[제한 없음]</b>으로 변경하면 기기가 잠들어도 알람이 중단되지 않습니다.</li>
            <li><b>서비스 워커 자동 스케줄링</b>: 안드로이드 Chrome 등 지원 브라우저에서는 시스템 스케줄러(TimestampTrigger)에 미리 등록되어 앱이 닫혀도 제시간에 알림이 울립니다.</li>
          `}
        </ol>
        <button class="ch on" style="width:100%;margin-top:6px" data-a="testbg">⚡ 5초 뒤 백그라운드 알람 테스트하기</button>
        <p class="mu" style="font-size:11px;margin:6px 0 0;text-align:center">버튼 터치 후 즉시 화면을 끄거나 홈 화면으로 나가서 알람과 진동을 확인해 보세요.</p>
      </div>
    ` : ''}
  </div>
</div>

<!-- 5. 글꼴 & 보기 설정 카드 -->
<div class="set-card">
  <div class="set-card-head">
    <div class="set-card-title"><span>🔤 글꼴 & 보기</span></div>
  </div>

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

<!-- 6. 일기 보안 & 잠금 카드 -->
<div class="set-card" style="margin-bottom:28px">
  <div class="set-card-head">
    <div class="set-card-title"><span>🔐 일기 보안 & 잠금</span></div>
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
A.reqnoti=async()=>{if(!("Notification" in window)){toast('이 브라우저는 알림을 지원하지 않아요');return}const p=await Notification.requestPermission();render();toast(p==='granted'?'알림이 허용되었어요!':'알림 권한을 받지 못했어요')};
A.bgaktog=()=>{
  S.cfg.bgKeepAlive = S.cfg.bgKeepAlive === false ? true : false;
  save();
  updateBgKeepAlive();
  render();
  toast(S.cfg.bgKeepAlive ? '화면 꺼짐 알람 유지가 켜졌어요 🔋' : '화면 꺼짐 알람 유지가 꺼졌어요');
};
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
  if(!("Notification" in window)){toast('이 기기는 알림을 지원하지 않아요');return}
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

/* 커스텀 음원 파일 업로드 및 삭제 */
const AF=document.createElement('input');AF.type='file';AF.accept='audio/*';AF.hidden=true;document.body.appendChild(AF);
AF.onchange=async()=>{
  const f=AF.files[0];AF.value='';if(!f)return;
  if(f.size>25*1024*1024){toast('25MB 이하의 음원 파일만 가능해요');return}
  const buf=await f.arrayBuffer();
  await idb('put','alarmSoundCustom',{buf,name:f.name});
  S.cfg.customAudioName=f.name;
  TEMP_SND='custom';
  save();
  render();
  toast(`음원 [${f.name}]을 등록했어요! [알람 소리 저장]을 눌러주세요.`);
  const v=TEMP_VOL!==null?TEMP_VOL:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
  playAlarmSound('custom',v);
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
