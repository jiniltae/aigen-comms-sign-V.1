
'use client';

import { useState, type FormEvent } from 'react';

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  region: string | null;
  description: string;
  published: boolean;
  images: { id: string; url: string; alt: string }[];
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
  const [image, setImage] = useState('');
  const [items, setItems] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    try {
      const r = await fetch('/api/admin/projects', {
        cache: 'no-store',
      });

      if (r.status === 401) {
        setAuthorized(false);
        setMessage('로그인이 만료되었습니다. 다시 로그인하세요.');
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
      setMessage('서버 연결에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setMessage('사진은 8MB 이하만 업로드할 수 있습니다.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('JPG, PNG, WEBP 파일만 가능합니다.');
      return;
    }

    setUploading(true);

    try {
      const f = new FormData();
      f.append('file', file);

      const r = await fetch('/api/admin/upload', {
        method: 'POST',
        body: f,
      });

      const d = await r.json();

      if (!r.ok) {
        throw new Error(d.error || '업로드 실패');
      }

      setImage(d.url);
      setMessage('사진 업로드 완료');
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : '업로드 실패'
      );
    } finally {
      setUploading(false);
    }
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (uploading || busy) return;

    setBusy(true);
    const form = e.currentTarget;

    const f = new FormData(form);
    const v = Object.fromEntries(f.entries());

    const payload = {
      slug: String(v.slug),
      title: String(v.title),
      category: String(v.category),
      region: String(v.region || ''),
      description: String(v.description || ''),
      published: true,
      images: image
        ? [{ url: image, alt: String(v.title) }]
        : [],
    };

    try {
      const r = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        throw new Error(
          '등록 실패: 영문 주소 중복 또는 입력값을 확인하세요.'
        );
      }

      setMessage('시공 사례 등록 완료');
      setImage('');
      form.reset();
      await load();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : '등록 실패'
      );
    } finally {
      setBusy(false);
    }
  }

  async function update(
    id: string,
    data: Partial<Project>
  ) {
    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!r.ok) throw new Error('수정 실패');

      setMessage('시공 사례 수정 완료');
      setEditing(null);
      await load();
    } catch {
      setMessage('수정 실패: 입력값 또는 영문 주소 중복을 확인하세요.');
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing || busy) return;

    const f = new FormData(e.currentTarget);

    await update(editing.id, {
      slug: String(f.get('slug')),
      title: String(f.get('title')),
      category: String(f.get('category')),
      region: String(f.get('region') || ''),
      description: String(f.get('description') || ''),
    });
  }

  async function togglePublished(project: Project) {
    if (busy) return;

    await update(project.id, {
      published: !project.published,
    });
  }

  async function remove(project: Project) {
    if (busy) return;

    const confirmed = window.confirm(
      `"${project.title}" 시공 사례를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`
    );

    if (!confirmed) return;

    setBusy(true);

    try {
      const r = await fetch(
        `/api/admin/projects/${encodeURIComponent(project.id)}`,
        { method: 'DELETE' }
      );

      if (!r.ok) throw new Error('삭제 실패');

      setMessage('시공 사례 삭제 완료');

      if (editing?.id === project.id) {
        setEditing(null);
      }

      await load();
    } catch {
      setMessage('시공 사례 삭제에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section wrap">
      <div className="eyebrow">PRIVATE DASHBOARD</div>
      <h2>관리자 페이지</h2>

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
            <h3>시공 사례 등록</h3>

            <label>영문 주소 (slug)</label>
            <input
              name="slug"
              required
              placeholder="hongdae-channel-sign"
              pattern="[a-z0-9-]{3,80}"
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
            <textarea name="description" maxLength={5000} />

            <label>사진 (JPG, PNG, WEBP / 8MB 이하)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading || busy}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />

            {image && (
              <img
                src={image}
                alt="업로드 미리보기"
                style={{
                  maxWidth: 250,
                  display: 'block',
                  marginTop: 12,
                }}
              />
            )}

            <button
              className="cta"
              disabled={busy || uploading}
            >
              {uploading
                ? '사진 업로드 중...'
                : busy
                ? '처리 중...'
                : '사례 등록'}
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
                <div style={{ marginBottom: 12 }}>
                  <strong>{project.title}</strong>
                  <div style={{ marginTop: 6 }}>
                    {project.category} · {project.region || '지역 미입력'}
                    {' · '}
                    {project.published ? '공개' : '비공개'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditing(project)}
                  >
                    수정
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => togglePublished(project)}
                  >
                    {project.published ? '비공개 전환' : '공개 전환'}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
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
                pattern="[a-z0-9-]{3,80}"
                required
              />

              <label>프로젝트명</label>
              <input
                name="title"
                defaultValue={editing.title}
                minLength={2}
                maxLength={150}
                required
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

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <button
                  className="cta"
                  disabled={busy}
                  type="submit"
                >
                  변경사항 저장
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(null)}
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
