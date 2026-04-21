// Section G.2 — Settings artboards: Team, Notifications, Security, Language, Menu settings

// ─── Artboard G4: Team (locked on Starter) ─────
const TeamLockedPreview = () => (
  <SettingsPage active="team" plan="STARTER" showSaveBar={false}>
    {/* This content is what sits *behind* the overlay, blurred. */}
    <PageHeading title="Team" subtitle="Invite people to help manage Café Linville." />

    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
      <Btn variant="primary" icon={IPlus} small>Invite member</Btn>
    </div>

    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 10, overflow: 'hidden',
    }}>
      {[
        { name: 'Nino Kapanadze', email: 'nino@cafelinville.ge', role: 'Owner',    status: 'Active' },
        { name: 'Giorgi Beridze', email: 'giorgi@cafelinville.ge', role: 'Manager', status: 'Active' },
        { name: 'Nino Tsereteli', email: 'nino@cafelinville.ge',  role: 'Staff',   status: 'Invited' },
      ].map((m, i) => (
        <div key={m.email} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px',
          borderBottom: i < 2 ? `1px solid ${dmTheme.border}` : 'none',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: dmTheme.accentSoft, color: dmTheme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600,
          }}>{m.name.split(' ').map(s => s[0]).join('')}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>{m.name}</div>
            <div style={{ fontSize: 12, color: dmTheme.textMuted }}>{m.email}</div>
          </div>
          <div style={{
            padding: '3px 8px', borderRadius: 4,
            background: '#FAFAF9', border: `1px solid ${dmTheme.border}`,
            fontSize: 11, fontWeight: 600, color: dmTheme.text,
          }}>{m.role}</div>
          <div style={{
            fontSize: 11.5, fontWeight: 600,
            color: m.status === 'Active' ? dmTheme.success : dmTheme.textMuted,
          }}>{m.status}</div>
        </div>
      ))}
    </div>
  </SettingsPage>
);

const SettingsTeamLocked = () => (
  <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    <div style={{ filter: 'blur(6px)', pointerEvents: 'none', height: '100%', opacity: 0.6 }}>
      <TeamLockedPreview />
    </div>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250, 250, 249, 0.4)' }} />
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 460, padding: 32,
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 16, textAlign: 'center',
      boxShadow: '0 24px 60px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: dmTheme.accentSoft, color: dmTheme.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px',
      }}>
        <IUsers size={24} />
      </div>
      <div style={{ fontSize: 21, fontWeight: 600, color: dmTheme.text, marginBottom: 8, letterSpacing: -0.4 }}>
        Invite your team
      </div>
      <div style={{ fontSize: 13.5, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 22 }}>
        Let managers update menus, and keep the owner login safe.
        Available on Pro and Business.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24, textAlign: 'left' }}>
        {[
          'Up to 5 seats on Pro, unlimited on Business',
          'Role-based permissions (Owner, Manager, Staff)',
          'Audit log of every menu change',
        ].map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: dmTheme.text }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: dmTheme.successSoft, color: dmTheme.success,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <ICheck size={12} sw={2.4} />
            </div>
            {b}
          </div>
        ))}
      </div>
      <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 13.5, marginBottom: 10 }}>
        Upgrade to Pro — 59₾/month
      </Btn>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, fontWeight: 500, cursor: 'pointer' }}>
        Compare all plans →
      </div>
    </div>
  </div>
);

// ─── Artboard G5: Team (unlocked on PRO) ─────
const RoleBadge = ({ role }) => {
  const palette = {
    Owner:   { bg: '#F5E9E1', fg: '#8B4A2B' },
    Manager: { bg: '#E8EEF5', fg: '#3B5B7F' },
    Staff:   { bg: '#F0F0EE', fg: '#5C5B58' },
  }[role] || { bg: '#F0F0EE', fg: '#5C5B58' };
  return (
    <div style={{
      padding: '3px 9px', borderRadius: 4,
      background: palette.bg, color: palette.fg,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
    }}>{role}</div>
  );
};

