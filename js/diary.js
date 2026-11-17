/* js/diary.js - [기록] 탭, 암호화 잠금, 일기 저장 및 지난 일기 목록 모아보기 */
let U=false,OPEN=new Set();

function lockHTML(){
  const has=!!S.cfg.pw;
  return `<div class="hd"><h1>기록</h1></div><div class="lk"><p class="mu">${has?'비밀번호를 입력하면 열려요.':'처음이에요. 비밀번호를 정해 주세요. 일기는 기본적으로 잠겨요.'}</p><input id="pw" class="in" type="password" placeholder="비밀번호" autocomplete="off" aria-label="비밀번호">${has?'':'<input id="pw2" class="in" type="password" placeholder="한 번 더" autocomplete="off" aria-label="비밀번호 확인">'}<p class="mu" id="pwm" style="margin:0 0 8px"></p><button class="ch on" data-a="unlock">${has?'열기':'정하고 열기'}</button></div><div id="ls"></div>`;
}

const phHTML=a=>a&&a.length?`<div class="ph">${a.map((s,n)=>`<span><img src="${s}" alt="첨부 사진"><button data-a="phd" data-n="${n}" aria-label="사진 삭제">✕</button></span>`).join('')}</div>`:'';

function diaryListHTML(){
  const dates = Object.keys(S.diary || {}).filter(k => {
    const d = S.diary[k];
    return d && ((d.title && d.title.trim()) || (d.text && d.text.trim()) || (d.photos && d.photos.length > 0));
  });
  dates.sort((a, b) => b.localeCompare(a));

  if (dates.length === 0) {
    return `
      <div class="diary-list">
        <div style="font-size:15px;font-weight:600;margin-bottom:8px;color:var(--tx)">📖 지난 일기 모아보기</div>
        <p class="mu" style="font-size:13px;text-align:center;padding:24px 0">아직 작성된 일기가 없어요.<br>오늘의 소중한 일기를 적어보세요 ✍️</p>
      </div>
    `;
  }

  return `
    <div class="diary-list">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:15px;font-weight:600;color:var(--tx)">📖 지난 일기 모아보기 (${dates.length}편)</div>
        <span class="mu" style="font-size:12px">터치하면 바로 읽고 수정해요</span>
      </div>
      ${dates.map(dateKey => {
        const dy = S.diary[dateKey];
        const dObj = dkey(dateKey);
        const isCur = dateKey === sel;
        const dateStr = `${dObj.getFullYear()}년 ${dObj.getMonth()+1}월 ${dObj.getDate()}일 (${WD[dObj.getDay()]})`;
        const title = dy.title && dy.title.trim() ? dy.title : '제목 없음';
        const preview = dy.text && dy.text.trim() ? dy.text : (dy.photos && dy.photos.length ? '[사진 첨부됨]' : '내용 없음');

        return `
          <div class="diary-card${isCur ? ' on-sel' : ''}" data-a="gody" data-d="${dateKey}">
            <div class="diary-card-header">
              <span class="diary-card-date">${dateStr} ${isCur ? '<b style="color:var(--ac);font-size:11px">[선택됨]</b>' : ''}</span>
              <button class="tx mu" style="font-size:12px;color:var(--no)" data-a="dydel" data-d="${dateKey}">삭제</button>
            </div>
            <div class="diary-card-title">${esc(title)}</div>
            <div class="diary-card-body">${esc(preview)}</div>
            ${dy.photos && dy.photos.length ? `
              <div class="diary-card-thumbs">
                ${dy.photos.slice(0, 4).map(img => `<img src="${img}" alt="사진">`).join('')}
                ${dy.photos.length > 4 ? `<span class="mu" style="font-size:11px;align-self:center">+${dy.photos.length-4}장</span>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function recHTML(){
  if(S.cfg.lock&&!U) return lockHTML();
  const d=dkey(sel),hn=holiday(sel),it=itemsOn(sel),dy=S.diary[sel]||{};

  return `<div class="hd"><div><p class="mu${isRed(sel)?' hl':isSat(sel)?' bl':''}" style="margin:0">${WD[d.getDay()]}요일${hn?' · '+hn:''}${wxT(sel)}</p><h1>${d.getMonth()+1}월 ${d.getDate()}일</h1></div><div><button class="nv" data-a="rd" data-n="-1" aria-label="전날">‹</button><button class="nv" data-a="rd" data-n="1" aria-label="다음날">›</button></div></div><div id="ls">`
    + (it.length ? it.map(i=>{
        const o=OPEN.has(i.id);
        return `<div class="rc"><div class="r" style="border:0"><button class="ck${i.done?' dn':''}" role="checkbox" aria-checked="${i.done}" aria-label="완료 표시" data-a="done" data-id="${i.id}"></button><button class="rb" data-a="ropen" data-id="${i.id}" aria-expanded="${o}"><span class="mu tm">${fmtTime(i.time)}</span><span class="ti${i.done?' dd':''}">${esc(i.title)}</span><span class="mu">${o?'접기':'자세히'}</span></button></div>${o?`<textarea class="in rt" data-id="${i.id}" rows="4" placeholder="이 일정에 대해 자세히 적어요" aria-label="자세히">${esc(i.detail||'')}</textarea><button class="rd" data-a="rm" data-id="${i.id}">일정 삭제</button>`:''}</div>`;
      }).join('') : '')
    + `<div class="rc" style="background:var(--sf);border:1px solid var(--bd);border-radius:18px;padding:16px;margin:10px 0 16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <b style="font-size:15px;color:var(--tx)">📝 ${d.getMonth()+1}월 ${d.getDate()}일 일기 쓰기</b>
          <span class="mu" style="font-size:12px">${WD[d.getDay()]}요일</span>
        </div>
        <input id="dy-t" class="in" data-dt="1" placeholder="일기 제목을 적어보세요" value="${esc(dy.title||'')}" aria-label="일기 제목" style="margin-bottom:8px">
        <textarea id="dy-b" class="in rt" data-day="1" rows="7" placeholder="오늘 하루 어떤 일이 있었나요? 자유롭게 적어보세요 🌿" aria-label="일기">${esc(dy.text||'')}</textarea>
        ${phHTML(dy.photos)}
        <div class="rw" style="gap:8px;margin-top:10px">
          <button class="ch" data-a="pho">📷 사진 추가</button>
          <button class="ch pr" style="flex:1" data-a="dysave">💾 일기 저장 / 확인</button>
        </div>
      </div>`
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

A.relock=()=>{U=false;render();};
A.rd=d=>{setSel(shift(sel,+d.n));render();};
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

const FI=document.createElement('input');FI.type='file';FI.accept='image/*';FI.hidden=true;document.body.appendChild(FI);
FI.onchange=async()=>{
  const f=FI.files[0];FI.value='';if(!f)return;
  phArr().push(await shrink(f));
  save();
  render();
  toast('사진을 첨부했어요 📷');
};

A.pho=()=>FI.click();
A.phd=d=>{phArr().splice(+d.n,1);save();render();toast('사진을 삭제했어요');};

A.dysave=()=>{
  const t=($('dy-t')?.value||'').trim();
  const b=($('dy-b')?.value||'').trim();
  dayRec().title=t;
  dayRec().text=b;
  save();
  render();
  toast('일기가 성공적으로 저장되었어요 ✨');
};

A.gody=d=>{
  setSel(d.d);
  render();
  toast(`[${d.d}] 일기로 이동했어요 📝`);
};

A.dydel=d=>{
  const dateKey=d.d;
  const backup=JSON.parse(JSON.stringify(S.diary[dateKey]||null));
  delete S.diary[dateKey];
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
});

document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.dt){dayRec().title=t.value;save();return;}
  if(!t.classList.contains('rt')) return;
  if(t.dataset.day){dayRec().text=t.value;save();}
  else if(t.dataset.id){updItem(t.dataset.id,{detail:t.value});}
});
