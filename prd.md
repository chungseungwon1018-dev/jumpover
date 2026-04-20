1. 프로젝트 개요 (Project Overview)
서비스 명: 월담(univ jump over)

핵심 컨셉: 포스트잇, 담쟁이 댓글, 그래피티 낙서가 어우러진 실시간 익명 캔버스 커뮤니티.

차별화 지점: 인근 대학(충남대, 청주교대 등)의 담벼락을 구경하고 흔적을 남기는 '월담' 시스템.

주요 기술: Next.js, Supabase, HTML5 Canvas, Tailwind CSS, Vercel.

2. 핵심 기능 요구사항 (Functional Requirements)
2.1. 실시간 디지털 담벼락 (Main Display)
Masonry Layout: 다양한 크기의 포스트잇이 자유롭게 배치되는 인터페이스.

Realtime Update: 새로고침 없이 신규 게시글, 댓글, 이모지 반응이 즉시 반영.

커스터마이징: 작성 시 배경색(5종), 폰트 스타일(손글씨/고딕) 선택 기능.

2.2. 그래피티 & 텍스트 에디터 (Creation)
하이브리드 작성: 일반 텍스트 입력과 손그림 낙서(Canvas API) 모드 제공.

그래피티 덧칠: 기존 포스트잇 위에 작은 스티커나 낙서를 추가할 수 있는 레이어 기능.

이미지 저장: 낙서는 Supabase Storage에 PNG 형식으로 저장 후 URL 연결.

2.3. 소통 및 반응 (Interaction)
담쟁이 댓글(Ivy Comments): 게시글 하단에 줄기처럼 이어지는 익명 댓글 구조. (ID/PW 방식 삭제 지원)

이모지 리액션: 이모지 리액션: 👍, ❤️, 😂, 😢 등 퀵 리액션 버튼. 실시간 카운트 업데이트.

비밀 속삭임(Blur): 게시글 목록에서 내용을 블러 처리, 클릭 시에만 공개되는 기능.

2.4. 캠퍼스 로컬리티 & 월담 (Locality & Networking)
캠퍼스 스팟 태그: 충북대(솔못, 중문 등) 주요 장소 태그 및 필터링.

월담(Wall-Hop) 기능: * 타 대학(충남대, 청주교대 등) 담벼락으로 이동 및 게시글 열람 가능.

타 대학 방문 시 '월담한 방문자' 배지 부여 및 해당 대학 테마색으로 UI 변경.

2.5. 휘발성 게시글 (Ephemeral Content)
자동 삭제: 작성 시 설정한 시간(1시간~24시간) 경과 시 데이터 자동 삭제.

시각적 연출: 삭제 시간이 다가올수록 포스트잇의 투명도가 점차 낮아지는 효과.

3. 시스템 아키텍처 및 데이터 설계
3.1. 기술 스택
Frontend: Next.js (App Router), Framer Motion (애니메이션), React-Canvas-Draw (낙서).

Backend: Supabase (PostgreSQL, Realtime, Storage, Edge Functions).

Deployment: Vercel (CI/CD 연동).

3.2. 데이터베이스 스키마 (주요 테이블)
universities: 대학 코드, 이름, 테마 색상, 장소 태그 리스트.

posts: univ_id, type(텍스트/그림), content, image_url, is_blur, expires_at 등.

comments & reactions: 각 게시글에 종속된 익명 댓글 및 이모지 통계.

4. 비기능적 요구사항 (Non-Functional)
익명 보안: 모든 게시물과 댓글은 고유 비밀번호를 해싱(Bcrypt)하여 저장, 수정/삭제 시 검증.

성능 최적화: 낙서 이미지는 WebP 포맷으로 압축 저장하여 로딩 속도 향상.

남용 방지: Rate Limit을 설정하여 단시간 내 도배성 게시글 작성을 차단.