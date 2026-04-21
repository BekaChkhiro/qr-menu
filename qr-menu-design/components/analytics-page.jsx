// Section D — Per-menu analytics (PRO, custom-range, FREE-locked, empty)

// ─── Period segmented ─────
const PeriodSeg = ({ active = '30d', onOpenPicker = false }) => (
  <div style={{
    display: 'inline-flex', padding: 2, borderRadius: 7,
    background: '#fff', border: `1px solid ${dmTheme.border}`,
  }}>
    {[
      { id: '7d', label: '7d' },
      { id: '30d', label: '30d' },
      { id: '90d', label: '90d' },
      { id: 'custom', label: 'Mar 18 – Apr 17', icon: ICalendar },
    ].map(p => (
      <span key={p.id} style={{
        padding: '5px 10px', fontSize: 12.5, fontWeight: 550,
        borderRadius: 5,
        background: p.id === active ? dmTheme.text : 'transparent',
        color: p.id === active ? '#fff' : dmTheme.textMuted,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        {p.icon && <p.icon size={12} />}
        {p.label}
      </span>
    ))}
  </div>
);

// ─── Sparkline (small trend inside stat card) ─────
const Sparkline = ({ data, color = dmTheme.accent, width = 100, height = 32 }) => {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - 2 - ((v - min) / (max - min || 1)) * (height - 4),
  ]);
  const path = 'M ' + pts.map(p => p.join(' ')).join(' L ');
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity="0.12" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.3" fill={color} />
    </svg>
  );
};

const HourStrip = () => {
  const vals = [2,3,5,8,12,18,28,42,55,68,80,95, 100,88, 65,48,40,55,72,88, 60,35,15,7];
  const max = Math.max(...vals);
  return (
    <svg width={160} height={32} style={{ display: 'block' }}>
      {vals.map((v, i) => (
        <rect key={i}
          x={i * (160 / 24) + 0.5} y={32 - (v / max) * 30}
          width={160 / 24 - 1.5} height={(v / max) * 30}
          fill={i === 13 ? dmTheme.accent : dmTheme.chip}
          rx={1}
        />
      ))}
    </svg>
  );
};

// ─── KPI card ─────
const KpiCard = ({ label, value, delta, deltaPositive = true, noData, right }) => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 6, minHeight: 108,
  }}>
    <div style={{ fontSize: 12, fontWeight: 550, color: dmTheme.textMuted, letterSpacing: 0.1 }}>{label}</div>
    {noData ? (
      <>
        <div style={{ fontSize: 24, fontWeight: 600, color: dmTheme.textSubtle, letterSpacing: -0.5, lineHeight: 1.1 }}>—</div>
        <div style={{ fontSize: 11.5, color: dmTheme.textSubtle, marginTop: 'auto' }}>No data in this period</div>
      </>
    ) : (
      <>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.5, lineHeight: 1.1 }}>
            {value}
          </span>
          {delta && (
            <span style={{
              padding: '1px 6px', borderRadius: 4,
              background: deltaPositive ? dmTheme.successSoft : dmTheme.dangerSoft,
              color:      deltaPositive ? dmTheme.success     : dmTheme.danger,
              fontSize: 11, fontWeight: 600,
            }}>
              {delta}
            </span>
          )}
        </div>
        <div style={{ marginTop: 'auto' }}>
          {right || <Sparkline data={[8, 10, 7, 11, 9, 14, 16, 13, 18, 21, 18, 24]} />}
        </div>
      </>
    )}
  </div>
);

