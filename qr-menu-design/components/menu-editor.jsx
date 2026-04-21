// Section B — Menu editor (Content, Branding, Languages)

// ─── Editor header inside shell ─────
const EditorHeader = ({ activeTab = 'content' }) => {
  const tabs = [
    { id: 'content',    label: 'Content' },
    { id: 'branding',   label: 'Branding' },
    { id: 'languages',  label: 'Languages' },
    { id: 'analytics',  label: 'Analytics' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'qr',         label: 'QR' },
    { id: 'settings',   label: 'Settings' },
  ];
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{
              fontSize: 24, fontWeight: 600, color: dmTheme.text,
              letterSpacing: -0.5, margin: 0, lineHeight: 1.15,
            }}>Main menu — All day</h1>
            <IEdit size={14} style={{ color: dmTheme.textSubtle, cursor: 'pointer' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: dmTheme.textMuted }}>
            {/* Draft/Published switch */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '2px 3px', background: dmTheme.chip, borderRadius: 6,
            }}>
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 550,
                background: 'transparent', color: dmTheme.textMuted, cursor: 'pointer',
              }}>Draft</span>
              <span style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 550,
                background: '#fff', color: dmTheme.success,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: dmTheme.success }} />
                Published
              </span>
            </div>
            <span>·</span>
            <span>Last published 2 days ago</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn icon={IShare}>Share</Btn>
          <Btn icon={IExternal}>View public</Btn>
          <Btn variant="primary">Save changes</Btn>
        </div>
      </div>
      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: `1px solid ${dmTheme.border}`,
      }}>
        {tabs.map(t => (
          <div key={t.id} style={{
            padding: '9px 14px', fontSize: 13, fontWeight: 500,
            color: t.id === activeTab ? dmTheme.text : dmTheme.textMuted,
            borderBottom: `2px solid ${t.id === activeTab ? dmTheme.text : 'transparent'}`,
            cursor: 'pointer', marginBottom: -1,
          }}>{t.label}</div>
        ))}
      </div>
    </div>
  );
};

// ─── Left column: Content tab ─────
const CategoryRow = ({ cat, expanded }) => (
  <div style={{ marginBottom: 6 }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 10px', borderRadius: 8,
      background: expanded ? '#fff' : 'transparent',
      border: `1px solid ${expanded ? dmTheme.border : 'transparent'}`,
      cursor: 'pointer',
    }}>
      <IDrag size={14} style={{ color: dmTheme.textSubtle, cursor: 'grab' }} />
      <span style={{ fontSize: 15 }}>{cat.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 550, color: dmTheme.text }}>{cat.name}</div>
      </div>
      <span style={{ fontSize: 11.5, color: dmTheme.textMuted, fontVariantNumeric: 'tabular-nums' }}>{cat.items} items</span>
      {expanded ? <IChevUp size={14} style={{ color: dmTheme.textMuted }} /> : <IChevDown size={14} style={{ color: dmTheme.textMuted }} />}
    </div>
    {expanded && (
      <div style={{ padding: '4px 8px 4px 28px' }}>
        {cat.products.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 7,
            border: `1px solid ${dmTheme.borderSoft}`,
            background: '#FCFBF8', marginBottom: 4,
          }}>
            <IDrag size={12} style={{ color: dmTheme.textSubtle, flexShrink: 0 }} />
            <MenuThumb tone={p.tone} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 550, color: dmTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name}
              </div>
              {p.sub && <div style={{ fontSize: 10.5, color: dmTheme.textMuted }}>{p.sub}</div>}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
              {p.price}<span style={{ color: dmTheme.textMuted, fontWeight: 400, marginLeft: 1 }}>₾</span>
            </span>
            <IMore size={13} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
          </div>
        ))}
        <div style={{
          fontSize: 12, color: dmTheme.accent, fontWeight: 500,
          padding: '6px 10px', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <IPlus size={11} sw={2.2} /> Add item to {cat.name}
        </div>
      </div>
    )}
  </div>
);

