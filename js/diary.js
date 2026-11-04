/* js/diary.js - [기록] 탭, 암호화 잠금 및 사진 압축 */
/* record.js: 기록 탭 */
let U=false,OPEN=new Set();
const hash=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('dg'+s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
function lockHTML(){const has=!!S.cfg.pw;return `<div class="hd"><h1>기록</h1></div><div class="lk"><p class="mu">${has?'비밀번호를 입력하면 열려요.':'처음이에요. 비밀번호를 정해 주세요. 일기는 기본적으로 잠겨요.'}</p><input id="pw" class="in" type="password" placeholder="비밀번호" autocomplete="off" aria-label="비밀번호">${has?'':'<input id="pw2" class="in" type="password" placeholder="한 번 더" autocomplete="off" aria-label="비밀번호 확인">'}<p class="mu" id="pwm" style="margin:0 0 8px"></p><button class="ch on" data-a="unlock">${has?'열기':'정하고 열기'}</button></div><div id="ls"></div>`}
const phHTML=a=>a&&a.length?`<div class="ph">${a.map((s,n)=>`<span><img src="${s}" alt="첨부 사진"><button data-a="phd" data-n="${n}" aria-label="사진 삭제">✕</button></span>`).join('')}</div>`:'';
function recHTML(){if(S.cfg.lock&&!U)return lockHTML();
const d=dkey(sel),hn=holiday(sel),it=itemsOn(sel),dy=S.diary[sel]||{};
return `<div class="hd"><div><p class="mu${isRed(sel)?' hl':isSat(sel)?' bl':''}" style="margin:0">${WD[d.getDay()]}요일${hn?' · '+hn:''}${wxT(sel)}</p><h1>${d.getMonth()+1}월 ${d.getDate()}일</h1></div><div><button class="nv" data-a="rd" data-n="-1" aria-label="전날">‹</button><button class="nv" data-a="rd" data-n="1" aria-label="다음날">›</button></div></div><div id="ls">`
+it.map(i=>{const o=OPEN.has(i.id);return `<div class="rc"><div class="r" style="border:0"><button class="ck${i.done?' dn':''}" role="checkbox" aria-checked="${i.done}" aria-label="완료 표시" data-a="done" data-id="${i.id}"></button><button class="rb" data-a="ropen" data-id="${i.id}" aria-expanded="${o}"><span class="mu tm">${fmtTime(i.time)}</span><span class="ti${i.done?' dd':''}">${esc(i.title)}</span><span class="mu">${o?'접기':'자세히'}</span></button></div>${o?`<textarea class="in rt" data-id="${i.id}" rows="4" placeholder="이 일정에 대해 자세히 적어요" aria-label="자세히">${esc(i.detail||'')}</textarea><button class="rd" data-a="rm" data-id="${i.id}">일정 삭제</button>`:''}</div>`}).join('')
+`<div class="rc"><p class="mu" style="margin:0 0 4px">이 날의 일기</p><input class="in" data-dt="1" placeholder="제목" value="${esc(dy.title||'')}" aria-label="일기 제목"><textarea class="in rt" data-day="1" rows="7" placeholder="자유롭게 적어요" aria-label="일기">${esc(dy.text||'')}</textarea>${phHTML(dy.photos)}<button class="ch" data-a="pho">사진 추가</button></div><button class="ch" style="margin:12px 0" data-a="relock">지금 잠그기</button></div>`}
A.unlock=async()=>{const p=$('pw').value,m=$('pwm');if(S.cfg.pw){if(await hash(p)===S.cfg.pw){U=true;render()}else m.textContent='비밀번호가 달라요.'}else{if(p.length<4){m.textContent='4자 이상으로 정해 주세요.';return}if(p!==$('pw2').value){m.textContent='두 번 입력한 게 달라요.';return}S.cfg.pw=await hash(p);save();U=true;render()}};
A.relock=()=>{U=false;render()};
A.rd=d=>{setSel(shift(sel,+d.n));render()};
const dayRec=()=>S.diary[sel]||(S.diary[sel]={text:'',photos:[]});
const phArr=()=>{const y=dayRec();return y.photos||(y.photos=[])};
A.ropen=d=>{OPEN.has(d.id)?OPEN.delete(d.id):OPEN.add(d.id);render()};
const shrink=f=>new Promise(ok=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.65))};im.src=r.result};r.readAsDataURL(f)});
const FI=document.createElement('input');FI.type='file';FI.accept='image/*';FI.hidden=true;document.body.appendChild(FI);
FI.onchange=async()=>{const f=FI.files[0];FI.value='';if(!f)return;phArr().push(await shrink(f));save();render()};
A.pho=()=>FI.click();
A.phd=d=>{phArr().splice(+d.n,1);save();render()};
document.addEventListener('keydown',e=>{if(e.target.id==='pw'&&e.key==='Enter'&&S.cfg.pw)A.unlock()});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.dt){dayRec().title=t.value;save();return}if(!t.classList.contains('rt'))return;if(t.dataset.day){dayRec().text=t.value;save()}else updItem(t.dataset.id,{detail:t.value})});
