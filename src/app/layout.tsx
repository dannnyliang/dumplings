import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ToastHost from "@/components/ui/ToastHost";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "Dumplings",
  description: "Danny & PeiYu 的共同記帳本",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dumplings",
  },
};

export const viewport: Viewport = {
  themeColor: "#B8562B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full antialiased" style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col">
        {children}
        <BottomNav />
        <ToastHost />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
