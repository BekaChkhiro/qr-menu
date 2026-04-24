import { describe, it, expect, vi } from 'vitest'
import { render, screen, createMockMenu } from '@/tests/utils'
import userEvent from '@testing-library/user-event'
import { MenuCard } from '../menu-card'

describe('MenuCard', () => {
  const defaultProps = {
    menu: createMockMenu(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTogglePublish: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('renders menu name', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText('Test Menu')).toBeInTheDocument()
    })

    it('renders public slug path in footer', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText('/m/test-menu')).toBeInTheDocument()
    })

    it('renders as an article with aria-label', () => {
      render(<MenuCard {...defaultProps} />)
      const article = screen.getByRole('article', { name: 'Test Menu' })
      expect(article).toBeInTheDocument()
    })

    it('renders the subtitle with category/item counts', () => {
      render(<MenuCard {...defaultProps} />)
      // With the global next-intl mock `t(key) => key`, we only verify the key
      // renders; real ICU interpolation is covered by the Playwright suite.
      expect(screen.getByText('subtitle')).toBeInTheDocument()
    })

    it('links the card to the menu detail page', () => {
      render(<MenuCard {...defaultProps} />)
      const cardLink = screen.getByTestId('menu-card-link')
      expect(cardLink).toHaveAttribute('href', '/admin/menus/menu-1')
    })
  })

  describe('status pill', () => {
    it('renders a draft pill when status is DRAFT', () => {
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('renders a published pill when status is PUBLISHED', () => {
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      expect(screen.getByText('Published')).toBeInTheDocument()
    })
  })

  describe('weekly views footer', () => {
    it('shows view count for published menus', () => {
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      // viewsCount = 100 from mock → shown as "100"
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('thisWeek')).toBeInTheDocument()
    })

    it('hides view count for drafts', () => {
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      expect(screen.queryByText('thisWeek')).not.toBeInTheDocument()
    })
  })

  describe('kebab menu actions', () => {
    it('opens the kebab menu when clicking the trigger', async () => {
      const user = userEvent.setup()
      render(<MenuCard {...defaultProps} />)

      const kebab = screen.getByRole('button', { name: /menuActions/i })
      await user.click(kebab)

      expect(screen.getByText('edit')).toBeInTheDocument()
      expect(screen.getByText('delete')).toBeInTheDocument()
    })

    it('calls onEdit when the Edit item is chosen', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      render(<MenuCard {...defaultProps} onEdit={onEdit} />)

      await user.click(screen.getByRole('button', { name: /menuActions/i }))
      await user.click(screen.getByText('edit'))

      expect(onEdit).toHaveBeenCalledWith(defaultProps.menu)
    })

    it('calls onDelete when the Delete item is chosen', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(<MenuCard {...defaultProps} onDelete={onDelete} />)

      await user.click(screen.getByRole('button', { name: /menuActions/i }))
      await user.click(screen.getByText('delete'))

      expect(onDelete).toHaveBeenCalledWith(defaultProps.menu)
    })

    it('calls onTogglePublish with publish for a draft menu', async () => {
      const user = userEvent.setup()
      const onTogglePublish = vi.fn()
      const menu = createMockMenu({ status: 'DRAFT' })
      render(
        <MenuCard
          {...defaultProps}
          menu={menu}
          onTogglePublish={onTogglePublish}
        />,
      )

      await user.click(screen.getByRole('button', { name: /menuActions/i }))
      await user.click(screen.getByText('publish'))

      expect(onTogglePublish).toHaveBeenCalledWith(menu)
    })

    it('calls onTogglePublish with unpublish for a published menu', async () => {
      const user = userEvent.setup()
      const onTogglePublish = vi.fn()
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(
        <MenuCard
          {...defaultProps}
          menu={menu}
          onTogglePublish={onTogglePublish}
        />,
      )

      await user.click(screen.getByRole('button', { name: /menuActions/i }))
      await user.click(screen.getByText('unpublish'))

      expect(onTogglePublish).toHaveBeenCalledWith(menu)
    })

    it('surfaces a View Menu entry for published menus', async () => {
      const user = userEvent.setup()
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} />)

      await user.click(screen.getByRole('button', { name: /menuActions/i }))
      expect(screen.getByText('viewMenu')).toBeInTheDocument()
    })

    it('omits the View Menu entry for draft menus', async () => {
      const user = userEvent.setup()
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} />)

      await user.click(screen.getByRole('button', { name: /menuActions/i }))
      expect(screen.queryByText('viewMenu')).not.toBeInTheDocument()
    })
  })
})
