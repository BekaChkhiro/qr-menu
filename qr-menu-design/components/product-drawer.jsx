// Section C — Product editor drawer

// ─── Dimmed editor backdrop (reuses EditorContentPage inside AdminShell) ─────
const DrawerBackdrop = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, filter: 'blur(0px)' }}>
      <AdminShell plan="PRO" collapsed={false} activePath="menus"
        crumbs={['Café Linville', 'Menus', 'Main menu — All day']}>
        <EditorContentPage />
      </AdminShell>
    </div>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.28)',
    }} />
  </>
);

// ─── Shared drawer shell ─────
const Drawer = ({ title, subtitle, thumb, activeTab = 'basics', children, footer }) => {
  const tabs = [
    { id: 'basics',     label: 'Basics' },
    { id: 'variations', label: 'Variations' },
    { id: 'allergens',  label: 'Allergens', locked: true },
    { id: 'nutrition',  label: 'Nutrition' },
    { id: 'visibility', label: 'Visibility' },
  ];
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 540,
      background: '#fff',
      borderLeft: `1px solid ${dmTheme.border}`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.06), -2px 0 4px rgba(0,0,0,0.02)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{
        height: 64, flexShrink: 0, padding: '0 20px',
        borderBottom: `1px solid ${dmTheme.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {thumb && <MenuThumb tone={thumb} size={32} />}
        {!thumb && (
          <div style={{
            width: 32, height: 32, borderRadius: 7,
            background: dmTheme.accentSoft, color: dmTheme.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IPlus size={15} sw={2.2} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.2 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dmTheme.textMuted, cursor: 'pointer',
        }}>
          <IX size={16} />
        </div>
      </div>
      {/* tabs */}
      <div style={{
        flexShrink: 0, padding: '0 20px', height: 46,
        borderBottom: `1px solid ${dmTheme.border}`,
        display: 'flex', gap: 2,
      }}>
        {tabs.map(t => (
          <div key={t.id} style={{
            padding: '0 14px', height: '100%',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 500,
            color: t.id === activeTab ? dmTheme.text : dmTheme.textMuted,
            borderBottom: `2px solid ${t.id === activeTab ? dmTheme.text : 'transparent'}`,
            marginBottom: -1, cursor: 'pointer',
          }}>
            {t.label}
            {t.locked && <ILock size={10.5} style={{ color: dmTheme.textSubtle }} />}
          </div>
        ))}
      </div>
      {/* body */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 24 }}>
        {children}
      </div>
      {/* footer */}
      {footer}
    </div>
  );
};

// ─── Form building blocks ─────
const FieldLabel = ({ children, hint }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: dmTheme.text, letterSpacing: 0.1, textTransform: 'uppercase' }}>
      {children}
    </div>
    {hint && <span style={{ fontSize: 11, color: dmTheme.textSubtle }}>{hint}</span>}
  </div>
);

const Input = ({ value, placeholder, prefix, error, style, small }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: small ? '6px 10px' : '8px 12px',
    background: '#fff',
    border: `1px solid ${error ? dmTheme.danger : dmTheme.border}`,
    boxShadow: error ? `0 0 0 3px ${dmTheme.dangerSoft}` : 'none',
    borderRadius: 8,
    fontSize: small ? 12.5 : 13.5,
    color: dmTheme.text,
    ...style,
  }}>
    {prefix}
    {value
      ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      : <span style={{ color: dmTheme.textSubtle }}>{placeholder}</span>}
  </div>
);

const Toggle = ({ on }) => (
  <div style={{
    width: 32, height: 20, borderRadius: 10,
    background: on ? dmTheme.text : dmTheme.chip,
    position: 'relative',
  }}>
    <div style={{
      position: 'absolute', top: 2, left: on ? 14 : 2,
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    }} />
  </div>
);

const LangTabsInline = ({ active = 'KA', statuses = { KA: 'filled', EN: 'filled', RU: 'empty' }, locked = false }) => (
  <div style={{ display: 'flex', gap: 2, marginBottom: 8, borderBottom: `1px solid ${dmTheme.borderSoft}` }}>
    {['KA', 'EN', 'RU'].map(l => {
      const isLocked = locked && l !== 'KA';
      const isActive = l === active;
      return (
        <div key={l} style={{
          padding: '6px 10px', fontSize: 11.5, fontWeight: 600,
          color: isActive ? dmTheme.text : (isLocked ? dmTheme.textSubtle : dmTheme.textMuted),
          opacity: isLocked ? 0.5 : 1,
          borderBottom: `2px solid ${isActive ? dmTheme.text : 'transparent'}`,
          marginBottom: -1, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          {l}
          {isLocked
            ? <ILock size={9.5} />
            : <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: statuses[l] === 'filled' ? dmTheme.success : dmTheme.chip,
                border: statuses[l] === 'filled' ? 'none' : `1px solid ${dmTheme.textSubtle}`,
              }} />
          }
        </div>
      );
    })}
  </div>
);

const Chip = ({ label, tone = 'neutral', x = true }) => {
  const tones = {
    green:      { bg: dmTheme.successSoft, color: dmTheme.success },
    terracotta: { bg: dmTheme.accentSoft,  color: dmTheme.accent },
    red:        { bg: dmTheme.dangerSoft,  color: dmTheme.danger },
    neutral:    { bg: dmTheme.chip,        color: dmTheme.textMuted },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 6px 3px 9px', borderRadius: 5,
      background: t.bg, color: t.color,
      fontSize: 11.5, fontWeight: 550,
    }}>
      {label}
      {x && <IX size={10} sw={2} style={{ opacity: 0.7 }} />}
    </span>
  );
};

const SuggestChip = ({ label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '3px 9px', borderRadius: 5,
    background: '#fff', border: `1px dashed ${dmTheme.border}`,
    color: dmTheme.textMuted, fontSize: 11.5, fontWeight: 500,
    cursor: 'pointer',
  }}>
    <IPlus size={9} sw={2} /> {label}
  </span>
);

// ─── Drawer footer — standard + saving ─────
const DrawerFooter = ({ primaryLabel = 'Save changes', destructive = true, saving = false, addAnother = false }) => (
  <div style={{
    flexShrink: 0, padding: '16px 20px', borderTop: `1px solid ${dmTheme.border}`,
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    {destructive ? (
      <span style={{
        fontSize: 13, fontWeight: 500, color: dmTheme.danger,
        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
      }}>
        <ITrash size={13} /> Delete product
      </span>
    ) : <span />}
    <div style={{ display: 'flex', gap: 8 }}>
      <Btn>Cancel</Btn>
      {addAnother && <Btn>Save and add another</Btn>}
      {saving ? (
        <Btn variant="primary" style={{ opacity: 0.7, cursor: 'default' }}>
          <ISpinner size={13} style={{ animation: 'dm-spin 1s linear infinite' }} /> Saving…
        </Btn>
      ) : (
        <Btn variant="primary">{primaryLabel}</Btn>
      )}
    </div>
  </div>
);

// ─── Product image block ─────
const ProductImageBlock = () => (
  <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
    <div style={{
      width: 140, height: 140, borderRadius: 10,
      background: `linear-gradient(135deg, #C9A074, #7A5A2B)`,
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0 10px, transparent 10px 20px)',
      }} />
      <IUtensils size={30} style={{
        position: 'absolute', inset: 0, margin: 'auto', color: 'rgba(255,255,255,0.8)',
      }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>Product image</FieldLabel>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Btn small icon={IUpload}>Replace</Btn>
        <Btn small icon={ICrop}>Crop</Btn>
        <Btn small icon={ITrash}>Remove</Btn>
      </div>
      <div style={{ fontSize: 11, color: dmTheme.textSubtle, marginTop: 4 }}>
        Recommended: square, min 800 × 800px
      </div>
    </div>
  </div>
);

