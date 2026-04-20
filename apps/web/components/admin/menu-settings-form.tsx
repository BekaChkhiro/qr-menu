'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  ChevronDown,
  Palette,
  Type,
  Languages as LanguagesIcon,
  SlidersHorizontal,
  LayoutGrid,
  MapPin,
  Phone,
  Wifi,
  DoorClosed,
  Image as ImageIcon,
  Rows3,
  Grid2x2,
  Eye,
  EyeOff,
  Flame,
  Tag,
  AlertTriangle,
  MousePointerClick,
  Save,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/admin/image-upload';
import { useUpdateMenu } from '@/hooks/use-menus';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type {
  Menu,
  MenuWithDetails,
  Language,
  AllergenDisplay,
  CaloriesDisplay,
  MenuLayout,
  MenuTemplate,
  ProductCardStyle,
  ProductTouchEffect,
} from '@/types/menu';

// ── Font presets ───────────────────────────────
const FONT_PRESETS = [
  { id: 'default', label: 'Default', sub: 'Noto Sans Georgian', heading: 'Noto Sans Georgian', body: 'Noto Sans Georgian' },
  { id: 'modern', label: 'Modern', sub: 'Inter / System', heading: 'Inter', body: 'Inter' },
  { id: 'classic', label: 'Classic', sub: 'Playfair + Lora', heading: 'Playfair Display', body: 'Lora' },
  { id: 'georgian', label: 'Georgian Serif', sub: 'BPG Arial', heading: 'BPG Arial', body: 'BPG Arial' },
];

