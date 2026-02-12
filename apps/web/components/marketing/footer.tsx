import Link from 'next/link';
import { QrCode, Facebook, Instagram, Linkedin } from 'lucide-react';
import { Container } from './container';

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
    <footer className="bg-muted/50 border-t">
      <Container>
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-xl mb-4"
              >
                <QrCode className="h-7 w-7 text-primary" />
                <span>Digital Menu</span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                {translations.tagline}
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {translations.followUs}
                </span>
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold mb-4">{translations.product}</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">{translations.company}</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold mb-4">{translations.legal}</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t">
          <p className="text-sm text-muted-foreground text-center">
            {translations.copyright}
          </p>
        </div>
      </Container>
    </footer>
  );
}
