import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/tests/utils'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  // Variant tests — Section H (T10.1)
  describe('variants', () => {
    it('applies primary variant classes by default', () => {
      render(<Button>Default</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-text-default', 'text-white')
    })

    it('applies destructive variant as filled red', () => {
      render(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-danger', 'text-white')
    })

    it('applies outline alias as bordered card', () => {
      render(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border', 'bg-card')
    })

    it('applies secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-card', 'text-text-default')
    })

    it('applies ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-chip')
    })

    it('applies link variant as always-underlined', () => {
      render(<Button variant="link">Link</Button>)
      expect(screen.getByRole('button')).toHaveClass('underline', 'underline-offset-4')
    })
  })

  // Size tests — Section H spec: 26 / 32 / 40 px
  describe('sizes', () => {
    it('applies md size by default (32px)', () => {
      render(<Button>Default Size</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-[32px]', 'px-[13px]')
    })

    it('applies sm size (26px)', () => {
      render(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-[26px]', 'px-[10px]')
    })

    it('applies lg size (40px)', () => {
      render(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-[40px]', 'px-[18px]')
    })

    it('applies legacy icon size (32×32 square)', () => {
      render(<Button size="icon">Icon</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-[32px]', 'w-[32px]')
    })
  })

  // Loading & icon-only props (new in T10.1)
  describe('loading & iconOnly props', () => {
    it('sets aria-busy and disables the button when loading', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <Button loading onClick={handleClick}>
          Saving…
        </Button>,
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('hides children when iconOnly=true', () => {
      render(
        <Button iconOnly aria-label="Add">
          Add item
        </Button>,
      )
      expect(screen.getByRole('button', { name: 'Add' })).not.toHaveTextContent('Add item')
    })
  })

  it('merges custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Button ref={ref}>Ref Button</Button>)
    expect(ref).toHaveBeenCalled()
  })

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('accepts type attribute', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
