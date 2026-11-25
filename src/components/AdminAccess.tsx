"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@astryxdesign/core/Heading";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { VStack } from "@astryxdesign/core/VStack";

// SCR-05 관리자 진입 확인. notice = SCR-06·07 에서 밀려 온 경우(만료·코드 변경·로그아웃·미확인 직접 진입).
export function AdminAccess({ notice = false }: { notice?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setWrong(false);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.push("/admin/events");
        return;
      }
    } catch {
      // 서버 오류도 같은 오류 문구로 보인다 (SCR-05 서버 오류 상태는 명세 보류)
    }
    setWrong(true);
    setBusy(false);
  }

  return (
    <VStack gap={4}>
      <Heading level={1}>관리자 접근 확인</Heading>
      {notice ? <Banner status="info" title="다시 접근 코드를 확인해 주세요" collapsible={false} /> : null}
      <form onSubmit={onSubmit} noValidate>
        <VStack gap={3}>
          <TextInput
            label="접근 코드"
            type="password"
            value={code}
            onChange={setCode}
            status={wrong ? { type: "error", message: "접근 코드가 올바르지 않습니다" } : undefined}
          />
          <Button type="submit" variant="primary" label={busy ? "확인 중" : "확인"} isDisabled={busy} />
        </VStack>
      </form>
    </VStack>
  );
}
