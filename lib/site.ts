export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://aigen-comms.vercel.app').replace(/\/$/, '');
export const SITE_NAME = 'AIGEN COMMS | 아이젠컴즈';
export const SITE_DESCRIPTION = '아이젠컴즈는 채널간판·스카시간판·플렉스간판·갈바간판의 디자인, 제작, 시공을 진행합니다. 시공 사례를 확인하고 맞춤 견적을 문의하세요.';
export function absoluteUrl(path = '/') { return new URL(path, SITE_URL).toString(); }
