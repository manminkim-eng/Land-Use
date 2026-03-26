# MANMIN-Ver1.0 건폐율·용적률 계산기 PWA

> **ARCHITECT KIM MANMIN** — 국토계획법 + 지자체 조례 기준 건폐율·용적률 자동 계산기

---

## 📱 PWA 설치

| 환경 | 설치 방법 |
|------|----------|
| **Android Chrome** | 배너 자동 표시 → ⬇ 설치 버튼 탭 |
| **iOS Safari** | 공유(⬆) → 홈 화면에 추가 |
| **데스크탑 Chrome** | 주소창 오른쪽 ⊕ 아이콘 클릭 |
| **Edge** | 주소창 오른쪽 앱 설치 아이콘 |

---

## 📁 파일 구조

```
MANMIN-Ver1.0/
├── index.html              ← 메인 앱 (PWA 메타 포함)
├── manifest.json           ← PWA 매니페스트
├── sw.js                   ← Service Worker (오프라인 지원)
├── pwa.js                  ← 설치 배너 + 토스트 로직
├── README.md               ← 이 파일
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    ├── icon-512x512.png
    ├── icon-512x512-maskable.png  ← 마스크 아이콘
    ├── apple-touch-icon.png       ← iOS 홈 아이콘
    ├── favicon-16x16.png
    └── favicon-32x32.png
```

---

## 🚀 GitHub Pages 배포 방법

### 1단계 — 저장소 생성
```bash
# GitHub에서 새 저장소 생성 후
git init
git add .
git commit -m "feat: MANMIN-Ver1.0 PWA 초기 배포"
git branch -M main
git remote add origin https://github.com/[username]/manmin-ver1.0.git
git push -u origin main
```

### 2단계 — GitHub Pages 활성화
1. 저장소 → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. **Save** 클릭
5. 약 1~2분 후 `https://[username].github.io/manmin-ver1.0/` 접속

### 3단계 — HTTPS 확인 (PWA 필수)
GitHub Pages는 자동으로 HTTPS를 제공합니다. ✅

---

## ⚡ PWA 기능

| 기능 | 설명 |
|------|------|
| **오프라인 지원** | Service Worker 캐시로 인터넷 없이도 작동 |
| **홈 화면 설치** | 네이티브 앱처럼 설치 가능 |
| **설치 배너** | 하단 자동 배너 + 헤더 설치 버튼 |
| **iOS 안내** | Safari용 수동 설치 가이드 팝업 |
| **앱 업데이트** | SW 업데이트 감지 → 새로고침 안내 |
| **오프라인 토스트** | 연결 상태 변화 알림 |

---

## 📋 법규 기준

- **국토의 계획 및 이용에 관한 법률 시행령** 제35628호 (2025.10.02 시행)
- 31개 지자체 도시계획조례 (2024~2025 기준)
- 건축법 시행령 제119조 (용적률 제외면적)

---

## 🏗 개발 정보

- **개발**: MANMIN Design System Ver 1.0
- **폰트**: Noto Sans KR (본고딕) + DM Mono
- **색상**: Navy `#0B1B2E` + Teal `#00C2A8` + Gold `#E8A020`
- **라이선스**: © 2025 ARCHITECT KIM MANMIN
