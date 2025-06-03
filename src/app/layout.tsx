import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Black Forest Labs - Gerador de Imagens",
  description: "Interface para geração de imagens com a API da Black Forest Labs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <main className="container mx-auto py-6 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
