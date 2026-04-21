// Top bar, welcome header, plan usage strip, analytics, device breakdown, menus list, activity, top items, upgrade card

// ─── Top bar ─────────────────────────────────────────────
const DMTopBar = () => (
  <div style={{
    height: 56, borderBottom: `1px solid ${dmTheme.border}`,
    display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    background: '#FCFBF8',
  }}>
    {/* Breadcrumbs */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <span style={{ color: dmTheme.textMuted }}>Café Linville</span>
      <IChevRight size={13} style={{ color: dmTheme.textSubtle }} />
      <span style={{ color: dmTheme.text, fontWeight: 550 }}>Dashboard</span>
    </div>

    <div style={{ flex: 1 }} />

    {/* Search */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', width: 280,
      border: `1px solid ${dmTheme.border}`,
      borderRadius: 8, background: '#fff',
    }}>
      <ISearch size={14} style={{ color: dmTheme.textSubtle }} />
      <span style={{ fontSize: 13, color: dmTheme.textSubtle, flex: 1 }}>Search menus, items, orders…</span>
      <span style={{
        fontSize: 10, color: dmTheme.textSubtle,
        border: `1px solid ${dmTheme.border}`, borderRadius: 4,
        padding: '1px 5px', fontFamily: 'ui-monospace, monospace',
      }}>⌘K</span>
    </div>

    {/* Notifications */}
    <div style={{ position: 'relative', padding: 8, cursor: 'pointer' }}>
      <IBell size={17} style={{ color: dmTheme.text }} />
      <span style={{
        position: 'absolute', top: 5, right: 5,
        width: 7, height: 7, borderRadius: '50%',
        background: dmTheme.accent, border: '1.5px solid #FCFBF8',
      }} />
    </div>

    {/* Avatar */}
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: dmTheme.accent, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
    }}>NK</div>
  </div>
);

// ─── Welcome header ─────────────────────────────────────────────
const WelcomeHeader = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
    <div>
      <h1 style={{
        fontSize: 26, fontWeight: 600, color: dmTheme.text,
        letterSpacing: -0.5, margin: 0, lineHeight: 1.15,
      }}>Good afternoon, Nino 👋</h1>
      <p style={{
        fontSize: 14, color: dmTheme.textMuted, margin: '6px 0 0',
      }}>Here's what's happening with your menus today.</p>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={{
        padding: '8px 14px', border: `1px solid ${dmTheme.border}`,
        background: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 500,
        color: dmTheme.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <IExternal size={14} />
        View public menu
      </button>
      <button style={{
        padding: '8px 14px', border: '1px solid transparent',
        background: dmTheme.text, borderRadius: 8,
        fontSize: 13, fontWeight: 550, color: '#fff',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <IPlus size={14} sw={2.2} />
        Create new menu
      </button>
    </div>
  </div>
);

// ─── Plan usage strip ─────────────────────────────────────────────
const UsageCard = ({ label, used, total, unit = '' }) => {
  const isInfinity = total === '∞' || total === Infinity;
  const pct = isInfinity ? 0 : Math.min(100, (used / total) * 100);
  const color = pct >= 100 ? dmTheme.danger : pct >= 80 ? dmTheme.warning : dmTheme.text;
  return (
    <div style={{
      flex: 1, background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, color: dmTheme.textMuted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11.5, color: dmTheme.textSubtle, fontVariantNumeric: 'tabular-nums' }}>
          {isInfinity ? 'Unlimited' : `${Math.round(pct)}%`}
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: 22, fontWeight: 600, color, letterSpacing: -0.4 }}>{used}</span>
        <span style={{ fontSize: 13, color: dmTheme.textMuted }}>/ {isInfinity ? '∞' : total}{unit && ` ${unit}`}</span>
      </div>
      {/* progress */}
      <div style={{ height: 4, background: '#F0EFEA', borderRadius: 2, overflow: 'hidden' }}>
        {!isInfinity && (
          <div style={{
            width: `${pct}%`, height: '100%',
            background: color, borderRadius: 2,
          }} />
        )}
        {isInfinity && (
          <div style={{ width: '20%', height: '100%', background: dmTheme.chip, borderRadius: 2 }} />
        )}
      </div>
    </div>
  );
};

const PlanUsageStrip = ({ plan = 'STARTER' }) => {
  const usage = {
    FREE:    { menus: [1, 1], cats: [4, 10],  prods: [22, 30],  storage: [48, 100] },
    STARTER: { menus: [2, 3], cats: [14, '∞'], prods: [87, '∞'], storage: [340, 1024] },
    PRO:     { menus: [5, '∞'], cats: [42, '∞'], prods: [218, '∞'], storage: [1.2, 10] },
  }[plan];
  const storageLabel = plan === 'PRO' ? 'GB' : 'MB';
  const storageDisplay = plan === 'PRO'
    ? `${usage.storage[0]}`
    : `${usage.storage[0]}`;
  const storageTotal = plan === 'PRO'
    ? usage.storage[1]
    : (usage.storage[1] === 1024 ? 1 : usage.storage[1]);
  const storageUnit = plan === 'PRO' ? 'GB' : (usage.storage[1] === 1024 ? 'GB' : 'MB');

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <UsageCard label="Menus" used={usage.menus[0]} total={usage.menus[1]} />
        <UsageCard label="Categories" used={usage.cats[0]} total={usage.cats[1]} />
        <UsageCard label="Products" used={usage.prods[0]} total={usage.prods[1]} />
        <UsageCard
          label="Storage"
          used={plan === 'STARTER' ? '340 MB' : `${usage.storage[0]}${storageUnit === 'GB' ? ' GB' : ' MB'}`}
          total={plan === 'STARTER' ? '1 GB' : `${usage.storage[1]} ${storageUnit}`}
        />
      </div>
      {plan !== 'PRO' && (
        <a style={{
          fontSize: 12.5, color: dmTheme.accent, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
        }}>
          <ISparkle size={12} />
          Upgrade to PRO for unlimited everything
          <IArrowRight size={12} />
        </a>
      )}
    </div>
  );
};

