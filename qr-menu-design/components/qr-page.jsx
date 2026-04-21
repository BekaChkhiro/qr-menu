// Section F — QR Codes (as editor tab)

// ─── Realistic QR code SVG ─────
// Deterministic 33x33 pattern with proper finder patterns + timing
const makeQrMatrix = (seed = 1) => {
  const N = 33;
  const m = Array.from({ length: N }, () => Array(N).fill(0));

  // Helper: finder pattern at (r, c)
  const finder = (r, c) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const ring = (i === 0 || i === 6 || j === 0 || j === 6);
        const inner = (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        m[r + i][c + j] = ring || inner ? 1 : 0;
      }
    }
  };
  finder(0, 0);
  finder(0, N - 7);
  finder(N - 7, 0);

  // Alignment pattern at (N-9, N-9) area — small 5x5
  const align = (r, c) => {
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const ring = (i === 0 || i === 4 || j === 0 || j === 4);
        const center = (i === 2 && j === 2);
        m[r + i][c + j] = ring || center ? 1 : 0;
      }
    }
  };
  align(N - 9, N - 9);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Random-ish data region using deterministic hash
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      // Skip finders and their separators
      if ((r < 9 && c < 9) || (r < 9 && c >= N - 8) || (r >= N - 8 && c < 9)) continue;
      // Skip alignment area
      if (r >= N - 9 && c >= N - 9) continue;
      // Skip timing rows/cols
      if (r === 6 || c === 6) continue;
      // Already set?
      if (m[r][c] !== 0) continue;
      // Hash
      const h = Math.sin((r * 31.3 + c * 7.1 + seed * 13.7)) * 10000;
      m[r][c] = (h - Math.floor(h)) > 0.48 ? 1 : 0;
    }
  }
  return m;
};

const QrCode = ({
  size = 360, fg = '#18181B', bg = '#FFFFFF', style = 'classic',
  logo = null, seed = 1,
}) => {
  const matrix = React.useMemo(() => makeQrMatrix(seed), [seed]);
  const N = matrix.length;
  const cell = size / N;

  // Finder corner detection
  const isFinderCell = (r, c) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= N - 7) return true;
    if (r >= N - 7 && c < 7) return true;
    return false;
  };
  const finderCorners = [[0, 0], [0, N - 7], [N - 7, 0]];

  const logoSize = logo ? size * 0.2 : 0;
  const logoBox = logo ? {
    x: (size - logoSize) / 2,
    y: (size - logoSize) / 2,
    w: logoSize, h: logoSize,
  } : null;

  const inLogoArea = (r, c) => {
    if (!logoBox) return false;
    const x = c * cell + cell / 2;
    const y = r * cell + cell / 2;
    return x >= logoBox.x - 2 && x <= logoBox.x + logoBox.w + 2
        && y >= logoBox.y - 2 && y <= logoBox.y + logoBox.h + 2;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect x="0" y="0" width={size} height={size} fill={bg} rx={style === 'rounded' ? 12 : 0} />

      {/* Draw finder patterns specially */}
      {finderCorners.map(([fr, fc], i) => {
        const ox = fc * cell, oy = fr * cell;
        const outerR = style === 'rounded' ? cell * 1.6 : (style === 'dots' ? cell * 1.4 : 0);
        return (
          <g key={i}>
            <rect x={ox} y={oy} width={cell * 7} height={cell * 7} fill={fg} rx={outerR} />
            <rect x={ox + cell} y={oy + cell} width={cell * 5} height={cell * 5} fill={bg} rx={style === 'rounded' ? cell * 1.2 : 0} />
            <rect x={ox + cell * 2} y={oy + cell * 2} width={cell * 3} height={cell * 3} fill={fg} rx={style === 'rounded' ? cell * 0.8 : (style === 'dots' ? cell * 1 : 0)} />
          </g>
        );
      })}

      {/* Draw data cells */}
      {matrix.flatMap((row, r) =>
        row.map((v, c) => {
          if (!v) return null;
          if (isFinderCell(r, c)) return null;
          if (inLogoArea(r, c)) return null;
          if (style === 'dots') {
            return <circle key={`${r}-${c}`} cx={c * cell + cell / 2} cy={r * cell + cell / 2} r={cell * 0.42} fill={fg} />;
          }
          if (style === 'rounded') {
            return <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} rx={cell * 0.25} fill={fg} />;
          }
          return <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={fg} />;
        })
      )}

      {/* Logo */}
      {logoBox && (
        <>
          <rect x={logoBox.x - 4} y={logoBox.y - 4} width={logoBox.w + 8} height={logoBox.h + 8} fill={bg} rx="10" />
          <rect x={logoBox.x} y={logoBox.y} width={logoBox.w} height={logoBox.h} fill={fg} rx="8" />
          <text
            x={logoBox.x + logoBox.w / 2}
            y={logoBox.y + logoBox.h / 2 + size * 0.035}
            textAnchor="middle"
            fontSize={size * 0.085}
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            fill={bg}
            letterSpacing="-1"
          >CL</text>
        </>
      )}
    </svg>
  );
};

