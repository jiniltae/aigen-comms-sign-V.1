import type { Metadata } from 'next';
export const metadata: Metadata = { title: '간판 제작 견적 문의', description: '아이젠컴즈에 간판 디자인·제작·시공 견적을 문의하세요. 사진 첨부로 현장 정보를 전달할 수 있습니다.', alternates: { canonical: '/quote' } };
export default function QuoteLayout({ children }: { children: React.ReactNode }) { return children; }
