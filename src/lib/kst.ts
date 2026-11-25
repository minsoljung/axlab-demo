// 한국 표준시(KST, UTC+9) 달력 날짜 도구. 종료 예정일 비교 기준(AC-006-2·3, 가정: KST 달력 날짜).
const FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function kstYmd(d: Date): string {
  return FMT.format(d);
}
export function startOfKstDay(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000+09:00`);
}
// 종료 예정일은 그 KST 날짜의 마지막 순간으로 저장한다 — 오늘로 정해도 오늘 안에는 진행 중이다.
export function endOfKstDay(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999+09:00`);
}
export function isYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
