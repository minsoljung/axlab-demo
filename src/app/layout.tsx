import type { Metadata } from "next";
import { Theme } from "@astryxdesign/core/theme";
import { themes, defaultThemeSlug } from "@/astryx-themes";
import { PageFrame } from "@/components/PageFrame";
import "./globals.css";

export const metadata: Metadata = {
  title: "마케팅 허브",
  description: "통신사별 LLM 서비스 이벤트 허브",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Theme theme={themes[defaultThemeSlug]}>
          <PageFrame>{children}</PageFrame>
        </Theme>
      </body>
    </html>
  );
}
