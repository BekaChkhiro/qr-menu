'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';
import type { Locale } from '@/i18n/config';

export interface TableSelection {
  id: string;
  guestId?: string;
  productId: string;
  variationId: string | null;
  quantity: number;
  note: string | null;
  createdAt: string;
}

export interface SharedTableSelection {
  id: string;
  guestId: string;
  productId: string;
  variationId: string | null;
  quantity: number;
  note: string | null;
  createdAt: string;
}

export interface TableGuestInfo {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export interface AddSelectionInput {
  productId: string;
  variationId?: string | null;
  quantity?: number;
  note?: string | null;
}

export interface TableModeContextValue {
  code: string;
  slug: string;
  guestId: string;
  guestName: string;
  isHost: boolean;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  selections: TableSelection[];
  sharedSelections: SharedTableSelection[];
  guests: TableGuestInfo[];
  adding: boolean;
  removing: Set<string>;
  leaving: boolean;
  addSelection: (input: AddSelectionInput) => Promise<boolean>;
  removeSelection: (id: string) => Promise<boolean>;
  leave: () => Promise<void>;
  locale: Locale;
}

const TableModeContext = createContext<TableModeContextValue | null>(null);

export function useTableMode(): TableModeContextValue | null {
  return useContext(TableModeContext);
}

export function useTableModeRequired(): TableModeContextValue {
  const ctx = useContext(TableModeContext);
  if (!ctx) {
    throw new Error('useTableModeRequired must be used inside a TableModeProvider');
  }
  return ctx;
}

interface ProviderProps {
  code: string;
  slug: string;
  guestId: string;
  guestName: string;
  isHost: boolean;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  initialSelections: TableSelection[];
  initialSharedSelections?: SharedTableSelection[];
  initialGuests?: TableGuestInfo[];
  locale: Locale;
  copy: {
    addedToast: string;
    addFailed: string;
    addClosed: string;
    removeFailed: string;
    leaveFailed: string;
  };
  children: ReactNode;
}

export function TableModeProvider({
  code,
  slug,
  guestId,
  guestName,
  isHost,
  status: initialStatus,
  initialSelections,
  initialSharedSelections,
  initialGuests,
  locale,
  copy,
  children,
}: ProviderProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<'OPEN' | 'CLOSED' | 'EXPIRED'>(initialStatus);
  const [selections, setSelections] = useState<TableSelection[]>(initialSelections);
  const [sharedSelections, setSharedSelections] = useState<SharedTableSelection[]>(
    initialSharedSelections ??
      initialSelections.map((s) => ({
        id: s.id,
        guestId: s.guestId ?? guestId,
        productId: s.productId,
        variationId: s.variationId,
        quantity: s.quantity,
        note: s.note,
        createdAt: s.createdAt,
      })),
  );
  const [guests, setGuests] = useState<TableGuestInfo[]>(
    initialGuests ?? [{ id: guestId, name: guestName, isHost, joinedAt: new Date().toISOString() }],
  );
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(() => new Set());
  const [leaving, setLeaving] = useState(false);

  // Guards against concurrent polls and stale response overwrites
  const pollInFlightRef = useRef(false);
  const mutationRevisionRef = useRef(0);
  const pendingMutationsRef = useRef(0);

  // ── Polling: 2000ms interval matching the host view reconcile ────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentStatus !== 'OPEN') return;

    let mounted = true;

    async function pollTableState() {
      // Concurrency guard: only one poll at a time
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      const startRevision = mutationRevisionRef.current;

      try {
        const res = await fetch(`/api/public/tables/${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 404) {
            if (
              mounted &&
              pendingMutationsRef.current === 0 &&
              startRevision === mutationRevisionRef.current
            ) router.refresh();
          }
          return;
        }
        const body = await res.json();
        const data = body?.data as
          | {
              status?: 'OPEN' | 'CLOSED' | 'EXPIRED';
              guests?: TableGuestInfo[];
              selections?: SharedTableSelection[];
            }
          | undefined;

        if (!data || !mounted) return;

        // A poll can start after an optimistic mutation but before its commit.
        // Revision alone cannot detect that snapshot until the mutation finishes.
        if (
          pendingMutationsRef.current > 0 ||
          startRevision !== mutationRevisionRef.current
        ) {
          return;
        }

        if (data.status) {
          setCurrentStatus(data.status);
        }
        if (data.guests) {
          setGuests(data.guests);
        }
        if (data.selections) {
          setSharedSelections(data.selections);
          // Keep personal selections strictly synced to current guest's items
          const mine: TableSelection[] = data.selections
            .filter((s) => s.guestId === guestId)
            .map((s) => ({
              id: s.id,
              guestId: s.guestId,
              productId: s.productId,
              variationId: s.variationId,
              quantity: s.quantity,
              note: s.note,
              createdAt: s.createdAt,
            }));
          setSelections(mine);
        }
      } catch {
        // error handling: silent fallback, polling will retry next interval
      } finally {
        pollInFlightRef.current = false;
      }
    }

    const intervalId = window.setInterval(pollTableState, 2000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [code, guestId, currentStatus, router]);

  const addSelection = useCallback(
    async (input: AddSelectionInput): Promise<boolean> => {
      if (currentStatus !== 'OPEN') {
        toast.error(copy.addClosed);
        return false;
      }
      mutationRevisionRef.current += 1;
      pendingMutationsRef.current += 1;
      setAdding(true);
      try {
        const res = await fetch(
          `/api/public/tables/${encodeURIComponent(code)}/selections`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: input.productId,
              variationId: input.variationId ?? undefined,
              quantity: input.quantity ?? 1,
              note: input.note ?? undefined,
            }),
          },
        );
        if (!res.ok) {
          mutationRevisionRef.current += 1;
          toast.error(copy.addFailed);
          return false;
        }
        const body = await res.json();
        const data = body?.data;
        if (!data?.id) {
          mutationRevisionRef.current += 1;
          toast.error(copy.addFailed);
          return false;
        }

        const newSelection: TableSelection = {
          id: data.id,
          guestId: data.guestId ?? guestId,
          productId: data.productId,
          variationId: data.variationId ?? null,
          quantity: data.quantity ?? 1,
          note: data.note ?? null,
          createdAt: data.createdAt ?? new Date().toISOString(),
        };

        const newShared: SharedTableSelection = {
          id: data.id,
          guestId: data.guestId ?? guestId,
          productId: data.productId,
          variationId: data.variationId ?? null,
          quantity: data.quantity ?? 1,
          note: data.note ?? null,
          createdAt: data.createdAt ?? new Date().toISOString(),
        };

        mutationRevisionRef.current += 1;

        // Deduplicate on personal selections as well as shared
        setSelections((curr) => {
          if (curr.some((s) => s.id === newSelection.id)) return curr;
          return [...curr, newSelection];
        });
        setSharedSelections((curr) => {
          if (curr.some((s) => s.id === newShared.id)) return curr;
          return [...curr, newShared];
        });

        toast.success(copy.addedToast);
        return true;
      } catch {
        mutationRevisionRef.current += 1;
        toast.error(copy.addFailed);
        return false;
      } finally {
        pendingMutationsRef.current -= 1;
        setAdding(false);
      }
    },
    [code, guestId, currentStatus, copy.addClosed, copy.addFailed, copy.addedToast],
  );

  const removeSelection = useCallback(
    async (id: string): Promise<boolean> => {
      mutationRevisionRef.current += 1;
      pendingMutationsRef.current += 1;
      setRemoving((curr) => {
        const next = new Set(curr);
        next.add(id);
        return next;
      });
      const previousSelections = selections;
      const previousShared = sharedSelections;

      setSelections((curr) => curr.filter((s) => s.id !== id));
      setSharedSelections((curr) => curr.filter((s) => s.id !== id));

      try {
        const res = await fetch(
          `/api/public/tables/${encodeURIComponent(code)}/selections/${encodeURIComponent(id)}`,
          { method: 'DELETE' },
        );
        if (!res.ok) {
          mutationRevisionRef.current += 1;
          setSelections(previousSelections);
          setSharedSelections(previousShared);
          toast.error(copy.removeFailed);
          return false;
        }
        mutationRevisionRef.current += 1;
        return true;
      } catch {
        mutationRevisionRef.current += 1;
        setSelections(previousSelections);
        setSharedSelections(previousShared);
        toast.error(copy.removeFailed);
        return false;
      } finally {
        pendingMutationsRef.current -= 1;
        setRemoving((curr) => {
          const next = new Set(curr);
          next.delete(id);
          return next;
        });
      }
    },
    [code, selections, sharedSelections, copy.removeFailed],
  );

  const leave = useCallback(async () => {
    if (leaving) return;
    mutationRevisionRef.current += 1;
    pendingMutationsRef.current += 1;
    setLeaving(true);
    try {
      const res = await fetch(
        `/api/public/tables/${encodeURIComponent(code)}/leave`,
        { method: 'POST' },
      );
      if (!res.ok) {
        toast.error(copy.leaveFailed);
        setLeaving(false);
        return;
      }
      router.refresh();
    } catch {
      toast.error(copy.leaveFailed);
      setLeaving(false);
    } finally {
      mutationRevisionRef.current += 1;
      pendingMutationsRef.current -= 1;
    }
  }, [code, leaving, router, copy.leaveFailed]);

  const value = useMemo<TableModeContextValue>(
    () => ({
      code,
      slug,
      guestId,
      guestName,
      isHost,
      status: currentStatus,
      selections,
      sharedSelections,
      guests,
      adding,
      removing,
      leaving,
      addSelection,
      removeSelection,
      leave,
      locale,
    }),
    [
      code,
      slug,
      guestId,
      guestName,
      isHost,
      currentStatus,
      selections,
      sharedSelections,
      guests,
      adding,
      removing,
      leaving,
      addSelection,
      removeSelection,
      leave,
      locale,
    ],
  );

  return (
    <TableModeContext.Provider value={value}>{children}</TableModeContext.Provider>
  );
}
