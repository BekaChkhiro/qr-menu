'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Clock,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';
import { getPusherClient, isPusherClientAvailable } from '@/lib/pusher/client';

// ---------------------------------------------------------------------------
// Props (mirror of TableHostInitial in the page server file).
// ---------------------------------------------------------------------------

export interface TableHostInitial {
  code: string;
  slug: string;
  menuName: string;
  hostName: string;
  hostGuestId: string;
  maxGuests: number;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  expiresAt: string;
  extendedAt: string | null;
  createdAt: string;
  guests: Array<{
    id: string;
    name: string;
    isHost: boolean;
    joinedAt: string;
  }>;
  selections: Array<{
    id: string;
    guestId: string;
    productId: string;
    variationId: string | null;
    quantity: number;
    note: string | null;
    createdAt: string;
  }>;
  products: Array<{
    id: string;
    nameKa: string;
    nameEn: string | null;
    nameRu: string | null;
    price: number | string;
    currency: string;
    imageUrl: string | null;
    variations: Array<{
      id: string;
      nameKa: string;
      nameEn: string | null;
      nameRu: string | null;
      price: number | string;
    }>;
  }>;
}

interface Props {
  initial: TableHostInitial;
  locale: Locale;
}

// ---------------------------------------------------------------------------
// i18n strings (T19.4 — promoted into messages files in T19.9)
// ---------------------------------------------------------------------------

const COPY: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    statusOpen: string;
    statusClosed: string;
    statusExpired: string;
    countdownPrefix: string;
    countdownExpired: string;
    extendCta: string;
    extendUsed: string;
    extendNotYet: string;
    closeCta: string;
    showPin: string;
    hidePin: string;
    pinUnavailable: string;
    copyLink: string;
    linkCopied: string;
    copyFailed: string;
    guestsHeading: (n: number, max: number) => string;
    hostBadge: string;
    selectionEmpty: string;
    overallEmpty: string;
    closeConfirmTitle: string;
    closeConfirmDesc: string;
    closeConfirmCta: string;
    closeConfirmCancel: string;
    extendSuccess: string;
    extendFailed: string;
    closeSuccess: string;
    closeFailed: string;
    removeFailed: string;
    almostExpired: string;
    realtimeNote: string;
    realtimeOffline: string;
    realtimeReconnected: string;
    guestJoinedToast: (name: string) => string;
    selectionAddedToast: (name: string) => string;
    extendedToast: string;
    closedRedirectToast: string;
    leaveBackToMenu: string;
  }
