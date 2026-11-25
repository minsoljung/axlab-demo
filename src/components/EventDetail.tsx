"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Spinner } from "@astryxdesign/core/Spinner";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import type { EventDto } from "@/lib/types";
import { formatPeriod } from "@/lib/format";

type State = { kind: "loading" } | { kind: "error" } | { kind: "missing" } | { kind: "ready"; event: EventDto };

export function EventDetail({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    fetch(`/api/events/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (res.status === 404) return { kind: "missing" } as State;
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { event: EventDto };
        return { kind: "ready", event: body.event } as State;
      })
      .then((s) => alive && setState(s))
      .catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [id]);

  if (state.kind === "loading") return <Spinner label="불러오는 중" aria-label="불러오는 중" />;
  if (state.kind === "error" || state.kind === "missing") {
    return (
      <VStack gap={3}>
        <Banner
          status={state.kind === "error" ? "error" : "info"}
          title={state.kind === "error" ? "이벤트를 불러오지 못했습니다" : "존재하지 않는 이벤트입니다"}
          collapsible={false}
        />
        <Link href="/">목록으로</Link>
      </VStack>
    );
  }
  const e = state.event;
  return (
    <VStack gap={3}>
      <HStack gap={2} align="center">
        <Heading level={1}>{e.title}</Heading>
        {e.status === "closed" ? <Badge label="종료" /> : null}
      </HStack>
      <Text>{e.carrier}</Text>
      <Text type="supporting">{formatPeriod(e.startsAt, e.endsAt)}</Text>
      <Text as="p">{e.content}</Text>
      <HStack gap={3} align="center">
        <Button
          label="응모하기"
          variant="primary"
          isDisabled={e.status === "closed"}
          onClick={() => router.push(`/events/${e.id}/apply`)}
        />
        <Link href="/">목록으로</Link>
      </HStack>
    </VStack>
  );
}
