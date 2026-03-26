'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/marketing';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface Plan {
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

interface PricingSectionProps {
  title: string;
  subtitle: string;
  currency: string;
  perMonth: string;
  plans: {
    free: Plan;
    starter: Plan;
    pro: Plan;
  };
}

export function PricingSection({
  title,
  subtitle,
  currency,
  perMonth,
  plans,
}: PricingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const planList = [plans.free, plans.starter, plans.pro];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        '.pricing-title',
        { opacity: 0, y: 60, clipPath: 'inset(100% 0% 0% 0%)' },
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.pricing-title',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      gsap.fromTo(
        '.pricing-subtitle',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: '.pricing-subtitle',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );

      // Pricing cards - fly in from sides
      const cards = gsap.utils.toArray<HTMLElement>('.pricing-card');
      cards.forEach((card, i) => {
        const directions = [-100, 0, 100]; // left, center (below), right
        const xFrom = directions[i];

        gsap.fromTo(
          card,
          {
            opacity: 0,
            x: xFrom,
            y: 60,
            scale: 0.85,
            rotateY: i === 0 ? -15 : i === 2 ? 15 : 0,
          },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotateY: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );

        // Popular badge pulse
        const badge = card.querySelector('.popular-badge');
        if (badge) {
          gsap.fromTo(
            badge,
            { scale: 0, y: -20 },
            {
              scale: 1,
              y: 0,
              duration: 0.6,
              ease: 'back.out(3)',
              scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          );

          // Continuous subtle pulse
          gsap.to(badge, {
            scale: 1.05,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 1,
          });
        }

        // Feature checkmarks cascade
        const features = card.querySelectorAll('.pricing-feature');
        gsap.fromTo(
          features,
          { opacity: 0, x: -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );

        // Check icons pop in
        const checks = card.querySelectorAll('.pricing-check');
        gsap.fromTo(
          checks,
          { scale: 0, rotation: -90 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.4,
            stagger: 0.08,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: card,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        );

        // CTA button bounce in
        const ctaBtn = card.querySelector('.pricing-cta');
        if (ctaBtn) {
          gsap.fromTo(
            ctaBtn,
            { opacity: 0, y: 20, scale: 0.8 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: 'back.out(2)',
              scrollTrigger: {
                trigger: card,
                start: 'top 70%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });

      // Price counter animation
      const priceEls = gsap.utils.toArray<HTMLElement>('.price-value');
      priceEls.forEach((el) => {
        const targetValue = parseInt(el.dataset.price || '0', 10);
        if (targetValue > 0) {
          const obj = { value: 0 };
          gsap.to(obj, {
            value: targetValue,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
            onUpdate: () => {
              el.textContent = Math.round(obj.value).toString();
            },
          });
        }
      });

      // Hover effects for cards
      cards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -8,
            scale: card.classList.contains('popular-card') ? 1.12 : 1.03,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: card.classList.contains('popular-card') ? 1.05 : 1,
            boxShadow: card.classList.contains('popular-card')
              ? '0 20px 40px -12px rgba(0, 0, 0, 0.12)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="py-16 sm:py-20 lg:py-24 bg-muted/30 overflow-hidden"
    >
      <Container>
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="pricing-title text-3xl font-bold tracking-tight sm:text-4xl opacity-0">
            {title}
          </h2>
          <p className="pricing-subtitle mt-4 text-lg text-muted-foreground opacity-0">
            {subtitle}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 items-start [perspective:1200px]">
          {planList.map((plan, index) => {
            const priceNum = parseInt(plan.price, 10);
            return (
              <div
                key={plan.name}
                className={cn(
                  'pricing-card relative rounded-2xl bg-background p-8 border opacity-0 [transform-style:preserve-3d] transition-colors',
                  plan.popular
                    ? 'popular-card border-primary shadow-lg scale-105 lg:scale-110'
                    : 'shadow-sm'
                )}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="popular-badge absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Glow for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/10 blur-xl scale-105" />
                )}

                {/* Plan Header */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span
                      className="price-value text-4xl font-bold"
                      data-price={isNaN(priceNum) ? '0' : priceNum.toString()}
                    >
                      {plan.price}
                    </span>
                    <span className="text-xl font-semibold">{currency}</span>
                    <span className="text-muted-foreground">{perMonth}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="pricing-feature flex items-start gap-3 opacity-0"
                    >
                      <Check className="pricing-check h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="pricing-cta mt-8 opacity-0">
                  <Link href="/register">
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
