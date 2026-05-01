'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Locale } from '@/i18n/config';

export interface TableSelection {
  id: string;
  productId: string;
  variationId: string | null;
  quantity: number;
  note: string | null;
  createdAt: string;
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
  status,
  initialSelections,
  locale,
  copy,
  children,
}: ProviderProps) {
  const router = useRouter();
  const [selections, setSelections] = useState<TableSelection[]>(initialSelections);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Set<string>>(() => new Set());
  const [leaving, setLeaving] = useState(false);

  const addSelection = useCallback(
    async (input: AddSelectionInput): Promise<boolean> => {
      if (status !== 'OPEN') {
        toast.error(copy.addClosed);
        return false;
      }
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
          toast.error(copy.addFailed);
          return false;
        }
        const body = await res.json();
        const data = body?.data;
        if (!data?.id) {
          toast.error(copy.addFailed);
          return false;
        }
        setSelections((curr) => [
          ...curr,
          {
            id: data.id,
            productId: data.productId,
            variationId: data.variationId ?? null,
            quantity: data.quantity ?? 1,
            note: data.note ?? null,
            createdAt: data.createdAt ?? new Date().toISOString(),
          },
        ]);
        toast.success(copy.addedToast);
        return true;
      } catch {
        toast.error(copy.addFailed);
        return false;
      } finally {
        setAdding(false);
      }
    },
    [code, status, copy.addClosed, copy.addFailed, copy.addedToast],
  );

  const removeSelection = useCallback(
    async (id: string): Promise<boolean> => {
      setRemoving((curr) => {
        const next = new Set(curr);
        next.add(id);
        return next;
      });
      const previous = selections;
      setSelections((curr) => curr.filter((s) => s.id !== id));
      try {
        const res = await fetch(
          `/api/public/tables/${encodeURIComponent(code)}/selections/${encodeURIComponent(id)}`,
          { method: 'DELETE' },
        );
        if (!res.ok) {
          setSelections(previous);
          toast.error(copy.removeFailed);
          return false;
        }
        return true;
      } catch {
        setSelections(previous);
        toast.error(copy.removeFailed);
        return false;
      } finally {
        setRemoving((curr) => {
          const next = new Set(curr);
          next.delete(id);
          return next;
        });
      }
    },
    [code, selections, copy.removeFailed],
  );

  const leave = useCallback(async () => {
    if (leaving) return;
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
      // Cookie was cleared by the response. router.refresh() re-runs the
      // server component, which now sees no cookie and renders the join form.
      router.refresh();
    } catch {
      toast.error(copy.leaveFailed);
      setLeaving(false);
    }
  }, [code, leaving, router, copy.leaveFailed]);

  const value = useMemo<TableModeContextValue>(
    () => ({
      code,
      slug,
      guestId,
      guestName,
      isHost,
      status,
      selections,
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
      status,
      selections,
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
