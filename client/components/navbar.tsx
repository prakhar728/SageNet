"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useOCAuth } from "@opencampus/ocid-connect-js";
import LoginButton from "./LoginButton";

export default function Navbar() {
  const pathname = usePathname();

  const { isInitialized, authState, ocAuth } = useOCAuth();

  const routes = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/upload", label: "Upload Paper" },
    { href: "/publication", label: "Publication" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold text-xl">
            SageNet
          </Link>
          <nav className="hidden md:flex gap-6 ml-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === route.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <appkit-button />
          {isInitialized && authState && authState.isAuthenticated ? (
                  <p>
                    You are logged in! {JSON.stringify(ocAuth.getAuthState())}
                  </p>
                ) : (
                  <LoginButton />
                )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {routes.map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname === route.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {route.label}
                  </Link>
                ))}
                <appkit-button />
                {isInitialized && authState && authState.isAuthenticated ? (
                  <p>
                    You are logged in! {JSON.stringify(ocAuth.getAuthState())}
                  </p>
                ) : (
                  <LoginButton />
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
