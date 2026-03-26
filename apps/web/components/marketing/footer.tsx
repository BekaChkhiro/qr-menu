import Link from 'next/link';
import { QrCode, Facebook, Instagram, Linkedin, ArrowUpRight, Heart } from 'lucide-react';
import { Container } from './container';
import { Button } from '@/components/ui/button';

interface FooterProps {
  translations: {
    product: string;
    features: string;
    pricing: string;
    demo: string;
    company: string;
    about: string;
    contact: string;
    blog: string;
    legal: string;
    privacy: string;
    terms: string;
    cookies: string;
    followUs: string;
    copyright: string;
    tagline: string;
  };
}

export function Footer({ translations }: FooterProps) {

  const footerLinks = {
    product: [
      { href: '#features', label: translations.features },
      { href: '#pricing', label: translations.pricing },
      { href: '/demo', label: translations.demo },
    ],
    company: [
      { href: '/about', label: translations.about },
      { href: '/contact', label: translations.contact },
      { href: '/blog', label: translations.blog },
    ],
    legal: [
      { href: '/privacy', label: translations.privacy },
      { href: '/terms', label: translations.terms },
      { href: '/cookies', label: translations.cookies },
    ],
  };

  const socialLinks = [
    { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
    { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
    { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/50">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/30" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px]" />
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary/[0.02] rounded-full blur-[80px]" />
      </div>

      <Container>
        {/* Top CTA bar */}
        <div className="py-10 lg:py-14 flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-border/30">
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">
              მზად ხართ დასაწყებად?
            </h3>
            <p className="text-muted-foreground mt-1.5 text-base">
              {translations.tagline}
            </p>
          </div>
          <Link href="/register">
            <Button size="lg" className="gap-2 group shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all">
              შექმენი მენიუ უფასოდ
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>

        {/* Main footer grid */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 font-bold text-xl group mb-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 transition-colors group-hover:bg-primary/15">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  Digital Menu
                </span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
                {translations.tagline}
              </p>
              {/* Social Links */}
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {translations.followUs}
                </span>
                <div className="flex items-center gap-2 mt-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-all duration-200"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {translations.product}
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-50 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {translations.company}
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-50 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {translations.legal}
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-50 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/60">
            {translations.copyright}
          </p>
          <p className="text-xs text-muted-foreground/40 flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400/60 fill-red-400/60" /> in Georgia
          </p>
        </div>
      </Container>
    </footer>
  );
}
