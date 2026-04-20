# Supabase 마이그레이션 가이드

## 미적용 마이그레이션 목록

다음 SQL 파일들을 Supabase SQL Editor에서 순서대로 실행해야 합니다:

### 1. **supabase-migration-fix-rls-policies.sql** (우선 순위: 높음)
- **목적**: RLS 정책 완화 - 익명 사용자가 간단한 비밀번호(1111 등)로 게시글 작성 가능
- **실행**: Supabase 대시보드 → SQL Editor → 복사-붙여넣기 → 실행

### 2. **supabase-migration-add-missing-columns.sql** (우선 순위: 높음)
- **목적**: `posts` 테이블에 필수 컬럼 추가
  - `bg_color` - 게시글 배경색상
  - `font_style` - 폰트 스타일 (handwriting/gothic)
  - `spot` - 캠퍼스 위치 태그
  - `is_blur` - 스포일러 블러 처리 여부
  - DELETE 정책 추가
- **실행**: 위와 동일

### 3. **supabase-migration-add-post-fields.sql** (선택사항)
- **목적**: 인덱스 생성 및 추가 최적화 (이미 위 파일에 포함됨)
- **실행**: 필요시만 실행

## 실행 방법

1. Supabase 대시보드 접속
2. 왼쪽 메뉴에서 **SQL Editor** 선택
3. **Create query** 또는 **New Query** 클릭
4. 해당 SQL 파일 내용 복사
5. 쿼리 작성 창에 붙여넣기
6. **Run** 버튼 클릭

## 예상 결과

✅ RLS 정책 적용 후: 비밀번호 1111로도 게시글 작성 가능
✅ 컬럼 추가 후: 모든 필드 저장 및 로드 가능
✅ DELETE 정책: 게시글/댓글 삭제 가능

## 주요 변경 사항

### 프론트엔드
- ✅ 게시글/댓글 삭제 버튼 추가
- ✅ 블러 처리 체크박스 추가 (기본값: 미체크)
- ✅ 배경색상, 폰트 스타일, 스팟 필터 저장

### 백엔드
- ✅ POST API에 모든 필드 포함
- ✅ DELETE 핸들러 활성화
- ✅ 비밀번호 검증 구현

## 문제 발생 시

- 오류 메시지가 나면 해당 SQL의 문법을 다시 확인
- 정책 충돌이 있으면 기존 정책을 모두 삭제 후 새로운 정책만 적용

