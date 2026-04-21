// Component library reference board — Part A
// Groups: Buttons, Form controls, Feedback, Data display
// Uses dmTheme from sidebar.jsx

// ─── Local primitives (small, self-contained) ─────
const clGroupStyle = {
  background: '#fff',
  border: `1px solid ${dmTheme.border}`,
  borderRadius: 12,
  padding: 24,
};
const clGroupTitle = {
  fontSize: 11.5, fontWeight: 700, letterSpacing: 1.2,
  textTransform: 'uppercase', color: dmTheme.textSubtle,
  marginBottom: 18,
};
const clRow = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 20, marginBottom: 22 };
const clLabel = {
  fontSize: 10, fontWeight: 600, color: dmTheme.textSubtle,
  letterSpacing: 0.5, textTransform: 'uppercase',
  marginTop: 8, textAlign: 'center',
};
const clRowLabel = {
  fontSize: 10.5, fontWeight: 700, color: dmTheme.text,
  letterSpacing: 0.6, textTransform: 'uppercase',
  width: 110, flexShrink: 0, paddingTop: 10,
};
const clSub = (s) => (
  <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, marginBottom: 10, marginTop: 6 }}>{s}</div>
);
const Sample = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div>{children}</div>
    <div style={clLabel}>{label}</div>
  </div>
);

// ─── BUTTONS ─────
const CLBtn = ({ variant = 'primary', size = 'md', state = 'default', icon: Icon, iconOnly, children }) => {
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 12, gap: 5, iconSize: 12, height: 26 },
    md: { padding: '7px 13px', fontSize: 12.5, gap: 6, iconSize: 13, height: 32 },
    lg: { padding: '10px 18px', fontSize: 14, gap: 7, iconSize: 15, height: 40 },
  }[size];
  const variants = {
    primary: { bg: dmTheme.text, color: '#fff', border: dmTheme.text },
    secondary: { bg: '#fff', color: dmTheme.text, border: dmTheme.border },
    ghost: { bg: 'transparent', color: dmTheme.text, border: 'transparent' },
    destructive: { bg: dmTheme.danger, color: '#fff', border: dmTheme.danger },
    link: { bg: 'transparent', color: dmTheme.accent, border: 'transparent' },
  }[variant];
  let { bg, color, border } = variants;
  let outline = 'none';
  let opacity = 1;
  if (state === 'hover' && variant === 'primary') bg = dmTheme.primaryHover;
  if (state === 'hover' && variant === 'secondary') bg = '#F7F6F1';
  if (state === 'hover' && variant === 'ghost') bg = '#F4F3EE';
  if (state === 'hover' && variant === 'destructive') bg = '#9A3731';
  if (state === 'hover' && variant === 'link') color = '#8E4A2C';
  if (state === 'focused') outline = `2px solid ${dmTheme.accent}`;
  if (state === 'disabled') opacity = 0.4;
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: sizes.gap,
    padding: iconOnly ? 0 : sizes.padding,
    width: iconOnly ? sizes.height : undefined,
    height: sizes.height,
    fontSize: sizes.fontSize, fontWeight: 550,
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 7, cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
    outline, outlineOffset: 2,
    opacity,
    textDecoration: variant === 'link' ? 'underline' : 'none',
    whiteSpace: 'nowrap',
  };
  return (
    <button style={style}>
      {state === 'loading' ? (
        <span style={{
          width: sizes.iconSize, height: sizes.iconSize,
          border: `1.8px solid ${variant === 'primary' || variant === 'destructive' ? 'rgba(255,255,255,0.4)' : dmTheme.border}`,
          borderTopColor: variant === 'primary' || variant === 'destructive' ? '#fff' : dmTheme.text,
          borderRadius: '50%', animation: 'cl-spin 0.8s linear infinite',
        }} />
      ) : Icon && <Icon size={sizes.iconSize} />}
      {!iconOnly && children}
    </button>
  );
};

const ButtonsGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>01 · Buttons</div>

    {/* Variants × default state */}
    {clSub('Variants')}
    <div style={clRow}>
      <Sample label="primary"><CLBtn variant="primary">Save changes</CLBtn></Sample>
      <Sample label="secondary"><CLBtn variant="secondary">Cancel</CLBtn></Sample>
      <Sample label="ghost"><CLBtn variant="ghost">Dismiss</CLBtn></Sample>
      <Sample label="destructive"><CLBtn variant="destructive">Delete menu</CLBtn></Sample>
      <Sample label="link"><CLBtn variant="link">Learn more</CLBtn></Sample>
    </div>

    {/* Sizes */}
    {clSub('Sizes')}
    <div style={clRow}>
      <Sample label="sm — 26px"><CLBtn variant="primary" size="sm">Small</CLBtn></Sample>
      <Sample label="md — 32px (default)"><CLBtn variant="primary" size="md">Medium</CLBtn></Sample>
      <Sample label="lg — 40px"><CLBtn variant="primary" size="lg">Large</CLBtn></Sample>
    </div>

    {/* States (primary) */}
    {clSub('States · primary')}
    <div style={clRow}>
      <Sample label="default"><CLBtn variant="primary" state="default">Save</CLBtn></Sample>
      <Sample label="hover"><CLBtn variant="primary" state="hover">Save</CLBtn></Sample>
      <Sample label="focused"><CLBtn variant="primary" state="focused">Save</CLBtn></Sample>
      <Sample label="disabled"><CLBtn variant="primary" state="disabled">Save</CLBtn></Sample>
      <Sample label="loading"><CLBtn variant="primary" state="loading">Saving…</CLBtn></Sample>
    </div>

    {/* States (secondary + destructive) */}
    {clSub('States · secondary & destructive')}
    <div style={clRow}>
      <Sample label="sec · default"><CLBtn variant="secondary" state="default">Cancel</CLBtn></Sample>
      <Sample label="sec · hover"><CLBtn variant="secondary" state="hover">Cancel</CLBtn></Sample>
      <Sample label="sec · disabled"><CLBtn variant="secondary" state="disabled">Cancel</CLBtn></Sample>
      <Sample label="dstr · default"><CLBtn variant="destructive">Delete</CLBtn></Sample>
      <Sample label="dstr · hover"><CLBtn variant="destructive" state="hover">Delete</CLBtn></Sample>
    </div>

    {/* With icon */}
    {clSub('With leading icon')}
    <div style={clRow}>
      <Sample label="primary + icon"><CLBtn variant="primary" icon={IPlus}>Add item</CLBtn></Sample>
      <Sample label="secondary + icon"><CLBtn variant="secondary" icon={IDownload}>Export</CLBtn></Sample>
      <Sample label="destructive + icon"><CLBtn variant="destructive" icon={ITrash}>Delete</CLBtn></Sample>
    </div>

    {/* Icon-only */}
    {clSub('Icon-only')}
    <div style={clRow}>
      <Sample label="sm"><CLBtn variant="secondary" size="sm" icon={IEdit} iconOnly /></Sample>
      <Sample label="md"><CLBtn variant="secondary" size="md" icon={IEdit} iconOnly /></Sample>
      <Sample label="lg"><CLBtn variant="secondary" size="lg" icon={IEdit} iconOnly /></Sample>
      <Sample label="ghost"><CLBtn variant="ghost" icon={IMore} iconOnly /></Sample>
      <Sample label="primary"><CLBtn variant="primary" icon={IPlus} iconOnly /></Sample>
    </div>
  </div>
);

// ─── FORM CONTROLS ─────

const CLInput = ({ value = '', placeholder, state = 'default', prefix, suffix, size = 'md', icon: Icon }) => {
  const sizes = { sm: { p: '5px 10px', fs: 12, h: 28 }, md: { p: '8px 11px', fs: 13, h: 34 }, lg: { p: '10px 14px', fs: 14, h: 40 } }[size];
  let border = dmTheme.border;
  let outline = 'none';
  let ring = 'none';
  if (state === 'focused') { border = dmTheme.text; ring = `0 0 0 3px ${dmTheme.text}1A`; }
  if (state === 'error') { border = dmTheme.danger; ring = `0 0 0 3px ${dmTheme.danger}22`; }
  if (state === 'disabled') { /* keep border */ }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: sizes.p, height: sizes.h,
      background: state === 'disabled' ? '#F7F6F1' : '#fff',
      border: `1px solid ${border}`, borderRadius: 7,
      fontSize: sizes.fs, color: state === 'disabled' ? dmTheme.textSubtle : dmTheme.text,
      boxShadow: ring, minWidth: 180,
    }}>
      {Icon && <Icon size={13} style={{ color: dmTheme.textMuted, flexShrink: 0 }} />}
      {prefix && <span style={{ color: dmTheme.textMuted }}>{prefix}</span>}
      <span style={{ flex: 1, color: value ? (state === 'disabled' ? dmTheme.textSubtle : dmTheme.text) : dmTheme.textSubtle }}>
        {value || placeholder}
      </span>
      {suffix && <span style={{ color: dmTheme.textMuted, fontSize: sizes.fs - 1 }}>{suffix}</span>}
    </div>
  );
};

