'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import type { Locale } from '@/i18n/config';

interface CreateTableSheetProps {
  slug: string;
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    pinLabel: string;
    pinHint: string;
    capLabel: (n: number) => string;
    submit: string;
    submitting: string;
    cancel: string;
    nameTooLong: string;
    pinFormat: string;
    serverError: string;
  }
> = {
  ka: {
    title: 'მაგიდის შექმნა',
    description:
      'შექმენით სათაო მაგიდა — მეგობრები შემოგიერთდებიან QR კოდითა და PIN-ით.',
    nameLabel: 'თქვენი სახელი',
    namePlaceholder: 'მაგ. ნინო',
    pinLabel: '4-ციფრიანი PIN',
    pinHint: 'მეგობრებს გადაეცით ეს PIN, რომ შეუერთდნენ',
    capLabel: (n) => `სტუმრების ლიმიტი — ${n}`,
    submit: 'მაგიდის შექმნა',
    submitting: 'იქმნება…',
    cancel: 'გაუქმება',
    nameTooLong: 'სახელი 32 სიმბოლოზე მოკლე უნდა იყოს',
    pinFormat: 'PIN უნდა შედგებოდეს ზუსტად 4 ციფრისგან',
    serverError: 'შეცდომა, სცადეთ თავიდან',
  },
  en: {
    title: 'Create a shared table',
    description:
      "Create a host table — friends scan a table-specific QR or enter your PIN to join.",
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Nino',
    pinLabel: '4-digit PIN',
    pinHint: 'Share this PIN with the friends who will join',
    capLabel: (n) => `Guest cap — ${n}`,
    submit: 'Create table',
    submitting: 'Creating…',
    cancel: 'Cancel',
    nameTooLong: 'Name must be 32 characters or fewer',
    pinFormat: 'PIN must be exactly 4 digits',
    serverError: 'Something went wrong. Please try again.',
  },
  ru: {
    title: 'Создать общий стол',
    description:
      'Создайте стол хоста — друзья присоединятся, отсканировав QR или введя PIN.',
    nameLabel: 'Ваше имя',
    namePlaceholder: 'напр. Нино',
    pinLabel: '4-значный PIN',
    pinHint: 'Сообщите этот PIN тем, кто присоединится',
    capLabel: (n) => `Лимит гостей — ${n}`,
    submit: 'Создать стол',
    submitting: 'Создаём…',
    cancel: 'Отмена',
    nameTooLong: 'Имя должно содержать не более 32 символов',
    pinFormat: 'PIN должен состоять ровно из 4 цифр',
    serverError: 'Что-то пошло не так. Попробуйте снова.',
  },
};

export function CreateTableSheet({
  slug,
  locale,
  open,
  onOpenChange,
}: CreateTableSheetProps) {
  const router = useRouter();
  const copy = COPY[locale];

  const [hostName, setHostName] = useState('');
  const [pin, setPin] = useState('');
  const [maxGuests, setMaxGuests] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      // Focus the name input shortly after the sheet animates in.
      const t = setTimeout(() => nameInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      setSubmitting(false);
    }
  }, [open]);

  const trimmedName = hostName.trim();
  const nameValid = trimmedName.length > 0 && trimmedName.length <= 32;
  const pinValid = /^\d{4}$/.test(pin);
  const canSubmit = nameValid && pinValid && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!nameValid) {
      setError(trimmedName.length > 32 ? copy.nameTooLong : copy.nameLabel);
      return;
    }
    if (!pinValid) {
      setError(copy.pinFormat);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/menus/${encodeURIComponent(slug)}/tables`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostName: trimmedName,
            pin,
            maxGuests,
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const code = body?.error?.code as string | undefined;
        if (code === 'VALIDATION_ERROR') {
          setError(copy.pinFormat);
        } else {
          setError(copy.serverError);
        }
        setSubmitting(false);
        return;
      }

      const body = await res.json();
      const code = body?.data?.code as string | undefined;
      if (!code) {
        setError(copy.serverError);
        setSubmitting(false);
        return;
      }

      // Stash the PIN so the host view can offer a reveal toggle. The PIN is
      // NEVER round-tripped from the server — it lives only in this browser
      // tab's sessionStorage and is wiped when the host closes the table.
      try {
        window.sessionStorage.setItem(`dm_table_pin_${code}`, pin);
      } catch {
        // sessionStorage may be disabled (private mode) — proceed without.
      }

      // Cookie was set by the server response; navigate to the host view.
      onOpenChange(false);
      router.push(`/m/${encodeURIComponent(slug)}/t/${code}/host`);
    } catch {
      setError(copy.serverError);
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="responsive"
        data-testid="public-create-table-sheet"
        className="flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-border px-5 pb-4 pt-6 text-left">
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5"
        >
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-default">
              {copy.nameLabel}
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder={copy.namePlaceholder}
              maxLength={64}
              autoComplete="given-name"
              data-testid="public-create-table-name"
              className="h-[44px] w-full rounded-[10px] border border-border bg-bg px-[14px] text-[14px] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-text-default">
              {copy.pinLabel}
            </span>
            <input
              type="text"
              value={pin}
              onChange={(e) => {
                // Strip non-digits, cap at 4.
                const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(next);
              }}
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="off"
              data-testid="public-create-table-pin"
              aria-describedby="create-table-pin-hint"
              className="h-[44px] w-full rounded-[10px] border border-border bg-bg px-[14px] text-[15px] tracking-[0.4em] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
            />
            <p
              id="create-table-pin-hint"
              className="mt-1.5 text-[12px] text-text-muted"
            >
              {copy.pinHint}
            </p>
          </label>

          <div>
            <label className="mb-2.5 block text-[13px] font-medium text-text-default">
              {copy.capLabel(maxGuests)}
            </label>
            <Slider
              min={2}
              max={20}
              step={1}
              value={[maxGuests]}
              onValueChange={(v) => setMaxGuests(v[0] ?? 6)}
              data-testid="public-create-table-cap"
              aria-label={copy.capLabel(maxGuests)}
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
              <span>2</span>
              <span>20</span>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              data-testid="public-create-table-error"
              className="text-[12.5px] text-danger"
            >
              {error}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              data-testid="public-create-table-submit"
              className="flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-text-default text-[14px] font-semibold text-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <Loader2
                  size={14}
                  strokeWidth={2}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
              {submitting ? copy.submitting : copy.submit}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-[40px] rounded-[10px] text-[13px] font-medium text-text-muted transition-colors hover:text-text-default"
            >
              {copy.cancel}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