// ─── Main views-over-time chart ─────
const ViewsChart = ({ showTooltip = false }) => {
  const W = 900, H = 260, P = { l: 36, r: 16, t: 10, b: 26 };
  const plotW = W - P.l - P.r, plotH = H - P.t - P.b;
  // 30 days of two series
  const views  = [260,290,310,280,340,420,480,410,360,390,450,520,580,530,480,510,560,620,690,640,590,610,680,720,780,720,680,710,780,840];
  const scans  = [ 90,100,110,105,130,150,180,160,140,150,175,200,220,210,195,205,225,245,265,255,240,250,270,290,305,295,280,290,305,325];
  const all = [...views, ...scans];
  const min = 0, max = Math.max(...all) * 1.08;
  const toX = (i) => P.l + (i / (views.length - 1)) * plotW;
  const toY = (v) => P.t + plotH - ((v - min) / (max - min)) * plotH;

  const linePath = (arr) => 'M ' + arr.map((v, i) => `${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' L ');
  const areaPath = linePath(views) + ` L ${toX(views.length-1).toFixed(1)} ${H - P.b} L ${toX(0).toFixed(1)} ${H - P.b} Z`;
  const hoverI = 18;

  const yTicks = [0, Math.round(max/3), Math.round(2*max/3), Math.round(max)];
  const xLabels = [
    { i: 0,  l: 'Mar 18' },
    { i: 7,  l: 'Mar 25' },
    { i: 14, l: 'Apr 1'  },
    { i: 21, l: 'Apr 8'  },
    { i: 29, l: 'Apr 17' },
  ];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {/* gridlines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={toY(t)} y2={toY(t)} stroke={dmTheme.borderSoft} strokeWidth="1" />
          <text x={P.l - 6} y={toY(t) + 3.5} textAnchor="end" fontSize="10" fill={dmTheme.textSubtle} fontFamily="ui-monospace">
            {t.toLocaleString()}
          </text>
        </g>
      ))}
      {/* area */}
      <path d={areaPath} fill={dmTheme.accent} fillOpacity="0.10" />
      {/* primary views line */}
      <path d={linePath(views)} fill="none" stroke={dmTheme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* scans — dashed slate */}
      <path d={linePath(scans)} fill="none" stroke="#3B4254" strokeWidth="1.8" strokeDasharray="4 4" strokeLinecap="round" />
      {/* event pins */}
      {[
        { i: 7, label: 'Promotion started', color: dmTheme.accent },
        { i: 14, label: 'Menu updated',     color: '#3B4254' },
      ].map((e, idx) => (
        <g key={idx}>
          <line x1={toX(e.i)} x2={toX(e.i)} y1={P.t} y2={H - P.b} stroke={e.color} strokeOpacity="0.25" strokeDasharray="2 3" />
          <g transform={`translate(${toX(e.i)}, ${P.t + 4})`}>
            <circle cx="0" cy="0" r="7" fill="#fff" stroke={e.color} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="2.5" fill={e.color} />
          </g>
          <text x={toX(e.i) + 10} y={P.t + 8} fontSize="10" fill={e.color} fontWeight="600">{e.label}</text>
        </g>
      ))}
      {/* x labels */}
      {xLabels.map((l, i) => (
        <text key={i} x={toX(l.i)} y={H - P.b + 16} textAnchor="middle" fontSize="10" fill={dmTheme.textSubtle} fontFamily="ui-monospace">
          {l.l}
        </text>
      ))}
      {/* tooltip */}
      {showTooltip && (
        <>
          <line x1={toX(hoverI)} x2={toX(hoverI)} y1={P.t} y2={H - P.b} stroke={dmTheme.text} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={toX(hoverI)} cy={toY(views[hoverI])} r="4" fill={dmTheme.accent} stroke="#fff" strokeWidth="2" />
          <circle cx={toX(hoverI)} cy={toY(scans[hoverI])} r="4" fill="#3B4254" stroke="#fff" strokeWidth="2" />
          {/* tooltip box */}
          <g transform={`translate(${toX(hoverI) + 12}, ${toY(views[hoverI]) - 58})`}>
            <rect x="0" y="0" width="148" height="56" rx="8" fill={dmTheme.text} />
            <text x="12" y="16" fontSize="10.5" fill="rgba(255,255,255,0.6)" fontWeight="500">Apr 5, 2026</text>
            <circle cx="14" cy="30" r="3" fill={dmTheme.accent} />
            <text x="22" y="33" fontSize="11" fill="#fff" fontWeight="500">Views</text>
            <text x="136" y="33" fontSize="11.5" fill="#fff" textAnchor="end" fontWeight="600" fontFamily="ui-monospace">
              {views[hoverI]}
            </text>
            <circle cx="14" cy="46" r="3" fill="#8B9BB0" />
            <text x="22" y="49" fontSize="11" fill="rgba(255,255,255,0.8)" fontWeight="500">Scans</text>
            <text x="136" y="49" fontSize="11.5" fill="#fff" textAnchor="end" fontWeight="600" fontFamily="ui-monospace">
              {scans[hoverI]}
            </text>
          </g>
        </>
      )}
    </svg>
  );
};

// ─── Donut (reuses approach from dashboard) ─────
const AnalyticsDonut = () => {
  const segs = [
    { label: 'Mobile',  pct: 72, color: dmTheme.accent },
    { label: 'Desktop', pct: 19, color: '#3B4254' },
    { label: 'Tablet',  pct: 9,  color: '#C9A074' },
  ];
  const R = 48, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke={dmTheme.chip} strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.pct / 100) * C;
          const circle = <circle key={i} cx="60" cy="60" r={R} fill="none"
            stroke={s.color} strokeWidth="14"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
            strokeLinecap="butt" />;
          offset += len;
          return circle;
        })}
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2.5, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: dmTheme.text, flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Horizontal bar chart (top categories) ─────
const TopCategoriesChart = () => {
  const rows = [
    { name: 'Mains',     v: 4820 },
    { name: 'Drinks',    v: 3610 },
    { name: 'Starters',  v: 2140 },
    { name: 'Desserts',  v: 1520 },
    { name: 'Bakery',    v: 980  },
  ];
  const max = rows[0].v;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 72, fontSize: 12.5, color: dmTheme.text, fontWeight: 500 }}>{r.name}</span>
          <div style={{ flex: 1, height: 22, background: dmTheme.chip, borderRadius: 4, position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0, width: `${(r.v / max) * 100}%`,
              background: i === 0 ? dmTheme.accent : `${dmTheme.accent}${Math.max(35, 95 - i * 15).toString(16)}`,
              opacity: 1 - i * 0.13,
              borderRadius: 4,
            }} />
          </div>
          <span style={{ width: 60, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
            {r.v.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Heatmap ─────
const ViewsHeatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Seeded-ish fake data 7x24 with peaks around lunch/dinner and weekends
  const data = days.map((_, di) => {
    return Array.from({ length: 24 }, (_, h) => {
      let base = 0;
      if (h >= 7 && h <= 10) base = 0.45;
      else if (h >= 11 && h <= 14) base = 0.75;
      else if (h >= 18 && h <= 21) base = 0.65;
      else if (h >= 0 && h <= 5) base = 0.06;
      else base = 0.25;
      // weekends hotter
      if (di >= 5) base = Math.min(1, base * 1.35);
      // saturday 13:00 is peak
      if (di === 5 && h === 13) base = 1;
      if (di === 1 && h === 6) base = 0.02;
      const noise = (Math.sin(di * 7.1 + h * 3.3) + 1) / 2 * 0.15;
      return Math.min(1, Math.max(0, base + noise - 0.07));
    });
  });

  const cellW = 30;
  const cellH = 22;
  const color = (v) => {
    if (v < 0.05) return '#F6F4F0';
    const alpha = Math.max(0.12, v);
    // blend toward accent
    return `rgba(184, 99, 61, ${alpha})`;
  };

  return (
    <div>
      {/* hour labels */}
      <div style={{ display: 'flex', marginLeft: 44, marginBottom: 4, position: 'relative', height: 14 }}>
        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
          <span key={h} style={{
            position: 'absolute',
            left: h * cellW, fontSize: 10, color: dmTheme.textSubtle, fontFamily: 'ui-monospace',
          }}>{h.toString().padStart(2, '0')}</span>
        ))}
      </div>
      {/* rows */}
      {data.map((row, di) => (
        <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
          <span style={{ width: 40, fontSize: 11, color: dmTheme.textMuted, fontWeight: 550 }}>{days[di]}</span>
          {row.map((v, hi) => (
            <div key={hi} style={{
              width: cellW - 3, height: cellH, borderRadius: 3,
              background: color(v),
              border: di === 5 && hi === 13 ? `1.5px solid ${dmTheme.text}` : 'none',
            }} />
          ))}
        </div>
      ))}
      {/* legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{
          padding: '8px 12px', background: dmTheme.accentSoft, borderRadius: 8,
          fontSize: 12, color: dmTheme.text,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <ISparkle size={12} style={{ color: dmTheme.accent }} />
          <strong style={{ fontWeight: 600 }}>Peak:</strong> Saturday 13:00.&nbsp;
          <span style={{ color: dmTheme.textMuted }}>Quietest: Tuesday 6:00</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: dmTheme.textSubtle }}>
          <span>Less</span>
          {[0.08, 0.3, 0.5, 0.7, 0.95].map(v => (
            <span key={v} style={{ width: 14, height: 14, borderRadius: 3, background: color(v) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

// ─── Top products ─────
const analyticsTopProducts = [
  { rank: 1, name: 'Khachapuri Adjaruli', cat: 'Mains',     views: 1842, delta: '+12%', up: true,  tone: 'c' },
  { rank: 2, name: 'Flat white',          cat: 'Drinks',    views: 1560, delta: '+8%',  up: true,  tone: 'a' },
  { rank: 3, name: 'Chakapuli',           cat: 'Mains',     views: 1204, delta: '+5%',  up: true,  tone: 'b' },
  { rank: 4, name: 'Badrijani nigvzit',   cat: 'Starters',  views:  988, delta: '+3%',  up: true,  tone: 'e' },
  { rank: 5, name: 'Tarkhuna lemonade',   cat: 'Drinks',    views:  912, delta: '−2%',  up: false, tone: 'c' },
  { rank: 6, name: 'Cappuccino',          cat: 'Drinks',    views:  860, delta: '+9%',  up: true,  tone: 'a' },
  { rank: 7, name: 'Khinkali',            cat: 'Mains',     views:  720, delta: '+1%',  up: true,  tone: 'b' },
  { rank: 8, name: 'Tbilisuri salad',     cat: 'Starters',  views:  610, delta: '−4%',  up: false, tone: 'e' },
  { rank: 9, name: 'Churchkhela',         cat: 'Desserts',  views:  540, delta: '+6%',  up: true,  tone: 'd' },
  { rank: 10, name: 'Espresso',           cat: 'Drinks',    views:  482, delta: '+2%',  up: true,  tone: 'a' },
];

const TopProductsTable = () => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {analyticsTopProducts.map((p, i) => (
      <div key={p.rank} style={{
        padding: '10px 14px',
        display: 'grid', gridTemplateColumns: '28px 36px 1fr 80px 60px',
        gap: 12, alignItems: 'center',
        borderBottom: i === analyticsTopProducts.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
        borderLeft: p.rank <= 3 ? `3px solid ${dmTheme.accent}` : '3px solid transparent',
        background: p.rank <= 3 ? '#FDFAF7' : 'transparent',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: p.rank <= 3 ? dmTheme.accent : dmTheme.textSubtle,
          fontFamily: 'ui-monospace',
        }}>#{p.rank}</span>
        <MenuThumb tone={p.tone} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 550, color: dmTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 10.5, color: dmTheme.textSubtle }}>{p.cat}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
          {p.views.toLocaleString()}
        </div>
        <span style={{
          padding: '1px 6px', borderRadius: 4, textAlign: 'center',
          background: p.up ? dmTheme.successSoft : dmTheme.dangerSoft,
          color:      p.up ? dmTheme.success     : dmTheme.danger,
          fontSize: 10.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        }}>
          {p.delta}
        </span>
      </div>
    ))}
  </div>
);

// ─── Geography ─────
const geoRows = [
  { city: 'Tbilisi',  views: 9412, pct: 73 },
  { city: 'Batumi',   views: 1504, pct: 12 },
  { city: 'Kutaisi',  views:  612, pct: 5  },
  { city: 'Rustavi',  views:  321, pct: 3  },
  { city: 'Other',    views:  998, pct: 8  },
];

const GeographyCard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {geoRows.map((r, i) => (
      <div key={i} style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, width: `${r.pct}%`,
          background: i === 0 ? dmTheme.accentSoft : dmTheme.chip,
          borderRadius: 5, opacity: 0.65,
        }} />
        <div style={{
          position: 'relative', padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 12.5,
        }}>
          <span style={{ flex: 1, color: dmTheme.text, fontWeight: 550 }}>{r.city}</span>
          <span style={{ color: dmTheme.textMuted, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{r.pct}%</span>
          <span style={{
            width: 54, textAlign: 'right',
            color: dmTheme.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          }}>
            {r.views.toLocaleString()}
          </span>
        </div>
      </div>
    ))}
  </div>
);

// ─── Browsers list ─────
const BrowserList = () => (
  <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${dmTheme.borderSoft}` }}>
    <div style={{ fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
      Browsers
    </div>
    {[
      { name: 'Safari',  pct: 58 },
      { name: 'Chrome',  pct: 29 },
      { name: 'Firefox', pct: 8  },
      { name: 'Other',   pct: 5  },
    ].map((b, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
        <span style={{ width: 54, fontSize: 11.5, color: dmTheme.text }}>{b.name}</span>
        <div style={{ flex: 1, height: 5, background: dmTheme.chip, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${b.pct}%`, height: '100%', background: dmTheme.textMuted }} />
        </div>
        <span style={{ fontSize: 11, color: dmTheme.textMuted, fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right' }}>{b.pct}%</span>
      </div>
    ))}
  </div>
);

// ─── Traffic source ─────
const trafficSources = [
  { label: 'QR code', pct: 78, color: dmTheme.accent },
  { label: 'Direct URL', pct: 15, color: '#3B4254' },
  { label: 'Social',     pct: 7,  color: '#C9A074' },
];

const qrLocations = [
  { name: 'Table 6 tent',        scans: 1284, pct: 100 },
  { name: 'Entrance poster',     scans: 1102, pct: 86 },
  { name: 'Table 2 tent',        scans:  942, pct: 73 },
  { name: 'Bar counter',         scans:  620, pct: 48 },
  { name: 'Takeaway receipt',    scans:  412, pct: 32 },
];

const TrafficSourceCard = () => (
  <div>
    {/* stacked bar */}
    <div style={{
      height: 28, borderRadius: 6, overflow: 'hidden',
      display: 'flex', marginBottom: 10,
    }}>
      {trafficSources.map((s, i) => (
        <div key={i} style={{
          width: `${s.pct}%`, background: s.color,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
          paddingLeft: s.pct > 10 ? 10 : 0,
          color: '#fff', fontSize: 11.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        }}>
          {s.pct > 10 ? `${s.pct}%` : ''}
        </div>
      ))}
    </div>
    {/* legend */}
    <div style={{ display: 'flex', gap: 16, fontSize: 11.5, color: dmTheme.text, marginBottom: 20 }}>
      {trafficSources.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2.5, background: s.color }} />
          <span style={{ fontWeight: 550 }}>{s.label}</span>
          <span style={{ color: dmTheme.textMuted, fontVariantNumeric: 'tabular-nums' }}>{s.pct}%</span>
        </div>
      ))}
    </div>
    {/* leaderboard */}
    <div style={{ fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
      Most scanned QR locations
    </div>
    {qrLocations.map((q, i) => (
      <div key={i} style={{
        display: 'grid', gridTemplateColumns: '22px 1fr 2fr 70px',
        gap: 12, alignItems: 'center',
        padding: '8px 0',
        borderBottom: i === qrLocations.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
      }}>
        <span style={{ fontSize: 10.5, color: dmTheme.textSubtle, fontFamily: 'ui-monospace', fontWeight: 700 }}>#{i + 1}</span>
        <span style={{ fontSize: 12.5, color: dmTheme.text, fontWeight: 550 }}>{q.name}</span>
        <div style={{ height: 5, background: dmTheme.chip, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${q.pct}%`, height: '100%', background: dmTheme.accent }} />
        </div>
        <span style={{ textAlign: 'right', fontSize: 12, color: dmTheme.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {q.scans.toLocaleString()}
        </span>
      </div>
    ))}
  </div>
);

// ─── Analytics page header (standalone - NOT used when inside editor) ─────
const AnalyticsHeader = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.5, lineHeight: 1.15 }}>
        Analytics
      </h1>
      <div style={{ fontSize: 13, color: dmTheme.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: dmTheme.text, fontWeight: 550 }}>Main menu — All day</span>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <IGlobe size={11} /> cafelinville.ge/main-menu
        </span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <PeriodSeg active="30d" />
      <Btn icon={IDownload}>Export CSV</Btn>
    </div>
  </div>
);

