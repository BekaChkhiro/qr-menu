import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design Tokens — Showcase',
};

// ── Token definitions for rendering ─────────────────────────────────────────

const colorTokens = [
  // Surfaces & Text
  { group: 'Surfaces & Text', name: 'bg', cssVar: '--bg', hex: '#FAFAF9', bg: 'bg-bg', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'card', cssVar: '--card', hex: '#FFFFFF', bg: 'bg-card', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'chip', cssVar: '--chip', hex: '#F4F3EE', bg: 'bg-chip', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'border', cssVar: '--border', hex: '#EAEAE6', bg: 'bg-border', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'border-soft', cssVar: '--border-soft', hex: '#F0EFEA', bg: 'bg-border-soft', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'text', cssVar: '--text', hex: '#18181B', bg: 'bg-text-default', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'text-muted', cssVar: '--text-muted', hex: '#71717A', bg: 'bg-text-muted', border: 'border-border' },
  { group: 'Surfaces & Text', name: 'text-subtle', cssVar: '--text-subtle', hex: '#A1A1AA', bg: 'bg-text-subtle', border: 'border-border' },
  // Semantic
  { group: 'Semantic', name: 'accent', cssVar: '--accent', hex: '#B8633D', bg: 'bg-accent', border: 'border-border' },
  { group: 'Semantic', name: 'accent-soft', cssVar: '--accent-soft', hex: '#F7EDE6', bg: 'bg-accent-soft', border: 'border-border' },
  { group: 'Semantic', name: 'success', cssVar: '--success', hex: '#3F7E3F', bg: 'bg-success', border: 'border-border' },
  { group: 'Semantic', name: 'success-soft', cssVar: '--success-soft', hex: '#E8F0E8', bg: 'bg-success-soft', border: 'border-border' },
  { group: 'Semantic', name: 'warning', cssVar: '--warning', hex: '#B87A1D', bg: 'bg-warning', border: 'border-border' },
  { group: 'Semantic', name: 'warning-soft', cssVar: '--warning-soft', hex: '#F7EFE0', bg: 'bg-warning-soft', border: 'border-border' },
  { group: 'Semantic', name: 'danger', cssVar: '--danger', hex: '#B8423D', bg: 'bg-danger', border: 'border-border' },
  { group: 'Semantic', name: 'danger-soft', cssVar: '--danger-soft', hex: '#F7E6E5', bg: 'bg-danger-soft', border: 'border-border' },
] as const;

const radiusTokens = [
  { name: 'xs', value: '4px', cls: 'rounded-xs' },
  { name: 'sm', value: '6px', cls: 'rounded-sm' },
  { name: 'md', value: '8px', cls: 'rounded-md' },
  { name: 'lg', value: '10px', cls: 'rounded-lg' },
  { name: 'xl', value: '14px', cls: 'rounded-xl' },
  { name: 'card', value: '12px', cls: 'rounded-card' },
  { name: 'pill', value: '9999px', cls: 'rounded-pill' },
] as const;

const shadowTokens = [
  { name: 'xs', value: '0 1px 2px rgba(0,0,0,0.06)', cls: 'shadow-xs' },
  { name: 'sm', value: '0 2px 6px rgba(0,0,0,0.06)', cls: 'shadow-sm' },
  { name: 'md', value: '0 6px 18px rgba(0,0,0,0.08)', cls: 'shadow-md' },
  { name: 'lg', value: '0 10px 30px rgba(0,0,0,0.10)', cls: 'shadow-lg' },
  { name: 'xl', value: '0 20px 50px rgba(0,0,0,0.12)', cls: 'shadow-xl' },
] as const;

const typeTokens = [
  { name: 'display', cls: 'text-display', size: '32px', weight: '600', usage: 'Hero / big numbers' },
  { name: 'h1', cls: 'text-h1', size: '22px', weight: '600', usage: 'Page title' },
  { name: 'h2', cls: 'text-h2', size: '16px', weight: '600', usage: 'Section heading' },
  { name: 'body', cls: 'text-body', size: '13px', weight: '400', usage: 'Paragraph text' },
  { name: 'caption', cls: 'text-caption', size: '12px', weight: '500', usage: 'Helper / muted' },
  { name: 'overline', cls: 'text-overline uppercase tracking-widest', size: '10.5px', weight: '700', usage: 'Uppercase section labels' },
  { name: 'mono', cls: 'text-mono font-mono', size: '12px', weight: '500', usage: 'Code, URLs, keyboard' },
] as const;

// ── Page component ───────────────────────────────────────────────────────────

