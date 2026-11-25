AC: TH-fail-next
test: src/app/api/test/routes.test.ts, src/lib/testHooks.test.ts
red: npx vitest run src/lib/testHooks src/app/api/events/route src/app/api/test exit=1 | 6/6 실패: AssertionError: expected undefined to be 500 // Object.is equality
green: npx vitest run src/app/api/test/routes.test.ts src/lib/testHooks.test.ts exit=0 (전체 6건 통과)
refactor: vitest exit=0 (95 passed/0 failed) · tsc exit=0
