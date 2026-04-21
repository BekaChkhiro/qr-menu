// Reusable admin shell — sidebar + top bar + scrollable content slot
// Also: AdminTopBar with configurable breadcrumbs and primary action

const AdminTopBar = ({ crumbs = [], primary }) => (
  <div style={{
    height: 56, borderBottom: `1px solid ${dmTheme.border}`,
    display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    background: '#FCFBF8', flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <IChevRight size={13} style={{ color: dmTheme.textSubtle }} />}
          <span style={{
            color: i === crumbs.length - 1 ? dmTheme.text : dmTheme.textMuted,
            fontWeight: i === crumbs.length - 1 ? 550 : 400,
          }}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', width: 240,
      border: `1px solid ${dmTheme.border}`, borderRadius: 8, background: '#fff',
    }}>
      <ISearch size={14} style={{ color: dmTheme.textSubtle }} />
      <span style={{ fontSize: 13, color: dmTheme.textSubtle, flex: 1 }}>Search…</span>
      <span style={{
        fontSize: 10, color: dmTheme.textSubtle,
        border: `1px solid ${dmTheme.border}`, borderRadius: 4,
        padding: '1px 5px', fontFamily: 'ui-monospace, monospace',
      }}>⌘K</span>
    </div>
    <div style={{ position: 'relative', padding: 8, cursor: 'pointer' }}>
      <IBell size={17} style={{ color: dmTheme.text }} />
      <span style={{
        position: 'absolute', top: 5, right: 5,
        width: 7, height: 7, borderRadius: '50%',
        background: dmTheme.accent, border: '1.5px solid #FCFBF8',
      }} />
    </div>
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: dmTheme.accent, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11.5, fontWeight: 600,
    }}>NK</div>
  </div>
);

const AdminShell = ({ children, plan = 'STARTER', collapsed = false, activePath, crumbs, width = 1440, height = 980 }) => (
  <div style={{
    width, height,
    display: 'flex', background: dmTheme.bg,
    fontSize: 14, color: dmTheme.text, overflow: 'hidden',
  }}>
    <DMSidebar collapsed={collapsed} plan={plan} activePath={activePath} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <AdminTopBar crumbs={crumbs} />
      <div style={{ flex: 1, overflow: 'hidden', padding: 24 }}>
        {children}
      </div>
    </div>
  </div>
);

// Primary / secondary / ghost button
const Btn = ({ variant = 'secondary', icon: Icon, children, style, small }) => {
  const v = {
    primary:   { bg: dmTheme.text,        color: '#fff', border: 'transparent' },
    secondary: { bg: '#fff',              color: dmTheme.text, border: dmTheme.border },
    ghost:     { bg: 'transparent',       color: dmTheme.text, border: 'transparent' },
    accent:    { bg: dmTheme.accent,      color: '#fff', border: 'transparent' },
  }[variant];
  return (
    <button style={{
      padding: small ? '5px 10px' : '7px 12px',
      background: v.bg, color: v.color,
      border: `1px solid ${v.border}`, borderRadius: 8,
      fontSize: small ? 12 : 13, fontWeight: 550,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {Icon && <Icon size={small ? 12.5 : 14} />}
      {children}
    </button>
  );
};

Object.assign(window, { AdminShell, AdminTopBar, Btn });