export default function TokensShowcasePage() {
  const surfaceTokens = colorTokens.filter((t) => t.group === 'Surfaces & Text');
  const semanticTokens = colorTokens.filter((t) => t.group === 'Semantic');

  return (
    <main
      data-testid="tokens-showcase"
      className="min-h-screen bg-bg text-text-default px-6 py-12 font-sans"
    >
      <div className="max-w-4xl mx-auto space-y-16">

        {/* Header */}
        <header>
          <p className="text-overline uppercase tracking-widest text-text-muted mb-2">
            T9.1 Design Tokens Migration
          </p>
          <h1 className="text-display text-text-default">Section H Design Tokens</h1>
          <p className="text-body text-text-muted mt-2">
            Visual smoke-test for Playwright baselines and designer review. Not linked from navigation.
          </p>
        </header>

        {/* ── Colors ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="colors-heading">
          <h2 id="colors-heading" className="text-h1 text-text-default mb-6 pb-2 border-b border-border">
            Colors <span className="text-caption text-text-muted font-normal ml-2">16 tokens</span>
          </h2>

          <div className="mb-8">
            <h3 className="text-h2 text-text-default mb-4">Surfaces &amp; Text</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {surfaceTokens.map((token) => (
                <ColorSwatch key={token.name} {...token} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-h2 text-text-default mb-4">Semantic</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {semanticTokens.map((token) => (
                <ColorSwatch key={token.name} {...token} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Border Radius ───────────────────────────────────────────────── */}
        <section aria-labelledby="radius-heading">
          <h2 id="radius-heading" className="text-h1 text-text-default mb-6 pb-2 border-b border-border">
            Border Radius <span className="text-caption text-text-muted font-normal ml-2">7 stops</span>
          </h2>
          <div className="flex flex-wrap gap-6 items-end">
            {radiusTokens.map((token) => (
              <div key={token.name} className="flex flex-col items-center gap-2">
                <div
                  className={`w-20 h-20 bg-card border-2 border-border ${token.cls} flex items-center justify-center`}
                  aria-hidden="true"
                />
                <span className="text-caption text-text-default font-medium">{token.name}</span>
                <span className="text-caption text-text-muted tabular-nums">{token.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Shadows ─────────────────────────────────────────────────────── */}
        <section aria-labelledby="shadows-heading">
          <h2 id="shadows-heading" className="text-h1 text-text-default mb-6 pb-2 border-b border-border">
            Shadows <span className="text-caption text-text-muted font-normal ml-2">5 levels</span>
          </h2>
          <div className="flex flex-wrap gap-8 items-center">
            {shadowTokens.map((token) => (
              <div key={token.name} className="flex flex-col items-center gap-3">
                <div
                  className={`w-32 h-20 bg-card rounded-card ${token.cls} flex items-center justify-center`}
                  aria-hidden="true"
                />
                <span className="text-caption text-text-default font-medium">{token.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ──────────────────────────────────────────────────── */}
        <section aria-labelledby="type-heading">
          <h2 id="type-heading" className="text-h1 text-text-default mb-6 pb-2 border-b border-border">
            Typography <span className="text-caption text-text-muted font-normal ml-2">7 levels</span>
          </h2>
          <div className="space-y-5 bg-card border border-border rounded-card p-6">
            {typeTokens.map((token) => (
              <div key={token.name} className="flex items-baseline gap-4 flex-wrap border-b border-border-soft last:border-0 pb-4 last:pb-0">
                <span className={`${token.cls} text-text-default shrink-0`}>Aa</span>
                <div className="flex gap-3 items-baseline flex-wrap">
                  <code className="text-caption font-mono text-text-muted bg-chip px-1.5 py-0.5 rounded-xs">
                    text-{token.name}
                  </code>
                  <span className="text-caption text-text-muted tabular-nums">
                    {token.size} / w{token.weight}
                  </span>
                  <span className="text-caption text-text-subtle">{token.usage}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tabular Nums ────────────────────────────────────────────────── */}
        <section aria-labelledby="tabular-heading">
          <h2 id="tabular-heading" className="text-h1 text-text-default mb-6 pb-2 border-b border-border">
            Tabular Numbers
          </h2>
          <p className="text-body text-text-muted mb-4">
            Compare digit width alignment. Numbers in metrics, tables, and prices should use{' '}
            <code className="text-caption font-mono bg-chip px-1.5 py-0.5 rounded-xs">.tabular-nums</code>.
          </p>
          <div className="bg-card border border-border rounded-card p-6 space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-caption text-text-muted uppercase tracking-wider">With tabular-nums</span>
              <p className="text-h2 tabular-nums text-text-default font-mono">1234567890</p>
              <p className="text-h2 tabular-nums text-text-default font-mono">9876543210</p>
            </div>
            <div className="flex flex-col gap-1 border-t border-border-soft pt-4">
              <span className="text-caption text-text-muted uppercase tracking-wider">Without tabular-nums</span>
              <p className="text-h2 text-text-default font-mono" data-testid="tabular-nums-without" style={{ fontVariantNumeric: 'normal' }}>
                1234567890
              </p>
              <p className="text-h2 text-text-default font-mono" data-testid="tabular-nums-without" style={{ fontVariantNumeric: 'normal' }}>
                9876543210
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

// ── ColorSwatch subcomponent ─────────────────────────────────────────────────

interface ColorSwatchProps {
  name: string;
  hex: string;
  bg: string;
  cssVar: string;
}

function ColorSwatch({ name, hex, bg, cssVar }: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={`w-full h-16 rounded-card border border-border ${bg}`}
        aria-label={`Color swatch for ${name}`}
        role="img"
      />
      <div>
        <p className="text-caption font-medium text-text-default">{name}</p>
        <p className="text-caption text-text-muted tabular-nums">{hex}</p>
        <p className="text-caption text-text-subtle font-mono">{cssVar}</p>
      </div>
    </div>
  );
}
