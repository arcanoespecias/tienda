import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcano — Cómplice del Sabor",
  description: "Sistema de gestión de especias y blends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'hsl(222, 47%, 11%)',
              border: '1px solid hsl(215, 28%, 17%)',
              color: 'hsl(210, 40%, 98%)',
            },
          }}
        />
      </body>
    </html>
  );
}