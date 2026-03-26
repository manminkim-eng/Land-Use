/* ═══════════════════════════════════════════════════════
   MANMIN PWA — pwa.js  Ver 1.0
   ① Service Worker 등록
   ② 설치 배너 (하단 슬라이드업)
   ③ 헤더 "설치" 버튼 주입
   ④ iOS Safari 안내 팝업
   ⑤ 오프라인·온라인 토스트
   ⑥ SW 업데이트 감지
═══════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─────────────────────────────────────
   1. Service Worker 등록
───────────────────────────────────── */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./'})
      .then(reg=>{
        reg.addEventListener('updatefound',()=>{
          const nw = reg.installing;
          nw.addEventListener('statechange',()=>{
            if(nw.state==='installed' && navigator.serviceWorker.controller) showUpdateBanner();
          });
        });
      }).catch(e=>console.warn('[PWA] SW 등록 실패:',e));
  });
}

/* ─────────────────────────────────────
   2. Install Prompt 저장
───────────────────────────────────── */
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  deferredPrompt = e;
  // 2초 후 배너 + 헤더 버튼 표시
  setTimeout(()=>{
    showInstallBanner();
    injectHeaderBtn();
  }, 2000);
});

window.addEventListener('appinstalled', ()=>{
  deferredPrompt = null;
  hideBanner('pwa-banner');
  removeHeaderBtn();
  pwToast('✅ MANMIN 앱이 설치되었습니다!', 'ok');
  localStorage.setItem('pwa-installed','1');
});

