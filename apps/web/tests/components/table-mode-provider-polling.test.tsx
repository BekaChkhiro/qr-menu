import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TableModeProvider,
  useTableMode,
  type TableModeContextValue,
} from '@/components/public/table-mode-provider';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const selection = {
  id: 'selection-1',
  guestId: 'guest-1',
  productId: 'product-1',
  variationId: null,
  quantity: 2,
  note: 'no onions',
  createdAt: '2026-10-15T10:00:00Z',
};
const response = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ data }) });
let mode: TableModeContextValue;
function Consumer() {
  mode = useTableMode()!;
  return null;
}
function mount(hasSelection = false) {
  return render(
    <TableModeProvider
      code="TABLE123"
      slug="cafe"
      guestId="guest-1"
      guestName="Nino"
      isHost={false}
      status="OPEN"
      initialSelections={hasSelection ? [selection] : []}
      locale="en"
      copy={{ addedToast: '', addFailed: '', addClosed: '', removeFailed: '', leaveFailed: '' }}
    >
      <Consumer />
    </TableModeProvider>
  );
}
const tick = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });

describe('table polling mutation reconciliation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each(['add', 'remove'] as const)(
    'ignores a poll predating %s and accepts the next snapshot',
    async (operation) => {
      const oldPoll = deferred<ReturnType<typeof response>>();
      const fetchMock = vi
        .fn()
        .mockReturnValueOnce(oldPoll.promise)
        .mockResolvedValueOnce(response(selection))
        .mockResolvedValue(
          response({ status: 'OPEN', selections: [{ ...selection, quantity: 3, note: 'fresh' }] })
        );
      vi.stubGlobal('fetch', fetchMock);
      mount(operation === 'remove');
      await tick();
      await act(async () => {
        if (operation === 'add')
          await mode.addSelection({
            productId: selection.productId,
            quantity: 2,
            note: selection.note,
          });
        else await mode.removeSelection(selection.id);
      });
      await act(async () => {
        oldPoll.resolve(
          response({ status: 'CLOSED', selections: operation === 'add' ? [] : [selection] })
        );
      });
      expect(mode.status).toBe('OPEN');
      expect(mode.selections).toHaveLength(operation === 'add' ? 1 : 0);
      expect(mode.sharedSelections).toHaveLength(operation === 'add' ? 1 : 0);
      await tick();
      expect(mode.selections[0]).toMatchObject({ quantity: 3, note: 'fresh' });
      expect(mode.sharedSelections).toEqual(mode.selections);
    }
  );

  it('does not resurrect an optimistic deletion when a poll starts during DELETE', async () => {
    const deletion = deferred<ReturnType<typeof response>>();
    const poll = deferred<ReturnType<typeof response>>();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockReturnValueOnce(deletion.promise)
        .mockReturnValueOnce(poll.promise)
        .mockResolvedValue(response({ selections: [] }))
    );
    mount(true);
    let result!: Promise<boolean>;
    act(() => {
      result = mode.removeSelection(selection.id);
    });
    expect(mode.selections).toEqual([]);
    await tick();
    await act(async () => {
      poll.resolve(response({ selections: [selection] }));
    });
    expect(mode.selections).toEqual([]);
    expect(mode.sharedSelections).toEqual([]);
    await act(async () => {
      deletion.resolve(response({}));
      await result;
    });
    expect(mode.selections).toEqual([]);
    await tick();
    expect(mode.sharedSelections).toEqual([]);
  });

  it.each(['add', 'remove', 'leave'] as const)(
    'resumes polling after a failed %s mutation',
    async (operation) => {
      const mutation = deferred<ReturnType<typeof response>>();
      const poll = deferred<ReturnType<typeof response>>();
      const fresh = { ...selection, quantity: 4, note: 'updated' };
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockReturnValueOnce(mutation.promise)
          .mockReturnValueOnce(poll.promise)
          .mockResolvedValue(response({ selections: [fresh] }))
      );
      mount(true);
      let result!: Promise<unknown>;
      act(() => {
        result =
          operation === 'add'
            ? mode.addSelection({ productId: selection.productId })
            : operation === 'remove'
              ? mode.removeSelection(selection.id)
              : mode.leave();
      });
      await tick();
      await act(async () => {
        poll.resolve(response({ status: 'CLOSED', selections: [] }));
      });
      expect(mode.status).toBe('OPEN');
      await act(async () => {
        mutation.resolve({ ...response({}), ok: false, status: 500 });
        await result;
      });
      expect(mode.selections).toEqual([selection]);
      await tick();
      expect(mode.selections).toEqual([fresh]);
      expect(mode.sharedSelections).toEqual([fresh]);
    }
  );

  it('stops scheduling polls and ignores in-flight data after unmount', async () => {
    const poll = deferred<ReturnType<typeof response>>();
    const fetchMock = vi.fn().mockReturnValue(poll.promise);
    vi.stubGlobal('fetch', fetchMock);
    const view = mount();
    await tick();
    view.unmount();
    await act(async () => {
      poll.resolve(response({ selections: [selection] }));
    });
    await tick();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mode.selections).toEqual([]);
  });
});
