import { isYmd } from "./kst";

// SCR-07 폼 값(날짜는 KST 달력 날짜 YYYY-MM-DD)과 검증 문구. 클라이언트·서버가 같이 쓴다.
export type EventFormValues = { carrierId: string; title: string; startsAt: string; endsAt: string; content: string };
export type EventFormErrors = Partial<Record<"carrierId" | "title" | "period" | "endsAt" | "content", string>>;

export const MSG = {
  title: "제목을 입력해 주세요",
  carrier: "통신사를 선택해 주세요",
  period: "기간을 입력해 주세요",
  content: "내용을 입력해 주세요",
  past: "종료 예정일은 오늘 이전으로 바꿀 수 없습니다",
  closedDate: "종료된 이벤트는 종료 예정일을 바꿀 수 없습니다",
  saveFailed: "저장에 실패했습니다",
} as const;

// 필수 입력 검사(SCR-07 폼 상태 표). 날짜 선후·과거 판정은 서버 몫이다(오늘 기준 = 서버 시계).
export function validateRequired(v: EventFormValues): EventFormErrors {
  const e: EventFormErrors = {};
  if (!v.carrierId) e.carrierId = MSG.carrier;
  if (!v.title.trim()) e.title = MSG.title;
  if (!isYmd(v.startsAt) || !isYmd(v.endsAt)) e.period = MSG.period;
  if (!v.content.trim()) e.content = MSG.content;
  return e;
}