// ─── Basics tab ─────
const BasicsTab = ({ plan = 'STARTER', priceError = false, discountOn = false }) => (
  <div style={{ height: '100%', overflowY: 'auto' }}>
    <ProductImageBlock />

    {/* Name */}
    <div style={{ marginBottom: 22 }}>
      <FieldLabel hint="Required in Georgian, optional in others">Name</FieldLabel>
      <LangTabsInline active="KA" locked={plan !== 'PRO'} />
      <Input value="ხაჭაპური აჭარული" />
    </div>

    {/* Description */}
    <div style={{ marginBottom: 22 }}>
      <FieldLabel>Description</FieldLabel>
      <LangTabsInline active="KA" locked={plan !== 'PRO'} />
      <div style={{
        padding: '10px 12px',
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 8, minHeight: 72,
        fontSize: 13, color: dmTheme.text, lineHeight: 1.55,
        position: 'relative',
      }}>
        ტრადიციული აჭარული ხაჭაპური, გულში ცხელი კვერცხით და კარაქით.
        <div style={{
          position: 'absolute', bottom: 8, right: 12,
          fontSize: 10.5, color: dmTheme.textSubtle, fontVariantNumeric: 'tabular-nums',
        }}>
          86 / 500
        </div>
      </div>
    </div>

    {/* Category + Price row */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
      <div>
        <FieldLabel>Category</FieldLabel>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: '#fff',
          border: `1px solid ${dmTheme.border}`, borderRadius: 8,
          fontSize: 13.5, color: dmTheme.text, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 14 }}>🍽</span>
          <span style={{ flex: 1 }}>Mains</span>
          <IChevDown size={13} style={{ color: dmTheme.textMuted }} />
        </div>
      </div>
      <div>
        <FieldLabel>Price</FieldLabel>
        <Input
          value="22.00"
          error={priceError}
          prefix={<span style={{ fontSize: 13.5, color: dmTheme.textMuted, fontWeight: 600 }}>₾</span>}
        />
        {priceError && (
          <div style={{ fontSize: 11.5, color: dmTheme.danger, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <IInfo size={11} /> Price must be greater than 0
          </div>
        )}
      </div>
    </div>

    {/* Discount row */}
    <div style={{
      padding: '12px 14px', background: '#FCFBF8',
      border: `1px solid ${dmTheme.borderSoft}`, borderRadius: 10,
      marginBottom: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toggle on={discountOn} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>Add discount</div>
          <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>Show a strike-through price for promotions</div>
        </div>
      </div>
      {discountOn && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 8, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, color: dmTheme.textSubtle, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Original</div>
            <Input small value="22.00" prefix={<span style={{ fontSize: 12, color: dmTheme.textSubtle, textDecoration: 'line-through' }}>₾</span>} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: dmTheme.textSubtle, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>Sale price</div>
            <Input small value="18.00" prefix={<span style={{ fontSize: 12, color: dmTheme.accent, fontWeight: 600 }}>₾</span>} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: dmTheme.textSubtle, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>&nbsp;</div>
            <div style={{
              height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: dmTheme.dangerSoft, color: dmTheme.danger,
              borderRadius: 7, fontSize: 12.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            }}>
              −18%
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Tags */}
    <div style={{ marginBottom: 22 }}>
      <FieldLabel>Tags</FieldLabel>
      <div style={{
        padding: '8px 10px', background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 8,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
      }}>
        <Chip label="Vegetarian" tone="green" />
        <Chip label="Popular" tone="terracotta" />
        <Chip label="Spicy" tone="red" />
        <span style={{ fontSize: 12.5, color: dmTheme.textSubtle, padding: '2px 4px' }}>Add tag…</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: dmTheme.textSubtle, marginRight: 2, alignSelf: 'center' }}>Suggested:</span>
        {['Vegan', 'Gluten-free', 'New', 'Seasonal', "Chef's pick"].map(s => <SuggestChip key={s} label={s} />)}
      </div>
    </div>

    {/* Availability */}
    <div>
      <FieldLabel>Availability</FieldLabel>
      <div style={{
        padding: '12px 14px', background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Toggle on={true} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>In stock</div>
          <div style={{ fontSize: 11.5, color: dmTheme.textMuted }}>Available now on the public menu</div>
        </div>
        <Btn small icon={IClock}>Schedule availability</Btn>
      </div>
    </div>
  </div>
);

// ─── Variations tab ─────
const variations = [
  { name: 'Small',  mod: '0',   defaultRow: false },
  { name: 'Medium', mod: '+3',  defaultRow: true  },
  { name: 'Large',  mod: '+6',  defaultRow: false },
];

const VariationsTab = () => (
  <div>
    <div style={{ fontSize: 13, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 16 }}>
      Create size or option variations (e.g., Small / Medium / Large). Customers pick one when viewing the product.
    </div>
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 10, overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{
        padding: '9px 14px', display: 'grid',
        gridTemplateColumns: '20px 1fr 110px 70px 28px',
        gap: 10, alignItems: 'center',
        fontSize: 10.5, fontWeight: 600, color: dmTheme.textSubtle,
        textTransform: 'uppercase', letterSpacing: 0.5,
        background: '#FCFBF8', borderBottom: `1px solid ${dmTheme.borderSoft}`,
      }}>
        <span />
        <span>Name</span>
        <span style={{ textAlign: 'right' }}>Price modifier</span>
        <span style={{ textAlign: 'center' }}>Default</span>
        <span />
      </div>
      {variations.map((v, i) => (
        <div key={i} style={{
          padding: '11px 14px', display: 'grid',
          gridTemplateColumns: '20px 1fr 110px 70px 28px',
          gap: 10, alignItems: 'center',
          borderBottom: i === variations.length - 1 ? 'none' : `1px solid ${dmTheme.borderSoft}`,
        }}>
          <IDrag size={13} style={{ color: dmTheme.textSubtle, cursor: 'grab' }} />
          <span style={{ fontSize: 13, fontWeight: 550, color: dmTheme.text }}>{v.name}</span>
          <span style={{ textAlign: 'right', fontSize: 13, color: dmTheme.text, fontVariantNumeric: 'tabular-nums', fontWeight: 550 }}>
            {v.mod}<span style={{ color: dmTheme.textMuted, fontWeight: 400 }}>₾</span>
          </span>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `1.5px solid ${v.defaultRow ? dmTheme.text : dmTheme.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {v.defaultRow && <div style={{ width: 6, height: 6, borderRadius: '50%', background: dmTheme.text }} />}
            </div>
          </div>
          <IMore size={14} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
        </div>
      ))}
    </div>
    <div style={{
      marginTop: 10, padding: '10px 12px', borderRadius: 8,
      border: `1.5px dashed ${dmTheme.border}`, background: '#FCFBF8',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      color: dmTheme.textMuted, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
    }}>
      <IPlus size={12} sw={2} /> Add variation
    </div>
    <div style={{ fontSize: 11.5, color: dmTheme.textSubtle, marginTop: 12 }}>
      Price modifier is added to the base price (22₾).
    </div>
  </div>
);

// ─── Allergens tab ─────
const allergens = [
  { icon: IWheat, name: 'Gluten',  on: true  },
  { icon: IMilk,  name: 'Dairy',   on: true  },
  { icon: IEgg,   name: 'Eggs',    on: false },
  { icon: INut,   name: 'Nuts',    on: false },
  { icon: IFish,  name: 'Seafood', on: false },
  { icon: ISoy,   name: 'Soy',     on: false },
  { icon: IPig,   name: 'Pork',    on: false },
  { icon: ILeaf,  name: 'Sesame',  on: false },
];

const AllergenTile = ({ a }) => (
  <div style={{
    padding: '12px 14px',
    background: a.on ? dmTheme.accentSoft : '#fff',
    border: `1px solid ${a.on ? dmTheme.accent : dmTheme.border}`,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: 7,
      background: a.on ? '#fff' : dmTheme.chip,
      color: a.on ? dmTheme.accent : dmTheme.textMuted,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <a.icon size={15} />
    </div>
    <span style={{
      fontSize: 12.5, fontWeight: 600,
      color: a.on ? dmTheme.accent : dmTheme.text,
      flex: 1,
    }}>{a.name}</span>
    <Toggle on={a.on} />
  </div>
);

const AllergensTabUnlocked = () => (
  <div>
    <div style={{ fontSize: 13, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 14 }}>
      Tap to mark allergens in this product. Icons appear on the public menu next to the product name.
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 22 }}>
      {allergens.map((a, i) => <AllergenTile key={i} a={a} />)}
    </div>
    <FieldLabel>Dietary badges</FieldLabel>
    <div style={{
      padding: 14, background: '#FCFBF8',
      border: `1px solid ${dmTheme.borderSoft}`, borderRadius: 10,
      display: 'flex', flexWrap: 'wrap', gap: 12,
    }}>
      {['Vegan', 'Vegetarian', 'Halal', 'Kosher', 'Gluten-free'].map((b, i) => (
        <label key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: dmTheme.text, cursor: 'pointer' }}>
          <span style={{
            width: 15, height: 15, borderRadius: 4,
            border: `1.5px solid ${i === 1 ? dmTheme.text : dmTheme.border}`,
            background: i === 1 ? dmTheme.text : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            {i === 1 && <ICheck size={10} sw={2.5} />}
          </span>
          {b}
        </label>
      ))}
    </div>
    <div style={{ fontSize: 11.5, color: dmTheme.textSubtle, marginTop: 12 }}>
      These will appear as icons on the public menu next to the product name.
    </div>
  </div>
);

const AllergensTabLocked = () => (
  <div style={{ position: 'relative', height: '100%' }}>
    {/* faded grid behind */}
    <div style={{ filter: 'blur(4px)', opacity: 0.5, pointerEvents: 'none' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {allergens.slice(0, 6).map((a, i) => <AllergenTile key={i} a={{ ...a, on: false }} />)}
      </div>
    </div>
    {/* overlay */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 340, padding: 22,
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, textAlign: 'center',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: dmTheme.accentSoft, color: dmTheme.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <ILock size={17} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: dmTheme.text, marginBottom: 6, letterSpacing: -0.2 }}>
        Allergen info is a PRO feature
      </div>
      <div style={{ fontSize: 12.5, color: dmTheme.textMuted, lineHeight: 1.55, marginBottom: 16 }}>
        Help customers with dietary restrictions choose confidently. Starts at 59₾/month.
      </div>
      <Btn variant="primary" icon={ISparkle} style={{ width: '100%', justifyContent: 'center' }}>
        Upgrade to PRO
      </Btn>
    </div>
  </div>
);

// ─── Empty / new product tab ─────
const NewProductBasics = () => (
  <div>
    {/* dropzone */}
    <div style={{
      padding: '28px 20px', marginBottom: 22,
      border: `1.5px dashed ${dmTheme.border}`, background: '#FCFBF8',
      borderRadius: 12, textAlign: 'center',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: dmTheme.chip, color: dmTheme.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 10px',
      }}>
        <ICamera size={17} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: dmTheme.text, marginBottom: 4 }}>
        Drop image or click to upload
      </div>
      <div style={{ fontSize: 11.5, color: dmTheme.textSubtle }}>PNG, JPG up to 5 MB</div>
    </div>
    {/* empty Name */}
    <div style={{ marginBottom: 20 }}>
      <FieldLabel>Name</FieldLabel>
      <LangTabsInline active="KA" statuses={{ KA: 'empty', EN: 'empty', RU: 'empty' }} />
      <Input placeholder="e.g. Cappuccino" />
    </div>
    <div style={{ marginBottom: 20 }}>
      <FieldLabel>Description</FieldLabel>
      <LangTabsInline active="KA" statuses={{ KA: 'empty', EN: 'empty', RU: 'empty' }} />
      <div style={{
        padding: '10px 12px', background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 8, minHeight: 72,
        fontSize: 13, color: dmTheme.textSubtle,
      }}>
        Short, mouth-watering description…
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <FieldLabel>Category</FieldLabel>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: '#fff',
          border: `1px solid ${dmTheme.border}`, borderRadius: 8,
          fontSize: 13.5, color: dmTheme.textSubtle,
        }}>
          <span style={{ flex: 1 }}>Select category…</span>
          <IChevDown size={13} style={{ color: dmTheme.textMuted }} />
        </div>
      </div>
      <div>
        <FieldLabel>Price</FieldLabel>
        <Input placeholder="0.00" prefix={<span style={{ fontSize: 13.5, color: dmTheme.textSubtle, fontWeight: 600 }}>₾</span>} />
      </div>
    </div>
  </div>
);

// ─── Page wrappers ─────
const ProductDrawerPage = ({ tab = 'basics', plan = 'PRO', priceError = false, saving = false, newProduct = false, discountOn = false }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <DrawerBackdrop />
    <Drawer
      title={newProduct ? 'Add new product' : 'Edit product'}
      subtitle={newProduct ? undefined : 'Khachapuri Adjaruli · Mains'}
      thumb={newProduct ? undefined : 'c'}
      activeTab={tab}
      footer={<DrawerFooter
        saving={saving}
        addAnother={newProduct}
        destructive={!newProduct}
        primaryLabel={newProduct ? 'Save product' : 'Save changes'}
      />}
    >
      {newProduct && <NewProductBasics />}
      {!newProduct && tab === 'basics' && <BasicsTab plan={plan} priceError={priceError} discountOn={discountOn} />}
      {!newProduct && tab === 'variations' && <VariationsTab />}
      {!newProduct && tab === 'allergens' && plan !== 'PRO' && <AllergensTabLocked />}
      {!newProduct && tab === 'allergens' && plan === 'PRO' && <AllergensTabUnlocked />}
    </Drawer>
  </div>
);

Object.assign(window, { ProductDrawerPage });
