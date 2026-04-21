// Component library reference board — Part B
// Groups: Overlays, Navigation, Utility, Tokens

// ─── OVERLAYS ─────

const CLDialog = () => (
  <div style={{
    width: 440, background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 12,
    boxShadow: '0 20px 50px rgba(0,0,0,0.12)', overflow: 'hidden',
  }}>
    <div style={{ padding: '20px 22px 14px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: dmTheme.dangerSoft, color: dmTheme.danger,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <IWarning size={16} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: dmTheme.text }}>
        Delete this menu?
      </div>
      <div style={{ fontSize: 13, color: dmTheme.textMuted, marginTop: 6, lineHeight: 1.5 }}>
        All 28 items, categories, and QR-code history will be deleted immediately. This can't be undone.
      </div>
    </div>
    <div style={{
      padding: '12px 22px', background: '#FCFBF8',
      borderTop: `1px solid ${dmTheme.border}`,
      display: 'flex', justifyContent: 'flex-end', gap: 8,
    }}>
      <CLBtn variant="secondary">Cancel</CLBtn>
      <CLBtn variant="destructive">Delete menu</CLBtn>
    </div>
  </div>
);

const CLDrawer = () => (
  <div style={{
    width: 360, height: 320, background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{
      padding: '14px 18px', borderBottom: `1px solid ${dmTheme.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, textTransform: 'uppercase' }}>Editing item</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: dmTheme.text, marginTop: 2 }}>Khachapuri Adjaruli</div>
      </div>
      <IX size={15} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
    </div>
    <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: dmTheme.textMuted, marginBottom: 5 }}>Name</div>
        <CLInput value="Khachapuri Adjaruli" />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: dmTheme.textMuted, marginBottom: 5 }}>Price</div>
        <CLInput value="18" suffix="₾" />
      </div>
    </div>
    <div style={{
      padding: '12px 18px', background: '#FCFBF8',
      borderTop: `1px solid ${dmTheme.border}`,
      display: 'flex', justifyContent: 'flex-end', gap: 8,
    }}>
      <CLBtn variant="secondary" size="sm">Cancel</CLBtn>
      <CLBtn variant="primary" size="sm">Save</CLBtn>
    </div>
  </div>
);

const CLPopover = () => (
  <div style={{
    width: 240, background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 14,
    position: 'relative',
  }}>
    <div style={{
      position: 'absolute', top: -6, left: 24,
      width: 12, height: 12, background: '#fff',
      borderLeft: `1px solid ${dmTheme.border}`, borderTop: `1px solid ${dmTheme.border}`,
      transform: 'rotate(45deg)',
    }} />
    <div style={{ fontSize: 12.5, fontWeight: 600, color: dmTheme.text, marginBottom: 4 }}>Price range</div>
    <div style={{ fontSize: 11.5, color: dmTheme.textMuted, lineHeight: 1.45, marginBottom: 10 }}>
      Shown on your menu as dollar signs. Customers use this to set expectations.
    </div>
    <CLSegmented items={['$', '$$', '$$$', '$$$$']} active={1} />
  </div>
);

const CLTooltip = () => (
  <div style={{
    display: 'inline-block', padding: '5px 9px',
    background: dmTheme.text, color: '#fff',
    borderRadius: 5, fontSize: 11.5, fontWeight: 500,
    position: 'relative',
  }}>
    Save · ⌘S
    <div style={{
      position: 'absolute', bottom: -3, left: 20,
      width: 8, height: 8, background: dmTheme.text,
      transform: 'rotate(45deg)',
    }} />
  </div>
);

const CLKebab = () => (
  <div style={{
    width: 180, background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 8,
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)', padding: 4,
  }}>
    {[
      { l: 'Edit', I: IEdit },
      { l: 'Duplicate', I: ICopy },
      { l: 'Move to…', I: IArrowRight },
    ].map(m => (
      <div key={m.l} style={{
        padding: '7px 10px', borderRadius: 5,
        display: 'flex', alignItems: 'center', gap: 9,
        fontSize: 13, color: dmTheme.text, cursor: 'pointer',
      }}>
        <m.I size={13} style={{ color: dmTheme.textMuted }} />
        {m.l}
      </div>
    ))}
    <div style={{ height: 1, background: dmTheme.border, margin: '4px 0' }} />
    <div style={{
      padding: '7px 10px', borderRadius: 5,
      display: 'flex', alignItems: 'center', gap: 9,
      fontSize: 13, color: dmTheme.danger, cursor: 'pointer',
    }}>
      <ITrash size={13} />
      Delete
    </div>
  </div>
);

const CLPalette = () => (
  <div style={{
    width: 460, background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 12,
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)', overflow: 'hidden',
  }}>
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${dmTheme.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <ISearch size={15} style={{ color: dmTheme.textMuted }} />
      <input readOnly value="khacha" style={{
        flex: 1, border: 'none', outline: 'none',
        fontSize: 14, color: dmTheme.text, fontFamily: 'inherit',
      }} />
      <CLKbd>esc</CLKbd>
    </div>
    <div style={{ padding: 6 }}>
      <div style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        Items
      </div>
      {[
        { l: 'Khachapuri Adjaruli', sub: 'Main menu · Breads', selected: true },
        { l: 'Khachapuri Imeruli',  sub: 'Main menu · Breads' },
      ].map(r => (
        <div key={r.l} style={{
          padding: '8px 10px', borderRadius: 6,
          background: r.selected ? dmTheme.chip : 'transparent',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <IUtensils size={14} style={{ color: dmTheme.textMuted }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: dmTheme.text }}>{r.l}</div>
            <div style={{ fontSize: 11, color: dmTheme.textMuted, marginTop: 1 }}>{r.sub}</div>
          </div>
          {r.selected && <IArrowRight size={12} style={{ color: dmTheme.textMuted }} />}
        </div>
      ))}
      <div style={{ padding: '4px 10px 4px', marginTop: 4, fontSize: 10, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        Actions
      </div>
      <div style={{ padding: '8px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <IPlus size={14} style={{ color: dmTheme.textMuted }} />
        <div style={{ flex: 1, fontSize: 13, color: dmTheme.text }}>Create item "khacha"…</div>
      </div>
    </div>
    <div style={{
      padding: '8px 14px', background: '#FCFBF8',
      borderTop: `1px solid ${dmTheme.border}`,
      display: 'flex', alignItems: 'center', gap: 14,
      fontSize: 11, color: dmTheme.textMuted,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CLKbd small>↑↓</CLKbd> navigate</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CLKbd small>↵</CLKbd> open</span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
        <CLKbd small>⌘</CLKbd><CLKbd small>K</CLKbd>
      </span>
    </div>
  </div>
);

const OverlaysGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>05 · Overlays</div>

    {clSub('Dialog · destructive confirm')}
    <div style={clRow}>
      <CLDialog />
    </div>

    {clSub('Drawer (side panel)')}
    <div style={clRow}>
      <CLDrawer />
    </div>

    {clSub('Popover')}
    <div style={{ ...clRow, paddingTop: 16 }}>
      <CLPopover />
    </div>

    {clSub('Tooltip')}
    <div style={clRow}>
      <CLTooltip />
    </div>

    {clSub('Kebab / contextual menu')}
    <div style={clRow}>
      <CLKebab />
    </div>

    {clSub('⌘K command palette')}
    <div style={clRow}>
      <CLPalette />
    </div>
  </div>
);

// ─── NAVIGATION ─────

const CLSidebarItem = ({ state = 'default', locked, icon: Icon = IMenus, label = 'Menus' }) => {
  const props = {
    default:  { bg: 'transparent', color: dmTheme.textMuted },
    hover:    { bg: '#F4F3EE',     color: dmTheme.text },
    active:   { bg: dmTheme.text,   color: '#fff' },
    focused:  { bg: 'transparent', color: dmTheme.textMuted, ring: true },
  }[state];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', width: 200,
      borderRadius: 8,
      background: props.bg, color: props.color,
      fontSize: 13, fontWeight: state === 'active' ? 600 : 500,
      boxShadow: props.ring ? `0 0 0 2px ${dmTheme.accent}` : 'none',
    }}>
      <Icon size={17} />
      <span style={{ flex: 1 }}>{label}</span>
      {locked && <ILock size={13} style={{ color: state === 'active' ? 'rgba(255,255,255,0.7)' : dmTheme.textSubtle }} />}
    </div>
  );
};

const CLTopBar = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 18px', width: 560,
    background: '#fff', border: `1px solid ${dmTheme.border}`, borderRadius: 10,
  }}>
    <CLBreadcrumbs />
    <div style={{ flex: 1 }} />
    <CLInput icon={ISearch} placeholder="Search…" size="sm" />
    <div style={{ width: 1, height: 24, background: dmTheme.border }} />
    <div style={{ position: 'relative' }}>
      <IBell size={17} style={{ color: dmTheme.textMuted }} />
      <div style={{ position: 'absolute', top: -2, right: -3, width: 7, height: 7, borderRadius: '50%', background: dmTheme.danger, border: '1.5px solid #fff' }} />
    </div>
    <CLAvatar size={28} name="NK" />
  </div>
);

const CLMobileTabBar = () => (
  <div style={{
    display: 'flex', width: 360, height: 64,
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 14, padding: '0 8px',
    boxShadow: '0 -4px 18px rgba(0,0,0,0.04)',
  }}>
    {[
      { I: IDashboard, l: 'Home',  active: true },
      { I: IMenus,     l: 'Menus' },
      { I: IQr,        l: 'QR' },
      { I: IUser,      l: 'Me' },
    ].map(t => (
      <div key={t.l} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        color: t.active ? dmTheme.text : dmTheme.textMuted,
      }}>
        <t.I size={19} sw={t.active ? 1.8 : 1.5} />
        <div style={{ fontSize: 10.5, fontWeight: t.active ? 600 : 500 }}>{t.l}</div>
      </div>
    ))}
  </div>
);

const NavigationGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>06 · Navigation</div>

    {clSub('Sidebar item · states')}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200, padding: 12, background: '#FCFBF8', border: `1px solid ${dmTheme.border}`, borderRadius: 10, marginBottom: 14 }}>
      <CLSidebarItem state="default" icon={IDashboard} label="Dashboard" />
      <CLSidebarItem state="hover"   icon={IMenus}     label="Menus" />
      <CLSidebarItem state="active"  icon={IAnalytics} label="Analytics" />
      <CLSidebarItem state="focused" icon={ISettings}  label="Settings" />
      <CLSidebarItem state="default" icon={IPromo}     label="Promotions" locked />
    </div>
    <div style={{ display: 'flex', gap: 18, marginBottom: 22, color: dmTheme.textSubtle, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      <div style={{ width: 200, textAlign: 'center' }}>default · hover · active · focused · locked</div>
    </div>

    {clSub('Top bar')}
    <div style={clRow}><CLTopBar /></div>

    {clSub('Editor tabs (page-level)')}
    <div style={{ marginBottom: 22, background: '#fff', border: `1px solid ${dmTheme.border}`, borderRadius: 10, padding: '0 14px' }}>
      <CLTabs items={['Content', 'Branding', 'Languages', 'Analytics', 'Promotions', 'QR', 'Settings']} active={0} />
    </div>

    {clSub('Mobile bottom tab bar')}
    <div style={clRow}><CLMobileTabBar /></div>
  </div>
);

// ─── UTILITY ─────

const CLKbd = ({ children, small }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: small ? 18 : 22, height: small ? 18 : 22,
    padding: small ? '0 4px' : '0 6px',
    fontSize: small ? 10 : 11, fontWeight: 600,
    color: dmTheme.textMuted,
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderBottomWidth: 2, borderRadius: 4,
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  }}>{children}</span>
);

const CLDivider = ({ label, vertical }) => vertical ? (
  <div style={{ width: 1, height: 32, background: dmTheme.border }} />
) : label ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 300 }}>
    <div style={{ flex: 1, height: 1, background: dmTheme.border }} />
    <div style={{ fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ flex: 1, height: 1, background: dmTheme.border }} />
  </div>
) : (
  <div style={{ width: 300, height: 1, background: dmTheme.border }} />
);

const CLCode = () => (
  <div style={{
    width: 460, padding: '14px 16px',
    background: '#1A1A1A', color: '#E8E8E4',
    borderRadius: 8, fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    lineHeight: 1.65, whiteSpace: 'pre',
  }}>{`<script>
  window.DigitalMenu.init({
    slug: "cafelinville",
    theme: "warm"
  });
</script>`}</div>
);

const UtilityGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>07 · Utility</div>

    {clSub('Dividers')}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22, alignItems: 'flex-start' }}>
      <CLDivider />
      <CLDivider label="or" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 32 }}>
        <span style={{ fontSize: 13 }}>Left</span>
        <CLDivider vertical />
        <span style={{ fontSize: 13 }}>Right</span>
      </div>
    </div>

    {clSub('Code block')}
    <div style={clRow}>
      <CLCode />
    </div>

    {clSub('Inline code / kbd')}
    <div style={clRow}>
      <Sample label="inline code">
        <span style={{ padding: '1px 6px', fontSize: 12, fontFamily: 'ui-monospace, monospace', background: '#F4F3EE', color: dmTheme.accent, borderRadius: 4, border: `1px solid ${dmTheme.border}` }}>window.DigitalMenu</span>
      </Sample>
      <Sample label="single key"><CLKbd>⌘</CLKbd></Sample>
      <Sample label="key"><CLKbd>K</CLKbd></Sample>
      <Sample label="shortcut">
        <div style={{ display: 'inline-flex', gap: 3 }}><CLKbd>⌘</CLKbd><CLKbd>S</CLKbd></div>
      </Sample>
      <Sample label="long key"><CLKbd>esc</CLKbd></Sample>
      <Sample label="shortcut row">
        <div style={{ display: 'inline-flex', gap: 3 }}>
          <CLKbd>⇧</CLKbd><CLKbd>⌘</CLKbd><CLKbd>P</CLKbd>
        </div>
      </Sample>
    </div>
  </div>
);

// ─── TOKENS ─────

const CLSwatch = ({ name, hex, light }) => (
  <div style={{ width: 118 }}>
    <div style={{
      height: 56, background: hex,
      borderRadius: 8, border: light ? `1px solid ${dmTheme.border}` : 'none',
    }} />
    <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, marginTop: 6 }}>{name}</div>
    <div style={{ fontSize: 10.5, color: dmTheme.textMuted, fontFamily: 'ui-monospace, monospace', letterSpacing: 0.2 }}>{hex}</div>
  </div>
);

const TypeSpec = ({ label, spec, children }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 20,
    padding: '14px 0', borderBottom: `1px solid ${dmTheme.borderSoft}`,
  }}>
    <div style={{ width: 110, fontSize: 10.5, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ flex: 1, color: dmTheme.text }}>{children}</div>
    <div style={{ width: 160, fontSize: 11, color: dmTheme.textMuted, fontFamily: 'ui-monospace, monospace', textAlign: 'right' }}>{spec}</div>
  </div>
);

const TokensGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>08 · Tokens</div>

    {clSub('Color · surfaces & text')}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
      <CLSwatch name="bg"          hex="#FAFAF9" light />
      <CLSwatch name="card"        hex="#FFFFFF" light />
      <CLSwatch name="chip"        hex="#F4F3EE" light />
      <CLSwatch name="border"      hex="#EAEAE6" light />
      <CLSwatch name="borderSoft"  hex="#F0EFEA" light />
      <CLSwatch name="text"        hex="#18181B" />
      <CLSwatch name="textMuted"   hex="#71717A" />
      <CLSwatch name="textSubtle"  hex="#A1A1AA" />
    </div>

    {clSub('Color · semantic')}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
      <CLSwatch name="accent"      hex="#B8633D" />
      <CLSwatch name="accentSoft"  hex="#F7EDE6" light />
      <CLSwatch name="success"     hex="#3F7E3F" />
      <CLSwatch name="successSoft" hex="#E8F0E8" light />
      <CLSwatch name="warning"     hex="#B87A1D" />
      <CLSwatch name="warningSoft" hex="#F7EFE0" light />
      <CLSwatch name="danger"      hex="#B8423D" />
      <CLSwatch name="dangerSoft"  hex="#F7E6E5" light />
    </div>

    {clSub('Type scale')}
    <div style={{ background: '#fff', border: `1px solid ${dmTheme.border}`, borderRadius: 10, padding: '0 18px', marginBottom: 22 }}>
      <TypeSpec label="display" spec="32 / 600 / -0.6">
        <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6, color: dmTheme.text }}>Café Linville</span>
      </TypeSpec>
      <TypeSpec label="h1" spec="22 / 600 / -0.3">
        <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: dmTheme.text }}>Menu settings</span>
      </TypeSpec>
      <TypeSpec label="h2" spec="16 / 600 / -0.1">
        <span style={{ fontSize: 16, fontWeight: 600, color: dmTheme.text }}>SEO &amp; sharing</span>
      </TypeSpec>
      <TypeSpec label="body" spec="13 / 400 / 1.5">
        <span style={{ fontSize: 13, color: dmTheme.text }}>Small-batch coffee, khachapuri, and seasonal brunch on Rustaveli Avenue.</span>
      </TypeSpec>
      <TypeSpec label="caption" spec="12 / 500 / 1.45 · muted">
        <span style={{ fontSize: 12, color: dmTheme.textMuted }}>Falls back to menu name if left blank.</span>
      </TypeSpec>
      <TypeSpec label="overline" spec="10.5 / 700 / 0.6 · uppercase">
        <span style={{ fontSize: 10.5, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, textTransform: 'uppercase' }}>Section label</span>
      </TypeSpec>
      <TypeSpec label="mono" spec="12 / monospace">
        <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: dmTheme.text }}>cafelinville.ge/main</span>
      </TypeSpec>
    </div>

    {clSub('Radius')}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 22 }}>
      {[
        { n: 'xs', v: 4 }, { n: 'sm', v: 6 }, { n: 'md', v: 8 },
        { n: 'lg', v: 10 }, { n: 'xl', v: 14 }, { n: 'pill', v: 999 },
      ].map(r => (
        <div key={r.n} style={{ textAlign: 'center' }}>
          <div style={{
            width: 62, height: 62, background: dmTheme.chip,
            border: `1px solid ${dmTheme.border}`,
            borderRadius: r.v,
          }} />
          <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, marginTop: 6 }}>{r.n}</div>
          <div style={{ fontSize: 10.5, color: dmTheme.textMuted }}>{r.v === 999 ? '999 (full)' : `${r.v}px`}</div>
        </div>
      ))}
    </div>

    {clSub('Spacing scale (4px base)')}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 22 }}>
      {[
        { n: '1', v: 4 }, { n: '2', v: 8 }, { n: '3', v: 12 }, { n: '4', v: 16 },
        { n: '5', v: 20 }, { n: '6', v: 24 }, { n: '8', v: 32 }, { n: '10', v: 40 },
        { n: '12', v: 48 }, { n: '16', v: 64 },
      ].map(s => (
        <div key={s.n} style={{ textAlign: 'center' }}>
          <div style={{
            width: s.v, height: s.v, background: dmTheme.text, borderRadius: 2,
          }} />
          <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, marginTop: 6 }}>{s.n}</div>
          <div style={{ fontSize: 10.5, color: dmTheme.textMuted }}>{s.v}px</div>
        </div>
      ))}
    </div>

    {clSub('Shadow')}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, padding: 20, background: dmTheme.bg, borderRadius: 10 }}>
      {[
        { n: 'none',   s: 'none' },
        { n: 'xs',     s: '0 1px 2px rgba(0,0,0,0.06)' },
        { n: 'sm',     s: '0 2px 6px rgba(0,0,0,0.06)' },
        { n: 'md',     s: '0 6px 18px rgba(0,0,0,0.08)' },
        { n: 'lg',     s: '0 10px 30px rgba(0,0,0,0.1)' },
        { n: 'xl',     s: '0 20px 50px rgba(0,0,0,0.12)' },
      ].map(s => (
        <div key={s.n} style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 50, background: '#fff',
            borderRadius: 8, boxShadow: s.s,
          }} />
          <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, marginTop: 8 }}>{s.n}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── WHOLE LIBRARY BOARD ─────

const ComponentLibraryBoard = () => (
  <div style={{
    width: '100%', height: '100%', overflow: 'hidden',
    background: dmTheme.bg, padding: 36,
    display: 'flex', flexDirection: 'column', gap: 20,
    fontFamily: "'Inter', system-ui, sans-serif",
  }}>
    <style>{`
      @keyframes cl-spin { to { transform: rotate(360deg); } }
      @keyframes cl-shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>

    {/* Header */}
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        Section H · Reference
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.6, marginTop: 4 }}>
        Component library
      </div>
      <div style={{ fontSize: 13, color: dmTheme.textMuted, marginTop: 6, lineHeight: 1.55, maxWidth: 720 }}>
        Every primitive used in the Digital Menu admin, grouped and labelled. Engineers use this as the
        source-of-truth implementation reference — each sample shows a specific state so there's no
        guessing about hover, focus, error, or disabled treatments.
      </div>
    </div>

    {/* Two-column grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
      <ButtonsGroup />
      <FormControlsGroup />
      <FeedbackGroup />
      <DataDisplayGroup />
      <OverlaysGroup />
      <NavigationGroup />
      <UtilityGroup />
      <TokensGroup />
    </div>
  </div>
);

Object.assign(window, {
  CLDialog, CLDrawer, CLPopover, CLTooltip, CLKebab, CLPalette,
  CLSidebarItem, CLTopBar, CLMobileTabBar,
  CLKbd, CLDivider, CLCode, CLSwatch,
  OverlaysGroup, NavigationGroup, UtilityGroup, TokensGroup,
  ComponentLibraryBoard,
});
