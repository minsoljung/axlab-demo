# 테스트 훅 (e2e-writer·reviewer 용)

- 존재 조건: `APP_TEST_MODE=1` 이고 `NODE_ENV!=='production'`. 아니면 `/api/test/*` 전부 404.
- 서버: `npm run start:test` → `next dev -p 3100`(NODE_ENV=development), `.env.test` 의 테스트 DB. 계약상 production 에서는 훅이 꺼지므로 `next start` 를 쓰지 않는다. 시작 시 주요 경로를 한 번씩 불러 컴파일 지연을 없앤다(`[start:test] ready` 출력 뒤 사용).
- 구현 위치: `src/lib/testHooks.ts`(fail/delay/게이트) · `src/lib/clock.ts` · `src/lib/adminCode.ts` · `src/app/api/test/*/route.ts`.

| 훅 | 요청 | 효과 |
|---|---|---|
| reset | `POST /api/test/reset {"seed":"default"}` | DB 초기화 + 시드. 시계 고정·접근 코드 override·대기 중 fail/delay 도 해제. 모르는 시드 400 |
| seed-info | `GET /api/test/seed-info` | `[{id,title,carrier,status("진행 중"\|"종료"),startsAt,endsAt,content}]` |
| clock | `POST /api/test/clock {"now":"<ISO>"}` / `{"now":null}` | 서버 시계 고정·해제. 종료 예정일 판정·(관리자) 세션 만료가 이 시계를 쓴다 |
| fail-next | `POST /api/test/fail-next {"route":"/api/events","status":500}` | 경로가 `route` 로 시작하는 다음 1회 요청만 그 상태로 실패 |
| delay-next | `POST /api/test/delay-next {"route":"/api/events","ms":1500}` | 같은 방식으로 다음 1회 요청만 지연 |
| counts | `GET /api/test/counts` | `{events, applications, applicationsByEvent:{[id]:n}}` |
| admin-code | `POST /api/test/admin-code {"code":"x"\|null}` | 실행 중 접근 코드 변경(null=환경변수 복귀). 관리자 슬라이스에서 사용 |

## 시드
- `default`: 통신사 A·B·C. 진행 중 4(evt-a1·evt-a2 = A, evt-b1 = B, evt-c1 = C) + 종료 1(evt-b-closed, 통신사 B, 기간 만료). id 는 고정값.
- `empty`: 통신사만, 이벤트 0건. `carrier-c-empty`: default 에서 통신사 C 이벤트만 뺀 것.

## 주의
- fail-next/delay-next 는 **API 경로**에 건다(화면 경로 아님). 방문자 화면이 쓰는 API: `GET /api/events`, `GET /api/events/:id`, `POST /api/events/:id/applications`.
- 같은 prefix 의 다른 요청이 먼저 오면 그것이 소진한다(예: `/api/events` 는 `/api/events/:id/...` 도 맞는다). 가능하면 정확한 경로를 쓴다.
- 응모 API 응답: 201 성공 · 400 검증 실패 · 403 종료된 이벤트 · 404 없는 이벤트 · 409 중복 번호.
