# 월담(univ jump over) 구현 절차

## Phase 1: 프로젝트 기초 설정 (1주)

### 1.1 개발 환경 구성
- [x] Next.js 14+ (App Router) 프로젝트 생성
- [x] TypeScript 설정
- [x] Tailwind CSS 설정
- [x] ESLint & Prettier 설정
- [x] Git 저장소 초기화

### 1.2 Supabase 초기화
- [ ] Supabase 프로젝트 생성 (https://supabase.com에서 수동 생성 필요)
- [x] 환경 변수 설정 (.env.local)
- [x] Supabase 클라이언트 라이브러리 설치
- [ ] 익명 인증 모드 활성화 (Supabase 대시보드에서 설정)

### 1.3 필수 라이브러리 설치
- [x] framer-motion (애니메이션)
- [x] react-canvas-draw (낙서)
- [x] bcryptjs (해싱)
- [x] zustand (상태 관리)
- [x] swr (데이터 페칭)

---

## Phase 2: 데이터베이스 설계 및 구현 (1주)

### 2.1 테이블 생성
- [x] `universities` 테이블 스키마 작성
- [x] `posts` 테이블 스키마 작성
- [x] `comments` 테이블 스키마 작성
- [x] `reactions` 테이블 스키마 작성
- [x] 초기 데이터 준비 (충북대, 충남대, 청주교대)
- [ ] Supabase SQL Editor에서 스키마 실행 필요

### 2.2 RLS (Row Level Security) 정책
- [x] 익명 사용자 INSERT 허용 정책 작성
- [x] 댓글/반응 실시간 업데이트 권한 설정 작성
- [x] 비밀번호 검증 로직 준비
- [ ] Supabase에서 정책 활성화 필요

### 2.3 자동 만료 기능
- [x] 만료된 게시글 자동 삭제 함수 작성
- [x] 스케줄 작업 설정 준비
- [ ] Supabase Edge Functions에서 구현 필요

---

## Phase 3: 백엔드 핵심 기능 (1.5주)

### 3.1 API 라우트 구현 (App Router)
- [x] POST `/api/posts` - 게시글 작성
  - 텍스트 저장
  - 웹 그래피티 이미지(PNG/WebP) 업로드 (Supabase Storage) 및 URL 생성
  - 만료 시간 설정
  
- [x] GET `/api/posts?univ_id=xxx` - 게시글 조회 (Masonry용 정렬)

- [x] DELETE `/api/posts/[id]` - 비밀번호 검증 후 삭제

- [x] POST `/api/comments` - 댓글 작성

- [x] DELETE `/api/comments/[id]` - 비밀번호 검증 후 삭제

- [x] POST `/api/reactions` - 이모지 반응 추가/업데이트

### 3.2 보안 기능
- [ ] 비밀번호 해싱 함수 (bcryptjs)
- [ ] 비밀번호 검증 미들웨어
- [ ] Rate Limiting 미들웨어 (메모리 또는 Upstash Redis)
- [ ] 스팸 방지 로직 (동일 IP 단시간 중복 게시글 체크)

### 3.3 이미지 처리
- [x] Canvas 낙서 → PNG/WebP 변환
- [x] Supabase Storage에 저장
- [x] 공개 URL 생성 및 DB에 저장

---

## Phase 4: 프론트엔드 레이아웃 및 기본 UI (1.5주)

### 4.1 페이지 구조
- [x] 레이아웃 컴포넌트 (Header, Sidebar, Main)
- [ ] 대학 선택 모달 (Campus Selector)
- [x] 현재 대학 표시 UI

### 4.2 Masonry 레이아웃
- [ ] react-masonry-css 또는 직접 구현
- [ ] 반응형 그리드 (모바일 1열, 태블릿 2열, 데스크톱 3열)
- [ ] 포스트잇 카드 컴포넌트 (다양한 배경색, 폰트 스타일 지원)

### 4.3 포스트 작성 UI (모달/사이드패널)
- [x] 텍스트 입력 폼
- [x] 배경색 선택 (5가지)
- [ ] 폰트 스타일 선택 (손글씨/고딕)
- [x] 만료 시간 선택 드롭다운
- [ ] 그래피티 모드 토글

### 4.4 스타일 및 애니메이션
- [ ] Tailwind CSS 커스터마이징 (색상, 폰트)
- [ ] Framer Motion 포스터 진입/퇴장 애니메이션
- [ ] 호버 효과 및 클릭 반응

---

## Phase 5: 핵심 상호작용 기능 (2주)

### 5.1 실시간 업데이트
- [x] Supabase Realtime 구독 설정
- [x] 신규 게시글 실시간 추가
- [x] 댓글 실시간 추가
- [x] 이모지 반응 카운트 실시간 업데이트
- [x] 자동만료 포스트 퇴장 애니메이션

### 5.2 그래피티 에디터
- [x] 웹사이트에서 직접 그림 그리기 인터페이스 (react-canvas-draw)
- [x] 브러시 크기 및 색상 조절
- [x] 지우개 기능
- [x] Clear 버튼
- [x] 그린 이미지를 PNG/WebP로 변환하여 업로드

### 5.3 댓글 시스템 (담쟁이)
- [x] 댓글 입력 UI (게시글 하단)
- [x] 댓글 목록 표시 (줄기 모양)
- [x] 댓글 비밀번호 입력 (삭제용)
- [x] 실시간 댓글 반영

### 5.4 이모지 리액션
- [x] 4가지 이모지 버튼 (👍, ❤️, 😂, 😢)
- [x] 반응 추가/제거 로직
- [x] 카운트 표시
- [x] 실시간 카운트 업데이트

### 5.5 블러 기능
- [x] 게시글 목록에서 내용 블러 처리
- [x] 클릭 시 블러 제거 및 내용 표시
- [x] 토글 상태 유지 (로컬 스토리지)

---

## Phase 6: 캠퍼스 기능 및 로컬리티 (1.5주)

### 6.1 대학 필터링
- [x] 캠퍼스 스팟 태그 시스템
  - 충북대: 솔못, 중문, 학생식당 등
  - 각 대학별 주요 장소 정의
  
- [x] 태그 기반 필터링 UI
- [x] 장소별 게시글 조회

### 6.2 월담 (Wall-Hop) 기능
- [x] 다른 대학 담벼락 조회 기능
- [x] 대학 전환 UI (하단 네비게이션 또는 모달)
- [x] 테마색 동적 변경 (각 대학별 색상)
- [x] 방문 배지 시스템 (로컬 스토리지에 방문 기록)

### 6.3 월담 배지 표시
- [x] 사용자가 방문한 대학 배지 표시
- [x] 배지 디자인 및 애니메이션

---

## Phase 7: 휘발성 게시글 및 고급 기능 (1주)

### 7.1 자동 삭제 기능
- [x] 만료 시간 다가올수록 투명도 감소 애니메이션
- [x] 만료 시각 표시 (남은 시간)
- [x] 자동 삭제 후 UI에서 제거

### 7.2 추가 보안 및 관리
- [ ] 구글 reCAPTCHA 또는 유사 스팸 방지
- [ ] 신고 기능 (게시글/댓글)
- [ ] 어드민 패널 (기본) - 스팸 게시글 제거

---

## Phase 8: 성능 최적화 및 배포 (1주)

### 8.1 성능 최적화
- [ ] 이미지 최적화 (WebP 포맷 변환)
- [ ] 번들 크기 최적화 (Code Splitting)
- [ ] 가상화 (Virtualization) 적용 - 대량 게시글 렌더링
- [ ] 메모리 누수 제거 (useEffect 정리)
- [ ] 캐싱 전략 (SWR/React Query)

### 8.2 SEO 및 메타데이터
- [ ] 메타 태그 설정
- [ ] Open Graph 설정
- [ ] 동적 메타 데이터 (게시글별)

### 8.3 Vercel 배포 설정
- [ ] vercel.json 설정
- [ ] 환경 변수 설정 (Vercel 대시보드)
- [ ] CI/CD 파이프라인 (GitHub Actions)
- [ ] 프리뷰 배포 설정

### 8.4 모니터링 및 로깅
- [ ] Sentry 또는 유사 에러 트래킹
- [ ] 성능 모니터링 (Core Web Vitals)
- [ ] 분석 도구 (Google Analytics)

---

## Phase 9: 테스트 및 품질 보증 (1주)

### 9.1 단위 테스트
- [ ] Jest + React Testing Library
- [ ] API 라우트 테스트
- [ ] 유틸리티 함수 테스트 (해싱, 검증)

### 9.2 통합 테스트
- [ ] E2E 테스트 (Cypress 또는 Playwright)
  - 게시글 작성 → 조회 → 댓글 → 반응 플로우
  - 월담 기능 테스트
  - 자동 삭제 테스트

### 9.3 성능 테스트
- [ ] Lighthouse 성능 점수 목표 설정 (90+)
- [ ] 부하 테스트 (많은 동시 사용자)

### 9.4 보안 테스트
- [ ] SQL Injection 테스트
- [ ] XSS 취약점 확인
- [ ] Rate Limiting 테스트
- [ ] 비밀번호 해싱 검증

---

## Phase 10: 런칭 및 유지보수 (진행중)

### 10.1 런칭 전 체크리스트
- [ ] 모든 기능 QA 통과
- [ ] 성능 테스트 완료
- [ ] 보안 감사 완료
- [ ] 프라이버시 정책 및 이용약관 작성
- [ ] 사용자 문서 및 FAQ 작성

### 10.2 런칭 후
- [ ] Beta 사용자 피드백 수집
- [ ] 버그 수정
- [ ] 성능 모니터링 및 최적화
- [ ] 정기 보안 업데이트

### 10.3 향후 기능 (Backlog)
- [ ] 사용자 프로필 시스템
- [ ] 팔로우 기능
- [ ] 주간 트렌드 집계
- [ ] 모바일 앱 (React Native)
- [ ] 소셜 로그인 (오픈 ID 제공자)

---

## 기술 스택 체크리스트

### 프론트엔드
- [ ] Next.js 14+ (App Router)
- [ ] TypeScript
- [ ] Tailwind CSS
- [ ] Framer Motion
- [ ] react-canvas-draw
- [ ] SWR 또는 React Query

### 백엔드 & DB
- [ ] Supabase (PostgreSQL, Realtime, Storage, Edge Functions)
- [ ] bcryptjs
- [ ] 필요시 Redis (Rate Limiting)

### 배포
- [ ] Vercel
- [ ] GitHub for version control

### 모니터링 & 분석
- [ ] Sentry (에러 추적)
- [ ] Google Analytics
- [ ] Vercel Analytics

---

## 주요 마일스톤

| 마일스톤 | 목표 완료일 | 상태 |
|---------|-----------|------|
| Phase 1-2: 기초 + DB | +2주 | ⬜ |
| Phase 3-4: 백엔드 + 레이아웃 | +4주 | ⬜ |
| Phase 5-6: 핵심 기능 + 월담 | +7주 | ⬜ |
| Phase 7-8: 최적화 + 배포 | +9주 | ⬜ |
| Phase 9-10: 테스트 + 런칭 | +10주 | ⬜ |

**예상 총 개발 기간: ~10주**

---

## 우선순위 (MoSCoW)

### MUST HAVE (필수)
- 포스트 작성/조회 (텍스트)
- 실시간 업데이트
- 댓글 시스템
- 이모지 리액션
- 비밀번호 기반 삭제/수정
- 캠퍼스 필터링
- 월담 기능
- 자동 만료

### SHOULD HAVE (높음)
- 그래피티 에디터
- 블러 기능
- 스팟 태그
- 배지 시스템
- Rate Limiting
- 이미지 최적화

### COULD HAVE (중간)
- 신고 기능
- 어드민 패널
- 분석 도구
- 사용자 프로필

### WON'T HAVE (낮음/미래)
- 사용자 인증 (익명 유지)
- 팔로우 시스템 (1차)
- 모바일 앱 (1차)

