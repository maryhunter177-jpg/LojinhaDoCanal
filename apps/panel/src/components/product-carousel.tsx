'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import type { CatalogItem } from '@ofertas/core';

/** Decorative preview; all product actions remain in the catalog below. */
export function ProductCarousel({ items }: { items: CatalogItem[] }) {
  const frame = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () =>
      setMotionAllowed(
        !media.matches && document.visibilityState === 'visible',
      );
    update();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!motionAllowed || !inView || items.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % items.length),
      4000,
    );
    return () => window.clearInterval(timer);
  }, [motionAllowed, inView, items.length]);
  if (items.length === 0) return null;
  const active = index % items.length;
  return (
    <div
      ref={frame}
      className="shop-featured-photo product-carousel"
      aria-hidden="true"
    >
      <div className="carousel-stage">
        {items.map((item, position) => (
          <Image
            key={item.id}
            className={`carousel-image ${position === active ? 'is-active' : ''}`}
            src={item.imageUrl ?? '/images/product-1.svg'}
            alt=""
            width={400}
            height={350}
            loading="eager"
            unoptimized
          />
        ))}
      </div>
      <span>
        Um achado da Mary <Heart size={14} />
      </span>
    </div>
  );
}
