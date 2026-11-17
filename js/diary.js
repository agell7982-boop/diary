/* js/diary.js - [기록] 탭, 암호화 잠금, 일기 저장 및 지난 일기 목록 모아보기 */
let U=false,OPEN=new Set();
let EDITING_DAY=null;

function hasDiary(k){
  const d=S.diary&&S.diary[k];
  return !!(d&&((d.title&&d.title.trim())||(d.text&&d.text.trim())||(d.photos&&d.photos.length>0)));
}

function lockHTML(){
  const has=!!S.cfg.pw;
  return `<div class="hd"><h1>기록</h1></div><div class="lk"><p class="mu">${has?'비밀번호를 입력하면 열려요.':'처음이에요. 비밀번호를 정해 주세요. 일기는 기본적으로 잠겨요.'}</p><input id="pw" class="in" type="password" placeholder="비밀번호" autocomplete="off" aria-label="비밀번호">${has?'':'<input id="pw2" class="in" type="password" placeholder="한 번 더" autocomplete="off" aria-label="비밀번호 확인">'}<p class="mu" id="pwm" style="margin:0 0 8px"></p><button class="ch on" data-a="unlock">${has?'열기':'정하고 열기'}</button>${has?`<button class="ch" style="margin-top:14px;font-size:12px;border:none;background:none;color:var(--mu);text-decoration:underline;cursor:pointer" data-a="pwlost">비밀번호를 분실하셨나요?</button>`:''}</div><div id="ls"></div>`;
}

const phHTML=(a,canDelete=true)=>a&&a.length?`
  <div class="ph" style="margin-top:10px">
    ${a.map((s,n)=>`
      <span style="position:relative;display:inline-block">
        <img src="${s}" alt="첨부 사진" data-a="phview" data-n="${n}" style="cursor:zoom-in" title="터치하여 크게 보기">
        ${canDelete?`<button data-a="phd" data-n="${n}" aria-label="사진 삭제" style="position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer">✕</button>`:''}
      </span>
    `).join('')}
  </div>
`:'';

let CURRENT_PHOTO_IDX = 0;

function updateLightboxPhoto(newIdx){
  const photos=phArr();
  if(!photos||!photos.length)return;
  if(newIdx<0) newIdx=photos.length-1;
  else if(newIdx>=photos.length) newIdx=0;
  CURRENT_PHOTO_IDX=newIdx;

  const imgEl=document.getElementById('photo-lb-img');
  const countEl=document.getElementById('photo-lb-counter');
  const dotsEl=document.getElementById('photo-lb-dots');

  if(imgEl){
    imgEl.style.opacity='0.2';
    imgEl.style.transform='scale(0.96)';
    setTimeout(()=>{
      imgEl.src=photos[CURRENT_PHOTO_IDX];
      imgEl.style.opacity='1';
      imgEl.style.transform='scale(1)';
    },100);
  }
  if(countEl){
    countEl.textContent=`${CURRENT_PHOTO_IDX+1} / ${photos.length}`;
  }
  if(dotsEl){
    dotsEl.innerHTML=photos.map((_,i)=>`<span class="photo-dot${i===CURRENT_PHOTO_IDX?' active':''}"></span>`).join('');
  }
}

