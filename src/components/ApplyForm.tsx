"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@astryxdesign/core/Heading";
import { Link } from "@astryxdesign/core/Link";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Spinner } from "@astryxdesign/core/Spinner";
import { TextInput } from "@astryxdesign/core/TextInput";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { VStack } from "@astryxdesign/core/VStack";
import type { EventDto } from "@/lib/types";
import { validateApplication, type ApplicationErrors } from "@/lib/application-shared";

type Load = { kind: "loading" } | { kind: "error" } | { kind: "missing" } | { kind: "ready"; event: EventDto };

export function ApplyForm({ id }: { id: string }) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<ApplicationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/events/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (res.status === 404) return { kind: "missing" } as Load;
        if (!res.ok) throw new Error(String(res.status));
        return { kind: "ready", event: ((await res.json()) as { event: EventDto }).event } as Load;
      })
      .then((s) => alive && setLoad(s))
      .catch(() => alive && setLoad({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFailed(false);
    const v = validateApplication({ name, phone, consent });
    if (!v.ok) {
      setErrors(v.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(id)}/applications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, phone, consent }),
      });
      if (res.status === 201) {
        router.push(`/events/${id}/apply/complete`);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { errors?: ApplicationErrors };
      if (res.status === 409 && body.errors?.phone) setErrors({ phone: body.errors.phone });
      else if (res.status === 403) setClosed(true);
      else setFailed(true);
    } catch {
      setFailed(true);
    }
    setSubmitting(false);
  }

  const back = <Link href={`/events/${id}`}>상세로 돌아가기</Link>;
  let body: React.ReactNode;
  if (load.kind === "loading") body = <Spinner label="불러오는 중" aria-label="불러오는 중" />;
  else if (load.kind === "missing" || load.kind === "error") {
    body = (
      <Banner
        status={load.kind === "error" ? "error" : "info"}
        title={load.kind === "error" ? "이벤트를 불러오지 못했습니다" : "존재하지 않는 이벤트입니다"}
        collapsible={false}
      />
    );
  } else if (load.event.status === "closed" || closed) {
    body = (
      <VStack gap={3}>
        <Banner status="info" title="종료된 이벤트입니다" collapsible={false} />
        {back}
      </VStack>
    );
  } else {
    body = (
      <form onSubmit={onSubmit} noValidate>
        <VStack gap={3}>
          <Heading level={2}>{load.event.title}</Heading>
          {failed ? <Banner status="error" title="응모에 실패했습니다" collapsible={false} /> : null}
          <TextInput
            label="이름"
            value={name}
            onChange={setName}
            status={errors.name ? { type: "error", message: errors.name } : undefined}
          />
          <TextInput
            label="휴대전화번호"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={setPhone}
            status={errors.phone ? { type: "error", message: errors.phone } : undefined}
          />
          <CheckboxInput
            label="개인정보 수집·이용에 동의합니다"
            value={consent}
            onChange={setConsent}
            status={errors.consent ? { type: "error", message: errors.consent } : undefined}
          />
          <Button
            type="submit"
            variant="primary"
            label={submitting ? "제출 중" : "제출"}
            isDisabled={submitting}
          />
          {back}
        </VStack>
      </form>
    );
  }

  return (
    <VStack gap={4}>
      <Heading level={1}>이벤트 응모</Heading>
      {body}
    </VStack>
  );
}
