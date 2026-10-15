import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TableSharedSelections } from '@/components/public/table-shared-selections';
import { TableGuestTray } from '@/components/public/table-guest-tray';
import {
  TableModeProvider,
  useTableMode,
} from '@/components/public/table-mode-provider';

const mockProducts = [
  {
    id: 'prod-1',
    nameKa: 'ხაჭაპური',
    nameEn: 'Khachapuri',
    nameRu: 'Хачапури',
    price: 15,
    imageUrl: 'https://example.com/khachapuri.jpg',
    variations: [
      {
        id: 'var-1',
        nameKa: 'დიდი',
        nameEn: 'Large',
        nameRu: 'Большой',
        price: 20,
      },
    ],
  },
  {
    id: 'prod-2',
    nameKa: 'ლიმონათი',
    nameEn: 'Lemonade',
    nameRu: 'Лимонад',
    price: 5,
    imageUrl: null,
    variations: [],
  },
];

const mockGuests = [
  {
    id: 'guest-host',
    name: 'Nino',
    isHost: true,
    joinedAt: '2026-04-30T10:00:00.000Z',
  },
  {
    id: 'guest-a',
    name: 'Anna',
    isHost: false,
    joinedAt: '2026-04-30T10:01:00.000Z',
  },
  {
    id: 'guest-b',
    name: 'Beka',
    isHost: false,
    joinedAt: '2026-04-30T10:02:00.000Z',
  },
];

const mockSharedSelections = [
  {
    id: 'sel-1',
    guestId: 'guest-host',
    productId: 'prod-1',
    variationId: 'var-1',
    quantity: 1,
    note: 'extra cheese',
    createdAt: '2026-04-30T10:05:00.000Z',
  },
  {
    id: 'sel-2',
    guestId: 'guest-a',
    productId: 'prod-2',
    variationId: null,
    quantity: 2,
    note: null,
    createdAt: '2026-04-30T10:06:00.000Z',
  },
];

