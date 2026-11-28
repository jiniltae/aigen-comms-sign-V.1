/** Optional notification. Does not affect inquiry persistence or customer success response. */
export async function notifyNewInquiry(data: { name: string; phone: string; region?: string | null; category?: string | null; dimensions?: string | null; message: string; attachmentCount: number }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFY_TO;
  const from = process.env.INQUIRY_NOTIFY_FROM;
  if (!apiKey || !to || !from) return;
  const plain = [
    '아이젠컴즈 신규 견적 문의', '',
    `고객명: ${data.name}`, `연락처: ${data.phone}`,
    `지역: ${data.region || '-'}`, `종류: ${data.category || '-'}`,
    `규격: ${data.dimensions || '-'}`, `사진: ${data.attachmentCount}장`,
    '', '문의 내용:', data.message, '', '관리자 페이지에서 상세 내용을 확인하세요.',
  ].join('\n');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: to.split(',').map(x => x.trim()).filter(Boolean), subject: '[AIGEN COMMS] 신규 견적 문의 접수', text: plain }),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) console.error('Inquiry notification delivery failed', response.status);
  } catch (error) { console.error('Inquiry notification transport failed', error instanceof Error ? error.name : 'unknown'); }
  finally { clearTimeout(timeout); }
}