const SettingsTeamUnlocked = () => (
  <SettingsPage active="team" plan="PRO" showSaveBar={false}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26, gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.5 }}>
          Team
        </h2>
        <div style={{ fontSize: 13, color: dmTheme.textMuted, marginTop: 4 }}>
          3 of 5 seats used on your Pro plan.
          <span style={{ color: dmTheme.accent, fontWeight: 500, marginLeft: 4, cursor: 'pointer' }}>
            Add seats →
          </span>
        </div>
      </div>
      <Btn variant="primary" icon={IPlus}>Invite member</Btn>
    </div>

    {/* Pending invite row */}
    <div style={{
      padding: '12px 16px', marginBottom: 18,
      background: dmTheme.accentSoft, border: `1px solid ${dmTheme.accent}33`,
      borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: '#fff', color: dmTheme.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IMail size={14} />
      </div>
      <div style={{ flex: 1, fontSize: 13, color: dmTheme.text }}>
        <strong style={{ fontWeight: 600 }}>nino@cafelinville.ge</strong> has a pending invite · sent 2 days ago
      </div>
      <Btn small variant="ghost" icon={IRefresh}>Resend</Btn>
      <Btn small variant="ghost">Revoke</Btn>
    </div>

    {/* Member table */}
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 0.8fr 0.5fr',
        gap: 16, padding: '10px 16px',
        background: '#FCFBF8', borderBottom: `1px solid ${dmTheme.border}`,
        fontSize: 10.5, fontWeight: 700, color: dmTheme.textSubtle,
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>
        <div>Member</div>
        <div>Role</div>
        <div>Last active</div>
        <div></div>
      </div>
      {[
        { name: 'Nino Kapanadze',  email: 'nino@cafelinville.ge',   role: 'Owner',   last: 'Just now',  initials: 'NK', color: '#D4A574' },
        { name: 'Giorgi Beridze',  email: 'giorgi@cafelinville.ge', role: 'Manager', last: '2 hrs ago', initials: 'GB', color: '#8FA88A' },
        { name: 'Lali Chkheidze',  email: 'lali@cafelinville.ge',   role: 'Staff',   last: 'Yesterday', initials: 'LC', color: '#B89968' },
      ].map((m, i, arr) => (
        <div key={m.email} style={{
          display: 'grid', gridTemplateColumns: '1.8fr 0.9fr 0.8fr 0.5fr',
          gap: 16, padding: '14px 16px',
          alignItems: 'center',
          borderBottom: i < arr.length - 1 ? `1px solid ${dmTheme.border}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: m.color, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12.5, fontWeight: 600, flexShrink: 0,
            }}>{m.initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>{m.name}</div>
              <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>{m.email}</div>
            </div>
          </div>
          <div><RoleBadge role={m.role} /></div>
          <div style={{ fontSize: 12.5, color: dmTheme.textMuted }}>{m.last}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dmTheme.textSubtle, cursor: 'pointer',
            }}>
              <IMore size={15} />
            </div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ fontSize: 11.5, color: dmTheme.textSubtle, marginTop: 12 }}>
      <strong style={{ color: dmTheme.textMuted, fontWeight: 600 }}>Owner</strong> can manage billing · <strong style={{ color: dmTheme.textMuted, fontWeight: 600 }}>Manager</strong> edits menus · <strong style={{ color: dmTheme.textMuted, fontWeight: 600 }}>Staff</strong> view only.
    </div>
  </SettingsPage>
);

// ─── Artboard G6: Notifications ─────
const NotifRow = ({ title, hint, email, push, last }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: '1fr 70px 70px',
    gap: 20, padding: '14px 0',
    borderBottom: `1px solid ${dmTheme.borderSoft}`,
    alignItems: 'center',
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>{title}</div>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={email} /></div>
    <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle on={push} /></div>
  </div>
);

const SettingsNotifications = () => (
  <SettingsPage active="notifications">
    <PageHeading title="Notifications" subtitle="Choose what you hear about and where." />

    <Section label="Delivery channels">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SetField label="Email for alerts">
          <Input value="nino@cafelinville.ge" prefix={<IMail size={13} />} />
        </SetField>
        <SetField label="Push notifications" hint="Sent to the Café Linville mobile app">
          <div style={{
            padding: '9px 12px', background: '#fff',
            border: `1px solid ${dmTheme.border}`, borderRadius: 8,
            fontSize: 13, color: dmTheme.text,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <IPhone size={13} style={{ color: dmTheme.textMuted }} />
            <span style={{ flex: 1 }}>iPhone · "Nino's iPhone"</span>
            <span style={{ fontSize: 11.5, color: dmTheme.success, fontWeight: 600 }}>Paired</span>
          </div>
        </SetField>
      </div>
    </Section>

    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Menu activity</SectionLabel>
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, padding: '0 18px',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 70px',
          gap: 20, padding: '12px 0',
          borderBottom: `1px solid ${dmTheme.border}`,
          fontSize: 10.5, fontWeight: 700, color: dmTheme.textSubtle,
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}>
          <div>Event</div>
          <div style={{ textAlign: 'center' }}>Email</div>
          <div style={{ textAlign: 'center' }}>Push</div>
        </div>
        <NotifRow
          title="Someone edits a menu"
          hint="Heads up when a teammate updates prices or descriptions."
          email push={false}
        />
        <NotifRow
          title="Out-of-stock auto-hidden"
          hint="When an 86'd item gets hidden from the live menu."
          email={false} push
        />
        <NotifRow
          title="Weekly performance digest"
          hint="Top items, scans, and slow movers every Monday morning."
          email push={false}
        />
      </div>
    </div>

    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Billing & account</SectionLabel>
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, padding: '0 18px',
      }}>
        <NotifRow
          title="Invoice ready"
          hint="Sent when a new invoice is generated."
          email push={false}
        />
        <NotifRow
          title="Payment failed"
          hint="So you don't get downgraded unexpectedly. Can't be disabled."
          email={true} push={true}
        />
        <NotifRow
          title="New sign-in on your account"
          hint="Alert when a new device signs in as you."
          email push
        />
      </div>
    </div>
  </SettingsPage>
);

// ─── Artboard G7: Security ─────
const SessionRow = ({ device, location, browser, current, last, icon: Icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    borderBottom: `1px solid ${dmTheme.border}`,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: '#FCFBF8', color: dmTheme.textMuted,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1px solid ${dmTheme.border}`,
    }}>
      <Icon size={16} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>{device}</div>
        {current && (
          <div style={{
            padding: '2px 7px', background: dmTheme.successSoft, color: dmTheme.success,
            borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
          }}>THIS DEVICE</div>
        )}
      </div>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2 }}>
        {browser} · {location} · {last}
      </div>
    </div>
    {!current && <Btn small variant="ghost">Sign out</Btn>}
  </div>
);

const SettingsSecurity = () => (
  <SettingsPage active="security" showSaveBar={false}>
    <PageHeading title="Security" subtitle="Your password, two-factor auth, and active sessions." />

    <Section label="Password">
      <div style={{
        padding: 16, background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: dmTheme.successSoft, color: dmTheme.success,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IKey size={15} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>
            Password is strong
          </div>
          <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2 }}>
            Last changed 4 months ago
          </div>
        </div>
        <Btn small>Change password</Btn>
      </div>
    </Section>

    <Section label="Two-factor authentication" helper="Add a second step when signing in so a leaked password alone isn't enough.">
      <div style={{
        padding: 16, background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 10,
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: dmTheme.accentSoft, color: dmTheme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IShield size={15} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>
              Authenticator app
            </div>
            <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2 }}>
              Use Google Authenticator, 1Password, or similar
            </div>
          </div>
          <Toggle on />
        </div>
      </div>
      <div style={{
        padding: 16, background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#FCFBF8', color: dmTheme.textMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${dmTheme.border}`,
          }}>
            <IPhone size={15} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>
              SMS backup codes
            </div>
            <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2 }}>
              Fallback to +995 599 ·· ·· 56
            </div>
          </div>
          <Toggle on={false} />
        </div>
      </div>
    </Section>

    <Section label="Active sessions" helper="Sign out of any device you don't recognize.">
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        <SessionRow
          icon={IMonitor}
          device="MacBook Pro"
          browser="Chrome 121"
          location="Tbilisi, GE"
          last="Active now"
          current
        />
        <SessionRow
          icon={IPhone}
          device="iPhone 15"
          browser="Café Linville app"
          location="Tbilisi, GE"
          last="2 hours ago"
        />
        <SessionRow
          icon={IMonitor}
          device="Windows PC"
          browser="Firefox 119"
          location="Batumi, GE"
          last="3 days ago"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <Btn small variant="ghost" style={{ color: dmTheme.danger }}>
          Sign out of all other sessions
        </Btn>
      </div>
    </Section>

    <Section label="Danger zone">
      <div style={{
        padding: 16, background: '#fff',
        border: `1px solid ${dmTheme.danger}33`, borderRadius: 10,
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: dmTheme.dangerSoft, color: dmTheme.danger,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IWarning size={15} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>
            Delete this business
          </div>
          <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 3, lineHeight: 1.5 }}>
            Deletes all menus, QR codes, and analytics for Café Linville. Team members lose access immediately. This can't be undone.
          </div>
        </div>
        <DangerBtn small icon={ITrash}>Delete business</DangerBtn>
      </div>
    </Section>
  </SettingsPage>
);

