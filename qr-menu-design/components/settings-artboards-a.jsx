// Section G.1 — Settings artboards: Personal + Business info + Billing

// ─── Avatar block ─────
const AvatarEditor = ({ name = 'Nino Kapanadze', email = 'nino@cafelinville.ge' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 18,
    padding: 18, background: '#FCFBF8',
    border: `1px solid ${dmTheme.border}`, borderRadius: 12, marginBottom: 26,
  }}>
    <div style={{
      width: 68, height: 68, borderRadius: '50%',
      background: 'linear-gradient(135deg, #D4A574 0%, #B8864C 100%)',
      color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 26, fontWeight: 600, letterSpacing: -0.5,
      position: 'relative', flexShrink: 0,
    }}>
      NK
      <div style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 26, height: 26, borderRadius: '50%',
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      }}>
        <ICamera size={12.5} style={{ color: dmTheme.text }} />
      </div>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: dmTheme.text }}>
        {name}
      </div>
      <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginTop: 2 }}>
        {email} · Owner
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Btn small icon={IUpload}>Upload photo</Btn>
        <Btn small variant="ghost">Remove</Btn>
      </div>
    </div>
  </div>
);

// ─── Artboard G1: Profile ─────
const SettingsProfile = () => (
  <SettingsPage active="profile">
    <PageHeading title="Profile" subtitle="How your name and contact info appear to your team." />
    <AvatarEditor />

    <Section label="Personal information">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SetField label="First name">
          <Input value="Nino" />
        </SetField>
        <SetField label="Last name">
          <Input value="Kapanadze" />
        </SetField>
      </div>
      <SetField label="Email">
        <Input value="nino@cafelinville.ge" />
      </SetField>
      <SetField label="Phone" hint="Used for 2FA and critical alerts only.">
        <Input value="+995 599 12 34 56" />
      </SetField>
    </Section>

    <Section label="Preferences">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SetField label="Timezone">
          <Select value="(GMT+4) Tbilisi" />
        </SetField>
        <SetField label="Date format">
          <Select value="DD.MM.YYYY" />
        </SetField>
      </div>
    </Section>
  </SettingsPage>
);

