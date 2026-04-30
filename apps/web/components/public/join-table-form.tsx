'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Users } from 'lucide-react';
import type { Locale } from '@/i18n/config';

interface JoinTableFormProps {
  slug: string;
  code: string;
  menuName: string;
  locale: Locale;
}

const COPY: Record<
  Locale,
  {
    title: string;
    subtitle: (menuName: string) => string;
    nameLabel: string;
    namePlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    submit: string;
    submitting: string;
    nameRequired: string;
    nameTooLong: string;
    pinFormat: string;
    wrongPinWithLeft: (n: number) => string;
    wrongPinNoLeft: string;
    tableFull: string;
    tableClosed: string;
    tableExpired: string;
    tableNotFound: string;
    rateLimited: (seconds: number) => string;
    networkError: string;
    backToMenu: string;
  }
> = {
  ka: {
    title: 'მაგიდასთან შეერთება',
    subtitle: (menuName) => `მენიუ: ${menuName}`,
    nameLabel: 'შენი სახელი',
    namePlaceholder: 'მაგ. ნინო',
    pinLabel: '4-ციფრიანი PIN',
    pinPlaceholder: '0000',
    submit: 'შეერთება',
    submitting: 'შეერთება…',
    nameRequired: 'სახელის შეყვანა აუცილებელია',
    nameTooLong: 'სახელი 32 სიმბოლოზე მოკლე უნდა იყოს',
    pinFormat: 'PIN უნდა შედგებოდეს ზუსტად 4 ციფრისგან',
    wrongPinWithLeft: (n) => `არასწორი PIN — დარჩენილი ცდები: ${n}`,
    wrongPinNoLeft: 'არასწორი PIN',
    tableFull: 'მაგიდა სავსეა',
    tableClosed: 'მაგიდა დახურულია',
    tableExpired: 'მაგიდას ვადა გაუვიდა',
    tableNotFound: 'მაგიდა ვერ მოიძებნა',
    rateLimited: (s) =>
      `გაჩერდი — სცადე ${s} წამში`,
    networkError: 'შეცდომა — სცადე თავიდან',
    backToMenu: 'მენიუზე დაბრუნება',
  },
  en: {
    title: 'Join the table',
    subtitle: (menuName) => `Menu: ${menuName}`,
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Nino',
    pinLabel: '4-digit PIN',
    pinPlaceholder: '0000',
    submit: 'Join',
    submitting: 'Joining…',
    nameRequired: 'Please enter your name',
    nameTooLong: 'Name must be 32 characters or fewer',
    pinFormat: 'PIN must be exactly 4 digits',
    wrongPinWithLeft: (n) => `Wrong PIN — ${n} attempts left`,
    wrongPinNoLeft: 'Wrong PIN',
    tableFull: 'Table is full',
    tableClosed: 'Table is closed',
    tableExpired: 'Table has expired',
    tableNotFound: 'Table not found',
    rateLimited: (s) => `Slow down — try again in ${s}s`,
    networkError: 'Something went wrong. Please try again.',
    backToMenu: 'Back to menu',
  },
  ru: {
    title: 'Присоединиться к столу',
    subtitle: (menuName) => `Меню: ${menuName}`,
    nameLabel: 'Ваше имя',
    namePlaceholder: 'напр. Нино',
    pinLabel: '4-значный PIN',
    pinPlaceholder: '0000',
    submit: 'Войти',
    submitting: 'Входим…',
    nameRequired: 'Введите имя',
    nameTooLong: 'Имя должно содержать не более 32 символов',
    pinFormat: 'PIN должен состоять ровно из 4 цифр',
    wrongPinWithLeft: (n) => `Неверный PIN — осталось попыток: ${n}`,
    wrongPinNoLeft: 'Неверный PIN',
    tableFull: 'Стол заполнен',
    tableClosed: 'Стол закрыт',
    tableExpired: 'Срок стола истёк',
    tableNotFound: 'Стол не найден',
    rateLimited: (s) => `Подождите — попробуйте через ${s} с`,
    networkError: 'Что-то пошло не так. Попробуйте снова.',
    backToMenu: 'Назад в меню',
  },
};