// ─── Analytics area chart ─────────────────────────────────────────────
const AreaChart = ({ locked = false }) => {
  // 30-day series, smoothed
  const data = [120, 135, 160, 148, 172, 195, 220, 185, 210, 245, 230, 268,
                290, 275, 310, 340, 320, 355, 380, 395, 370, 410, 440, 425,
                460, 485, 470, 510, 535, 555];
  const w = 720, h = 180, pad = 20;
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const xs = data.map((_, i) => pad + (i * (w - pad * 2)) / (data.length - 1));
  const ys = data.map(v => h - pad - ((v - min) / (max - min)) * (h - pad * 2));
  // smooth path via cardinal-ish quadratic between points
  let path = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    path += ` Q ${cx} ${ys[i - 1]}, ${cx} ${(ys[i - 1] + ys[i]) / 2}`;
    path += ` T ${xs[i]} ${ys[i]}`;
  }
  const areaPath = path + ` L ${xs[xs.length - 1]} ${h - pad} L ${xs[0]} ${h - pad} Z`;

  // axis labels
  const xLabels = ['Mar 23', 'Mar 30', 'Apr 6', 'Apr 13', 'Apr 21'];
  const yLabels = [0, 150, 300, 450, 600];

  const chartStyle = locked ? { filter: 'blur(6px)', opacity: 0.55 } : {};

  return (
    <svg width="100%" height={h + 30} viewBox={`0 0 ${w} ${h + 30}`} style={{ display: 'block', ...chartStyle }}>
      {/* grid lines */}
      {yLabels.map((v, i) => {
        const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
        return (
          <g key={i}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#F0EFEA" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 3'} />
            <text x={0} y={y + 3} fontSize="10" fill={dmTheme.textSubtle} fontFamily="inherit">{v}</text>
          </g>
        );
      })}
      {/* area */}
      <path d={areaPath} fill={dmTheme.accent} fillOpacity="0.12" />
      {/* line */}
      <path d={path} fill="none" stroke={dmTheme.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* end point */}
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3.5" fill={dmTheme.accent} />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="7" fill={dmTheme.accent} fillOpacity="0.15" />
      {/* x labels */}
      {xLabels.map((lbl, i) => (
        <text key={i} x={pad + (i * (w - pad * 2)) / (xLabels.length - 1)} y={h + 16}
          fontSize="10" fill={dmTheme.textSubtle} fontFamily="inherit" textAnchor="middle">{lbl}</text>
      ))}
    </svg>
  );
};

