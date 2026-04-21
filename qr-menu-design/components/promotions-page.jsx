// Section E — Promotions (as editor tab)

// ─── Promo banner (gradient placeholder with burned-in text) ─────
const PromoBanner = ({ variant = 'happyhour', title, desaturate = false }) => {
  const variants = {
    happyhour: {
      bg: 'linear-gradient(135deg, #B8633D, #7A3F27)',
      accent: 'rgba(255, 220, 190, 0.2)',
      font: "'Playfair Display', 'Times New Roman', serif",
      weight: 700,
    },
    brunch: {
      bg: 'linear-gradient(135deg, #7A8C5F, #4F5F3F)',
      accent: 'rgba(230, 240, 210, 0.15)',
      font: "'Playfair Display', 'Times New Roman', serif",
      weight: 600,
    },
    mother: {
      bg: 'linear-gradient(135deg, #B8423D, #7A2A27)',
      accent: 'rgba(255, 190, 180, 0.2)',
      font: "'Playfair Display', 'Times New Roman', serif",
      weight: 600,
    },
    easter: {
      bg: 'linear-gradient(135deg, #5D7A91, #3F5363)',
      accent: 'rgba(200, 220, 240, 0.15)',
      font: "'Playfair Display', 'Times New Roman', serif",
      weight: 600,
    },
  };
  const v = variants[variant];
  return (
    <div style={{
      aspectRatio: '16 / 9', borderRadius: 10, position: 'relative',
      background: v.bg, overflow: 'hidden',
      filter: desaturate ? 'saturate(0.45)' : 'none',
    }}>
      {/* decorative stripes */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(115deg, transparent 0 40px, ${v.accent} 40px 42px)`,
      }} />
      {/* decorative ring */}
      <div style={{
        position: 'absolute', right: -30, bottom: -30,
        width: 140, height: 140, borderRadius: '50%',
        border: `2px solid ${v.accent}`,
      }} />
      <div style={{
        position: 'absolute', right: 0, top: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: v.accent,
      }} />
      {/* title */}
      <div style={{
        position: 'absolute', left: 18, bottom: 14, right: 18,
        color: '#fff', fontFamily: v.font, fontWeight: v.weight,
        fontSize: 26, lineHeight: 1, letterSpacing: -0.8,
        textShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}>
        {title}
      </div>
    </div>
  );
};

// ─── Active pulse dot ─────
const PulseDot = ({ color }) => (
  <span style={{ display: 'inline-block', position: 'relative', width: 7, height: 7 }}>
    <span style={{
      position: 'absolute', inset: 0, borderRadius: '50%', background: color,
    }} />
    <span style={{
      position: 'absolute', inset: -3, borderRadius: '50%',
      background: color, opacity: 0.25,
    }} />
  </span>
);

// ─── Status pill ─────
const PromoStatusPill = ({ status }) => {
  const map = {
    Active:    { bg: dmTheme.successSoft, color: dmTheme.success, dot: dmTheme.success, pulse: true },
    Scheduled: { bg: '#F7EFE0',           color: '#8A6A1E',       dot: '#B87A1D' },
    Ended:     { bg: dmTheme.chip,        color: dmTheme.textMuted, dot: dmTheme.textMuted },
  }[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px', borderRadius: 5,
      background: map.bg, color: map.color,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.1,
    }}>
      {map.pulse
        ? <PulseDot color={map.dot} />
        : status === 'Scheduled'
          ? <IClock size={10} sw={2} />
          : <span style={{ width: 6, height: 6, borderRadius: '50%', background: map.dot }} />
      }
      {status}
    </span>
  );
};

// ─── Discount type badge ─────
const DiscountBadge = ({ type, value }) => {
  const variants = {
    percent: { bg: dmTheme.accentSoft, color: dmTheme.accent, label: value ? `${value}` : '−20%' },
    free:    { bg: '#EDEEF0',          color: '#3B4254',      label: 'Free add-on' },
    fixed:   { bg: '#F7EFE0',          color: '#8A6A1E',      label: value || '5₾ off' },
  };
  const v = variants[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 5,
      background: v.bg, color: v.color,
      fontSize: 11, fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
      fontFamily: 'ui-monospace, monospace',
    }}>{v.label}</span>
  );
};

// ─── Single promo card ─────
const PromoCard = ({ promo }) => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ position: 'relative' }}>
      <PromoBanner variant={promo.banner} title={promo.bannerTitle} desaturate={promo.status === 'Ended'} />
      <div style={{ position: 'absolute', top: 12, left: 12 }}>
        <PromoStatusPill status={promo.status} />
      </div>
    </div>

    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2, lineHeight: 1.3, flex: 1 }}>
          {promo.title}
        </div>
        <DiscountBadge type={promo.discountType} value={promo.discountValue} />
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: dmTheme.textMuted }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ICalendar size={12} style={{ color: dmTheme.textSubtle, flexShrink: 0 }} />
          <span>{promo.dates}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IUtensils size={12} style={{ color: dmTheme.textSubtle, flexShrink: 0 }} />
          <span>{promo.applied}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 'auto', paddingTop: 10,
        borderTop: `1px solid ${dmTheme.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: dmTheme.textMuted }}>
          <IEye size={12} style={{ color: dmTheme.textSubtle }} />
          <span style={{ color: dmTheme.text, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{promo.scans}</span>
          <span>scans · 7d</span>
        </div>
        <IMore size={14} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
      </div>
    </div>
  </div>
);

const promosData = [
  { banner: 'happyhour', bannerTitle: 'Happy Hour',
    status: 'Active', title: 'Happy Hour · Cocktails 20% off',
    discountType: 'percent', discountValue: '−20%',
    dates: 'Apr 15 → Apr 30 · 18:00–20:00 daily',
    applied: 'All items in Cocktails (12)', scans: '186' },
  { banner: 'brunch', bannerTitle: 'Weekend Brunch',
    status: 'Active', title: 'Weekend brunch · Free coffee with entrée',
    discountType: 'free',
    dates: 'Saturdays & Sundays · 9:00–13:00',
    applied: '3 items in Breakfast', scans: '94' },
  { banner: 'mother', bannerTitle: "Mother's Day",
    status: 'Scheduled', title: "Mother's Day special menu",
    discountType: 'fixed', discountValue: '5₾ off',
    dates: 'Starts May 11, 2026',
    applied: 'Seasonal menu (5 items)', scans: '—' },
  { banner: 'easter', bannerTitle: 'Easter 2026',
    status: 'Ended', title: 'Easter week · 15% off family plates',
    discountType: 'percent', discountValue: '−15%',
    dates: 'Apr 5 → Apr 12, 2026',
    applied: '4 items', scans: '612' },
];

// ─── Filter chips ─────
const PromoFilterChip = ({ label, count, active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 7,
    background: active ? dmTheme.text : '#fff',
    color: active ? '#fff' : dmTheme.text,
    border: `1px solid ${active ? dmTheme.text : dmTheme.border}`,
    fontSize: 12.5, fontWeight: 550, cursor: 'pointer',
  }}>
    {label}
    <span style={{
      padding: '0px 5px', borderRadius: 3,
      background: active ? 'rgba(255,255,255,0.18)' : dmTheme.chip,
      color: active ? 'rgba(255,255,255,0.8)' : dmTheme.textMuted,
      fontSize: 10.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
    }}>{count}</span>
  </span>
);

// ─── Suggestions card ─────
const ideaChips = [
  'Happy hour on drinks',
  'Lunch combo bundle',
  'Loyalty discount for repeat customers',
];

const PromoSuggestions = () => (
  <div style={{
    marginTop: 24, padding: 18,
    background: '#FCFBF8', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <ISparkle size={14} style={{ color: dmTheme.accent }} />
      <span style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2 }}>
        Ideas to try
      </span>
      <span style={{ fontSize: 12, color: dmTheme.textMuted }}>· click to start from a template</span>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ideaChips.map(label => (
        <span key={label} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 20,
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          fontSize: 12.5, fontWeight: 500, color: dmTheme.text, cursor: 'pointer',
        }}>
          <IPlus size={11} sw={2.2} style={{ color: dmTheme.accent }} />
          {label}
        </span>
      ))}
    </div>
  </div>
);

