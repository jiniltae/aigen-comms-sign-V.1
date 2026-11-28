
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

            <Link href="/projects" className="detail-back-link">
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
                <figure className="detail-figure" key={image.id}>
                  <div className="detail-image-frame">
                    <img
                      src={image.url}
                      alt={image.alt || project.title}
                      loading={index === 0 ? 'eager' : 'lazy'}
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
              <p>등록된 프로젝트 이미지가 없습니다.</p>
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
              <h2>PROJECT STORY<span>.</span></h2>
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
            <Link href="/projects" className="detail-list-button">
              ← 시공 사례 목록
            </Link>

            <Link href="/quote" className="detail-quote-button">
              견적 문의하기 ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ==========================================
   AIGEN COMMS - PROJECT DETAIL V3
   Compact Gallery & Readability
========================================== */

/* 상단 영역 축소 */
.detail-header {
  padding: 60px 0 40px;
}

.detail-header-main {
  margin: 30px 0 40px;
}

.detail-header h1 {
  font-size: clamp(36px, 4.5vw, 64px);
}

.detail-info-grid {
  padding-top: 22px;
}

.detail-info-grid span {
  font-size: 12px;
  color: #777;
}

.detail-info-grid strong {
  font-size: 16px;
}

/* 갤러리 전체 */
.detail-gallery {
  padding: 45px 0 75px;
}

.detail-gallery-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px 20px;
}

/* 첫 번째 사진만 크게 */
.detail-figure:first-child {
  grid-column: 1 / -1;
}

/* 일반 사진 */
.detail-image-frame {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f0f0ed;
  overflow: hidden;
}

/* 첫 번째 대표 사진 */
.detail-figure:first-child .detail-image-frame {
  aspect-ratio: 16 / 8;
}

/* 이미지 크기 통일 */
.detail-image-frame img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: cover;
  transition: transform .35s ease;
}

.detail-figure:hover img {
  transform: scale(1.025);
}

/* 사진 설명 */
.detail-figure figcaption {
  padding-top: 12px;
  font-size: 13px;
  color: #777;
  line-height: 1.5;
}

/* 프로젝트 설명 */
.detail-description {
  padding: 70px 0;
}

.detail-description-grid {
  grid-template-columns: 1fr 2fr;
}

.detail-description h2 {
  font-size: clamp(32px, 4vw, 48px);
  margin-bottom: 25px;
}

.detail-description p {
  font-size: 16px;
  line-height: 1.95;
  color: #444;
  max-width: 800px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* 하단 문의 영역 */
.detail-bottom {
  padding: 65px 0;
}

.detail-bottom h2 {
  font-size: clamp(45px, 6vw, 80px);
  margin: 30px 0 45px;
}

/* 모바일 */
@media (max-width: 750px) {
  .detail-header {
    padding: 45px 0 35px;
  }

  .detail-header-main {
    margin: 25px 0 35px;
  }

  .detail-gallery {
    padding: 30px 0 50px;
  }

  .detail-gallery-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 12px;
  }

  .detail-figure:first-child {
    grid-column: 1 / -1;
  }

  .detail-figure:first-child .detail-image-frame {
    aspect-ratio: 4 / 3;
  }

  .detail-image-frame {
    aspect-ratio: 1 / 1;
  }

  .detail-figure figcaption {
    font-size: 11px;
  }

  .detail-description {
    padding: 50px 0;
  }

  .detail-description-grid {
    grid-template-columns: 1fr;
  }

  .detail-description p {
    font-size: 15px;
    line-height: 1.85;
  }

  .detail-bottom {
    padding: 55px 0;
  }
}
