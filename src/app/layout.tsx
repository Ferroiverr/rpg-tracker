import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPG Tracker — хроники героев",
  description: "Персонажи, здоровье, броня, карты и история действий ролевой кампании",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
