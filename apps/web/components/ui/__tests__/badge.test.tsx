import { describe, it, expect } from 'vitest'
import { render, screen } from '@/tests/utils'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  // ── Section H variant tests (T10.4) ──────────────────────────────────────

  it('applies default variant as solid dark-bg white-text', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toHaveClass('bg-text-default', 'text-white')
  })

  it('applies secondary variant as neutral chip', () => {
    render(<Badge variant="secondary">Secondary</Badge>)
    const badge = screen.getByText('Secondary')
    expect(badge).toHaveClass('bg-chip', 'text-text-muted')
  })

  it('applies destructive variant as soft-danger pill', () => {
    render(<Badge variant="destructive">Destructive</Badge>)
    const badge = screen.getByText('Destructive')
    expect(badge).toHaveClass('bg-danger-soft', 'text-danger')
  })

  it('applies outline variant as bordered card', () => {
    render(<Badge variant="outline">Outline</Badge>)
    const badge = screen.getByText('Outline')
    expect(badge).toHaveClass('bg-card', 'text-text-default', 'border')
  })

  it('applies success variant as soft-success tone', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge).toHaveClass('bg-success-soft', 'text-success')
  })

  it('applies warning variant as soft-warning tone', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge).toHaveClass('bg-warning-soft', 'text-warning')
  })

  it('applies accent variant as soft-accent tone', () => {
    render(<Badge variant="accent">Accent</Badge>)
    const badge = screen.getByText('Accent')
    expect(badge).toHaveClass('bg-accent-soft', 'text-accent')
  })

  it('applies neutral variant as chip tone', () => {
    render(<Badge variant="neutral">Neutral</Badge>)
    const badge = screen.getByText('Neutral')
    expect(badge).toHaveClass('bg-chip', 'text-text-muted')
  })

  it('applies solid variant as dark bg with white text', () => {
    render(<Badge variant="solid">Solid</Badge>)
    const badge = screen.getByText('Solid')
    expect(badge).toHaveClass('bg-text-default', 'text-white')
  })

  it('applies danger variant as soft-danger tone', () => {
    render(<Badge variant="danger">Danger</Badge>)
    const badge = screen.getByText('Danger')
    expect(badge).toHaveClass('bg-danger-soft', 'text-danger')
  })

  // ── Shape: rectangular by default, pill via `pill` prop ─────────────────

  it('renders as a compact rect (rounded-xs) by default', () => {
    render(<Badge>Rect</Badge>)
    const badge = screen.getByText('Rect')
    expect(badge).toHaveClass('rounded-xs')
  })

  it('renders as a pill when `pill` prop is true', () => {
    render(
      <Badge pill variant="success">
        Pill
      </Badge>,
    )
    const badge = screen.getByText('Pill')
    expect(badge).toHaveClass('rounded-pill')
  })

  // ── Typography, behaviour, and DOM ──────────────────────────────────────

  it('applies Section H typography (uppercase, bold, tracking)', () => {
    render(<Badge>Type</Badge>)
    const badge = screen.getByText('Type')
    expect(badge).toHaveClass('uppercase', 'font-bold')
  })

  it('merges custom className with default classes', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-class')
    expect(badge).toHaveClass('rounded-xs') // default shape class
  })

  it('passes through additional HTML attributes', () => {
    render(
      <Badge data-testid="test-badge" title="Badge title">
        Attrs
      </Badge>,
    )
    const badge = screen.getByTestId('test-badge')
    expect(badge).toHaveAttribute('title', 'Badge title')
  })

  it('renders as an inline span element', () => {
    render(<Badge data-testid="badge-el">Inline</Badge>)
    const badge = screen.getByTestId('badge-el')
    expect(badge.tagName).toBe('SPAN')
  })
})