const CLSelect = ({ value, state = 'default' }) => {
  let border = dmTheme.border;
  let ring = 'none';
  if (state === 'focused') { border = dmTheme.text; ring = `0 0 0 3px ${dmTheme.text}1A`; }
  if (state === 'open') { border = dmTheme.text; }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 11px', height: 34,
        background: '#fff', border: `1px solid ${border}`, borderRadius: 7,
        fontSize: 13, color: dmTheme.text, minWidth: 180,
        boxShadow: ring,
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <IChevDown size={13} style={{ color: dmTheme.textMuted }} />
      </div>
      {state === 'open' && (
        <div style={{
          position: 'absolute', top: 38, left: 0, right: 0,
          background: '#fff', border: `1px solid ${dmTheme.border}`,
          borderRadius: 7, boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          padding: 4, zIndex: 2,
        }}>
          {['Georgian Lari (₾)', 'US Dollar ($)', 'Euro (€)'].map((o, i) => (
            <div key={o} style={{
              padding: '7px 10px', borderRadius: 5, fontSize: 13,
              background: i === 0 ? dmTheme.chip : 'transparent',
              color: dmTheme.text, fontWeight: i === 0 ? 550 : 400,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ flex: 1 }}>{o}</span>
              {i === 0 && <ICheck size={13} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CLSwitch = ({ on, disabled }) => (
  <div style={{
    width: 32, height: 18, borderRadius: 999,
    background: on ? dmTheme.text : '#D4D4D0',
    padding: 2, opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    position: 'relative', display: 'inline-block',
  }}>
    <div style={{
      width: 14, height: 14, borderRadius: '50%', background: '#fff',
      transform: on ? 'translateX(14px)' : 'translateX(0)',
      transition: 'transform 0.15s',
      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
    }} />
  </div>
);

const CLCheckbox = ({ state = 'default' }) => {
  const { bg, border, check, ring } = {
    default:  { bg: '#fff', border: dmTheme.border, check: false },
    hover:    { bg: '#F7F6F1', border: dmTheme.textMuted, check: false },
    focused:  { bg: '#fff', border: dmTheme.text, check: false, ring: true },
    checked:  { bg: dmTheme.text, border: dmTheme.text, check: true },
    indeterm: { bg: dmTheme.text, border: dmTheme.text, check: 'dash' },
    disabled: { bg: '#F0EFEA', border: dmTheme.border, check: false },
  }[state];
  return (
    <div style={{
      width: 16, height: 16, borderRadius: 4,
      background: bg, border: `1.5px solid ${border}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: ring ? `0 0 0 3px ${dmTheme.text}1A` : 'none',
    }}>
      {check === true && (
        <svg width="10" height="10" viewBox="0 0 12 12"><path d="M3 6.5L5 8.5L9 4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
      {check === 'dash' && <div style={{ width: 8, height: 2, background: '#fff', borderRadius: 1 }} />}
    </div>
  );
};

const CLRadio = ({ state = 'default' }) => {
  const { border, inner, ring } = {
    default:  { border: dmTheme.border, inner: false },
    hover:    { border: dmTheme.textMuted, inner: false },
    focused:  { border: dmTheme.text, inner: false, ring: true },
    selected: { border: dmTheme.text, inner: true },
    disabled: { border: dmTheme.border, inner: false },
  }[state];
  return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%',
      border: `1.5px solid ${border}`, background: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: ring ? `0 0 0 3px ${dmTheme.text}1A` : 'none',
    }}>
      {inner && <div style={{ width: 8, height: 8, borderRadius: '50%', background: dmTheme.text }} />}
    </div>
  );
};

const CLSegmented = ({ items, active }) => (
  <div style={{
    display: 'inline-flex', padding: 3,
    background: '#F4F3EE', borderRadius: 8,
    border: `1px solid ${dmTheme.border}`,
  }}>
    {items.map((it, i) => (
      <div key={it} style={{
        padding: '5px 12px', fontSize: 12.5, fontWeight: 550,
        borderRadius: 5, cursor: 'pointer',
        background: i === active ? '#fff' : 'transparent',
        color: i === active ? dmTheme.text : dmTheme.textMuted,
        boxShadow: i === active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
      }}>{it}</div>
    ))}
  </div>
);

const CLSlider = ({ value = 40 }) => (
  <div style={{ display: 'inline-block', width: 200, paddingTop: 8 }}>
    <div style={{ position: 'relative', height: 4, background: dmTheme.border, borderRadius: 2 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${value}%`, background: dmTheme.text, borderRadius: 2,
      }} />
      <div style={{
        position: 'absolute', left: `${value}%`, top: '50%',
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', border: `2px solid ${dmTheme.text}`,
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  </div>
);

const CLDropzone = ({ state = 'default' }) => {
  const props = {
    default:  { bg: '#FCFBF8', border: dmTheme.border, color: dmTheme.textMuted },
    hover:    { bg: dmTheme.accentSoft, border: dmTheme.accent, color: dmTheme.accent },
    filled:   { bg: '#fff', border: dmTheme.border, color: dmTheme.text, filled: true },
    error:    { bg: dmTheme.dangerSoft, border: dmTheme.danger, color: dmTheme.danger },
  }[state];
  return (
    <div style={{
      width: 220, height: 88, padding: 14,
      background: props.bg,
      border: `1.5px ${state === 'filled' ? 'solid' : 'dashed'} ${props.border}`,
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      color: props.color,
    }}>
      {props.filled ? (
        <>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: '#8B6F3A' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 550 }}>hero.jpg</div>
            <div style={{ fontSize: 11, color: dmTheme.textMuted }}>1.2 MB · replace</div>
          </div>
        </>
      ) : (
        <>
          <IUpload size={16} />
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            {state === 'error' ? 'File too large (max 2MB)' : 'Drop image, or browse'}
          </div>
        </>
      )}
    </div>
  );
};

const FormControlsGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>02 · Form controls</div>

    {clSub('Text input — states')}
    <div style={clRow}>
      <Sample label="default"><CLInput placeholder="Menu name" /></Sample>
      <Sample label="filled"><CLInput value="Main menu — All day" /></Sample>
      <Sample label="focused"><CLInput value="Main menu" state="focused" /></Sample>
      <Sample label="error"><CLInput value="" placeholder="Required" state="error" /></Sample>
      <Sample label="disabled"><CLInput value="Read-only value" state="disabled" /></Sample>
    </div>

    {clSub('Text input — sizes, prefix/suffix, icon')}
    <div style={clRow}>
      <Sample label="sm"><CLInput value="Small" size="sm" /></Sample>
      <Sample label="md"><CLInput value="Medium" size="md" /></Sample>
      <Sample label="lg"><CLInput value="Large" size="lg" /></Sample>
      <Sample label="prefix"><CLInput value="main" prefix="cafelinville.ge/" /></Sample>
      <Sample label="suffix"><CLInput value="14" suffix="₾" /></Sample>
      <Sample label="with icon"><CLInput value="khachapuri" icon={ISearch} /></Sample>
    </div>

    {clSub('Textarea')}
    <div style={clRow}>
      <div style={{
        width: 260, padding: '9px 12px', background: '#fff',
        border: `1px solid ${dmTheme.border}`, borderRadius: 7,
        fontSize: 13, color: dmTheme.text, lineHeight: 1.5, minHeight: 68,
      }}>
        Small-batch coffee, khachapuri, and seasonal brunch on Rustaveli Avenue.
      </div>
      <div style={{
        width: 260, padding: '9px 12px', background: '#fff',
        border: `1px solid ${dmTheme.text}`, borderRadius: 7,
        fontSize: 13, color: dmTheme.text, lineHeight: 1.5, minHeight: 68,
        boxShadow: `0 0 0 3px ${dmTheme.text}1A`,
      }}>
        Small-batch coffee, khachapuri…<span style={{ background: dmTheme.text, width: 1, display: 'inline-block', height: 14, marginLeft: 1, verticalAlign: 'middle' }} />
      </div>
    </div>

    {clSub('Select / dropdown')}
    <div style={clRow}>
      <Sample label="closed"><CLSelect value="Georgian Lari (₾)" /></Sample>
      <Sample label="focused"><CLSelect value="Georgian Lari (₾)" state="focused" /></Sample>
      <div style={{ height: 140 }}>
        <Sample label="open">
          <CLSelect value="Georgian Lari (₾)" state="open" />
        </Sample>
      </div>
    </div>

    {clSub('Switch')}
    <div style={clRow}>
      <Sample label="off"><CLSwitch on={false} /></Sample>
      <Sample label="on"><CLSwitch on /></Sample>
      <Sample label="disabled off"><CLSwitch on={false} disabled /></Sample>
      <Sample label="disabled on"><CLSwitch on disabled /></Sample>
    </div>

    {clSub('Checkbox')}
    <div style={clRow}>
      <Sample label="default"><CLCheckbox state="default" /></Sample>
      <Sample label="hover"><CLCheckbox state="hover" /></Sample>
      <Sample label="focused"><CLCheckbox state="focused" /></Sample>
      <Sample label="checked"><CLCheckbox state="checked" /></Sample>
      <Sample label="indeterminate"><CLCheckbox state="indeterm" /></Sample>
      <Sample label="disabled"><CLCheckbox state="disabled" /></Sample>
    </div>

    {clSub('Radio')}
    <div style={clRow}>
      <Sample label="default"><CLRadio state="default" /></Sample>
      <Sample label="hover"><CLRadio state="hover" /></Sample>
      <Sample label="focused"><CLRadio state="focused" /></Sample>
      <Sample label="selected"><CLRadio state="selected" /></Sample>
      <Sample label="disabled"><CLRadio state="disabled" /></Sample>
    </div>

    {clSub('Segmented control')}
    <div style={clRow}>
      <Sample label="3-way"><CLSegmented items={['Day', 'Week', 'Month']} active={1} /></Sample>
      <Sample label="2-way"><CLSegmented items={['Grid', 'Table']} active={0} /></Sample>
    </div>

    {clSub('Slider')}
    <div style={clRow}>
      <Sample label="value 40"><CLSlider value={40} /></Sample>
      <Sample label="value 80"><CLSlider value={80} /></Sample>
    </div>

    {clSub('File dropzone')}
    <div style={clRow}>
      <Sample label="default"><CLDropzone state="default" /></Sample>
      <Sample label="drag-over"><CLDropzone state="hover" /></Sample>
      <Sample label="filled"><CLDropzone state="filled" /></Sample>
      <Sample label="error"><CLDropzone state="error" /></Sample>
    </div>
  </div>
);

// ─── FEEDBACK ─────

const CLToast = ({ tone = 'success', title, body, closable = true }) => {
  const tones = {
    success: { bg: '#fff', border: dmTheme.border, accent: dmTheme.success, Icon: ICheck },
    info:    { bg: '#fff', border: dmTheme.border, accent: dmTheme.text,    Icon: IInfo },
    warning: { bg: '#fff', border: dmTheme.border, accent: dmTheme.warning, Icon: IWarning },
    error:   { bg: '#fff', border: dmTheme.border, accent: dmTheme.danger,  Icon: IWarning },
  }[tone];
  const Icon = tones.Icon;
  return (
    <div style={{
      width: 340, padding: 14, background: tones.bg,
      border: `1px solid ${tones.border}`, borderLeft: `3px solid ${tones.accent}`,
      borderRadius: 8, display: 'flex', gap: 12,
      boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    }}>
      <Icon size={15} style={{ color: tones.accent, marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>{title}</div>
        <div style={{ fontSize: 12, color: dmTheme.textMuted, marginTop: 2, lineHeight: 1.45 }}>{body}</div>
      </div>
      {closable && <IX size={13} style={{ color: dmTheme.textMuted, cursor: 'pointer', marginTop: 2 }} />}
    </div>
  );
};

const CLBanner = ({ tone = 'info', title, body, action }) => {
  const tones = {
    info:    { bg: '#F0F0EC',                border: dmTheme.border,     accent: dmTheme.text,    Icon: IInfo },
    success: { bg: dmTheme.successSoft,      border: `${dmTheme.success}33`, accent: dmTheme.success, Icon: ICheck },
    warning: { bg: dmTheme.warningSoft,      border: `${dmTheme.warning}33`, accent: dmTheme.warning, Icon: IWarning },
    error:   { bg: dmTheme.dangerSoft,       border: `${dmTheme.danger}33`,  accent: dmTheme.danger,  Icon: IWarning },
  }[tone];
  const Icon = tones.Icon;
  return (
    <div style={{
      width: 520, padding: '12px 14px', background: tones.bg,
      border: `1px solid ${tones.border}`, borderRadius: 8,
      display: 'flex', alignItems: 'flex-start', gap: 11,
    }}>
      <Icon size={15} style={{ color: tones.accent, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>{title}</div>
        <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginTop: 2, lineHeight: 1.45 }}>{body}</div>
      </div>
      {action && (
        <button style={{
          padding: '5px 10px', fontSize: 12, fontWeight: 550,
          background: '#fff', border: `1px solid ${dmTheme.border}`, borderRadius: 6,
          color: dmTheme.text, cursor: 'pointer', flexShrink: 0,
        }}>{action}</button>
      )}
    </div>
  );
};

const CLEmpty = () => (
  <div style={{
    width: 360, padding: '36px 24px',
    background: '#fff', border: `1px dashed ${dmTheme.border}`,
    borderRadius: 10, textAlign: 'center',
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10, margin: '0 auto 12px',
      background: dmTheme.chip, color: dmTheme.textMuted,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <IMenus size={20} />
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: dmTheme.text }}>No menus yet</div>
    <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginTop: 4, lineHeight: 1.5 }}>
      Create your first menu to start serving your customers.
    </div>
    <button style={{
      marginTop: 14, padding: '7px 14px', fontSize: 12.5, fontWeight: 550,
      background: dmTheme.text, color: '#fff', border: 'none', borderRadius: 7,
      cursor: 'pointer',
    }}>+ Create menu</button>
  </div>
);

const CLSkeleton = ({ w, h, circle }) => (
  <div style={{
    width: w, height: h, borderRadius: circle ? '50%' : 4,
    background: 'linear-gradient(90deg, #F0EFEA 0%, #F7F6F1 50%, #F0EFEA 100%)',
    backgroundSize: '200% 100%',
    animation: 'cl-shimmer 1.4s ease-in-out infinite',
  }} />
);

const CLProgress = ({ value, tone = 'default' }) => {
  const fillBg = { default: dmTheme.text, success: dmTheme.success, warning: dmTheme.warning, error: dmTheme.danger }[tone];
  return (
    <div style={{ width: 240 }}>
      <div style={{ height: 6, background: dmTheme.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: fillBg, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 11, color: dmTheme.textMuted, marginTop: 5 }}>{value}%</div>
    </div>
  );
};

const FeedbackGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>03 · Feedback</div>

    {clSub('Toasts')}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
      <CLToast tone="success" title="Menu saved" body="Your changes are live. 3 items updated." />
      <CLToast tone="info" title="Auto-translation ready" body="Georgian → English finished in 12s." />
      <CLToast tone="warning" title="QR code changed" body="Printed QR codes pointing at the old URL will break." />
      <CLToast tone="error" title="Upload failed" body="File too large (max 2MB). Try a smaller image." />
    </div>

    {clSub('Banners (in-page)')}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
      <CLBanner tone="info"    title="Translation mode is on" body="Edits here update the Georgian source, not translations." action="Learn more" />
      <CLBanner tone="warning" title="You're near your plan limit" body="28/30 items used. Upgrade to Pro for unlimited items." action="Upgrade" />
      <CLBanner tone="error"   title="Payment failed" body="Your card ending in 4242 was declined. Update it to avoid downgrade." action="Update card" />
      <CLBanner tone="success" title="You're on Pro" body="Enjoy unlimited menus, analytics, and custom QR codes." />
    </div>

    {clSub('Empty state')}
    <div style={clRow}>
      <CLEmpty />
    </div>

    {clSub('Skeletons')}
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: `1px solid ${dmTheme.border}`, borderRadius: 8, width: 280 }}>
        <CLSkeleton w={40} h={40} circle />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <CLSkeleton w={120} h={10} />
          <CLSkeleton w={180} h={8} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <CLSkeleton w={160} h={12} />
        <CLSkeleton w={240} h={10} />
        <CLSkeleton w={200} h={10} />
      </div>
    </div>

    {clSub('Spinners & progress')}
    <div style={clRow}>
      <Sample label="spinner · sm">
        <div style={{ width: 14, height: 14, border: `2px solid ${dmTheme.border}`, borderTopColor: dmTheme.text, borderRadius: '50%', animation: 'cl-spin 0.8s linear infinite' }} />
      </Sample>
      <Sample label="spinner · md">
        <div style={{ width: 22, height: 22, border: `2.5px solid ${dmTheme.border}`, borderTopColor: dmTheme.text, borderRadius: '50%', animation: 'cl-spin 0.8s linear infinite' }} />
      </Sample>
      <Sample label="progress 35%"><CLProgress value={35} /></Sample>
      <Sample label="progress 80% · success"><CLProgress value={80} tone="success" /></Sample>
      <Sample label="progress 95% · warning"><CLProgress value={95} tone="warning" /></Sample>
    </div>
  </div>
);

// ─── DATA DISPLAY ─────

const CLBadge = ({ tone = 'neutral', children, pill }) => {
  const tones = {
    neutral: { bg: dmTheme.chip, color: dmTheme.textMuted },
    success: { bg: dmTheme.successSoft, color: dmTheme.success },
    warning: { bg: dmTheme.warningSoft, color: dmTheme.warning },
    danger:  { bg: dmTheme.dangerSoft, color: dmTheme.danger },
    accent:  { bg: dmTheme.accentSoft, color: dmTheme.accent },
    solid:   { bg: dmTheme.text, color: '#fff' },
  }[tone];
  return (
    <span style={{
      display: 'inline-block', padding: pill ? '2px 10px' : '2px 7px',
      background: tones.bg, color: tones.color,
      borderRadius: pill ? 999 : 4,
      fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4,
      textTransform: 'uppercase',
    }}>{children}</span>
  );
};

const CLTag = ({ children, removable }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 8px 3px 10px', background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 999,
    fontSize: 11.5, color: dmTheme.text, fontWeight: 500,
  }}>
    {children}
    {removable && <IX size={10} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />}
  </span>
);

const CLAvatar = ({ name = 'NK', bg = dmTheme.accent, size = 32, status }) => (
  <div style={{ position: 'relative', display: 'inline-block' }}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 600,
    }}>{name}</div>
    {status && (
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: size * 0.3, height: size * 0.3, borderRadius: '50%',
        background: status === 'online' ? dmTheme.success : dmTheme.textSubtle,
        border: '2px solid #fff',
      }} />
    )}
  </div>
);

