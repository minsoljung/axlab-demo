import { kstYmd } from "./kst";

// 기간 표기 "시작일 ~ 종료 예정일" (SCR-02). 날짜는 KST 달력 날짜로 쓴다(관리자 입력 기준과 같게).
export function formatPeriod(startsAt: string, endsAt: string): string {
  return `${kstYmd(new Date(startsAt))} ~ ${kstYmd(new Date(endsAt))}`;
}
