'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/marketing';

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
  return (
    <Section
      className="pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-20 lg:pb-24 overflow-hidden"
      animate={false}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/20 to-primary/5 rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {trustedBy}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base">
                {cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="gap-2 text-base">
                <Play className="h-4 w-4" />
                {secondaryCta}
              </Button>
            </Link>
          </motion.div>

          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 relative"
          >
            {/* Phone Mockup */}
            <div className="relative mx-auto max-w-xs">
              <div className="relative z-10 rounded-[2.5rem] border-8 border-gray-900 bg-gray-900 p-2 shadow-2xl dark:border-gray-700">
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
                      <h3 className="font-semibold text-sm">Bella Italia</h3>
                      <p className="text-xs text-muted-foreground">Italian Restaurant</p>
                    </div>
                    {/* Menu Items Preview */}
                    <div className="space-y-3">
                      {['Margherita', 'Pepperoni', 'Quattro Formaggi'].map((item, i) => (
                        <div key={item} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg" />
                          <div className="flex-1">
                            <p className="text-xs font-medium">{item}</p>
                            <p className="text-xs text-muted-foreground">{12 + i * 3}₾</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* QR Code Decoration */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 border rotate-6">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xMCAxMGgzMHYzMEgxMHptNSA1djIwaDIwVjE1em01IDVoMTB2MTBIMjB6bTQwLTEwaDMwdjMwSDYwem01IDV2MjBoMjBWMTV6bTUgNWgxMHYxMEg3MHpNMTAgNjBoMzB2MzBIMTB6bTUgNXYyMGgyMFY2NXptNSA1aDEwdjEwSDIweiIvPjwvc3ZnPg==')] bg-contain bg-center bg-no-repeat" />
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