const CLBreadcrumbs = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
    <span style={{ color: dmTheme.textMuted }}>Café Linville</span>
    <span style={{ color: dmTheme.textSubtle }}>/</span>
    <span style={{ color: dmTheme.textMuted }}>Menus</span>
    <span style={{ color: dmTheme.textSubtle }}>/</span>
    <span style={{ color: dmTheme.text, fontWeight: 550 }}>Main menu</span>
  </div>
);

const CLTabs = ({ items, active }) => (
  <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${dmTheme.border}` }}>
    {items.map((it, i) => (
      <div key={it} style={{
        padding: '10px 16px', fontSize: 13,
        fontWeight: i === active ? 600 : 500,
        color: i === active ? dmTheme.text : dmTheme.textMuted,
        borderBottom: i === active ? `2px solid ${dmTheme.text}` : '2px solid transparent',
        marginBottom: -1, cursor: 'pointer',
      }}>{it}</div>
    ))}
  </div>
);

const CLStatCard = ({ label, value, delta, tone }) => (
  <div style={{
    width: 180, padding: 16, background: '#fff',
    border: `1px solid ${dmTheme.border}`, borderRadius: 10,
  }}>
    <div style={{ fontSize: 11.5, color: dmTheme.textMuted, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 600, color: dmTheme.text, marginTop: 4, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {delta && (
      <div style={{
        fontSize: 11.5, marginTop: 4, fontVariantNumeric: 'tabular-nums',
        color: tone === 'up' ? dmTheme.success : tone === 'down' ? dmTheme.danger : dmTheme.textMuted,
      }}>{delta}</div>
    )}
  </div>
);

const CLPagination = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
    {[
      { l: '‹', disabled: true },
      { l: '1', active: true },
      { l: '2' },
      { l: '3' },
      { l: '…', muted: true },
      { l: '12' },
      { l: '›' },
    ].map((p, i) => (
      <div key={i} style={{
        minWidth: 28, height: 28, padding: '0 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12.5, fontWeight: 550, borderRadius: 6,
        color: p.active ? '#fff' : p.muted ? dmTheme.textSubtle : p.disabled ? dmTheme.textSubtle : dmTheme.text,
        background: p.active ? dmTheme.text : 'transparent',
        border: p.active ? 'none' : p.muted ? 'none' : `1px solid ${dmTheme.border}`,
        cursor: p.disabled ? 'not-allowed' : 'pointer',
        opacity: p.disabled ? 0.5 : 1,
      }}>{p.l}</div>
    ))}
  </div>
);

const CLSortHeader = ({ label, dir }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 700, color: dmTheme.textSubtle,
    letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer',
  }}>
    {label}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: `4px solid ${dir === 'asc' ? dmTheme.text : dmTheme.border}` }} />
      <div style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: `4px solid ${dir === 'desc' ? dmTheme.text : dmTheme.border}` }} />
    </div>
  </div>
);

const DataDisplayGroup = () => (
  <div style={clGroupStyle}>
    <div style={clGroupTitle}>04 · Data display</div>

    {clSub('Badges — tones & shapes')}
    <div style={clRow}>
      <Sample label="neutral"><CLBadge>Draft</CLBadge></Sample>
      <Sample label="success"><CLBadge tone="success">Published</CLBadge></Sample>
      <Sample label="warning"><CLBadge tone="warning">Low stock</CLBadge></Sample>
      <Sample label="danger"><CLBadge tone="danger">86'd</CLBadge></Sample>
      <Sample label="accent"><CLBadge tone="accent">New</CLBadge></Sample>
      <Sample label="solid"><CLBadge tone="solid">PRO</CLBadge></Sample>
      <Sample label="pill"><CLBadge tone="success" pill>Active</CLBadge></Sample>
    </div>

    {clSub('Tags / chips')}
    <div style={clRow}>
      <Sample label="default"><CLTag>Vegan</CLTag></Sample>
      <Sample label="removable"><CLTag removable>Gluten-free</CLTag></Sample>
      <Sample label="group">
        <div style={{ display: 'flex', gap: 6 }}>
          <CLTag>Georgian</CLTag><CLTag>Brunch</CLTag><CLTag>Coffee</CLTag>
        </div>
      </Sample>
    </div>

    {clSub('Avatars')}
    <div style={clRow}>
      <Sample label="24px"><CLAvatar size={24} name="NK" /></Sample>
      <Sample label="32px"><CLAvatar size={32} name="NK" /></Sample>
      <Sample label="40px"><CLAvatar size={40} name="GB" bg="#8B6F3A" /></Sample>
      <Sample label="with status"><CLAvatar size={40} name="NK" status="online" /></Sample>
      <Sample label="stack">
        <div style={{ display: 'flex' }}>
          <div style={{ borderRadius: '50%', border: '2px solid #fff' }}><CLAvatar size={28} name="NK" /></div>
          <div style={{ borderRadius: '50%', border: '2px solid #fff', marginLeft: -8 }}><CLAvatar size={28} name="GB" bg="#8B6F3A" /></div>
          <div style={{ borderRadius: '50%', border: '2px solid #fff', marginLeft: -8 }}><CLAvatar size={28} name="NT" bg="#3F7E3F" /></div>
          <div style={{ borderRadius: '50%', border: '2px solid #fff', marginLeft: -8, background: dmTheme.chip, color: dmTheme.textMuted, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>+3</div>
        </div>
      </Sample>
    </div>

    {clSub('Breadcrumbs')}
    <div style={clRow}>
      <CLBreadcrumbs />
    </div>

    {clSub('Tabs (page-level)')}
    <div style={{ marginBottom: 22 }}>
      <CLTabs items={['Content', 'Branding', 'Languages', 'Analytics', 'Promotions', 'QR', 'Settings']} active={3} />
    </div>

    {clSub('Stat cards')}
    <div style={clRow}>
      <CLStatCard label="Scans today"     value="1,284" delta="↑ 12% vs yesterday" tone="up" />
      <CLStatCard label="Avg. time on menu" value="2:18" delta="↓ 4% vs last week"  tone="down" />
      <CLStatCard label="Active menus"    value="4"     delta="No change"          tone="flat" />
      <CLStatCard label="Top item"        value="Khachapuri" />
    </div>

    {clSub('Pagination & sort headers')}
    <div style={clRow}>
      <Sample label="pagination"><CLPagination /></Sample>
      <Sample label="sort · ascending"><CLSortHeader label="Name" dir="asc" /></Sample>
      <Sample label="sort · descending"><CLSortHeader label="Price" dir="desc" /></Sample>
      <Sample label="sort · none"><CLSortHeader label="Updated" /></Sample>
    </div>
  </div>
);

Object.assign(window, {
  CLBtn, CLInput, CLSelect, CLSwitch, CLCheckbox, CLRadio,
  CLSegmented, CLSlider, CLDropzone,
  CLToast, CLBanner, CLEmpty, CLSkeleton, CLProgress,
  CLBadge, CLTag, CLAvatar, CLBreadcrumbs, CLTabs, CLStatCard, CLPagination, CLSortHeader,
  ButtonsGroup, FormControlsGroup, FeedbackGroup, DataDisplayGroup,
  clGroupStyle, clGroupTitle, clRow, clSub, Sample, clLabel, clRowLabel,
});
