'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FileEdit, QrCode, ScanLine } from 'lucide-react';
import { Container } from '@/components/marketing';

gsap.registerPlugin(ScrollTrigger);

interface Step {
  title: string;
  description: string;
}

interface HowItWorksSectionProps {
  title: string;
  subtitle: string;
  steps: {
    step1: Step;
    step2: Step;
    step3: Step;
  };
}

const stepIcons = [FileEdit, QrCode, ScanLine];

export function HowItWorksSection({
  title,
  subtitle,
  steps,
}: HowItWorksSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);

  const stepList = [steps.step1, steps.step2, steps.step3];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section title
      gsap.fromTo(
        '.hiw-title',
        { opacity: 0, y: 60, clipPath: 'inset(100% 0% 0% 0%)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.hiw-title',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.hiw-subtitle',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: '.hiw-subtitle',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Progress line animation - fills as you scroll
      if (progressLineRef.current) {
        gsap.fromTo(
          progressLineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.hiw-steps-container',
              start: 'top 70%',
              end: 'bottom 50%',
              scrub: 1,
            },
          }
        );
      }

      // Step cards - staggered entrance with different effects per step
      const stepCards = gsap.utils.toArray<HTMLElement>('.hiw-step');
      stepCards.forEach((card, i) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        });

        // Card slides up
        tl.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
        );

        // Number badge pops in
        tl.fromTo(
          card.querySelector('.step-number'),
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(3)' },
          '-=0.4'
        );

        // Icon circle grows
        tl.fromTo(
          card.querySelector('.step-icon-circle'),
          { scale: 0 },
          { scale: 1, duration: 0.5, ease: 'back.out(2)' },
          '-=0.5'
        );

        // Text fades in
        tl.fromTo(
          card.querySelector('.step-content'),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 },
          '-=0.3'
        );
      });

      // Icon hover pulse - continuous subtle animation
      gsap.utils.toArray<HTMLElement>('.step-icon-circle').forEach((circle, i) => {
        gsap.to(circle, {
          scale: 1.05,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.5,
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 lg:py-24 overflow-hidden">
      <Container>
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="hiw-title text-3xl font-bold tracking-tight sm:text-4xl opacity-0">
            {title}
          </h2>
          <p className="hiw-subtitle mt-4 text-lg text-muted-foreground opacity-0">
            {subtitle}
          </p>
        </div>

        {/* Steps */}
        <div className="hiw-steps-container mt-16 relative">
          {/* Animated Progress Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5">
            {/* Background line */}
            <div className="absolute inset-0 bg-muted-foreground/10 rounded-full" />
            {/* Animated fill */}
            <div
              ref={progressLineRef}
              className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/50 rounded-full origin-left"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {stepList.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <div
                  key={index}
                  className="hiw-step relative text-center opacity-0"
                >
                  {/* Step Number + Icon */}
                  <div className="relative mx-auto mb-6">
                    <div className="step-icon-circle flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto shadow-lg shadow-primary/5">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="step-number absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="step-content">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