// ─── Artboard G2: Business info ─────
const SettingsBusiness = () => (
  <SettingsPage active="business-info" dirty>
    <PageHeading title="Business info" subtitle="Information that appears on receipts, the menu, and your public profile." />

    {/* Logo */}
    <Section label="Logo" helper="Shown at the top of your menu and on printed receipts. PNG or SVG, max 2MB.">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{
          width: 92, height: 92, borderRadius: 14,
          background: dmTheme.text, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, letterSpacing: -0.5,
          fontFamily: 'Georgia, serif',
        }}>L</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Btn small icon={IUpload}>Replace logo</Btn>
          <Btn small variant="ghost">Remove</Btn>
          <div style={{ fontSize: 11.5, color: dmTheme.textSubtle, marginTop: 2 }}>
            cafelinville-mark.svg · 24 KB
          </div>
        </div>
      </div>
    </Section>

    <Section label="Business details">
      <SetField label="Business name">
        <Input value="Café Linville" />
      </SetField>
      <SetField label="Cuisine" hint="Shown as tags on your public menu page. Pick up to 4.">
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '7px 8px', background: '#fff',
          border: `1px solid ${dmTheme.border}`, borderRadius: 8, minHeight: 40,
        }}>
          {['Georgian', 'Coffee', 'Brunch'].map(c => (
            <div key={c} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 6px 4px 10px',
              background: dmTheme.accentSoft, color: dmTheme.accent,
              border: `1px solid ${dmTheme.accent}33`, borderRadius: 5,
              fontSize: 12, fontWeight: 550,
            }}>
              {c}
              <div style={{
                width: 14, height: 14, borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <IX size={10} sw={2.2} />
              </div>
            </div>
          ))}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 5,
            border: `1px dashed ${dmTheme.border}`,
            fontSize: 12, color: dmTheme.textMuted, cursor: 'pointer',
          }}>
            <IPlus size={10} sw={2} /> Add cuisine
          </div>
        </div>
      </SetField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SetField label="Price range" hint="A quick signal for diners. Budget to premium.">
          <div style={{
            display: 'flex', gap: 3, padding: 3,
            background: dmTheme.chip, borderRadius: 8,
          }}>
            {['₾', '₾₾', '₾₾₾', '₾₾₾₾'].map(p => {
              const active = p === '₾₾';
              return (
                <div key={p} style={{
                  flex: 1, textAlign: 'center',
                  padding: '6px 0', borderRadius: 6,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  background: active ? '#fff' : 'transparent',
                  color: active ? dmTheme.text : dmTheme.textMuted,
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}>{p}</div>
              );
            })}
          </div>
        </SetField>
        <SetField label="Tax ID (VAT)">
          <Input value="GE 405 123 456" />
        </SetField>
      </div>
      <SetField label="Short description" hint="Shown on your public menu page. Keep it under 140 characters.">
        <Textarea value="Small-batch coffee and seasonal brunch on Rustaveli Avenue. Open since 2019." rows={3} />
      </SetField>
    </Section>

    <Section label="Address">
      <SetField label="Street address">
        <Input value="Rustaveli Ave 32" />
      </SetField>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <SetField label="City">
          <Input value="Tbilisi" />
        </SetField>
        <SetField label="Postal code">
          <Input value="0108" />
        </SetField>
        <SetField label="Country">
          <Select value="Georgia" />
        </SetField>
      </div>
    </Section>

    <Section label="Contact & social">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SetField label="Public email">
          <Input value="hello@cafelinville.ge" />
        </SetField>
        <SetField label="Public phone">
          <Input value="+995 32 201 00 00" />
        </SetField>
      </div>
      <SetField label="Website">
        <Input value="https://cafelinville.ge" prefix={<ILink size={13} />} />
      </SetField>
      <SetField label="Instagram">
        <Input value="@cafelinville" prefix={<IInstagram size={13} />} />
      </SetField>
    </Section>

    <Section label="Opening hours">
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {[
          ['Monday',    '08:00', '20:00', true],
          ['Tuesday',   '08:00', '20:00', false],
          ['Wednesday', '08:00', '20:00', false],
          ['Thursday',  '08:00', '22:00', false],
          ['Friday',    '08:00', '22:00', false],
          ['Saturday',  '09:00', '22:00', false],
          ['Sunday',    '09:00', '18:00', false],
        ].map(([day, open, close, closed], i) => (
          <div key={day} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderBottom: i < 6 ? `1px solid ${dmTheme.border}` : 'none',
            fontSize: 13,
          }}>
            <Toggle on={!closed} />
            <div style={{ width: 96, fontWeight: 500, color: closed ? dmTheme.textSubtle : dmTheme.text }}>{day}</div>
            {closed ? (
              <div style={{ fontSize: 12.5, color: dmTheme.textSubtle, fontStyle: 'italic' }}>
                Closed
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  padding: '4px 10px', background: '#FAFAF9',
                  border: `1px solid ${dmTheme.border}`, borderRadius: 6,
                  fontSize: 12.5, color: dmTheme.text, fontVariantNumeric: 'tabular-nums',
                }}>{open}</div>
                <span style={{ color: dmTheme.textSubtle, fontSize: 12 }}>—</span>
                <div style={{
                  padding: '4px 10px', background: '#FAFAF9',
                  border: `1px solid ${dmTheme.border}`, borderRadius: 6,
                  fontSize: 12.5, color: dmTheme.text, fontVariantNumeric: 'tabular-nums',
                }}>{close}</div>
              </div>
            )}
            {!closed && i === 1 && (
              <div style={{ marginLeft: 'auto', fontSize: 11.5, color: dmTheme.accent, fontWeight: 550, cursor: 'pointer' }}>
                Copy to all
              </div>
            )}
            {!closed && i !== 1 && (
              <div style={{ marginLeft: 'auto', fontSize: 11.5, color: dmTheme.textSubtle, cursor: 'pointer' }}>
                Copy to all
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  </SettingsPage>
);

// ─── Artboard G3: Plan & billing ─────
const PlanCard = ({ plan, price, current, features, highlight, cta }) => (
  <div style={{
    padding: 20, background: '#fff',
    border: `${highlight ? 2 : 1}px solid ${highlight ? dmTheme.text : dmTheme.border}`,
    borderRadius: 12, position: 'relative',
    boxShadow: highlight ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
    display: 'flex', flexDirection: 'column',
  }}>
    {current && (
      <div style={{
        position: 'absolute', top: 14, right: 14,
        padding: '3px 8px', background: dmTheme.successSoft, color: dmTheme.success,
        borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
      }}>CURRENT</div>
    )}
    <div style={{ fontSize: 11.5, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, marginBottom: 6 }}>
      {plan.toUpperCase()}
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, color: dmTheme.text, letterSpacing: -0.5, marginBottom: 2, fontVariantNumeric: 'tabular-nums' }}>
      {price === 0 ? '0₾' : `${price}₾`}
      <span style={{ fontSize: 13, color: dmTheme.textMuted, fontWeight: 400, marginLeft: 4 }}>
        / month
      </span>
    </div>
    <div style={{ height: 1, background: dmTheme.border, margin: '16px 0 14px' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, flex: 1 }}>
      {features.map(f => (
        <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: dmTheme.text, lineHeight: 1.45 }}>
          <ICheck size={13} style={{ color: dmTheme.success, marginTop: 2, flexShrink: 0 }} sw={2.4} />
          <span>{f}</span>
        </div>
      ))}
    </div>
    {current ? (
      <Btn small style={{ width: '100%', justifyContent: 'center' }}>Manage</Btn>
    ) : (
      <Btn variant={highlight ? 'primary' : 'secondary'} small style={{ width: '100%', justifyContent: 'center' }}>
        {cta || 'Upgrade'}
      </Btn>
    )}
  </div>
);

