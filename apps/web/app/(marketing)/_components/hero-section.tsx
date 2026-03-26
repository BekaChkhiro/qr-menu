'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Play, QrCode, UtensilsCrossed, Smartphone, Star, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/marketing';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  title: string;
  subtitle: string;
  cta: string;
  secondaryCta: string;
  trustedBy: string;
}

export function HeroSection({
  title,
  subtitle,
  cta,
  secondaryCta,
  trustedBy,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Badge entrance - slides from left with scale
      tl.fromTo(
        '.hero-badge',
        { opacity: 0, x: -60, scale: 0.8 },
        { opacity: 1, x: 0, scale: 1, duration: 0.8 }
      );

      // Title - words animate one by one from below with rotation
      const words = titleRef.current?.querySelectorAll('.hero-word');
      if (words) {
        tl.fromTo(
          words,
          { opacity: 0, y: 80, rotateX: -90 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: 'back.out(1.7)',
          },
          '-=0.3'
        );
      }

      // Subtitle - smooth fade
      tl.fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 },
        '-=0.4'
      );

      // CTA buttons - bounce in from bottom
      tl.fromTo(
        '.hero-cta-primary',
        { opacity: 0, y: 40, scale: 0.5 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' },
        '-=0.3'
      );
      tl.fromTo(
        '.hero-cta-secondary',
        { opacity: 0, y: 40, scale: 0.5 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' },
        '-=0.4'
      );

      // Phone mockup - dramatic entrance from below with 3D rotation
      tl.fromTo(
        phoneRef.current,
        { opacity: 0, y: 120, rotateY: -15, rotateX: 10, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power4.out',
        },
        '-=0.6'
      );

      // QR code decoration flies in with spin
      tl.fromTo(
        '.hero-qr-decoration',
        { opacity: 0, scale: 0, rotation: -180 },
        { opacity: 1, scale: 1, rotation: 6, duration: 0.8, ease: 'back.out(1.5)' },
        '-=0.8'
      );

      // Floating elements — use CSS animations instead of per-element GSAP tweens
      gsap.utils.toArray<HTMLElement>('.floating-element').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0 },
          { opacity: 0.15, scale: 1, duration: 0.8, delay: 1.5 + i * 0.3, ease: 'back.out(2)' }
        );
      });

      // Parallax on scroll - phone moves up, floating elements scatter
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.set(phoneRef.current, { y: progress * -80 });
          gsap.set('.hero-badge', { y: progress * -40 });
          gsap.set(floatingRef.current, { y: progress * 60 });
        },
      });

      // Gradient background — CSS animation (GPU-accelerated)
      // Handled via CSS classes below
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Mouse parallax effect on phone
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!phoneRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 10;

      gsap.to(phoneRef.current, {
        rotateY: x,
        rotateX: -y,
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Split title into words for individual animation
  const titleWords = title.split(' ');

  return (
    <section
      ref={sectionRef}
      className="relative pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-20 lg:pb-24 overflow-hidden"
    >
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-purple-500/10 rounded-full blur-3xl animate-hero-gradient-1" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/10 to-primary/15 rounded-full blur-3xl animate-hero-gradient-2" />
      </div>

      {/* Floating Elements */}
      <div ref={floatingRef} className="absolute inset-0 -z-5 pointer-events-none">
        <div className="floating-element absolute top-[15%] left-[10%]">
          <QrCode className="h-8 w-8 text-primary" />
        </div>
        <div className="floating-element absolute top-[20%] right-[15%]">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
        </div>
        <div className="floating-element absolute top-[60%] left-[5%]">
          <Smartphone className="h-7 w-7 text-primary" />
        </div>
        <div className="floating-element absolute top-[50%] right-[8%]">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div className="floating-element absolute top-[75%] left-[20%]">
          <Wifi className="h-6 w-6 text-primary" />
        </div>
        <div className="floating-element absolute top-[30%] right-[25%]">
          <div className="w-3 h-3 rounded-full bg-primary/40" />
        </div>
        <div className="floating-element absolute top-[65%] right-[20%]">
          <div className="w-2 h-2 rounded-full bg-primary/30" />
        </div>
      </div>

      <Container>
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="hero-badge opacity-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {trustedBy}
            </span>
          </div>

          {/* Title - Split into words */}
          <h1
            ref={titleRef}
            className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl [perspective:1000px]"
          >
            {titleWords.map((word, i) => (
              <span
                key={i}
                className="hero-word inline-block opacity-0 mr-[0.3em] [transform-style:preserve-3d]"
              >
                {word}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle opacity-0 mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="hero-cta-primary opacity-0">
              <Button size="lg" className="gap-2 text-base">
                {cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo" className="hero-cta-secondary opacity-0">
              <Button size="lg" variant="outline" className="gap-2 text-base">
                <Play className="h-4 w-4" />
                {secondaryCta}
              </Button>
            </Link>
          </div>

          {/* Demo Preview - Phone Mockup */}
          <div
            ref={phoneRef}
            className="mt-16 relative opacity-0 [perspective:1000px] [transform-style:preserve-3d]"
          >
            <div className="relative mx-auto max-w-xs">
              <div className="relative z-10 rounded-[2.5rem] border-8 border-gray-900 bg-gray-900 p-2 shadow-2xl dark:border-gray-700">
                {/* Glow effect behind phone */}
                <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-primary/20 blur-2xl scale-110" />
                <div className="rounded-[2rem] bg-white dark:bg-gray-800 overflow-hidden">
                  {/* Phone Header */}
                  <div className="h-6 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </div>
                  {/* Phone Content Preview */}
                  <div className="p-4 space-y-4 h-[400px]">
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl">🍕</span>
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        Bella Italia
                      </h3>
                      <p className="text-xs text-muted-foreground">Italian Restaurant</p>
                    </div>
                    {/* Menu Items Preview */}
                    <div className="space-y-3">
                      {['Margherita', 'Pepperoni', 'Quattro Formaggi'].map((item, i) => (
                        <div
                          key={item}
                          className="menu-item flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {item}
                            </p>
                            <p className="text-xs text-muted-foreground">{12 + i * 3}₾</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* QR Code Decoration */}
              <div className="hero-qr-decoration absolute -right-8 -bottom-8 w-24 h-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 border opacity-0">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xMCAxMGgzMHYzMEgxMHptNSA1djIwaDIwVjE1em01IDVoMTB2MTBIMjB6bTQwLTEwaDMwdjMwSDYwem01IDV2MjBoMjBWMTV6bTUgNWgxMHYxMEg3MHpNMTAgNjBoMzB2MzBIMTB6bTUgNXYyMGgyMFY2NXptNSA1aDEwdjEwSDIweiIvPjwvc3ZnPg==')] bg-contain bg-center bg-no-repeat" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
