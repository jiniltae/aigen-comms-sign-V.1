import fs from 'node:fs';
const checks = [
 ['모바일 내비게이션', 'app/components/MobileNav.tsx'],
 ['견적 접수 API', 'app/api/inquiries/route.ts'],
 ['업로드 세션 API', 'app/api/inquiries/session/route.ts'],
 ['관리자 사진 조회', 'app/api/admin/inquiries/[id]/photos/route.ts'],
 ['SEO robots', 'app/robots.ts'], ['SEO sitemap', 'app/sitemap.ts'],
 ['SEO 프로젝트 상세', 'app/projects/[slug]/page.tsx'],
 ['신규 문의 알림', 'lib/inquiry-notification.ts'],
];
let failures = 0;
for (const [label, file] of checks) {
  const ok = fs.existsSync(file);
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${file}`);
  if (!ok) failures++;
}
const src = fs.readFileSync('app/api/inquiries/route.ts', 'utf8');
if (!src.includes('await notifyNewInquiry(')) { console.error('FAIL 알림 연결'); failures++; }
if (failures) process.exit(1);
console.log('Static file checks passed. This does NOT replace browser/API integration tests.');
