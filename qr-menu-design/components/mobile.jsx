// Mobile 375px dashboard composition

const MobileTopBar = () => (
  <div style={{
    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
    background: '#FCFBF8', borderBottom: `1px solid ${dmTheme.border}`,
  }}>
    <div style={{
      width: 28, height: 28, borderRadius: 7,
      background: dmTheme.text, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700,
    }}>D</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, lineHeight: 1.1 }}>Café Linville</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text, lineHeight: 1.2 }}>Dashboard</div>
    </div>
    <div style={{ position: 'relative', padding: 4 }}>
      <IBell size={18} />
      <span style={{
        position: 'absolute', top: 3, right: 3,
        width: 6, height: 6, borderRadius: '50%',
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

const MobileBottomTab = () => {
  const tabs = [
    { id: 'dashboard', label: 'Home',     icon: IDashboard, active: true },
    { id: 'menus',     label: 'Menus',    icon: IMenus },
    { id: 'analytics', label: 'Analytics', icon: IAnalytics },
    { id: 'settings',  label: 'Settings', icon: ISettings },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#FCFBF8', borderTop: `1px solid ${dmTheme.border}`,
      display: 'flex', padding: '8px 8px 18px',
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 3, padding: '6px 0',
          color: t.active ? dmTheme.text : dmTheme.textMuted,
        }}>
          <t.icon size={19} sw={t.active ? 1.8 : 1.5} />
          <span style={{ fontSize: 10.5, fontWeight: t.active ? 600 : 500 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
};

const MobileUsageCard = ({ label, used, total }) => {
  const isInf = total === '∞';
  const pct = isInf ? 20 : Math.min(100, (used / total) * 100);
  return (
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 10, padding: '10px 12px',
    }}>
      <div style={{ fontSize: 11, color: dmTheme.textMuted, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 8,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.3 }}>{used}</span>
        <span style={{ fontSize: 11, color: dmTheme.textMuted }}>/ {total}</span>
      </div>
      <div style={{ height: 3, background: '#F0EFEA', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: dmTheme.text, borderRadius: 2 }} />
      </div>
    </div>
  );
};

const MobileDashboard = () => (
  <div style={{
    width: 375, height: 812, background: dmTheme.bg,
    position: 'relative', overflow: 'hidden',
    fontFamily: 'inherit',
  }}>
    <MobileTopBar />
    <div style={{
      height: 'calc(100% - 50px - 64px)', overflow: 'hidden',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.4, lineHeight: 1.2 }}>
          Good afternoon, Nino 👋
        </h1>
        <p style={{ fontSize: 12.5, color: dmTheme.textMuted, margin: '3px 0 0' }}>
          Here's what's happening today.
        </p>
      </div>

      {/* Primary CTA */}
      <button style={{
        padding: '11px 14px', background: dmTheme.text, color: '#fff',
        border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 550,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      }}>
        <IPlus size={15} sw={2.2} />
        Create new menu
      </button>

      {/* Usage 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MobileUsageCard label="Menus" used={2} total={3} />
        <MobileUsageCard label="Categories" used={14} total="∞" />
        <MobileUsageCard label="Products" used={87} total="∞" />
        <MobileUsageCard label="Storage" used="340" total="1GB" />
      </div>

      {/* Analytics mini */}
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 12, padding: '14px 14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: dmTheme.textMuted, fontWeight: 500 }}>Menu views · 30d</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>12,847</span>
              <span style={{
                padding: '1px 6px', background: dmTheme.successSoft,
                color: dmTheme.success, borderRadius: 4,
                fontSize: 10.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2,
              }}>
                <IArrowUp size={9} sw={2.2} />18.2%
              </span>
            </div>
          </div>
        </div>
        {/* mini chart */}
        <svg width="100%" height="50" viewBox="0 0 340 50" style={{ display: 'block' }}>
          <path d="M 0 42 Q 30 38, 50 34 T 100 30 Q 130 28, 150 22 T 200 18 Q 230 14, 250 12 T 320 6"
            fill="none" stroke={dmTheme.accent} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 0 42 Q 30 38, 50 34 T 100 30 Q 130 28, 150 22 T 200 18 Q 230 14, 250 12 T 320 6 L 320 50 L 0 50 Z"
            fill={dmTheme.accent} fillOpacity="0.1" />
        </svg>
      </div>

      {/* Menus list compact */}
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text, margin: 0, flex: 1 }}>Your menus</h2>
          <span style={{ fontSize: 11.5, color: dmTheme.textMuted }}>4</span>
        </div>
        {menuRows.slice(0, 3).map((r, i) => (
          <div key={i} style={{
            padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            borderTop: `1px solid ${dmTheme.borderSoft}`,
          }}>
            <MenuThumb tone={r.thumb} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 550, color: dmTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 11, color: dmTheme.textMuted, marginTop: 1 }}>
                {r.today} today · {r.edited}
              </div>
            </div>
            <StatusPill status={r.status} />
          </div>
        ))}
      </div>
    </div>
    <MobileBottomTab />
    {/* Home bar */}
    <div style={{
      position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
      width: 120, height: 4, borderRadius: 2, background: dmTheme.text, opacity: 0.9,
    }} />
  </div>
);

Object.assign(window, { MobileDashboard });