// ─── In-editor analytics toolbar (just period + export) ─────
const AnalyticsToolbar = ({ showDatePicker = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <div style={{ fontSize: 13, color: dmTheme.textMuted, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <IGlobe size={12} />
      <span>Tracking</span>
      <span style={{ color: dmTheme.text, fontFamily: 'ui-monospace, monospace' }}>cafelinville.ge/main-menu</span>
      <span style={{
        marginLeft: 6, padding: '1px 7px', borderRadius: 4,
        background: dmTheme.successSoft, color: dmTheme.success,
        fontSize: 10.5, fontWeight: 600,
      }}>Live</span>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <PeriodSeg active="30d" />
      <Btn icon={IDownload}>Export CSV</Btn>
    </div>
  </div>
);

// ─── Card wrapper ─────
const ACard = ({ title, right, children, style }) => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, overflow: 'hidden', ...style,
  }}>
    {title && (
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${dmTheme.borderSoft}`,
      }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2 }}>
          {title}
        </div>
        {right}
      </div>
    )}
    {children}
  </div>
);

// ─── Date range popover ─────
const CalendarGrid = ({ monthLabel, startDay, daysInMonth, highlight }) => {
  // startDay: 0=Mon. highlight = {from, to} (day numbers)
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ width: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 12.5, fontWeight: 600, color: dmTheme.text }}>
        {monthLabel}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} style={{ textAlign: 'center', fontSize: 9.5, color: dmTheme.textSubtle, fontWeight: 600, textTransform: 'uppercase' }}>{d}</span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const inRange = highlight && d >= highlight.from && d <= highlight.to;
          const isEdge = highlight && (d === highlight.from || d === highlight.to);
          return (
            <span key={i} style={{
              height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontVariantNumeric: 'tabular-nums', fontWeight: 500,
              borderRadius: isEdge ? 6 : (inRange ? 0 : 6),
              background: isEdge ? dmTheme.text : (inRange ? dmTheme.accentSoft : 'transparent'),
              color: isEdge ? '#fff' : (inRange ? dmTheme.accent : dmTheme.text),
            }}>
              {d}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const DateRangePopover = () => (
  <div style={{
    position: 'absolute', top: 74, right: 24, width: 620,
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: 18,
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)', zIndex: 5,
    display: 'flex', gap: 18,
  }}>
    {/* presets */}
    <div style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 2, borderRight: `1px solid ${dmTheme.borderSoft}`, paddingRight: 14 }}>
      {['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month', 'Last month', 'Last quarter', 'Year to date'].map((p, i) => (
        <span key={p} style={{
          padding: '6px 10px', fontSize: 12.5, borderRadius: 6,
          background: i === 3 ? dmTheme.chip : 'transparent',
          color: i === 3 ? dmTheme.text : dmTheme.textMuted,
          fontWeight: i === 3 ? 600 : 500,
          cursor: 'pointer',
        }}>{p}</span>
      ))}
    </div>
    {/* calendars */}
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: 18 }}>
        <CalendarGrid monthLabel="March 2026"  startDay={6} daysInMonth={31} highlight={{ from: 18, to: 31 }} />
        <CalendarGrid monthLabel="April 2026"  startDay={2} daysInMonth={30} highlight={{ from: 1, to: 17 }} />
      </div>
      <div style={{
        marginTop: 14, paddingTop: 14, borderTop: `1px solid ${dmTheme.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, color: dmTheme.textMuted }}>
          <span style={{ color: dmTheme.text, fontWeight: 600 }}>Mar 18</span> — <span style={{ color: dmTheme.text, fontWeight: 600 }}>Apr 17, 2026</span>
          <span style={{ marginLeft: 10, color: dmTheme.textSubtle }}>(30 days)</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn small>Cancel</Btn>
          <Btn small variant="primary">Apply</Btn>
        </div>
      </div>
    </div>
  </div>
);

// ─── FULL analytics page ─────
const AnalyticsFullPage = ({ showTooltip = true, noDataOneKpi = true, showDatePicker = false, inEditor = false }) => (
  <div style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
    <div style={{ overflow: 'hidden' }}>
      {inEditor ? <AnalyticsToolbar showDatePicker={showDatePicker} /> : <AnalyticsHeader />}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        <KpiCard label="Total views"       value="12,847" delta="+18.2%" deltaPositive />
        <KpiCard label="Unique scans"      value="3,204"  delta="+12.4%" deltaPositive right={<Sparkline data={[5,7,6,9,10,8,12,13,11,15,16,14,18]} color="#3B4254" />} />
        <KpiCard label="Avg time on menu"  value="2m 14s" delta="−4s" deltaPositive={false} right={<Sparkline data={[22,20,19,22,21,18,20,18,17,19,20,19,18]} color="#3B4254" />} />
        {noDataOneKpi
          ? <KpiCard label="Repeat visitors" noData />
          : <KpiCard label="Peak hour" value="13:00" right={<HourStrip />} />
        }
      </div>

      {/* Views over time */}
      <ACard
        title="Views over time"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11.5 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: dmTheme.text }}>
              <span style={{ width: 10, height: 2, background: dmTheme.accent, borderRadius: 1 }} />
              Views
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: dmTheme.textMuted }}>
              <svg width="14" height="2"><line x1="0" y1="1" x2="14" y2="1" stroke="#3B4254" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
              Unique scans
            </span>
            <span style={{ color: dmTheme.textSubtle }}>Last 30 days</span>
          </div>
        }
        style={{ marginBottom: 14 }}
      >
        <div style={{ padding: '14px 18px 10px' }}>
          <ViewsChart showTooltip={showTooltip} />
        </div>
      </ACard>

      {/* Two col */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
        <ACard title="Top categories" right={<span style={{ fontSize: 11.5, color: dmTheme.textSubtle }}>Click a category to filter</span>}>
          <div style={{ padding: 18 }}>
            <TopCategoriesChart />
          </div>
        </ACard>
        <ACard title="Device breakdown">
          <div style={{ padding: 18 }}>
            <AnalyticsDonut />
            <BrowserList />
          </div>
        </ACard>
      </div>

      {/* Heatmap */}
      <ACard title="When customers view your menu" style={{ marginBottom: 14 }}>
        <div style={{ padding: 18 }}>
          <ViewsHeatmap />
        </div>
      </ACard>

      {/* Top products + geography */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <ACard title="Top products">
          <TopProductsTable />
        </ACard>
        <ACard
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><IMap size={13} /> Views by city</span>}
        >
          <div style={{ padding: 18 }}>
            <GeographyCard />
          </div>
        </ACard>
      </div>

      {/* Traffic sources */}
      <ACard title="Traffic source">
        <div style={{ padding: 18 }}>
          <TrafficSourceCard />
        </div>
      </ACard>
    </div>

    {showDatePicker && <DateRangePopover />}
  </div>
);

