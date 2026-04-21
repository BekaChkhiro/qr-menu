// Menus list, activity, top items, upgrade card, empty state

// ─── Menu thumbnail (placeholder striped SVG) ─────────
const MenuThumb = ({ tone = 'a', size = 40 }) => {
  const palettes = {
    a: ['#C9B28A', '#8B6F47'],
    b: ['#B8633D', '#7A3F27'],
    c: ['#6B7F6B', '#3F5B3F'],
    d: ['#8A7CA0', '#5D4F70'],
  };
  const [c1, c2] = palettes[tone] || palettes.a;
  return (
    <div style={{
      width: size, height: size, borderRadius: 7,
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      <IUtensils size={size * 0.45}
        style={{ position: 'absolute', inset: 0, margin: 'auto', color: 'rgba(255,255,255,0.7)' }} />
    </div>
  );
};

// ─── Status pill ─────────
const StatusPill = ({ status }) => {
  const cfg = status === 'Published'
    ? { bg: dmTheme.successSoft, color: dmTheme.success, dot: dmTheme.success }
    : { bg: dmTheme.chip, color: dmTheme.textMuted, dot: dmTheme.textSubtle };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 6, background: cfg.bg,
      color: cfg.color, fontSize: 11.5, fontWeight: 550,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {status}
    </span>
  );
};

// ─── Menus table ─────────
const menuRows = [
  { thumb: 'a', name: 'Main menu — All day',      status: 'Published', today: 384, week: 2410, edited: '2 hours ago' },
  { thumb: 'b', name: 'Brunch — Weekends',         status: 'Published', today: 192, week: 1205, edited: '1 day ago' },
  { thumb: 'c', name: 'Wine & cocktails',          status: 'Published', today: 86,  week: 512,  edited: '3 days ago' },
  { thumb: 'd', name: 'Seasonal · Spring tasting', status: 'Draft',     today: 0,   week: 0,    edited: '6 days ago' },
];

const FilterPill = ({ label, count, active }) => (
  <button style={{
    padding: '5px 11px', border: `1px solid ${active ? dmTheme.text : dmTheme.border}`,
    background: active ? dmTheme.text : '#fff', color: active ? '#fff' : dmTheme.text,
    borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }}>
    {label}
    <span style={{
      padding: '0 5px', borderRadius: 4, fontSize: 10.5, fontWeight: 600,
      background: active ? 'rgba(255,255,255,0.18)' : dmTheme.chip,
      color: active ? '#fff' : dmTheme.textMuted,
      fontVariantNumeric: 'tabular-nums',
    }}>{count}</span>
  </button>
);

const YourMenus = () => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, overflow: 'hidden', marginBottom: 24,
  }}>
    {/* header */}
    <div style={{
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: `1px solid ${dmTheme.borderSoft}`,
    }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.2 }}>
        Your menus
      </h2>
      <div style={{ display: 'flex', gap: 6, marginLeft: 4 }}>
        <FilterPill label="All" count={4} active />
        <FilterPill label="Published" count={3} />
        <FilterPill label="Draft" count={1} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 10px', width: 220,
        border: `1px solid ${dmTheme.border}`, borderRadius: 7, background: '#FCFBF8',
      }}>
        <ISearch size={12.5} style={{ color: dmTheme.textSubtle }} />
        <span style={{ fontSize: 12, color: dmTheme.textSubtle }}>Search menus…</span>
      </div>
    </div>
    {/* column headers */}
    <div style={{
      padding: '9px 20px', display: 'grid',
      gridTemplateColumns: '40px 1fr 110px 150px 120px 28px',
      gap: 14, alignItems: 'center',
      fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle,
      textTransform: 'uppercase', letterSpacing: 0.5,
      background: '#FCFBF8', borderBottom: `1px solid ${dmTheme.borderSoft}`,
    }}>
      <span></span>
      <span>Menu</span>
      <span>Status</span>
      <span>Views (today / week)</span>
      <span>Last edited</span>
      <span></span>
    </div>
    {/* rows */}
    {menuRows.map((r, i) => (
      <div key={i} style={{
        padding: '12px 20px', display: 'grid',
        gridTemplateColumns: '40px 1fr 110px 150px 120px 28px',
        gap: 14, alignItems: 'center',
        borderBottom: i === menuRows.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
      }}>
        <MenuThumb tone={r.thumb} size={38} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 550, color: dmTheme.text, marginBottom: 2 }}>
            {r.name}
          </div>
          <div style={{ fontSize: 11.5, color: dmTheme.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
            <IGlobe size={11} />
            cafelinville.ge/{r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 20)}
          </div>
        </div>
        <StatusPill status={r.status} />
        <div style={{ fontSize: 13, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 550 }}>{r.today}</span>
          <span style={{ color: dmTheme.textMuted }}> · {r.week.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 12.5, color: dmTheme.textMuted }}>{r.edited}</div>
        <div style={{ display: 'flex', justifyContent: 'center', color: dmTheme.textMuted, cursor: 'pointer' }}>
          <IMore size={15} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Empty state ─────────
const templates = [
  { name: 'Café & bakery', tone: 'a', desc: 'Coffee, pastry, breakfast' },
  { name: 'Full restaurant', tone: 'b', desc: 'Starters · mains · desserts' },
  { name: 'Bar & cocktails', tone: 'c', desc: 'Wines, spirits, signature drinks' },
];

const EmptyMenusCard = () => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 14, padding: '40px 32px', textAlign: 'center',
    marginBottom: 24,
  }}>
    {/* soft illustration: layered menu cards */}
    <div style={{
      width: 110, height: 78, margin: '0 auto 22px', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 4, top: 10, width: 68, height: 60,
        borderRadius: 7, background: '#F7EDE6', transform: 'rotate(-7deg)',
      }} />
      <div style={{
        position: 'absolute', right: 4, top: 6, width: 68, height: 60,
        borderRadius: 7, background: '#E8F0E8', transform: 'rotate(6deg)',
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
        width: 72, height: 68, borderRadius: 8,
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IUtensils size={22} style={{ color: dmTheme.accent }} />
      </div>
    </div>
    <h3 style={{
      fontSize: 19, fontWeight: 600, color: dmTheme.text,
      margin: '0 0 8px', letterSpacing: -0.3,
    }}>Create your first menu</h3>
    <p style={{
      fontSize: 13.5, color: dmTheme.textMuted,
      margin: '0 auto 20px', maxWidth: 400, lineHeight: 1.55,
    }}>
      Pick a template to start faster, or build from scratch. You can change
      everything — categories, items, pricing, languages — later.
    </p>

    {/* templates */}
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
      {templates.map((t, i) => (
        <div key={i} style={{
          width: 180, padding: 12, border: `1px solid ${dmTheme.border}`,
          borderRadius: 10, background: '#FCFBF8', cursor: 'pointer',
          textAlign: 'left',
        }}>
          <MenuThumb tone={t.tone} size={48} />
          <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text, margin: '10px 0 2px' }}>
            {t.name}
          </div>
          <div style={{ fontSize: 11.5, color: dmTheme.textMuted, lineHeight: 1.4 }}>
            {t.desc}
          </div>
        </div>
      ))}
    </div>

    <button style={{
      padding: '9px 18px', background: dmTheme.text, color: '#fff',
      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 550,
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
    }}>
      <IPlus size={14} sw={2.2} />
      Create from scratch
    </button>
  </div>
);

