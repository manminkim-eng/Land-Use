/* ═══════════════════════════════════════════════════
   MANMIN PWA  — pwa.js
   · Service Worker 등록
   · 설치 배너 (커스텀 Install Prompt)
   · 오프라인 감지 + 토스트
   · iOS Safari 설치 안내
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 1. Service Worker 등록 ── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js', { scope: './' })
        .then(reg => {
          console.log('[PWA] SW registered, scope:', reg.scope);

          /* SW 업데이트 감지 */
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast();
              }
            });
          });
        })
        .catch(err => console.warn('[PWA] SW registration failed:', err));
    });
  }

  /* ── 2. Install Prompt 저장 ── */
  let deferredPrompt = null;
  let installBannerShown = false;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt fired');

    /* 배너 표시 (1초 딜레이 — 페이지 로드 후) */
    setTimeout(() => {
      if (!installBannerShown) showInstallBanner();
    }, 2000);
  });

  /* ── 3. 설치 완료 감지 ── */
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed!');
    deferredPrompt = null;
    hideInstallBanner();
    showToast('✅ MANMIN 앱이 설치되었습니다!', 'ok');
    /* 설치 상태 저장 */
    localStorage.setItem('pwa-installed', 'true');
  });

  /* ── 4. 오프라인 / 온라인 감지 ── */
  window.addEventListener('offline', () => {
    showToast('📡 오프라인 상태입니다. 저장된 데이터로 작동합니다.', 'warn');
  });
  window.addEventListener('online', () => {
    showToast('🌐 인터넷에 연결되었습니다.', 'ok');
  });

  /* ══════════════════════════════════════════════
     설치 배너 UI 생성
  ══════════════════════════════════════════════ */
  function createInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-inner">
        <div class="pwa-banner-left">
          <img src="./icons/icon-72x72.png" alt="MANMIN" class="pwa-banner-icon" onerror="this.style.display='none'">
          <div class="pwa-banner-text">
            <div class="pwa-banner-title">MANMIN 앱 설치</div>
            <div class="pwa-banner-sub">홈 화면에 추가하여 빠르게 실행</div>
          </div>
        </div>
        <div class="pwa-banner-actions">
          <button class="pwa-btn-dismiss" id="pwa-dismiss" aria-label="닫기">✕</button>
          <button class="pwa-btn-install" id="pwa-install">⬇ 설치</button>
        </div>
      </div>
    `;

    /* CSS 주입 */
    const style = document.createElement('style');
    style.textContent = `
      #pwa-install-banner {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        z-index: 9999;
        background: rgba(9,20,38,0.97);
        backdrop-filter: blur(16px);
        border-top: 1px solid rgba(0,194,168,0.25);
        box-shadow: 0 -4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,194,168,0.08);
        padding: 0;
        transform: translateY(100%);
        transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
        safe-area-inset-bottom: env(safe-area-inset-bottom);
      }
      #pwa-install-banner.show {
        transform: translateY(0);
      }
      .pwa-banner-inner {
        max-width: 680px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
        gap: 14px;
      }
      .pwa-banner-left {
        display: flex;
        align-items: center;
        gap: 13px;
        flex: 1;
        min-width: 0;
      }
      .pwa-banner-icon {
        width: 48px; height: 48px;
        border-radius: 12px;
        object-fit: cover;
        flex-shrink: 0;
        box-shadow: 0 0 12px rgba(0,194,168,0.3);
      }
      .pwa-banner-text {
        min-width: 0;
      }
      .pwa-banner-title {
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: #E8F4F2;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pwa-banner-sub {
        font-size: 11px;
        font-weight: 400;
        color: #6B8FA3;
        margin-top: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .pwa-banner-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .pwa-btn-dismiss {
        width: 32px; height: 32px;
        background: transparent;
        border: 1px solid rgba(107,143,163,0.3);
        border-radius: 50%;
        color: #6B8FA3;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-family: sans-serif;
        padding: 0;
      }
      .pwa-btn-dismiss:hover {
        background: rgba(107,143,163,0.15);
        color: #E8F4F2;
      }
      .pwa-btn-install {
        background: linear-gradient(135deg, #00C2A8, #00E5C8);
        color: #0B1B2E;
        border: none;
        border-radius: 9px;
        padding: 9px 20px;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 13px;
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 4px 16px rgba(0,194,168,0.35);
        transition: all 0.25s;
        letter-spacing: 0.02em;
      }
      .pwa-btn-install:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(0,194,168,0.5);
      }
      .pwa-btn-install:active {
        transform: translateY(0);
      }

      /* ── 토스트 ── */
      #pwa-toast {
        position: fixed;
        bottom: 80px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        z-index: 10000;
        background: rgba(17,34,64,0.97);
        border: 1px solid rgba(0,194,168,0.25);
        border-radius: 28px;
        padding: 10px 20px;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 13px;
        font-weight: 500;
        color: #E8F4F2;
        box-shadow: 0 4px 24px rgba(0,0,0,0.5);
        opacity: 0;
        transition: all 0.3s;
        pointer-events: none;
        white-space: nowrap;
        max-width: calc(100vw - 40px);
        text-align: center;
      }
      #pwa-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      #pwa-toast.ok  { border-color: rgba(0,200,150,0.4); }
      #pwa-toast.warn{ border-color: rgba(232,160,32,0.4); color: #FFD166; }

      /* ── iOS 설치 안내 모달 ── */
      #pwa-ios-guide {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: rgba(5,10,20,0.85);
        backdrop-filter: blur(10px);
        display: none;
        align-items: flex-end;
        justify-content: center;
        padding: 20px;
      }
      #pwa-ios-guide.show {
        display: flex;
        animation: pwaFadeIn 0.3s ease;
      }
      @keyframes pwaFadeIn { from{opacity:0} to{opacity:1} }
      .pwa-ios-box {
        background: #112240;
        border: 1px solid rgba(0,194,168,0.2);
        border-radius: 20px;
        padding: 24px;
        max-width: 380px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        margin-bottom: env(safe-area-inset-bottom, 16px);
      }
      .pwa-ios-icon {
        width: 72px; height: 72px;
        border-radius: 18px;
        object-fit: cover;
        margin: 0 auto 16px;
        display: block;
        box-shadow: 0 0 20px rgba(0,194,168,0.3);
      }
      .pwa-ios-title {
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 18px;
        font-weight: 900;
        color: #E8F4F2;
        margin-bottom: 10px;
        letter-spacing: -0.01em;
      }
      .pwa-ios-steps {
        font-size: 13px;
        color: #9BB8C4;
        line-height: 1.9;
        text-align: left;
        background: rgba(0,194,168,0.06);
        border: 1px solid rgba(0,194,168,0.12);
        border-radius: 10px;
        padding: 14px 16px;
        margin: 12px 0 18px;
      }
      .pwa-ios-steps .step-num {
        display: inline-block;
        width: 20px; height: 20px;
        background: rgba(0,194,168,0.2);
        border-radius: 50%;
        text-align: center;
        line-height: 20px;
        font-size: 11px;
        font-weight: 700;
        color: #00E5C8;
        margin-right: 8px;
        flex-shrink: 0;
      }
      .pwa-ios-close {
        background: rgba(107,143,163,0.12);
        border: 1px solid rgba(107,143,163,0.25);
        border-radius: 9px;
        padding: 10px 24px;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 13px;
        font-weight: 600;
        color: #9BB8C4;
        cursor: pointer;
        transition: all 0.2s;
        width: 100%;
      }
      .pwa-ios-close:hover {
        background: rgba(107,143,163,0.22);
        color: #E8F4F2;
      }

      /* ── 헤더 내 설치 버튼 ── */
      #pwa-header-btn {
        display: none;
        align-items: center;
        gap: 6px;
        background: linear-gradient(135deg, #00C2A8, #00E5C8);
        color: #0B1B2E;
        border: none;
        border-radius: 8px;
        padding: 7px 14px;
        font-family: 'Noto Sans KR', sans-serif;
        font-size: 12px;
        font-weight: 900;
        cursor: pointer;
        white-space: nowrap;
        box-shadow: 0 3px 12px rgba(0,194,168,0.35);
        transition: all 0.25s;
        letter-spacing: 0.02em;
        animation: pwaPulse 2.5s ease-in-out infinite;
      }
      @keyframes pwaPulse {
        0%,100% { box-shadow: 0 3px 12px rgba(0,194,168,0.35); }
        50%      { box-shadow: 0 3px 20px rgba(0,194,168,0.65); }
      }
      #pwa-header-btn.show { display: flex; }
      #pwa-header-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 22px rgba(0,194,168,0.55);
        animation: none;
      }
      #pwa-header-btn .pwa-icon { font-size: 14px; }

      @media(max-width:480px){
        .pwa-banner-title { font-size: 13px; }
        .pwa-btn-install  { padding: 8px 14px; font-size: 12px; }
        #pwa-header-btn   { padding: 6px 10px; font-size: 11px; }
        #pwa-header-btn .pwa-label { display: none; }
        #pwa-header-btn .pwa-icon  { font-size: 16px; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    /* 이벤트 */
    document.getElementById('pwa-dismiss').addEventListener('click', () => {
      hideInstallBanner();
      localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    });
    document.getElementById('pwa-install').addEventListener('click', triggerInstall);

    return banner;
  }

  function showInstallBanner() {
    /* 이미 설치됐거나 최근에 닫았으면 표시 안 함 */
    if (localStorage.getItem('pwa-installed') === 'true') return;
    const dismissed = parseInt(localStorage.getItem('pwa-banner-dismissed') || '0');
    if (Date.now() - dismissed < 3 * 24 * 60 * 60 * 1000) return; // 3일 쿨다운

    const banner = createInstallBanner();
    installBannerShown = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('show'));
    });

    /* 헤더 설치 버튼도 표시 */
    showHeaderInstallBtn();
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 400);
    }
    installBannerShown = false;
  }

  /* ── 헤더 설치 버튼 주입 ── */
  function showHeaderInstallBtn() {
    if (document.getElementById('pwa-header-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'pwa-header-btn';
    btn.innerHTML = `<span class="pwa-icon">⬇</span><span class="pwa-label">앱 설치</span>`;
    btn.addEventListener('click', triggerInstall);

    /* 헤더 오른쪽 영역에 삽입 */
    const hdrRight = document.querySelector('.hdr-right');
    if (hdrRight) {
      hdrRight.insertBefore(btn, hdrRight.firstChild);
      requestAnimationFrame(() => btn.classList.add('show'));
    }
  }

  function hideHeaderInstallBtn() {
    const btn = document.getElementById('pwa-header-btn');
    if (btn) btn.remove();
  }

  /* ── 실제 설치 트리거 ── */
  async function triggerInstall() {
    if (!deferredPrompt) {
      /* iOS Safari 안내 */
      if (isIOS()) {
        showIOSGuide();
      } else {
        showToast('이미 설치되었거나 설치할 수 없는 환경입니다.', 'warn');
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] Install outcome:', outcome);
    deferredPrompt = null;
    if (outcome === 'accepted') {
      hideInstallBanner();
      hideHeaderInstallBtn();
    }
  }

  /* ── iOS 감지 + 안내 ── */
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }
  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  function showIOSGuide() {
    let guide = document.getElementById('pwa-ios-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'pwa-ios-guide';
      guide.innerHTML = `
        <div class="pwa-ios-box">
          <img src="./icons/icon-128x128.png" alt="MANMIN" class="pwa-ios-icon" onerror="this.style.display='none'">
          <div class="pwa-ios-title">홈 화면에 추가하기</div>
          <div class="pwa-ios-steps">
            <div><span class="step-num">1</span>하단의 <strong style="color:#00E5C8">공유 버튼 (⬆)</strong> 을 탭하세요</div>
            <div><span class="step-num">2</span><strong style="color:#00E5C8">홈 화면에 추가</strong> 를 선택하세요</div>
            <div><span class="step-num">3</span>오른쪽 상단 <strong style="color:#00E5C8">추가</strong> 를 탭하세요</div>
          </div>
          <button class="pwa-ios-close" onclick="document.getElementById('pwa-ios-guide').classList.remove('show')">확인</button>
        </div>
      `;
      document.body.appendChild(guide);
    }
    guide.classList.add('show');
    guide.addEventListener('click', e => {
      if (e.target === guide) guide.classList.remove('show');
    });
  }

  /* ── iOS 자동 안내 (Safari + 미설치) ── */
  if (isIOS() && !isInStandaloneMode()) {
    const lastShown = parseInt(localStorage.getItem('ios-guide-shown') || '0');
    if (Date.now() - lastShown > 7 * 24 * 60 * 60 * 1000) { // 7일 쿨다운
      setTimeout(() => {
        showIOSGuide();
        showHeaderInstallBtn();
        localStorage.setItem('ios-guide-shown', Date.now().toString());
      }, 3000);
    }
  }

  /* ── SW 업데이트 토스트 ── */
  function showUpdateToast() {
    const t = createToast();
    t.innerHTML = '🔄 새 버전이 있습니다. <button onclick="location.reload()" style="background:var(--teal,#00C2A8);color:#0B1B2E;border:none;border-radius:6px;padding:3px 10px;font-weight:700;cursor:pointer;margin-left:8px;font-size:12px">새로고침</button>';
    t.style.borderColor = 'rgba(0,194,168,0.4)';
    t.classList.add('show');
    /* 자동 닫기 없음 — 사용자가 직접 새로고침 */
  }

  /* ── 공통 토스트 ── */
  function createToast() {
    let t = document.getElementById('pwa-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pwa-toast';
      document.body.appendChild(t);
    }
    clearTimeout(t._timer);
    t.className = '';
    return t;
  }

  window.showToast = function(msg, type = '') {
    const t = createToast();
    t.textContent = msg;
    t.className = type;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => t.classList.add('show'));
    });
    t._timer = setTimeout(() => {
      t.classList.remove('show');
    }, 3200);
  };

  /* ── 전역 설치 함수 노출 (HTML 버튼에서 직접 호출 가능) ── */
  window.pwaTriggerInstall = triggerInstall;
  window.pwaShowIOSGuide  = showIOSGuide;

})();
