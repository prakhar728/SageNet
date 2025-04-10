import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/navbar";
import "./globals.css";
import ContextProvider from "@/context";
import { headers } from "next/headers";
import "./globals.css";
import OCConnectWrapper from "@/components/OCConnectWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "SageNet - Decentralizing Research with Web3",
  description:
    "A Web3-powered platform for researchers to publish, review, and earn rewards",
  generator: "v0.dev",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookies = (await headers()).get("cookie");

  const opts = {
    clientId: '<Does_Not_Matter_For_Sandbox_mode>',    
    redirectUri: 'https://sage-net.vercel.app/redirect', // Adjust this URL
    referralCode: 'PARTNER6', // Assign partner code
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ContextProvider cookies={cookies}>
        <OCConnectWrapper opts={opts} sandboxMode={true}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="border-t py-6">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                  <p className="text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} ResearchDAO. All rights
                    reserved.
                  </p>
                  <div className="flex items-center gap-4">
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Terms
                    </a>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Privacy
                    </a>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Contact
                    </a>
                  </div>
                </div>
              </footer>
            </div>
          </ThemeProvider>
          </OCConnectWrapper>
        </ContextProvider>
      </body>
    </html>
  );
}