// ─── Activity feed ─────────
const activity = [
  { icon: IPlus,   tone: 'success', text: <>Added <b>Cappuccino (oat)</b> to <b>Drinks</b></>, meta: '2h ago' },
  { icon: ICircCheck, tone: 'success', text: <>Published <b>Main menu — All day</b></>, meta: 'Yesterday, 18:42' },
  { icon: IEdit,  tone: 'neutral', text: <>Edited price for <b>Khachapuri Adjaruli</b> (18₾ → 22₾)</>, meta: 'Yesterday, 14:10' },
  { icon: IClock, tone: 'neutral', text: <>Promotion <b>Happy Hour</b> ended</>, meta: '2d ago' },
  { icon: IQr,    tone: 'accent',  text: <>Scanned QR for table 6 · 14 views in 10 min</>, meta: '2d ago' },
  { icon: ITag,   tone: 'neutral', text: <>Created category <b>Seasonal</b></>, meta: '4d ago' },
];

const ActivityFeed = () => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: '18px 20px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <h2 style={{ fontSize: 14.5, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.2 }}>
        Recent activity
      </h2>
      <a style={{ fontSize: 12, color: dmTheme.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        View all <IArrowRight size={11} />
      </a>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {activity.map((a, i) => {
        const toneCfg = {
          success: { bg: dmTheme.successSoft, color: dmTheme.success },
          neutral: { bg: dmTheme.chip,         color: dmTheme.textMuted },
          accent:  { bg: dmTheme.accentSoft,   color: dmTheme.accent },
        }[a.tone];
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
            borderBottom: i === activity.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: toneCfg.bg, color: toneCfg.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1,
            }}>
              <a.icon size={13} sw={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.8, color: dmTheme.text, lineHeight: 1.45 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: dmTheme.textSubtle, marginTop: 1 }}>{a.meta}</div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Top performing items ─────────
const topItems = [
  { name: 'Khachapuri Adjaruli',     cat: 'Mains',    views: 1842, thumb: 'b' },
  { name: 'Flat white',               cat: 'Drinks',   views: 1580, thumb: 'a' },
  { name: 'Badrijani Nigvzit',        cat: 'Starters', views: 1220, thumb: 'c' },
  { name: 'Tarkhun lemonade',         cat: 'Drinks',   views: 968,  thumb: 'd' },
  { name: 'Pastry of the day',        cat: 'Bakery',   views: 742,  thumb: 'a' },
];

const TopItems = () => {
  const maxViews = Math.max(...topItems.map(i => i.views));
  return (
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 14.5, fontWeight: 600, color: dmTheme.text, margin: 0, letterSpacing: -0.2 }}>
          Top-performing items
        </h2>
        <span style={{ fontSize: 11.5, color: dmTheme.textMuted }}>by views · 30d</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {topItems.map((item, i) => {
          const pct = (item.views / maxViews) * 100;
          return (
            <div key={i} style={{
              position: 'relative', padding: '9px 10px',
              borderRadius: 7, marginLeft: -10, marginRight: -10,
              overflow: 'hidden',
            }}>
              {/* bg bar */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to right, ${dmTheme.accentSoft} ${pct}%, transparent ${pct}%)`,
                opacity: 0.5,
              }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{
                  width: 20, fontSize: 11, fontWeight: 600, color: dmTheme.textMuted,
                  fontVariantNumeric: 'tabular-nums', textAlign: 'center',
                }}>#{i + 1}</span>
                <MenuThumb tone={item.thumb} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: dmTheme.textMuted }}>{item.cat}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
                  {item.views.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Upgrade card (dark brand) ─────────
const UpgradeCard = () => (
  <div style={{
    background: 'radial-gradient(ellipse at top left, #2A2A30, #18181B)',
    color: '#fff', borderRadius: 14, padding: '22px 24px',
    border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
    overflow: 'hidden',
  }}>
    {/* subtle terracotta corner */}
    <div style={{
      position: 'absolute', right: -40, top: -40, width: 180, height: 180,
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,99,61,0.35), transparent 70%)',
    }} />
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 9px', background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 5, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4,
          marginBottom: 12,
        }}>
          <ISparkle size={11} style={{ color: '#E8B477' }} />
          <span style={{ color: '#E8B477' }}>PRO</span>
        </div>
        <h3 style={{
          fontSize: 19, fontWeight: 600, margin: '0 0 6px',
          letterSpacing: -0.3, lineHeight: 1.25, maxWidth: 480,
        }}>
          Unlock analytics, multilingual menus, and allergen info.
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 14px', maxWidth: 480 }}>
          Everything you need to run a professional menu operation.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {[
            'Real-time analytics — views, scans, conversion by item',
            'Menus in 3 languages (KA · EN · RU) with auto-translate',
            'Allergens, diet badges & nutritional info per item',
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: 'rgba(232,180,119,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#E8B477', flexShrink: 0,
              }}>
                <ICheck size={10} sw={2.5} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.88)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>from</div>
        <div style={{
          fontSize: 32, fontWeight: 600, letterSpacing: -0.8,
          fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>
          59<span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>₾</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>per month</div>
        <button style={{
          padding: '10px 20px', background: '#fff', color: dmTheme.text,
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7,
          whiteSpace: 'nowrap',
        }}>
          Upgrade to PRO
          <IArrowRight size={13} sw={2} />
        </button>
      </div>
    </div>
  </div>
);

Object.assign(window, {
  YourMenus, EmptyMenusCard, ActivityFeed, TopItems, UpgradeCard,
});
