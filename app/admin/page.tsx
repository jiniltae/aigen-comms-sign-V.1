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