/* ─────────────────────────────────────
   3. CSS 한 번에 주입
───────────────────────────────────── */
function injectCSS(){
  if(document.getElementById('pwa-style')) return;
  const s = document.createElement('style');
  s.id = 'pwa-style';
  s.textContent = `
/* ── PWA 설치 배너 ── */
#pwa-banner{
  position:fixed;bottom:0;left:0;right:0;z-index:9999;
  background:rgba(9,20,38,.97);
  backdrop-filter:blur(18px);
  border-top:1px solid rgba(0,194,168,.28);
  box-shadow:0 -4px 32px rgba(0,0,0,.55);
  transform:translateY(100%);
  transition:transform .4s cubic-bezier(.4,0,.2,1);
  padding-bottom:env(safe-area-inset-bottom,0px);
}
#pwa-banner.show{transform:translateY(0)}
.pwa-b-inner{
  max-width:680px;margin:0 auto;
  display:flex;align-items:center;gap:14px;
  padding:13px 18px calc(13px + env(safe-area-inset-bottom,0px));
}
.pwa-b-icon{
  width:50px;height:50px;border-radius:13px;object-fit:cover;flex-shrink:0;
  box-shadow:0 0 14px rgba(0,194,168,.35);
}
.pwa-b-text{flex:1;min-width:0}
.pwa-b-title{font-family:'Noto Sans KR',sans-serif;font-size:15px;font-weight:700;color:#E8F4F2;line-height:1.2}
.pwa-b-sub{font-size:11px;color:#6B8FA3;margin-top:3px}
.pwa-b-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.pwa-dismiss{
  width:30px;height:30px;border-radius:50%;
  background:transparent;border:1px solid rgba(107,143,163,.35);
  color:#6B8FA3;font-size:13px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s;padding:0;
}
.pwa-dismiss:hover{background:rgba(107,143,163,.2);color:#E8F4F2}
.pwa-install-btn{
  background:linear-gradient(135deg,#00C2A8,#00E5C8);
  color:#0B1B2E;border:none;border-radius:9px;
  padding:9px 18px;
  font-family:'Noto Sans KR',sans-serif;font-size:13px;font-weight:900;
  cursor:pointer;white-space:nowrap;letter-spacing:.02em;
  box-shadow:0 4px 16px rgba(0,194,168,.4);
  transition:all .25s;
}
.pwa-install-btn:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,194,168,.55)}
.pwa-install-btn:active{transform:translateY(0)}

/* ── 헤더 설치 버튼 ── */
#pwa-hdr-btn{
  display:none;align-items:center;gap:5px;
  background:linear-gradient(135deg,#00C2A8,#00E5C8);
  color:#0B1B2E;border:none;border-radius:8px;
  padding:7px 13px;
  font-family:'Noto Sans KR',sans-serif;font-size:12px;font-weight:900;
  cursor:pointer;white-space:nowrap;letter-spacing:.02em;
  box-shadow:0 3px 12px rgba(0,194,168,.38);
  transition:all .25s;
  animation:pwaPulse 2.5s ease-in-out infinite;
}
@keyframes pwaPulse{0%,100%{box-shadow:0 3px 12px rgba(0,194,168,.38)}50%{box-shadow:0 3px 22px rgba(0,194,168,.7)}}
#pwa-hdr-btn.show{display:flex}
#pwa-hdr-btn:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,194,168,.6);animation:none}
.pwa-hdr-ico{font-size:14px}

/* ── 업데이트 배너 ── */
#pwa-update-banner{
  position:fixed;top:70px;left:50%;transform:translateX(-50%) translateY(-20px);
  z-index:9998;
  background:rgba(17,34,64,.97);
  border:1px solid rgba(0,194,168,.3);
  border-radius:28px;padding:10px 18px;
  display:none;align-items:center;gap:10px;
  font-family:'Noto Sans KR',sans-serif;font-size:13px;color:#E8F4F2;
  box-shadow:0 4px 24px rgba(0,0,0,.5);
  opacity:0;transition:all .35s;white-space:nowrap;
}
#pwa-update-banner.show{display:flex;opacity:1;transform:translateX(-50%) translateY(0)}
.pwa-reload-btn{
  background:linear-gradient(135deg,#00C2A8,#00E5C8);
  color:#0B1B2E;border:none;border-radius:6px;
  padding:5px 12px;font-family:'Noto Sans KR',sans-serif;
  font-size:12px;font-weight:700;cursor:pointer;
}

/* ── PWA 토스트 ── */
#pwa-toast{
  position:fixed;bottom:90px;left:50%;
  transform:translateX(-50%) translateY(16px);
  z-index:10001;
  background:rgba(17,34,64,.97);
  border:1px solid rgba(0,194,168,.25);border-radius:28px;
  padding:10px 20px;
  font-family:'Noto Sans KR',sans-serif;font-size:13px;font-weight:500;color:#E8F4F2;
  box-shadow:0 4px 24px rgba(0,0,0,.5);
  opacity:0;pointer-events:none;transition:all .3s;white-space:nowrap;
  max-width:calc(100vw - 40px);text-align:center;
}
#pwa-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#pwa-toast.ok  {border-color:rgba(0,200,150,.45)}
#pwa-toast.warn{border-color:rgba(232,160,32,.45);color:#FFD166}

/* ── iOS 안내 모달 ── */
#pwa-ios{
  position:fixed;inset:0;z-index:9997;
  background:rgba(5,10,20,.86);backdrop-filter:blur(10px);
  display:none;align-items:flex-end;justify-content:center;padding:20px;
}
#pwa-ios.show{display:flex;animation:pwaFade .3s ease}
@keyframes pwaFade{from{opacity:0}to{opacity:1}}
.pwa-ios-box{
  background:#112240;border:1px solid rgba(0,194,168,.22);border-radius:20px;
  padding:24px;width:100%;max-width:380px;text-align:center;
  box-shadow:0 20px 60px rgba(0,0,0,.65);
  margin-bottom:env(safe-area-inset-bottom,16px);
}
.pwa-ios-icon{width:72px;height:72px;border-radius:18px;object-fit:cover;margin:0 auto 16px;display:block;box-shadow:0 0 20px rgba(0,194,168,.35)}
.pwa-ios-title{font-family:'Noto Sans KR',sans-serif;font-size:18px;font-weight:900;color:#E8F4F2;margin-bottom:10px}
.pwa-ios-steps{
  font-size:13px;color:#9BB8C4;line-height:2;text-align:left;
  background:rgba(0,194,168,.06);border:1px solid rgba(0,194,168,.14);
  border-radius:10px;padding:14px 16px;margin:12px 0 18px;
}
.pwa-ios-snum{
  display:inline-flex;align-items:center;justify-content:center;
  width:20px;height:20px;background:rgba(0,194,168,.2);border-radius:50%;
  font-size:11px;font-weight:700;color:#00E5C8;margin-right:7px;flex-shrink:0;
}
.pwa-ios-close{
  width:100%;background:rgba(107,143,163,.12);border:1px solid rgba(107,143,163,.25);
  border-radius:9px;padding:11px;font-family:'Noto Sans KR',sans-serif;
  font-size:13px;font-weight:600;color:#9BB8C4;cursor:pointer;transition:all .2s;
}
.pwa-ios-close:hover{background:rgba(107,143,163,.25);color:#E8F4F2}

@media(max-width:480px){
  .pwa-b-title{font-size:13px}
  .pwa-install-btn{padding:8px 13px;font-size:12px}
  #pwa-hdr-btn{padding:6px 10px;font-size:11px}
  #pwa-hdr-btn .pwa-hdr-lbl{display:none}
  #pwa-hdr-btn .pwa-hdr-ico{font-size:16px}
}`;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────
   4. 설치 배너 (하단 슬라이드업)
───────────────────────────────────── */
function showInstallBanner(){
  if(localStorage.getItem('pwa-installed')==='1') return;
  const dismissed = +localStorage.getItem('pwa-dismissed')||0;
  if(Date.now()-dismissed < 3*86400000) return; // 3일 쿨다운

  injectCSS();
  if(document.getElementById('pwa-banner')) return;

  const el = document.createElement('div');
  el.id = 'pwa-banner';
  el.innerHTML = `
    <div class="pwa-b-inner">
      <img class="pwa-b-icon" src="icons/icon-96x96.png" alt="MANMIN" onerror="this.style.display='none'">
      <div class="pwa-b-text">
        <div class="pwa-b-title">MANMIN 앱 설치</div>
        <div class="pwa-b-sub">홈 화면에 추가 · 오프라인에서도 사용 가능</div>
      </div>
      <div class="pwa-b-actions">
        <button class="pwa-dismiss" id="pwa-dismiss-btn" aria-label="닫기">✕</button>
        <button class="pwa-install-btn" id="pwa-do-install">⬇ 설치</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));

  el.querySelector('#pwa-dismiss-btn').onclick = ()=>{
    hideBanner('pwa-banner');
    localStorage.setItem('pwa-dismissed', Date.now());
  };
  el.querySelector('#pwa-do-install').onclick = triggerInstall;
}

function hideBanner(id){
  const el=document.getElementById(id);
  if(!el) return;
  el.classList.remove('show');
  setTimeout(()=>el.remove(), 420);
}

/* ─────────────────────────────────────
   5. 헤더 설치 버튼 주입
───────────────────────────────────── */
function injectHeaderBtn(){
  if(document.getElementById('pwa-hdr-btn')) return;
  injectCSS();
  const btn = document.createElement('button');
  btn.id = 'pwa-hdr-btn';
  btn.innerHTML = `<span class="pwa-hdr-ico">⬇</span><span class="pwa-hdr-lbl">앱 설치</span>`;
  btn.onclick = triggerInstall;
  const hdrRight = document.querySelector('.hdr-right');
  if(hdrRight){
    hdrRight.insertBefore(btn, hdrRight.firstChild);
    requestAnimationFrame(()=>btn.classList.add('show'));
  }
}
function removeHeaderBtn(){
  const btn=document.getElementById('pwa-hdr-btn');
  if(btn) btn.remove();
}

/* ─────────────────────────────────────
   6. 실제 설치 트리거
───────────────────────────────────── */
async function triggerInstall(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    const {outcome} = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if(outcome==='accepted'){ hideBanner('pwa-banner'); removeHeaderBtn(); }
  } else if(isIOS()){
    showIOSGuide();
  } else {
    pwToast('이미 설치되었거나 지원하지 않는 환경입니다.', 'warn');
  }
}

/* ─────────────────────────────────────
   7. iOS Safari 안내
───────────────────────────────────── */
function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; }
function isStandalone(){ return window.matchMedia('(display-mode:standalone)').matches || navigator.standalone===true; }

function showIOSGuide(){
  injectCSS();
  let el = document.getElementById('pwa-ios');
  if(!el){
    el = document.createElement('div');
    el.id = 'pwa-ios';
    el.innerHTML = `
      <div class="pwa-ios-box">
        <img class="pwa-ios-icon" src="icons/icon-128x128.png" alt="MANMIN" onerror="this.style.display='none'">
        <div class="pwa-ios-title">홈 화면에 추가</div>
        <div class="pwa-ios-steps">
          <div><span class="pwa-ios-snum">1</span>하단 <strong style="color:#00E5C8">공유 버튼 ⬆</strong> 을 탭</div>
          <div><span class="pwa-ios-snum">2</span><strong style="color:#00E5C8">홈 화면에 추가</strong> 선택</div>
          <div><span class="pwa-ios-snum">3</span>오른쪽 상단 <strong style="color:#00E5C8">추가</strong> 탭</div>
        </div>
        <button class="pwa-ios-close" onclick="document.getElementById('pwa-ios').classList.remove('show')">확인</button>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e=>{ if(e.target===el) el.classList.remove('show'); });
  }
  el.classList.add('show');
}

