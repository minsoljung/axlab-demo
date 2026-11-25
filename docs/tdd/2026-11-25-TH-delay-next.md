AC: TH-delay-next
test: src/lib/testHooks.test.ts
red: npx vitest run src/lib/testHooks src/app/api/events/route src/app/api/test exit=1 | 1/1 실패: AssertionError: expected 0 to be greater than or equal to 110
green: npx vitest run src/lib/testHooks.test.ts exit=0 (전체 1건 통과)
refactor: vitest exit=0 (95 passed/0 failed) · tsc exit=0
