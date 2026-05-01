'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { toast } from '@/components/ui/toast';
import { Box } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useUpdateProduct } from '@/hooks/use-products';
import { ArModelField } from './product-drawer/ar-model-field';
import type { Product } from '@/types/menu';

// model-viewer registers a custom element on import — keep it client-only and
// lazy so SSR + initial admin bundle stay clean.
const ModelViewer = dynamic(
  () =>
    import('./product-drawer/model-viewer').then((mod) => ({
      default: mod.ModelViewer,
    })),
  { ssr: false },
);

interface ProductDrawerArTabProps {
  menuId: string;
  product: Product;
}

export function ProductDrawerArTab({ menuId, product }: ProductDrawerArTabProps) {
  const t = useTranslations('admin.products.drawer.arTab');
  const updateProduct = useUpdateProduct(menuId, product.id);

  const handleToggleEnabled = async (enabled: boolean) => {
    try {
      await updateProduct.mutateAsync({ arEnabled: enabled });
    } catch {
      toast.error(t('toast.saveError'));
    }
  };

  const handleGlbChange = async (url: string | null) => {
    try {
      await updateProduct.mutateAsync({ arModelUrl: url });
      if (url) toast.success(t('toast.uploadSuccess'));
    } catch {
      toast.error(t('toast.saveError'));
    }
  };

  const handleUsdzChange = async (url: string | null) => {
    try {
      await updateProduct.mutateAsync({ arModelUrlIos: url });
      if (url) toast.success(t('toast.uploadSuccess'));
    } catch {
      toast.error(t('toast.saveError'));
    }
  };

  const hasGlb = !!product.arModelUrl;
  const enabled = product.arEnabled;

  return (
    <div data-testid="product-drawer-ar">
      <p className="mb-[18px] text-[12.5px] leading-[1.55] text-text-muted">
        {t('intro')}
      </p>

      {/* ── Enable toggle ─────────────────────────────────────────────── */}
      <div
        className="mb-[18px] flex items-center gap-3 rounded-[10px] border border-border bg-card p-3.5"
        data-testid="product-drawer-ar-enable"
        data-enabled={enabled ? 'true' : 'false'}
      >
        <Switch
          checked={enabled}
          onCheckedChange={handleToggleEnabled}
          disabled={updateProduct.isPending || !hasGlb}
          data-testid="product-drawer-ar-enable-toggle"
          aria-label={t('enableLabel')}
        />
        <div className="flex-1">
          <div className="text-[13px] font-[550] text-text-default">
            {t('enableLabel')}
          </div>
          <div className="text-[11.5px] text-text-muted">{t('enableHelp')}</div>
        </div>
      </div>

      {/* ── GLB drop-zone ─────────────────────────────────────────────── */}
      <div className="mb-[14px]">
        <ArModelField
          value={product.arModelUrl}
          onChange={handleGlbChange}
          kind="glb"
          label={t('glb.label')}
          badge={t('glb.required')}
          hint={t('glb.hint')}
          uploadCta={t('glb.uploadCta')}
          replaceCta={t('glb.replaceCta')}
          removeCta={t('glb.removeCta')}
          disabled={updateProduct.isPending}
          testIdPrefix="product-drawer-ar-glb"
        />
      </div>

      {/* ── USDZ drop-zone ────────────────────────────────────────────── */}
      <div className="mb-[18px]">
        <ArModelField
          value={product.arModelUrlIos}
          onChange={handleUsdzChange}
          kind="usdz"
          label={t('usdz.label')}
          badge={t('usdz.optional')}
          hint={t('usdz.hint')}
          uploadCta={t('usdz.uploadCta')}
          replaceCta={t('usdz.replaceCta')}
          removeCta={t('usdz.removeCta')}
          disabled={updateProduct.isPending}
          testIdPrefix="product-drawer-ar-usdz"
        />
      </div>

      {/* ── Live preview ──────────────────────────────────────────────── */}
      <div data-testid="product-drawer-ar-preview-section">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-[0.1px] text-text-default">
            {t('preview.label')}
          </span>
        </div>

        {hasGlb && enabled ? (
          <div
            className="overflow-hidden rounded-[10px] border border-border bg-[radial-gradient(circle_at_center,_#FAF7F1_0%,_#EDE7DA_100%)]"
            data-testid="product-drawer-ar-preview"
            data-state="active"
          >
            <ModelViewer
              src={product.arModelUrl as string}
              iosSrc={product.arModelUrlIos}
              alt={product.nameKa}
              poster={product.arPosterUrl}
              loadingLabel={t('preview.loading')}
              className="h-[260px] w-full"
              style={{ height: 260, width: '100%' }}
            />
          </div>
        ) : (
          <div
            className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-bg/40 text-text-muted"
            data-testid="product-drawer-ar-preview"
            data-state="empty"
          >
            <Box className="h-6 w-6 text-text-subtle" strokeWidth={1.5} />
            <span className="text-[12.5px]">{t('preview.empty')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