// iOS 자동 안내 (7일 쿨다운)
if(isIOS() && !isStandalone()){
  const last = +localStorage.getItem('pwa-ios-shown')||0;
  if(Date.now()-last > 7*86400000){
    setTimeout(()=>{
      injectCSS();
      showIOSGuide();
      injectHeaderBtn();
      localStorage.setItem('pwa-ios-shown', Date.now());
    }, 3000);
  }
}

/* ─────────────────────────────────────
   8. 업데이트 배너
───────────────────────────────────── */
function showUpdateBanner(){
  injectCSS();
  let el = document.getElementById('pwa-update-banner');
  if(!el){
    el = document.createElement('div');
    el.id = 'pwa-update-banner';
    el.innerHTML = `🔄 새 버전이 있습니다.
      <button class="pwa-reload-btn" onclick="location.reload()">새로고침</button>
      <button class="pwa-dismiss" onclick="hideBanner('pwa-update-banner')" style="margin-left:4px">✕</button>`;
    document.body.appendChild(el);
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
}

/* ─────────────────────────────────────
   9. 오프라인 / 온라인 토스트
───────────────────────────────────── */
window.addEventListener('offline', ()=>pwToast('📡 오프라인 — 저장된 데이터로 작동합니다.','warn'));
window.addEventListener('online',  ()=>pwToast('🌐 인터넷에 연결되었습니다.','ok'));

function pwToast(msg, type=''){
  injectCSS();
  let t = document.getElementById('pwa-toast');
  if(!t){ t=document.createElement('div'); t.id='pwa-toast'; document.body.appendChild(t); }
  clearTimeout(t._tid);
  t.textContent = msg;
  t.className = type;
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  t._tid = setTimeout(()=>t.classList.remove('show'), 3400);
}

/* 전역 노출 */
window.pwaTriggerInstall = triggerInstall;
window.pwaShowIOSGuide   = showIOSGuide;

})();
