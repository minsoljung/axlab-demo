import { VStack } from "@astryxdesign/core/VStack";

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <VStack as="main" padding={6} maxWidth={720} gap={4}>
      {children}
    </VStack>
  );
}
