"use client";
import { API_BASE } from '@/config';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardRedirect() {
  const router = useRouter();
  

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/check`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.role === 'super_admin') {
            router.push('/admin/requests');
          } else {
            router.push('/admin/subscription');
          }
        } else {
          router.push('/admin/login');
        }
      } catch (e) {
        router.push('/admin/login');
      }
    };
    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-500 font-bold animate-pulse">Initializing Portal Session...</div>
    </div>
  );
}
