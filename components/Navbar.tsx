"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { Menu, Settings as SettingsIcon, LogOut, User } from "lucide-react";

import NotificationDropdown from "./NotificationDropdown";
import ThemeSwitcher from "./ThemeSwitcher";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [userShift, setUserShift] = useState<{ shift: string; location?: string } | null>(null);

  useEffect(() => {
    if (session?.user?.name) {
      const botServerUrl = "http://localhost:3001";
      fetch(`${botServerUrl}/api/shift/${encodeURIComponent(session.user.name)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserShift({ shift: data.shift, location: data.location });
          }
        })
        .catch((err) => console.error("Failed to fetch shift:", err));
    }
  }, [session]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <ThemeSwitcher open={themeOpen} setOpen={setThemeOpen} />
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-300">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between gap-x-6 p-4 sm:p-5 lg:px-8"
          aria-label="Global"
        >
          {/* Logo / Brand */}
          <div className="flex lg:flex-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-extrabold bg-primary bg-clip-text text-transparent tracking-tight">
                HalaFtth Portal CC
              </span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex flex-1 items-center justify-end gap-x-4">
            {status === "loading" ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            ) : !session ? (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                {/* User Info */}
                <div className="flex items-center gap-2.5 bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
                  <span className="text-xs font-semibold text-foreground">
                    {session.user?.name || session.user?.email}
                  </span>
                  {userShift && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 whitespace-nowrap">
                      {userShift.shift}{" "}
                      {userShift.location === "home"
                        ? "(Home)"
                        : userShift.location === "office"
                          ? "(Office)"
                          : ""}
                    </span>
                  )}
                </div>

                {/* Settings Icon */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setThemeOpen(true)}
                  aria-label="Appearance Settings"
                  className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Button>

                <NotificationDropdown />

                {/* Profile Circle */}
                <Link href="/protected/profile" className="relative group">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      width={34}
                      height={34}
                      alt="User profile"
                      className="rounded-full ring-2 ring-transparent group-hover:ring-primary transition-all"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-2 ring-transparent group-hover:ring-offset-2 transition-all">
                      {getInitials(session.user?.name)}
                    </div>
                  )}
                </Link>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>Log out</span>
                </Button>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <div className="flex lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open main menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Drawer (shadcn Sheet) */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col justify-between p-6">
            <div>
              <SheetHeader className="text-left border-b pb-4 mb-6">
                <SheetTitle className="text-xl font-extrabold bg-primary bg-clip-text text-transparent">
                  AdminPortal
                </SheetTitle>
              </SheetHeader>

              {status !== "loading" && session ? (
                <div className="space-y-6">
                  {/* Profile info inside drawer */}
                  <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        width={40}
                        height={40}
                        alt="User profile"
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {getInitials(session.user?.name)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground line-clamp-1">
                        {session.user?.name || session.user?.email}
                      </span>
                      {userShift && (
                        <span className="text-xs text-primary font-bold mt-0.5">
                          {userShift.shift}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions links */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setThemeOpen(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      <span>Appearance Settings</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      asChild
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/protected/profile">
                        <User className="h-4 w-4 mr-2" />
                        <span>My Profile</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : !session ? (
                <div className="flex flex-col gap-3 mt-4">
                  <Button asChild variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Bottom Section */}
            {session && (
              <div className="border-t pt-4">
                <Button
                  variant="destructive"
                  className="w-full justify-center"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
};

export default Navbar;