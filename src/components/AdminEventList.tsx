"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Table } from "@astryxdesign/core/Table";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import type { EventDto } from "@/lib/types";
import { kstYmd } from "@/lib/kst";

const NOTICE_URL = "/admin?notice=1";
type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; events: EventDto[] };
type Row = EventDto & Record<string, unknown>;

// SCR-06 관리자 이벤트 목록 (종료·로그아웃 동작 포함)
export function AdminEventList() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [target, setTarget] = useState<EventDto | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeFailed, setCloseFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events");
      if (res.status === 401) {
        router.push(NOTICE_URL);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { events: EventDto[] };
      setState({ kind: "ready", events: body.events });
    } catch {
      setState({ kind: "error" });
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmClose() {
    if (!target || closing) return;
    setClosing(true);
    setCloseFailed(false);
    try {
      const res = await fetch(`/api/admin/events/${encodeURIComponent(target.id)}/close`, { method: "POST" });
      if (res.status === 401) {
        router.push(NOTICE_URL);
        return;
      }
      if (!res.ok && res.status !== 409) throw new Error(String(res.status));
      setTarget(null);
      await load();
    } catch {
      setCloseFailed(true);
      setTarget(null);
    }
    setClosing(false);
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
    router.push(NOTICE_URL);
  }

  return (
    <VStack gap={4}>
      <Heading level={1}>이벤트 관리</Heading>
      <HStack gap={2} wrap="wrap">
        <Button label="이벤트 등록" variant="primary" href="/admin/events/new" />
        <Button label="방문자 화면으로" variant="secondary" href="/" />
        <Button label="로그아웃" variant="ghost" onClick={logout} />
      </HStack>
      {closeFailed ? <Banner status="error" title="종료에 실패했습니다" collapsible={false} /> : null}
      <Items state={state} onClose={(e) => setTarget(e)} />
      {target ? (
      <AlertDialog
        isOpen
        onOpenChange={(o) => {
          if (!o && !closing) setTarget(null);
        }}
        title="이벤트를 종료할까요?"
        description="이 이벤트를 종료하면 응모를 받을 수 없고 다시 열 수 없습니다"
        actionLabel="확인"
        cancelLabel="취소"
        onAction={confirmClose}
        isActionLoading={closing}
      />
      ) : null}
    </VStack>
  );
}

function Items({ state, onClose }: { state: State; onClose: (e: EventDto) => void }) {
  // astryx Spinner 의 label 은 알림 영역에 같은 문구를 한 번 더 쓴다 → 문구는 Text 하나로 두고 Spinner 는 장식으로 둔다(이탈)
  if (state.kind === "loading") {
    return (
      <HStack gap={2} align="center">
        <span aria-hidden="true">
          <Spinner />
        </span>
        <Text>불러오는 중</Text>
      </HStack>
    );
  }
  if (state.kind === "error") return <Banner status="error" title="이벤트를 불러오지 못했습니다" collapsible={false} />;
  // astryx EmptyState 는 제목을 알림 영역에 한 번 더 써 같은 문구가 두 번 잡힌다 → Text 로 대신한다(이탈, SCR-01 과 같음)
  if (state.events.length === 0) return <Text as="p">등록된 이벤트가 없습니다</Text>;
  return (
    <Table<Row>
      data={state.events as Row[]}
      idKey="id"
      columns={[
        { key: "title", header: "제목" },
        { key: "carrier", header: "통신사" },
        { key: "endsAt", header: "종료 예정일", renderCell: (r) => kstYmd(new Date(r.endsAt)) },
        {
          key: "status",
          header: "상태",
          renderCell: (r) => <Badge label={r.status === "closed" ? "종료" : "진행 중"} />,
        },
        {
          key: "actions",
          header: "동작",
          renderCell: (r) => (
            <HStack gap={2}>
              <Button label="수정" variant="secondary" href={`/admin/events/${r.id}/edit`} />
              {r.status === "open" ? <Button label="이벤트 종료" variant="destructive" onClick={() => onClose(r)} /> : null}
            </HStack>
          ),
        },
      ]}
    />
  );
}
