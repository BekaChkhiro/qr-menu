// Section A — Menus screens: grid, table, empty

// ─── Menu cover (gradient + utensils) ─────
const MenuCover = ({ tone = 'a', height = 140 }) => {
  const palettes = {
    a: ['#C9B28A', '#8B6F47'],
    b: ['#B8633D', '#7A3F27'],
    c: ['#6B7F6B', '#3F5B3F'],
    d: ['#8A7CA0', '#5D4F70'],
    e: ['#D4A373', '#8B5A2B'],
    f: ['#5D7A91', '#344C63'],
  };
  const [c1, c2] = palettes[tone] || palettes.a;
  return (
    <div style={{
      width: '100%', height, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
    }}>
      {/* subtle diagonal stripes */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 12px, transparent 12px 24px)',
      }} />
      <IUtensils size={40} style={{
        position: 'absolute', inset: 0, margin: 'auto',
        color: 'rgba(255,255,255,0.75)',
      }} />
    </div>
  );
};

const menusData = [
  { tone: 'a', name: 'Main menu — All day',      status: 'Published', cats: 6, items: 52, slug: 'main',            views: '2,410' },
  { tone: 'b', name: 'Brunch — Weekends',         status: 'Published', cats: 4, items: 28, slug: 'brunch',          views: '1,205' },
  { tone: 'c', name: 'Wine & cocktails',          status: 'Published', cats: 5, items: 41, slug: 'drinks',          views: '512' },
  { tone: 'd', name: 'Seasonal · Spring tasting', status: 'Draft',     cats: 3, items: 14, slug: 'spring-2026',     views: '—' },
  { tone: 'e', name: 'Kids menu',                 status: 'Draft',     cats: 2, items: 9,  slug: 'kids',            views: '—' },
  { tone: 'f', name: 'Corporate lunch',           status: 'Archived',  cats: 3, items: 18, slug: 'corporate-2024',  views: '—' },
];

// ─── View toggle Grid/Table ─────
const ViewToggle = ({ view }) => (
  <div style={{
    display: 'inline-flex', border: `1px solid ${dmTheme.border}`,
    borderRadius: 7, background: '#fff', padding: 2,
  }}>
    {[
      { id: 'grid', icon: IGrid },
      { id: 'table', icon: IList },
    ].map(v => (
      <div key={v.id} style={{
        padding: '5px 8px', borderRadius: 5,
        background: view === v.id ? dmTheme.chip : 'transparent',
        color: view === v.id ? dmTheme.text : dmTheme.textMuted,
        cursor: 'pointer', display: 'flex',
      }}>
        <v.icon size={14} />
      </div>
    ))}
  </div>
);