const editorCategories = [
  { name: 'Coffee & espresso', emoji: '☕', items: 14, products: [
    { tone: 'a', name: 'Flat white',      sub: 'Double shot · oat opt.', price: '12' },
    { tone: 'a', name: 'Cappuccino',      sub: 'With cocoa dust',        price: '11' },
    { tone: 'a', name: 'Americano',       sub: 'Single or double',       price: '9'  },
    { tone: 'a', name: 'Espresso',        sub: 'House blend',            price: '7'  },
  ]},
  { name: 'Starters',          emoji: '🥗', items: 9  },
  { name: 'Khachapuri',        emoji: '🧀', items: 6  },
  { name: 'Mains',             emoji: '🍽', items: 12 },
  { name: 'Desserts',          emoji: '🍰', items: 7  },
  { name: 'Drinks',            emoji: '🥤', items: 8  },
];

const ContentLeftColumn = () => (
  <div style={{
    width: 360, flexShrink: 0,
    background: '#FCFBF8', border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: 16,
    display: 'flex', flexDirection: 'column',
    maxHeight: 760,
  }}>
    {/* search */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 10px', background: '#fff',
      border: `1px solid ${dmTheme.border}`, borderRadius: 8, marginBottom: 14,
    }}>
      <ISearch size={13} style={{ color: dmTheme.textSubtle }} />
      <span style={{ fontSize: 12.5, color: dmTheme.textSubtle, flex: 1 }}>Search categories & items…</span>
    </div>
    {/* categories list */}
    <div style={{ flex: 1, overflow: 'hidden' }}>
      {editorCategories.map((c, i) => (
        <CategoryRow key={i} cat={c} expanded={i === 0} />
      ))}
      {/* Add category */}
      <div style={{
        marginTop: 10, padding: '10px 12px', borderRadius: 8,
        border: `1.5px dashed ${dmTheme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        color: dmTheme.textMuted, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
      }}>
        <IPlus size={13} sw={2} />
        Add category
      </div>
    </div>
  </div>
);

// ─── Right column: Phone preview ─────
const PhonePreview = ({ lang = 'KA' }) => (
  <div style={{
    width: 260, height: 540, borderRadius: 34,
    background: '#1a1a1a', padding: 8,
    boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 3px 10px rgba(0,0,0,0.04)',
    position: 'relative',
  }}>
    {/* notch */}
    <div style={{
      position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
      width: 80, height: 22, background: '#1a1a1a', borderRadius: 12, zIndex: 2,
    }} />
    <div style={{
      width: '100%', height: '100%', borderRadius: 28,
      background: '#FCFBF8', overflow: 'hidden', position: 'relative',
    }}>
      {/* status bar */}
      <div style={{
        height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 22px 0', fontSize: 10, fontWeight: 600, color: dmTheme.text,
      }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
        <span style={{ display: 'flex', gap: 3 }}>
          <span style={{ width: 14, height: 7, border: `1px solid ${dmTheme.text}`, borderRadius: 2 }} />
        </span>
      </div>
      {/* hero */}
      <MenuCover tone="b" height={80} />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: dmTheme.text, letterSpacing: -0.3 }}>
          Café Linville
        </div>
        <div style={{ fontSize: 9.5, color: dmTheme.textMuted, marginTop: 2 }}>Tbilisi · Vera · All day</div>
        {/* tabs */}
        <div style={{
          display: 'flex', gap: 6, marginTop: 10, overflow: 'hidden',
        }}>
          {['Coffee', 'Starters', 'Khach.', 'Mains'].map((t, i) => (
            <span key={i} style={{
              padding: '3px 8px', fontSize: 9.5, fontWeight: 600,
              borderRadius: 4, whiteSpace: 'nowrap',
              background: i === 0 ? dmTheme.text : dmTheme.chip,
              color: i === 0 ? '#fff' : dmTheme.textMuted,
            }}>{t}</span>
          ))}
        </div>
        {/* category title */}
        <div style={{ fontSize: 12, fontWeight: 700, color: dmTheme.text, marginTop: 14, marginBottom: 8 }}>
          {lang === 'KA' ? 'ყავა და ესპრესო' : lang === 'EN' ? 'Coffee & espresso' : 'Кофе и эспрессо'}
        </div>
        {/* items */}
        {[
          { name: lang === 'KA' ? 'ფლეტ უაითი' : 'Flat white',  price: '12', sub: lang === 'KA' ? 'ორმაგი' : 'Double shot' },
          { name: lang === 'KA' ? 'კაპუჩინო' : 'Cappuccino',     price: '11', sub: lang === 'KA' ? 'კაკაოთი' : 'With cocoa dust' },
          { name: lang === 'KA' ? 'ამერიკანო' : 'Americano',      price: '9',  sub: lang === 'KA' ? 'სახლის' : 'Single or double' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '7px 0', borderTop: i === 0 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'linear-gradient(135deg, #C9B28A, #8B6F47)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: dmTheme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
              <div style={{ fontSize: 8.5, color: dmTheme.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
              {item.price}<span style={{ color: dmTheme.textMuted, fontWeight: 400, marginLeft: 1 }}>₾</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LanguageTabs = ({ active = 'KA' }) => (
  <div style={{
    display: 'inline-flex', background: '#fff', border: `1px solid ${dmTheme.border}`,
    borderRadius: 7, padding: 2,
  }}>
    {['KA', 'EN', 'RU'].map(l => (
      <span key={l} style={{
        padding: '4px 12px', fontSize: 12, fontWeight: 600,
        borderRadius: 5,
        background: l === active ? dmTheme.text : 'transparent',
        color: l === active ? '#fff' : dmTheme.textMuted,
        cursor: 'pointer',
      }}>{l}</span>
    ))}
  </div>
);

const PreviewColumn = ({ children, lang = 'KA' }) => (
  <div style={{
    flex: 1, background: dmTheme.bg,
    border: `1px solid ${dmTheme.border}`,
    borderRadius: 12, padding: '16px 24px 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    minWidth: 0,
  }}>
    <div style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 18,
    }}>
      <LanguageTabs active={lang} />
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn small icon={IShare}>Share</Btn>
        <Btn small icon={IExternal}>View public</Btn>
      </div>
    </div>
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children || <PhonePreview lang={lang} />}
    </div>
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      fontSize: 11.5, color: dmTheme.textMuted, marginTop: 16,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: dmTheme.success,
        boxShadow: `0 0 0 3px ${dmTheme.successSoft}`,
      }} />
      Preview updates in real time
    </div>
  </div>
);

// ─── Editor: Content tab ─────
const EditorContentPage = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <EditorHeader activeTab="content" />
    <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
      <ContentLeftColumn />
      <PreviewColumn lang="KA" />
    </div>
  </div>
);

// ─── Editor: Branding tab ─────
const BrandingLeftColumn = () => {
  const colorPalette = ['#18181B', '#B8633D', '#3F7E3F', '#5D7A91', '#8A5E3C', '#7A5A8C', '#C9B28A', '#B8423D'];
  return (
    <div style={{
      width: 360, flexShrink: 0,
      background: '#FCFBF8', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 18,
      maxHeight: 760, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
          Logo
        </div>
        <div style={{
          width: 200, height: 200, borderRadius: 10,
          border: `1.5px dashed ${dmTheme.border}`, background: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, color: dmTheme.textMuted, cursor: 'pointer',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: dmTheme.chip,
            color: dmTheme.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IUpload size={17} />
          </div>
          <div style={{ fontSize: 12, color: dmTheme.text, fontWeight: 550 }}>Drop logo here</div>
          <div style={{ fontSize: 10.5, color: dmTheme.textMuted }}>PNG, SVG · up to 2 MB</div>
        </div>
      </div>
      {/* Cover */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
          Cover image
        </div>
        <div style={{
          aspectRatio: '16 / 9', borderRadius: 10,
          background: 'linear-gradient(135deg, #B8633D, #7A3F27)',
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 12px, transparent 12px 24px)',
          }} />
          <div style={{
            position: 'absolute', top: 8, right: 8,
            padding: '4px 9px', background: 'rgba(255,255,255,0.95)', borderRadius: 5,
            fontSize: 11, fontWeight: 550, color: dmTheme.text,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <IImage size={11} /> Replace
          </div>
        </div>
      </div>
      {/* Color */}
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
          Primary color
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {colorPalette.map((c, i) => (
            <div key={i} style={{
              width: 26, height: 26, borderRadius: 6, background: c,
              border: c === '#B8633D' ? `2px solid ${dmTheme.text}` : `1px solid ${dmTheme.borderSoft}`,
              cursor: 'pointer', boxSizing: 'border-box',
            }} />
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 10px', background: '#fff',
          border: `1px solid ${dmTheme.border}`, borderRadius: 7,
        }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: '#B8633D' }} />
          <span style={{ fontSize: 12, color: dmTheme.textMuted }}>#</span>
          <span style={{ fontSize: 13, fontFamily: 'ui-monospace, monospace', color: dmTheme.text }}>B8633D</span>
        </div>
      </div>
    </div>
  );
};

const BrandingLeftColumnExtras = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    {/* Font */}
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
        Font family
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 8, cursor: 'pointer',
      }}>
        <IType size={14} style={{ color: dmTheme.textMuted }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>Inter</div>
          <div style={{ fontSize: 10.5, color: dmTheme.textMuted }}>Geometric sans · good for menus</div>
        </div>
        <IChevDown size={13} style={{ color: dmTheme.textMuted }} />
      </div>
    </div>
    {/* Radius */}
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Corner radius
        </div>
        <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>12px</span>
      </div>
      <div style={{
        position: 'relative', height: 28, display: 'flex', alignItems: 'center',
      }}>
        <div style={{ height: 4, width: '100%', background: dmTheme.chip, borderRadius: 2, position: 'relative' }}>
          <div style={{ height: '100%', width: '50%', background: dmTheme.text, borderRadius: 2 }} />
          <div style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', border: `2px solid ${dmTheme.text}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: dmTheme.textSubtle, marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
        <span>0</span><span>24</span>
      </div>
    </div>
  </div>
);

const EditorBrandingPage = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <EditorHeader activeTab="branding" />
    <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 360 }}>
        <BrandingLeftColumn />
        <div style={{
          background: '#FCFBF8', border: `1px solid ${dmTheme.border}`,
          borderRadius: 12, padding: 18,
        }}>
          <BrandingLeftColumnExtras />
        </div>
      </div>
      <PreviewColumn lang="KA" />
    </div>
  </div>
);

