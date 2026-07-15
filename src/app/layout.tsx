import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { ChatWidget } from "@/components/ChatWidget";
import { InstructorChatLauncher } from "@/components/InstructorChatLauncher";
import { ToastProvider } from "@/components/Toast";
import { ConfirmationProvider } from "@/components/ConfirmationModal";
import { FirebaseMessagingProvider } from "@/components/FirebaseMessagingProvider";
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
  title: "EduFlow - Cổng học viên",
  description: "Bảng điều khiển học tập dành cho học viên EduFlow LMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <FirebaseMessagingProvider>
              <ConfirmationProvider>
                {children}
                <InstructorChatLauncher />
                <ChatWidget />
              </ConfirmationProvider>
            </FirebaseMessagingProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
