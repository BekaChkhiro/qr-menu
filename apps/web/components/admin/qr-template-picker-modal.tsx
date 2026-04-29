'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Menu, MenuWithDetails, QrStyle } from '@/types/menu';

// ── Source: qr-menu-design/components/qr-page.jsx (Section F — QR templates) ──

type TemplateKind = 'tent-A4' | 'poster-A3' | 'tent-min' | 'receipt' | 'decal' | 'booklet';
type FilterKind = 'all' | 'tent' | 'poster' | 'receipt' | 'decal' | 'booklet';

interface TemplateItem {
  kind: TemplateKind;
  nameKey: string;
  dimensionsKey: string;
  filter: Exclude<FilterKind, 'all'>;
}

const TEMPLATES: TemplateItem[] = [
  { kind: 'tent-A4', nameKey: 'tentA4', dimensionsKey: 'tentA4Dim', filter: 'tent' },
  { kind: 'poster-A3', nameKey: 'posterA3', dimensionsKey: 'posterA3Dim', filter: 'poster' },
  { kind: 'tent-min', nameKey: 'tentMin', dimensionsKey: 'tentMinDim', filter: 'tent' },
  { kind: 'receipt', nameKey: 'receipt', dimensionsKey: 'receiptDim', filter: 'receipt' },
  { kind: 'decal', nameKey: 'decal', dimensionsKey: 'decalDim', filter: 'decal' },
  { kind: 'booklet', nameKey: 'booklet', dimensionsKey: 'bookletDim', filter: 'booklet' },
];

const FILTERS: FilterKind[] = ['all', 'tent', 'poster', 'receipt', 'decal', 'booklet'];

