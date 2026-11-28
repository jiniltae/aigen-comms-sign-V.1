
'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Quote() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status === 'loading') return;

    const form = e.currentTarget;
    const f = new FormData(form);

    const payload = {
      name: String(f.get('name') || '').trim(),
      phone: String(f.get('phone') || '').trim(),
      region: String(f.get('region') || '').trim(),
      category: String(f.get('category') || ''),
      dimensions: String(f.get('dimensions') || '').trim(),
      message: String(f.get('message') || '').trim(),
    };

    // 이름 검사
    if (!payload.name) {
      setStatus('error');
      setMessage('성함 또는 업체명을 입력해 주세요.');
      return;
    }

    // 서버 API와 동일한 전화번호 형식 검사
    if (!/^[0-9+()\-\s]{7,30}$/.test(payload.phone)) {
      setStatus('error');
      setMessage(
        '올바른 연락처를 입력해 주세요. (예: 010-1234-5678)'
      );
      return;
    }

    // 요청 내용 검사
    if (!payload.message) {
      setStatus('error');
      setMessage('요청 내용을 입력해 주세요.');
      return;
    }

    setStatus('loading');
    setMessage('견적 문의를 접수하고 있습니다...');

    try {
      const r = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (r.status === 400) {
        setStatus('error');
        setMessage(
          '입력하신 정보를 확인하고 올바른 형식으로 작성해 주세요.'
        );
        return;
      }

      if (!r.ok) {
        throw new Error('Server error');
      }

      setStatus('success');
      setMessage(
        '견적 문의가 정상적으로 접수되었습니다. 확인 후 연락드리겠습니다.'
      );

      form.reset();
    } catch {
      setStatus('error');
      setMessage(
        '일시적으로 접수가 어렵습니다. 잠시 후 다시 시도해 주세요.'
      );
    }
  }

  return (
    <main className="section wrap">
      <div className="eyebrow">CONTACT</div>
      <h2>간판 견적 문의</h2>

      <p className="muted">
        아래 내용을 입력해 주세요.
        사진 첨부는 스토리지 연결 후 활성화됩니다.
      </p>

      <form className="form" onSubmit={submit}>
        <label htmlFor="quote-name">성함 / 업체명 *</label>
        <input
          id="quote-name"
          name="name"
          required
          maxLength={80}
          placeholder="성함 또는 업체명을 입력해 주세요"
        />

        <label htmlFor="quote-phone">연락처 *</label>
        <input
          id="quote-phone"
          name="phone"
          type="tel"
          required
          maxLength={30}
          inputMode="tel"
          placeholder="010-1234-5678"
        />

        <label htmlFor="quote-region">설치 지역</label>
        <input
          id="quote-region"
          name="region"
          maxLength={100}
          placeholder="예: 서울 마포구"
        />

        <label htmlFor="quote-category">간판 종류</label>
        <select id="quote-category" name="category">
          <option>미정</option>
          <option>채널간판</option>
          <option>스카시간판</option>
          <option>플렉스간판</option>
          <option>갈바간판</option>
          <option>기타</option>
        </select>

        <label htmlFor="quote-dimensions">예상 규격</label>
        <input
          id="quote-dimensions"
          name="dimensions"
          maxLength={100}
          placeholder="예: 가로 3000 × 세로 800 mm"
        />

        <label htmlFor="quote-message">요청 내용 *</label>
        <textarea
          id="quote-message"
          name="message"
          required
          maxLength={3000}
          placeholder="간판 제작 및 시공 관련 요청사항을 입력해 주세요."
        />

        <label style={{ fontWeight: 400 }}>
          <input
            type="checkbox"
            required
            style={{ width: 'auto', marginRight: 8 }}
          />
          견적 상담을 위한 개인정보 수집·이용에 동의합니다.
          (성함, 연락처, 문의 내용 / 상담 완료 후 내부
          보유정책에 따라 삭제)
        </label>

        <button
          className="cta"
          type="submit"
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? '접수 중...'
            : '견적 문의 접수 →'}
        </button>

        {message && (
          <p
            className="status"
            role="status"
            aria-live="polite"
            style={{
              color:
                status === 'error'
                  ? '#c62828'
                  : status === 'success'
                    ? '#167a43'
                    : '#555',
              fontWeight:
                status === 'success' ? 600 : 400,
              marginTop: 12,
            }}
          >
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
