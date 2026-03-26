'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/marketing';

gsap.registerPlugin(ScrollTrigger);

interface CtaSectionProps {
  title: string;
  subtitle: string;
  button: string;
  noCard: string;
}

export function CtaSection({ title, subtitle, button, noCard }: CtaSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // CTA container scales up from center
      gsap.fromTo(
        '.cta-container',
        { opacity: 0, scale: 0.85, y: 40 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.cta-container',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Title text reveal
      gsap.fromTo(
        '.cta-title',
        { opacity: 0, y: 40, clipPath: 'inset(100% 0% 0% 0%)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.8,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.cta-title',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.cta-subtitle',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: '.cta-subtitle',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Button bounces in
      gsap.fromTo(
        '.cta-button',
        { opacity: 0, scale: 0.5, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: 'back.out(2.5)',
          scrollTrigger: {
            trigger: '.cta-button',
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.cta-note',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          delay: 0.2,
          scrollTrigger: {
            trigger: '.cta-note',
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Background blobs — handled via CSS animations for performance
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 lg:py-24 overflow-hidden">
      <Container>
        <div className="cta-container relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-24 opacity-0">
          {/* Animated Background Blobs */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-hero-gradient-1" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-hero-gradient-2" />
            {/* Decorative dots */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
            </div>
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="cta-title text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl opacity-0">
              {title}
            </h2>
            <p className="cta-subtitle mt-4 text-lg text-primary-foreground/80 opacity-0">
              {subtitle}
            </p>
            <div className="cta-button mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2 text-base">
                  {button}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="cta-note mt-4 text-sm text-primary-foreground/60 opacity-0">
              {noCard}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
