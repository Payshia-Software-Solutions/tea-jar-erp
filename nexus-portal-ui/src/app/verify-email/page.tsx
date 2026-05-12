"use client";
import { API_BASE, SITE_URL } from '@/config';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your enterprise account...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token. Please check your email link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${API_BASE.replace("/api", "")}/api/auth/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link may have expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Connection error. Could not reach the authentication server.');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 md:p-12 text-center"
      >
        <div className="mb-8 flex justify-center">
          {status === 'loading' && (
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center">
              <Loader2 className="text-indigo-500 animate-spin" size={40} />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <ShieldCheck className="text-emerald-500" size={40} />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center">
              <ShieldAlert className="text-rose-500" size={40} />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4 text-strong">
          {status === 'loading' ? 'Verifying Account' : status === 'success' ? 'Verification Complete' : 'Verification Failed'}
        </h1>
        
        <p className="text-muted mb-8 leading-relaxed font-medium">
          {message}
        </p>

        {status === 'success' && (
          <Link href="/admin" className="w-full btn-premium py-4 flex items-center justify-center gap-2 group">
            Continue to Login
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {status === 'error' && (
          <Link href="/order" className="text-indigo-500 font-bold hover:underline">
            Try Signing Up Again
          </Link>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-indigo-500 animate-spin" size={40} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