const SettingsBilling = () => (
  <SettingsPage active="billing" showSaveBar={false}>
    <PageHeading title="Plan & billing" />

    {/* Current usage summary */}
    <div style={{
      padding: 18, marginBottom: 26,
      background: '#FCFBF8', border: `1px solid ${dmTheme.border}`,
      borderRadius: 12, display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, marginBottom: 4 }}>
          CURRENT PLAN
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: dmTheme.text }}>
          STARTER · 29₾/month
        </div>
        <div style={{ fontSize: 12.5, color: dmTheme.textMuted, marginTop: 3 }}>
          2 of 3 menus · 28 items · Next invoice Apr 28
        </div>
      </div>
      <div style={{ width: 1, height: 42, background: dmTheme.border }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: dmTheme.textSubtle, letterSpacing: 0.6, marginBottom: 4 }}>
          SCANS THIS MONTH
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: dmTheme.text, fontVariantNumeric: 'tabular-nums' }}>
          1,284 <span style={{ fontSize: 12, fontWeight: 400, color: dmTheme.textMuted }}>· unlimited</span>
        </div>
        <div style={{ width: '100%', height: 4, background: dmTheme.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ width: '42%', height: '100%', background: dmTheme.success }} />
        </div>
      </div>
    </div>

    <Section label="Plans">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <PlanCard
          plan="Free"
          price={0}
          cta="Downgrade"
          features={[
            '1 menu',
            '3 categories',
            '15 products',
            'Basic QR only',
            'Single language',
          ]}
        />
        <PlanCard
          plan="Starter"
          price={29}
          current highlight
          features={[
            '3 menus',
            'Unlimited categories & items',
            'Promotions & happy hours',
            'Custom branding & colors',
            'Basic analytics',
          ]}
        />
        <PlanCard
          plan="Pro"
          price={59}
          cta="Upgrade to Pro"
          features={[
            'Unlimited everything',
            'Multilingual menus (KA/EN/RU)',
            'Allergen & dietary tags',
            'Full analytics & heatmaps',
            'QR with logo & brand colors',
            'Team seats',
          ]}
        />
      </div>
    </Section>

    <Section label="Payment method" helper="Used for your monthly Starter subscription.">
      <div style={{
        padding: '14px 16px',
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 28, borderRadius: 5,
          background: '#1A1F36', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
        }}>VISA</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: dmTheme.text, fontWeight: 500 }}>
            Visa ···· 4242
          </div>
          <div style={{ fontSize: 11.5, color: dmTheme.textMuted, marginTop: 1 }}>
            Expires 08/27 · N. Kapanadze
          </div>
        </div>
        <Btn small>Replace</Btn>
      </div>
    </Section>

    <Section label="Invoices" helper="Download invoices for your accountant.">
      <div style={{
        background: '#fff', border: `1px solid ${dmTheme.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {[
          ['INV-2026-003', 'Mar 28, 2026', '29₾', 'Paid'],
          ['INV-2026-002', 'Feb 28, 2026', '29₾', 'Paid'],
          ['INV-2026-001', 'Jan 28, 2026', '29₾', 'Paid'],
        ].map(([id, date, amt, status], i) => (
          <div key={id} style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 0.8fr 0.8fr 60px',
            gap: 16, padding: '12px 16px', alignItems: 'center',
            borderBottom: i < 2 ? `1px solid ${dmTheme.border}` : 'none',
            fontSize: 12.5,
          }}>
            <div style={{ fontFamily: 'ui-monospace, monospace', color: dmTheme.text }}>{id}</div>
            <div style={{ color: dmTheme.textMuted }}>{date}</div>
            <div style={{ color: dmTheme.text, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{amt}</div>
            <div>
              <span style={{
                padding: '2px 8px', background: dmTheme.successSoft, color: dmTheme.success,
                borderRadius: 4, fontSize: 11, fontWeight: 600,
              }}>{status}</span>
            </div>
            <div style={{ color: dmTheme.textMuted, cursor: 'pointer', display: 'flex', justifyContent: 'flex-end' }}>
              <IDownload size={13} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  </SettingsPage>
);

Object.assign(window, {
  AvatarEditor, SettingsProfile, SettingsBusiness, SettingsBilling, PlanCard,
});