// ─── Menus page header ─────
const MenusPageHeader = ({ view = 'grid' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
    <div>
      <h1 style={{
        fontSize: 26, fontWeight: 600, color: dmTheme.text,
        letterSpacing: -0.5, margin: 0, lineHeight: 1.15,
      }}>Menus</h1>
      <p style={{ fontSize: 13.5, color: dmTheme.textMuted, margin: '5px 0 0' }}>
        3 of 3 used on <span style={{ color: dmTheme.text, fontWeight: 550 }}>STARTER</span>.
        Publish, organize and reorder your restaurant's menus.
      </p>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <ViewToggle view={view} />
      <Btn icon={IFilter}>Filter</Btn>
      <Btn icon={ISort}>
        Sort: Recently edited
        <IChevDown size={12} style={{ color: dmTheme.textMuted, marginLeft: 2 }} />
      </Btn>
      <Btn variant="primary" icon={IPlus}>Create new menu</Btn>
    </div>
  </div>
);

// ─── Menu card (grid view) ─────
const MenuCard = ({ menu }) => (
  <div style={{
    background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: 'box-shadow .15s, transform .15s',
  }}>
    <div style={{ position: 'relative' }}>
      <MenuCover tone={menu.tone} height={150} />
      <div style={{ position: 'absolute', top: 10, left: 10 }}>
        <StatusPill status={menu.status} />
      </div>
      <div style={{
        position: 'absolute', top: 10, right: 10,
        width: 26, height: 26, borderRadius: 6,
        background: 'rgba(255,255,255,0.95)', color: dmTheme.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', backdropFilter: 'blur(4px)',
      }}>
        <IMore size={14} />
      </div>
    </div>
    <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2, marginBottom: 3 }}>
        {menu.name}
      </div>
      <div style={{ fontSize: 12, color: dmTheme.textMuted, marginBottom: 12 }}>
        {menu.cats} categories · {menu.items} items
      </div>
      <div style={{
        marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${dmTheme.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 11.5, color: dmTheme.textMuted,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <IGlobe size={11} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            cafelinville.ge/{menu.slug}
          </span>
        </div>
        {menu.status !== 'Archived' && menu.status !== 'Draft' && (
          <span style={{ fontVariantNumeric: 'tabular-nums', color: dmTheme.text, fontWeight: 550, whiteSpace: 'nowrap' }}>
            {menu.views} <span style={{ color: dmTheme.textMuted, fontWeight: 400 }}>this week</span>
          </span>
        )}
      </div>
    </div>
  </div>
);

// ─── Plan-limit banner ─────
const PlanLimitBanner = () => (
  <div style={{
    marginTop: 20,
    background: '#fff', border: `1px solid ${dmTheme.warningSoft}`,
    borderLeft: `3px solid ${dmTheme.warning}`,
    borderRadius: 10, padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: dmTheme.warningSoft, color: dmTheme.warning,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <ILock size={15} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text }}>
        You've reached the 3-menu limit on STARTER
      </div>
      <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginTop: 2 }}>
        Upgrade to PRO for unlimited menus, multilingual support and advanced analytics.
      </div>
    </div>
    <Btn variant="primary" icon={ISparkle}>Upgrade to PRO</Btn>
  </div>
);

// ─── Menus grid page ─────
const MenusGridPage = () => (
  <div>
    <MenusPageHeader view="grid" />
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      <FilterPill label="All" count={6} active />
      <FilterPill label="Published" count={3} />
      <FilterPill label="Draft" count={2} />
      <FilterPill label="Archived" count={1} />
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
    }}>
      {menusData.map((m, i) => <MenuCard key={i} menu={m} />)}
    </div>
    <PlanLimitBanner />
  </div>
);

// ─── Menus table page ─────
const MenusTablePage = () => {
  const rows = menusData.map((m, i) => ({
    ...m,
    views7d: m.status === 'Published' ? [2410, 1205, 512][i] || 0 : 0,
    edited: ['2 hours ago', '1 day ago', '3 days ago', '6 days ago', '1 week ago', '2 months ago'][i],
  }));
  return (
    <div>
      <MenusPageHeader view="table" />
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <FilterPill label="All" count={6} active />
        <FilterPill label="Published" count={3} />
        <FilterPill label="Draft" count={2} />
        <FilterPill label="Archived" count={1} />
      </div>
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          padding: '10px 20px', display: 'grid',
          gridTemplateColumns: '40px 2fr 110px 90px 80px 110px 130px 32px',
          gap: 14, alignItems: 'center',
          fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle,
          textTransform: 'uppercase', letterSpacing: 0.5,
          background: '#FCFBF8', borderBottom: `1px solid ${dmTheme.borderSoft}`,
        }}>
          <span></span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: dmTheme.text }}>
            Menu <IChevDown size={11} />
          </span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Categories</span>
          <span style={{ textAlign: 'right' }}>Items</span>
          <span style={{ textAlign: 'right' }}>Views 7d</span>
          <span>Last edited</span>
          <span></span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{
            padding: '11px 20px', display: 'grid',
            gridTemplateColumns: '40px 2fr 110px 90px 80px 110px 130px 32px',
            gap: 14, alignItems: 'center',
            borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
          }}>
            <MenuThumb tone={r.tone} size={36} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 550, color: dmTheme.text, marginBottom: 1 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: dmTheme.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                <IGlobe size={10} /> cafelinville.ge/{r.slug}
              </div>
            </div>
            <StatusPill status={r.status} />
            <span style={{ textAlign: 'right', fontSize: 13, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>{r.cats}</span>
            <span style={{ textAlign: 'right', fontSize: 13, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>{r.items}</span>
            <span style={{ textAlign: 'right', fontSize: 13, color: r.views7d ? dmTheme.text : dmTheme.textSubtle, fontVariantNumeric: 'tabular-nums', fontWeight: r.views7d ? 550 : 400 }}>
              {r.views7d ? r.views7d.toLocaleString() : '—'}
            </span>
            <span style={{ fontSize: 12.5, color: dmTheme.textMuted }}>{r.edited}</span>
            <IMore size={15} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
          </div>
        ))}
      </div>
      <PlanLimitBanner />
    </div>
  );
};

