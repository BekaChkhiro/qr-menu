// Section G — Settings (shared shell + shared primitives)

// ─── Nav rail ─────
const SettingsNavItem = ({ icon: Icon, label, active, badge }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '8px 12px',
    borderRadius: 6,
    background: active ? '#FCFBF8' : 'transparent',
    borderLeft: `2px solid ${active ? dmTheme.accent : 'transparent'}`,
    paddingLeft: active ? 10 : 12,
    color: active ? dmTheme.text : dmTheme.textMuted,
    fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
    position: 'relative',
  }}>
    <Icon size={14} style={{ color: active ? dmTheme.text : dmTheme.textSubtle }} sw={active ? 1.9 : 1.5} />
    <span style={{ flex: 1 }}>{label}</span>
    {badge && (
      <span style={{
        padding: '0px 5px', borderRadius: 3,
        background: '#E8F0E8', color: dmTheme.success,
        fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
      }}>{badge}</span>
    )}
  </div>
);

const SettingsNav = ({ active = 'profile', plan = 'STARTER' }) => {
  const personal = [
    { id: 'profile',       label: 'Profile',       icon: IUser },
    { id: 'notifications', label: 'Notifications', icon: IBell },
    { id: 'security',      label: 'Security',      icon: IShield },
    { id: 'language',      label: 'Language',      icon: IGlobe },
  ];
  const business = [
    { id: 'business-info', label: 'Business info', icon: IBuilding },
    { id: 'billing',       label: 'Plan & billing',icon: ICreditCard },
    { id: 'team',          label: 'Team',          icon: IUsers,
      badge: plan !== 'PRO' ? 'PRO' : null },
  ];
  const GroupLabel = ({ children }) => (
    <div style={{
      padding: '0 14px', marginBottom: 6,
      fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6,
      color: dmTheme.textSubtle, textTransform: 'uppercase',
    }}>{children}</div>
  );
  return (
    <div style={{
      width: 220, flexShrink: 0, background: '#FCFBF8',
      borderRight: `1px solid ${dmTheme.border}`,
      padding: '22px 12px', display: 'flex', flexDirection: 'column', gap: 2,
      height: '100%', overflow: 'hidden',
    }}>
      <GroupLabel>Personal</GroupLabel>
      {personal.map(item => (
        <SettingsNavItem key={item.id} {...item} active={item.id === active} />
      ))}
      <div style={{ height: 16 }} />
      <GroupLabel>Business</GroupLabel>
      {business.map(item => (
        <SettingsNavItem key={item.id} {...item} active={item.id === active} />
      ))}
    </div>
  );
};

// ─── Section wrappers ─────
const PageHeading = ({ title, subtitle }) => (
  <div style={{ marginBottom: 28 }}>
    <h2 style={{
      fontSize: 22, fontWeight: 600, color: dmTheme.text, margin: 0,
      letterSpacing: -0.5, lineHeight: 1.2,
    }}>{title}</h2>
    {subtitle && (
      <div style={{ fontSize: 13, color: dmTheme.textMuted, marginTop: 4 }}>
        {subtitle}
      </div>
    )}
  </div>
);

const SectionLabel = ({ children, helper }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      fontSize: 11.5, fontWeight: 600, color: dmTheme.text,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>{children}</div>
    {helper && (
      <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginTop: 3 }}>
        {helper}
      </div>
    )}
  </div>
);

const Section = ({ label, helper, children }) => (
  <div style={{ marginBottom: 28 }}>
    <SectionLabel helper={helper}>{label}</SectionLabel>
    {children}
  </div>
);

// ─── Form field (labelled) ─────
const SetField = ({ label, hint, right, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 6,
    }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: dmTheme.text }}>
        {label}
      </label>
      {right}
    </div>
    {children}
    {hint && (
      <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 5, lineHeight: 1.4 }}>
        {hint}
      </div>
    )}
  </div>
);

