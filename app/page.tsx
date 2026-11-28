

import Link from 'next/link';
import { db } from '@/lib/db';
import { categories } from '@/lib/data';

export const dynamic = 'force-dynamic';



export default async function Home() {
  let projects: {
    slug: string;
    title: string;
    category: string;
    region: string | null;
    image: string;
  }[] = [];

  try {
    const rows = await db.project.findMany({
where: {
  published: true,
  images: {
    some: {},
  },
},

      include: {
        images: {
          orderBy: {
            sort: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 4,
    });

    projects = rows.map((project) => ({
      slug: project.slug,
      title: project.title,
      category: project.category,
      region: project.region,
      image: project.images[0]?.url || '',
    }));
  } catch (error) {
    console.error('Failed to load homepage projects:', error);
  }

  return (

    <>
      {/* HERO */}
      <section className="home-hero">
        <div className="wrap home-hero-inner">
          <div className="home-hero-top">
            <span>SIGNAGE & VISUAL BRANDING</span>
            <span>DESIGN · FABRICATION · INSTALLATION</span>
          </div>

          <div className="home-hero-content">
            <p className="home-hero-label">
              AIGEN COMMS — CREATIVE SIGNAGE STUDIO
            </p>

            <h1>
              브랜드의
              <br />
              첫인상을
              <br />
              <em>디자인하다.</em>
            </h1>

            <div className="home-hero-bottom">
              <p>
                공간을 이해하는 디자인부터
                <br />
                정확한 제작과 완성도 높은 시공까지.
                <br />
                브랜드의 가치를 공간에 구현합니다.
              </p>

              <Link href="/quote" className="home-hero-button">
                프로젝트 문의하기 <span>↗</span>
              </Link>
            </div>
          </div>

          <div className="home-hero-foot">
            <span>SCROLL TO EXPLORE ↓</span>
            <span>SEOUL, SOUTH KOREA</span>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="home-intro section">
        <div className="wrap home-intro-grid">
          <div className="home-section-index">
            <span className="home-orange-dot" />
            01 / ABOUT US
          </div>

          <div>
            <h2>
              좋은 간판은
              <br />
              단순히 눈에 띄는 것을 넘어,
              <br />
              <span>브랜드를 기억하게 합니다.</span>
            </h2>

            <p className="muted">
              AIGEN COMMS는 브랜드의 개성과 공간의 특성을
              함께 고민합니다. 디자인, 소재 선정, 제작,
              현장 시공까지 일관된 기준으로 완성합니다.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="home-services section">
        <div className="wrap">
          <div className="home-section-heading">
            <div className="home-section-index">
              <span className="home-orange-dot" />
              02 / OUR EXPERTISE
            </div>
            <h2>
              WHAT
              <br />
              WE DO<span className="home-orange">.</span>
            </h2>
          </div>

          <p className="home-services-description">
            다양한 소재와 제작 방식에 대한 이해를 바탕으로
            브랜드와 설치 환경에 맞는 간판을 제안합니다.
          </p>

          <div className="home-service-list">
            {categories.slice(1).map((category, index) => (
              <Link
                href={
                  '/projects?category=' +
                  encodeURIComponent(category)
                }
                className="home-service-row"
                key={category}
              >
                <span className="home-service-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong>{category}</strong>
                <span className="home-service-arrow">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="home-works section">
        <div className="wrap">
          <div className="home-works-heading">
            <div>
              <div className="home-section-index">
                <span className="home-orange-dot" />
                03 / SELECTED WORKS
              </div>
              <h2>
                OUR
                <br />
                WORKS<span className="home-orange">.</span>
              </h2>
            </div>

            <Link href="/projects" className="home-text-link">
              전체 프로젝트 보기 <span>↗</span>
            </Link>
          </div>


{projects.length > 0 ? (
  <div className="home-work-grid">
    {projects.map((project, index) => (
      <Link
        key={project.slug}
        href={'/projects/' + project.slug}
        className={
          'home-work-card ' +
          (index === 0 ? 'home-work-featured' : '')
        }
      >
        <div className="home-work-image">
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
            />
          ) : (
            <div className="home-work-placeholder">
              AIGEN COMMS
            </div>
          )}

          <span className="home-work-image-arrow">
            ↗
          </span>
        </div>

        <div className="home-work-meta">
          <div>
            <small>
              {project.category}
              {project.region ? ` / ${project.region}` : ''}
            </small>
            <h3>{project.title}</h3>
          </div>

          <span>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </Link>
    ))}
  </div>
) : (
  <div className="home-works-empty">
    <p>등록된 시공 사례가 아직 없습니다.</p>
    <span>새로운 프로젝트를 준비하고 있습니다.</span>
  </div>
)}

          <div className="home-works-more">
            <Link href="/projects" className="home-outline-button">
              모든 시공 사례 보기 <span>↗</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="home-process section">
        <div className="wrap">
          <div className="home-section-index">
            <span className="home-orange-dot" />
            04 / OUR PROCESS
          </div>

          <h2>
            FROM IDEA
            <br />
            TO REALITY<span className="home-orange">.</span>
          </h2>

          <div className="home-process-grid">
            {[
              {
                number: '01',
                title: 'CONSULTING',
                korean: '상담 및 현장 확인',
                description:
                  '브랜드의 목적과 설치 환경을 확인합니다.',
              },
              {
                number: '02',
                title: 'DESIGN',
                korean: '디자인 및 설계',
                description:
                  '공간과 소재를 고려한 디자인을 제안합니다.',
              },
              {
                number: '03',
                title: 'PRODUCTION',
                korean: '제작',
                description:
                  '선정된 사양에 맞춰 간판을 제작합니다.',
              },
              {
                number: '04',
                title: 'INSTALLATION',
                korean: '현장 시공',
                description:
                  '설치 환경에 맞춰 안전하고 정확하게 시공합니다.',
              },
            ].map((step) => (
              <div className="home-process-card" key={step.number}>
                <span>{step.number} / 04</span>
                <h3>{step.title}</h3>
                <strong>{step.korean}</strong>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="home-contact">
        <div className="wrap">
          <div className="home-section-index">
            05 / START A PROJECT
          </div>

          <h2>
            HAVE A
            <br />
            PROJECT<span>?</span>
          </h2>

          <div className="home-contact-bottom">
            <p>
              새로운 공간을 준비하고 계신가요?
              <br />
              아이젠컴즈와 함께 시작하세요.
            </p>

            <Link href="/quote" className="home-contact-button">
              견적 문의하기 ↗
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
