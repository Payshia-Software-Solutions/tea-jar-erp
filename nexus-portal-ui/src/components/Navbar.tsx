"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { UserCircle, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const pathname  = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user,       setUser]       = useState("");
  const [isOpen,     setIsOpen]     = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setUser(data.user);
        }
      } catch {}
    };
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/verify-email')) {
    return null;
  }

  const links = [
    { name: "Home",     path: "/" },
    { name: "Features font-medium", path: "/features" },
    { name: "Pricing",  path: "/pricing" },
    { name: "Docs",     path: "/docs" },
  ];

  const isActive = (path: string) => {
    if (path === "/docs") return pathname.startsWith("/docs");
    return pathname === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled || isOpen
          ? 'border-b border-[#e4e4e7] bg-white dark:border-[#27272a] dark:bg-[#09090b] shadow-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1] text-white">
            <span className="font-black text-xs">B</span>
          </div>
          <span className="text-sm font-bold tracking-tight text-[#09090b] dark:text-white">
            BIZZFLOW
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-[#f4f4f5] text-[#09090b] dark:bg-[#27272a] dark:text-white font-semibold'
                  : 'text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#09090b] dark:text-[#a1a1aa] dark:hover:bg-[#18181b] dark:hover:text-white'
              }`}
            >
              {link.name.replace(' font-medium', '')}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <ThemeToggle />
          {isLoggedIn ? (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
            >
              <UserCircle size={14} />
              <span>{user}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/admin/login"
                className="rounded-lg border border-[#e4e4e7] bg-white px-3 py-1.5 text-[13px] font-medium text-[#09090b] hover:bg-[#f4f4f5] dark:border-[#27272a] dark:bg-[#18181b] dark:text-white dark:hover:bg-[#27272a] transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/order"
                className="flex items-center gap-1.5 rounded-lg bg-[#6366f1] px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-[#4f46e5] transition-colors shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-1.5 text-[#71717a] hover:bg-[#f4f4f5] dark:text-[#a1a1aa] dark:hover:bg-[#27272a] transition-colors"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-[#e4e4e7] bg-white px-4 py-3 dark:border-[#27272a] dark:bg-[#18181b] space-y-2">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setIsOpen(false)}
              className={`block rounded-md px-3 py-2 text-[13px] font-medium ${
                isActive(link.path)
                  ? 'bg-[#f4f4f5] text-[#09090b] dark:bg-[#27272a] dark:text-white font-semibold'
                  : 'text-[#71717a] dark:text-[#a1a1aa]'
              }`}
            >
              {link.name.replace(' font-medium', '')}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#f4f4f5] dark:border-[#27272a] flex flex-col gap-2">
            {isLoggedIn ? (
              <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 rounded-lg bg-[#6366f1] py-2 text-[13px] font-medium text-white">
                <UserCircle size={14} /> {user}
              </Link>
            ) : (
              <>
                <Link href="/admin/login" onClick={() => setIsOpen(false)} className="rounded-lg border border-[#e4e4e7] py-2 text-center text-[13px] font-medium text-[#09090b] dark:border-[#27272a] dark:text-white">
                  Log In
                </Link>
                <Link href="/order" onClick={() => setIsOpen(false)} className="rounded-lg bg-[#6366f1] py-2 text-center text-[13px] font-medium text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
