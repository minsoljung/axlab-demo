"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@astryxdesign/core/Heading";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { DateInput } from "@astryxdesign/core/DateInput";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import type { CarrierDto } from "@/lib/types";
import { MSG, validateRequired, type EventFormErrors, type EventFormValues } from "@/lib/adminEvents-shared";

const NOTICE_URL = "/admin?notice=1";
type Iso = React.ComponentProps<typeof DateInput>["value"];
const iso = (s: string): Iso => (s || undefined) as Iso;
const EMPTY: EventFormValues = { carrierId: "", title: "", startsAt: "", endsAt: "", content: "" };
export type EventFormInitial = { id: string; closed: boolean; values: EventFormValues };

// SCR-07 관리자 이벤트 등록·수정 폼. initial 이 있으면 수정.
export function AdminEventForm({ carriers, initial }: { carriers: CarrierDto[]; initial?: EventFormInitial }) {
  const router = useRouter();
  const [v, setV] = useState<EventFormValues>(initial?.values ?? EMPTY);
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [busy, setBusy] = useState(false);
  // 하이드레이션 전에 입력란이 보이면 그때 입력한 값(특히 DateInput 의 입력)이 하이드레이션에서 지워진다 → 마운트 뒤에 그린다
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [failed, setFailed] = useState<string | null>(null);
  const set = <K extends keyof EventFormValues>(k: K) => (val: EventFormValues[K] | undefined) => setV((p) => ({ ...p, [k]: val ?? "" }));
  const err = (m?: string) => (m ? ({ type: "error", message: m } as const) : undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFailed(null);
    const local = validateRequired(v);
    setErrors(local);
    if (Object.keys(local).length > 0) return;
    setBusy(true);
    try {
      const res = await fetch(initial ? `/api/admin/events/${encodeURIComponent(initial.id)}` : "/api/admin/events", {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(v),
      });
      if (res.ok) {
        router.push("/admin/events");
        return;
      }
      if (res.status === 401) {
        router.push(NOTICE_URL);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { errors?: EventFormErrors };
      if (res.status === 400 && body.errors) setErrors(body.errors);
      else if (res.status === 409) setFailed(MSG.closedDate);
      else setFailed(MSG.saveFailed);
    } catch {
      setFailed(MSG.saveFailed);
    }
    setBusy(false);
  }

  return (
    <VStack gap={4}>
      <Heading level={1}>{initial ? "이벤트 수정" : "이벤트 등록"}</Heading>
      {mounted ? (
      <form onSubmit={onSubmit} noValidate>
        <VStack gap={3}>
          {failed ? <Banner status="error" title={failed} collapsible={false} /> : null}
          <Selector
            label="통신사"
            placeholder="선택"
            options={carriers.map((c) => ({ value: c.id, label: c.name }))}
            value={v.carrierId || undefined}
            onChange={(val) => set("carrierId")(val ?? "")}
            status={err(errors.carrierId)}
          />
          <TextInput label="제목" value={v.title} onChange={set("title")} status={err(errors.title)} />
          <DateInput
            label="시작일"
            format="system_date"
            value={iso(v.startsAt)}
            onChange={set("startsAt")}
            status={err(errors.period)}
          />
          <DateInput
            label="종료 예정일"
            format="system_date"
            value={iso(v.endsAt)}
            onChange={set("endsAt")}
            isDisabled={initial?.closed === true}
            disabledMessage={initial?.closed ? MSG.closedDate : undefined}
            description={initial?.closed ? MSG.closedDate : undefined}
            status={err(errors.endsAt)}
          />
          <TextArea label="내용" value={v.content} onChange={set("content")} status={err(errors.content)} />
          <HStack gap={2}>
            <Button type="submit" variant="primary" label={busy ? "저장 중" : "저장"} isDisabled={busy} />
            <Button label="취소" variant="secondary" href="/admin/events" />
          </HStack>
        </VStack>
      </form>
      ) : null}
    </VStack>
  );
}
