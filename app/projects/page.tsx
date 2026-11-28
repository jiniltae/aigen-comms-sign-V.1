
import Link from 'next/link';
import { db } from '@/lib/db';
import { categories } from '@/lib/data';

export const dynamic = 'force-dynamic';

type ProjectItem = {
  slug: string;
  title: string;
  category: string;
  region: string | null;
  image: string;
};

export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory =
    category && categories.includes(category)
      ? category
      : '전체';

  let items: ProjectItem[] = [];
  let loadError = false;

  try {
    const rows = await db.project.findMany({
      where: {
        published: true,
        ...(activeCategory !== '전체'
          ? { category: activeCategory }
          : {}),
      },
      include: {
        images: {
          orderBy: { sort: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    items = rows.map((project) => ({
      slug: project.slug,
      title: project.title,
      category: project.category,
      region: project.region,
      image: project.images[0]?.url || '',
    }));
  } catch (error) {
    console.error('Failed to load projects:', error);
    loadError = true;
  }

  return (
    <main className="portfolio-page">
      <section className="portfolio-heading">
        <div className="wrap">
          <div className="home-section-index">
            <span className="home-orange-dot" />
            AIGEN COMMS / PORTFOLIO
          </div>

          <h1>
            SELECTED
            <br />
            PROJECTS<span className="home-orange">.</span>
          </h1>

          <div className="portfolio-heading-bottom">
            <p>
              브랜드의 가치를 공간에 구현한
              <br />
              아이젠컴즈의 시공 프로젝트를 소개합니다.
            </p>
            <span>
              {String(items.length).padStart(2, '0')} PROJECTS
            </span>
          </div>
        </div>
      </section>

      <section className="portfolio-content">
        <div className="wrap">
          <nav className="portfolio-filters" aria-label="시공 분야 필터">
            {categories.map((item) => (
              <Link
                key={item}
                href={
                  item === '전체'
                    ? '/projects'
                    : '/projects?category=' +
                      encodeURIComponent(item)
                }
                className={
                  'portfolio-filter ' +
                  (activeCategory === item ? 'active' : '')
                }
                aria-current={
                  activeCategory === item ? 'page' : undefined
                }
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="portfolio-result-summary" aria-live="polite">
            <span>{activeCategory === '전체' ? 'ALL PROJECTS' : activeCategory}</span>
            <strong>{String(items.length).padStart(2, '0')} RESULTS</strong>
          </div>

          {loadError ? (
            <div className="portfolio-empty">
              <h2>프로젝트를 불러오지 못했습니다.</h2>
              <p>잠시 후 다시 시도해 주세요.</p>
            </div>
          ) : items.length > 0 ? (
            <div className="portfolio-grid">
              {items.map((project, index) => (
                <Link
                  key={project.slug}
                  href={'/projects/' + project.slug}
                  className="portfolio-card"
                >
                  <div className="portfolio-image">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="portfolio-placeholder">
                        AIGEN COMMS
                      </div>
                    )}
                    <span className="portfolio-image-arrow">
                      ↗
                    </span>
                  </div>

                  <div className="portfolio-card-info">
                    <div>
                      <small>
                        {project.category}
                        {project.region
                          ? ` / ${project.region}`
                          : ''}
                      </small>
                      <h2>{project.title}</h2>
                    </div>
                    <span>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="portfolio-empty">
              <h2>등록된 시공 사례가 없습니다.</h2>
              <p>다른 카테고리를 선택해 보세요.</p>
              <Link href="/projects" className="home-outline-button">
                전체 프로젝트 보기 ↗
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="portfolio-contact">
        <div className="wrap portfolio-contact-inner">
          <div>
            <span>START YOUR PROJECT</span>
            <h2>
              YOUR SPACE,
              <br />
              OUR EXPERTISE<span>.</span>
            </h2>
          </div>
          <Link href="/quote" className="portfolio-contact-button">
            견적 문의하기 ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
