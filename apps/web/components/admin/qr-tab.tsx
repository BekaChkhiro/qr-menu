'use client';

import { useState } from 'react';

import { QrCustomizePanel } from './qr-customize-panel';
import { QrDownloadPanel } from './qr-download-panel';
import { QrTemplatePickerModal } from './qr-template-picker-modal';
import type { Menu, MenuWithDetails } from '@/types/menu';

type SizeMode = 'S' | 'M' | 'L';

interface QrTabProps {
  menu: Menu | MenuWithDetails;
  hasQrLogo: boolean;
}

export function QrTab({ menu, hasQrLogo }: QrTabProps) {
  const [sizeMode, setSizeMode] = useState<SizeMode>('M');
  const [templatesOpen, setTemplatesOpen] = useState(false);

  return (
    <>
      <div className="flex w-full gap-5">
        <QrCustomizePanel
          menu={menu}
          hasQrLogo={hasQrLogo}
          sizeMode={sizeMode}
          onSizeChange={setSizeMode}
        />
        <QrDownloadPanel
          menu={menu}
          hasQrLogo={hasQrLogo}
          sizeMode={sizeMode}
          onOpenTemplates={() => setTemplatesOpen(true)}
        />
      </div>

      <QrTemplatePickerModal
        menu={menu}
        sizeMode={sizeMode}
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
      />
    </>
  );
}