function showPhotoLightbox(idx){
  const photos=phArr();
  if(!photos||!photos[idx])return;
  CURRENT_PHOTO_IDX=idx;
  const exist=document.getElementById('photo-lightbox');
  if(exist)exist.remove();

  const div=document.createElement('div');
  div.id='photo-lightbox';
  div.className='photo-lightbox-ov';
  const hasMultiple=photos.length>1;

  div.innerHTML=`
    <button class="photo-lightbox-close" data-a="closephoto" aria-label="닫기">✕</button>
    ${hasMultiple ? `
      <button class="photo-lightbox-nav photo-lightbox-prev" data-a="phprev" aria-label="이전 사진">‹</button>
      <button class="photo-lightbox-nav photo-lightbox-next" data-a="phnext" aria-label="다음 사진">›</button>
    ` : ''}
    <div style="position:relative;display:flex;align-items:center;justify-content:center;max-width:100%;max-height:76vh">
      <img id="photo-lb-img" class="photo-lightbox-img" src="${photos[idx]}" alt="확대 사진">
    </div>
    <div id="photo-lb-counter" class="photo-lightbox-counter">${idx+1} / ${photos.length}</div>
    ${hasMultiple ? `
      <div id="photo-lb-dots" class="photo-lightbox-dots">
        ${photos.map((_,i)=>`<span class="photo-dot${i===idx?' active':''}"></span>`).join('')}
      </div>
      <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:6px 0 0">👈 손가락으로 좌우 쓸어 넘겨보세요 👉</p>
    ` : ''}
  `;

  // 터치 스와이프 제스처 이벤트
  let startX=0, startY=0, isMoving=false;
  div.addEventListener('touchstart', e=>{
    if(e.touches&&e.touches[0]){
      startX=e.touches[0].clientX;
      startY=e.touches[0].clientY;
      isMoving=false;
    }
  }, {passive:true});

  div.addEventListener('touchmove', e=>{
    if(e.touches&&e.touches[0]){
      const diffX=e.touches[0].clientX-startX;
      const diffY=e.touches[0].clientY-startY;
      if(Math.abs(diffX)>Math.abs(diffY)){
        isMoving=true;
      }
    }
  }, {passive:true});

  div.addEventListener('touchend', e=>{
    if(e.changedTouches&&e.changedTouches[0]){
      const endX=e.changedTouches[0].clientX;
      const endY=e.changedTouches[0].clientY;
      const diffX=endX-startX;
      const diffY=endY-startY;
      if(Math.abs(diffX)>35 && Math.abs(diffX)>Math.abs(diffY)){
        if(diffX<0){
          // 왼쪽으로 스와이프 -> 다음 사진
          updateLightboxPhoto(CURRENT_PHOTO_IDX+1);
        }else{
          // 오른쪽으로 스와이프 -> 이전 사진
          updateLightboxPhoto(CURRENT_PHOTO_IDX-1);
        }
      }
    }
  }, {passive:true});

  div.addEventListener('click', e=>{
    if(e.target.id==='photo-lightbox'||e.target.classList.contains('photo-lightbox-close')){
      closePhotoLightbox();
    }
  });

  document.body.appendChild(div);
  try{
    history.pushState({ modal:'photo' }, '');
  }catch(e){}
}

function closePhotoLightbox(){
  const el=document.getElementById('photo-lightbox');
  if(el){el.remove();return true;}
  return false;
}
A.closephoto=closePhotoLightbox;
A.phview=d=>showPhotoLightbox(+d.n);
A.phprev=()=>updateLightboxPhoto(CURRENT_PHOTO_IDX-1);
A.phnext=()=>updateLightboxPhoto(CURRENT_PHOTO_IDX+1);

