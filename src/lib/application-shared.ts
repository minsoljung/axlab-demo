// 클라이언트·서버 공용 순수 검증 (prisma 를 import 하지 않는다)
export type ApplicationInput = { name: string; phone: string; consent: boolean };
export type ApplicationErrors = { name?: string; phone?: string; consent?: string };

export const MESSAGES = {
  name: "이름을 입력해 주세요",
  phone: "휴대전화번호를 확인해 주세요",
  consent: "개인정보 수집·이용에 동의해 주세요",
  duplicate: "이미 응모한 번호입니다",
} as const;

// 휴대전화번호 규칙(AC 는 숫자 아닌 값만 정한다 → 가정): 하이픈·공백은 허용해 제거하고, 숫자 9~11자리만 유효.
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[-\s]/g, "");
  return /^\d{9,11}$/.test(digits) ? digits : null;
}

export function validateApplication(
  i: ApplicationInput,
): { ok: true; phone: string } | { ok: false; errors: ApplicationErrors } {
  const errors: ApplicationErrors = {};
  if (!i.name || i.name.trim() === "") errors.name = MESSAGES.name;
  const phone = typeof i.phone === "string" ? normalizePhone(i.phone) : null;
  if (!phone) errors.phone = MESSAGES.phone;
  if (i.consent !== true) errors.consent = MESSAGES.consent;
  if (Object.keys(errors).length > 0 || !phone) return { ok: false, errors };
  return { ok: true, phone };
}

