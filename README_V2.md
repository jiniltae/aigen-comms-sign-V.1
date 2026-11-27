# AIGEN COMMS v2 관리자 업그레이드

## 추가된 기능
- 관리자 세션 복원 및 로그아웃
- 여러 사진 순차 업로드, 대표 사진 순서 변경, 대체 텍스트
- 프로젝트 수정·삭제 및 공개/비공개
- 기존 Prisma schema 문법 및 TypeScript alias 수정 반영

## 배포 전 필수
1. GitHub에 압축 해제한 **파일/폴더 내용**을 저장소 최상위에 덮어쓰기. `.env` 업로드 금지.
2. Vercel 환경변수: `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`(필요시), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`.
3. DB 스키마 적용: 안전한 환경에서 `npx prisma migrate deploy` (기존 migration이 없으면 별도 migration 생성 필요). 초기 개발 DB라면 `npx prisma db push` 사용 가능.
4. 관리자 경로 `/admin`. 실제 공개 전에 인증 및 보안 테스트 필수.

## 주의
- 로그인 시도 횟수 제한, MFA, CSRF 방어, 이미지 재인코딩/악성 이미지 검사, 사진 원본 삭제, 감사 로그, 자동 백업은 아직 구현되지 않았습니다.
- 관리자 삭제는 DB의 프로젝트와 이미지 메타데이터만 제거합니다. S3 파일은 자동 삭제되지 않습니다.
- Vercel 배포가 성공해도 DB와 S3 설정 없이는 등록/업로드가 동작하지 않습니다.
- 실제 개인정보를 받기 전 문의 API의 스팸·속도 제한 및 개인정보 처리 정책을 적용하세요.
