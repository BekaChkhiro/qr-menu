import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/tests/utils'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>)
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<Card data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm')
  })

  it('merges custom className', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
    expect(card).toHaveClass('rounded-lg') // default class still applied
  })

  it('forwards ref correctly', () => {
    const ref = vi.fn()
    render(<Card ref={ref}>Content</Card>)
    expect(ref).toHaveBeenCalled()
  })
})

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(<CardHeader>Header Content</CardHeader>)
    expect(screen.getByText('Header Content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('merges custom className', () => {
    render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('custom-header')
  })
})

describe('CardTitle', () => {
  it('renders children correctly', () => {
    render(<CardTitle>Title Content</CardTitle>)
    expect(screen.getByText('Title Content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>)
    const title = screen.getByTestId('title')
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
  })

  it('merges custom className', () => {
    render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>)
    const title = screen.getByTestId('title')
    expect(title).toHaveClass('custom-title')
  })
})

describe('CardDescription', () => {
  it('renders children correctly', () => {
    render(<CardDescription>Description Content</CardDescription>)
    expect(screen.getByText('Description Content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<CardDescription data-testid="description">Description</CardDescription>)
    const description = screen.getByTestId('description')
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })
})

describe('CardContent', () => {
  it('renders children correctly', () => {
    render(<CardContent>Content</CardContent>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<CardContent data-testid="content">Content</CardContent>)
    const content = screen.getByTestId('content')
    expect(content).toHaveClass('p-6', 'pt-0')
  })
})

describe('CardFooter', () => {
  it('renders children correctly', () => {
    render(<CardFooter>Footer Content</CardFooter>)
    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })
})

describe('Card composition', () => {
  it('renders a complete card with all subcomponents', () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card content goes here</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
    expect(screen.getByText('Card content goes here')).toBeInTheDocument()
    expect(screen.getByText('Card Footer')).toBeInTheDocument()
  })
})
