'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface MenuPasswordGateProps {
  slug: string;
  menuName: string;
}

export function MenuPasswordGate({ slug, menuName }: MenuPasswordGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password.trim()) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/menus/public/${encodeURIComponent(slug)}/verify-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        },
      );
      if (!res.ok) {
        setError('Incorrect password. Please try again.');
        setSubmitting(false);
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const busy = submitting || isPending;

  return (
    <div
      data-testid="menu-password-gate"
      className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"
    >
      <div className="w-full max-w-[420px] rounded-[14px] border border-border bg-card px-6 py-8 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full bg-chip">
          <Lock
            size={22}
            strokeWidth={1.5}
            aria-hidden="true"
            className="text-text-default"
          />
        </div>
        <h1 className="mt-4 text-center text-[17px] font-semibold tracking-tight text-text-default">
          {menuName}
        </h1>
        <p className="mt-1 text-center text-[13px] leading-[1.5] text-text-muted">
          This menu is password protected. Please enter the password to view it.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="sr-only">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoComplete="current-password"
                autoFocus
                data-testid="menu-password-input"
                aria-invalid={error ? 'true' : 'false'}
                className="h-[44px] w-full rounded-[10px] border border-border bg-bg pl-[14px] pr-[42px] text-[14px] text-text-default outline-none transition-colors focus:border-text-default focus:shadow-[0_0_0_3px_rgba(24,24,27,0.08)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-[10px] top-1/2 -translate-y-1/2 rounded-sm p-1 text-text-muted hover:text-text-default"
              >
                {showPassword ? (
                  <EyeOff size={15} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Eye size={15} strokeWidth={1.5} aria-hidden="true" />
                )}
              </button>
            </div>
          </label>

          {error && (
            <p
              data-testid="menu-password-error"
              role="alert"
              className="text-[12.5px] text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password.trim()}
            data-testid="menu-password-submit"
            className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-text-default text-[14px] font-semibold text-card transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden="true" />
            )}
            {busy ? 'Verifying…' : 'View menu'}
          </button>
        </form>
      </div>
    </div>
  );
}
