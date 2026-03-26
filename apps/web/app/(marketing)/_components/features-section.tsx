'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  QrCode,
  Globe,
  Zap,
  BarChart3,
  Smartphone,
  Palette,
} from 'lucide-react';
import { Container } from '@/components/marketing';

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  title: string;
  subtitle: string;
  features: {
    qrCode: Feature;
    multilingual: Feature;
    realtime: Feature;
    analytics: Feature;
    mobile: Feature;
    branding: Feature;
  };
}

const featureIcons = {
  qrCode: QrCode,
  multilingual: Globe,
  realtime: Zap,
  analytics: BarChart3,
  mobile: Smartphone,
  branding: Palette,
};

export function FeaturesSection({
  title,
  subtitle,
  features,
}: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const featureList = Object.entries(features).map(([key, feature]) => ({
    key,
    icon: featureIcons[key as keyof typeof featureIcons],
    ...feature,
  }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section title reveal - clip from bottom
      gsap.fromTo(
        '.features-title',
        { opacity: 0, y: 60, clipPath: 'inset(100% 0% 0% 0%)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.features-title',
            start: 'top 85%',
            end: 'top 60%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.features-subtitle',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.features-subtitle',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Cards staggered entrance from different directions
      const cards = gsap.utils.toArray<HTMLElement>('.feature-card');
      cards.forEach((card, i) => {
        const fromLeft = i % 2 === 0;
        gsap.fromTo(
          card,
          {
            opacity: 0,
            x: fromLeft ? -60 : 60,
            y: 40,
            rotateY: fromLeft ? -10 : 10,
            scale: 0.9,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // Icon micro-animations on scroll
      const icons = gsap.utils.toArray<HTMLElement>('.feature-icon');
      icons.forEach((icon) => {
        gsap.fromTo(
          icon,
          { scale: 0, rotation: -90 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.6,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: icon,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // 3D Tilt effect on hover
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.feature-card');
    const handlers: Array<{ card: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

    cards.forEach((card) => {
      const glow = card.querySelector<HTMLElement>('.card-glow');

      const move = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        card.style.transform = `perspective(1000px) rotateX(${((y - centerY) / centerY) * -8}deg) rotateY(${((x - centerX) / centerX) * 8}deg) scale(1.02)`;
        if (glow) {
          glow.style.transform = `translate(${x - centerX}px, ${y - centerY}px)`;
          glow.style.opacity = '1';
        }
      };

      const leave = () => {
        card.style.transform = '';
        if (glow) {
          glow.style.opacity = '0';
        }
      };

      card.addEventListener('mousemove', move);
      card.addEventListener('mouseleave', leave);
      handlers.push({ card, move, leave });
    });

    return () => {
      handlers.forEach(({ card, move, leave }) => {
        card.removeEventListener('mousemove', move);
        card.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-16 sm:py-20 lg:py-24 bg-muted/30 overflow-hidden"
    >
      <Container>
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="features-title text-3xl font-bold tracking-tight sm:text-4xl opacity-0">
            {title}
          </h2>
          <p className="features-subtitle mt-4 text-lg text-muted-foreground opacity-0">
            {subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div ref={cardsRef} className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((feature) => (
            <div
              key={feature.key}
              className="feature-card group relative rounded-2xl bg-background p-8 shadow-sm border hover:shadow-xl transition-shadow opacity-0 [transform-style:preserve-3d] cursor-default overflow-hidden"
            >
              {/* Glow effect */}
              <div className="card-glow absolute w-32 h-32 bg-primary/20 rounded-full blur-2xl opacity-0 pointer-events-none -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />

              {/* Icon */}
              <div className="feature-icon mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
