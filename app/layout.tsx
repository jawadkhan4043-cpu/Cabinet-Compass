import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cabinet Compass",
  description: "A private household medicine inventory organizer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}