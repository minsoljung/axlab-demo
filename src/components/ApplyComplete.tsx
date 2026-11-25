"use client";

import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";

export function ApplyComplete({ id }: { id: string }) {
  return (
    <VStack gap={4}>
      {/* h1 로 두면 Next 경로 안내(route announcer)가 같은 문구를 한 번 더 써서 화면에 두 번 잡힌다 → 제목 요소가 아닌 본문 */}
      <Text as="p" size="2xl" weight="bold">
        응모 완료
      </Text>
      <HStack gap={3}>
        <Link href="/">목록으로</Link>
        <Link href={`/events/${id}`}>이벤트 상세로</Link>
      </HStack>
    </VStack>
  );
}