const PeriodToggle = ({ value = '30d' }) => (
  <div style={{
    display: 'inline-flex', background: dmTheme.chip, borderRadius: 7, padding: 2,
  }}>
    {['7d', '30d', '90d'].map(p => (
      <button key={p} style={{
        padding: '4px 10px', fontSize: 11.5, fontWeight: 500,
        border: 'none', borderRadius: 5, cursor: 'pointer',
        background: p === value ? '#fff' : 'transparent',
        color: p === value ? dmTheme.text : dmTheme.textMuted,
        boxShadow: p === value ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
        fontVariantNumeric: 'tabular-nums',
      }}>{p}</button>
    ))}
  </div>
);

const AnalyticsCard = ({ locked = false }) => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: '18px 20px', position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 12.5, color: dmTheme.textMuted, fontWeight: 500, marginBottom: 3 }}>
          Menu views · last 30 days
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontSize: 32, fontWeight: 600, color: dmTheme.text,
            letterSpacing: -0.8, fontVariantNumeric: 'tabular-nums',
          }}>12,847</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', background: dmTheme.successSoft,
            color: dmTheme.success, borderRadius: 5,
            fontSize: 11.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          }}>
            <IArrowUp size={10} sw={2.2} />
            18.2%
          </span>
          <span style={{ fontSize: 12, color: dmTheme.textMuted }}>vs previous 30d</span>
        </div>
      </div>
      {!locked && <PeriodToggle value="30d" />}
    </div>

    <AreaChart locked={locked} />

    {locked && (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(252, 251, 248, 0.55)',
      }}>
        <div style={{
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          borderRadius: 12, padding: '20px 24px', textAlign: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.04)', maxWidth: 320,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: dmTheme.accentSoft,
            color: dmTheme.accent, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 10px',
          }}>
            <ILock size={17} />
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: dmTheme.text, marginBottom: 4 }}>
            Analytics is a PRO feature
          </div>
          <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
            See views, scans, top items and device breakdowns. Starts at 59₾/month.
          </div>
          <button style={{
            padding: '7px 14px', background: dmTheme.text, color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 550,
            cursor: 'pointer',
          }}>Upgrade to PRO</button>
        </div>
      </div>
    )}
  </div>
);

// ─── Device breakdown (donut) ─────────────────────────────────────────────
const DonutChart = () => {
  const data = [
    { label: 'Mobile',  value: 72, color: '#3B4254' },
    { label: 'Desktop', value: 19, color: '#B8633D' },
    { label: 'Tablet',  value:  9, color: '#C9B28A' },
  ];
  const r = 58, cx = 72, cy = 72, stroke = 16;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width="144" height="144" viewBox="0 0 144 144" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F4F3EE" strokeWidth={stroke} />
        {data.map((d, i) => {
          const len = (d.value / 100) * c;
          const circle = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          offset += len + 2; // small gap
          return circle;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fill={dmTheme.textMuted} fontFamily="inherit">Devices</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fontWeight="600" fill={dmTheme.text} fontFamily="inherit" style={{ fontVariantNumeric: 'tabular-nums' }}>100%</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: dmTheme.text, flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 550, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DeviceCard = () => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: '18px 20px',
  }}>
    <div style={{ fontSize: 12.5, color: dmTheme.textMuted, fontWeight: 500, marginBottom: 14 }}>
      Device breakdown
    </div>
    <DonutChart />
    <div style={{
      marginTop: 16, paddingTop: 14, borderTop: `1px solid ${dmTheme.borderSoft}`,
      fontSize: 11.5, color: dmTheme.textMuted, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <ISmartphone size={12} />
      Mobile scans up 23% this month
    </div>
  </div>
);

Object.assign(window, {
  DMTopBar, WelcomeHeader, PlanUsageStrip, AnalyticsCard, DeviceCard,
});