function diaryListHTML(){
  const dates=Object.keys(S.diary||{}).filter(k=>hasDiary(k));
  dates.sort((a,b)=>b.localeCompare(a));

  if(dates.length===0){
    return `
      <div class="diary-list">
        <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:var(--tx)">📖 지난 일기 모아보기</div>
        <p class="mu" style="font-size:13px;text-align:center;padding:24px 0">아직 작성된 일기가 없어요.<br>소중한 오늘 하루를 기록해 보세요 ✍️</p>
      </div>
    `;
  }

  return `
    <div class="diary-list">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:15px;font-weight:600;color:var(--tx)">📖 지난 일기 모아보기 (${dates.length}편)</div>
        <span class="mu" style="font-size:12px">터치하면 읽을 수 있어요</span>
      </div>
      <div class="diary-compact-list">
        ${dates.map(dateKey=>{
          const dy=S.diary[dateKey];
          const dObj=dkey(dateKey);
          const isCur=dateKey===sel;
          const dateStr=`${dObj.getFullYear()}.${pad(dObj.getMonth()+1)}.${pad(dObj.getDate())} (${WD[dObj.getDay()]})`;
          const title=(dy.title&&dy.title.trim())?dy.title:'(제목 없음)';
          const hasPhoto=dy.photos&&dy.photos.length>0;
          const wxIcon=dy.weather?dy.weather.slice(0,2):'';

          return `
            <div class="diary-row-item${isCur?' on-sel':''}" data-a="gody" data-d="${dateKey}">
              <div style="flex:1;min-width:0;display:flex;align-items:center;gap:8px">
                <span class="diary-row-date">${dateStr}${wxIcon?' '+wxIcon:''}</span>
                <span class="diary-row-title">${esc(title)}</span>
                ${hasPhoto?`<span style="font-size:11px;opacity:0.75">📷${dy.photos.length}</span>`:''}
              </div>
              ${isCur?'<span class="diary-row-badge">읽는 중</span>':'<span class="mu" style="font-size:12px">›</span>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function recHTML(){
  if(S.cfg.lock&&!U)return lockHTML();
  const d=dkey(sel),hn=holiday(sel),it=itemsOn(sel),dy=S.diary[sel]||{};
  const isSaved=hasDiary(sel);
  const isEditing=EDITING_DAY===sel||!isSaved;
  const curWx=dy.weather||wxS(sel);

  return `<div class="hd"><div><p class="mu${isRed(sel)?' hl':isSat(sel)?' bl':''}" style="margin:0">${WD[d.getDay()]}요일${hn?' · '+hn:''}${curWx?' · '+esc(curWx):wxT(sel)}</p><h1>${d.getMonth()+1}월 ${d.getDate()}일</h1></div><div><button class="nv" data-a="rd" data-n="-1" aria-label="전날">‹</button><button class="nv" data-a="rd" data-n="1" aria-label="다음날">›</button></div></div><div id="ls">`
    + (it.length ? it.map(i=>{
        const o=OPEN.has(i.id);
        return `<div class="rc"><div class="r" style="border:0"><button class="ck${i.done?' dn':''}" role="checkbox" aria-checked="${i.done}" aria-label="완료 표시" data-a="done" data-id="${i.id}"></button><button class="rb" data-a="ropen" data-id="${i.id}" aria-expanded="${o}"><span class="mu tm">${fmtTime(i.time)}</span><span class="ti${i.done?' dd':''}">${esc(i.title)}</span><span class="mu">${o?'접기':'자세히'}</span></button></div>${o?`<textarea class="in rt" data-id="${i.id}" rows="4" placeholder="이 일정에 대해 자세히 적어요" aria-label="자세히">${esc(i.detail||'')}</textarea><button class="rd" data-a="rm" data-id="${i.id}">일정 삭제</button>`:''}</div>`;
      }).join('') : '')
    + (!isEditing ? `
      <!-- 읽기 전용 모드 -->
      <div class="rc" style="background:var(--sf);border:1px solid var(--bd);border-radius:18px;padding:18px;margin:10px 0 16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div style="flex:1;min-width:0;padding-right:10px">
            <span class="mu" style="font-size:12px;display:block;margin-bottom:2px">${WD[d.getDay()]}요일${curWx?' · '+esc(curWx):''}</span>
            <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--tx);line-height:1.4">${esc(dy.title || '(제목 없음)')}</h2>
          </div>
          <button class="ch pr" data-a="dyedit" style="flex:none;white-space:nowrap;padding:6px 12px;font-size:13px">✏️ 일기 수정</button>
        </div>
        <div style="font-size:14px;line-height:1.75;color:var(--tx);white-space:pre-wrap;margin:12px 0;min-height:50px">${esc(dy.text || '(작성된 내용이 없습니다)')}</div>
        ${phHTML(dy.photos, false)}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:10px;border-top:1px solid var(--bd)">
          <button class="tx mu" style="font-size:12px;color:var(--no)" data-a="dydel" data-d="${sel}">일기 삭제</button>
          <button class="ch" data-a="dyedit">✏️ 수정하기</button>
        </div>
      </div>
    ` : `
      <!-- 작성 및 수정 모드 -->
      <div class="rc" style="background:var(--sf);border:1px solid var(--bd);border-radius:18px;padding:16px;margin:10px 0 16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b style="font-size:15px;color:var(--tx)">📝 ${d.getMonth()+1}월 ${d.getDate()}일 일기 ${isSaved ? '수정하기' : '쓰기'}</b>
          <span class="mu" style="font-size:12px">${WD[d.getDay()]}요일</span>
        </div>
        <!-- 날씨 선택 및 저장 UI -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin:4px 0 10px;padding:6px 10px;background:var(--bg);border:1px solid var(--bd);border-radius:12px">
          <div style="font-size:13px;display:flex;align-items:center;gap:6px">
            <span class="mu">날씨:</span>
            <b style="color:var(--tx)">${esc(dy.weather || wxS(sel) || '☀️ 맑음')}</b>
          </div>
          <div class="rw" style="gap:2px">
            ${['☀️','🌤️','☁️','🌧️','🌨️'].map(w=>`<button type="button" class="mm${(dy.weather||wxS(sel)||'').startsWith(w)?' on':''}" data-a="dywx" data-w="${w}" style="font-size:15px;min-width:30px;height:30px;border-radius:6px;padding:0">${w}</button>`).join('')}
          </div>
        </div>
        <input id="dy-t" class="in" data-dt="1" placeholder="일기 제목을 적어보세요" value="${esc(dy.title||'')}" aria-label="일기 제목" style="margin-bottom:8px">
        <textarea id="dy-b" class="in rt" data-day="1" rows="7" placeholder="오늘 하루 어떤 일이 있었나요? 자유롭게 적어보세요 🌿" aria-label="일기">${esc(dy.text||'')}</textarea>
        ${phHTML(dy.photos, true)}
        <div class="rw" style="gap:8px;margin-top:10px">
          <button class="ch" data-a="pho">📷 사진 추가 (${(dy.photos||[]).length}/5)</button>
          ${isSaved ? `<button class="ch" data-a="dycancel">수정 취소</button>` : ''}
          <button class="ch pr" style="flex:1" data-a="dysave">💾 일기 저장 / 확인</button>
        </div>
      </div>
    `)
    + diaryListHTML()
    + `<button class="ch" style="margin:16px 0 28px;width:100%" data-a="relock">🔒 일기장 지금 잠그기</button></div>`;
}

A.unlock=async()=>{
  const p=$('pw').value,m=$('pwm');
  if(S.cfg.pw){
    if(await hash(p)===S.cfg.pw){U=true;render();}
    else m.textContent='비밀번호가 달라요.';
  }else{
    if(p.length<4){m.textContent='4자 이상으로 정해 주세요.';return;}
    if(p!==$('pw2').value){m.textContent='두 번 입력한 게 달라요.';return;}
    S.cfg.pw=await hash(p);
    save();
    U=true;
    render();
  }
};

A.relock=()=>{U=false;EDITING_DAY=null;render();};
A.pwlost=()=>{
  if(confirm('비밀번호를 분실하셨나요?\n\n비밀번호를 초기화하고 일기장을 여시겠습니까?\n(작성된 일기와 사진 등 모든 데이터는 안전하게 유지됩니다)')){
    S.cfg.pw=null;
    save();
    U=true;
    render();
    toast('비밀번호가 초기화되었습니다. [설정]에서 새 비밀번호를 등록해 주세요.');
  }
};
A.rd=d=>{EDITING_DAY=null;setSel(shift(sel,+d.n));render();};
const dayRec=()=>S.diary[sel]||(S.diary[sel]={text:'',photos:[]});
const phArr=()=>{const y=dayRec();return y.photos||(y.photos=[]);};
A.ropen=d=>{OPEN.has(d.id)?OPEN.delete(d.id):OPEN.add(d.id);render();};

const shrink=f=>new Promise(ok=>{
  const r=new FileReader();
  r.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const s=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');
      c.width=im.width*s;
      c.height=im.height*s;
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      ok(c.toDataURL('image/jpeg',.65));
    };
    im.src=r.result;
  };
  r.readAsDataURL(f);
});

