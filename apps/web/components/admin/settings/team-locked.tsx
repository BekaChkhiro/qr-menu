'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Check, Users } from 'lucide-react';

// ── Mock team members rendered as a blurred preview behind the overlay ───────
const PREVIEW_MEMBERS = [
  {
    name: 'Nino Kapanadze',
    email: 'nino@cafelinville.ge',
    role: 'Owner',
    status: 'Active',
  },
  {
    name: 'Giorgi Beridze',
    email: 'giorgi@cafelinville.ge',
    role: 'Manager',
    status: 'Active',
  },
  {
    name: 'Nino Tsereteli',
    email: 'nino@cafelinville.ge',
    role: 'Staff',
    status: 'Invited',
  },
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((s) => s[0])
    .join('');
}

export function TeamLocked() {
  const t = useTranslations('admin.settings.team.locked');

  return (
    <div className="relative w-full" data-testid="settings-team-locked">
      {/* Blurred preview — non-interactive and hidden from assistive tech. */}
      <div
        className="pointer-events-none select-none blur-[6px] opacity-60"
        aria-hidden="true"
        data-testid="settings-team-locked-preview"
      >
        <SettingsPageHeadingMock />

        {/* Invite button row (decorative) */}
        <div className="mb-3.5 flex justify-end">
          <div className="inline-flex h-[32px] items-center gap-[6px] rounded-[7px] border border-text-default bg-text-default px-[13px] text-[12.5px] font-medium text-white opacity-50">
            {t('inviteMember')}
          </div>
        </div>

        {/* Member table preview */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-card">
          {PREVIEW_MEMBERS.map((member, index) => (
            <div
              key={member.name}
              className="flex items-center gap-3.5 px-4 py-3.5"
              style={{
                borderBottom:
                  index < PREVIEW_MEMBERS.length - 1
                    ? '1px solid hsl(var(--border))'
                    : 'none',
              }}
            >
              <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                {getInitials(member.name)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-text-default">
                  {member.name}
                </div>
                <div className="text-[12px] text-text-muted">{member.email}</div>
              </div>
              <div className="rounded-[4px] border border-border bg-chip px-2 py-[3px] text-[11px] font-semibold text-text-default">
                {member.role}
              </div>
              <div
                className={`text-[11.5px] font-semibold ${
                  member.status === 'Active' ? 'text-success' : 'text-text-muted'
                }`}
              >
                {member.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered upgrade overlay card */}
      <div
        className={
          'absolute left-1/2 top-1/2 w-[460px] max-w-[calc(100%-32px)] -translate-x-1/2 -translate-y-1/2 ' +
          'rounded-[16px] border border-border bg-card px-8 py-8 text-center ' +
          'shadow-[0_24px_60px_rgba(0,0,0,0.12),0_6px_16px_rgba(0,0,0,0.04)]'
        }
        data-testid="settings-team-locked-overlay"
        role="group"
        aria-labelledby="team-locked-title"
      >
        <div
          className="mx-auto mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-[12px] bg-accent-soft text-accent"
          aria-hidden="true"
        >
          <Users size={24} strokeWidth={1.5} />
        </div>

        <div
          id="team-locked-title"
          className="mb-2 text-[21px] font-semibold leading-tight tracking-[-0.4px] text-text-default"
        >
          {t('title')}
        </div>

        <p className="mb-[22px] text-[13.5px] leading-[1.55] text-text-muted">
          {t('body')}
        </p>

        {/* Bullet list */}
        <div className="mb-6 flex flex-col gap-2.5 text-left">
          {[t('bullet1'), t('bullet2'), t('bullet3')].map((bullet) => (
            <div
              key={bullet}
              className="flex items-center gap-2.5 text-[13px] text-text-default"
            >
              <div
                className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] bg-success-soft text-success"
                aria-hidden="true"
              >
                <Check size={12} strokeWidth={2.4} />
              </div>
              {bullet}
            </div>
          ))}
        </div>

        <Link
          href="/admin/settings/billing"
          data-testid="settings-team-locked-cta"
          className={
            'inline-flex h-[40px] w-full items-center justify-center gap-[6px] rounded-[7px] ' +
            'border border-text-default bg-text-default px-[13px] text-[13.5px] font-medium text-white ' +
            'transition-colors hover:bg-text-default/90 active:bg-text-default/80 ' +
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'
          }
        >
          {t('cta')}
        </Link>

        <Link
          href="/admin/settings/billing"
          data-testid="settings-team-locked-compare"
          className="mt-2.5 inline-block text-[12px] font-medium text-text-muted transition-colors hover:text-text-default"
        >
          {t('comparePlans')}
        </Link>
      </div>
    </div>
  );
}

// Decorative heading rendered inside the blurred preview (aria-hidden).
function SettingsPageHeadingMock() {
  return (
    <div className="mb-7">
      <div className="text-[22px] font-semibold leading-[1.2] tracking-[-0.5px] text-text-default">
        Team
      </div>
      <div className="mt-1 text-[13px] text-text-muted">
        Invite people to help manage Café Linville.
      </div>
    </div>
  );
}
