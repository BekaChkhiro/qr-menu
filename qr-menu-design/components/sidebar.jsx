// Sidebar — 240px expanded / 64px collapsed
// Nav items with locked state based on plan

const dmTheme = {
  bg: '#FAFAF9',          // warm off-white page background
  card: '#FFFFFF',
  text: '#18181B',
  textMuted: '#71717A',
  textSubtle: '#A1A1AA',
  border: '#EAEAE6',       // ~hsl(40 6% 92%)
  borderSoft: '#F0EFEA',
  primary: '#1F2937',      // near-black slate
  primaryHover: '#111827',
  accent: '#B8633D',       // terracotta (warm cafe)
  accentSoft: '#F7EDE6',
  success: '#3F7E3F',      // restrained green
  successSoft: '#E8F0E8',
  warning: '#B87A1D',
  warningSoft: '#F7EFE0',
  danger: '#B8423D',
  dangerSoft: '#F7E6E5',
  chip: '#F4F3EE',
};

const SidebarNavItem = ({ icon: Icon, label, active, locked, collapsed, hasBadge }) => {
  const baseBg = active ? dmTheme.text : 'transparent';
  const baseColor = active ? '#fff' : dmTheme.textMuted;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: collapsed ? '9px 0' : '9px 12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      borderRadius: 8,
      background: baseBg,
      color: baseColor,
      fontSize: 13.5, fontWeight: active ? 550 : 450,
      cursor: 'pointer',
      position: 'relative',
    }}>
      <Icon size={17} sw={active ? 1.8 : 1.5} />
      {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
      {!collapsed && locked && <ILock size={13} style={{ color: dmTheme.textSubtle }} />}
      {!collapsed && hasBadge && (
        <span style={{
          background: active ? 'rgba(255,255,255,0.15)' : '#F4F3EE',
          color: active ? '#fff' : dmTheme.textMuted,
          padding: '1px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 600,
          letterSpacing: 0.2,
        }}>3</span>
      )}
    </div>
  );
};

const PlanBadge = ({ plan, collapsed }) => {
  const planConfig = {
    FREE:    { label: 'FREE',    color: dmTheme.textMuted, bg: '#F4F3EE' },
    STARTER: { label: 'STARTER', color: '#7A5A1E',          bg: '#F7EFE0' },
    PRO:     { label: 'PRO',     color: '#2F5F2F',          bg: '#E8F0E8' },
  }[plan] || { label: 'FREE', color: dmTheme.textMuted, bg: '#F4F3EE' };

  if (collapsed) {
    return (
      <div style={{
        margin: '0 auto 10px', padding: '4px 0', width: 36,
        background: planConfig.bg, color: planConfig.color,
        fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
        textAlign: 'center', borderRadius: 5,
      }}>{planConfig.label.slice(0, 3)}</div>
    );
  }
  return (
    <div style={{ padding: '12px 14px 10px', borderTop: `1px solid ${dmTheme.borderSoft}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          padding: '2px 7px', borderRadius: 4,
          background: planConfig.bg, color: planConfig.color,
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4,
        }}>{planConfig.label}</span>
        <span style={{ fontSize: 12, color: dmTheme.textMuted }}>plan</span>
      </div>
      {plan !== 'PRO' && (
        <button style={{
          width: '100%', padding: '7px 10px', background: '#fff',
          border: `1px solid ${dmTheme.border}`, borderRadius: 7,
          fontSize: 12.5, fontWeight: 550, color: dmTheme.text,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
        }}>
          <ISparkle size={13} style={{ color: dmTheme.accent }} />
          Upgrade to PRO
        </button>
      )}
    </div>
  );
};

const UserRow = ({ collapsed, name, email }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  if (collapsed) {
    return (
      <div style={{ padding: '10px 0 14px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: dmTheme.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600,
        }}>{initials}</div>
      </div>
    );
  }
  return (
    <div style={{
      padding: '10px 10px', display: 'flex', alignItems: 'center', gap: 10,
      borderTop: `1px solid ${dmTheme.borderSoft}`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: dmTheme.accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11.5, color: dmTheme.textMuted, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
      </div>
      <ILogout size={15} style={{ color: dmTheme.textMuted, cursor: 'pointer', flexShrink: 0 }} />
    </div>
  );
};

const DMSidebar = ({ collapsed = false, plan = 'STARTER', activePath = 'dashboard' }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IDashboard },
    { id: 'menus',     label: 'Menus',     icon: IMenus, badge: true },
    { id: 'settings',  label: 'Settings',  icon: ISettings },
  ];
  return (
    <aside style={{
      width: collapsed ? 64 : 240,
      background: '#FCFBF8',
      borderRight: `1px solid ${dmTheme.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', flexShrink: 0,
      transition: 'width 0.22s cubic-bezier(0.2, 0.8, 0.3, 1)',
    }}>
      {/* Logo */}
      <div style={{
        height: 56, padding: collapsed ? '0' : '0 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${dmTheme.borderSoft}`,
      }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: dmTheme.text, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, letterSpacing: -0.5,
            }}>D</div>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2 }}>
              Digital Menu
            </span>
          </div>
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: dmTheme.text, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700,
          }}>D</div>
        )}
      </div>

      {/* Org switcher (expanded only) */}
      {!collapsed && (
        <div style={{ padding: '10px 10px 6px' }}>
          <div style={{
            padding: '8px 10px', border: `1px solid ${dmTheme.border}`,
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 9,
            cursor: 'pointer', background: '#fff',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5,
              background: 'linear-gradient(135deg, #B8633D, #8A4428)',
              color: '#fff', fontSize: 10.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>CL</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 550, color: dmTheme.text, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Café Linville</div>
              <div style={{ fontSize: 10.5, color: dmTheme.textMuted, lineHeight: 1.1, marginTop: 2 }}>Tbilisi · Vera</div>
            </div>
            <IChevDown size={13} style={{ color: dmTheme.textMuted }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 8px' : '6px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const locked = item.lockedOn && item.lockedOn.includes(plan);
          return (
            <SidebarNavItem key={item.id}
              icon={item.icon}
              label={item.label}
              active={item.id === activePath}
              locked={locked}
              collapsed={collapsed}
              hasBadge={item.badge && !collapsed}
            />
          );
        })}
      </nav>

      {/* Plan badge + upgrade */}
      <PlanBadge plan={plan} collapsed={collapsed} />

      {/* User row */}
      <UserRow collapsed={collapsed} name="Nino Kapanadze" email="nino@cafelinville.ge" />
    </aside>
  );
};

Object.assign(window, { DMSidebar, dmTheme });
