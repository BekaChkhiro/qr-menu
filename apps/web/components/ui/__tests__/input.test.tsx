import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/tests/utils'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('accepts and displays user input', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello World')

    expect(input).toHaveValue('Hello World')
  })

  it('handles onChange events', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Input onChange={handleChange} placeholder="Input" />)

    await user.type(screen.getByPlaceholderText('Input'), 'test')
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', async () => {
    const user = userEvent.setup()
    render(<Input disabled placeholder="Disabled" />)

    const input = screen.getByPlaceholderText('Disabled')
    expect(input).toBeDisabled()

    await user.type(input, 'test')
    expect(input).toHaveValue('')
  })

  it('applies default classes', () => {
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border')
  })

  it('merges custom className', () => {
    render(<Input className="custom-input" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-input')
    expect(input).toHaveClass('rounded-md') // default class
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Input ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  describe('input types', () => {
    it('renders text type by default', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      // Text type is implicit when no type is specified
      expect(input).not.toHaveAttribute('type', 'email')
    })

    it('renders email type', () => {
      render(<Input type="email" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')
    })

    it('renders password type', () => {
      render(<Input type="password" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')
    })

    it('renders number type', () => {
      render(<Input type="number" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')
    })
  })

  it('supports value and controlled mode', () => {
    const { rerender } = render(<Input value="initial" readOnly data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveValue('initial')

    rerender(<Input value="updated" readOnly data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveValue('updated')
  })

  it('supports autoComplete attribute', () => {
    render(<Input autoComplete="email" data-testid="input" />)
    expect(screen.getByTestId('input')).toHaveAttribute('autocomplete', 'email')
  })

  it('supports required attribute', () => {
    render(<Input required data-testid="input" />)
    expect(screen.getByTestId('input')).toBeRequired()
  })

  it('supports min and max for number inputs', () => {
    render(<Input type="number" min={0} max={100} data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
  })
})