// ─── Artboard G8: Language ─────
const LangToggleRow = ({ code, name, native, status, primary, flag }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    borderBottom: `1px solid ${dmTheme.border}`,
  }}>
    <div style={{
      width: 38, height: 28, borderRadius: 5,
      background: flag, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.4,
      flexShrink: 0,
    }}>{code}</div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>{name}</div>
        {primary && (
          <div style={{
            padding: '2px 7px', background: dmTheme.text, color: '#fff',
            borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
          }}>PRIMARY</div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 2 }}>
        {native} · {status}
      </div>
    </div>
    {!primary && (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Btn small variant="ghost">Set as primary</Btn>
        <Toggle on={status !== 'Disabled'} />
      </div>
    )}
    {primary && <Toggle on />}
  </div>
);

const SettingsLanguage = () => (
  <SettingsPage active="language" dirty>
    <PageHeading
      title="Language"
      subtitle="Set your admin interface language, and choose which languages your public menu supports."
    />

    <Section label="Admin interface" helper="Changes the dashboard for you only. Your team each pick their own.">
      <SetField label="Display language">
        <Select value="ქართული (Georgian)" />
      </SetField>
    </Section>

    <Section label="Menu languages" helper="Customers can switch between enabled languages on the QR menu. Items must be translated manually or with AI translate.">
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, overflow: 'hidden', marginBottom: 12,
      }}>
        <LangToggleRow code="KA" name="Georgian" native="ქართული" status="28/28 items translated" primary flag="#C02024" />
        <LangToggleRow code="EN" name="English"  native="English" status="28/28 items translated" flag="#1A3A7E" />
        <LangToggleRow code="RU" name="Russian"  native="Русский" status="9/28 items translated — needs attention" flag="#9B9B9B" />
        <LangToggleRow code="TR" name="Turkish"  native="Türkçe"  status="Disabled" flag="#B89968" />
      </div>

      <div style={{
        padding: 14, background: dmTheme.accentSoft,
        border: `1px solid ${dmTheme.accent}22`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#fff', color: dmTheme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ISparkle size={15} />
        </div>
        <div style={{ flex: 1, fontSize: 12.5, color: dmTheme.text, lineHeight: 1.45 }}>
          <strong style={{ fontWeight: 600 }}>AI translate</strong> can fill in 19 missing Russian translations using DeepL. 2 credits.
        </div>
        <Btn small variant="primary">Translate all</Btn>
      </div>
    </Section>

    <Section label="Currency & formatting">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SetField label="Currency">
          <Select value="Georgian Lari (₾)" />
        </SetField>
        <SetField label="Price format">
          <Select value="12.50 ₾" />
        </SetField>
      </div>
    </Section>
  </SettingsPage>
);

// ─── Artboard G9: Menu Settings tab (inside menu editor) ─────
// Uses the real EditorHeader (7 tabs, Settings active) and the full spec:
// Menu URL, Visibility (3 radio cards), Schedule, SEO & sharing, Advanced.

const RadioCard = ({ selected, icon: Icon, title, body, rightChildren }) => (
  <label style={{
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: 14, marginBottom: 10,
    background: '#fff',
    border: `${selected ? 2 : 1}px solid ${selected ? dmTheme.text : dmTheme.border}`,
    borderRadius: 10, cursor: 'pointer',
  }}>
    <div style={{
      width: 18, height: 18, borderRadius: '50%',
      border: `${selected ? 5 : 1.5}px solid ${selected ? dmTheme.text : dmTheme.border}`,
      background: '#fff', flexShrink: 0, marginTop: 1,
    }} />
    {Icon && <Icon size={16} style={{ color: dmTheme.textMuted, marginTop: 1 }} />}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>{title}</div>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 3, lineHeight: 1.45 }}>
        {body}
      </div>
      {rightChildren}
    </div>
  </label>
);