interface QrTemplatePickerModalProps {
  menu: Menu | MenuWithDetails;
  sizeMode: 'S' | 'M' | 'L';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrTemplatePickerModal({
  menu,
  sizeMode,
  open,
  onOpenChange,
}: QrTemplatePickerModalProps) {
  const t = useTranslations('admin.editor.qr.templates');
  const [activeFilter, setActiveFilter] = useState<FilterKind>('all');
  const [selectedKind, setSelectedKind] = useState<TemplateKind | null>(null);

  const filteredTemplates = useMemo(() => {
    if (activeFilter === 'all') return TEMPLATES;
    return TEMPLATES.filter((t) => t.filter === activeFilter);
  }, [activeFilter]);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.kind === selectedKind) || null,
    [selectedKind],
  );

  const handleDownload = () => {
    if (!selectedTemplate) return;

    const params = new URLSearchParams({
      format: 'pdf',
      download: 'true',
      size:
        sizeMode === 'S' ? 'small' : sizeMode === 'M' ? 'medium' : 'large',
      style: (menu.qrStyle ?? 'SQUARE') as QrStyle,
      fg: menu.qrForegroundColor ?? '#18181B',
      bg: menu.qrBackgroundColor ?? 'transparent',
      logo: 'menu',
      template: selectedTemplate.kind,
    });

    const url = `/api/qr/${menu.id}?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-[880px] gap-0 overflow-hidden p-0"
        style={{ height: 600 }}
        data-testid="qr-template-picker-modal"
      >
        {/* ═════════════════ Header ═════════════════ */}
        <div className="flex items-start justify-between border-b border-border-soft px-[22px] py-[18px]">
          <div>
            <h2 className="text-[17px] font-semibold leading-tight tracking-[-0.3px] text-text-default">
              {t('title')}
            </h2>
            <p className="mt-1 text-[12.5px] text-text-muted">
              {t('subtitle')}
            </p>
          </div>
          <DialogClose
            className={cn(
              'rounded-sm p-1 text-text-muted transition-colors',
              'hover:bg-chip hover:text-text-default',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            )}
            data-testid="qr-template-picker-close"
          >
            <X size={19} strokeWidth={1.5} />
            <span className="sr-only">{t('close')}</span>
          </DialogClose>
        </div>

        {/* ═════════════════ Filter pills ═════════════════ */}
        <div className="flex gap-[6px] border-b border-border-soft px-[22px] py-3">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              data-testid={`qr-template-filter-${filter}`}
              data-active={activeFilter === filter}
              className={cn(
                'rounded-[6px] border px-[10px] py-[5px] text-[12px] font-[550] transition-colors',
                activeFilter === filter
                  ? 'border-text-default bg-text-default text-white'
                  : 'border-border bg-white text-text-muted hover:border-border-soft hover:text-text-default',
              )}
            >
              {t(`filters.${filter}`)}
            </button>
          ))}
        </div>

        {/* ═════════════════ Template grid ═════════════════ */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-3.5">
            {filteredTemplates.map((template) => {
              const isSelected = selectedKind === template.kind;
              return (
                <button
                  key={template.kind}
                  type="button"
                  onClick={() => setSelectedKind(template.kind)}
                  data-testid={`qr-template-card-${template.kind}`}
                  data-selected={isSelected}
                  className={cn(
                    'group flex flex-col overflow-hidden rounded-[10px] border bg-white text-left transition-all',
                    isSelected
                      ? 'border-accent shadow-[0_0_0_3px_hsl(var(--accent-soft))]'
                      : 'border-border hover:border-border-soft hover:shadow-sm',
                  )}
                >
                  {/* Preview area */}
                  <div className="relative flex aspect-[4/3] items-center justify-center bg-[#FCFBF8]">
                    <TemplatePreview kind={template.kind} />
                  </div>

                  {/* Info area */}
                  <div className="border-t border-border-soft px-3 py-[10px]">
                    <div className="text-[12.5px] font-semibold text-text-default">
                      {t(`items.${template.nameKey}`)}
                    </div>
                    <div className="mt-[2px] font-mono text-[10.5px] text-text-muted">
                      {t(`items.${template.dimensionsKey}`)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═════════════════ Footer ═════════════════ */}
        <div className="flex items-center justify-between border-t border-border-soft bg-bg px-[22px] py-3.5">
          <div className="text-[12px] text-text-muted">
            {selectedTemplate ? (
              <span>
                <span className="font-semibold text-text-default">
                  1 {t('selectionCount')}
                </span>{' '}
                · {t(`items.${selectedTemplate.nameKey}`)} (
                {t(`items.${selectedTemplate.dimensionsKey}`)})
              </span>
            ) : (
              <span>{t('selectionEmpty')}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border bg-white px-3 text-[12.5px] text-text-default hover:bg-bg"
                data-testid="qr-template-picker-close-btn"
              >
                {t('close')}
              </Button>
            </DialogClose>
            <Button
              variant="default"
              size="sm"
              className="flex h-8 items-center gap-1.5 bg-text-default px-3 text-[12.5px] text-white hover:bg-text-default/90 disabled:opacity-50"
              disabled={!selectedTemplate}
              onClick={handleDownload}
              data-testid="qr-template-picker-download"
            >
              <Download size={14} strokeWidth={1.5} />
              {t('download')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── SVG previews ───────────────────────────────────────────────────────────

function TemplatePreview({ kind }: { kind: TemplateKind }) {
  switch (kind) {
    case 'tent-A4':
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path
            d="M10 70 L40 15 L70 70 Z"
            fill="white"
            stroke="#EAEAE6"
            strokeWidth="2"
          />
          <path d="M15 68 L40 20 L65 68 Z" fill="#F4F3EE" />
          <rect x="32" y="38" width="16" height="16" rx="2" fill="#18181B" />
          <rect x="35" y="41" width="4" height="4" fill="white" />
          <rect x="41" y="41" width="4" height="4" fill="white" />
          <rect x="35" y="47" width="4" height="4" fill="white" />
          <rect x="41" y="47" width="4" height="4" fill="white" />
          <text x="40" y="62" textAnchor="middle" fontSize="6" fill="#71717A">
            MENU
          </text>
        </svg>
      );
    case 'poster-A3':
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="8" y="8" width="64" height="64" rx="3" fill="white" stroke="#EAEAE6" strokeWidth="1.5" />
          <text x="40" y="28" textAnchor="middle" fontSize="7" fontWeight="600" fill="#18181B">
            SCAN TO ORDER
          </text>
          <rect x="30" y="36" width="20" height="20" rx="2" fill="#18181B" />
          <rect x="33" y="39" width="4" height="4" fill="white" />
          <rect x="39" y="39" width="4" height="4" fill="white" />
          <rect x="33" y="45" width="4" height="4" fill="white" />
          <rect x="43" y="45" width="4" height="4" fill="white" />
          <rect x="39" y="49" width="4" height="4" fill="white" />
          <text x="40" y="66" textAnchor="middle" fontSize="5" fill="#71717A">
            cafelinville.ge
          </text>
        </svg>
      );
    case 'tent-min':
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <path d="M10 70 L40 12 L70 70 Z" fill="#18181B" />
          <rect x="30" y="36" width="20" height="20" rx="2" fill="white" />
          <rect x="33" y="39" width="4" height="4" fill="#18181B" />
          <rect x="39" y="39" width="4" height="4" fill="#18181B" />
          <rect x="33" y="45" width="4" height="4" fill="#18181B" />
          <rect x="43" y="45" width="4" height="4" fill="#18181B" />
          <rect x="39" y="49" width="4" height="4" fill="#18181B" />
          <text x="40" y="64" textAnchor="middle" fontSize="7" fontWeight="600" fill="white">
            CL
          </text>
        </svg>
      );
    case 'receipt':
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="22" y="8" width="36" height="64" rx="2" fill="white" stroke="#EAEAE6" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="40" y="26" textAnchor="middle" fontSize="6" fontWeight="600" fill="#18181B">
            Rate your visit
          </text>
          <rect x="32" y="36" width="16" height="16" rx="2" fill="#18181B" />
          <rect x="35" y="39" width="3" height="3" fill="white" />
          <rect x="40" y="39" width="3" height="3" fill="white" />
          <rect x="35" y="44" width="3" height="3" fill="white" />
          <rect x="42" y="44" width="3" height="3" fill="white" />
          <rect x="40" y="47" width="3" height="3" fill="white" />
          <text x="40" y="62" textAnchor="middle" fontSize="5" fill="#71717A">
            cafelinville.ge
          </text>
        </svg>
      );
    case 'decal':
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" fill="#B8633D" />
          <circle cx="40" cy="40" r="22" fill="white" />
          <rect x="30" y="30" width="20" height="20" rx="2" fill="#18181B" />
          <rect x="33" y="33" width="4" height="4" fill="white" />
          <rect x="39" y="33" width="4" height="4" fill="white" />
          <rect x="33" y="39" width="4" height="4" fill="white" />
          <rect x="43" y="39" width="4" height="4" fill="white" />
          <rect x="39" y="43" width="4" height="4" fill="white" />
          <path
            id="decalText"
            d="M 15,40 A 25,25 0 0,1 65,40"
            fill="none"
          />
          <text fontSize="5" fill="white" letterSpacing="1">
            <textPath href="#decalText" startOffset="50%" textAnchor="middle">
              SCAN • FOR MENU
            </textPath>
          </text>
        </svg>
      );
    case 'booklet':
      return (
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="8" width="60" height="64" rx="3" fill="white" stroke="#EAEAE6" strokeWidth="1.5" />
          <text x="40" y="24" textAnchor="middle" fontSize="6" fontWeight="600" fill="#18181B">
            Thank you
          </text>
          <text x="40" y="32" textAnchor="middle" fontSize="5" fill="#71717A">
            Scan for our full menu
          </text>
          <rect x="30" y="40" width="20" height="20" rx="2" fill="#18181B" />
          <rect x="33" y="43" width="4" height="4" fill="white" />
          <rect x="39" y="43" width="4" height="4" fill="white" />
          <rect x="33" y="49" width="4" height="4" fill="white" />
          <rect x="43" y="49" width="4" height="4" fill="white" />
          <rect x="39" y="53" width="4" height="4" fill="white" />
          <text x="40" y="68" textAnchor="middle" fontSize="5" fontWeight="600" fill="#18181B">
            CAFÉ LINVILLE
          </text>
        </svg>
      );
    default:
      return null;
  }
}
