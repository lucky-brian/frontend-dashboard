import { AntdThemeProvider } from "@/components/AntdThemeProvider";
import { StoreProvider } from "@/components/StoreProvider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App as AntdApp } from "antd";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frontend Dashboard",
  description: "Next.js Dashboard Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AntdRegistry>
          <StoreProvider>
            <AntdThemeProvider>
              <AntdApp>
                {children}
                <Toaster position="top-right" />
              </AntdApp>
            </AntdThemeProvider>
          </StoreProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
