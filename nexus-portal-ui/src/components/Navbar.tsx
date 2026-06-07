"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Zap, UserCircle, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setUser(data.user);
        }
      } catch (e) {}
    };
    checkAuth();
  }, [pathname]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/verify-email')) {
    return null;
  }

  const links = [
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
    { name: "Docs", path: "/docs" },
  ];

  const isActive = (path: string) => {
    if (path === "/docs") {
      return pathname.startsWith("/docs");
    }
    return pathname === path;
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group transition-all">
          <div className="w-10 h-10 shrink-0 relative group-hover:scale-110 transition-transform">
             <img 
               src="/icon-bizzflow-logo-optimized.webp" 
               alt="BizzFlow" 
               className="w-full h-full object-contain"
             />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gradient">BIZZFLOW</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-foreground/60">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`hover:text-foreground transition-colors py-2 relative ${
                isActive(link.path) ? "text-foreground" : ""
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-full" />
              )}
            </Link>
          ))}
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-900/10 dark:border-white/10">
            {isLoggedIn ? (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 group"
              >
                <UserCircle size={16} className="group-hover:scale-110 transition-transform" />
                <span>Portal ({user})</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/admin"
                  className="text-[11px] font-bold uppercase tracking-widest hover:text-foreground transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/order"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                >
                  Sign Up
                </Link>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-foreground focus:outline-none p-2"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-4 pt-2 pb-6 space-y-4">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsOpen(false)}
                className={`text-sm font-bold uppercase tracking-widest hover:text-foreground transition-colors py-2 block ${
                  isActive(link.path) ? "text-foreground" : "text-foreground/60"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-slate-900/10 dark:border-white/10 flex flex-col gap-4">
              {isLoggedIn ? (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 group w-full"
                >
                  <UserCircle size={16} className="group-hover:scale-110 transition-transform" />
                  <span>Portal ({user})</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-bold uppercase tracking-widest hover:text-foreground transition-colors text-center py-2"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/order"
                    onClick={() => setIsOpen(false)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 text-center w-full"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
