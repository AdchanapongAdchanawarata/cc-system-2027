import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Thai, Geist_Mono } from "next/font/google";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ibmPlexThai = IBM_Plex_Sans_Thai({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["thai"],
  variable: "--font-thai",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CC TEAM | Briefing & Management System - CC Insights",
  description: "ระบบบริหารจัดการงานและวิเคราะห์ผลการปฏิบัติงานทีมสื่อสารสร้างสรรค์ (CC TEAM) อุทยานวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยเชียงใหม่",
};

import GoogleSheetsAutoSyncWorker from "@/components/GoogleSheetsAutoSyncWorker";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${ibmPlexThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <GoogleSheetsAutoSyncWorker />
      </body>
    </html>
  );
}
