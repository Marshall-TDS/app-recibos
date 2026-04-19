import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marshall TDS | Gerador de Recibos Premium",
  description: "Sistema avançado para geração e gestão de recibos de colaboradores com alta fidelidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="grid-bg">
        {children}
      </body>
    </html>
  );
}
