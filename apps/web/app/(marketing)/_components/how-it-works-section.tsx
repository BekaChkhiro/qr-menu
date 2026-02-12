'use client';

import { motion } from 'framer-motion';
import { FileEdit, QrCode, ScanLine } from 'lucide-react';
import { Container, Section } from '@/components/marketing';

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
  const stepList = [steps.step1, steps.step2, steps.step3];

  return (
    <Section>
      <Container>
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Steps */}
        <div className="mt-16 relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="grid gap-8 lg:grid-cols-3">
            {stepList.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative text-center"
                >
                  {/* Step Number */}
                  <div className="relative mx-auto mb-6">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground max-w-xs mx-auto">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
