# AIGEN COMMS — 맞춤형 간판 포트폴리오 웹사이트

Next.js + PostgreSQL + Prisma 기반 개발용 MVP입니다. 실제 서비스 배포 전에 아래 운영 보안 작업을 완료해야 합니다.

## 실행
1. Node.js 20 이상, PostgreSQL 준비
2. `npm install`
3. `.env.example`을 `.env.local`로 복사하고 실제 환경변수 입력
4. `npx prisma generate && npx prisma db push`
5. `npm run dev` → http://localhost:3000

관리자 `/admin`, 시공 사례 `/projects`, 견적 문의 `/quote`.

### 관리자 비밀번호 해시
`node -e "require('argon2').hash(process.argv[1]).then(console.log)" 'YOUR_LONG_PASSWORD'`
출력된 해시를 ADMIN_PASSWORD_HASH에 입력. 비밀번호 원문을 환경변수나 소스에 저장하지 마세요.

## 구현 범위
- 메인 반응형 랜딩 페이지
- 시공 사례 DB 목록 / 카테고리 / 상세 페이지
- 관리자 Argon2 비밀번호 검증 + HttpOnly 서명 세션 쿠키
- 관리자 단일 이미지 업로드 (서명 검증, 크기 제한, 파일 매직바이트 검사)
- 신규 시공 사례 등록
- 견적 문의 DB 저장 및 입력값 검증
- sitemap.xml, robots.txt, 메타데이터

## 배포 전 반드시 추가할 작업 (현재 미구현)
- Cloudflare WAF 및 로그인·문의 API에 IP/계정 단위 서버측 rate limiting, Turnstile, 침입 모니터링
- 관리자 MFA(TOTP 또는 패스키), 계정 잠금 정책, 비밀번호 재설정 정책
- 업로드 이미지 디코딩/재인코딩, EXIF 제거, 악성 파일 스캔 및 별도 업로드 격리 버킷
- S3 객체 퍼블릭 URL과 업로드 파일 권한을 분리하고 업로드 파일은 검수 후 공개 처리
- 관리자 CRUD 전체(수정/삭제/다중 이미지/순서 변경), 문의 관리자 조회·상태 관리
- 견적 문의 첨부파일 기능, 첨부파일 비공개 저장, 다운로드 권한 검사
- 개인정보처리방침/수집 동의 고지의 실제 보유기간 및 파기 프로세스 확정
- 개인정보 접수 로그, 접근 감사 로그, 정기 DB 백업 및 복구 훈련
- CSRF/Origin 정책 강화, 콘텐츠 보안 정책(CSP), 서버 로그의 개인정보 마스킹
- 실제 회사 연락처·사업자 정보·시공 사진·도메인·검색 콘솔 연결
- 관리자 화면에서 샘플과 실제 사례 혼동 방지, 이미지 사용권 확인

**현재 코드는 운영 배포용 보안 완성본이 아닙니다.** 로그인 시도 제한과 MFA가 없는 상태로 인터넷에 공개하지 마세요.
