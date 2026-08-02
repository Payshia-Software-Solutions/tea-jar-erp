"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin') || pathname.startsWith('/verify-email') || pathname.startsWith('/docs')) {
    return null;
  }

  return (
    <footer className="border-t border-[#e4e4e7] bg-white text-[#09090b] dark:border-[#27272a] dark:bg-[#09090b] dark:text-white transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#6366f1] text-white">
              <span className="font-black text-[10px]">B</span>
            </div>
            <span className="text-xs font-bold tracking-tight text-[#09090b] dark:text-white">
              BIZZFLOW SUITE
            </span>
          </div>

          <p className="text-[12px] text-[#71717a] dark:text-[#a1a1aa]">
            © {new Date().getFullYear()} BizzFlow Suite · Powered by Nebulync
          </p>

          <div className="flex items-center gap-4 text-[12px] text-[#71717a] dark:text-[#a1a1aa]">
            <Link href="/features" className="hover:text-[#09090b] dark:hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-[#09090b] dark:hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-[#09090b] dark:hover:text-white transition-colors">Docs</Link>
            <Link href="/admin/login" className="hover:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors">Admin Login</Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