// ─── Editor: Languages tab ─────
const translationRows = [
  { label: 'Category: Coffee & espresso',  ka: true,  en: true,  ru: true  },
  { label: 'Flat white',                    ka: true,  en: true,  ru: false },
  { label: 'Cappuccino',                    ka: true,  en: true,  ru: false },
  { label: 'Americano',                     ka: true,  en: false, ru: true  },
  { label: 'Espresso',                      ka: true,  en: true,  ru: true  },
  { label: 'Category: Khachapuri',          ka: true,  en: true,  ru: true  },
  { label: 'Khachapuri Adjaruli',           ka: true,  en: true,  ru: false },
  { label: 'Khachapuri Imeruli',            ka: true,  en: false, ru: false },
  { label: 'Category: Mains',               ka: true,  en: true,  ru: false },
  { label: 'Chakapuli',                     ka: true,  en: false, ru: false },
];

const LangToggle = ({ code, label, on, locked, primary }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 10,
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: on ? dmTheme.accentSoft : dmTheme.chip,
      color: on ? dmTheme.accent : dmTheme.textMuted,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, letterSpacing: 0.2,
    }}>{code}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text }}>{label}</div>
      <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>
        {primary ? 'Primary language · always on' : on ? 'Enabled for this menu' : 'Not enabled'}
      </div>
    </div>
    {/* toggle */}
    <div style={{
      width: 34, height: 20, borderRadius: 10,
      background: on ? dmTheme.text : dmTheme.chip,
      position: 'relative', cursor: locked ? 'not-allowed' : 'pointer',
      opacity: locked ? 0.6 : 1,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transition: 'left .15s',
      }} />
    </div>
  </div>
);

