import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/tests/utils'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
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

  it('renders a container with Section H token classes', () => {
    const { container } = render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input.tagName).toBe('INPUT')
    // Section H input container is a <div> wrapping the <input>
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('rounded-[7px]', 'border', 'h-[34px]')
  })

  it('merges custom className onto the wrapper', () => {
    const { container } = render(<Input className="custom-input" data-testid="input" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('custom-input')
    expect(wrapper).toHaveClass('rounded-[7px]')
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
      // text type is the explicit default set in component
      expect(input).toHaveAttribute('type', 'text')
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

  describe('Section H extensions', () => {
    it('renders prefix text', () => {
      render(<Input prefix="cafelinville.ge/" defaultValue="main" />)
      expect(screen.getByText('cafelinville.ge/')).toBeInTheDocument()
    })

    it('renders suffix text (e.g. currency)', () => {
      render(<Input suffix="₾" defaultValue="14" />)
      expect(screen.getByText('₾')).toBeInTheDocument()
    })

    it('renders a leading icon', () => {
      const { container } = render(<Input icon={Search} placeholder="Search" />)
      expect(container.querySelector('svg[aria-hidden="true"]')).toBeTruthy()
    })

    it('marks input as aria-invalid when error=true', () => {
      render(<Input error data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true')
    })

    it('applies error border class on the wrapper when error=true', () => {
      const { container } = render(<Input error />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('border-danger')
    })

    it('clear button fires onClear', async () => {
      const user = userEvent.setup()
      const handleClear = vi.fn()
      render(<Input clearable onClear={handleClear} value="hello" readOnly />)
      const clearBtn = screen.getByRole('button', { name: /clear/i })
      await user.click(clearBtn)
      expect(handleClear).toHaveBeenCalled()
    })

    it('does not render clear button when value is empty', () => {
      render(<Input clearable value="" readOnly />)
      expect(screen.queryByRole('button', { name: /clear/i })).toBeNull()
    })

    it('size variants apply the correct height', () => {
      const { container, rerender } = render(<Input size="sm" data-testid="input" />)
      let wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('h-[28px]')

      rerender(<Input size="lg" data-testid="input" />)
      wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('h-[40px]')
    })
  })
})
