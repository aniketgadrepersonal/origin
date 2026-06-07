import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Manager",
  description: "Create and manage events and attendee registrations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