describe('TableSharedSelections component', () => {
  it('renders guest cards grouped by guest name in host-view style', () => {
    render(
      <TableSharedSelections
        products={mockProducts}
        locale="en"
        guests={mockGuests}
        selections={mockSharedSelections}
      />,
    );

    expect(screen.getByTestId('public-table-shared-selections')).toBeInTheDocument();
    expect(screen.getByText('Guests · 3')).toBeInTheDocument();

    const guestCards = screen.getAllByTestId('public-table-shared-guest-card');
    expect(guestCards).toHaveLength(3);

    // Host card has host badge and crown icon
    expect(guestCards[0]).toHaveTextContent('Nino');
    expect(guestCards[0]).toHaveTextContent('Host');

    // Guest A card
    expect(guestCards[1]).toHaveTextContent('Anna');
    // Guest B card has empty state message
    expect(guestCards[2]).toHaveTextContent('Beka');
    expect(guestCards[2]).toHaveTextContent('No picks yet from this guest');
  });

  it('renders product details (name, variation, quantity, note) accurately', () => {
    render(
      <TableSharedSelections
        products={mockProducts}
        locale="en"
        guests={mockGuests}
        selections={mockSharedSelections}
      />,
    );

    const rows = screen.getAllByTestId('public-table-shared-selection-row');
    expect(rows).toHaveLength(2);

    // Host selection: Khachapuri · Large · ×1 · "extra cheese"
    expect(rows[0]).toHaveTextContent('Khachapuri');
    expect(rows[0]).toHaveTextContent('Large · ×1');
    expect(rows[0]).toHaveTextContent('“extra cheese”');

    // Guest A selection: Lemonade · ×2
    expect(rows[1]).toHaveTextContent('Lemonade');
    expect(rows[1]).toHaveTextContent('×2');
  });

  it('is strictly read-only: does not render remove/delete buttons or inputs', () => {
    render(
      <TableSharedSelections
        products={mockProducts}
        locale="ka"
        guests={mockGuests}
        selections={mockSharedSelections}
      />,
    );

    // Ensure there are no delete buttons inside shared selection rows
    const deleteButtons = screen.queryAllByRole('button', { name: /remove|წაშლა|ამოშლა/i });
    expect(deleteButtons).toHaveLength(0);
  });

  it('renders overall empty state when table has no selections', () => {
    render(
      <TableSharedSelections
        products={mockProducts}
        locale="ka"
        guests={mockGuests}
        selections={[]}
      />,
    );

    const empty = screen.getByTestId('public-table-shared-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('მაგიდის მონაწილეებს არჩევანი ჯერ არ დაუმატებიათ.');
  });
});

describe('TableGuestTray with Shared Picks Tab', () => {
  const providerCopy = {
    addedToast: 'Added',
    addFailed: 'Failed',
    addClosed: 'Closed',
    removeFailed: 'Failed',
    leaveFailed: 'Failed',
  };

  it('keeps personal pill count bound only to personal selections, and switches tabs', async () => {
    // Current guest is guest-a with 1 item ('sel-2'), whereas table total is 2 items
    render(
      <TableModeProvider
        code="ABCD1234"
        slug="cafe-test"
        guestId="guest-a"
        guestName="Anna"
        isHost={false}
        status="OPEN"
        initialSelections={[
          {
            id: 'sel-2',
            productId: 'prod-2',
            variationId: null,
            quantity: 2,
            note: null,
            createdAt: '2026-04-30T10:06:00.000Z',
          },
        ]}
        initialSharedSelections={mockSharedSelections}
        initialGuests={mockGuests}
        locale="en"
        copy={providerCopy}
      >
        <TableGuestTray
          products={mockProducts}
          currencySymbol="₾"
          locale="en"
        />
      </TableModeProvider>,
    );

    // Personal pill shows only 1 (guest-a's pick count), NOT 2 (shared table count)
    const pill = screen.getByTestId('public-table-guest-tray-pill');
    expect(pill).toHaveTextContent('My picks · 1');

    // Open sheet
    fireEvent.click(pill);

    // Both tabs exist
    const myTab = screen.getByTestId('public-table-guest-tray-tab-my');
    const sharedTab = screen.getByTestId('public-table-guest-tray-tab-shared');
    expect(myTab).toHaveTextContent('My picks · 1');
    expect(sharedTab).toHaveTextContent('Shared picks · 2');

    // In 'my' tab, personal items and remove button exist
    expect(screen.getByTestId('public-table-guest-tray-list')).toBeInTheDocument();
    expect(screen.getByTestId('public-table-guest-tray-remove')).toBeInTheDocument();
    expect(screen.getByTestId('public-table-guest-tray-total')).toBeInTheDocument();

    // Switch to 'shared' tab
    fireEvent.click(sharedTab);

    // Shared selections view is displayed
    expect(screen.getByTestId('public-table-shared-selections')).toBeInTheDocument();
    expect(screen.getAllByTestId('public-table-shared-guest-card')).toHaveLength(3);
    // In shared tab, personal edit/total is not displayed
    expect(screen.queryByTestId('public-table-guest-tray-list')).not.toBeInTheDocument();
  });
});

describe('TableModeProvider Polling & Data Isolation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('polls /api/public/tables/[code] at 2000ms intervals and updates shared data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          status: 'OPEN',
          guests: mockGuests,
          selections: [
            ...mockSharedSelections,
            {
              id: 'sel-3',
              guestId: 'guest-b',
              productId: 'prod-2',
              variationId: null,
              quantity: 1,
              note: null,
              createdAt: '2026-04-30T10:10:00.000Z',
            },
          ],
        },
      }),
    });
    global.fetch = fetchMock;

    function TestConsumer() {
      const mode = useTableMode();
      return (
        <div>
          <span data-testid="shared-count">{mode?.sharedSelections.length}</span>
          <span data-testid="my-count">{mode?.selections.length}</span>
        </div>
      );
    }

    render(
      <TableModeProvider
        code="TBL99"
        slug="test-slug"
        guestId="guest-a"
        guestName="Anna"
        isHost={false}
        status="OPEN"
        initialSelections={[
          {
            id: 'sel-2',
            productId: 'prod-2',
            variationId: null,
            quantity: 2,
            note: null,
            createdAt: '2026-04-30T10:06:00.000Z',
          },
        ]}
        initialSharedSelections={mockSharedSelections}
        initialGuests={mockGuests}
        locale="en"
        copy={{
          addedToast: '',
          addFailed: '',
          addClosed: '',
          removeFailed: '',
          leaveFailed: '',
        }}
      >
        <TestConsumer />
      </TableModeProvider>,
    );

    expect(screen.getByTestId('shared-count')).toHaveTextContent('2');
    expect(screen.getByTestId('my-count')).toHaveTextContent('1');

    // Fast-forward by 2000ms and await the state update
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/tables/TBL99',
      expect.objectContaining({ cache: 'no-store' }),
    );

    // After poll, shared selections increased to 3, but personal remains 1 (isolation)
    expect(screen.getByTestId('shared-count')).toHaveTextContent('3');
    expect(screen.getByTestId('my-count')).toHaveTextContent('1');
  });

  it('handles polling errors gracefully without throwing', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = fetchMock;

    function TestConsumer() {
      const mode = useTableMode();
      return <span data-testid="status">{mode?.status}</span>;
    }

    render(
      <TableModeProvider
        code="TBL99"
        slug="test-slug"
        guestId="guest-a"
        guestName="Anna"
        isHost={false}
        status="OPEN"
        initialSelections={[]}
        locale="en"
        copy={{
          addedToast: '',
          addFailed: '',
          addClosed: '',
          removeFailed: '',
          leaveFailed: '',
        }}
      >
        <TestConsumer />
      </TableModeProvider>,
    );

    // Advance 2 seconds - error should be silently handled
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('status')).toHaveTextContent('OPEN');
  });

  it('discards deferred polling response that returns after a mutation (race condition guard)', async () => {
    let resolveDeferredPoll!: (val: unknown) => void;
    const deferredPollPromise = new Promise((resolve) => {
      resolveDeferredPoll = resolve;
    });

    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/public/tables/TBL99/selections') && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: 'sel-new',
              guestId: 'guest-a',
              productId: 'prod-1',
              variationId: null,
              quantity: 1,
              note: null,
              createdAt: '2026-04-30T10:20:00.000Z',
            },
          }),
        });
      }
      if (url.includes('/api/public/tables/TBL99')) {
        return deferredPollPromise;
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    let tableModeRef: ReturnType<typeof useTableMode> = null;
    function TestConsumer() {
      tableModeRef = useTableMode();
      return (
        <div>
          <span data-testid="shared-count">{tableModeRef?.sharedSelections.length}</span>
          <span data-testid="my-count">{tableModeRef?.selections.length}</span>
        </div>
      );
    }

    render(
      <TableModeProvider
        code="TBL99"
        slug="test-slug"
        guestId="guest-a"
        guestName="Anna"
        isHost={false}
        status="OPEN"
        initialSelections={[]}
        initialSharedSelections={[]}
        initialGuests={mockGuests}
        locale="en"
        copy={{
          addedToast: '',
          addFailed: '',
          addClosed: '',
          removeFailed: '',
          leaveFailed: '',
        }}
      >
        <TestConsumer />
      </TableModeProvider>,
    );

    // Initial state: 0 items
    expect(screen.getByTestId('shared-count')).toHaveTextContent('0');
    expect(screen.getByTestId('my-count')).toHaveTextContent('0');

    // 1. Advance timer to trigger poll — fetch starts and is in-flight (deferred)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    // 2. While poll is in-flight, user adds an item
    await act(async () => {
      await tableModeRef!.addSelection({ productId: 'prod-1', quantity: 1 });
    });

    // State now has the new item
    expect(screen.getByTestId('shared-count')).toHaveTextContent('1');
    expect(screen.getByTestId('my-count')).toHaveTextContent('1');

    // 3. Stale poll finally resolves with 0 selections (from before mutation)
    await act(async () => {
      resolveDeferredPoll({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            status: 'OPEN',
            guests: mockGuests,
            selections: [], // stale snapshot with 0 items
          },
        }),
      });
    });

    // 4. Verify stale response was discarded: mutation items are preserved!
    expect(screen.getByTestId('shared-count')).toHaveTextContent('1');
    expect(screen.getByTestId('my-count')).toHaveTextContent('1');
  });

  it('cleans up polling interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    const { unmount } = render(
      <TableModeProvider
        code="TBL99"
        slug="test-slug"
        guestId="guest-a"
        guestName="Anna"
        isHost={false}
        status="OPEN"
        initialSelections={[]}
        locale="en"
        copy={{
          addedToast: '',
          addFailed: '',
          addClosed: '',
          removeFailed: '',
          leaveFailed: '',
        }}
      >
        <div>Content</div>
      </TableModeProvider>,
    );

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
