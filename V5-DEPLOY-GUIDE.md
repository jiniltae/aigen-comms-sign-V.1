# AIGEN COMMS V5 — SEO / QA / 신규 견적 알림

## 적용
V5 패치 ZIP의 상대경로를 GitHub 저장소 루트에 동일하게 업로드/덮어쓰기. 기존 `.env` 및 관리자 API는 변경하지 않음.

## 구현
- canonical / OpenGraph / Twitter / Organization 구조화 데이터 / 검색엔진 소유권 검증 메타(환경변수 설정 시)
- 메인·포트폴리오 목록·상세·견적 페이지별 메타, 관리자 noindex
- robots.txt / sitemap.xml: 실제 배포 URL 기본값, 공개 프로젝트만 포함
- 신규 문의 DB 저장 후 이메일 알림: Resend API, 환경변수 미설정 시 알림 건너뜀
- 알림 전송 실패해도 견적 접수 성공 상태 유지 (로그만 남김)
- `node scripts/qa-static.mjs`로 파일 구조 정적 확인

## 이메일 알림 활성화 (선택)
Resend에서 발신 도메인 인증 후 Vercel 환경변수 `RESEND_API_KEY`, `INQUIRY_NOTIFY_FROM`, `INQUIRY_NOTIFY_TO` 설정 후 재배포. `INQUIRY_NOTIFY_TO`는 쉼표로 복수 주소 설정 가능. 설정 전에는 이메일이 발송되지 않음.

## SEO 환경변수
`NEXT_PUBLIC_SITE_URL=https://aigen-comms.vercel.app` (자체 도메인 사용 시 그 도메인으로 변경)
`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`은 발급받은 실제 검증 문자열만 입력.

## 배포 후 확인
1. Vercel Ready, /robots.txt, /sitemap.xml 에 example.com이 없는지 확인
2. /, /projects, /projects/실제슬러그, /quote 메타 태그 및 OG 확인
3. 모바일 햄버거·포트폴리오 필터·상세 이미지 확인
4. 사진 없는 견적 1건, 사진 있는 견적 1건 접수 후 관리자 조회
5. Resend 설정 시 테스트 문의 1건으로 알림 수신 확인
6. /admin 에 noindex가 적용되고 로그인 동작이 유지되는지 확인

## 주의
- 브라우저 실측 QA와 이메일 실제 발송은 배포 환경에서 별도 검증해야 함.
- 개인정보가 담긴 이메일은 발신/수신 정책에 맞게 관리. 이메일 알림에는 사진 파일 자체를 첨부하지 않음.
- 신규 기능에 DB 마이그레이션 없음.
