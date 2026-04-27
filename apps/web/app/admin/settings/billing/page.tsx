import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CreditCard } from 'lucide-react';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/auth/permissions';
import { PlanUsageStrip } from '@/components/admin/dashboard/plan-usage-strip';
import { SettingsPageHeading } from '@/components/admin/settings/settings-page-heading';
import { Button } from '@/components/ui/button';
import { BillingPlanGrid } from '@/components/admin/settings/billing-plan-grid';

// Approximate storage cost per product image (Cloudinary-optimized avg).
const STORAGE_MB_PER_IMAGE = 0.15;

const PLAN_PRICE: Record<string, number> = {
  FREE: 0,
  STARTER: 29,
  PRO: 59,
};

function computeNextBillingDate(): Date {
  const now = new Date();
  const targetDay = 28;
  if (now.getDate() < targetDay) {
    return new Date(now.getFullYear(), now.getMonth(), targetDay);
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, targetDay);
}

function formatNextBillingDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default async function SettingsBillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const plan = session.user.plan;
  const limits = PLAN_LIMITS[plan];

  const [menuCount, categoryCount, productCount, productsWithImages] =
    await Promise.all([
      prisma.menu.count({ where: { userId } }),
      prisma.category.count({ where: { menu: { userId } } }),
      prisma.product.count({ where: { category: { menu: { userId } } } }),
      prisma.product.count({
        where: {
          category: { menu: { userId } },
          imageUrl: { not: null },
        },
      }),
    ]);

  const storageMb = productsWithImages * STORAGE_MB_PER_IMAGE;
  const nextBillingDate = computeNextBillingDate();

  const t = await getTranslations('admin.settings.tabs.billing');
  const tBilling = await getTranslations('admin.settings.billing');
  const tPlan = await getTranslations('admin.settings.plan');
  const locale = 'en'; // Default for date formatting; next-intl server context would give real locale

  const planName = tPlan(plan.toLowerCase() as 'free' | 'starter' | 'pro');
  const planPrice = PLAN_PRICE[plan] ?? 0;
  const menusDisplay = Number.isFinite(limits.maxMenus)
    ? `${menuCount} of ${limits.maxMenus} ${tBilling('menusLabel')}`
    : `${menuCount} ${tBilling('menusLabel')} · ${tBilling('unlimited')}`;
  const itemsDisplay = `${productCount} ${tBilling('itemsLabel')}`;
  const nextInvoice = `${tBilling('nextInvoice')} ${formatNextBillingDate(nextBillingDate, locale)}`;

  return (
    <div data-testid="settings-tab-billing">
      <SettingsPageHeading title={t('title')} subtitle={t('subtitle')} />

      {/* Current plan summary */}
      <div
        data-testid="billing-current-plan-summary"
        data-current-plan={plan}
        className="mb-6 flex flex-col gap-4 rounded-card border border-border bg-[#FCFBF8] p-[18px] sm:flex-row sm:items-center sm:gap-5"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
            {tBilling('currentPlanOverline')}
          </div>
          <div className="text-[17px] font-semibold text-text-default">
            {planName} · {planPrice}₾/{tBilling('perMonthShort')}
          </div>
          <div className="mt-[3px] text-[12.5px] text-text-muted">
            {menusDisplay} · {itemsDisplay} · {nextInvoice}
          </div>
        </div>

        <div className="hidden h-[42px] w-px bg-border sm:block" />

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[11.5px] font-bold uppercase tracking-[0.6px] text-text-subtle">
            {tBilling('scansOverline')}
          </div>
          <div className="text-[17px] font-semibold tabular-nums text-text-default">
            — <span className="text-[12px] font-normal text-text-muted">· {tBilling('unlimited')}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-[2px] bg-border">
            <div className="h-full w-[20%] rounded-[2px] bg-chip" />
          </div>
        </div>
      </div>

      {/* Usage strip (T11.4 reuse) */}
      <div className="mb-6">
        <PlanUsageStrip
          plan={plan}
          counts={{
            menus: menuCount,
            menusLimit: limits.maxMenus,
            categories: categoryCount,
            categoriesLimit: limits.maxCategories,
            products: productCount,
            productsLimit: limits.maxProducts,
            storageMb,
          }}
        />
      </div>

      {/* Plan comparison */}
      <section className="mb-6">
        <h3 className="mb-3.5 text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
          {tBilling('plansSectionTitle')}
        </h3>
        <BillingPlanGrid currentPlan={plan} />
      </section>

      {/* Payment method */}
      <section>
        <h3 className="mb-3.5 text-[11.5px] font-semibold uppercase tracking-[0.5px] text-text-default">
          {tBilling('paymentMethodTitle')}
        </h3>
        <div
          data-testid="billing-payment-method"
          className="flex items-center gap-3 rounded-[10px] border border-dashed border-border bg-card p-4"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[6px] border border-border bg-chip">
            <CreditCard className="h-4 w-4 text-text-subtle" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-text-muted">
              {tBilling('noPaymentMethod')}
            </div>
          </div>
          <Button size="sm" variant="secondary" disabled data-testid="billing-add-card">
            {tBilling('addCard')}
          </Button>
        </div>
      </section>
    </div>
  );
}
