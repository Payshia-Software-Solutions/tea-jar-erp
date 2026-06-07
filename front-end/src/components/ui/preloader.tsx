"use client"

import React from 'react';
import { Wrench } from 'lucide-react';

export function Preloader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        
        {/* Inner logo with pulse */}
        <div className="absolute flex items-center justify-center">
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <Wrench className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
      
      {/* Loading text */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">BizzFlow</h2>
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '0ms' }}></span>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '150ms' }}></span>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}
