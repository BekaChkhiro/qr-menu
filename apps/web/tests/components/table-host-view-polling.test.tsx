import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TableHostView,
  type TableHostInitial,
} from '@/components/public/table-host-view';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
  },
}));

// No realtime: the host view falls back to 2000ms reconcile polling.
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
type Res = ReturnType<typeof response>;
const response = (data: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => ({ data }),
});

const selection = {
  id: 'selection-1',
  guestId: 'guest-host',
  productId: 'product-1',
  variationId: null,
  quantity: 2,
  note: null,
  createdAt: '2026-10-15T10:00:00Z',
};
const fresh = { ...selection, id: 'selection-2', productId: 'product-2' };

function initial(): TableHostInitial {
  return {
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
    selections: [selection],
    products: [],
  };
}
const snapshot = (selections: unknown[]) =>
  response({
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    extendedAt: null,
    guests: initial().guests,
    selections,
  });

// GET reconciles each get their own deferred; DELETE returns `deletion`.
let polls: ReturnType<typeof deferred<Res>>[];
let deletion: ReturnType<typeof deferred<Res>>;
let fetchMock: ReturnType<typeof vi.fn>;

const rows = () => screen.queryAllByTestId('public-table-host-selection-row');
const lastPoll = () => polls[polls.length - 1]!;
const tick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });

async function mount() {
  const view = render(<TableHostView initial={initial()} locale="en" />);
  // Settle the reconciles fired on mount with an unchanged snapshot.
  await act(async () => {
    for (const p of polls) p.resolve(snapshot([selection]));
  });
  polls = [];
  return view;
}
function clickRemove() {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  });
}

describe('TableHostView reconcile vs optimistic mutations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    polls = [];
    deletion = deferred<Res>();
    fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return deletion.promise;
      const poll = deferred<Res>();
      polls.push(poll);
      return poll.promise;
    });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('does not resurrect a removed selection from a poll started during DELETE', async () => {
    await mount();
    clickRemove();
    expect(rows()).toHaveLength(0);

    await tick();
    await act(async () => {
      lastPoll().resolve(snapshot([selection]));
    });
    expect(rows()).toHaveLength(0);

    await act(async () => {
      deletion.resolve(response({}));
    });
    expect(rows()).toHaveLength(0);
  });

  it('ignores a poll that started before the mutation and resolves after it', async () => {
    await mount();
    await tick();
    const stale = lastPoll();

    clickRemove();
    await act(async () => {
      deletion.resolve(response({}));
    });
    expect(rows()).toHaveLength(0);

    await act(async () => {
      stale.resolve(snapshot([selection]));
    });
    expect(rows()).toHaveLength(0);
  });

  it('accepts the next poll once the mutation has settled', async () => {
    await mount();
    clickRemove();
    await act(async () => {
      deletion.resolve(response({}));
    });

    await tick();
    await act(async () => {
      lastPoll().resolve(snapshot([fresh]));
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveAttribute('data-selection-id', fresh.id);
  });

  it('rolls back a failed DELETE and resumes accepting polls', async () => {
    await mount();
    clickRemove();
    await act(async () => {
      deletion.resolve(response({}, false));
    });
    expect(rows()).toHaveLength(1);

    await tick();
    await act(async () => {
      lastPoll().resolve(snapshot([fresh]));
    });
    expect(rows()[0]).toHaveAttribute('data-selection-id', fresh.id);
  });

  it('stops polling and ignores in-flight data after unmount', async () => {
    const view = await mount();
    await tick();
    const inFlight = lastPoll();
    const calls = fetchMock.mock.calls.length;
    view.unmount();
    await act(async () => {
      inFlight.resolve(snapshot([fresh]));
    });
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });
});
