'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

const items = [
  { href: '/', label: '홈' },
  { href: '/projects', label: '시공 사례' },
  { href: '/#services', label: '제작 분야' },
  { href: '/quote', label: '견적 문의' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div className="mobile-nav">
      <button type="button" className="mobile-nav-toggle" aria-expanded={open} aria-controls="mobile-nav-panel" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpen(!open)}>
        {open ? <X size={24} strokeWidth={1.8} /> : <Menu size={24} strokeWidth={1.8} />}
      </button>
      {open && <nav id="mobile-nav-panel" className="mobile-nav-panel" aria-label="모바일 메뉴">
        <span className="mobile-nav-eyebrow">EXPLORE AIGEN COMMS</span>
        {items.map(({ href, label }, i) => <Link key={href} href={href} onClick={() => setOpen(false)} className="mobile-nav-link">
          <span className="mobile-nav-number">0{i + 1}</span><span>{label}</span><ArrowUpRight size={19} strokeWidth={1.5} />
        </Link>)}
        <p className="mobile-nav-caption">DESIGN · FABRICATION · INSTALLATION</p>
      </nav>}
    </div>
  );
}
