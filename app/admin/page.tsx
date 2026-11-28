
'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Photo = {
  id?: string;
  url: string;
  alt: string;
  sort?: number;
};

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  region: string | null;
  description: string;
  published: boolean;
  images: Photo[];
};

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  region: string | null;
  category: string | null;
  dimensions: string | null;
  message: string;
  status: string;
  createdAt: string;
};

type Tab = 'dashboard' | 'projects' | 'inquiries';
type PhotoTarget = 'new' | 'edit';

const categories = [
  '채널간판',
  '스카시간판',
  '플렉스간판',
  '갈바간판',
  '돌출간판',
  '어닝',
  '실내사인',
];

const statusNames: Record<string, string> = {
  NEW: '신규',
  IN_PROGRESS: '상담 중',
  DONE: '완료',
};

const buttonStyle = {
  padding: '10px 14px',
  border: '1px solid #ccc',
  borderRadius: 5,
  cursor: 'pointer',
};

export default function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [newPhotos, setNewPhotos] = useState<Photo[]>([]);
  const [editPhotos, setEditPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function loadData(silent = false) {
    try {
      const [p, i] = await Promise.all([
        fetch('/api/admin/projects', { cache: 'no-store' }),
        fetch('/api/admin/inquiries', { cache: 'no-store' }),
      ]);

      if (p.status === 401 || i.status === 401) {
        setAuthorized(false);
        if (!silent) setMessage('로그인이 필요합니다.');
        return;
      }

      if (!p.ok || !i.ok) {
        throw new Error('관리자 데이터를 불러오지 못했습니다.');
      }

      const [projectData, inquiryData] = await Promise.all([
        p.json(),
        i.json(),
      ]);

      setProjects(projectData);
      setInquiries(inquiryData);
      setAuthorized(true);
    } catch (error) {
      if (!silent) {
        setMessage(
          error instanceof Error ? error.message : '조회 실패'
        );
      }
    }
  }

  useEffect(() => {
    async function initialize() {
      await loadData(true);
      setChecking(false);
    }
    void initialize();
  }, []);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) throw new Error('이메일 또는 비밀번호를 확인하세요.');

      setPassword('');
      setAuthorized(true);
      await loadData();
      setMessage('로그인 성공');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '로그인 실패'
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('로그아웃에 실패했습니다. 다시 시도해 주세요.');
      setAuthorized(false);
      setEmail('');
      setPassword('');
      setProjects([]);
      setInquiries([]);
      setEditing(null);
      setNewPhotos([]);
      setEditPhotos([]);
      setTab('dashboard');
      setMessage('로그아웃되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '로그아웃 실패');
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(
    files: FileList,
    target: PhotoTarget
  ) {
    const current = target === 'new' ? newPhotos : editPhotos;

    if (current.length + files.length > 30) {
      setMessage('사진은 최대 30장까지 가능합니다.');
      return;
    }

    setUploading(true);
    const uploaded: Photo[] = [];

    try {
      for (const file of Array.from(files)) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size === 0 ||
          file.size > 8 * 1024 * 1024
        ) {
          throw new Error(`${file.name}: 파일 형식 또는 크기 오류`);
        }

        const form = new FormData();
        form.append('file', file);

        const r = await fetch('/api/admin/upload', {
          method: 'POST',
          body: form,
        });

        const result = await r.json();

        if (!r.ok) {
          throw new Error(result.error || '사진 업로드 실패');
        }

        uploaded.push({
          url: result.url,
          alt: file.name.replace(/\.[^.]+$/, ''),
        });
      }

      setMessage(`${uploaded.length}장 업로드 완료`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '업로드 실패'
      );
    } finally {
      if (uploaded.length) {
        if (target === 'new') {
          setNewPhotos(prev => [...prev, ...uploaded]);
        } else {
          setEditPhotos(prev => [...prev, ...uploaded]);
        }
      }
      setUploading(false);
    }
  }

  function changePhotos(
    target: PhotoTarget,
    operation: 'move' | 'delete' | 'alt',
    index: number,
    value?: number | string
  ) {
    const setter = target === 'new' ? setNewPhotos : setEditPhotos;

    setter(prev => {
      const next = [...prev];

      if (operation === 'delete') {
        next.splice(index, 1);
      }

      if (operation === 'alt') {
        next[index] = { ...next[index], alt: String(value ?? '') };
      }

      if (operation === 'move') {
        const other = index + Number(value);
        if (other < 0 || other >= next.length) return prev;
        [next[index], next[other]] = [next[other], next[index]];
      }

      return next;
    });
  }

  function photoManager(target: PhotoTarget) {
    const photos = target === 'new' ? newPhotos : editPhotos;

    return (
      <div style={{ marginTop: 16 }}>
        <strong>사진 {photos.length}/30장</strong>
        <p className="muted">
          첫 번째 사진이 대표 이미지입니다.
        </p>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || uploading}
          onChange={e => {
            if (e.target.files?.length) {
              void uploadFiles(e.target.files, target);
            }
            e.target.value = '';
          }}
        />

        {uploading && <p>사진 업로드 중...</p>}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
          gap: 12,
          marginTop: 16,
        }}>
          {photos.map((photo, index) => (
            <div key={`${photo.url}-${index}`} style={{
              padding: 10,
              border: '1px solid #ddd',
              borderRadius: 6,
            }}>
              <img
                src={photo.url}
                alt={photo.alt}
                style={{
                  width: '100%',
                  height: 120,
                  objectFit: 'cover',
                }}
              />
              <p>
                {index === 0 ? '대표 사진' : `${index + 1}번 사진`}
              </p>
              <input
                aria-label="사진 설명"
                value={photo.alt}
                maxLength={200}
                onChange={e =>
                  changePhotos(target, 'alt', index, e.target.value)
                }
              />
              <div style={{
                display: 'flex',
                gap: 5,
                marginTop: 8,
              }}>
                <button
                  type="button"
                  disabled={busy || uploading || index === 0}
                  onClick={() => changePhotos(target, 'move', index, -1)}
                >←</button>
                <button
                  type="button"
                  disabled={busy || uploading || index === photos.length - 1}
                  onClick={() => changePhotos(target, 'move', index, 1)}
                >→</button>
                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => changePhotos(target, 'delete', index)}
                >삭제</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  async function createProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || uploading) return;

    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);

    try {
      const r = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: String(f.get('slug')),
          title: String(f.get('title')),
          category: String(f.get('category')),
          region: String(f.get('region') || ''),
          description: String(f.get('description') || ''),
          published: true,
          images: newPhotos.map(({ url, alt }) => ({ url, alt })),
        }),
      });

      if (!r.ok) throw new Error('등록 실패: 영문 주소 중복 등을 확인하세요.');

      form.reset();
      setNewPhotos([]);
      await loadData();
      setMessage('시공 사례 등록 완료');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '등록 실패'
      );
    } finally {
      setBusy(false);
    }
  }

  function startEdit(project: Project) {
    setEditing(project);
    setEditPhotos(
      [...project.images].sort(
        (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
      )
    );
    setMessage('내용을 수정하고 저장하세요.');
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || busy || uploading) return;

    const f = new FormData(e.currentTarget);
    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(editing.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: String(f.get('slug')),
            title: String(f.get('title')),
            category: String(f.get('category')),
            region: String(f.get('region') || ''),
            description: String(f.get('description') || ''),
            images: editPhotos.map(({ url, alt }) => ({ url, alt })),
          }),
        }
      );

      if (!r.ok) throw new Error('수정 저장 실패');

      setEditing(null);
      setEditPhotos([]);
      await loadData();
      setMessage('시공 사례 수정 완료');
    } catch {
      setMessage('수정 실패: 입력값 또는 영문 주소 중복을 확인하세요.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleProject(project: Project) {
    if (busy) return;
    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: !project.published }),
        }
      );

      if (!r.ok) throw new Error();

      await loadData();
      setMessage('공개 상태 변경 완료');
    } catch {
      setMessage('공개 상태 변경 실패');
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject(project: Project) {
    if (busy || !window.confirm(
      `"${project.title}" 사례를 삭제하시겠습니까?`
    )) return;

    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}`,
        { method: 'DELETE' }
      );

      if (!r.ok) throw new Error();

      if (editing?.id === project.id) {
        setEditing(null);
        setEditPhotos([]);
      }

      await loadData();
      setMessage('시공 사례 삭제 완료');
    } catch {
      setMessage('시공 사례 삭제 실패');
    } finally {
      setBusy(false);
    }
  }

  async function changeInquiryStatus(id: string, status: string) {
    if (busy) return;
    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/inquiries/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!r.ok) throw new Error();

      await loadData();
      setMessage('문의 처리 상태 변경 완료');
    } catch {
      setMessage('문의 상태 변경 실패');
    } finally {
      setBusy(false);
    }
  }

  async function deleteInquiry(inquiry: Inquiry) {
    if (busy || !window.confirm(
      `${inquiry.name}님의 문의를 영구 삭제하시겠습니까?`
    )) return;

    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/inquiries/${encodeURIComponent(inquiry.id)}`,
        { method: 'DELETE' }
      );

      if (!r.ok) throw new Error();

      await loadData();
      setMessage('문의 삭제 완료');
    } catch {
      setMessage('문의 삭제 실패');
    } finally {
      setBusy(false);
    }
  }

  const newCount = inquiries.filter(
    i => i.status === 'NEW'
  ).length;

  const publishedCount = projects.filter(
    p => p.published
  ).length;

  const filteredInquiries = inquiries.filter(i => {
    const keyword = search.toLowerCase();

    const matchesSearch = [
      i.name,
      i.phone,
      i.region,
      i.category,
      i.dimensions,
      i.message,
    ].some(v => (v || '').toLowerCase().includes(keyword));

    return matchesSearch &&
      (statusFilter === 'ALL' || i.status === statusFilter);
  });

  if (checking) {
    return (
      <main className="section wrap">
        <h2>관리자 확인 중...</h2>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="section wrap">
        <div className="eyebrow">PRIVATE DASHBOARD</div>
        <h2>관리자 로그인</h2>

        <form className="form" onSubmit={login}>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="cta" disabled={busy}>
            로그인
          </button>
        </form>

        <p className="status" role="status">{message}</p>
      </main>
    );
  }

  return (
    <main className="section wrap">
      <div className="eyebrow">AIGEN COMMS ADMIN</div>
      <h2>관리자 대시보드 V5</h2>

      <nav style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        margin: '24px 0',
      }}>
        {([
          ['dashboard', '대시보드'],
          ['projects', '시공 사례 관리'],
          ['inquiries', `견적 문의 관리 (${newCount})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{
              ...buttonStyle,
              background: tab === key ? '#111' : '#fff',
              color: tab === key ? '#fff' : '#111',
            }}
          >
            {label}
          </button>
        ))}

        <button
          type="button"
          style={buttonStyle}
          disabled={busy}
          onClick={() => void loadData()}
        >
          새로고침
        </button>

        <button
          type="button"
          style={{ ...buttonStyle, marginLeft: 'auto', background: '#fff' }}
          disabled={busy || uploading}
          onClick={() => void logout()}
        >
          로그아웃
        </button>
      </nav>

      {tab === 'dashboard' && (
        <>
          <h3>전체 운영 현황</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 16,
            marginTop: 20,
          }}>
            {[
              ['전체 시공 사례', projects.length],
              ['공개 사례', publishedCount],
              ['전체 견적 문의', inquiries.length],
              ['신규 문의', newCount],
            ].map(([label, value]) => (
              <div key={label} style={{
                padding: 24,
                border: '1px solid #ddd',
                borderRadius: 8,
              }}>
                <p className="muted">{label}</p>
                <strong style={{ fontSize: 32 }}>{value}</strong>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 36 }}>최근 견적 문의</h3>

          {inquiries.length === 0 ? (
            <p>접수된 문의가 없습니다.</p>
          ) : (
            inquiries.slice(0, 5).map(i => (
              <div key={i.id} style={{
                padding: '14px 0',
                borderBottom: '1px solid #ddd',
              }}>
                <strong>{i.name}</strong>
                {' · '}
                {i.category || '종류 미입력'}
                {' · '}
                {statusNames[i.status] || i.status}
                <div className="muted">
                  {new Date(i.createdAt).toLocaleString('ko-KR')}
                </div>
              </div>
            ))
          )}

          <button
            type="button"
            style={{ ...buttonStyle, marginTop: 20 }}
            onClick={() => setTab('inquiries')}
          >
            전체 문의 관리하기
          </button>
        </>
      )}

      {tab === 'projects' && (
        <>
          <form className="form" onSubmit={createProject}>
            <h3>시공 사례 신규 등록</h3>

            <label>영문 주소 (slug)</label>
            <input
              name="slug"
              required
              pattern="[a-z0-9-]{3,80}"
              placeholder="hongdae-channel-sign"
            />

            <label>프로젝트명</label>
            <input name="title" required minLength={2} maxLength={150} />

            <label>간판 종류</label>
            <select name="category">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>

            <label>시공 지역</label>
            <input name="region" maxLength={100} />

            <label>시공 설명</label>
            <textarea name="description" maxLength={5000} />

            <h4>시공 사진</h4>
            {photoManager('new')}

            <button
              className="cta"
              disabled={busy || uploading}
              style={{ marginTop: 20 }}
            >
              시공 사례 등록
            </button>
          </form>

          <h3 style={{ marginTop: 40 }}>
            등록된 사례 ({projects.length})
          </h3>

          {projects.map(project => (
            <div key={project.id} style={{
              padding: '20px 0',
              borderBottom: '1px solid #ddd',
            }}>
              <strong>{project.title}</strong>

              <p>
                {project.category}
                {' · '}
                {project.region || '지역 미입력'}
                {' · '}
                {project.published ? '공개' : '비공개'}
                {' · '}
                사진 {project.images.length}장
              </p>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => startEdit(project)}
                >수정</button>

                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => void toggleProject(project)}
                >
                  {project.published ? '비공개 전환' : '공개 전환'}
                </button>

                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => void deleteProject(project)}
                >삭제</button>
              </div>
            </div>
          ))}

          {editing && (
            <form
              key={editing.id}
              className="form"
              onSubmit={saveEdit}
              style={{ marginTop: 40 }}
            >
              <h3>시공 사례 수정</h3>

              <label>영문 주소</label>
              <input
                name="slug"
                defaultValue={editing.slug}
                required
                pattern="[a-z0-9-]{3,80}"
              />

              <label>프로젝트명</label>
              <input
                name="title"
                defaultValue={editing.title}
                required
                minLength={2}
                maxLength={150}
              />

              <label>간판 종류</label>
              <select
                name="category"
                defaultValue={editing.category}
              >
                {!categories.includes(editing.category) && (
                  <option>{editing.category}</option>
                )}
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>

              <label>시공 지역</label>
              <input
                name="region"
                defaultValue={editing.region || ''}
                maxLength={100}
              />

              <label>시공 설명</label>
              <textarea
                name="description"
                defaultValue={editing.description}
                maxLength={5000}
              />

              <h4>사진 관리</h4>
              {photoManager('edit')}

              <div style={{
                display: 'flex',
                gap: 10,
                marginTop: 20,
              }}>
                <button
                  className="cta"
                  disabled={busy || uploading}
                >
                  변경사항 저장
                </button>

                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => {
                    setEditing(null);
                    setEditPhotos([]);
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {tab === 'inquiries' && (
        <>
          <h3>견적 문의 관리</h3>
          <p className="muted">
            전체 {inquiries.length}건 · 신규 {newCount}건
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            margin: '20px 0',
          }}>
            <input
              aria-label="문의 검색"
              placeholder="고객명, 전화번호, 지역 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: 12, flex: 1, minWidth: 200 }}
            />

            <select
              aria-label="처리 상태 필터"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: 12 }}
            >
              <option value="ALL">전체 상태</option>
              <option value="NEW">신규</option>
              <option value="IN_PROGRESS">상담 중</option>
              <option value="DONE">완료</option>
            </select>
          </div>

          {filteredInquiries.length === 0 && (
            <p>조건에 맞는 문의가 없습니다.</p>
          )}

          {filteredInquiries.map(inquiry => (
            <article key={inquiry.id} style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 22,
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}>
                <h4>{inquiry.name}</h4>
                <strong>
                  {statusNames[inquiry.status] || inquiry.status}
                </strong>
              </div>

              <p className="muted">
                접수일: {new Date(inquiry.createdAt).toLocaleString('ko-KR')}
              </p>

              <p>
                <strong>연락처:</strong>{' '}
                <a href={`tel:${inquiry.phone}`}>
                  {inquiry.phone}
                </a>
              </p>

              <p>
                <strong>시공 지역:</strong>{' '}
                {inquiry.region || '미입력'}
              </p>

              <p>
                <strong>간판 종류:</strong>{' '}
                {inquiry.category || '미입력'}
              </p>

              <p>
                <strong>제작 규격:</strong>{' '}
                {inquiry.dimensions || '미입력'}
              </p>

              <div style={{
                background: '#f5f5f5',
                padding: 16,
                margin: '16px 0',
                borderRadius: 6,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}>
                <strong>문의 내용</strong>
                <p>{inquiry.message}</p>
              </div>

              <label htmlFor={`status-${inquiry.id}`}>
                처리 상태
              </label>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 8,
              }}>
                <select
                  id={`status-${inquiry.id}`}
                  value={inquiry.status}
                  disabled={busy}
                  onChange={e =>
                    void changeInquiryStatus(
                      inquiry.id,
                      e.target.value
                    )
                  }
                  style={{ padding: 10 }}
                >
                  {!statusNames[inquiry.status] && (
                    <option value={inquiry.status}>
                      {inquiry.status}
                    </option>
                  )}
                  <option value="NEW">신규</option>
                  <option value="IN_PROGRESS">상담 중</option>
                  <option value="DONE">완료</option>
                </select>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteInquiry(inquiry)}
                  style={{ color: '#c62828' }}
                >
                  문의 삭제
                </button>
              </div>
            </article>
          ))}
        </>
      )}

      <p
        className="status"
        role="status"
        style={{
          marginTop: 24,
          whiteSpace: 'pre-wrap',
        }}
      >
        {message}
      </p>
    </main>
  );
}