export function JoinTableForm({ slug, code, menuName, locale }: JoinTableFormProps) {
  const router = useRouter();
  const copy = COPY[locale];

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  // Retry-after countdown — re-enable submit when the window passes.
  useEffect(() => {
    if (!retryAt) return;
    const iv = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(iv);
  }, [retryAt]);

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0 && trimmedName.length <= 32;
  const pinValid = /^\d{4}$/.test(pin);
  const retryRemainingMs = retryAt ? Math.max(0, retryAt - now) : 0;
  const rateLimited = retryRemainingMs > 0;
  const canSubmit = nameValid && pinValid && !submitting && !rateLimited;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!nameValid) {
      setError(trimmedName.length > 32 ? copy.nameTooLong : copy.nameRequired);
      return;
    }
    if (!pinValid) {
      setError(copy.pinFormat);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/public/tables/${encodeURIComponent(code)}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, pin }),
        },
      );

      if (res.ok) {
        // Cookie is set by the server response — `router.refresh()` re-runs the
        // server component, which now sees the cookie and renders the menu.
        router.refresh();
        return;
      }

      const body = await res.json().catch(() => null);
      const errorCode = body?.error?.code as string | undefined;
      const details = body?.error?.details as
        | { attemptsLeft?: number; retryAfterSeconds?: number }
        | undefined;

      switch (errorCode) {
        case 'WRONG_PIN':
          setPin('');
          if (typeof details?.attemptsLeft === 'number' && details.attemptsLeft > 0) {
            setError(copy.wrongPinWithLeft(details.attemptsLeft));
          } else {
            setError(copy.wrongPinNoLeft);
          }
          break;
        case 'TABLE_FULL':
          setError(copy.tableFull);
          break;
        case 'TABLE_GONE':
          // Server returns TABLE_GONE for both CLOSED and EXPIRED. Use the
          // generic "closed" message — visitor can refresh to see updated state.
          setError(copy.tableClosed);
          break;
        case 'TABLE_NOT_FOUND':
          setError(copy.tableNotFound);
          break;
        case 'RATE_LIMITED': {
          const seconds = details?.retryAfterSeconds ?? 30;
          setRetryAt(Date.now() + seconds * 1000);
          setError(copy.rateLimited(seconds));
          break;
        }
        case 'VALIDATION_ERROR':
          setError(copy.pinFormat);
          break;
        default:
          setError(copy.networkError);
          break;
      }
    } catch {
      setError(copy.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-bg pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      data-testid="public-join-table"
    >
      <header className="border-b border-border bg-card px-5 pt-6 pb-5">
        <div className="mx-auto max-w-md">
          <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
            {copy.subtitle(menuName)}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-text-default">
            {copy.title} · #{code}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-md flex-col gap-5 rounded-[16px] border border-border bg-card p-5 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-text-default">
              <Users size={14} strokeWidth={1.75} aria-hidden="true" />
              {copy.nameLabel}
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={copy.namePlaceholder}
              maxLength={64}
              autoComplete="given-name"
              data-testid="public-join-name"
              className="h-[44px] w-full rounded-[10px] border border-border bg-bg px-[14px] text-[14px] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-text-default">
              <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
              {copy.pinLabel}
            </span>
            <input
              type="text"
              value={pin}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPin(next);
              }}
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              autoComplete="one-time-code"
              placeholder={copy.pinPlaceholder}
              data-testid="public-join-pin"
              className="h-[48px] w-full rounded-[10px] border border-border bg-bg px-[14px] text-center text-[18px] font-semibold tracking-[0.5em] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
            />
          </label>

          {error && (
            <p
              role="alert"
              data-testid="public-join-error"
              className="text-[12.5px] text-danger"
            >
              {rateLimited
                ? copy.rateLimited(Math.ceil(retryRemainingMs / 1000))
                : error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            data-testid="public-join-submit"
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
            onClick={() => router.push(`/m/${encodeURIComponent(slug)}`)}
            className="text-center text-[12.5px] font-medium text-text-muted underline-offset-2 hover:text-text-default hover:underline"
          >
            {copy.backToMenu}
          </button>
        </form>
      </main>
    </div>
  );
}