const MenuSettingsTab = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
    <EditorHeader activeTab="settings" />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 0 }}>
        {/* Main column */}
        <div style={{ flex: 1, overflow: 'hidden', paddingRight: 24 }}>
          <div style={{ maxWidth: 680 }}>

            {/* Menu URL */}
            <Section label="Menu URL" helper="The public address for this menu. Used in the QR code.">
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: '#fff', border: `1px solid ${dmTheme.border}`,
                borderRadius: 8, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '9px 12px', background: '#FCFBF8',
                  borderRight: `1px solid ${dmTheme.border}`,
                  fontSize: 13, color: dmTheme.textMuted,
                  fontFamily: 'ui-monospace, monospace',
                }}>cafelinville.ge/</div>
                <div style={{
                  flex: 1, padding: '9px 12px',
                  fontSize: 13, color: dmTheme.text,
                  fontFamily: 'ui-monospace, monospace',
                }}>main</div>
                <div style={{
                  padding: '9px 12px', borderLeft: `1px solid ${dmTheme.border}`,
                  color: dmTheme.textMuted, cursor: 'pointer',
                }}>
                  <ICopy size={13} />
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginTop: 8, padding: '8px 12px',
                background: dmTheme.warningSoft,
                border: `1px solid ${dmTheme.warning}22`, borderRadius: 8,
                fontSize: 12, color: dmTheme.warning,
              }}>
                <IWarning size={13} style={{ flexShrink: 0 }} />
                <span style={{ lineHeight: 1.45 }}>
                  Changing the URL will break any printed QR codes pointing to the old address.
                </span>
              </div>
            </Section>

            {/* Visibility */}
            <Section label="Visibility" helper="Who can see this menu.">
              <RadioCard
                selected
                icon={IGlobe}
                title="Published"
                body="Visible to everyone who has the URL or scans the QR code."
              />
              <RadioCard
                icon={ILock}
                title="Password protected"
                body="Only visitors who enter the password can view this menu."
              />
              <RadioCard
                icon={IEye}
                title="Private draft"
                body="Only you and your team can preview. Customers see 'Menu not available.'"
              />
            </Section>

            {/* Schedule */}
            <Section label="Schedule" helper="Optional — automatically publish or unpublish on a date. Useful for seasonal menus.">
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px',
                background: '#fff', border: `1px solid ${dmTheme.border}`,
                borderRadius: 10, marginBottom: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>
                    Auto-publish on a date
                  </div>
                  <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2 }}>
                    Queue this menu to go live at a specific time.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <div style={{ flex: 1 }}>
                      <Input value="Apr 15, 2026" prefix={<ICalendar size={13} />} small />
                    </div>
                    <div style={{ width: 110 }}>
                      <Input value="09:00" prefix={<IClock size={13} />} small />
                    </div>
                  </div>
                </div>
                <Toggle on />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                background: '#fff', border: `1px solid ${dmTheme.border}`,
                borderRadius: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>
                    Auto-unpublish on a date
                  </div>
                  <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2 }}>
                    Good for seasonal menus like "Summer brunch".
                  </div>
                </div>
                <Toggle on={false} />
              </div>
            </Section>

            {/* SEO */}
            <Section label="SEO & sharing" helper="How this menu previews when shared on WhatsApp, Instagram or Facebook.">
              <SetField label="Meta title" hint="Falls back to menu name if left blank.">
                <Input value="Main menu — Café Linville" />
              </SetField>
              <SetField label="Meta description" right={
                <span style={{ fontSize: 11, color: dmTheme.textSubtle, fontVariantNumeric: 'tabular-nums' }}>
                  98 / 160
                </span>
              }>
                <Textarea value="Small-batch coffee, khachapuri, and seasonal brunch on Rustaveli Avenue. Open daily." rows={3} />
              </SetField>
              <SetField label="Share image" hint="1200 × 630 recommended. PNG or JPG, max 2MB.">
                <div style={{
                  padding: 20, background: '#FCFBF8',
                  border: `1px dashed ${dmTheme.border}`, borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 8,
                    background: '#fff', border: `1px solid ${dmTheme.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dmTheme.textMuted,
                  }}>
                    <IImage size={18} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5, color: dmTheme.textMuted, lineHeight: 1.5 }}>
                    Drop an image here, or{' '}
                    <span style={{ color: dmTheme.accent, fontWeight: 550, cursor: 'pointer' }}>
                      browse
                    </span>
                  </div>
                </div>
              </SetField>
            </Section>

            {/* Advanced */}
            <Section label="Advanced">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Btn icon={ICopy}>Clone this menu</Btn>
                <Btn icon={IArchive}>Archive</Btn>
              </div>
              <div style={{
                padding: 16, background: '#fff',
                border: `1px solid ${dmTheme.danger}33`, borderRadius: 10,
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: dmTheme.dangerSoft, color: dmTheme.danger,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <IWarning size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>
                    Delete this menu
                  </div>
                  <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 3, lineHeight: 1.5 }}>
                    All items, categories, and QR-code traffic history for <strong style={{ fontWeight: 600 }}>Main menu — All day</strong> are deleted immediately. This can't be undone.
                  </div>
                </div>
                <DangerBtn small icon={ITrash}>Delete menu</DangerBtn>
              </div>
            </Section>

          </div>
        </div>

        {/* Right rail: live share-card preview, sticks above Schedule/SEO */}
        <div style={{ width: 320, flexShrink: 0, paddingTop: 8 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' }}>
            Live share preview
          </div>
          <div style={{
            background: '#fff', border: `1px solid ${dmTheme.border}`,
            borderRadius: 10, overflow: 'hidden',
          }}>
            {/* Card image */}
            <div style={{
              height: 168, background: 'linear-gradient(135deg, #8B6F3A 0%, #B8864C 55%, #D4A574 100%)',
              position: 'relative',
              display: 'flex', alignItems: 'flex-end', padding: 16,
            }}>
              <div style={{
                fontSize: 22, fontWeight: 700, color: '#fff',
                fontFamily: 'Georgia, serif', letterSpacing: -0.3,
                textShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}>Café Linville</div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10.5, color: dmTheme.textSubtle, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>
                cafelinville.ge
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: dmTheme.text, marginTop: 4, lineHeight: 1.3 }}>
                Main menu — Café Linville
              </div>
              <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 4, lineHeight: 1.45 }}>
                Small-batch coffee, khachapuri, and seasonal brunch on Rustaveli Avenue.
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: dmTheme.textSubtle, marginTop: 8, lineHeight: 1.45 }}>
            Rendered by WhatsApp, Instagram, iMessage and most apps using Open Graph tags.
          </div>
        </div>
      </div>

      <SaveBar dirty />
    </div>
  </div>
);

Object.assign(window, {
  SettingsTeamLocked, SettingsTeamUnlocked,
  SettingsNotifications, SettingsSecurity, SettingsLanguage,
  MenuSettingsTab, RoleBadge, RadioCard,
});
