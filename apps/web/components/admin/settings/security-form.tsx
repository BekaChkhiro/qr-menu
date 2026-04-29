'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import {
  Key,
  Shield,
  Smartphone,
  Monitor,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

import {
  useSessions,
  useUpdatePassword,
  useDeleteSession,
  useDeleteOtherSessions,
  useDeleteAccount,
} from '@/hooks/use-security';
import { useProfile } from '@/hooks/use-profile';

/* ─── Sub-components ─── */

function Section({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8" data-testid={`security-section-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="mb-1.5 text-[10.5px] font-bold uppercase leading-none tracking-[0.6px] text-text-subtle">
        {label}
      </div>
      {helper ? (
        <div className="mb-3 text-[12.5px] leading-[1.5] text-text-muted">
          {helper}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function IconTile({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  tone: 'success' | 'accent' | 'neutral' | 'danger';
}) {
  const toneMap = {
    success: 'bg-success-soft text-success',
    accent: 'bg-accent-soft text-accent',
    neutral:
      'border border-border bg-[#FCFBF8] text-text-muted',
    danger: 'bg-danger-soft text-danger',
  };
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}
    >
      <Icon size={15} strokeWidth={1.5} />
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 ${className ?? ''}`}
    >
      {children}
    </div>
  );
}

/* ─── Main component ─── */

export function SecurityForm() {
  const t = useTranslations('admin.settings.security');
  const tCommon = useTranslations('admin.settings');

  const { data: profile } = useProfile();
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions();
  const updatePassword = useUpdatePassword();
  const deleteSession = useDeleteSession();
  const deleteOtherSessions = useDeleteOtherSessions();
  const deleteAccount = useDeleteAccount();

  /* Password dialog state */
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});

  /* Danger zone state */
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const hasPassword = profile?.hasPassword ?? false;
  const businessName =
    profile?.name ?? profile?.email ?? 'Café Linville';

  const sessions = sessionsData?.sessions ?? [];
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  /* ── Password handlers ── */
  function openPwdDialog() {
    setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwdErrors({});
    setPwdOpen(true);
  }

  function validatePwd(): boolean {
    const errs: Record<string, string> = {};
    if (!pwdForm.currentPassword) {
      errs.currentPassword = t('password.errors.currentRequired');
    }
    if (!pwdForm.newPassword) {
      errs.newPassword = t('password.errors.newRequired');
    } else if (pwdForm.newPassword.length < 8) {
      errs.newPassword = t('password.errors.tooShort');
    }
    if (!pwdForm.confirmPassword) {
      errs.confirmPassword = t('password.errors.confirmRequired');
    } else if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      errs.confirmPassword = t('password.errors.mismatch');
    }
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleChangePassword() {
    if (!validatePwd()) return;
    try {
      await updatePassword.mutateAsync({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword,
      });
      toast.success(t('password.success'));
      setPwdOpen(false);
      // Force re-login since sessionVersion was bumped
      signOut({ callbackUrl: '/login' });
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? t('password.error');
      toast.error(message);
    }
  }

  /* ── Session handlers ── */
  async function handleSignOutSession(id: string) {
    try {
      await deleteSession.mutateAsync(id);
      toast.success(t('sessions.signOutSuccess'));
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? t('sessions.signOutError');
      toast.error(message);
    }
  }

  async function handleSignOutAllOthers() {
    try {
      await deleteOtherSessions.mutateAsync();
      toast.success(t('sessions.signOutAllSuccess'));
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? t('sessions.signOutError');
      toast.error(message);
    }
  }

  /* ── Danger zone handlers ── */
  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      toast.success(t('danger.deleteSuccess'));
      signOut({ callbackUrl: '/' });
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? t('danger.deleteError');
      toast.error(message);
    }
  }

  return (
    <div data-testid="settings-security-form">
      {/* ═══ Password ═══ */}
      <Section label={t('password.sectionLabel')}>
        <Card>
          <div className="flex items-center gap-3.5">
            <IconTile icon={Key} tone="success" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-text-default">
                {hasPassword
                  ? t('password.statusSet')
                  : t('password.statusNone')}
              </div>
              <div className="mt-0.5 text-[12px] text-text-muted">
                {hasPassword
                  ? t('password.lastChanged', { when: '—' })
                  : t('password.setHint')}
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={openPwdDialog}
              data-testid="security-change-password-btn"
            >
              {t('password.changeBtn')}
            </Button>
          </div>
        </Card>
      </Section>

      {/* ═══ Two-factor auth (UI only) ═══ */}
      <Section
        label={t('twoFactor.sectionLabel')}
        helper={t('twoFactor.helper')}
      >
        <Card className="mb-2.5">
          <div className="flex items-center gap-3.5">
            <IconTile icon={Shield} tone="accent" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-text-default">
                {t('twoFactor.authenticator.title')}
              </div>
              <div className="mt-0.5 text-[12px] text-text-muted">
                {t('twoFactor.authenticator.body')}
              </div>
            </div>
            <Switch
              checked={false}
              disabled
              aria-label={t('twoFactor.authenticator.aria')}
              data-testid="security-2fa-auth-toggle"
            />
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3.5">
            <IconTile icon={Smartphone} tone="neutral" />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-text-default">
                {t('twoFactor.sms.title')}
              </div>
              <div className="mt-0.5 text-[12px] text-text-muted">
                {t('twoFactor.sms.body', {
                  phone: profile?.phone ?? '—',
                })}
              </div>
            </div>
            <Switch
              checked={false}
              disabled
              aria-label={t('twoFactor.sms.aria')}
              data-testid="security-2fa-sms-toggle"
            />
          </div>
        </Card>
      </Section>

      {/* ═══ Active sessions ═══ */}
      <Section
        label={t('sessions.sectionLabel')}
        helper={t('sessions.helper')}
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3.5 border-b border-border px-4 py-3.5 last:border-b-0"
                data-testid={`security-session-row-${s.id}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-[#FCFBF8] text-text-muted">
                  <Monitor size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[13px] font-medium text-text-default">
                      {s.device}
                    </div>
                    {s.isCurrent ? (
                      <span className="rounded bg-success-soft px-[7px] py-0.5 text-[10px] font-bold uppercase tracking-[0.4px] text-success">
                        {t('sessions.thisDevice')}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-[12px] text-text-muted">
                    {s.browser} · {s.location} · {s.lastActive}
                  </div>
                </div>
                {!s.isCurrent ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => handleSignOutSession(s.id)}
                    disabled={deleteSession.isPending}
                    data-testid={`security-session-signout-${s.id}`}
                  >
                    {deleteSession.isPending ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {t('sessions.signOut')}
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
        {otherSessions.length > 0 ? (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:bg-danger-soft hover:text-danger"
              onClick={handleSignOutAllOthers}
              disabled={deleteOtherSessions.isPending}
              data-testid="security-signout-all-others"
            >
              {deleteOtherSessions.isPending ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : null}
              {t('sessions.signOutAll')}
            </Button>
          </div>
        ) : null}
      </Section>

      {/* ═══ Danger zone ═══ */}
      <Section label={t('danger.sectionLabel')}>
        <div className="rounded-lg border border-danger/20 bg-card p-4">
          <div className="flex items-start gap-3.5">
            <IconTile icon={AlertTriangle} tone="danger" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-text-default">
                {t('danger.title', { name: businessName })}
              </div>
              <div className="mt-[3px] text-[12px] leading-[1.5] text-text-muted">
                {t('danger.body', { name: businessName })}
              </div>
            </div>
            <AlertDialog
              open={deleteConfirmOpen}
              onOpenChange={setDeleteConfirmOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="shrink-0"
                  data-testid="security-delete-business-btn"
                >
                  <Trash2 size={14} strokeWidth={1.5} className="mr-1.5" />
                  {t('danger.deleteBtn')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="security-delete-dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('danger.confirmTitle')}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('danger.confirmBody', { name: businessName })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-2">
                  <label className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
                    {t('danger.confirmInputLabel')}
                  </label>
                  <Input
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={t('danger.confirmInputPlaceholder')}
                    data-testid="security-delete-confirm-input"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setDeleteInput('')}
                    data-testid="security-delete-cancel"
                  >
                    {tCommon('cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    asChild
                  >
                    <Button
                      variant="destructive"
                      disabled={deleteInput !== 'DELETE' || deleteAccount.isPending}
                      onClick={handleDeleteAccount}
                      data-testid="security-delete-confirm-btn"
                    >
                      {deleteAccount.isPending ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 size={14} strokeWidth={1.5} className="mr-1.5" />
                      )}
                      {t('danger.confirmBtn')}
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Section>

      {/* ═══ Change Password Dialog ═══ */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent data-testid="security-password-dialog">
          <DialogHeader>
            <DialogTitle>{t('password.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('password.dialogBody')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
                {t('password.current')}
              </label>
              <Input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) =>
                  setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                placeholder={t('password.currentPlaceholder')}
                data-testid="security-password-current"
              />
              {pwdErrors.currentPassword ? (
                <p className="mt-1 text-[11.5px] text-danger">
                  {pwdErrors.currentPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
                {t('password.new')}
              </label>
              <Input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) =>
                  setPwdForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                placeholder={t('password.newPlaceholder')}
                data-testid="security-password-new"
              />
              {pwdErrors.newPassword ? (
                <p className="mt-1 text-[11.5px] text-danger">
                  {pwdErrors.newPassword}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-[12.5px] font-semibold text-text-default">
                {t('password.confirm')}
              </label>
              <Input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) =>
                  setPwdForm((p) => ({
                    ...p,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder={t('password.confirmPlaceholder')}
                data-testid="security-password-confirm"
              />
              {pwdErrors.confirmPassword ? (
                <p className="mt-1 text-[11.5px] text-danger">
                  {pwdErrors.confirmPassword}
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPwdOpen(false)}
              data-testid="security-password-cancel"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={updatePassword.isPending}
              data-testid="security-password-save"
            >
              {updatePassword.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : null}
              {t('password.saveBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
