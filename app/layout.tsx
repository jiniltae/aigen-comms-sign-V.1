
import './globals.css';
import Link from 'next/link';
import MobileNav from './components/MobileNav';
import type { Metadata } from 'next';
import { SITE_URL, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'AIGEN COMMS | 간판 디자인·제작·시공', template: '%s | AIGEN COMMS' },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'ko_KR', siteName: SITE_NAME, title: 'AIGEN COMMS | 간판 디자인·제작·시공', description: SITE_DESCRIPTION, url: SITE_URL },
  twitter: { card: 'summary_large_image', title: 'AIGEN COMMS | 간판 디자인·제작·시공', description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ? { 'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION } : undefined,
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: '아이젠컴즈', alternateName: 'AIGEN COMMS', url: SITE_URL,
          description: SITE_DESCRIPTION,
        }).replace(/</g, '\\u003c') }} />
        <a className="skip-to-content" href="#main-content">본문으로 바로가기</a>
        <header className="site-header">
          <div className="wrap nav">
            <Link className="brand" href="/" aria-label="아이젠컴즈 홈">
              AIGEN<span className="brand-accent">.</span>COMMS
            </Link>

            <nav className="navlinks" aria-label="주요 메뉴">
              <Link href="/projects">시공 사례</Link>
              <Link href="/#services">제작 분야</Link>
              <Link href="/quote" className="nav-contact">
                견적 문의 <span aria-hidden="true">↗</span>
              </Link>
            </nav>
            <MobileNav />
          </div>
        </header>

        <main id="main-content">{children}</main>

        <footer className="footer">
          <div className="wrap">
            <div className="footer-top">
              <div className="footer-intro">
                <Link href="/" className="footer-brand">
                  AIGEN<span className="brand-accent">.</span>COMMS
                </Link>
                <p>
                  브랜드의 첫인상을 디자인합니다.
                  <br />
                  기획부터 디자인, 제작, 시공까지.
                </p>
              </div>

              <div className="footer-links">
                <div>
                  <strong>EXPLORE</strong>
                  <Link href="/projects">시공 사례</Link>
                  <Link href="/#services">제작 분야</Link>
                  <Link href="/quote">견적 문의</Link>
                </div>

                <div>
                  <strong>SERVICES</strong>
                  <span>채널간판</span>
                  <span>스카시간판</span>
                  <span>플렉스간판</span>
                  <span>갈바간판</span>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <span>© {new Date().getFullYear()} AIGEN COMMS.</span>
              <span>DESIGN · FABRICATION · INSTALLATION</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
