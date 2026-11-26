import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkSession } from "./adminSession";
import { COOKIE } from "./adminAuth";

// SCR-05 로 이동할 때 안내 문구를 함께 보이게 하는 주소. 처음부터 /admin 을 연 경우(안내 없음)와 구분한다(AC-008-1·15·20).
export const NOTICE_URL = "/admin?notice=1";

// SCR-06·07 서버 페이지 맨 앞에서 부른다. 세션이 없거나 만료·코드 변경이면 SCR-05 로 보낸다(A-16·A-22).
export async function requireAdminPage(): Promise<void> {
  const jar = await cookies();
  if ((await checkSession(jar.get(COOKIE)?.value)) !== "ok") redirect(NOTICE_URL);
}
