# MANMIN-Ver1.0 — 건폐율·용적률 계산기 PWA

> **ARCHITECT KIM MANMIN** | 국토계획법 + 31개 지자체 조례 기준

---

## 📁 파일 구조

```
MANMIN-Ver1.0/
├── index.html               ← 메인 앱 (PWA 메타 완비)
├── manifest.json            ← PWA 매니페스트
├── sw.js                    ← Service Worker (Cache-First)
├── pwa.js                   ← 설치 배너 + 버튼 + iOS 안내
└── icons/  (12개)
    ├── icon-72 ~ 512.png
    ├── icon-512x512-maskable.png
    ├── apple-touch-icon.png
    └── favicon-16,32.png
```

---

## 🚀 GitHub Pages 배포

```bash
git init
git add .
git commit -m "feat: MANMIN-Ver1.0 PWA"
git branch -M main
git remote add origin https://github.com/[username]/manmin.git
git push -u origin main
```

**Settings → Pages → Branch: main → Save**
→ `https://[username].github.io/manmin/` 에서 바로 설치 가능

---

## 📱 PWA 설치

| 환경 | 방법 |
|------|------|
| Android Chrome | 하단 배너 또는 헤더 **⬇ 앱 설치** 버튼 |
| iOS Safari | 헤더 버튼 탭 → 안내 팝업 → 홈 화면에 추가 |
| 데스크탑 Chrome | 주소창 ⊕ 아이콘 또는 헤더 버튼 |
| Edge | 주소창 앱 설치 아이콘 |

---

## ⚡ 주요 기능

| 기능 | 설명 |
|------|------|
| 오프라인 지원 | Cache-First SW — 인터넷 없이 완전 작동 |
| 자동 설치 배너 | 방문 2초 후 하단 슬라이드업 배너 |
| 헤더 설치 버튼 | 맥동 효과 `⬇ 앱 설치` 버튼 |
| iOS 가이드 팝업 | Safari 3단계 설치 안내 |
| 업데이트 감지 | 새 버전 배포 시 새로고침 안내 |
| 오프라인 토스트 | 연결 상태 변화 실시간 알림 |

---

© 2025 ARCHITECT KIM MANMIN
