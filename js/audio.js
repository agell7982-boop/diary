/* js/audio.js - Web Audio API 및 사운드 합성/재생 엔진 */
/* alarm.js: 알람 소리(단일 인스턴스·실시간 음량 조절), 감시 루프 */

/* 백그라운드 절전 방지 무음 오디오 (Keep-Alive) */
const SILENT_WAV='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
let bgAudio=null, bgAudioPrimed=false;
function initBgAudio(){
  if(!bgAudio){
    bgAudio=new Audio(SILENT_WAV);
    bgAudio.loop=true;
    bgAudio.volume=0.01;
  }
}
function primeBgAudio(){
  if(bgAudioPrimed)return;
  initBgAudio();
  bgAudio.play().then(()=>{
    bgAudio.pause();
    bgAudioPrimed=true;
  }).catch(()=>{});
}
document.addEventListener('touchstart',primeBgAudio,{passive:true});
document.addEventListener('click',primeBgAudio,{passive:true});

function hasPendingAlarms(){
  const now=Date.now(), oneDayLater=now+24*3600*1000, fired=getFiredAlarms(), td=ymd(new Date());
  const hasItem=(S.items||[]).some(item=>{
    if(!item.time||item.alarm===null||item.done)return false;
    const itemDateTime=new Date(`${item.date}T${item.time}:00`).getTime();
    if(isNaN(itemDateTime))return false;
    const triggerTime=itemDateTime-(item.alarm*60*1000);
    return triggerTime>(now-60000)&&triggerTime<oneDayLater&&!fired[`${item.id}_${triggerTime}`];
  });
  if(hasItem)return true;

  const hasRep=(S.reps||[]).some(r=>{
    if(!r.time||r.alarm===null||r.alarm===undefined)return false;
    if(!repOn(r,td))return false;
    if(S.rdone&&S.rdone[td+'|'+r.id])return false;
    if(S.skip&&S.skip[td+'|'+r.id])return false;
    const repDateTime=new Date(`${td}T${r.time}:00`).getTime();
    if(isNaN(repDateTime))return false;
    const triggerTime=repDateTime-(r.alarm*60*1000);
    return triggerTime>(now-60000)&&triggerTime<oneDayLater&&!fired[`rep_${r.id}_${td}_${triggerTime}`];
  });
  return hasRep;
}

function updateBgKeepAlive(){
  const enabled=S.cfg.bgKeepAlive!==false;
  const pending=hasPendingAlarms();
  if(document.hidden&&enabled&&pending){
    initBgAudio();
    bgAudio.play().catch(()=>{});
  }else{
    if(bgAudio){try{bgAudio.pause()}catch(e){}}
  }
}

let activeAudioCtx=null, activeMasterGain=null, activeSourceNodes=[], curAudioNode=null, isPreviewPlaying=false;

function updatePreviewBtnUI(){
  const btn=document.querySelector('[data-a="testsnd"]');
  if(btn){
    btn.textContent=isPreviewPlaying?'⏹️ 재생 정지':'소리 미리듣기 🔔';
    if(isPreviewPlaying)btn.classList.add('on');else btn.classList.remove('on');
  }
}

function stopAlarmSound(){
  activeSourceNodes.forEach(src=>{try{src.stop()}catch(e){}});
  activeSourceNodes=[];
  if(curAudioNode){try{curAudioNode.stop()}catch(e){};curAudioNode=null}
  if(activeAudioCtx){try{activeAudioCtx.close()}catch(e){};activeAudioCtx=null;activeMasterGain=null}
  if(isPreviewPlaying){isPreviewPlaying=false;updatePreviewBtnUI()}
}

function updatePlayingVolume(rawVol){
  const v=Math.max(0,Math.min(100,rawVol!==undefined?rawVol:80))/100;
  if(activeMasterGain&&activeAudioCtx&&activeAudioCtx.state==='running'){
    activeMasterGain.gain.setValueAtTime(v,activeAudioCtx.currentTime);
  }
}

