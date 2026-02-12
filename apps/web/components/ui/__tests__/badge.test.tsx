import { describe, it, expect } from 'vitest'
import { render, screen } from '@/tests/utils'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toHaveClass('bg-primary')
  })

  it('applies secondary variant classes', () => {
    render(<Badge variant="secondary">Secondary</Badge>)
    const badge = screen.getByText('Secondary')
    expect(badge).toHaveClass('bg-secondary')
  })

  it('applies destructive variant classes', () => {
    render(<Badge variant="destructive">Destructive</Badge>)
    const badge = screen.getByText('Destructive')
    expect(badge).toHaveClass('bg-destructive')
  })

  it('applies outline variant classes', () => {
    render(<Badge variant="outline">Outline</Badge>)
    const badge = screen.getByText('Outline')
    expect(badge).toHaveClass('text-foreground')
  })

  it('applies success variant classes', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge).toHaveClass('bg-green-100')
  })

  it('applies warning variant classes', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge).toHaveClass('bg-yellow-100')
  })

  it('merges custom className with default classes', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-class')
    expect(badge).toHaveClass('rounded-full') // default class
  })

  it('passes through additional HTML attributes', () => {
    render(<Badge data-testid="test-badge" title="Badge title">Attrs</Badge>)
    const badge = screen.getByTestId('test-badge')
    expect(badge).toHaveAttribute('title', 'Badge title')
  })

  it('renders as a div element', () => {
    render(<Badge data-testid="badge-div">Div</Badge>)
    const badge = screen.getByTestId('badge-div')
    expect(badge.tagName).toBe('DIV')
  })
})