// ─── QR style radio card ─────
const StyleRadio = ({ id, active, label }) => (
  <div style={{
    flex: 1, padding: '12px 10px',
    background: '#fff',
    border: `1px solid ${active ? dmTheme.accent : dmTheme.border}`,
    boxShadow: active ? `0 0 0 3px ${dmTheme.accentSoft}` : 'none',
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 5, overflow: 'hidden' }}>
      <QrCode size={44} style={id} seed={2} />
    </div>
    <div style={{ fontSize: 11.5, fontWeight: active ? 600 : 500, color: active ? dmTheme.text : dmTheme.textMuted }}>
      {label}
    </div>
  </div>
);

const ColorSwatch = ({ color, active, onCheck }) => (
  <div style={{
    position: 'relative',
    width: 28, height: 28, borderRadius: 6, background: color,
    border: active ? `2px solid ${dmTheme.text}` : `1px solid ${dmTheme.borderSoft}`,
    boxSizing: 'border-box', cursor: 'pointer',
  }}>
    {active && (
      <span style={{
        position: 'absolute', top: -4, right: -4,
        width: 14, height: 14, borderRadius: '50%',
        background: dmTheme.text, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ICheck size={9} sw={3} />
      </span>
    )}
  </div>
);

const RadioRow = ({ checked, title, desc, locked }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px',
    background: checked ? '#FDFAF7' : '#fff',
    border: `1px solid ${checked ? dmTheme.accent : dmTheme.border}`,
    borderRadius: 8, cursor: locked ? 'not-allowed' : 'pointer',
    boxShadow: checked ? `0 0 0 3px ${dmTheme.accentSoft}` : 'none',
    opacity: locked ? 0.65 : 1,
  }}>
    <span style={{
      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
      border: `2px solid ${checked ? dmTheme.accent : dmTheme.border}`,
      background: '#fff', position: 'relative',
    }}>
      {checked && <span style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: dmTheme.accent }} />}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text, display: 'flex', alignItems: 'center', gap: 6 }}>
        {title}
        {locked && <ILock size={11} style={{ color: dmTheme.textSubtle }} />}
      </div>
      <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 2 }}>{desc}</div>
    </div>
  </div>
);