> = {
  ka: {
    title: 'საერთო მაგიდა',
    subtitle: 'მენიუ:',
    statusOpen: 'აქტიური',
    statusClosed: 'დახურული',
    statusExpired: 'ვადაგასული',
    countdownPrefix: 'დარჩა',
    countdownExpired: 'ვადა ამოიწურა',
    extendCta: '+2 საათი',
    extendUsed: 'უკვე გაგრძელდა',
    extendNotYet: 'გახანგრძლივება დასაშვებია 30 წუთამდე',
    closeCta: 'დახურვა',
    showPin: 'PIN-ის ჩვენება',
    hidePin: 'PIN-ის დამალვა',
    pinUnavailable: 'ხელახლა გახსენი მაგიდის შექმნის ტაბიდან',
    copyLink: 'ბმულის კოპირება',
    linkCopied: 'ბმული დაკოპირდა',
    copyFailed: 'კოპირება ვერ მოხერხდა',
    guestsHeading: (n, max) => `სტუმრები ${n}/${max}`,
    hostBadge: 'მასპინძელი',
    selectionEmpty: 'ამ სტუმარს არჩევანი ჯერ არ აქვს',
    overallEmpty: 'გააზიარე QR ან PIN — სტუმრების არჩევანი აქ გამოჩნდება.',
    closeConfirmTitle: 'მაგიდის დახურვა',
    closeConfirmDesc:
      'ნამდვილად გსურთ მაგიდის დახურვა? მონაწილეები დაკარგავენ ხელმისაწვდომობას.',
    closeConfirmCta: 'დიახ, დახურე',
    closeConfirmCancel: 'გაუქმება',
    extendSuccess: '+2 საათი დაემატა',
    extendFailed: 'გახანგრძლივება ვერ მოხერხდა',
    closeSuccess: 'მაგიდა დაიხურა',
    closeFailed: 'დახურვა ვერ მოხერხდა',
    removeFailed: 'წაშლა ვერ მოხერხდა',
    almostExpired: '30 წუთი დარჩა — გაახანგრძლივო?',
    realtimeNote: 'ცოცხალი განახლება ჩართულია',
    realtimeOffline: 'კავშირი დაკარგა — შემდეგი ცვლილება გამოჩნდება გადახედვისას.',
    realtimeReconnected: 'კავშირი აღდგენილია',
    guestJoinedToast: (name: string) => `${name} შემოუერთდა`,
    selectionAddedToast: (name: string) => `${name}-მა აირჩია ახალი ნივთი`,
    extendedToast: '+2 საათი დაემატა მაგიდას',
    closedRedirectToast: 'მაგიდა დაიხურა',
    leaveBackToMenu: 'მენიუზე დაბრუნება',
  },
  en: {
    title: 'Shared table',
    subtitle: 'Menu:',
    statusOpen: 'Active',
    statusClosed: 'Closed',
    statusExpired: 'Expired',
    countdownPrefix: 'Time left',
    countdownExpired: 'Expired',
    extendCta: '+2 hours',
    extendUsed: 'Already extended',
    extendNotYet: 'Extend within last 30 minutes',
    closeCta: 'Close table',
    showPin: 'Show PIN',
    hidePin: 'Hide PIN',
    pinUnavailable: 'Reopen from the original create-table tab to see the PIN',
    copyLink: 'Copy link',
    linkCopied: 'Link copied',
    copyFailed: "Couldn't copy link",
    guestsHeading: (n, max) => `Guests ${n}/${max}`,
    hostBadge: 'Host',
    selectionEmpty: 'No picks yet from this guest',
    overallEmpty:
      "Share the QR or PIN — your friends' picks will appear here.",
    closeConfirmTitle: 'Close this table?',
    closeConfirmDesc:
      'Closing ends the table for everyone. Guests will lose access immediately.',
    closeConfirmCta: 'Yes, close it',
    closeConfirmCancel: 'Cancel',
    extendSuccess: '+2 hours added',
    extendFailed: "Couldn't extend the table",
    closeSuccess: 'Table closed',
    closeFailed: "Couldn't close the table",
    removeFailed: "Couldn't remove that selection",
    almostExpired: '30 minutes left — extend?',
    realtimeNote: 'Live updates are on',
    realtimeOffline: 'Connection lost — changes will reconcile when you reconnect.',
    realtimeReconnected: 'Reconnected',
    guestJoinedToast: (name: string) => `${name} joined`,
    selectionAddedToast: (name: string) => `${name} added a pick`,
    extendedToast: '+2 hours added',
    closedRedirectToast: 'Table closed',
    leaveBackToMenu: 'Back to menu',
  },
  ru: {
    title: 'Общий стол',
    subtitle: 'Меню:',
    statusOpen: 'Активен',
    statusClosed: 'Закрыт',
    statusExpired: 'Истёк',
    countdownPrefix: 'Осталось',
    countdownExpired: 'Истёк',
    extendCta: '+2 часа',
    extendUsed: 'Уже продлено',
    extendNotYet: 'Продление доступно в последние 30 минут',
    closeCta: 'Закрыть стол',
    showPin: 'Показать PIN',
    hidePin: 'Скрыть PIN',
    pinUnavailable:
      'Откройте вкладку, где вы создавали стол, чтобы увидеть PIN',
    copyLink: 'Копировать ссылку',
    linkCopied: 'Ссылка скопирована',
    copyFailed: 'Не удалось скопировать',
    guestsHeading: (n, max) => `Гости ${n}/${max}`,
    hostBadge: 'Хост',
    selectionEmpty: 'У этого гостя пока нет выбора',
    overallEmpty:
      'Поделитесь QR или PIN — выборы друзей появятся здесь.',
    closeConfirmTitle: 'Закрыть стол?',
    closeConfirmDesc:
      'Все участники потеряют доступ сразу. Это действие нельзя отменить.',
    closeConfirmCta: 'Да, закрыть',
    closeConfirmCancel: 'Отмена',
    extendSuccess: 'Добавлено 2 часа',
    extendFailed: 'Не удалось продлить',
    closeSuccess: 'Стол закрыт',
    closeFailed: 'Не удалось закрыть',
    removeFailed: 'Не удалось удалить',
    almostExpired: 'Осталось 30 минут — продлить?',
    realtimeNote: 'Обновления в реальном времени включены',
    realtimeOffline:
      'Соединение потеряно — изменения подтянутся при восстановлении.',
    realtimeReconnected: 'Соединение восстановлено',
    guestJoinedToast: (name: string) => `${name} присоединился`,
    selectionAddedToast: (name: string) => `${name} добавил позицию`,
    extendedToast: 'Добавлено 2 часа',
    closedRedirectToast: 'Стол закрыт',
    leaveBackToMenu: 'Назад в меню',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PIN_STORAGE_PREFIX = 'dm_table_pin_';
const EXTEND_WINDOW_MS = 30 * 60 * 1000;
const ALMOST_EXPIRED_THRESHOLD_MS = 30 * 60 * 1000;

function pickName<T extends { nameKa: string; nameEn: string | null; nameRu: string | null }>(
  entity: T,
  locale: Locale,
): string {
  switch (locale) {
    case 'en':
      return entity.nameEn || entity.nameKa;
    case 'ru':
      return entity.nameRu || entity.nameKa;
    default:
      return entity.nameKa;
  }
}

function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return '0:00:00';
  const total = Math.floor(msRemaining / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TableHostView({ initial, locale }: Props) {
  const router = useRouter();
  const copy = COPY[locale];

  const [status, setStatus] = useState(initial.status);
  const [expiresAtIso, setExpiresAtIso] = useState(initial.expiresAt);
  const [extendedAtIso, setExtendedAtIso] = useState<string | null>(
    initial.extendedAt,
  );
  const [guests, setGuests] = useState(initial.guests);
  const [selections, setSelections] = useState(initial.selections);
  const [flashIds, setFlashIds] = useState<Set<string>>(() => new Set());
  const [now, setNow] = useState(() => Date.now());
  const [pinReveal, setPinReveal] = useState(false);
  const [pinValue, setPinValue] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tableUrl, setTableUrl] = useState<string>('');
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [extending, setExtending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<
    'idle' | 'connected' | 'disconnected'
  >('idle');

  const almostToastedRef = useRef(false);
  const reconcileSeenRef = useRef(false);
  const realtimeStatusRef = useRef<'idle' | 'connected' | 'disconnected'>(
    'idle',
  );

  // ── Read PIN from sessionStorage (host-only, set by CreateTableSheet) ─────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.sessionStorage.getItem(
        `${PIN_STORAGE_PREFIX}${initial.code}`,
      );
      if (stored) setPinValue(stored);
    } catch {
      // sessionStorage may be disabled (private mode) — silently ignore.
    }
  }, [initial.code]);

  // ── Build the table-scoped URL & QR data URL ─────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/m/${initial.slug}/t/${initial.code}`;
    setTableUrl(url);
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: { dark: '#18181B', light: '#FFFFFF' },
    })
      .then((data) => setQrDataUrl(data))
      .catch(() => setQrDataUrl(null));
  }, [initial.code, initial.slug]);

  // ── Tick-tock countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'OPEN') return;
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, [status]);

  // ── Auto-flip to EXPIRED when countdown crosses zero ─────────────────────
  const expiresAtMs = useMemo(
    () => new Date(expiresAtIso).getTime(),
    [expiresAtIso],
  );

  useEffect(() => {
    if (status === 'OPEN' && expiresAtMs <= now) {
      setStatus('EXPIRED');
    }
  }, [status, expiresAtMs, now]);

  // ── One-shot toast at T-30min ────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'OPEN' || extendedAtIso) return;
    const remaining = expiresAtMs - now;
    if (
      !almostToastedRef.current &&
      remaining > 0 &&
      remaining <= ALMOST_EXPIRED_THRESHOLD_MS
    ) {
      almostToastedRef.current = true;
      toast.warning(copy.almostExpired);
    }
  }, [status, expiresAtMs, now, extendedAtIso, copy.almostExpired]);

  // ── Realtime: Pusher subscription on table-{code} ────────────────────────
  // Guests don't subscribe (per T19.6 spec) — only the host page does.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== 'OPEN') return;
    if (!isPusherClientAvailable()) return;

    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(`table-${initial.code}`);

    function flashSelection(id: string) {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      window.setTimeout(() => {
        setFlashIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1100);
    }

    const onGuestJoined = (data: unknown) => {
      const payload = data as {
        guestId: string;
        name: string;
        isHost: boolean;
        joinedAt: string;
      };
      setGuests((prev) => {
        if (prev.some((g) => g.id === payload.guestId)) return prev;
        return [
          ...prev,
          {
            id: payload.guestId,
            name: payload.name,
            isHost: payload.isHost,
            joinedAt: payload.joinedAt,
          },
        ];
      });
      toast.success(copy.guestJoinedToast(payload.name));
    };

    const onSelectionAdded = (data: unknown) => {
      const payload = data as {
        guestId: string;
        guestName?: string;
        selectionId: string;
        productId: string;
        variationId: string | null;
        quantity: number;
        note: string | null;
        createdAt: string;
      };
      setSelections((prev) => {
        if (prev.some((s) => s.id === payload.selectionId)) return prev;
        return [
          ...prev,
          {
            id: payload.selectionId,
            guestId: payload.guestId,
            productId: payload.productId,
            variationId: payload.variationId,
            quantity: payload.quantity,
            note: payload.note,
            createdAt: payload.createdAt,
          },
        ];
      });
      flashSelection(payload.selectionId);
      if (payload.guestName) {
        toast.message(copy.selectionAddedToast(payload.guestName));
      }
    };

    const onSelectionRemoved = (data: unknown) => {
      const payload = data as { selectionId: string };
      setSelections((prev) => prev.filter((s) => s.id !== payload.selectionId));
    };

    const onClosed = () => {
      setStatus('CLOSED');
      try {
        window.sessionStorage.removeItem(
          `${PIN_STORAGE_PREFIX}${initial.code}`,
        );
      } catch {
        // ignore
      }
      toast.message(copy.closedRedirectToast);
      router.push(`/m/${initial.slug}`);
    };

    const onExtended = (data: unknown) => {
      const payload = data as { expiresAt: string; extendedAt: string };
      if (payload.expiresAt) setExpiresAtIso(payload.expiresAt);
      if (payload.extendedAt) setExtendedAtIso(payload.extendedAt);
      almostToastedRef.current = false;
      toast.success(copy.extendedToast);
    };

    channel.bind('table:guest_joined', onGuestJoined);
    channel.bind('table:selection_added', onSelectionAdded);
    channel.bind('table:selection_removed', onSelectionRemoved);
    channel.bind('table:closed', onClosed);
    channel.bind('table:extended', onExtended);

    // Reconcile on (re)connect: refetch authoritative state and replace local.
    // First "connected" after mount is a no-op for state but flips the badge.
    async function reconcile() {
      try {
        const res = await fetch(`/api/public/tables/${initial.code}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const body = await res.json();
        const data = body?.data as
          | undefined
          | {
              status: 'OPEN' | 'CLOSED' | 'EXPIRED';
              expiresAt: string;
              extendedAt: string | null;
              guests: TableHostInitial['guests'];
              selections: TableHostInitial['selections'];
            };
        if (!data) return;
        setStatus(data.status);
        setExpiresAtIso(data.expiresAt);
        setExtendedAtIso(data.extendedAt);
        setGuests(data.guests);
        setSelections(data.selections);
        if (data.status === 'CLOSED') {
          router.push(`/m/${initial.slug}`);
        }
      } catch {
        // best-effort reconcile — next event will retry implicitly
      }
    }

    const onConnected = () => {
      const wasDisconnected = realtimeStatusRef.current === 'disconnected';
      realtimeStatusRef.current = 'connected';
      setRealtimeStatus('connected');
      if (wasDisconnected || reconcileSeenRef.current) {
        reconcile();
        if (wasDisconnected) toast.success(copy.realtimeReconnected);
      }
      reconcileSeenRef.current = true;
    };

    const onDisconnected = () => {
      realtimeStatusRef.current = 'disconnected';
      setRealtimeStatus('disconnected');
    };

    client.connection.bind('connected', onConnected);
    client.connection.bind('disconnected', onDisconnected);
    client.connection.bind('unavailable', onDisconnected);

    // pusher-js sets connection.state synchronously; if already connected, the
    // 'connected' event won't fire again — seed state from current value.
    if (client.connection.state === 'connected') {
      realtimeStatusRef.current = 'connected';
      setRealtimeStatus('connected');
      reconcileSeenRef.current = true;
    }

    return () => {
      channel.unbind('table:guest_joined', onGuestJoined);
      channel.unbind('table:selection_added', onSelectionAdded);
      channel.unbind('table:selection_removed', onSelectionRemoved);
      channel.unbind('table:closed', onClosed);
      channel.unbind('table:extended', onExtended);
      client.connection.unbind('connected', onConnected);
      client.connection.unbind('disconnected', onDisconnected);
      client.connection.unbind('unavailable', onDisconnected);
      client.unsubscribe(`table-${initial.code}`);
    };
  }, [initial.code, initial.slug, status, router, copy]);

  // ── Derived state ────────────────────────────────────────────────────────

  const productById = useMemo(() => {
    const map = new Map<string, TableHostInitial['products'][number]>();
    for (const p of initial.products) map.set(p.id, p);
    return map;
  }, [initial.products]);

  const variationById = useMemo(() => {
    const map = new Map<
      string,
      TableHostInitial['products'][number]['variations'][number]
    >();
    for (const p of initial.products) {
      for (const v of p.variations) map.set(v.id, v);
    }
    return map;
  }, [initial.products]);

  const selectionsByGuest = useMemo(() => {
    const map = new Map<string, typeof selections>();
    for (const s of selections) {
      const arr = map.get(s.guestId) ?? [];
      arr.push(s);
      map.set(s.guestId, arr);
    }
    return map;
  }, [selections]);

  const totalSelectionCount = selections.length;
  const remainingMs = Math.max(0, expiresAtMs - now);
  const canExtend =
    status === 'OPEN' &&
    !extendedAtIso &&
    remainingMs > 0 &&
    remainingMs <= EXTEND_WINDOW_MS;
  const extendDisabledReason = !canExtend
    ? extendedAtIso
      ? copy.extendUsed
      : status !== 'OPEN'
        ? copy.statusExpired
        : copy.extendNotYet
    : null;

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleCopyLink() {
    if (!tableUrl) return;
    try {
      await navigator.clipboard.writeText(tableUrl);
      setLinkCopied(true);
      toast.success(copy.linkCopied);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error(copy.copyFailed);
    }
  }

  async function handleExtend() {
    if (!canExtend || extending) return;
    setExtending(true);
    try {
      const res = await fetch(
        `/api/public/tables/${initial.code}/extend`,
        { method: 'POST' },
      );
      if (!res.ok) {
        toast.error(copy.extendFailed);
        return;
      }
      const body = await res.json();
      const data = body?.data;
      if (data?.expiresAt) setExpiresAtIso(data.expiresAt);
      if (data?.extendedAt) setExtendedAtIso(data.extendedAt);
      almostToastedRef.current = false;
      toast.success(copy.extendSuccess);
    } catch {
      toast.error(copy.extendFailed);
    } finally {
      setExtending(false);
    }
  }

  async function handleClose() {
    if (closing) return;
    setClosing(true);
    try {
      const res = await fetch(
        `/api/public/tables/${initial.code}/close`,
        { method: 'POST' },
      );
      if (!res.ok) {
        toast.error(copy.closeFailed);
        return;
      }
      setStatus('CLOSED');
      // Clear stored PIN to avoid stale reveal on a future visit.
      try {
        window.sessionStorage.removeItem(`${PIN_STORAGE_PREFIX}${initial.code}`);
      } catch {
        // ignore
      }
      toast.success(copy.closeSuccess);
      setConfirmCloseOpen(false);
      // Navigate back to the menu — table is terminal now.
      router.push(`/m/${initial.slug}`);
    } catch {
      toast.error(copy.closeFailed);
    } finally {
      setClosing(false);
    }
  }

  async function handleRemoveSelection(selectionId: string) {
    const previous = selections;
    // Optimistic
    setSelections((curr) => curr.filter((s) => s.id !== selectionId));
    try {
      const res = await fetch(
        `/api/public/tables/${initial.code}/selections/${selectionId}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        setSelections(previous);
        toast.error(copy.removeFailed);
      }
    } catch {
      setSelections(previous);
      toast.error(copy.removeFailed);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const statusLabel =
    status === 'OPEN'
      ? copy.statusOpen
      : status === 'CLOSED'
        ? copy.statusClosed
        : copy.statusExpired;

  return (
    <div
      className="min-h-[100dvh] bg-bg pb-[calc(env(safe-area-inset-bottom)+2rem)]"
      data-testid="public-table-host-view"
    >
      {/* Header */}
      <header className="border-b border-border bg-card px-4 pt-5 pb-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
                {copy.subtitle} {initial.menuName}
              </p>
              <h1 className="mt-1 truncate text-[20px] font-semibold tracking-tight text-text-default">
                {copy.title} · #{initial.code}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-muted">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                    status === 'OPEN'
                      ? 'bg-success/10 text-success'
                      : 'bg-chip text-text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      status === 'OPEN' ? 'bg-success' : 'bg-text-muted',
                    )}
                  />
                  {statusLabel}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Clock size={13} strokeWidth={1.5} aria-hidden="true" />
                  {status === 'OPEN'
                    ? `${copy.countdownPrefix} ${formatCountdown(remainingMs)}`
                    : copy.countdownExpired}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Users size={13} strokeWidth={1.5} aria-hidden="true" />
                  {guests.length}/{initial.maxGuests}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/m/${initial.slug}`)}
              aria-label={copy.leaveBackToMenu}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-chip hover:text-text-default"
            >
              <X size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          {/* QR + PIN + actions */}
          {status === 'OPEN' && (
            <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
              <div
                className="flex h-[160px] w-[160px] items-center justify-center self-center justify-self-center rounded-[14px] border border-border bg-white p-2"
                data-testid="public-table-host-qr"
              >
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={`QR for table ${initial.code}`}
                    className="h-full w-full"
                  />
                ) : (
                  <Loader2
                    size={20}
                    className="animate-spin text-text-muted"
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid="public-table-host-copy-link"
                  className="inline-flex h-[40px] items-center justify-center gap-2 rounded-[10px] border border-border bg-card text-[13px] font-medium text-text-default transition-colors hover:bg-chip"
                >
                  <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
                  {linkCopied ? copy.linkCopied : copy.copyLink}
                </button>

                <button
                  type="button"
                  onClick={() => setPinReveal((v) => !v)}
                  data-testid="public-table-host-pin-toggle"
                  className="inline-flex h-[40px] items-center justify-between rounded-[10px] border border-border bg-card px-[14px] text-[13px] font-medium text-text-default transition-colors hover:bg-chip"
                >
                  <span className="inline-flex items-center gap-2">
                    {pinReveal ? (
                      <EyeOff size={14} strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                    )}
                    {pinReveal ? copy.hidePin : copy.showPin}
                  </span>
                  <span
                    className="font-mono text-[14px] tracking-[0.4em] text-text-default"
                    aria-live="polite"
                  >
                    {pinReveal
                      ? pinValue ?? '— — — —'
                      : '• • • •'}
                  </span>
                </button>
                {pinReveal && !pinValue && (
                  <p className="-mt-1 text-[11.5px] text-text-muted">
                    {copy.pinUnavailable}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExtend}
                    disabled={!canExtend || extending}
                    data-testid="public-table-host-extend"
                    title={extendDisabledReason ?? undefined}
                    aria-disabled={!canExtend}
                    className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] border border-border bg-card text-[13px] font-medium text-text-default transition-colors hover:bg-chip disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {extending ? (
                      <Loader2
                        size={14}
                        strokeWidth={1.75}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus size={14} strokeWidth={1.75} aria-hidden="true" />
                    )}
                    {copy.extendCta}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmCloseOpen(true)}
                    data-testid="public-table-host-close"
                    className="inline-flex h-[40px] flex-1 items-center justify-center gap-2 rounded-[10px] border border-danger/40 bg-card text-[13px] font-medium text-danger transition-colors hover:bg-danger/10"
                  >
                    <X size={14} strokeWidth={1.75} aria-hidden="true" />
                    {copy.closeCta}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Body — guest cards */}
      <main className="px-4 pt-5 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-text-muted">
            {copy.guestsHeading(guests.length, initial.maxGuests)}
          </h2>

          {totalSelectionCount === 0 && (
            <p className="mb-4 rounded-[12px] border border-dashed border-border bg-card px-4 py-6 text-center text-[13px] text-text-muted">
              {copy.overallEmpty}
            </p>
          )}

          <ul className="flex flex-col gap-3" data-testid="public-table-host-guests">
            {guests.map((guest) => {
              const guestSelections = selectionsByGuest.get(guest.id) ?? [];
              return (
                <li
                  key={guest.id}
                  className="rounded-[14px] border border-border bg-card p-4"
                  data-testid="public-table-host-guest-card"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-[13px] font-semibold text-text-default">
                      {getInitial(guest.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-text-default">
                        {guest.name}
                        {guest.isHost && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-text-default/10 px-2 py-0.5 align-middle text-[10px] font-medium uppercase tracking-wide text-text-default">
                            <Crown
                              size={10}
                              strokeWidth={1.75}
                              aria-hidden="true"
                            />
                            {copy.hostBadge}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-text-muted">
                      {guestSelections.length}
                    </span>
                  </div>

                  {guestSelections.length === 0 ? (
                    <p className="mt-3 text-[12.5px] text-text-muted">
                      {copy.selectionEmpty}
                    </p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {guestSelections.map((sel) => {
                        const product = productById.get(sel.productId);
                        const variation = sel.variationId
                          ? variationById.get(sel.variationId)
                          : null;
                        const productName = product
                          ? pickName(product, locale)
                          : sel.productId;
                        const variationName = variation
                          ? pickName(variation, locale)
                          : null;
                        return (
                          <li
                            key={sel.id}
                            data-testid="public-table-host-selection-row"
                            data-selection-id={sel.id}
                            className={cn(
                              'flex items-center gap-3 rounded-[10px] border border-border bg-bg px-3 py-2',
                              flashIds.has(sel.id) && 'animate-once-flash',
                            )}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-chip">
                              {product?.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt=""
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-text-default">
                                {productName}
                              </p>
                              <p className="text-[11.5px] text-text-muted">
                                {variationName ? `${variationName} · ` : ''}
                                ×{sel.quantity}
                              </p>
                              {sel.note && (
                                <p className="mt-0.5 line-clamp-2 text-[11.5px] text-text-muted">
                                  “{sel.note}”
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSelection(sel.id)}
                              aria-label="Remove"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            >
                              <Trash2
                                size={14}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <p
            className={cn(
              'mt-6 text-center text-[11.5px]',
              realtimeStatus === 'disconnected'
                ? 'text-warning'
                : 'text-text-muted',
            )}
            data-testid="public-table-host-realtime-status"
            data-realtime-state={realtimeStatus}
          >
            {realtimeStatus === 'disconnected'
              ? copy.realtimeOffline
              : copy.realtimeNote}
          </p>
        </div>
      </main>

      <AlertDialog
        open={confirmCloseOpen}
        onOpenChange={(open) => {
          if (!closing) setConfirmCloseOpen(open);
        }}
      >
        <AlertDialogContent data-testid="public-table-host-close-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.closeConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.closeConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>
              {copy.closeConfirmCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Prevent the default close-on-action so we can keep the dialog
                // open while the request is in flight.
                e.preventDefault();
                handleClose();
              }}
              disabled={closing}
              className="bg-danger text-card hover:bg-danger/90"
            >
              {closing ? (
                <Loader2
                  size={14}
                  strokeWidth={2}
                  className="mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {copy.closeConfirmCta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
