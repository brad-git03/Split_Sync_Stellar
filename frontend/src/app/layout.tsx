import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StellarWalletProvider } from "@/context/StellarWalletContext";
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
  title: "SplitSync - Automated, Trustless Payment Splitting dApp",
  description: "Configure temporary split contracts and route payments instantly to all freelancers on the Stellar network with zero middleman risk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-white">
        <StellarWalletProvider>
          {children}
        </StellarWalletProvider>
      </body>
    </html>
  );
}
