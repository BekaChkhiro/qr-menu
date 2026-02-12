'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  animate?: boolean;
  delay?: number;
}

export function Section({
  children,
  className,
  id,
  animate = true,
  delay = 0,
}: SectionProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  if (!animate) {
    return (
      <section id={id} className={cn('py-16 sm:py-20 lg:py-24', className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay }}
      className={cn('py-16 sm:py-20 lg:py-24', className)}
    >
      {children}
    </motion.section>
  );
}
