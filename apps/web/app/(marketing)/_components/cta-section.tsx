'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container, Section } from '@/components/marketing';

interface CtaSectionProps {
  title: string;
  subtitle: string;
  button: string;
  noCard: string;
}

export function CtaSection({ title, subtitle, button, noCard }: CtaSectionProps) {
  return (
    <Section>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-24"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 text-base"
                >
                  {button}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/60">{noCard}</p>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