// ─── Menus empty state page ─────
const bigTemplates = [
  { name: 'Café & bakery',      tone: 'a', desc: 'Coffee, pastry, breakfast',    items: '~30 items' },
  { name: 'Full restaurant',    tone: 'b', desc: 'Starters · mains · desserts',  items: '~60 items' },
  { name: 'Bar & cocktails',    tone: 'c', desc: 'Wines, spirits, signatures',   items: '~40 items' },
  { name: 'Blank menu',         tone: 'd', desc: 'Start from a blank slate',     items: 'Empty' },
];

const MenusEmptyPage = () => (
  <div style={{ maxWidth: 1040, margin: '0 auto' }}>
    <div style={{ marginBottom: 28, textAlign: 'center', paddingTop: 24 }}>
      {/* illustration */}
      <div style={{
        width: 130, height: 92, margin: '0 auto 24px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: 6, top: 12, width: 80, height: 72,
          borderRadius: 9, background: '#F7EDE6', transform: 'rotate(-7deg)',
          border: `1px solid ${dmTheme.border}`,
        }} />
        <div style={{
          position: 'absolute', right: 6, top: 8, width: 80, height: 72,
          borderRadius: 9, background: '#E8F0E8', transform: 'rotate(6deg)',
          border: `1px solid ${dmTheme.border}`,
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
          width: 84, height: 80, borderRadius: 10,
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IUtensils size={26} style={{ color: dmTheme.accent }} />
        </div>
      </div>
      <h1 style={{
        fontSize: 26, fontWeight: 600, color: dmTheme.text,
        margin: '0 0 8px', letterSpacing: -0.5,
      }}>Create your first menu</h1>
      <p style={{
        fontSize: 14, color: dmTheme.textMuted, margin: '0 auto 28px',
        maxWidth: 500, lineHeight: 1.55,
      }}>
        Pick a template to get started quickly, or build from scratch. You can
        change everything later — categories, items, pricing, languages, branding.
      </p>
    </div>
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20,
    }}>
      {bigTemplates.map((t, i) => (
        <div key={i} style={{
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        }}>
          <MenuCover tone={t.tone} height={110} />
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text, marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 11.5, color: dmTheme.textMuted, lineHeight: 1.4, marginBottom: 10 }}>{t.desc}</div>
            <div style={{ fontSize: 11, color: dmTheme.textSubtle, display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.items}</span>
              <span style={{ color: dmTheme.accent, fontWeight: 550, display: 'flex', alignItems: 'center', gap: 2 }}>
                Use template <IArrowRight size={10} sw={2} />
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ textAlign: 'center', marginTop: 18 }}>
      <Btn variant="primary" icon={IPlus}>Create from scratch</Btn>
    </div>
  </div>
);

Object.assign(window, { MenusGridPage, MenusTablePage, MenusEmptyPage });
