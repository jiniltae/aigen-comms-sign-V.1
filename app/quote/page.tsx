
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'error';

const categories = [
  '미정',
  '채널간판',
  '스카시간판',
  '플렉스간판',
  '갈바간판',
  '돌출간판',
  '네온사인',
  '실내사인',
  '기타',
];

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

    if (!payload.name) {
      setStatus('error');
      setMessage('성함 또는 업체명을 입력해 주세요.');
      return;
    }

    if (!/^[0-9+()\-\s]{7,30}$/.test(payload.phone)) {
      setStatus('error');
      setMessage('올바른 연락처를 입력해 주세요. (예: 010-1234-5678)');
      return;
    }

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
        setMessage('입력하신 정보를 확인하고 올바른 형식으로 작성해 주세요.');
        return;
      }

      if (!r.ok) {
        throw new Error('Server error');
      }

      setStatus('success');
      setMessage('견적 문의가 정상적으로 접수되었습니다. 확인 후 연락드리겠습니다.');
      form.reset();
    } catch {
      setStatus('error');
      setMessage('일시적으로 접수가 어렵습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  return (
    <main className="quote-page">
      <section className="quote-hero">
        <div className="wrap">
          <div className="home-section-index">
            <span className="home-orange-dot" />
            AIGEN COMMS / CONTACT
          </div>

          <div className="quote-hero-grid">
            <div>
              <p className="quote-hero-eyebrow">
                YOUR PROJECT, OUR EXPERTISE
              </p>
              <h1>
                LET&apos;S MAKE
                <br />
                IT <span>REAL.</span>
              </h1>
            </div>

            <div className="quote-hero-description">
              <strong>
                브랜드의 첫인상을 만드는 일,
                <br />
                아이젠컴즈와 시작하세요.
              </strong>
              <p>
                간판 기획부터 디자인, 제작, 시공까지.
                <br />
                프로젝트에 필요한 내용을 남겨주시면
                확인 후 상담을 도와드리겠습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="quote-content">
        <div className="wrap quote-layout">
          <aside className="quote-sidebar">
            <div className="home-section-index">
              <span className="home-orange-dot" />
              PROJECT INQUIRY
            </div>

            <h2>
              프로젝트를
              <br />
              알려주세요<span>.</span>
            </h2>

            <p>
              아직 구체적인 규격이나 간판 종류가
              정해지지 않아도 괜찮습니다.
              알고 계신 내용만 작성해 주세요.
            </p>

            <div className="quote-sidebar-divider" />

            <div className="quote-sidebar-note">
              <span>01 / INQUIRY</span>
              <strong>문의 접수</strong>
              <p>프로젝트 기본 정보를 입력합니다.</p>
            </div>

            <div className="quote-sidebar-note">
              <span>02 / REVIEW</span>
              <strong>내용 검토</strong>
              <p>설치 환경과 요청 사항을 확인합니다.</p>
            </div>

            <div className="quote-sidebar-note">
              <span>03 / CONSULTING</span>
              <strong>상담 안내</strong>
              <p>확인 후 연락처로 안내드립니다.</p>
            </div>

            <Link href="/projects" className="quote-project-link">
              시공 사례 먼저 살펴보기 ↗
            </Link>
          </aside>

          <div className="quote-form-panel">
            <div className="quote-form-heading">
              <div>
                <span>START YOUR PROJECT</span>
                <h2>견적 문의하기</h2>
              </div>
              <span className="quote-required-guide">
                * 필수 입력 항목
              </span>
            </div>

            <form className="quote-form" onSubmit={submit}>
              <div className="quote-form-section">
                <div className="quote-form-section-title">
                  <span>01</span>
                  <h3>기본 정보</h3>
                </div>

                <div className="quote-field-grid">
                  <div className="quote-field">
                    <label htmlFor="quote-name">
                      성함 / 업체명 <em>*</em>
                    </label>
                    <input
                      id="quote-name"
                      name="name"
                      required
                      maxLength={80}
                      placeholder="성함 또는 업체명"
                    />
                  </div>

                  <div className="quote-field">
                    <label htmlFor="quote-phone">
                      연락처 <em>*</em>
                    </label>
                    <input
                      id="quote-phone"
                      name="phone"
                      type="tel"
                      required
                      maxLength={30}
                      inputMode="tel"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
              </div>

              <div className="quote-form-section">
                <div className="quote-form-section-title">
                  <span>02</span>
                  <h3>프로젝트 정보</h3>
                </div>

                <div className="quote-field-grid">
                  <div className="quote-field">
                    <label htmlFor="quote-region">
                      설치 지역
                    </label>
                    <input
                      id="quote-region"
                      name="region"
                      maxLength={100}
                      placeholder="예: 서울 마포구"
                    />
                  </div>

                  <div className="quote-field">
                    <label htmlFor="quote-category">
                      간판 종류
                    </label>
                    <select
                      id="quote-category"
                      name="category"
                      defaultValue="미정"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="quote-field quote-field-full">
                    <label htmlFor="quote-dimensions">
                      예상 규격
                    </label>
                    <input
                      id="quote-dimensions"
                      name="dimensions"
                      maxLength={100}
                      placeholder="예: 가로 3000 × 세로 800 mm"
                    />
                    <small>
                      규격을 모르시면 비워두셔도 됩니다.
                    </small>
                  </div>
                </div>
              </div>

              <div className="quote-form-section">
                <div className="quote-form-section-title">
                  <span>03</span>
                  <h3>요청 사항</h3>
                </div>

                <div className="quote-field">
                  <label htmlFor="quote-message">
                    프로젝트 상세 내용 <em>*</em>
                  </label>
                  <textarea
                    id="quote-message"
                    name="message"
                    required
                    maxLength={3000}
                    rows={7}
                    placeholder={
                      '제작 및 시공에 필요한 내용을 자유롭게 작성해 주세요.\n\n예시)\n- 설치 위치: 건물 2층 외벽\n- 희망 간판: LED 채널간판\n- 요청 사항: 디자인 및 시공 포함'
                    }
                  />
                </div>
              </div>

              <div className="quote-privacy">
                <label>
                  <input type="checkbox" required />
                  <span>
                    <strong>
                      개인정보 수집·이용에 동의합니다. (필수)
                    </strong>
                    <small>
                      수집 항목: 성함·업체명, 연락처,
                      문의 내용 및 입력한 프로젝트 정보
                      <br />
                      이용 목적: 견적 상담 및 문의 응대
                      <br />
                      보유 기간: 내부 보유정책에 따른 보관 후 삭제
                    </small>
                  </span>
                </label>
              </div>

              <button
                className="quote-submit"
                type="submit"
                disabled={status === 'loading'}
              >
                <span>
                  {status === 'loading'
                    ? '접수 중...'
                    : '견적 문의 접수하기'}
                </span>
                <span>↗</span>
              </button>

              {message && (
                <p
                  className={`quote-status quote-status-${status}`}
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      <section className="quote-bottom">
        <div className="wrap">
          <div className="home-section-index">
            AIGEN COMMS / WORKS
          </div>
          <h2>
            GOOD DESIGN.
            <br />
            GREAT IMPACT<span>.</span>
          </h2>
          <Link href="/projects">
            OUR PROJECTS ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
