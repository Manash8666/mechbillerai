import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import TelemetryBeacon from "@/components/TelemetryBeacon";
import PwaRegister from "@/components/PwaRegister";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#C9F31D",
};

export const metadata: Metadata = {
  title: "MotoBan - Automotive Garage Management & Smart Billing SaaS",
  description: "MotoBan - Next-Gen Garage Management, Job Cards & Smart GST Billing Platform. Powered by Hybrid StudioZ.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className={inter.className}>
        <TelemetryBeacon source="mechbillerai" />
        <PwaRegister />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
