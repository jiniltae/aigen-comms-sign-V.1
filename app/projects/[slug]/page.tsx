
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let project;

  try {
    project = await db.project.findUnique({
      where: {
        slug,
        published: true,
      },
      include: {
        images: {
          orderBy: {
            sort: 'asc',
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to load project:', error);
  }

  if (!project) {
    notFound();
  }

  return (
    <main className="detail-page">

      {/* PROJECT HEADER */}
      <section className="detail-header">
        <div className="wrap">
          <div className="home-section-index">
            <span className="home-orange-dot" />
            AIGEN COMMS / PROJECT DETAIL
          </div>

          <div className="detail-header-main">
            <div>
              <p className="detail-category">
                {project.category}
                {project.region ? ` / ${project.region}` : ''}
              </p>

              <h1>{project.title}</h1>
            </div>

            <Link
              href="/projects"
              className="detail-back-link"
            >
              전체 프로젝트 보기 ↗
            </Link>
          </div>

          <div className="detail-info-grid">
            <div>
              <span>CATEGORY</span>
              <strong>{project.category}</strong>
            </div>

            <div>
              <span>LOCATION</span>
              <strong>{project.region || '미등록'}</strong>
            </div>

            <div>
              <span>PROJECT</span>
              <strong>AIGEN COMMS</strong>
            </div>

            <div>
              <span>IMAGES</span>
              <strong>
                {String(project.images.length).padStart(2, '0')}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT GALLERY */}
      <section className="detail-gallery">
        <div className="wrap">
          {project.images.length > 0 ? (
            <div className="detail-gallery-list">
              {project.images.map((image, index) => (
                <figure
                  className="detail-figure"
                  key={image.id}
                >
                  <div className="detail-image-frame">
                    <img
                      src={image.url}
                      alt={image.alt || project.title}
                      loading={
                        index === 0 ? 'eager' : 'lazy'
                      }
                    />
                  </div>

                  <figcaption>
                    <span>
                      {String(index + 1).padStart(2, '0')}
                      {' / '}
                      {String(project.images.length).padStart(2, '0')}
                    </span>

                    <span>
                      {image.alt || project.title}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="detail-no-images">
              <strong>AIGEN COMMS</strong>
              <p>
                등록된 프로젝트 이미지가 없습니다.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* PROJECT DESCRIPTION */}
      {project.description && (
        <section className="detail-description">
          <div className="wrap detail-description-grid">
            <div className="home-section-index">
              <span className="home-orange-dot" />
              PROJECT OVERVIEW
            </div>

            <div>
              <h2>
                PROJECT STORY
                <span>.</span>
              </h2>

              <p>{project.description}</p>
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM NAVIGATION */}
      <section className="detail-bottom">
        <div className="wrap">
          <div className="home-section-index">
            NEXT STEP / AIGEN COMMS
          </div>

          <h2>
            LET&apos;S BUILD
            <br />
            SOMETHING<span>.</span>
          </h2>

          <div className="detail-bottom-actions">
            <Link
              href="/projects"
              className="detail-list-button"
            >
              ← 시공 사례 목록
            </Link>

            <Link
              href="/quote"
              className="detail-quote-button"
            >
              견적 문의하기 ↗
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
