'use client';

import { motion } from 'framer-motion';
import {
  QrCode,
  Globe,
  Zap,
  BarChart3,
  Smartphone,
  Palette,
} from 'lucide-react';
import { Container, Section } from '@/components/marketing';

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
  const featureList = Object.entries(features).map(([key, feature]) => ({
    key,
    icon: featureIcons[key as keyof typeof featureIcons],
    ...feature,
  }));

  return (
    <Section id="features" className="bg-muted/30">
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

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl bg-background p-8 shadow-sm border hover:shadow-md transition-shadow"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