const CheckboxRow = ({ checked, label, locked }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 0', cursor: locked ? 'not-allowed' : 'pointer',
    opacity: locked ? 0.55 : 1,
  }}>
    <span style={{
      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
      background: checked ? dmTheme.accent : '#fff',
      border: `1.5px solid ${checked ? dmTheme.accent : dmTheme.border}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {checked && <ICheck size={10} sw={3} style={{ color: '#fff' }} />}
    </span>
    <span style={{ fontSize: 13, color: dmTheme.text, fontWeight: 500, flex: 1 }}>{label}</span>
    {locked && (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '1px 6px', borderRadius: 4,
        background: '#E8F0E8', color: dmTheme.success,
        fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
      }}>
        <ILock size={9} /> PRO
      </span>
    )}
  </div>
);

const Seg3 = ({ options, active }) => (
  <div style={{
    display: 'inline-flex', padding: 2, borderRadius: 7,
    background: '#fff', border: `1px solid ${dmTheme.border}`,
  }}>
    {options.map(o => (
      <span key={o} style={{
        padding: '5px 12px', fontSize: 12, fontWeight: 550,
        borderRadius: 5,
        background: o === active ? dmTheme.text : 'transparent',
        color: o === active ? '#fff' : dmTheme.textMuted,
        cursor: 'pointer',
      }}>{o}</span>
    ))}
  </div>
);

const FieldBlock = ({ label, children, right }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 10,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      {right}
    </div>
    {children}
  </div>
);

// ─── LEFT preview card ─────
const QrPreviewCard = ({ plan = 'STARTER', style = 'classic', fg = '#18181B', logo = false, paletteActive = '#18181B' }) => {
  const palette = [
    { hex: '#18181B', name: 'Slate' },
    { hex: '#B8633D', name: 'Terracotta' },
    { hex: '#000000', name: 'Black' },
    { hex: '#1E3A5F', name: 'Navy' },
  ];
  return (
    <div style={{
      width: 600, flexShrink: 0,
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: 36,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      {/* QR */}
      <div style={{ padding: 8, borderRadius: 12, background: '#fff', border: `1px solid ${dmTheme.borderSoft}` }}>
        <QrCode size={320} fg={fg} style={style} logo={logo} seed={3} />
      </div>

      {/* URL */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px', background: dmTheme.bg,
        border: `1px solid ${dmTheme.borderSoft}`, borderRadius: 8,
      }}>
        <IGlobe size={13} style={{ color: dmTheme.textSubtle }} />
        <span style={{ fontSize: 13, color: dmTheme.text, fontFamily: 'ui-monospace, monospace', letterSpacing: -0.2 }}>
          cafelinville.ge/main-menu
        </span>
        <ICopy size={13} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
      </div>

      {/* Style controls */}
      <div style={{ width: '100%', borderTop: `1px solid ${dmTheme.borderSoft}`, paddingTop: 22 }}>
        <FieldBlock label="Style">
          <div style={{ display: 'flex', gap: 10 }}>
            <StyleRadio id="classic" active={style === 'classic'} label="Classic" />
            <StyleRadio id="rounded" active={style === 'rounded'} label="Rounded" />
            <StyleRadio id="dots"    active={style === 'dots'}    label="Dots" />
          </div>
        </FieldBlock>

        <FieldBlock label="Foreground color">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              padding: '5px 8px 5px 5px', background: '#fff',
              border: `1px solid ${dmTheme.border}`, borderRadius: 7,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: fg, border: `1px solid ${dmTheme.borderSoft}` }} />
              <span style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', color: dmTheme.text }}>
                {fg.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {palette.map(p => (
                <ColorSwatch key={p.hex} color={p.hex} active={p.hex === paletteActive} />
              ))}
            </div>
          </div>
        </FieldBlock>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FieldBlock label="Background">
            <Seg3 options={['White', 'Transparent']} active="White" />
          </FieldBlock>
          <FieldBlock label="Size">
            <Seg3 options={['S', 'M', 'L']} active="M" />
          </FieldBlock>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 8,
          background: plan === 'STARTER' ? '#FCFBF8' : '#fff',
          border: `1px solid ${dmTheme.border}`,
          opacity: plan === 'STARTER' ? 0.85 : 1,
        }}>
          <IImage size={15} style={{ color: plan === 'STARTER' ? dmTheme.textSubtle : dmTheme.accent }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              Add logo to center
              {plan === 'STARTER' && <ILock size={11} style={{ color: dmTheme.textSubtle }} />}
            </div>
            <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 1 }}>
              Keeps QR scannable with error correction.
            </div>
          </div>
          {plan === 'STARTER' ? (
            <span style={{
              padding: '2px 7px', borderRadius: 4,
              background: '#E8F0E8', color: dmTheme.success,
              fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
            }}>PRO</span>
          ) : (
            <Toggle on={logo} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── RIGHT: Download & Share + scan stats + URL ─────
const QrRightColumn = ({ plan = 'STARTER' }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
    {/* Download card */}
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: 22,
    }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: dmTheme.text, marginBottom: 4, letterSpacing: -0.3 }}>
        Download & share
      </div>
      <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginBottom: 18 }}>
        Export your QR code or use a print-ready poster template.
      </div>

      <FieldBlock label="Format">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RadioRow checked={true}  title="PNG" desc="Best for digital · high-res raster" />
          <RadioRow checked={false} title="SVG" desc="Scales perfectly for print · vector" />
          <RadioRow checked={false} title="PDF" desc="Print-ready with 3mm bleed" />
        </div>
      </FieldBlock>

      <FieldBlock label="Include">
        <CheckboxRow checked={true}  label="Menu URL under QR" />
        <CheckboxRow checked={true}  label='Short call-to-action "Scan for menu"' />
        <CheckboxRow checked={plan === 'PRO'} label="Restaurant logo above QR" locked={plan !== 'PRO'} />
      </FieldBlock>

      <Btn variant="primary" icon={IDownload} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 13.5, marginBottom: 10 }}>
        Download QR · PNG
      </Btn>
      <Btn icon={IImage} style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 13 }}>
        Print-ready poster templates
        <span style={{
          marginLeft: 8, padding: '1px 7px', borderRadius: 4,
          background: dmTheme.chip, color: dmTheme.textMuted,
          fontSize: 10.5, fontWeight: 600,
        }}>8 templates</span>
      </Btn>
    </div>

    {/* Scan stats */}
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        This QR has been scanned
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6,
      }}>
        <span style={{
          fontSize: 36, fontWeight: 600, color: dmTheme.text,
          letterSpacing: -1, fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        }}>2,410</span>
        <span style={{ fontSize: 13, color: dmTheme.textMuted }}>times in the last 30 days</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        paddingTop: 10, marginTop: 4, borderTop: `1px solid ${dmTheme.borderSoft}`,
        fontSize: 12.5, color: dmTheme.textMuted,
      }}>
        <IPin size={12} style={{ color: dmTheme.accent }} />
        <span>Most active table:</span>
        <span style={{ color: dmTheme.text, fontWeight: 600 }}>Table 6</span>
        <span style={{ color: dmTheme.textSubtle, fontVariantNumeric: 'tabular-nums' }}>(1,284 scans)</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11.5, color: dmTheme.accent, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          View in Analytics <IArrowRight size={11} sw={2} />
        </span>
      </div>
    </div>

    {/* Short URL */}
    <div style={{
      background: '#fff', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: dmTheme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
        Direct menu link
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px', background: dmTheme.bg,
        border: `1px solid ${dmTheme.borderSoft}`, borderRadius: 8,
        marginBottom: 14,
      }}>
        <IGlobe size={13} style={{ color: dmTheme.textSubtle }} />
        <span style={{ flex: 1, fontSize: 13, color: dmTheme.text, fontFamily: 'ui-monospace, monospace', letterSpacing: -0.2 }}>
          https://cafelinville.ge/main-menu
        </span>
        <Btn small icon={ICopy}>Copy</Btn>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10,
        borderTop: `1px solid ${dmTheme.borderSoft}`,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: dmTheme.text }}>Track scan source per QR</div>
          <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 2 }}>
            Tag QR codes by table or location so Analytics can attribute scans.
          </div>
        </div>
        <Toggle on={true} />
      </div>
    </div>
  </div>
);

// ─── Template modal ─────
const TemplatePreview = ({ kind }) => {
  // Each kind renders a small shape mimicking the template
  if (kind === 'tent-A4') {
    return (
      <div style={{
        width: '100%', aspectRatio: '4 / 3', background: '#FCFBF8', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Tent shape */}
        <svg width="70%" height="70%" viewBox="0 0 100 80">
          <polygon points="50,8 90,72 10,72" fill="#fff" stroke={dmTheme.border} strokeWidth="1" />
          <polygon points="50,8 90,72 50,72" fill="#F6F4F0" stroke={dmTheme.border} strokeWidth="1" />
          {/* QR on front */}
          <g transform="translate(28, 42)">
            <rect x="0" y="0" width="22" height="22" fill="#fff" stroke="#18181B" strokeWidth="0.5" />
            <rect x="3" y="3" width="5" height="5" fill="#18181B" />
            <rect x="14" y="3" width="5" height="5" fill="#18181B" />
            <rect x="3" y="14" width="5" height="5" fill="#18181B" />
            <rect x="10" y="10" width="2" height="2" fill="#18181B" />
            <rect x="13" y="13" width="2" height="2" fill="#18181B" />
          </g>
          <text x="50" y="20" fontSize="4" textAnchor="middle" fill="#18181B" fontWeight="700">MENU</text>
        </svg>
      </div>
    );
  }
  if (kind === 'poster-A3') {
    return (
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#FCFBF8', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{
          width: '50%', height: '100%', background: '#fff', borderRadius: 3,
          border: `1px solid ${dmTheme.border}`, padding: 8,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: dmTheme.text }}>SCAN TO</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: dmTheme.accent, letterSpacing: 1 }}>ORDER</div>
          <div style={{ width: 40, height: 40, background: '#fff', border: `1px solid ${dmTheme.text}` }}>
            <QrCode size={40} style="classic" seed={5} />
          </div>
          <div style={{ fontSize: 5, color: dmTheme.textMuted, fontFamily: 'ui-monospace' }}>cafelinville.ge</div>
        </div>
      </div>
    );
  }
  if (kind === 'tent-min') {
    return (
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#FCFBF8', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="70%" height="70%" viewBox="0 0 100 80">
          <polygon points="50,12 85,70 15,70" fill="#18181B" stroke="none" />
          <g transform="translate(30, 42)">
            <rect x="0" y="0" width="22" height="22" fill="#fff" />
            <rect x="3" y="3" width="5" height="5" fill="#18181B" />
            <rect x="14" y="3" width="5" height="5" fill="#18181B" />
            <rect x="3" y="14" width="5" height="5" fill="#18181B" />
            <rect x="10" y="10" width="2" height="2" fill="#18181B" />
          </g>
          <text x="50" y="25" fontSize="4" textAnchor="middle" fill="#fff" fontWeight="600">CL</text>
        </svg>
      </div>
    );
  }
  if (kind === 'receipt') {
    return (
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#FCFBF8', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '32%', height: '85%', background: '#fff', borderRadius: 2,
          border: `1px dashed ${dmTheme.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6,
        }}>
          <div style={{ fontSize: 5, color: dmTheme.textMuted }}>─── RECEIPT ───</div>
          <div style={{ width: 36, height: 36 }}>
            <QrCode size={36} style="classic" seed={6} />
          </div>
          <div style={{ fontSize: 6, fontWeight: 700, color: dmTheme.text }}>Rate your visit</div>
          <div style={{ fontSize: 4.5, color: dmTheme.textMuted }}>Scan to review</div>
        </div>
      </div>
    );
  }
  if (kind === 'decal') {
    return (
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#FCFBF8', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 86, height: 86, borderRadius: '50%',
          background: dmTheme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode size={40} style="classic" seed={7} />
          </div>
          <svg width="86" height="86" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <path id="circPath" d="M 43 43 m -36 0 a 36 36 0 1 1 72 0 a 36 36 0 1 1 -72 0" />
            </defs>
            <text fontSize="6" fontWeight="700" fill="#fff" letterSpacing="1.5">
              <textPath href="#circPath">SCAN • FOR MENU • SCAN • FOR MENU •</textPath>
            </text>
          </svg>
        </div>
      </div>
    );
  }
  if (kind === 'booklet') {
    return (
      <div style={{ width: '100%', aspectRatio: '4 / 3', background: '#FCFBF8', borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <div style={{
          width: '70%', height: '90%', background: '#fff', borderRadius: 2,
          border: `1px solid ${dmTheme.border}`, position: 'relative',
          padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 6, color: dmTheme.textMuted, textAlign: 'center', lineHeight: 1.3 }}>
            Thank you for dining<br/>with us today.
          </div>
          <div style={{ width: 38, height: 38 }}>
            <QrCode size={38} style="classic" seed={8} />
          </div>
          <div style={{ fontSize: 5, fontWeight: 700, color: dmTheme.text }}>CAFÉ LINVILLE</div>
        </div>
      </div>
    );
  }
  return null;
};

const templates = [
  { kind: 'tent-A4', name: 'Table tent', dims: 'A4 folded · 148×210mm' },
  { kind: 'poster-A3', name: 'Wall poster', dims: 'A3 · 297×420mm' },
  { kind: 'tent-min', name: 'Table tent · minimal', dims: 'A4 folded' },
  { kind: 'receipt',  name: 'Receipt insert', dims: '80×150mm' },
  { kind: 'decal',    name: 'Window decal', dims: '200×200mm' },
  { kind: 'booklet',  name: 'Menu booklet back', dims: 'A5' },
];

const TemplatesModal = () => (
  <>
    {/* Backdrop */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(24, 24, 27, 0.4)',
      zIndex: 20,
    }} />
    {/* Modal */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 880, height: 600,
      background: '#fff', borderRadius: 16,
      boxShadow: '0 40px 100px rgba(0,0,0,0.20), 0 10px 30px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      zIndex: 21, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px',
        borderBottom: `1px solid ${dmTheme.borderSoft}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.3, marginBottom: 3 }}>
            Print templates
          </div>
          <div style={{ fontSize: 12.5, color: dmTheme.textMuted }}>
            Pick a template — we'll add your QR and brand.
          </div>
        </div>
        <IX size={19} style={{ color: dmTheme.textMuted, cursor: 'pointer' }} />
      </div>

      {/* Filter pills */}
      <div style={{
        padding: '12px 22px', display: 'flex', gap: 6, flexWrap: 'wrap',
        borderBottom: `1px solid ${dmTheme.borderSoft}`,
      }}>
        {['All', 'Table tent', 'Wall poster', 'Receipt insert', 'Window decal', 'Business card', 'Menu booklet'].map((f, i) => (
          <span key={f} style={{
            padding: '5px 11px', fontSize: 12, fontWeight: 550,
            borderRadius: 6,
            background: i === 0 ? dmTheme.text : '#fff',
            color: i === 0 ? '#fff' : dmTheme.textMuted,
            border: `1px solid ${i === 0 ? dmTheme.text : dmTheme.border}`,
            cursor: 'pointer',
          }}>{f}</span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        }}>
          {templates.map((t, i) => (
            <div key={i} style={{
              background: '#fff', border: `1px solid ${i === 1 ? dmTheme.accent : dmTheme.border}`,
              boxShadow: i === 1 ? `0 0 0 3px ${dmTheme.accentSoft}` : 'none',
              borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
            }}>
              <TemplatePreview kind={t.kind} />
              <div style={{ padding: '10px 12px', borderTop: `1px solid ${dmTheme.borderSoft}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: dmTheme.text }}>{t.name}</div>
                <div style={{ fontSize: 10.5, color: dmTheme.textMuted, fontFamily: 'ui-monospace' }}>{t.dims}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 22px',
        borderTop: `1px solid ${dmTheme.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: dmTheme.bg,
      }}>
        <span style={{ fontSize: 12, color: dmTheme.textMuted }}>
          <span style={{ color: dmTheme.text, fontWeight: 600 }}>1</span> template selected · Wall poster (A3)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>Close</Btn>
          <Btn variant="primary" icon={IDownload}>Download selected (PNG)</Btn>
        </div>
      </div>
    </div>
  </>
);

// ─── QR body ─────
const QrBody = ({ plan = 'STARTER', style = 'classic', fg = '#18181B', logo = false, paletteActive = '#18181B' }) => (
  <div style={{ display: 'flex', gap: 20, height: '100%', minHeight: 0 }}>
    <QrPreviewCard plan={plan} style={style} fg={fg} logo={logo} paletteActive={paletteActive} />
    <QrRightColumn plan={plan} />
  </div>
);

// ─── Page wrappers ─────
const EditorQrStarterPage = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <EditorHeader activeTab="qr" />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <QrBody plan="STARTER" style="classic" fg="#18181B" logo={false} paletteActive="#18181B" />
    </div>
  </div>
);

const EditorQrProPage = () => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <EditorHeader activeTab="qr" />
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <QrBody plan="PRO" style="rounded" fg="#B8633D" logo={true} paletteActive="#B8633D" />
    </div>
  </div>
);

const EditorQrModalPage = () => (
  <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    <EditorQrStarterPage />
    <TemplatesModal />
  </div>
);

Object.assign(window, {
  EditorQrStarterPage, EditorQrProPage, EditorQrModalPage,
});
