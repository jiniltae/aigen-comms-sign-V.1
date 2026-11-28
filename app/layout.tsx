
import './globals.css';
import Link from 'next/link';
import MobileNav from './components/MobileNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'AIGEN COMMS | 간판 제작·시공 전문',
    template: '%s | AIGEN COMMS',
  },
  description:
    '아이젠컴즈 간판 제작·시공 전문. 채널간판, 스카시간판, 플렉스간판, 갈바간판 시공 사례와 견적 문의.',
  robots: {
    index: true,
    follow: true,
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