const FI=document.createElement('input');
FI.type='file';
FI.accept='image/*';
FI.multiple=true;
FI.hidden=true;
document.body.appendChild(FI);

FI.onchange=async()=>{
  const files=Array.from(FI.files||[]);
  FI.value='';
  if(!files.length)return;
  const cur=phArr();
  if(cur.length>=5){
    toast('사진은 최대 5장까지 첨부할 수 있어요 (현재 5장)');
    return;
  }
  const available=5-cur.length;
  const toProcess=files.slice(0,available);
  if(files.length>available){
    toast(`사진은 최대 5장까지 가능하여 ${available}장만 추가됩니다.`);
  }
  let added=0;
  for(const f of toProcess){
    if(f.size>15*1024*1024){
      toast(`[${f.name}] 파일이 15MB를 초과하여 제외되었습니다.`);
      continue;
    }
    try{
      const shrunk=await shrink(f);
      cur.push(shrunk);
      added++;
    }catch(e){}
  }
  if(added>0){
    save();
    render();
    toast(`사진 ${added}장을 첨부했어요 📷`);
  }
};

A.pho=()=>FI.click();
A.phd=d=>{phArr().splice(+d.n,1);save();render();toast('사진을 삭제했어요');};

const WX_MAP = {
  '☀️': '☀️ 맑음',
  '🌤️': '🌤️ 구름조금',
  '☁️': '☁️ 흐림',
  '🌧️': '🌧️ 비',
  '🌨️': '🌨️ 눈'
};