// ─── FREE locked analytics ─────
const AnalyticsLockedPage = ({ inEditor = false }) => (
  <div style={{ position: 'relative', height: '100%' }}>
    <div style={{ filter: 'blur(5px)', opacity: 0.55, pointerEvents: 'none', height: '100%' }}>
      <AnalyticsFullPage showTooltip={false} noDataOneKpi={false} inEditor={inEditor} />
    </div>
    {/* backdrop */}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250, 250, 249, 0.4)' }} />
    {/* card */}
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
        <IAnalytics size={22} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: dmTheme.text, marginBottom: 8, letterSpacing: -0.4 }}>
        Analytics is a PRO feature
      </div>
      <div style={{ fontSize: 13.5, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 20 }}>
        See detailed views, devices, hours, top products and customer geography.
        Get the full picture of how customers engage with your menu.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22, textAlign: 'left' }}>
        {[
          'Real-time view & scan tracking',
          'Hour-by-hour heatmaps',
          'Per-product performance',
        ].map(b => (
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
      <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5 }}>
        Upgrade to PRO — 59₾/month
      </Btn>
      <div style={{ fontSize: 11, color: dmTheme.textSubtle, marginTop: 10 }}>
        30-day money-back guarantee
      </div>
    </div>
  </div>
);

// ─── Empty analytics ─────
const AnalyticsEmptyPage = ({ inEditor = false }) => (
  <div>
    {inEditor ? <AnalyticsToolbar /> : <AnalyticsHeader />}
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 14, padding: 48, textAlign: 'center',
      marginBottom: 14,
    }}>
      {/* QR illustration */}
      <div style={{ width: 140, height: 140, margin: '0 auto 24px', position: 'relative' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: `1.5px solid ${dmTheme.accent}`,
            opacity: 0.08 + i * 0.08,
            transform: `scale(${1 + i * 0.12})`,
          }} />
        ))}
        <div style={{
          position: 'absolute', inset: 26,
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IQr size={40} style={{ color: dmTheme.accent }} />
        </div>
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: dmTheme.text, margin: '0 0 8px', letterSpacing: -0.4 }}>
        Your analytics will appear here
      </h2>
      <p style={{ fontSize: 13.5, color: dmTheme.textMuted, margin: '0 auto 24px', maxWidth: 480, lineHeight: 1.55 }}>
        Share your menu to start collecting insights. Once customers scan, you'll see
        views, devices, top items and more.
      </p>
      <div style={{ display: 'inline-flex', gap: 8 }}>
        <Btn variant="primary" icon={IDownload}>Download QR code</Btn>
        <Btn icon={ICopy}>Copy menu link</Btn>
      </div>
    </div>

    {/* Gray placeholder rows */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {[0,1,2,3].map(i => <KpiCard key={i} label={['Total views','Unique scans','Avg time on menu','Peak hour'][i]} noData />)}
    </div>
  </div>
);

Object.assign(window, {
  AnalyticsFullPage, AnalyticsLockedPage, AnalyticsEmptyPage,
});