const settingsSchema = z.object({
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color').optional().or(z.literal('')),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color').optional().or(z.literal('')),
  currencySymbol: z.string().max(5).optional(),

  fontPreset: z.string(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),

  enabledLanguages: z.array(z.enum(['KA', 'EN', 'RU'])).min(1),

  allergenDisplay: z.enum(['TEXT', 'ICON', 'WARNING']),
  caloriesDisplay: z.enum(['DIRECT', 'FLIP_REVEAL', 'HIDDEN']),
  showNutrition: z.boolean(),
  showDiscount: z.boolean(),

  splitByType: z.boolean(),
  menuLayout: z.enum(['LINEAR', 'CATEGORIES_FIRST']),
  menuTemplate: z.enum(['CLASSIC', 'MAGAZINE', 'COMPACT']),
  productCardStyle: z.enum(['FLAT', 'BORDERED', 'ELEVATED', 'MINIMAL']),
  productTouchEffect: z.enum(['NONE', 'SCALE', 'GLOW', 'GRADIENT']),

  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  wifiSsid: z.string().max(100).optional(),
  wifiPassword: z.string().max(100).optional(),
  wcDirection: z.string().max(500).optional(),
  wcImageUrl: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface MenuSettingsFormProps {
  menu: Menu | MenuWithDetails;
}

export function MenuSettingsForm({ menu }: MenuSettingsFormProps) {
  const [openSection, setOpenSection] = useState<string | null>('layout');
  const updateMenu = useUpdateMenu(menu.id);

  const matchedPreset =
    FONT_PRESETS.find(
      (p) => p.heading === menu.headingFont && p.body === menu.bodyFont
    )?.id || 'custom';

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      logoUrl: menu.logoUrl || '',
      primaryColor: menu.primaryColor || '#000000',
      accentColor: menu.accentColor || '#f59e0b',
      currencySymbol: menu.currencySymbol || '₾',

      fontPreset: matchedPreset,
      headingFont: menu.headingFont || 'Noto Sans Georgian',
      bodyFont: menu.bodyFont || 'Noto Sans Georgian',

      enabledLanguages: menu.enabledLanguages?.length ? menu.enabledLanguages : ['KA'],

      allergenDisplay: menu.allergenDisplay || 'TEXT',
      caloriesDisplay: menu.caloriesDisplay || 'DIRECT',
      showNutrition: menu.showNutrition ?? false,
      showDiscount: menu.showDiscount ?? true,

      splitByType: menu.splitByType ?? false,
      menuLayout: menu.menuLayout || 'LINEAR',
      menuTemplate: menu.menuTemplate || 'CLASSIC',
      productCardStyle: menu.productCardStyle || 'BORDERED',
      productTouchEffect: menu.productTouchEffect || 'SCALE',

      address: menu.address || '',
      phone: menu.phone || '',
      wifiSsid: menu.wifiSsid || '',
      wifiPassword: menu.wifiPassword || '',
      wcDirection: menu.wcDirection || '',
      wcImageUrl: menu.wcImageUrl || '',
    },
  });

  const handleSubmit = async (data: SettingsFormValues) => {
    const preset = FONT_PRESETS.find((p) => p.id === data.fontPreset);
    const headingFont = preset ? preset.heading : data.headingFont;
    const bodyFont = preset ? preset.body : data.bodyFont;

    try {
      await updateMenu.mutateAsync({
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || null,
        accentColor: data.accentColor || null,
        currencySymbol: data.currencySymbol || null,
        headingFont: headingFont || null,
        bodyFont: bodyFont || null,
        enabledLanguages: data.enabledLanguages as Language[],
        allergenDisplay: data.allergenDisplay as AllergenDisplay,
        caloriesDisplay: data.caloriesDisplay as CaloriesDisplay,
        showNutrition: data.showNutrition,
        showDiscount: data.showDiscount,
        splitByType: data.splitByType,
        menuLayout: data.menuLayout as MenuLayout,
        menuTemplate: data.menuTemplate as MenuTemplate,
        productCardStyle: data.productCardStyle as ProductCardStyle,
        productTouchEffect: data.productTouchEffect as ProductTouchEffect,
        address: data.address || null,
        phone: data.phone || null,
        wifiSsid: data.wifiSsid || null,
        wifiPassword: data.wifiPassword || null,
        wcDirection: data.wcDirection || null,
        wcImageUrl: data.wcImageUrl || null,
      });
      toast.success('Settings saved', { icon: <Check className="h-4 w-4" /> });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    }
  };

  const toggleSection = (id: string) =>
    setOpenSection((prev) => (prev === id ? null : id));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        {/* ── Layout & Style (featured at top) ───────────────────────── */}
        <SettingsSection
          id="layout"
          icon={LayoutGrid}
          title="Layout & Style"
          subtitle="მენიუს ვიზუალური სტრუქტურა"
          open={openSection === 'layout'}
          onToggle={() => toggleSection('layout')}
        >
          {/* Template picker */}
          <FormField
            control={form.control}
            name="menuTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">Template</FormLabel>
                <FormDescription>
                  პროდუქტის ბარათის სტრუქტურა — გადახედე phone preview-ში
                </FormDescription>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    {
                      id: 'CLASSIC',
                      label: 'Classic',
                      desc: 'Horizontal cards',
                      preview: (
                        <div className="flex items-center gap-1.5 p-1.5">
                          <div className="h-6 w-6 shrink-0 rounded bg-muted-foreground/25" />
                          <div className="flex-1 space-y-1">
                            <div className="h-1.5 w-2/3 rounded bg-muted-foreground/60" />
                            <div className="h-1 w-1/2 rounded bg-muted-foreground/30" />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: 'MAGAZINE',
                      label: 'Magazine',
                      desc: 'Large hero images',
                      preview: (
                        <div className="space-y-1 p-1">
                          <div className="h-5 w-full rounded bg-muted-foreground/35" />
                          <div className="h-1.5 w-3/4 rounded bg-muted-foreground/60" />
                          <div className="h-1 w-1/3 rounded bg-muted-foreground/30" />
                        </div>
                      ),
                    },
                    {
                      id: 'COMPACT',
                      label: 'Compact',
                      desc: 'Dense list',
                      preview: (
                        <div className="space-y-1 p-1.5">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between gap-1">
                              <div className="h-1 w-1/2 rounded bg-muted-foreground/60" />
                              <div className="h-2 w-2 shrink-0 rounded bg-muted-foreground/30" />
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ].map((tpl) => {
                    const active = field.value === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => field.onChange(tpl.id)}
                        className={cn(
                          'group relative rounded-lg border p-2.5 text-left transition-all',
                          active
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-accent/30'
                        )}
                      >
                        {active && (
                          <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        <div className="mb-1.5 h-16 overflow-hidden rounded bg-card ring-1 ring-border/80">
                          {tpl.preview}
                        </div>
                        <div className="text-xs font-semibold">{tpl.label}</div>
                        <div className="text-[10px] text-muted-foreground">{tpl.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Divider />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="menuLayout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <Rows3 className="h-3.5 w-3.5 text-muted-foreground" />
                    Layout
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LINEAR">Linear (ჩვეულებრივი)</SelectItem>
                      <SelectItem value="CATEGORIES_FIRST">Categories First</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    CATEGORIES_FIRST-ით იწყება კატეგორიების icon grid-ით
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productCardStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <Grid2x2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Card style
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BORDERED">Bordered</SelectItem>
                      <SelectItem value="ELEVATED">Elevated · shadow</SelectItem>
                      <SelectItem value="FLAT">Flat</SelectItem>
                      <SelectItem value="MINIMAL">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productTouchEffect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                    Touch effect
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SCALE">Scale</SelectItem>
                      <SelectItem value="GLOW">Glow</SelectItem>
                      <SelectItem value="GRADIENT">Gradient</SelectItem>
                      <SelectItem value="NONE">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="splitByType"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-muted/20 p-3">
                  <div className="min-w-0 pr-3">
                    <FormLabel className="text-sm">Foods / Drinks split</FormLabel>
                    <FormDescription className="text-xs">
                      ზედა zolis 2 tab
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        {/* ── Branding ─────────────────────────────────────────────── */}
        <SettingsSection
          id="branding"
          icon={Palette}
          title="Branding"
          subtitle="ლოგო, ფერები, ვალუტა"
          open={openSection === 'branding'}
          onToggle={() => toggleSection('branding')}
        >
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-sm">
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Logo
                </FormLabel>
                <FormControl>
                  <div className="w-32 sm:w-36">
                    <ImageUpload
                      value={field.value || null}
                      onChange={(url) => field.onChange(url || '')}
                      preset="logo"
                      aspectRatio="square"
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  კვადრატული ფორმატი · რეკომენდ. 200×200
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Primary color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={field.value || '#000000'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-9 w-11 cursor-pointer rounded border shrink-0"
                      />
                      <Input {...field} value={field.value || ''} placeholder="#000000" className="font-mono text-xs" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Accent color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={field.value || '#f59e0b'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-9 w-11 cursor-pointer rounded border shrink-0"
                      />
                      <Input {...field} value={field.value || ''} placeholder="#f59e0b" className="font-mono text-xs" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currencySymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || '₾'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="₾">₾ &nbsp;GEL — ლარი</SelectItem>
                      <SelectItem value="$">$ &nbsp;USD</SelectItem>
                      <SelectItem value="€">€ &nbsp;EUR</SelectItem>
                      <SelectItem value="£">£ &nbsp;GBP</SelectItem>
                      <SelectItem value="₽">₽ &nbsp;RUB</SelectItem>
                      <SelectItem value="₺">₺ &nbsp;TRY</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        {/* ── Typography ──────────────────────────────────────────── */}
        <SettingsSection
          id="typography"
          icon={Type}
          title="Typography"
          subtitle="ფონტის არჩევა"
          open={openSection === 'typography'}
          onToggle={() => toggleSection('typography')}
        >
          <FormField
            control={form.control}
            name="fontPreset"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Preset</FormLabel>
                <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                  {FONT_PRESETS.map((p) => {
                    const active = field.value === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => field.onChange(p.id)}
                        className={cn(
                          'relative rounded-lg border p-3 text-left transition-all',
                          active
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-accent/30'
                        )}
                        style={{ fontFamily: p.heading }}
                      >
                        {active && (
                          <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        <div className="text-base font-semibold leading-none">Aa</div>
                        <div className="mt-1.5 text-xs font-semibold">{p.label}</div>
                        <div className="text-[10px] text-muted-foreground">{p.sub}</div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => field.onChange('custom')}
                    className={cn(
                      'relative rounded-lg border border-dashed p-3 text-left transition-all',
                      field.value === 'custom'
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    {field.value === 'custom' && (
                      <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="text-base font-semibold leading-none text-muted-foreground">+</div>
                    <div className="mt-1.5 text-xs font-semibold">Custom</div>
                    <div className="text-[10px] text-muted-foreground">ხელით მითითება</div>
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.watch('fontPreset') === 'custom' && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/20 p-3">
              <FormField
                control={form.control}
                name="headingFont"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Heading font</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Inter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bodyFont"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Body font</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Inter" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </SettingsSection>

        {/* ── Languages ──────────────────────────────────────────── */}
        <SettingsSection
          id="languages"
          icon={LanguagesIcon}
          title="Languages"
          subtitle="მენიუს ხელმისაწვდომი ენები"
          open={openSection === 'languages'}
          onToggle={() => toggleSection('languages')}
        >
          <FormField
            control={form.control}
            name="enabledLanguages"
            render={() => (
              <FormItem>
                <FormDescription>
                  ქართული (KA) სავალდებულოა. სხვა ენების მონიშვნის შემთხვევაში, მომხმარებელს ექნება language switcher.
                </FormDescription>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    { value: 'KA' as const, label: 'ქართული', code: 'KA', locked: true },
                    { value: 'EN' as const, label: 'English', code: 'EN' },
                    { value: 'RU' as const, label: 'Русский', code: 'RU' },
                  ].map((lang) => (
                    <FormField
                      key={lang.value}
                      control={form.control}
                      name="enabledLanguages"
                      render={({ field }) => {
                        const active = field.value?.includes(lang.value);
                        return (
                          <button
                            type="button"
                            disabled={lang.locked}
                            onClick={() => {
                              if (lang.locked) return;
                              field.onChange(
                                active
                                  ? field.value?.filter((v) => v !== lang.value)
                                  : [...(field.value || []), lang.value]
                              );
                            }}
                            className={cn(
                              'relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                              active
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                : 'border-border hover:border-primary/40',
                              lang.locked && 'cursor-not-allowed opacity-80'
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold tracking-wider',
                                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {lang.code}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{lang.label}</div>
                              {lang.locked && (
                                <div className="text-[10px] text-muted-foreground">required</div>
                              )}
                            </div>
                            {active && !lang.locked && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>

        {/* ── Display settings ───────────────────────────────────── */}
        <SettingsSection
          id="display"
          icon={SlidersHorizontal}
          title="Display"
          subtitle="ალერგენები, კალორიები, ფასდაკლება"
          open={openSection === 'display'}
          onToggle={() => toggleSection('display')}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="allergenDisplay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                    Allergen display
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TEXT">
                        <IconOption icon={Tag}>Text label</IconOption>
                      </SelectItem>
                      <SelectItem value="ICON">
                        <IconOption icon={ImageIcon}>Icon only</IconOption>
                      </SelectItem>
                      <SelectItem value="WARNING">
                        <IconOption icon={AlertTriangle}>Warning (A!)</IconOption>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caloriesDisplay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <Flame className="h-3.5 w-3.5 text-muted-foreground" />
                    Calories display
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DIRECT">
                        <IconOption icon={Eye}>Direct</IconOption>
                      </SelectItem>
                      <SelectItem value="FLIP_REVEAL">
                        <IconOption icon={EyeOff}>Flip reveal</IconOption>
                      </SelectItem>
                      <SelectItem value="HIDDEN">
                        <IconOption icon={EyeOff}>Hidden</IconOption>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="showNutrition"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-muted/20 p-3">
                  <div className="min-w-0 pr-3">
                    <FormLabel className="text-sm">Nutrition details</FormLabel>
                    <FormDescription className="text-xs">
                      Protein · Fats · Carbs · Fiber
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="showDiscount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-muted/20 p-3">
                  <div className="min-w-0 pr-3">
                    <FormLabel className="text-sm">Discount prices</FormLabel>
                    <FormDescription className="text-xs">
                      ძველი ფასი crossed-out
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </SettingsSection>

        {/* ── Header info ─────────────────────────────────────────── */}
        <SettingsSection
          id="header"
          icon={MapPin}
          title="Location & Contact"
          subtitle="მისამართი, Wi-Fi, ტელეფონი, ტუალეტის ინსტრუქცია"
          open={openSection === 'header'}
          onToggle={() => toggleSection('header')}
        >
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Address
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="რუსთაველის გამზირი 12, თბილისი"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+995 555 12 34 56" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wifiSsid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 text-sm">
                    <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                    Wi-Fi SSID
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="CafeGuest" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wifiPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Wi-Fi password</FormLabel>
                  <FormControl>
                    <Input placeholder="******" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="wcDirection"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 text-sm">
                  <DoorClosed className="h-3.5 w-3.5 text-muted-foreground" />
                  Restroom directions
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="გაიარე მარცხნივ, კორიდორის ბოლოს"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  გამოჩნდება WC ღილაკის modal-ში
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="wcImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Restroom photo (optional)</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value || null}
                    onChange={(url) => field.onChange(url || '')}
                    preset="promotion"
                    aspectRatio="wide"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>

        {/* ── Sticky save bar ─── */}
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-b-lg">
          <p className="hidden text-xs text-muted-foreground sm:block">
            ცვლილებები მიიღება მყისიერად menu-ს publish-ის შემდეგ
          </p>
          <Button type="submit" disabled={updateMenu.isPending} className="ml-auto">
            {updateMenu.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save settings
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ── Helpers ────────────────────────────────────────────────────────
interface SectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SettingsSection({
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: SectionProps) {
  return (
    <Collapsible open={open} onOpenChange={onToggle}>
      <div
        className={cn(
          'rounded-xl border transition-colors',
          open ? 'border-primary/20 bg-card' : 'border-border bg-card'
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
              !open && 'hover:bg-muted/40'
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                open ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              {subtitle && (
                <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
              )}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 border-t px-4 py-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function Divider() {
  return <div className="border-t" />;
}

function IconOption({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{children}</span>
    </span>
  );
}
