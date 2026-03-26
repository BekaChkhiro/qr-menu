'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  QrCode,
  Globe,
  Zap,
  BarChart3,
  Smartphone,
  Palette,
  FileEdit,
  ScanLine,
  TrendingUp,
  Users,
  Star,
  ChefHat,
  Clock,
  Check,
  ArrowRight,
  Play,
  Sparkles,
  Rocket,
  Mouse,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// Types
// =============================================================================

interface Plan {
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

interface PhoneJourneyProps {
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
    trustedBy: string;
  };
  scenes: {
    create: { title: string; description: string; features: string[] };
    customize: { title: string; description: string; features: string[] };
    publish: { title: string; description: string; features: string[] };
    analytics: { title: string; description: string; features: string[] };
  };
  pricing: {
    title: string;
    subtitle: string;
    currency: string;
    perMonth: string;
    plans: Plan[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    noCard: string;
  };
}

// =============================================================================
// Phone Screens (unchanged)
// =============================================================================

function MenuPreviewScreen() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1f36] to-[#1a1f36]/95">
      <div className="text-center pt-6 pb-3">
        <div className="w-12 h-12 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center">
          <span className="text-2xl">🍕</span>
        </div>
        <h4 className="text-white text-xs font-bold">Bella Italia</h4>
        <p className="text-white/50 text-[8px]">Italian Restaurant</p>
      </div>
      <div className="flex-1 px-3 space-y-2">
        {[
          { name: 'Margherita', price: '12₾', emoji: '🌿' },
          { name: 'Pepperoni', price: '15₾', emoji: '🌶️' },
          { name: 'Quattro Formaggi', price: '18₾', emoji: '⭐' },
          { name: 'Capricciosa', price: '16₾', emoji: '🍄' },
        ].map((item) => (
          <div key={item.name} className="flex gap-2 p-2 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-base">{item.emoji}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-white text-[10px] font-semibold">{item.name}</span>
                <span className="text-white text-[10px] font-bold">{item.price}</span>
              </div>
              <div className="mt-1 h-1.5 bg-white/5 rounded-full w-3/4" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-center gap-1.5 py-2 rounded-full bg-white/5">
          <QrCode className="w-3 h-3 text-white/40" />
          <span className="text-[8px] text-white/40">Scan to view menu</span>
        </div>
      </div>
    </div>
  );
}

function MenuCreatorScreen() {
  return (
    <div className="p-3 h-full flex flex-col">
      <div data-hl="1-0" className="ph-hl flex items-center justify-between mb-3 rounded-lg transition-all duration-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <ChefHat className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[10px] font-semibold text-gray-900 dark:text-white">მენიუს შექმნა</span>
        </div>
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
          <FileEdit className="w-3 h-3 text-primary" />
        </div>
      </div>
      <div data-hl="1-1" className="ph-hl mb-3 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 transition-all duration-300">
        <span className="text-[8px] text-gray-400 block mb-0.5">რესტორნის სახელი</span>
        <span className="text-[10px] font-medium text-gray-900 dark:text-white">Bella Italia ✨</span>
      </div>
      <div className="mb-2">
        <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider">კატეგორიები</span>
      </div>
      <div data-hl="1-2" className="ph-hl space-y-1.5 flex-1 rounded-lg transition-all duration-300">
        {[
          { name: 'პიცა', count: 8, emoji: '🍕' },
          { name: 'პასტა', count: 5, emoji: '🍝' },
          { name: 'სალათები', count: 4, emoji: '🥗' },
          { name: 'დესერტი', count: 3, emoji: '🍰' },
        ].map((cat) => (
          <div key={cat.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 shadow-sm">
            <span className="text-sm">{cat.emoji}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-medium text-gray-900 dark:text-white block">{cat.name}</span>
              <span className="text-[8px] text-gray-400">{cat.count} პროდუქტი</span>
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="w-1 h-1 rounded-full bg-gray-300" />
            </div>
          </div>
        ))}
      </div>
      <div data-hl="1-3" className="ph-hl mt-2 p-1.5 rounded-lg bg-primary text-white text-center transition-all duration-300">
        <span className="text-[10px] font-medium">+ კატეგორიის დამატება</span>
      </div>
    </div>
  );
}

function CustomizeScreen() {
  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">დიზაინი & ბრენდი</span>
        <Palette className="w-4 h-4 text-primary" />
      </div>
      <div data-hl="2-0" className="ph-hl mb-3 rounded-lg p-1 -m-1 transition-all duration-300">
        <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">ფერის თემა</span>
        <div className="flex gap-1.5">
          {['#1a1f36', '#dc2626', '#059669', '#7c3aed', '#ea580c', '#0284c7'].map((color, i) => (
            <div key={color} className={`w-6 h-6 rounded-full border-2 ${i === 0 ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
      <div data-hl="2-1" className="ph-hl mb-3 rounded-lg p-1 -m-1 transition-all duration-300">
        <span className="text-[8px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">ენები</span>
        <div className="flex gap-1.5">
          {[{ flag: '🇬🇪', name: 'ქართ.', on: true }, { flag: '🇬🇧', name: 'Eng', on: true }, { flag: '🇷🇺', name: 'Рус', on: false }].map((l) => (
            <div key={l.name} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] ${l.on ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600'}`}>
              <span>{l.flag}</span><span>{l.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div data-hl="2-2" className="ph-hl flex-1 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300">
        <div className="h-12 bg-[#1a1f36] flex items-center justify-center">
          <span className="text-white text-[10px] font-semibold">Bella Italia</span>
        </div>
        <div className="p-2 space-y-1.5 bg-gray-50 dark:bg-gray-700/50">
          {['Margherita — 12₾', 'Pepperoni — 15₾'].map((item) => (
            <div key={item} className="flex items-center gap-2 p-1 rounded bg-white dark:bg-gray-700">
              <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600" />
              <span className="text-[8px] text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div data-hl="2-3" className="ph-hl mt-2 flex gap-2 rounded-lg p-1 -m-1 transition-all duration-300">
        <div className="flex-1 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-center">
          <span className="text-[10px] text-gray-600 dark:text-gray-300">გაუქმება</span>
        </div>
        <div className="flex-1 p-1.5 rounded-lg bg-primary text-white text-center">
          <span className="text-[10px] font-medium">შენახვა</span>
        </div>
      </div>
    </div>
  );
}

function LiveMenuScreen() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1f36] to-[#1a1f36]/95">
      <div data-hl="3-0" className="ph-hl text-center pt-4 pb-3 rounded-lg transition-all duration-300">
        <div className="w-10 h-10 bg-white/10 rounded-full mx-auto mb-1.5 flex items-center justify-center">
          <span className="text-lg">🍕</span>
        </div>
        <h4 className="text-white text-[11px] font-bold">Bella Italia</h4>
        <p className="text-white/50 text-[8px]">Italian Restaurant • Open Now</p>
        <div className="flex justify-center gap-1 mt-1.5">
          {['🇬🇪', '🇬🇧'].map((flag, i) => (
            <span key={flag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${i === 0 ? 'bg-white/20' : 'bg-white/5'}`}>{flag}</span>
          ))}
        </div>
      </div>
      <div data-hl="3-1" className="ph-hl flex gap-1 px-3 mb-2 rounded-lg transition-all duration-300">
        {['🍕 პიცა', '🍝 პასტა', '🥗 სალათი'].map((tab, i) => (
          <span key={tab} className={`text-[8px] px-2 py-1 rounded-full whitespace-nowrap ${i === 0 ? 'bg-white text-[#1a1f36] font-semibold' : 'bg-white/10 text-white/70'}`}>{tab}</span>
        ))}
      </div>
      <div data-hl="3-2" className="ph-hl flex-1 px-3 space-y-2 overflow-hidden rounded-lg transition-all duration-300">
        {[
          { name: 'Margherita', desc: 'ტომატი, მოცარელა, ბაზილიკი', price: '12₾', tag: '🌿' },
          { name: 'Pepperoni', desc: 'პეპერონი, მოცარელა', price: '15₾', tag: '🌶️' },
          { name: 'Quattro Formaggi', desc: '4 სახის ყველი', price: '18₾', tag: '⭐' },
        ].map((item) => (
          <div key={item.name} className="flex gap-2 p-2 rounded-xl bg-white/5 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{item.tag}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white text-[10px] font-semibold">{item.name}</span>
                <span className="text-white text-[10px] font-bold">{item.price}</span>
              </div>
              <span className="text-white/40 text-[8px] block">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
      <div data-hl="3-3" className="ph-hl p-3 rounded-lg transition-all duration-300">
        <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-white/5">
          <QrCode className="w-3 h-3 text-white/40" />
          <span className="text-[8px] text-white/40">QR კოდით გახსნილი მენიუ</span>
        </div>
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  return (
    <div className="p-3 h-full flex flex-col">
      <div data-hl="4-0" className="ph-hl flex items-center justify-between mb-3 rounded-lg transition-all duration-300">
        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">ანალიტიკა</span>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-[8px] text-green-600 dark:text-green-400 font-medium">+24%</span>
        </div>
      </div>
      <div data-hl="4-1" className="ph-hl grid grid-cols-2 gap-1.5 mb-3 rounded-lg transition-all duration-300">
        {[
          { label: 'ნახვები', value: '2,847', icon: Users, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-500' },
          { label: 'სკანირება', value: '1,234', icon: ScanLine, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-500' },
          { label: 'შეფასება', value: '4.8★', icon: Star, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' },
          { label: 'აქტიური', value: '18 წთ', icon: Clock, color: 'bg-green-50 dark:bg-green-900/30 text-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="p-2 rounded-lg border border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700">
            <div className={`w-5 h-5 rounded ${stat.color} flex items-center justify-center mb-1`}>
              <stat.icon className="w-3 h-3" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white block">{stat.value}</span>
            <span className="text-[7px] text-gray-400">{stat.label}</span>
          </div>
        ))}
      </div>
      <div data-hl="4-2" className="ph-hl flex-1 rounded-lg border border-gray-100 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 transition-all duration-300">
        <span className="text-[8px] font-semibold text-gray-500 block mb-2">კვირის ნახვები</span>
        <div className="flex items-end gap-1 h-16">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <div key={i} className="chart-bar flex-1 rounded-t bg-primary/20 relative" style={{ height: `${h}%` }}>
              <div className="chart-bar-fill absolute bottom-0 left-0 right-0 rounded-t bg-primary" style={{ height: '0%' }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'].map((day) => (
            <span key={day} className="text-[6px] text-gray-400 flex-1 text-center">{day}</span>
          ))}
        </div>
      </div>
      <div data-hl="4-3" className="ph-hl mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 transition-all duration-300">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🏆</span>
          <div>
            <span className="text-[9px] font-semibold text-amber-800 dark:text-amber-300 block">ტოპ პროდუქტი</span>
            <span className="text-[8px] text-amber-600 dark:text-amber-400">Margherita — 342 შეკვეთა</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingPhoneScreen() {
  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-gray-900 dark:text-white">აირჩიეთ გეგმა</span>
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="space-y-2 flex-1">
        {[
          { name: 'უფასო', price: '0₾', desc: '1 მენიუ • 15 პროდუქტი', active: false },
          { name: 'სტარტერი', price: '29₾', desc: '3 მენიუ • შეუზღუდავი', active: true, popular: true },
          { name: 'პრო', price: '59₾', desc: 'შეუზღუდავი • ანალიტიკა', active: false },
        ].map((plan) => (
          <div key={plan.name} className={cn(
            'relative p-3 rounded-xl border',
            plan.active ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
          )}>
            {plan.popular && (
              <span className="absolute -top-2 right-3 text-[7px] bg-primary text-white px-2 py-0.5 rounded-full font-medium">პოპულარული</span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-gray-900 dark:text-white block">{plan.name}</span>
                <span className="text-[8px] text-gray-400">{plan.desc}</span>
              </div>
              <span className={cn('text-base font-bold', plan.active ? 'text-primary' : 'text-gray-900 dark:text-white')}>{plan.price}</span>
            </div>
            {plan.active && (
              <div className="mt-2 p-1.5 rounded-lg bg-primary text-white text-center">
                <span className="text-[9px] font-medium">არჩეული გეგმა ✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
        <div className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-[8px] text-green-700 dark:text-green-400">14 დღიანი საცდელი პერიოდი</span>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
        <Rocket className="w-8 h-8 text-green-500" />
      </div>
      <h4 className="text-sm font-bold text-gray-900 dark:text-white text-center mb-1">მზად ხართ!</h4>
      <p className="text-[10px] text-gray-500 text-center mb-4">თქვენი ციფრული მენიუ რამდენიმე წუთში მზად იქნება</p>
      <div className="w-full space-y-2">
        {['რეგისტრაცია', 'მენიუს შექმნა', 'QR კოდის გენერაცია'].map((text) => (
          <div key={text} className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><Check className="w-3 h-3 text-green-500" /></div>
            <span className="text-[9px] text-gray-700 dark:text-gray-300">{text}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-700 border border-primary/30">
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center"><Sparkles className="w-3 h-3 text-primary" /></div>
          <span className="text-[9px] text-primary font-medium">მომხმარებლები სკანირებენ!</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Constants
// =============================================================================

const PHONE_SCREENS = [
  MenuPreviewScreen,
  MenuCreatorScreen,
  CustomizeScreen,
  LiveMenuScreen,
  AnalyticsScreen,
  PricingPhoneScreen,
  SuccessScreen,
];

const SCENE_ICONS = [Smartphone, FileEdit, Palette, QrCode, BarChart3, Star, Rocket];

const FEATURE_ICONS = [
  [],
  [Zap, Globe, Smartphone, FileEdit],
  [Palette, Globe, Star, Smartphone],
  [QrCode, ScanLine, Zap, Users],
  [BarChart3, TrendingUp, Users, Clock],
  [],
  [],
];

const TOTAL = 7;

const SCENE_POSITIONS = [
  { x: 0,     y: 0,     scale: 0.75, rotateY: 0,   rotateX: 0  },  // Hero: center, content L+R
  { x: -0.28, y: 0,     scale: 0.72, rotateY: 5,   rotateX: 0  },  // Create: left, text right
  { x: 0,     y: 0,     scale: 0.72, rotateY: -12,  rotateX: 5  },  // Customize: center tilted, content L+R
  { x: 0.28,  y: 0,     scale: 0.72, rotateY: -5,  rotateX: 0  },  // Publish: right, text left
  { x: -0.28, y: 0,     scale: 0.72, rotateY: 5,   rotateX: 0  },  // Analytics: left, text right
  { x: -0.28, y: 0,     scale: 0.78, rotateY: 5,   rotateX: 0  },  // Pricing: left side, cards right
  { x: 0,     y: 0,     scale: 0.75, rotateY: 0,   rotateX: 0  },  // CTA: center, content L+R
];


// Floating badges around phone — Lucide icon names + positions
import type { LucideIcon } from 'lucide-react';
import { Wifi, Gift, CircleDollarSign, GripVertical, FolderOpen, Paintbrush, SwatchBook, ImagePlus, Camera, Radio, TrendingUp as TrendUp2, Eye } from 'lucide-react';

interface BadgeConfig {
  text: string;
  icon: LucideIcon;
  color: string; // tailwind bg color for icon circle
  pos: string;
}

const SCENE_BADGES: BadgeConfig[][] = [
  // Hero
  [
    { text: 'QR მენიუ', icon: QrCode, color: 'bg-blue-500/15 text-blue-600', pos: 'top-8 -left-32' },
    { text: 'უფასოდ', icon: Sparkles, color: 'bg-amber-500/15 text-amber-600', pos: 'top-6 -right-16' },
    { text: '3 ენა', icon: Globe, color: 'bg-emerald-500/15 text-emerald-600', pos: 'bottom-28 -left-28' },
  ],
  // Create
  [
    { text: 'Drag & Drop', icon: GripVertical, color: 'bg-violet-500/15 text-violet-600', pos: 'top-8 -right-32' },
    { text: 'კატეგორიები', icon: FolderOpen, color: 'bg-blue-500/15 text-blue-600', pos: 'bottom-24 -right-28' },
  ],
  // Customize
  [
    { text: 'ბრენდინგი', icon: Paintbrush, color: 'bg-pink-500/15 text-pink-600', pos: '-top-6 -left-28' },
    { text: 'ფერები', icon: SwatchBook, color: 'bg-violet-500/15 text-violet-600', pos: 'top-24 -right-32' },
    { text: 'ლოგო', icon: ImagePlus, color: 'bg-cyan-500/15 text-cyan-600', pos: 'bottom-20 -left-24' },
  ],
  // Publish
  [
    { text: 'QR კოდი', icon: Camera, color: 'bg-blue-500/15 text-blue-600', pos: 'top-12 -left-32' },
    { text: 'Live!', icon: Radio, color: 'bg-emerald-500/15 text-emerald-600', pos: 'bottom-16 -left-24' },
  ],
  // Analytics
  [
    { text: '+24% ზრდა', icon: TrendUp2, color: 'bg-emerald-500/15 text-emerald-600', pos: 'top-8 -right-32' },
    { text: '2,847 ნახვა', icon: Eye, color: 'bg-blue-500/15 text-blue-600', pos: 'bottom-24 -right-28' },
  ],
  // Pricing
  [
    { text: '29₾/თვე', icon: CircleDollarSign, color: 'bg-amber-500/15 text-amber-600', pos: 'top-8 -right-28' },
  ],
  // CTA
  [
    { text: 'დაიწყე!', icon: Rocket, color: 'bg-violet-500/15 text-violet-600', pos: 'top-8 -right-32' },
    { text: '14 დღე უფასო', icon: Gift, color: 'bg-emerald-500/15 text-emerald-600', pos: 'bottom-24 -left-32' },
  ],
];

// Phone glow colors per scene
const SCENE_GLOW_COLORS = [
  'hsla(222, 47%, 30%, 0.25)',  // Hero — primary
  'hsla(210, 70%, 50%, 0.25)',  // Create — blue
  'hsla(270, 60%, 50%, 0.25)',  // Customize — purple
  'hsla(170, 60%, 40%, 0.25)',  // Publish — teal
  'hsla(230, 60%, 50%, 0.25)',  // Analytics — indigo
  'hsla(35, 70%, 50%, 0.20)',   // Pricing — amber
  'hsla(222, 60%, 40%, 0.30)',  // CTA — vibrant primary
];

// Connector line configs: which side text is on, for drawing connection beam
const SCENE_CONNECTORS: ('left' | 'right' | 'both' | 'bottom' | 'none')[] = [
  'both',   // Hero: L+R
  'right',  // Create: text right
  'both',   // Customize: L+R
  'left',   // Publish: text left
  'right',  // Analytics: text right
  'right',  // Pricing: text right
  'both',   // CTA: L+R
];

// Scene-specific background configs
const SCENE_BACKGROUNDS = [
  { // Hero
    gradient: 'radial-gradient(ellipse 80% 60% at 50% 50%, hsla(222,47%,11%,0.04) 0%, transparent 70%)',
    blob1: 'hsla(222, 47%, 40%, 0.08)', blob2: 'hsla(250, 50%, 50%, 0.06)', blob3: 'hsla(200, 60%, 50%, 0.04)',
    blob1Pos: { x: '25%', y: '30%', scale: 1 }, blob2Pos: { x: '70%', y: '65%', scale: 1 }, blob3Pos: { x: '50%', y: '15%', scale: 0.7 },
    meshAngle: 0, particleOpacity: 0.08, raysOpacity: 0.02, bandY: 40,
  },
  { // Create
    gradient: 'radial-gradient(ellipse 70% 50% at 70% 50%, hsla(210,70%,50%,0.07) 0%, transparent 70%)',
    blob1: 'hsla(210, 70%, 50%, 0.1)', blob2: 'hsla(222, 47%, 30%, 0.06)', blob3: 'hsla(190, 80%, 50%, 0.05)',
    blob1Pos: { x: '65%', y: '40%', scale: 1.3 }, blob2Pos: { x: '15%', y: '70%', scale: 0.9 }, blob3Pos: { x: '80%', y: '15%', scale: 0.6 },
    meshAngle: 3, particleOpacity: 0.1, raysOpacity: 0.015, bandY: 30,
  },
  { // Customize
    gradient: 'radial-gradient(ellipse 90% 70% at 50% 40%, hsla(270,60%,50%,0.08) 0%, transparent 60%)',
    blob1: 'hsla(270, 60%, 50%, 0.1)', blob2: 'hsla(300, 50%, 50%, 0.07)', blob3: 'hsla(240, 70%, 60%, 0.05)',
    blob1Pos: { x: '30%', y: '25%', scale: 1.4 }, blob2Pos: { x: '75%', y: '60%', scale: 1.2 }, blob3Pos: { x: '15%', y: '70%', scale: 0.8 },
    meshAngle: -4, particleOpacity: 0.12, raysOpacity: 0.025, bandY: 50,
  },
  { // Publish
    gradient: 'radial-gradient(ellipse 70% 50% at 30% 50%, hsla(170,60%,40%,0.08) 0%, transparent 65%)',
    blob1: 'hsla(170, 60%, 40%, 0.1)', blob2: 'hsla(200, 50%, 50%, 0.06)', blob3: 'hsla(150, 70%, 45%, 0.05)',
    blob1Pos: { x: '25%', y: '45%', scale: 1.2 }, blob2Pos: { x: '80%', y: '25%', scale: 1 }, blob3Pos: { x: '60%', y: '75%', scale: 0.7 },
    meshAngle: 5, particleOpacity: 0.1, raysOpacity: 0.02, bandY: 55,
  },
  { // Analytics
    gradient: 'radial-gradient(ellipse 70% 55% at 30% 45%, hsla(230,60%,50%,0.08) 0%, transparent 65%)',
    blob1: 'hsla(230, 60%, 50%, 0.1)', blob2: 'hsla(200, 70%, 50%, 0.07)', blob3: 'hsla(260, 50%, 60%, 0.05)',
    blob1Pos: { x: '20%', y: '35%', scale: 1.3 }, blob2Pos: { x: '75%', y: '55%', scale: 1.1 }, blob3Pos: { x: '50%', y: '80%', scale: 0.6 },
    meshAngle: -3, particleOpacity: 0.1, raysOpacity: 0.02, bandY: 35,
  },
  { // Pricing
    gradient: 'radial-gradient(ellipse 80% 60% at 60% 50%, hsla(35,70%,50%,0.07) 0%, transparent 65%)',
    blob1: 'hsla(35, 70%, 50%, 0.08)', blob2: 'hsla(20, 60%, 50%, 0.06)', blob3: 'hsla(45, 80%, 55%, 0.04)',
    blob1Pos: { x: '35%', y: '30%', scale: 1 }, blob2Pos: { x: '70%', y: '65%', scale: 1.2 }, blob3Pos: { x: '15%', y: '55%', scale: 0.7 },
    meshAngle: 6, particleOpacity: 0.08, raysOpacity: 0.015, bandY: 60,
  },
  { // CTA
    gradient: 'radial-gradient(ellipse 90% 70% at 50% 50%, hsla(222,47%,20%,0.1) 0%, transparent 60%)',
    blob1: 'hsla(222, 60%, 40%, 0.12)', blob2: 'hsla(250, 50%, 50%, 0.08)', blob3: 'hsla(200, 60%, 45%, 0.06)',
    blob1Pos: { x: '35%', y: '40%', scale: 1.5 }, blob2Pos: { x: '65%', y: '55%', scale: 1.3 }, blob3Pos: { x: '50%', y: '20%', scale: 0.9 },
    meshAngle: -2, particleOpacity: 0.12, raysOpacity: 0.03, bandY: 45,
  },
];

// =============================================================================
// PhoneFrame Component
// =============================================================================

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[260px] lg:w-[280px]">
      {/* Outer shadow rings for depth */}
      <div className="absolute -inset-1 rounded-[2.8rem] bg-gradient-to-b from-gray-700/20 to-gray-900/40 blur-sm" />
      <div className="absolute -inset-0.5 rounded-[2.7rem] bg-gradient-to-b from-gray-800 to-gray-950 dark:from-gray-600 dark:to-gray-800" />

      {/* Phone body */}
      <div className="relative rounded-[2.5rem] border-[5px] border-gray-900 bg-gray-900 dark:border-gray-700 overflow-hidden shadow-[0_0_60px_-15px_rgba(0,0,0,0.3)]">
        {/* Side buttons — left */}
        <div className="absolute left-[-7px] top-[80px] w-[3px] h-[25px] bg-gray-700 dark:bg-gray-600 rounded-l-sm" />
        <div className="absolute left-[-7px] top-[120px] w-[3px] h-[45px] bg-gray-700 dark:bg-gray-600 rounded-l-sm" />
        <div className="absolute left-[-7px] top-[170px] w-[3px] h-[45px] bg-gray-700 dark:bg-gray-600 rounded-l-sm" />
        {/* Side button — right */}
        <div className="absolute right-[-7px] top-[130px] w-[3px] h-[55px] bg-gray-700 dark:bg-gray-600 rounded-r-sm" />

        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-full z-30 flex items-center justify-center gap-2">
          <div className="w-[8px] h-[8px] rounded-full bg-gray-800 ring-1 ring-gray-700" />
          <div className="w-[5px] h-[5px] rounded-full bg-gray-700" />
        </div>

        {/* Screen */}
        <div className="relative rounded-[2rem] bg-white dark:bg-gray-800 overflow-hidden h-[480px] lg:h-[520px]">
          {/* Status bar */}
          <div className="h-12 flex items-end justify-between px-8 pb-1 bg-transparent relative z-20">
            <span className="text-[11px] font-semibold text-gray-900 dark:text-white">9:41</span>
            <div className="flex items-center gap-1">
              {/* Signal bars */}
              <div className="flex items-end gap-[1.5px]">
                <div className="w-[3px] h-[4px] rounded-[0.5px] bg-gray-900 dark:bg-white" />
                <div className="w-[3px] h-[6px] rounded-[0.5px] bg-gray-900 dark:bg-white" />
                <div className="w-[3px] h-[8px] rounded-[0.5px] bg-gray-900 dark:bg-white" />
                <div className="w-[3px] h-[10px] rounded-[0.5px] bg-gray-300 dark:bg-gray-600" />
              </div>
              {/* WiFi */}
              <svg className="w-[14px] h-[11px] text-gray-900 dark:text-white ml-0.5" viewBox="0 0 16 12" fill="currentColor">
                <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.46 7.04a6.5 6.5 0 019.08 0l-.94.94a5.25 5.25 0 00-7.2 0l-.94-.94zM.64 4.22a10 10 0 0114.72 0l-.94.94a8.75 8.75 0 00-12.84 0L.64 4.22z" />
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-[2px] ml-0.5">
                <div className="w-[22px] h-[10px] rounded-[2.5px] border border-gray-900 dark:border-white p-[1.5px]">
                  <div className="h-full w-[65%] rounded-[1px] bg-gray-900 dark:bg-white" />
                </div>
                <div className="w-[1.5px] h-[4px] rounded-r-sm bg-gray-900 dark:bg-white" />
              </div>
            </div>
          </div>
          {/* Content */}
          <div className="relative h-[calc(100%-3rem)]">
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-gray-600 dark:bg-gray-500 rounded-full" />
      </div>

      {/* Screen reflection overlay */}
      <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none z-40 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
    </div>
  );
}

function MobilePhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-[200px]">
      <div className="absolute -inset-0.5 rounded-[2.2rem] bg-gradient-to-b from-gray-800 to-gray-950 dark:from-gray-600 dark:to-gray-800" />
      <div className="relative rounded-[2rem] border-[4px] border-gray-900 bg-gray-900 dark:border-gray-700 overflow-hidden shadow-xl">
        {/* Dynamic Island */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[70px] h-[20px] bg-black rounded-full z-30 flex items-center justify-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-gray-800 ring-1 ring-gray-700" />
        </div>
        <div className="relative rounded-[1.6rem] bg-white dark:bg-gray-800 overflow-hidden h-[380px]">
          <div className="h-10 flex items-end justify-between px-6 pb-1">
            <span className="text-[10px] font-semibold text-gray-900 dark:text-white">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex items-end gap-[1px]">
                <div className="w-[2px] h-[3px] rounded-[0.5px] bg-gray-900 dark:bg-white" />
                <div className="w-[2px] h-[5px] rounded-[0.5px] bg-gray-900 dark:bg-white" />
                <div className="w-[2px] h-[7px] rounded-[0.5px] bg-gray-900 dark:bg-white" />
                <div className="w-[2px] h-[9px] rounded-[0.5px] bg-gray-300 dark:bg-gray-600" />
              </div>
              <div className="w-[18px] h-[8px] rounded-[2px] border border-gray-900 dark:border-white p-[1px] ml-0.5">
                <div className="h-full w-[65%] rounded-[0.5px] bg-gray-900 dark:bg-white" />
              </div>
            </div>
          </div>
          <div className="relative h-[calc(100%-2.5rem)]">
            {children}
          </div>
        </div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[90px] h-[3px] bg-gray-600 dark:bg-gray-500 rounded-full" />
      </div>
      <div className="absolute inset-0 rounded-[2rem] pointer-events-none z-40 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent" />
    </div>
  );
}


// =============================================================================
// Main Component
// =============================================================================

export function PhoneJourney({ hero, scenes, pricing, cta }: PhoneJourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  const sceneTexts = [
    { type: 'hero' as const, ...hero },
    { type: 'feature' as const, step: 1, ...scenes.create },
    { type: 'feature' as const, step: 2, ...scenes.customize },
    { type: 'feature' as const, step: 3, ...scenes.publish },
    { type: 'feature' as const, step: 4, ...scenes.analytics },
    { type: 'pricing' as const, ...pricing },
    { type: 'cta' as const, ...cta },
  ];


  useEffect(() => {
    const mm = gsap.matchMedia();

    // =========================================================================
    // DESKTOP (>= 768px)
    // =========================================================================
    mm.add('(min-width: 768px)', () => {
      const phone = phoneRef.current;
      const container = containerRef.current;
      if (!phone || !container) return;

      // Cache elements
      const screens = gsap.utils.toArray<HTMLElement>('.phone-screen');
      const chartBars = gsap.utils.toArray<HTMLElement>('.chart-bar-fill');
      const textPanels = gsap.utils.toArray<HTMLElement>('.scene-text');
      const scrollIndicator = container.querySelector<HTMLElement>('.scroll-indicator');
      const bgGradient = container.querySelector<HTMLElement>('.bg-gradient-overlay');
      const bgBlob1 = container.querySelector<HTMLElement>('.bg-blob-1');
      const bgBlob2 = container.querySelector<HTMLElement>('.bg-blob-2');
      const bgBlob3 = container.querySelector<HTMLElement>('.bg-blob-3');
      const bgLightBand = container.querySelector<HTMLElement>('.bg-light-band');
      const bgLightBand2 = container.querySelector<HTMLElement>('.bg-light-band-2');
      const bgLightBandV = container.querySelector<HTMLElement>('.bg-light-band-v');
      const bgMesh = container.querySelector<HTMLElement>('.bg-mesh');
      const bgLightRays = container.querySelector<HTMLElement>('.bg-light-rays');
      const bgLightRays2 = container.querySelector<HTMLElement>('.bg-light-rays-2');
      const bgShapes = container.querySelector<HTMLElement>('.bg-shapes');
      const bgAurora = container.querySelector<HTMLElement>('.bg-aurora');
      const bgGridLines = container.querySelector<HTMLElement>('.bg-grid-lines');
      const bgParticles = container.querySelectorAll<HTMLElement>('.floating-particle');

      let prevStep = 0;

      const vw = () => window.innerWidth;
      const vh = () => window.innerHeight;

      // ── Hero entrance animation (P1) ──
      // Ensure all phone-badges start hidden
      gsap.set('.phone-badge', { opacity: 0, scale: 0.5, y: 10 });

      const heroTl = gsap.timeline({ delay: 0.3 });
      heroTl
        // Left side
        .from('.hero-badge', { opacity: 0, y: 20, scale: 0.9, duration: 0.6, ease: 'power2.out' })
        .from('.hero-title', { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out' }, '-=0.3')
        .from('.hero-subtitle', { opacity: 0, y: 25, filter: 'blur(8px)', duration: 0.6, ease: 'power2.out' }, '-=0.3')
        .from('.hero-stats', { opacity: 0, y: 15, duration: 0.5, ease: 'power2.out' }, '-=0.2')
        // Right side
        .from('.hero-features', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.4')
        .from('.hero-buttons', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.3')
        .from('.hero-trust', { opacity: 0, y: 10, duration: 0.4, ease: 'power2.out' }, '-=0.2')
        // Phone first, then badges after
        .from('.phone-float-wrapper', { opacity: 0, scale: 0.85, y: 40, duration: 0.9, ease: 'back.out(1.4)' }, '-=0.6')
        .from('.scroll-indicator', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out' }, '-=0.3')
        // Connectors
        .to(['.connector-beam-left', '.connector-beam-right'], { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2')
        .to(['.connector-dot-left', '.connector-dot-right'], { opacity: 0.6, scale: 1, duration: 0.4, ease: 'back.out(2)' }, '-=0.3')
        // Badges last — after phone is visible
        .to('.phone-badge[data-scene="0"]', {
          opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(1.5)',
        }, '-=0.3');

      // Set initial state: all screens use autoAlpha for crossfade (P1)
      screens.forEach((s, i) => {
        gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, display: 'block' });
      });

      // Set initial state: first text visible
      gsap.set(textPanels[0], { opacity: 1, y: 0 });
      for (let i = 1; i < textPanels.length; i++) {
        gsap.set(textPanels[i], { opacity: 0, y: 40 });
      }

      // ── Build timeline with proper easings (P1) ──
      const tl = gsap.timeline();

      for (let i = 1; i < TOTAL; i++) {
        const pos = SCENE_POSITIONS[i];
        const label = `scene${i}`;

        // Phone movement — smooth easing
        tl.to(phone, {
          x: () => pos.x * vw(),
          y: () => pos.y * vh(),
          scale: pos.scale,
          rotateY: pos.rotateY,
          rotateX: pos.rotateX,
          duration: 1,
          ease: 'power2.inOut',
        }, label);

        // Screen crossfade (P1) — smooth instead of instant
        tl.to(screens[i - 1], { autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, label);
        tl.to(screens[i], { autoAlpha: 1, duration: 0.3, ease: 'power1.out' }, `${label}+=0.15`);

        // Text crossfade — overlapping to eliminate dead zone (P0)
        tl.to(textPanels[i - 1], {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: 'power2.in',
        }, label);

        tl.fromTo(textPanels[i],
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          `${label}+=0.3`,
        );
      }

      // Attach to ScrollTrigger
      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: () => `+=${(TOTAL - 1) * vh()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        animation: tl,
        onUpdate: (self) => {
          const progress = self.progress;
          const currentStep = Math.min(Math.floor(progress * TOTAL), TOTAL - 1);

          // Scroll indicator fade
          if (scrollIndicator) {
            scrollIndicator.style.opacity = progress < 0.03 ? '1' : '0';
          }

          // Scroll-linked background animations — every frame
          if (bgLightBand) {
            bgLightBand.style.top = `${10 + progress * 70}%`;
          }
          if (bgLightBand2) {
            bgLightBand2.style.top = `${75 - progress * 55}%`;
          }
          if (bgLightBandV) {
            bgLightBandV.style.left = `${35 + progress * 30}%`;
          }
          if (bgMesh) {
            bgMesh.style.transform = `rotate(${progress * 15}deg) scale(${1 + progress * 0.2})`;
            bgMesh.style.opacity = `${0.012 + Math.sin(progress * Math.PI) * 0.008}`;
          }
          if (bgLightRays) {
            bgLightRays.style.opacity = `${0.015 + Math.sin(progress * Math.PI * 2) * 0.02}`;
          }
          if (bgLightRays2) {
            bgLightRays2.style.opacity = `${0.008 + Math.cos(progress * Math.PI * 2) * 0.012}`;
          }
          if (bgShapes) {
            bgShapes.style.transform = `rotate(${progress * 20}deg)`;
            bgShapes.style.opacity = `${0.7 + Math.sin(progress * Math.PI) * 0.3}`;
          }
          if (bgAurora) {
            bgAurora.style.top = `${25 + progress * 20}%`;
            bgAurora.style.opacity = `${0.02 + Math.sin(progress * Math.PI) * 0.025}`;
          }
          if (bgGridLines) {
            bgGridLines.style.opacity = `${0.006 + Math.sin(progress * Math.PI * 3) * 0.004}`;
          }
          // Particles react to scroll — drift + scale
          bgParticles.forEach((p, i) => {
            const driftY = Math.sin(progress * Math.PI * 2 + i * 0.4) * 12;
            const driftX = Math.cos(progress * Math.PI * 1.5 + i * 0.6) * 6;
            const pScale = 1 + Math.sin(progress * Math.PI + i * 0.3) * 0.3;
            p.style.transform = `translate(${driftX}px, ${driftY}px) scale(${pScale})`;
          });

          if (currentStep !== prevStep) {
            // Animate background per scene — all layers
            const sceneBg = SCENE_BACKGROUNDS[currentStep];
            if (sceneBg) {
              if (bgGradient) {
                gsap.to(bgGradient, { background: sceneBg.gradient, duration: 1.2, ease: 'power1.inOut' });
              }
              if (bgBlob1) {
                gsap.to(bgBlob1, {
                  left: sceneBg.blob1Pos.x, top: sceneBg.blob1Pos.y,
                  scale: sceneBg.blob1Pos.scale, backgroundColor: sceneBg.blob1,
                  duration: 1.4, ease: 'power2.inOut',
                });
              }
              if (bgBlob2) {
                gsap.to(bgBlob2, {
                  left: sceneBg.blob2Pos.x, top: sceneBg.blob2Pos.y,
                  scale: sceneBg.blob2Pos.scale, backgroundColor: sceneBg.blob2,
                  duration: 1.6, ease: 'power2.inOut',
                });
              }
              if (bgBlob3) {
                gsap.to(bgBlob3, {
                  left: sceneBg.blob3Pos.x, top: sceneBg.blob3Pos.y,
                  scale: sceneBg.blob3Pos.scale, backgroundColor: sceneBg.blob3,
                  duration: 1.8, ease: 'power2.inOut',
                });
              }
              // Mesh rotation target per scene
              if (bgMesh) {
                gsap.to(bgMesh, { rotation: sceneBg.meshAngle, duration: 1.5, ease: 'power1.inOut' });
              }
              // Particle opacity shift per scene
              bgParticles.forEach((p) => {
                gsap.to(p, { opacity: sceneBg.particleOpacity, duration: 0.8, ease: 'power1.inOut' });
              });
              // Rays intensity per scene
              if (bgLightRays) {
                gsap.to(bgLightRays, { opacity: sceneBg.raysOpacity, duration: 1, ease: 'power1.inOut' });
              }
            }

            // Phone glow color change
            const glowEl = phone.querySelector('.phone-glow');
            if (glowEl) {
              gsap.to(glowEl, {
                backgroundColor: SCENE_GLOW_COLORS[currentStep],
                duration: 0.8,
                ease: 'power1.inOut',
              });
            }

            // Connector beams — show/hide based on text position
            const connector = SCENE_CONNECTORS[currentStep];
            const beamLeft = phone.querySelector('.connector-beam-left');
            const beamRight = phone.querySelector('.connector-beam-right');
            const dotLeft = phone.querySelector('.connector-dot-left');
            const dotRight = phone.querySelector('.connector-dot-right');

            // Hide all first
            gsap.to([beamLeft, beamRight, dotLeft, dotRight].filter(Boolean), {
              opacity: 0, duration: 0.3, overwrite: true,
            });

            // Show relevant connectors
            if (connector === 'left' || connector === 'both') {
              gsap.to(beamLeft, { opacity: 1, duration: 0.6, delay: 0.3, ease: 'power2.out' });
              gsap.fromTo(dotLeft, { opacity: 0, scale: 0 }, { opacity: 0.6, scale: 1, duration: 0.4, delay: 0.5, ease: 'back.out(2)' });
            }
            if (connector === 'right' || connector === 'both') {
              gsap.to(beamRight, { opacity: 1, duration: 0.6, delay: 0.3, ease: 'power2.out' });
              gsap.fromTo(dotRight, { opacity: 0, scale: 0 }, { opacity: 0.6, scale: 1, duration: 0.4, delay: 0.5, ease: 'back.out(2)' });
            }

            // Floating badges — hide all, show current scene's
            const allBadges = phone.querySelectorAll('.phone-badge');
            gsap.to(allBadges, { opacity: 0, scale: 0.8, duration: 0.2, overwrite: true });

            const sceneBadges = phone.querySelectorAll(`.phone-badge[data-scene="${currentStep}"]`);
            sceneBadges.forEach((badge, idx) => {
              gsap.fromTo(badge,
                { opacity: 0, scale: 0.5, y: 10 },
                { opacity: 1, scale: 1, y: 0, duration: 0.5, delay: 0.3 + idx * 0.15, ease: 'back.out(1.5)' }
              );
            });

            // QR pulse ring (scene 3)
            if (currentStep === 3) {
              const rings = container.querySelectorAll('.qr-pulse-ring');
              rings.forEach((ring, idx) => {
                gsap.fromTo(ring,
                  { scale: 0.9, opacity: 0.5 },
                  { scale: 1.8, opacity: 0, duration: 1.2, delay: idx * 0.3, ease: 'power1.out' }
                );
              });
            }

            // Stagger feature items + highlight corresponding phone screen parts
            const features = textPanels[currentStep]?.querySelectorAll('.feature-item');
            if (features?.length) {
              gsap.fromTo(features,
                { opacity: 0, x: -15 },
                { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', overwrite: true }
              );

              // Show indicator dots on feature items
              const hlDots = textPanels[currentStep]?.querySelectorAll('.hl-dot');
              if (hlDots?.length) {
                gsap.fromTo(hlDots,
                  { opacity: 0, scale: 0 },
                  { opacity: 1, scale: 1, duration: 0.3, stagger: 0.12, delay: 0.3, ease: 'back.out(2)', overwrite: true }
                );
              }
            }

            // Highlight matching elements inside phone screen
            // First reset all highlights
            const allHl = container.querySelectorAll('.ph-hl');
            allHl.forEach((el) => {
              (el as HTMLElement).style.boxShadow = 'none';
              (el as HTMLElement).style.outline = 'none';
            });

            // Then stagger-highlight current scene's elements
            const sceneHls = container.querySelectorAll(`[data-hl^="${currentStep}-"]`);
            sceneHls.forEach((el, idx) => {
              if (!el) return;
              gsap.fromTo(el,
                { boxShadow: 'inset 0 0 0 0px rgba(100,120,200,0)' },
                {
                  boxShadow: 'inset 0 0 0 2px rgba(100,120,200,0.4)',
                  duration: 0.4,
                  delay: 0.4 + idx * 0.15,
                  ease: 'power2.out',
                  yoyo: true,
                  repeat: 1,
                  repeatDelay: 0.8,
                }
              );
              gsap.fromTo(el,
                { scale: 1 },
                {
                  scale: 1.02,
                  duration: 0.3,
                  delay: 0.4 + idx * 0.15,
                  ease: 'power2.out',
                  yoyo: true,
                  repeat: 1,
                  repeatDelay: 0.8,
                }
              );
            });

            // P2: Scene icon bounce
            const sceneIcon = textPanels[currentStep]?.querySelector('.scene-icon');
            if (sceneIcon) {
              gsap.fromTo(sceneIcon,
                { scale: 0, rotation: -15 },
                { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)', overwrite: true }
              );
            }

            // Chart bars (analytics = step 4)
            if (currentStep === 4 && chartBars.length > 0) {
              chartBars.forEach((bar, idx) => {
                gsap.to(bar, {
                  height: '100%',
                  duration: 0.6,
                  delay: idx * 0.08,
                  ease: 'power2.out',
                });
              });
            } else if (currentStep !== 4) {
              chartBars.forEach((bar) => {
                gsap.set(bar, { height: '0%' });
              });
            }

            prevStep = currentStep;
          }
        },
      });

      // P0 FIX: Float on WRAPPER, not phoneRef (avoids conflict with ScrollTrigger y)
      const floatWrapper = phone.querySelector('.phone-float-wrapper');
      if (floatWrapper) {
        gsap.to(floatWrapper, {
          y: 8,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      // Phone glow pulse on wrapper
      const glowEl = phone.querySelector('.phone-glow');
      if (glowEl) {
        gsap.to(glowEl, {
          opacity: 0.5,
          scale: 1.15,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    });

    // =========================================================================
    // MOBILE (< 768px)
    // =========================================================================
    mm.add('(max-width: 767px)', () => {
      const screens = gsap.utils.toArray<HTMLElement>('.phone-screen');
      const sections = gsap.utils.toArray<HTMLElement>('.mobile-section');
      const chartBars = gsap.utils.toArray<HTMLElement>('.chart-bar-fill');

      // Set all screens for autoAlpha
      screens.forEach((s, i) => {
        gsap.set(s, { autoAlpha: i === 0 ? 1 : 0, display: 'block' });
      });

      sections.forEach((section, i) => {
        // P2: Mobile section entrance animations
        const content = section.querySelector('.mobile-content');
        if (content) {
          gsap.from(content, {
            opacity: 0,
            y: 40,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          });
        }

        ScrollTrigger.create({
          trigger: section,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => {
            // Crossfade screens on mobile too
            screens.forEach((s, si) => {
              gsap.to(s, { autoAlpha: si === i ? 1 : 0, duration: 0.3 });
            });
            if (i === 4) {
              chartBars.forEach((bar, idx) => {
                gsap.to(bar, { height: '100%', duration: 0.6, delay: idx * 0.08, ease: 'power2.out' });
              });
            }
          },
          onEnterBack: () => {
            screens.forEach((s, si) => {
              gsap.to(s, { autoAlpha: si === i ? 1 : 0, duration: 0.3 });
            });
          },
        });
      });

      // P2: Fade phone after last section
      const phoneContainer = document.querySelector('.mobile-phone-container');
      if (phoneContainer && sections.length > 0) {
        ScrollTrigger.create({
          trigger: sections[sections.length - 1],
          start: 'bottom 80%',
          end: 'bottom 20%',
          scrub: true,
          onUpdate: (self) => {
            (phoneContainer as HTMLElement).style.opacity = `${1 - self.progress}`;
          },
        });
      }
    });

    return () => mm.revert();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────

  const renderFeatureList = (features: string[], sceneIndex: number) => (
    <div className="space-y-3">
      {features.map((feat, j) => {
        const FI = FEATURE_ICONS[sceneIndex]?.[j] || Check;
        return (
          <div key={j} className="feature-item flex items-center gap-3" data-highlight-idx={`${sceneIndex}-${j}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0 relative">
              <FI className="h-4 w-4 text-primary" />
              {/* Pulsing indicator dot */}
              <div className="hl-dot absolute -right-1 -top-1 w-2 h-2 rounded-full bg-primary opacity-0 transition-opacity">
                <div className="absolute inset-0 rounded-full bg-primary animate-ping" />
              </div>
            </div>
            <span className="text-sm font-medium">{feat}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ================================================================== */}
      {/* DESKTOP LAYOUT                                                     */}
      {/* ================================================================== */}
      <div ref={containerRef} className="hidden md:block relative h-screen overflow-hidden bg-background">
        {/* ============================================================ */}
        {/* Animated background layer                                   */}
        {/* ============================================================ */}
        <div className="absolute inset-0 -z-10 overflow-hidden">

          {/* Layer 1: Dot grid — subtle base texture */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Layer 2: Crosshatch / mesh grid — moves with scroll */}
          <svg className="bg-mesh absolute inset-0 w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mesh" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M60 0L0 60M45 0L0 45M60 15L15 60M30 0L0 30M60 30L30 60" stroke="currentColor" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mesh)" className="text-foreground" />
          </svg>

          {/* Layer 3: Gradient overlay — animated color per scene */}
          <div className="bg-gradient-overlay absolute inset-0" style={{ background: SCENE_BACKGROUNDS[0].gradient }} />

          {/* Layer 4: Primary blobs — GSAP animated per scene */}
          <div
            className="bg-blob-1 absolute w-[600px] h-[600px] rounded-full blur-[100px] will-change-transform"
            style={{
              left: SCENE_BACKGROUNDS[0].blob1Pos.x,
              top: SCENE_BACKGROUNDS[0].blob1Pos.y,
              backgroundColor: SCENE_BACKGROUNDS[0].blob1,
              transform: `translate(-50%, -50%) scale(${SCENE_BACKGROUNDS[0].blob1Pos.scale})`,
            }}
          />
          <div
            className="bg-blob-2 absolute w-[450px] h-[450px] rounded-full blur-[80px] will-change-transform"
            style={{
              left: SCENE_BACKGROUNDS[0].blob2Pos.x,
              top: SCENE_BACKGROUNDS[0].blob2Pos.y,
              backgroundColor: SCENE_BACKGROUNDS[0].blob2,
              transform: `translate(-50%, -50%) scale(${SCENE_BACKGROUNDS[0].blob2Pos.scale})`,
            }}
          />

          {/* Layer 5: Blob 3 — third animated blob */}
          <div
            className="bg-blob-3 absolute w-[350px] h-[350px] rounded-full blur-[90px] will-change-transform"
            style={{
              left: SCENE_BACKGROUNDS[0].blob3Pos.x,
              top: SCENE_BACKGROUNDS[0].blob3Pos.y,
              backgroundColor: SCENE_BACKGROUNDS[0].blob3,
              transform: `translate(-50%, -50%) scale(${SCENE_BACKGROUNDS[0].blob3Pos.scale})`,
            }}
          />

          {/* Layer 6: Ambient floating blobs — always alive, varied speeds */}
          <div className="absolute top-[8%] right-[8%] w-[350px] h-[350px] rounded-full blur-[120px] bg-primary/[0.04] animate-hero-gradient-1" />
          <div className="absolute bottom-[12%] left-[12%] w-[280px] h-[280px] rounded-full blur-[100px] bg-primary/[0.03] animate-hero-gradient-2" />
          <div className="absolute top-[55%] right-[25%] w-[200px] h-[200px] rounded-full blur-[90px] bg-primary/[0.025]" style={{ animation: 'hero-gradient-1 14s ease-in-out infinite reverse' }} />
          <div className="absolute top-[35%] left-[40%] w-[250px] h-[250px] rounded-full blur-[110px] bg-primary/[0.02]" style={{ animation: 'hero-gradient-2 18s ease-in-out infinite' }} />
          <div className="absolute top-[75%] right-[45%] w-[180px] h-[180px] rounded-full blur-[80px] bg-primary/[0.02]" style={{ animation: 'hero-gradient-1 22s ease-in-out infinite' }} />
          <div className="absolute top-[10%] left-[60%] w-[220px] h-[220px] rounded-full blur-[95px] bg-primary/[0.015]" style={{ animation: 'hero-gradient-2 16s ease-in-out infinite reverse' }} />

          {/* Layer 7: Light rays — dual conic gradients, counter-rotating */}
          <div
            className="bg-light-rays absolute w-[130%] h-[130%] -left-[15%] -top-[15%] opacity-[0.02]"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, hsl(var(--foreground)) 20deg, transparent 40deg, transparent 90deg, hsl(var(--foreground)) 110deg, transparent 130deg, transparent 180deg, hsl(var(--foreground)) 200deg, transparent 220deg, transparent 270deg, hsl(var(--foreground)) 290deg, transparent 310deg)',
              animation: 'spin-slow 25s linear infinite',
            }}
          />
          <div
            className="bg-light-rays-2 absolute w-[110%] h-[110%] -left-[5%] -top-[5%] opacity-[0.01]"
            style={{
              background: 'conic-gradient(from 45deg at 50% 50%, transparent 0deg, hsl(var(--foreground)) 15deg, transparent 30deg, transparent 120deg, hsl(var(--foreground)) 135deg, transparent 150deg, transparent 240deg, hsl(var(--foreground)) 255deg, transparent 270deg)',
              animation: 'spin-slow 35s linear infinite reverse',
            }}
          />

          {/* Layer 8: Geometric shapes — mixed animations */}
          <div className="bg-shapes absolute inset-0 pointer-events-none overflow-hidden">
            {/* Rotating rings — different sizes */}
            <div className="absolute top-[20%] left-[8%] w-[120px] h-[120px] rounded-full border border-primary/[0.06]" style={{ animation: 'spin-slow 30s linear infinite' }} />
            <div className="absolute bottom-[25%] right-[10%] w-[80px] h-[80px] rounded-full border border-primary/[0.04]" style={{ animation: 'spin-slow 20s linear infinite reverse' }} />
            <div className="absolute top-[45%] left-[85%] w-[60px] h-[60px] rounded-full border border-primary/[0.035]" style={{ animation: 'spin-slow 28s linear infinite' }} />
            {/* Double ring */}
            <div className="absolute top-[70%] left-[5%]" style={{ animation: 'spin-slow 36s linear infinite reverse' }}>
              <div className="w-[90px] h-[90px] rounded-full border border-primary/[0.04]" />
              <div className="absolute inset-3 rounded-full border border-dashed border-primary/[0.03]" />
            </div>
            {/* Diamonds */}
            <div className="absolute top-[60%] left-[75%] w-[60px] h-[60px] border border-primary/[0.05] rotate-45" style={{ animation: 'spin-slow 35s linear infinite' }} />
            <div className="absolute top-[30%] left-[90%] w-[35px] h-[35px] border border-primary/[0.04] rotate-45" style={{ animation: 'spin-slow 25s linear infinite reverse' }} />
            {/* Crosses */}
            <div className="absolute top-[15%] right-[30%]" style={{ animation: 'spin-slow 40s linear infinite reverse' }}>
              <div className="w-[40px] h-[1px] bg-primary/[0.06]" />
              <div className="w-[1px] h-[40px] bg-primary/[0.06] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="absolute bottom-[35%] left-[50%]" style={{ animation: 'spin-slow 32s linear infinite' }}>
              <div className="w-[25px] h-[1px] bg-primary/[0.04]" />
              <div className="w-[1px] h-[25px] bg-primary/[0.04] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            {/* Dotted arcs */}
            <div className="absolute bottom-[15%] left-[30%] w-[100px] h-[100px] rounded-full border border-dashed border-primary/[0.04]" style={{ animation: 'spin-slow 22s linear infinite' }} />
            <div className="absolute top-[5%] left-[45%] w-[70px] h-[70px] rounded-full border border-dashed border-primary/[0.03]" style={{ animation: 'spin-slow 18s linear infinite reverse' }} />
            {/* Hexagon approximation */}
            <div className="absolute bottom-[8%] right-[35%] w-[50px] h-[50px]" style={{ animation: 'spin-slow 45s linear infinite', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
              <div className="w-full h-full border border-primary/[0.05]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            </div>
            {/* Triangle */}
            <div className="absolute top-[80%] right-[15%] w-0 h-0" style={{ animation: 'spin-slow 38s linear infinite reverse', borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: '35px solid hsl(var(--primary) / 0.04)' }} />
          </div>

          {/* Layer 9: Floating particles — 40 particles, varied shapes */}
          <div className="bg-particles absolute inset-0 pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => {
              const isSquare = i % 7 === 0;
              const isDiamond = i % 11 === 0;
              const size = 2 + (i % 5) * 2;
              return (
                <div
                  key={i}
                  className={`floating-particle absolute ${isSquare ? 'rounded-sm' : isDiamond ? 'rotate-45 rounded-sm' : 'rounded-full'}`}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${2 + (i * 2.47) % 96}%`,
                    top: `${1 + (i * 2.53) % 98}%`,
                    backgroundColor: `hsl(var(--primary) / ${0.04 + (i % 4) * 0.025})`,
                    animation: `float ${8 + (i % 9) * 3}s ease-in-out infinite`,
                    animationDelay: `${-(i * 0.97)}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Layer 10: Horizontal light bands — scroll-linked */}
          <div
            className="bg-light-band absolute left-0 right-0 h-[250px] blur-[80px] opacity-[0.035] bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{ top: '40%' }}
          />
          <div
            className="bg-light-band-2 absolute left-0 right-0 h-[180px] blur-[60px] opacity-[0.02] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            style={{ top: '60%' }}
          />
          {/* Vertical light band */}
          <div
            className="bg-light-band-v absolute top-0 bottom-0 w-[200px] blur-[70px] opacity-[0.02] bg-gradient-to-b from-transparent via-primary/40 to-transparent"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />

          {/* Layer 11: Aurora / gradient wave */}
          <div
            className="bg-aurora absolute w-full h-[40%] top-[30%] opacity-[0.03]"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, hsla(222,60%,50%,0.3) 20%, hsla(270,50%,50%,0.2) 40%, hsla(200,70%,50%,0.3) 60%, hsla(170,60%,40%,0.2) 80%, transparent 100%)',
              filter: 'blur(60px)',
              animation: 'aurora-drift 12s ease-in-out infinite alternate',
            }}
          />

          {/* Layer 12: Grid lines — subtle perspective grid */}
          <svg className="bg-grid-lines absolute inset-0 w-full h-full opacity-[0.008]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gridlines" width="80" height="80" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="80" stroke="currentColor" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="80" y2="0" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridlines)" className="text-foreground" />
          </svg>

          {/* Layer 13: Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.018] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: '128px 128px',
            }}
          />

          {/* Layer 14: Vignette — darkens edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background))_100%)] opacity-40" />
        </div>

        {/* Phone — centered, GSAP moves this container */}
        <div
          ref={phoneRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none overflow-visible"
          style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          aria-hidden="true"
        >
          {/* Glow behind phone — color changes per scene */}
          <div className="phone-glow absolute -inset-8 -z-10 rounded-[4rem] blur-3xl opacity-40" style={{ backgroundColor: SCENE_GLOW_COLORS[0] }} />

          {/* QR pulse rings (scene 3) */}
          <div className="qr-pulse-ring absolute -inset-4 -z-5 rounded-[3rem] border-2 border-primary/40 opacity-0" />
          <div className="qr-pulse-ring absolute -inset-4 -z-5 rounded-[3rem] border-2 border-primary/30 opacity-0" />

          {/* Connector beams — lines from phone to text panels */}
          <svg className="phone-connectors absolute -inset-[200%] w-[500%] h-[500%] pointer-events-none z-[-1]" style={{ left: '-200%', top: '-200%' }}>
            <defs>
              <linearGradient id="beam-gradient-left" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="beam-gradient-right" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Left beam */}
            <line className="connector-beam-left" x1="50%" y1="50%" x2="15%" y2="50%" stroke="url(#beam-gradient-left)" strokeWidth="1" opacity="0" />
            {/* Right beam */}
            <line className="connector-beam-right" x1="50%" y1="50%" x2="85%" y2="50%" stroke="url(#beam-gradient-right)" strokeWidth="1" opacity="0" />
            {/* Connection dots */}
            <circle className="connector-dot-left" cx="15%" cy="50%" r="3" fill="hsl(var(--primary))" opacity="0" />
            <circle className="connector-dot-right" cx="85%" cy="50%" r="3" fill="hsl(var(--primary))" opacity="0" />
          </svg>

          {/* Floating badges around phone — all scenes rendered, toggled by GSAP */}
          <div className="phone-badges absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 30 }}>
            {SCENE_BADGES.map((sceneBadges, sceneIdx) =>
              sceneBadges.map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={`${sceneIdx}-${i}`}
                    data-scene={sceneIdx}
                    className={`phone-badge absolute ${badge.pos} flex items-center gap-2.5 bg-background/95 backdrop-blur-xl rounded-2xl px-5 py-3 border border-border/50 shadow-2xl opacity-0`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge.color} flex-shrink-0`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{badge.text}</span>
                  </div>
                );
              })
            )}
          </div>

          <div className="phone-float-wrapper">
            <PhoneFrame>
              {PHONE_SCREENS.map((Screen, i) => (
                <div
                  key={i}
                  className="phone-screen absolute inset-0"
                  style={{ visibility: i === 0 ? 'visible' : 'hidden', opacity: i === 0 ? 1 : 0 }}
                >
                  <Screen />
                </div>
              ))}
            </PhoneFrame>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Text Panels                                                    */}
        {/* ============================================================== */}

        {/* Scene 0: Hero — L+R flanking center phone */}
        <div className="scene-text absolute inset-0 flex items-center z-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">

            {/* Left side — title + subtitle */}
            <div className="w-[34%] text-left pr-6">
              {/* Badge */}
              <div className="hero-badge mb-6 flex justify-start">
                <span className="inline-flex items-center gap-2.5 rounded-full bg-primary/10 px-5 py-2 text-sm font-medium text-primary border border-primary/20 shadow-sm shadow-primary/5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  {hero.trustedBy}
                </span>
              </div>

              {/* Title — gradient + larger */}
              <h1 className="hero-title text-3xl lg:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                  {hero.title}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="hero-subtitle text-base lg:text-lg text-muted-foreground leading-relaxed">
                {hero.subtitle}
              </p>

              {/* Stats row */}
              <div className="hero-stats mt-6 flex items-center justify-start gap-6">
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-[11px] text-muted-foreground/70">რესტორანი</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">50K+</div>
                  <div className="text-[11px] text-muted-foreground/70">სკანირება</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">4.9</div>
                  <div className="text-[11px] text-muted-foreground/70">რეიტინგი</div>
                </div>
              </div>
            </div>

            {/* Center gap for phone */}
            <div className="w-[26%] flex-shrink-0" />

            {/* Right side — CTA + extras */}
            <div className="w-[34%] pl-6">
              {/* Feature highlights */}
              <div className="hero-features space-y-3 mb-6">
                {[
                  { icon: QrCode, title: 'QR კოდი', desc: 'მომხმარებელი სკანირებს და მენიუ იხსნება' },
                  { icon: Globe, title: 'მულტიენოვანი', desc: 'ქართული, ინგლისური, რუსული' },
                  { icon: Zap, title: 'რეალურ დროში', desc: 'ფასები და პროდუქტები მყისიერად ახლდება' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground/70 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="hero-buttons flex flex-row gap-3">
                <Link href="/register">
                  <Button size="lg" className="gap-2 text-sm group shadow-sm shadow-primary/10 hover:shadow-primary/20 transition-shadow">
                    <Sparkles className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
                    {hero.cta}
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="gap-2 text-sm group">
                    <Play className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                    {hero.secondaryCta}
                  </Button>
                </Link>
              </div>

              {/* Trust line */}
              <div className="hero-trust mt-4 flex items-center gap-4 text-muted-foreground/50">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs">უფასო</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs">ბარათის გარეშე</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs">30 წამში</span>
                </div>
              </div>

              {/* Scroll indicator */}
              <div className="scroll-indicator mt-6 flex items-center gap-2 text-muted-foreground/30 transition-opacity duration-300">
                <Mouse className="h-4 w-4" />
                <span className="text-[11px] uppercase tracking-widest font-medium">გადაახვიეთ</span>
                <ChevronDown className="h-3 w-3 animate-bounce" />
              </div>
            </div>
          </div>
        </div>

        {/* Scene 1: Create — right side (phone is left) */}
        <div className="scene-text absolute inset-0 flex items-center z-10 opacity-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-end">
            <div className="w-[45%] max-w-lg bg-background/70 backdrop-blur-xl rounded-2xl p-8 border border-border/30 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="scene-icon flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileEdit className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary tracking-wide">ნაბიჯი 1/4</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">{scenes.create.title}</h2>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">{scenes.create.description}</p>
              {renderFeatureList(scenes.create.features, 1)}
            </div>
          </div>
        </div>

        {/* Scene 2: Customize — L+R flanking center phone */}
        <div className="scene-text absolute inset-0 flex items-center z-10 opacity-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="w-[34%] pr-4">
              <div className="bg-background/70 backdrop-blur-xl rounded-2xl p-6 border border-border/30 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="scene-icon flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-primary tracking-wide">ნაბიჯი 2/4</span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">{scenes.customize.title}</h2>
                <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">{scenes.customize.description}</p>
              </div>
            </div>
            <div className="w-[26%] flex-shrink-0" />
            <div className="w-[34%] pl-4">
              <div className="bg-background/70 backdrop-blur-xl rounded-2xl p-6 border border-border/30 shadow-lg space-y-3">
                {scenes.customize.features.map((feat, j) => {
                  const FI = FEATURE_ICONS[2]?.[j] || Check;
                  return (
                    <div key={j} className="feature-item flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <FI className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{feat}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Scene 3: Publish — left side (phone is right) */}
        <div className="scene-text absolute inset-0 flex items-center z-10 opacity-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-start">
            <div className="w-[45%] max-w-lg bg-background/70 backdrop-blur-xl rounded-2xl p-8 border border-border/30 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="scene-icon flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary tracking-wide">ნაბიჯი 3/4</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">{scenes.publish.title}</h2>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">{scenes.publish.description}</p>
              {renderFeatureList(scenes.publish.features, 3)}
            </div>
          </div>
        </div>

        {/* Scene 4: Analytics — right side (phone is left) */}
        <div className="scene-text absolute inset-0 flex items-center z-10 opacity-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-end">
            <div className="w-[45%] max-w-lg bg-background/70 backdrop-blur-xl rounded-2xl p-8 border border-border/30 shadow-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="scene-icon flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary tracking-wide">ნაბიჯი 4/4</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">{scenes.analytics.title}</h2>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">{scenes.analytics.description}</p>
              {renderFeatureList(scenes.analytics.features, 4)}
            </div>
          </div>
        </div>

        {/* Scene 5: Pricing — phone left, cards right */}
        <div className="scene-text absolute inset-0 flex items-center z-10 opacity-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex justify-end">
            <div className="w-[58%]">
              <div className="mb-5">
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">{pricing.title}</h2>
                <p className="text-base text-muted-foreground">{pricing.subtitle}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {pricing.plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={cn(
                      'pricing-card p-4 rounded-2xl border transition-all duration-300',
                      'hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl',
                      plan.popular
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 hover:shadow-primary/20'
                        : 'border-border bg-card shadow-sm hover:border-primary/30'
                    )}
                  >
                    {plan.popular && (
                      <span className="inline-block text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium mb-2">
                        პოპულარული
                      </span>
                    )}
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{plan.price}</span>
                      <span className="text-sm font-semibold">{pricing.currency}</span>
                      <span className="text-muted-foreground text-xs">{pricing.perMonth}</span>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {plan.features.slice(0, 3).map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs">
                          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/register" className="block mt-4">
                      <Button
                        className="w-full group"
                        variant={plan.popular ? 'default' : 'outline'}
                        size="sm"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scene 6: CTA — L+R flanking center phone */}
        <div className="scene-text absolute inset-0 flex items-center z-10 opacity-0">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">

            {/* Left side — title + subtitle + social proof */}
            <div className="w-[34%] text-left pr-6">
              <div className="scene-icon inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-5">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
                  {cta.title}
                </span>
              </h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-6">{cta.subtitle}</p>

              {/* Social proof stats */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-[11px] text-muted-foreground/70">რესტორანი</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div>
                  <div className="text-2xl font-bold text-foreground">4.9/5</div>
                  <div className="text-[11px] text-muted-foreground/70">რეიტინგი</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div>
                  <div className="text-2xl font-bold text-foreground">2 წთ</div>
                  <div className="text-[11px] text-muted-foreground/70">გაშვების დრო</div>
                </div>
              </div>
            </div>

            {/* Center gap for phone */}
            <div className="w-[26%] flex-shrink-0" />

            {/* Right side — CTA + benefits */}
            <div className="w-[34%] pl-6">
              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: Sparkles, text: 'უფასო გეგმა სამუდამოდ' },
                  { icon: QrCode, text: 'QR კოდი 30 წამში მზადაა' },
                  { icon: Globe, text: 'ქართული, ინგლისური, რუსული' },
                ].map((item, i) => (
                  <div key={i} className="feature-item flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-row gap-3">
                <Link href="/register">
                  <Button size="lg" className="gap-2 text-sm group shadow-sm shadow-primary/10 hover:shadow-primary/20 transition-shadow">
                    <Sparkles className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
                    {cta.button}
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="gap-2 text-sm group">
                    <Play className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                    დემო
                  </Button>
                </Link>
              </div>

              {/* Trust line */}
              <div className="mt-4 flex items-center gap-4 text-muted-foreground/50">
                <div className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs">{cta.noCard}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================================================================== */}
      {/* MOBILE LAYOUT                                                      */}
      {/* ================================================================== */}
      <div className="md:hidden bg-background">
        {/* Sticky phone */}
        <div className="mobile-phone-container sticky top-[8vh] z-20 flex justify-center py-4 transition-opacity duration-300" aria-hidden="true">
          <MobilePhoneFrame>
            {PHONE_SCREENS.map((Screen, i) => (
              <div
                key={i}
                className="phone-screen absolute inset-0"
                style={{ visibility: i === 0 ? 'visible' : 'hidden', opacity: i === 0 ? 1 : 0 }}
              >
                <Screen />
              </div>
            ))}
          </MobilePhoneFrame>
        </div>

        {/* Mobile sections */}
        {sceneTexts.map((scene, i) => (
          <section key={i} className="mobile-section min-h-[60vh] flex items-center px-6 py-12">
            <div className="mobile-content w-full max-w-lg mx-auto">
              {scene.type === 'hero' && (
                <div className="text-center">
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                      </span>
                      {scene.trustedBy}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-4">{scene.title}</h1>
                  <p className="text-base text-muted-foreground mb-6">{scene.subtitle}</p>
                  <div className="flex flex-col gap-3">
                    <Link href="/register">
                      <Button size="lg" className="gap-2 w-full group">
                        {scene.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/demo">
                      <Button size="lg" variant="outline" className="gap-2 w-full">
                        <Play className="h-4 w-4" /> {scene.secondaryCta}
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {scene.type === 'feature' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      {(() => { const I = SCENE_ICONS[i]; return <I className="h-4 w-4 text-primary" />; })()}
                    </div>
                    <span className="text-xs font-medium text-primary">ნაბიჯი {scene.step}/4</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-3">{scene.title}</h2>
                  <p className="text-base text-muted-foreground mb-6">{scene.description}</p>
                  <div className="space-y-3">
                    {scene.features.map((feat: string, j: number) => {
                      const FI = FEATURE_ICONS[i]?.[j] || Check;
                      return (
                        <div key={j} className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <FI className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm">{feat}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {scene.type === 'pricing' && (
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-3 text-center">{scene.title}</h2>
                  <p className="text-base text-muted-foreground mb-6 text-center">{scene.subtitle}</p>
                  <div className="space-y-3">
                    {scene.plans.map((plan: Plan) => (
                      <div key={plan.name} className={cn(
                        'p-4 rounded-xl border transition-all',
                        plan.popular ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-card'
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{plan.name}</h3>
                            {plan.popular && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">პოპულარული</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xl font-bold">{plan.price}</span>
                            <span className="text-sm font-medium">{scene.currency}</span>
                            <span className="text-muted-foreground text-xs">{scene.perMonth}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {plan.features.slice(0, 3).map((f: string) => (
                            <span key={f} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-primary" /> {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scene.type === 'cta' && (
                <div className="text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight mb-3">{scene.title}</h2>
                  <p className="text-base text-muted-foreground mb-6">{scene.subtitle}</p>
                  <Link href="/register">
                    <Button size="lg" className="gap-2 w-full group shadow-lg shadow-primary/20">
                      {scene.button} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <p className="mt-3 text-sm text-muted-foreground">{scene.noCard}</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
