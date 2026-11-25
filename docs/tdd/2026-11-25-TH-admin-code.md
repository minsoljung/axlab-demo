AC: TH-admin-code
test: src/lib/testHooks.test.ts
red: npx vitest run src/lib/testHooks src/app/api/events/route src/app/api/test exit=1 | 1/1 실패: AssertionError: expected undefined to be 'other' // Object.is equality
green: npx vitest run src/lib/testHooks.test.ts exit=0 (전체 1건 통과)
refactor: vitest exit=0 (95 passed/0 failed) · tsc exit=0
