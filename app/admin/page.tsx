
'use client';

import { useState, type FormEvent } from 'react';

type ProjectImage = {
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
  images: ProjectImage[];
};

const categories = [
  '채널간판',
  '스카시간판',
  '플렉스간판',
  '갈바간판',
  '돌출간판',
  '어닝',
  '실내사인',
];

export default function Admin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [message, setMessage] = useState('');
  const [items, setItems] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);

  const [newImages, setNewImages] = useState<ProjectImage[]>([]);
  const [editImages, setEditImages] = useState<ProjectImage[]>([]);

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    try {
      const r = await fetch('/api/admin/projects', {
        cache: 'no-store',
      });

      if (r.status === 401) {
        setAuthorized(false);
        setMessage('로그인이 만료되었습니다.');
        return;
      }

      if (!r.ok) throw new Error('목록 조회 실패');

      setItems(await r.json());
    } catch {
      setMessage('시공 사례 목록을 불러오지 못했습니다.');
    }
  }

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      setAuthorized(r.ok);
      setMessage(r.ok ? '로그인 성공' : '로그인 실패');

      if (r.ok) {
        setPassword('');
        await load();
      }
    } catch {
      setMessage('서버 연결 실패');
    } finally {
      setBusy(false);
    }
  }

  async function uploadFiles(
    files: FileList,
    target: 'new' | 'edit'
  ) {
    const current = target === 'new' ? newImages : editImages;

    if (current.length + files.length > 30) {
      setMessage('사진은 최대 30장까지 등록할 수 있습니다.');
      return;
    }

    setUploading(true);

    const uploaded: ProjectImage[] = [];

    try {
      for (const file of Array.from(files)) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
          file.size === 0 ||
          file.size > 8 * 1024 * 1024
        ) {
          throw new Error(
            `${file.name}: JPG, PNG, WEBP / 8MB 이하만 가능합니다.`
          );
        }

        const form = new FormData();
        form.append('file', file);

        const r = await fetch('/api/admin/upload', {
          method: 'POST',
          body: form,
        });

        const data = await r.json();

        if (!r.ok) {
          throw new Error(data.error || '사진 업로드 실패');
        }

        uploaded.push({
          url: data.url,
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
          setNewImages(prev => [...prev, ...uploaded]);
        } else {
          setEditImages(prev => [...prev, ...uploaded]);
        }
      }

      setUploading(false);
    }
  }

  function moveImage(
    index: number,
    direction: number,
    target: 'new' | 'edit'
  ) {
    const setter = target === 'new' ? setNewImages : setEditImages;

    setter(prev => {
      const next = [...prev];
      const other = index + direction;

      if (other < 0 || other >= next.length) return prev;

      [next[index], next[other]] = [next[other], next[index]];
      return next;
    });
  }

  function removeImage(
    index: number,
    target: 'new' | 'edit'
  ) {
    const setter = target === 'new' ? setNewImages : setEditImages;
    setter(prev => prev.filter((_, i) => i !== index));
  }

  function imageManager(target: 'new' | 'edit') {
    const images = target === 'new' ? newImages : editImages;

    return (
      <div style={{ marginTop: 16 }}>
        <p>
          <strong>사진 {images.length}/30장</strong>
          {' · '}첫 번째 사진이 대표 이미지입니다.
        </p>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || uploading}
          onChange={e => {
            if (e.target.files?.length) {
              uploadFiles(e.target.files, target);
            }
            e.target.value = '';
          }}
        />

        {uploading && <p>사진 업로드 중...</p>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
            marginTop: 20,
          }}
        >
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              style={{
                border: '1px solid #ddd',
                padding: 10,
                borderRadius: 8,
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                style={{
                  width: '100%',
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />

              <p style={{ fontSize: 13 }}>
                {index === 0
                  ? '대표 사진'
                  : `${index + 1}번 사진`}
              </p>

              <input
                aria-label={`${index + 1}번 사진 설명`}
                value={image.alt}
                maxLength={200}
                onChange={e => {
                  const setter =
                    target === 'new' ? setNewImages : setEditImages;

                  const value = e.target.value;

                  setter(prev =>
                    prev.map((item, i) =>
                      i === index ? { ...item, alt: value } : item
                    )
                  );
                }}
              />

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  disabled={busy || uploading || index === 0}
                  onClick={() => moveImage(index, -1, target)}
                >
                  ←
                </button>

                <button
                  type="button"
                  disabled={
                    busy ||
                    uploading ||
                    index === images.length - 1
                  }
                  onClick={() => moveImage(index, 1, target)}
                >
                  →
                </button>

                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => removeImage(index, target)}
                  style={{ color: '#c62828' }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || uploading) return;

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      slug: String(data.get('slug')),
      title: String(data.get('title')),
      category: String(data.get('category')),
      region: String(data.get('region') || ''),
      description: String(data.get('description') || ''),
      published: true,
      images: newImages.map(({ url, alt }) => ({ url, alt })),
    };

    setBusy(true);

    try {
      const r = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        throw new Error('등록 실패: 영문 주소 중복 등을 확인하세요.');
      }

      setNewImages([]);
      form.reset();
      setMessage('시공 사례 등록 완료');
      await load();
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
    setEditImages(
      [...project.images].sort(
        (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
      )
    );
    setMessage('수정할 내용을 변경한 후 저장하세요.');
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || busy || uploading) return;

    const data = new FormData(e.currentTarget);

    const payload = {
      slug: String(data.get('slug')),
      title: String(data.get('title')),
      category: String(data.get('category')),
      region: String(data.get('region') || ''),
      description: String(data.get('description') || ''),
      images: editImages.map(({ url, alt }) => ({ url, alt })),
    };

    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(editing.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!r.ok) throw new Error('수정 저장 실패');

      setEditing(null);
      setEditImages([]);
      setMessage('시공 사례 및 사진 저장 완료');
      await load();
    } catch {
      setMessage('수정 실패: 입력값과 영문 주소 중복을 확인하세요.');
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(project: Project) {
    if (busy || uploading) return;

    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            published: !project.published,
          }),
        }
      );

      if (!r.ok) throw new Error();

      setMessage(
        project.published
          ? '비공개로 전환했습니다.'
          : '공개로 전환했습니다.'
      );

      await load();
    } catch {
      setMessage('공개 상태 변경 실패');
    } finally {
      setBusy(false);
    }
  }

  async function remove(project: Project) {
    if (busy || uploading) return;

    if (
      !window.confirm(
        `"${project.title}" 사례를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}`,
        { method: 'DELETE' }
      );

      if (!r.ok) throw new Error();

      if (editing?.id === project.id) {
        setEditing(null);
        setEditImages([]);
      }

      setMessage('시공 사례 삭제 완료');
      await load();
    } catch {
      setMessage('삭제 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section wrap">
      <div className="eyebrow">PRIVATE DASHBOARD</div>
      <h2>관리자 페이지 V3</h2>

      {!authorized ? (
        <form className="form" onSubmit={login}>
          <label>관리자 이메일</label>
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
            {busy ? '로그인 중...' : '로그인'}
          </button>
        </form>
      ) : (
        <>
          <form className="form" onSubmit={create}>
            <h3>시공 사례 신규 등록</h3>

            <label>영문 주소 (slug)</label>
            <input
              name="slug"
              required
              pattern="[a-z0-9-]{3,80}"
              placeholder="hongdae-channel-sign"
            />

            <label>프로젝트명</label>
            <input
              name="title"
              required
              minLength={2}
              maxLength={150}
            />

            <label>간판 종류</label>
            <select name="category">
              {categories.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <label>시공 지역</label>
            <input name="region" maxLength={100} />

            <label>시공 설명</label>
            <textarea
              name="description"
              maxLength={5000}
            />

            <h4>시공 사진 등록</h4>
            {imageManager('new')}

            <button
              className="cta"
              disabled={busy || uploading}
              style={{ marginTop: 20 }}
            >
              {busy ? '등록 중...' : '시공 사례 등록'}
            </button>
          </form>

          <h3 style={{ marginTop: 40 }}>등록된 사례</h3>

          <div className="admin-list">
            {items.length === 0 && (
              <p>등록된 시공 사례가 없습니다.</p>
            )}

            {items.map(project => (
              <div
                className="admin-row"
                key={project.id}
                style={{
                  padding: '20px 0',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <strong>{project.title}</strong>

                <p>
                  {project.category} · {project.region || '지역 미입력'}
                  {' · '}
                  {project.published ? '공개' : '비공개'}
                  {' · '}
                  사진 {project.images.length}장
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    disabled={busy || uploading}
                    onClick={() => startEdit(project)}
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    disabled={busy || uploading}
                    onClick={() => togglePublished(project)}
                  >
                    {project.published
                      ? '비공개 전환'
                      : '공개 전환'}
                  </button>

                  <button
                    type="button"
                    disabled={busy || uploading}
                    onClick={() => remove(project)}
                    style={{ color: '#c62828' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

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
                {categories.map(c => (
                  <option key={c}>{c}</option>
                ))}
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

              <h4>사진 추가·삭제·순서 변경</h4>
              {imageManager('edit')}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <button
                  className="cta"
                  type="submit"
                  disabled={busy || uploading}
                >
                  변경사항 저장
                </button>

                <button
                  type="button"
                  disabled={busy || uploading}
                  onClick={() => {
                    setEditing(null);
                    setEditImages([]);
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <p className="status" role="status">
        {message}
      </p>
    </main>
  );
}
