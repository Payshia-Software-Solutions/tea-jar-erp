"use client";

import React, { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TOCItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observers = new Map();
    
    const callback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-100px 0px -70% 0px",
      threshold: 0.1,
    });

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) {
        observer.observe(el);
        observers.set(item.id, el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 100; // Offset for sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveId(id);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h5 className="text-xs font-bold uppercase tracking-widest text-strong/80">
        On This Page
      </h5>
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`block text-xs font-semibold leading-relaxed transition-all hover:text-indigo-500 ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold translate-x-1"
                  : "text-muted"
              } ${item.level === 3 ? "pl-4" : item.level === 4 ? "pl-8" : ""}`}
            >
              {item.title}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
