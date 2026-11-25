// 관리자 접근 코드. 환경변수 ADMIN_ACCESS_CODE 가 기본이고, 테스트 훅이 실행 중에 바꿀 수 있다(A-22 코드 변경).
const g = globalThis as unknown as { __adminCodeOverride?: string | null };

export function getAdminCode(): string | undefined {
  return g.__adminCodeOverride ?? process.env.ADMIN_ACCESS_CODE;
}
export function setAdminCodeOverride(code: string | null): void {
  g.__adminCodeOverride = code;
}
