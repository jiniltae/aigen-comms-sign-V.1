# AIGEN COMMS V6 — 운영 점검 및 안전 패치

## 적용 파일
- `app/sitemap.ts` — 시공 사례 수정일을 `createdAt` 대신 `updatedAt`으로 반영 (실제 DB 모델에 존재하는 필드)
- `scripts/qa-public.mjs` — 배포 후 읽기 전용 URL 점검. 고객 데이터나 DB를 변경하지 않음.

## 실제 V5 소스 검토에서 확인한 사항
1. `/api/inquiries/session`은 IP 해시 기준 1시간당 세션 3개로 제한함. 사진을 삭제/재선택해 세션을 여러 번 생성하는 사용자에게 429가 발생할 수 있음.
2. `/api/inquiries/upload`은 세션당 서명 URL 발급을 최대 5번 허용함. 사진을 업로드한 뒤 제거해도 발급 슬롯은 반환되지 않음. 고객 UX 관점에서 향후 개선 후보.
3. `/api/inquiries`는 사진 복사 후 DB 트랜잭션을 수행함. DB 저장이 실패하면 `confirmed/` 복사본이 남을 수 있음. 저장소 정리 정책과 예외 처리 추가 검토 필요.
4. Resend 알림은 DB 저장 후 실행되고 최대 약 6초 기다릴 수 있음. 설정되지 않았다면 건너뜀. 고객 응답 지연 방지를 위해 추후 비동기 큐/이벤트 기반 발송 고려.
5. `robots.txt`의 `/admin` 차단은 보안 인증을 대신하지 않음. 관리자 인증은 별도로 검증해야 함.
6. 원본 V5 `sitemap.ts`는 프로젝트 수정일 대신 생성일을 lastModified로 사용함. 이번 패치에서 수정.

## 검증 방법
- Vercel Ready 확인
- 로컬 Node 18+에서 `node scripts/qa-public.mjs` 실행. 다른 사이트는 `SITE_URL=https://도메인 node scripts/qa-public.mjs`
- 실제 브라우저에서 모바일 메뉴, 포트폴리오 필터, 견적 접수, 관리자 사진 열기 확인

## 적용 범위와 한계
- 이번 패치는 공개 SEO 데이터 정확도와 읽기 전용 QA 도구만 수정. API, 인증, R2, 데이터베이스, 이메일 알림 코드는 변경하지 않음.
- 제공된 V5 소스 ZIP 기준으로 점검. 실제 GitHub의 최신 커밋과 차이가 있으면 재비교 필요.
- 배포된 사이트에 대한 실시간 브라우저 테스트는 포함되지 않음.