// ─── Promo list tab body ─────
const PromoListBody = () => (
  <div>
    {/* Section header */}
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 16,
    }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.4 }}>
          Promotions
        </h2>
        <div style={{ fontSize: 13, color: dmTheme.textMuted, marginTop: 2 }}>
          Running and scheduled offers for this menu
        </div>
      </div>
      <Btn variant="primary" icon={IPlus}>New promotion</Btn>
    </div>

    {/* Filters */}
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      <PromoFilterChip label="All"       count={4} active={true}  />
      <PromoFilterChip label="Active"    count={2} active={false} />
      <PromoFilterChip label="Scheduled" count={1} active={false} />
      <PromoFilterChip label="Ended"     count={1} active={false} />
    </div>

    {/* Grid */}
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
    }}>
      {promosData.map((p, i) => <PromoCard key={i} promo={p} />)}
    </div>

    <PromoSuggestions />
  </div>
);

// ─── Promo FREE locked ─────
const PromoLockedBody = () => (
  <div style={{ position: 'relative', minHeight: 640 }}>
    {/* Ghost card behind */}
    <div style={{
      filter: 'blur(6px)', opacity: 0.4, pointerEvents: 'none',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 860, margin: '0 auto',
    }}>
      <PromoCard promo={promosData[0]} />
      <PromoCard promo={promosData[1]} />
    </div>
    {/* Upgrade card */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 460, padding: 30,
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 14, textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: dmTheme.accentSoft, color: dmTheme.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <ITag size={20} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, color: dmTheme.text, marginBottom: 8, letterSpacing: -0.4 }}>
        Promotions are a STARTER feature
      </div>
      <div style={{ fontSize: 13, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 18 }}>
        Launch timed offers, happy hours and seasonal specials.
        Promotions drive <strong style={{ color: dmTheme.text, fontWeight: 600 }}>3× more scans</strong> on average.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, textAlign: 'left' }}>
        {['Unlimited active promotions', 'Auto-expire on end date', 'Schedule ahead of time'].map(b => (
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
      <Btn variant="primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13.5, marginBottom: 8 }}>
        Upgrade to STARTER — 29₾/month
      </Btn>
      <div style={{
        fontSize: 12, color: dmTheme.textMuted, fontWeight: 500, cursor: 'pointer',
      }}>
        See PRO features →
      </div>
    </div>
  </div>
);

// ─── Promo drawer ─────
const FormField = ({ label, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
      {label}
    </div>
    {children}
    {hint && (
      <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 6, lineHeight: 1.4 }}>
        {hint}
      </div>
    )}
  </div>
);

const SegIcon = ({ icon: Icon, label, active, sublabel }) => (
  <div style={{
    flex: 1, padding: '12px 10px', borderRadius: 8,
    background: active ? '#fff' : 'transparent',
    border: `1px solid ${active ? dmTheme.accent : dmTheme.border}`,
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    boxShadow: active ? `0 0 0 3px ${dmTheme.accentSoft}` : 'none',
  }}>
    <Icon size={16} style={{ color: active ? dmTheme.accent : dmTheme.textMuted }} sw={active ? 1.9 : 1.5} />
    <div style={{ fontSize: 11.5, fontWeight: active ? 600 : 500, color: active ? dmTheme.text : dmTheme.textMuted, textAlign: 'center', lineHeight: 1.2 }}>
      {label}
    </div>
  </div>
);

const IPercent = (p) => <Ic {...p}><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M19 5L5 19" /></Ic>;
const ICurrency = (p) => <Ic {...p}><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6M12 3v2M12 19v2" /></Ic>;
const IGift = (p) => <Ic {...p}><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></Ic>;

const Radio = ({ checked }) => (
  <span style={{
    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
    border: `2px solid ${checked ? dmTheme.accent : dmTheme.border}`,
    background: '#fff', position: 'relative',
  }}>
    {checked && (
      <span style={{
        position: 'absolute', inset: 3, borderRadius: '50%',
        background: dmTheme.accent,
      }} />
    )}
  </span>
);

const DayPill = ({ label, active }) => (
  <span style={{
    width: 32, height: 32, borderRadius: 7,
    background: active ? dmTheme.text : '#fff',
    color: active ? '#fff' : dmTheme.textMuted,
    border: `1px solid ${active ? dmTheme.text : dmTheme.border}`,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
  }}>{label}</span>
);

const PromoDrawer = () => (
  <div style={{
    position: 'absolute', top: 0, right: 0, width: 540, height: '100%',
    background: '#fff', borderLeft: `1px solid ${dmTheme.border}`,
    boxShadow: '-12px 0 40px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', zIndex: 4,
  }}>
    {/* Header */}
    <div style={{
      padding: '16px 20px', borderBottom: `1px solid ${dmTheme.border}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 7,
        background: 'linear-gradient(135deg, #B8633D, #7A3F27)',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2 }}>
          New promotion
        </div>
        <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 1 }}>
          Draft · not yet saved
        </div>
      </div>
      <IX size={18} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
    </div>

    {/* Tabs */}
    <div style={{ display: 'flex', borderBottom: `1px solid ${dmTheme.border}`, padding: '0 20px' }}>
      {['Details', 'Appearance', 'Schedule'].map((t, i) => (
        <span key={t} style={{
          padding: '10px 14px', fontSize: 13, fontWeight: 500,
          color: i === 0 ? dmTheme.text : dmTheme.textMuted,
          borderBottom: `2px solid ${i === 0 ? dmTheme.text : 'transparent'}`,
          cursor: 'pointer', marginBottom: -1,
        }}>{t}</span>
      ))}
    </div>

    {/* Body */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0' }}>
      <FormField label="Title">
        <LangTabsInline active="KA" statuses={{ KA: 'filled', EN: 'filled', RU: 'empty' }} />
        <Input value="ბედნიერი საათი" />
      </FormField>

      <FormField label="Short description" hint="Shown beneath the banner on the public menu.">
        <LangTabsInline active="KA" statuses={{ KA: 'filled', EN: 'filled', RU: 'empty' }} />
        <div style={{
          padding: '9px 11px', border: `1px solid ${dmTheme.border}`, borderRadius: 8,
          background: '#fff', minHeight: 62, fontSize: 13, color: dmTheme.text,
        }}>
          ყოველ საღამოს 18:00-დან 20:00-მდე — ჩვენი ხელით მომზადებული კოქტეილები 20% ფასდაკლებით.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: dmTheme.textSubtle, fontFamily: 'ui-monospace', fontVariantNumeric: 'tabular-nums' }}>
            114 / 160
          </span>
        </div>
      </FormField>

      <FormField label="Discount type">
        <div style={{ display: 'flex', gap: 8 }}>
          <SegIcon icon={IPercent}  label="Percentage off" active={true} />
          <SegIcon icon={ICurrency} label="Fixed amount (₾)" />
          <SegIcon icon={IGift}     label="Free add-on" />
        </div>
      </FormField>

      <FormField label="Discount value" hint={<>A <strong style={{ color: dmTheme.text, fontWeight: 600 }}>50₾</strong> item becomes <strong style={{ color: dmTheme.text, fontWeight: 600 }}>40₾</strong>.</>}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          border: `1px solid ${dmTheme.border}`, borderRadius: 8,
          background: '#fff', overflow: 'hidden',
          maxWidth: 180,
        }}>
          <span style={{
            flex: 1, padding: '9px 12px', fontSize: 14, fontWeight: 600,
            color: dmTheme.text, fontFamily: 'ui-monospace', fontVariantNumeric: 'tabular-nums',
          }}>20</span>
          <span style={{
            padding: '9px 14px', background: dmTheme.chip,
            color: dmTheme.textMuted, fontSize: 13, fontWeight: 600,
            borderLeft: `1px solid ${dmTheme.border}`,
          }}>%</span>
        </div>
      </FormField>

      <FormField label="Apply to">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Entire menu */}
          <div style={{
            padding: '12px 14px', border: `1px solid ${dmTheme.border}`,
            borderRadius: 8, background: '#fff',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <Radio checked={false} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>Entire menu</div>
              <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>Applies to all 87 items</div>
            </div>
          </div>
          {/* Specific category (selected) */}
          <div style={{
            padding: '12px 14px', border: `1.5px solid ${dmTheme.accent}`,
            borderRadius: 8, background: '#fff',
            display: 'flex', flexDirection: 'column', gap: 12,
            boxShadow: `0 0 0 3px ${dmTheme.accentSoft}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Radio checked={true} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>Specific category</div>
                <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>Pick one category to discount</div>
              </div>
            </div>
            <div style={{
              marginLeft: 28,
              padding: '8px 12px', border: `1px solid ${dmTheme.border}`, borderRadius: 7,
              background: dmTheme.bg,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 15 }}>🍸</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 550, color: dmTheme.text }}>Cocktails</span>
              <span style={{ fontSize: 11, color: dmTheme.textMuted, fontVariantNumeric: 'tabular-nums' }}>12 items</span>
              <IChevDown size={13} style={{ color: dmTheme.textMuted }} />
            </div>
          </div>
          {/* Specific items */}
          <div style={{
            padding: '12px 14px', border: `1px solid ${dmTheme.border}`,
            borderRadius: 8, background: '#fff',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <Radio checked={false} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>Specific items</div>
              <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>Pick individual items to discount</div>
            </div>
          </div>
        </div>
      </FormField>

      <FormField label="Time restrictions">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', marginBottom: 12,
          background: '#fff', border: `1px solid ${dmTheme.border}`, borderRadius: 8,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>Limit to specific days & hours</div>
            <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>When off, runs all day every day within the dates.</div>
          </div>
          <Toggle on={true} />
        </div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <DayPill key={i} label={d} active={true} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, padding: '8px 11px', border: `1px solid ${dmTheme.border}`,
            borderRadius: 7, background: '#fff',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <IClock size={13} style={{ color: dmTheme.textMuted }} />
            <span style={{ fontSize: 13, color: dmTheme.text, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace' }}>
              18:00
            </span>
          </div>
          <span style={{ fontSize: 12, color: dmTheme.textMuted }}>to</span>
          <div style={{
            flex: 1, padding: '8px 11px', border: `1px solid ${dmTheme.border}`,
            borderRadius: 7, background: '#fff',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <IClock size={13} style={{ color: dmTheme.textMuted }} />
            <span style={{ fontSize: 13, color: dmTheme.text, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace' }}>
              20:00
            </span>
          </div>
        </div>
      </FormField>
      <div style={{ height: 16 }} />
    </div>

    {/* Footer */}
    <div style={{
      flexShrink: 0, padding: '14px 20px', borderTop: `1px solid ${dmTheme.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      background: dmTheme.bg,
    }}>
      <Btn>Cancel</Btn>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn>Save as draft</Btn>
        <Btn variant="primary">Save & activate</Btn>
      </div>
    </div>
  </div>
);

// ─── Annotation tooltip for drawer variant ─────
const PromoDrawerAnnotation = () => (
  <div style={{
    position: 'absolute',
    top: 352, left: 360,
    width: 220,
    zIndex: 5,
  }}>
    {/* arrow */}
    <svg width="60" height="22" style={{ position: 'absolute', right: -4, top: 30, transform: 'rotate(0deg)' }}>
      <path d="M 2 2 Q 30 8 54 12" stroke={dmTheme.accent} strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      <path d="M 54 12 L 48 8 M 54 12 L 50 16" stroke={dmTheme.accent} strokeWidth="1.5" fill="none" />
    </svg>
    <div style={{
      padding: '10px 13px',
      background: dmTheme.text, color: '#fff',
      borderRadius: 8,
      fontSize: 12, lineHeight: 1.5,
      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: dmTheme.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
        <ISparkle size={11} /> Tip
      </div>
      Free add-ons are popular for coffee or dessert pairings.
    </div>
  </div>
);

// ─── Page wrappers — all use EditorHeader to show context ─────
const EditorPromotionsListPage = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <EditorHeader activeTab="promotions" />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <PromoListBody />
    </div>
  </div>
);

const EditorPromotionsLockedPage = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <EditorHeader activeTab="promotions" />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <PromoLockedBody />
    </div>
  </div>
);

const EditorPromotionsDrawerPage = () => (
  <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    {/* dimmed list behind */}
    <div style={{ height: '100%', filter: 'blur(1px)', opacity: 0.5, pointerEvents: 'none' }}>
      <EditorPromotionsListPage />
    </div>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(24, 24, 27, 0.18)',
    }} />
    <PromoDrawer />
    <PromoDrawerAnnotation />
  </div>
);

Object.assign(window, {
  EditorPromotionsListPage,
  EditorPromotionsLockedPage,
  EditorPromotionsDrawerPage,
});
