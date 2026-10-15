import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  TableHostView,
  type TableHostInitial,
} from '@/components/public/table-host-view';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
  },
}));

vi.mock('@/lib/pusher/client', () => ({
  isPusherClientAvailable: () => false,
  getPusherClient: () => null,
}));

vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const initial: TableHostInitial = {
  code: 'ABC123',
  slug: 'cafe-linville',
  menuName: 'Café Linville',
  hostName: 'Nino',
  hostGuestId: 'guest-host',
  maxGuests: 6,
  status: 'OPEN',
  expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  extendedAt: null,
  createdAt: new Date().toISOString(),
  guests: [
    {
      id: 'guest-host',
      name: 'Nino',
      isHost: true,
      joinedAt: new Date().toISOString(),
    },
  ],
  selections: [],
  products: [],
};

describe('TableHostView', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['ka', 'en', 'ru'] as const)(
    'renders without any PIN UI (%s)',
    async (locale) => {
      render(<TableHostView initial={initial} locale={locale} />);

      await waitFor(() =>
        expect(
          screen.getByTestId('public-table-host-qr').querySelector('img'),
        ).not.toBeNull(),
      );

      expect(screen.queryByText(/PIN/)).toBeNull();
      expect(screen.queryByTestId('public-table-host-pin-toggle')).toBeNull();
      expect(screen.getByTestId('public-table-host-copy-link')).toBeInTheDocument();
    },
  );
});