async function playAlarmSound(type, customVol, isPreview){
  stopAlarmSound(); // 이전 재생 중인 음원을 즉시 중지하여 소리 겹침 방지

  type=type||S.cfg.alarmSound||'chime';
  const rawVol=customVol!==undefined?customVol:(S.cfg.alarmVol!==undefined?S.cfg.alarmVol:80);
  const volScale=Math.max(0,Math.min(100,rawVol))/100;
  if(volScale<=0)return;

  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    const ctx=new AudioCtx();
    activeAudioCtx=ctx;

    const masterGain=ctx.createGain();
    masterGain.gain.setValueAtTime(volScale,ctx.currentTime);
    masterGain.connect(ctx.destination);
    activeMasterGain=masterGain;

    if(isPreview){
      isPreviewPlaying=true;
      updatePreviewBtnUI();
    }

    // 1) 커스텀 음원 파일 재생
    if(type==='custom'){
      const custom=await idb('get','alarmSoundCustom');
      if(custom&&custom.buf){
        try{
          const audioBuffer=await ctx.decodeAudioData(custom.buf.slice(0));
          const src=ctx.createBufferSource();
          src.buffer=audioBuffer;
          src.connect(masterGain);
          src.onended=()=>{
            if(activeAudioCtx===ctx)stopAlarmSound();
          };
          src.start(0);
          curAudioNode=src;
          activeSourceNodes=[src];
          return;
        }catch(err){console.warn('커스텀 음원 디코딩 실패, 기본 사운드로 대체',err)}
      }
    }

    // 2) 내장 사운드 (Web Audio API)
    let totalDuration=0;
    if(type==='beep'){ // 디지털 시계 비프
      const beeps=[0, 0.15, 0.4, 0.55];
      totalDuration=0.65;
      beeps.forEach(st=>{
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type='square';
        osc.frequency.setValueAtTime(1046.50,ctx.currentTime+st);
        gain.gain.setValueAtTime(0.18,ctx.currentTime+st);
        gain.gain.setValueAtTime(0,ctx.currentTime+st+0.08);
        osc.connect(gain);gain.connect(masterGain);
        osc.start(ctx.currentTime+st);osc.stop(ctx.currentTime+st+0.09);
        activeSourceNodes.push(osc);
      });
    }else if(type==='bell'){ // 부드러운 종소리
      totalDuration=1.9;
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(880,ctx.currentTime);
      gain.gain.setValueAtTime(0.35,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+1.8);
      osc.connect(gain);gain.connect(masterGain);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+1.85);
      activeSourceNodes.push(osc);
    }else if(type==='marimba'){ // 마림바 멜로디
      totalDuration=0.65;
      const seq=[{f:440,t:0},{f:554.37,t:0.12},{f:659.25,t:0.24},{f:880,t:0.36}];
      seq.forEach(n=>{
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type='sine';
        osc.frequency.setValueAtTime(n.f,ctx.currentTime+n.t);
        gain.gain.setValueAtTime(0.3,ctx.currentTime+n.t);
        gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+n.t+0.25);
        osc.connect(gain);gain.connect(masterGain);
        osc.start(ctx.currentTime+n.t);osc.stop(ctx.currentTime+n.t+0.28);
        activeSourceNodes.push(osc);
      });
    }else{ // chime (기본: 맑은 차임)
      totalDuration=1.5;
      const notes=[
        {f:523.25,t:0.00,d:0.18},
        {f:659.25,t:0.15,d:0.18},
        {f:783.99,t:0.30,d:0.22},
        {f:1046.50,t:0.48,d:0.38},
        {f:783.99,t:0.85,d:0.18},
        {f:1046.50,t:1.00,d:0.45}
      ];
      notes.forEach(n=>{
        const osc=ctx.createOscillator();
        const gain=ctx.createGain();
        osc.type='triangle';
        osc.frequency.setValueAtTime(n.f,ctx.currentTime+n.t);
        gain.gain.setValueAtTime(0.25,ctx.currentTime+n.t);
        gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+n.t+n.d);
        osc.connect(gain);gain.connect(masterGain);
        osc.start(ctx.currentTime+n.t);osc.stop(ctx.currentTime+n.t+n.d+0.05);
        activeSourceNodes.push(osc);
      });
    }

    setTimeout(()=>{
      if(activeAudioCtx===ctx)stopAlarmSound();
    }, (totalDuration+0.1)*1000);

  }catch(e){console.warn('알람 소리 재생 실패:',e);stopAlarmSound()}
}
