"use client";

import { useEffect, useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { ToggleButton, ToggleButtonGroup } from "@astryxdesign/core/ToggleButton";
import type { CarrierDto, EventDto } from "@/lib/types";
import { formatPeriod } from "@/lib/format";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; events: EventDto[]; carriers: CarrierDto[] };

export function EventHub() {
  const [state, setState] = useState<State>({ kind: "loading" });
  // 필터는 화면 안 상태로만 둔다 (AC-003-4: 경로·주소를 바꾸지 않는다)
  const [carrierId, setCarrierId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/events")
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as { events: EventDto[]; carriers?: CarrierDto[] };
      })
      .then((body) => alive && setState({ kind: "ready", events: body.events, carriers: body.carriers ?? [] }))
      .catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <VStack gap={4}>
      <Heading level={1}>이벤트 허브</Heading>
      {state.kind === "ready" ? (
        <ToggleButtonGroup label="통신사 필터" type="single" value={carrierId} onChange={(v) => setCarrierId(v as string | null)}>
          {state.carriers.map((c) => (
            <ToggleButton key={c.id} value={c.id} label={c.name} pressedIcon={<Icon icon="check" />} />
          ))}
        </ToggleButtonGroup>
      ) : null}
      <EventItems state={state} carrierId={carrierId} />
    </VStack>
  );
}

function EventItems({ state, carrierId }: { state: State; carrierId: string | null }) {
  if (state.kind === "loading") return <Spinner label="불러오는 중" aria-label="불러오는 중" />;
  if (state.kind === "error") {
    return <Banner status="error" title="이벤트를 불러오지 못했습니다" collapsible={false} />;
  }
  const events = carrierId ? state.events.filter((e) => e.carrierId === carrierId) : state.events;
  if (events.length === 0) {
    // astryx EmptyState 는 제목을 live region 에 한 번 더 써서 같은 문구가 화면에 두 번 잡힌다 → Text 로 대신한다(이탈)
    return <Text as="p">{carrierId ? "해당 통신사의 이벤트가 없습니다" : "진행 중인 이벤트가 없습니다"}</Text>;
  }
  return (
    <List hasDividers>
      {events.map((e) => (
        <ListItem
          key={e.id}
          label={
            <HStack gap={2} align="center">
              <Link href={`/events/${e.id}`}>{e.title}</Link>
              {e.status === "closed" ? <Badge label="종료" /> : null}
            </HStack>
          }
          description={
            <VStack gap={0.5}>
              <Text type="supporting">{e.carrier}</Text>
              <Text type="supporting">{formatPeriod(e.startsAt, e.endsAt)}</Text>
            </VStack>
          }
        />
      ))}
    </List>
  );
}