const TCell = ({ on }) => on
  ? <div style={{
      width: 20, height: 20, borderRadius: 5, margin: '0 auto',
      background: dmTheme.successSoft, color: dmTheme.success,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <ICheck size={12} sw={2.4} />
    </div>
  : <div style={{
      width: 20, height: 20, borderRadius: 5, margin: '0 auto',
      background: dmTheme.chip, color: dmTheme.textSubtle,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IX size={11} sw={2} />
    </div>;

const EditorLanguagesPage = ({ plan = 'STARTER' }) => {
  const locked = plan === 'STARTER' || plan === 'FREE';
  const missing = translationRows.reduce((n, r) => n + (r.en ? 0 : 1) + (r.ru ? 0 : 1), 0);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <EditorHeader activeTab="languages" />
      <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
        {/* Left: languages toggles */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            Languages
          </div>
          <LangToggle code="KA" label="ქართული · Georgian" on={true} locked primary />
          <LangToggle code="EN" label="English" on={true} />
          <LangToggle code="RU" label="Русский · Russian" on={true} />
          <LangToggle code="TR" label="Türkçe · Turkish" on={false} />

          {/* Auto-translate panel */}
          <div style={{
            marginTop: 10,
            background: locked ? '#FCFBF8' : dmTheme.accentSoft,
            border: `1px solid ${locked ? dmTheme.border : dmTheme.accentSoft}`,
            borderRadius: 10, padding: '14px 16px', position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ISparkle size={13} style={{ color: dmTheme.accent }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>Auto-translate missing</span>
              {locked && (
                <span style={{
                  marginLeft: 'auto', padding: '1px 7px', borderRadius: 4,
                  background: '#E8F0E8', color: dmTheme.success,
                  fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
                }}>PRO</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: dmTheme.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
              {locked
                ? 'Auto-translate is a PRO feature. Fills in missing translations using DeepL, reviewed before publish.'
                : `Fill in ${missing} missing translations across EN and RU using DeepL.`}
            </div>
            <Btn variant={locked ? 'secondary' : 'primary'} icon={locked ? ILock : ISparkle} small>
              {locked ? 'Upgrade to use' : `Translate ${missing} missing`}
            </Btn>
          </div>
        </div>

        {/* Right: translation table */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 18px', display: 'flex', alignItems: 'center',
            borderBottom: `1px solid ${dmTheme.borderSoft}`,
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text }}>Translation status</div>
              <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 1 }}>
                {translationRows.length - missing} of {translationRows.length * 3 - translationRows.length} translated ·{' '}
                <span style={{ color: dmTheme.warning, fontWeight: 550 }}>{missing} missing</span>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <Btn small icon={IFilter}>Show missing only</Btn>
          </div>
          {/* header */}
          <div style={{
            padding: '9px 18px', display: 'grid',
            gridTemplateColumns: '1fr 70px 70px 70px',
            gap: 12, alignItems: 'center',
            fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle,
            textTransform: 'uppercase', letterSpacing: 0.5,
            background: '#FCFBF8', borderBottom: `1px solid ${dmTheme.borderSoft}`,
          }}>
            <span>Item</span>
            <span style={{ textAlign: 'center' }}>KA</span>
            <span style={{ textAlign: 'center' }}>EN</span>
            <span style={{ textAlign: 'center' }}>RU</span>
          </div>
          {/* rows */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {translationRows.map((r, i) => {
              const isCat = r.label.startsWith('Category:');
              return (
                <div key={i} style={{
                  padding: '10px 18px', display: 'grid',
                  gridTemplateColumns: '1fr 70px 70px 70px',
                  gap: 12, alignItems: 'center',
                  borderBottom: i === translationRows.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
                  background: isCat ? '#FCFBF8' : '#fff',
                }}>
                  <span style={{
                    fontSize: 12.5, color: dmTheme.text,
                    fontWeight: isCat ? 600 : 500,
                    paddingLeft: isCat ? 0 : 14,
                  }}>{isCat ? r.label.replace('Category: ', '') : r.label}</span>
                  <TCell on={r.ka} />
                  <TCell on={r.en} />
                  <TCell on={r.ru} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  EditorContentPage, EditorBrandingPage, EditorLanguagesPage, EditorHeader,
});
