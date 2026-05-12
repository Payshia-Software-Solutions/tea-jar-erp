"use client";
import { API_BASE } from '@/config';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Zap, UserCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState("");

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
  ];

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
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-foreground/60">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`hover:text-foreground transition-colors py-2 relative ${
                pathname === link.path ? "text-foreground" : ""
              }`}
            >
              {link.name}
              {pathname === link.path && (
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
      </div>
    </nav>
  );
}
