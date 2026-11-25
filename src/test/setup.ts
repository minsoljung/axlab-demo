import { afterEach } from "vitest";

// jsdom 환경에서만 DOM 정리를 한다 (node 환경 테스트는 건드리지 않는다)
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});

// jsdom 에는 <dialog> 의 showModal·close 가 없다. astryx AlertDialog(SCR-06 종료 확인)가 쓰므로 최소 대체를 둔다.
if (typeof HTMLDialogElement !== "undefined") {
  const p = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  if (typeof p.showModal !== "function") {
    p.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (typeof p.close !== "function") {
    p.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