A.dywx=d=>{
  const rec=dayRec();
  const t=$('dy-t');
  const b=$('dy-b');
  if(t) rec.title=t.value;
  if(b) rec.text=b.value;
  rec.weather=WX_MAP[d.w]||d.w;
  save();
  render();
};

A.dyedit=()=>{
  EDITING_DAY=sel;
  render();
};

A.dycancel=()=>{
  EDITING_DAY=null;
  render();
};

A.dysave=()=>{
  const t=($('dy-t')?.value||'').trim();
  const b=($('dy-b')?.value||'').trim();
  const rec=dayRec();
  rec.title=t;
  rec.text=b;
  if(!rec.weather){
    rec.weather=wxS(sel)||'☀️ 맑음';
  }
  EDITING_DAY=null;
  save();
  render();
  toast('일기와 날씨가 성공적으로 저장되었어요 ✨');
};

A.gody=d=>{
  EDITING_DAY=null;
  setSel(d.d);
  render();
  toast(`[${d.d}] 일기로 이동했어요 📖`);
};

A.dydel=d=>{
  const dateKey=d.d;
  const backup=JSON.parse(JSON.stringify(S.diary[dateKey]||null));
  delete S.diary[dateKey];
  EDITING_DAY=null;
  save();
  render();
  toast(`[${dateKey}] 일기를 삭제했어요`, '되돌리기', ()=>{
    if(backup){
      S.diary[dateKey]=backup;
      save();
      render();
    }
  });
};

document.addEventListener('keydown',e=>{
  if((e.target.id==='pw'||e.target.id==='pw2')&&e.key==='Enter') A.unlock();
  const lb=document.getElementById('photo-lightbox');
  if(lb){
    if(e.key==='ArrowLeft') A.phprev();
    else if(e.key==='ArrowRight') A.phnext();
    else if(e.key==='Escape') closePhotoLightbox();
  }
});

document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.dt){dayRec().title=t.value;save();return;}
  if(!t.classList.contains('rt')) return;
  if(t.dataset.day){dayRec().text=t.value;save();}
  else if(t.dataset.id){updItem(t.dataset.id,{detail:t.value});}
});
