import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Log",
  description: "Five marks, one line, one list. No streaks.",
};

// Section 6.5: mobile-first. `userScalable` is left alone deliberately —
// blocking pinch-zoom is an accessibility failure.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf9f7",
};

// `{ children }` is destructuring — it pulls the `children` property straight
// out of the props object instead of writing `props.children` everywhere.
// `children` is whatever page Next.js is rendering inside this layout.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
