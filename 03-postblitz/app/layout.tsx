import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostBlitz",
  description: "Drei Post-Varianten in Sekunden",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