// ─── Textarea look ─────
const Textarea = ({ value, rows = 3 }) => (
  <div style={{
    padding: '9px 12px',
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 8, fontSize: 13.5, color: dmTheme.text,
    lineHeight: 1.5, minHeight: rows * 20,
    whiteSpace: 'pre-wrap',
  }}>{value}</div>
);

// ─── Select look ─────
const Select = ({ value, prefix, style = {} }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 11px',
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 8, fontSize: 13, color: dmTheme.text,
    cursor: 'pointer', ...style,
  }}>
    {prefix}
    <span style={{ flex: 1 }}>{value}</span>
    <IChevDown size={14} style={{ color: dmTheme.textMuted }} />
  </div>
);

// ─── Destructive button (outlined red) ─────
const DangerBtn = ({ children, icon: Icon, small }) => (
  <button style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '5px 10px' : '7px 12px',
    background: '#fff', border: `1px solid ${dmTheme.danger}`,
    color: dmTheme.danger,
    borderRadius: 7, fontSize: small ? 12 : 13, fontWeight: 550,
    cursor: 'pointer', fontFamily: 'inherit',
  }}>
    {Icon && <Icon size={13} />}
    {children}
  </button>
);

// ─── Sticky save bar ─────
const SaveBar = ({ dirty = false }) => (
  <div style={{
    height: 64, flexShrink: 0, background: '#fff',
    borderTop: `1px solid ${dmTheme.border}`,
    padding: '0 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 20 }}>
      {dirty && (
        <>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: dmTheme.accent,
            boxShadow: `0 0 0 3px ${dmTheme.accentSoft}`,
          }} />
          <span style={{ fontSize: 12.5, color: dmTheme.text, fontWeight: 500 }}>
            You have unsaved changes
          </span>
        </>
      )}
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <Btn>Discard</Btn>
      <Btn variant="primary">Save changes</Btn>
    </div>
  </div>
);

// ─── Settings shell ─────
const SettingsPage = ({ active = 'profile', plan = 'STARTER', dirty = false, children, showSaveBar = true }) => (
  <div style={{ display: 'flex', width: 'calc(100% + 48px)', height: 'calc(100% + 48px)', overflow: 'hidden', margin: -24 }}>
    {/* Wait — AdminShell already has padding 24; we need to fill it. */}
    {/* Actually, AdminShell content area has padding: 24. We want the nav rail to go edge-to-edge.
        We'll use margin trick here: -24 to pull flush, then padding inside panel restores safe area. */}
    <SettingsNav active={active} plan={plan} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'hidden', padding: '32px 32px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 720 }}>
          {children}
        </div>
      </div>
      {showSaveBar && <SaveBar dirty={dirty} />}
    </div>
  </div>
);

// Generic locked-section overlay for tier gating inside settings content area
const SettingsLockedOverlay = ({
  icon: Icon = IUsers,
  title = 'Team is a PRO feature',
  body = '',
  bullets = [],
  cta = 'Upgrade to PRO — 59₾/month',
  secondary = 'Compare all plans',
  behind = null,
}) => (
  <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    {behind && (
      <div style={{ filter: 'blur(5px)', opacity: 0.45, pointerEvents: 'none', height: '100%' }}>
        {behind}
      </div>
    )}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250, 250, 249, 0.35)' }} />
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 480, padding: 32,
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 16, textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12,
        background: dmTheme.accentSoft, color: dmTheme.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        <Icon size={22} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: dmTheme.text, marginBottom: 8, letterSpacing: -0.4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13.5, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 20 }}>
        {body}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22, textAlign: 'left' }}>
        {bullets.map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: dmTheme.text }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: dmTheme.successSoft, color: dmTheme.success,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ICheck size={12} sw={2.4} />
            </div>
            {b}
          </div>
        ))}
      </div>
      <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5, marginBottom: 10 }}>
        {cta}
      </Btn>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, fontWeight: 500, cursor: 'pointer' }}>
        {secondary} →
      </div>
    </div>
  </div>
);

Object.assign(window, {
  SettingsPage, SettingsNav, PageHeading, SectionLabel, Section, SetField,
  Select, Textarea, DangerBtn, SaveBar, SettingsLockedOverlay,
});
