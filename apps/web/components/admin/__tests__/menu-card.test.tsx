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

    it('renders menu slug', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText('/test-menu')).toBeInTheDocument()
    })

    it('renders menu description when provided', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText('A test menu description')).toBeInTheDocument()
    })

    it('renders as an article with aria-label', () => {
      render(<MenuCard {...defaultProps} />)
      const article = screen.getByRole('article', { name: 'Test Menu' })
      expect(article).toBeInTheDocument()
    })

    it('renders category count', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText(/3/)).toBeInTheDocument()
    })

    it('renders view count', () => {
      render(<MenuCard {...defaultProps} />)
      expect(screen.getByText(/100/)).toBeInTheDocument()
    })
  })

  describe('status badge', () => {
    it('displays draft badge when status is DRAFT', () => {
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      // Mock returns just the key, so tStatus('draft') returns 'draft'
      expect(screen.getByText('draft')).toBeInTheDocument()
    })

    it('displays published badge when status is PUBLISHED', () => {
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      expect(screen.getByText('published')).toBeInTheDocument()
    })
  })

  describe('dropdown menu actions', () => {
    it('opens dropdown when clicking menu button', async () => {
      const user = userEvent.setup()
      render(<MenuCard {...defaultProps} />)

      // Find and click the dropdown trigger (the button with MoreHorizontal icon)
      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      // Check dropdown items are visible
      expect(screen.getByText('edit')).toBeInTheDocument()
      expect(screen.getByText('delete')).toBeInTheDocument()
    })

    it('calls onEdit when edit is clicked', async () => {
      const user = userEvent.setup()
      const onEdit = vi.fn()
      render(<MenuCard {...defaultProps} onEdit={onEdit} />)

      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      const editButton = screen.getByText('edit')
      await user.click(editButton)

      expect(onEdit).toHaveBeenCalledWith(defaultProps.menu)
    })

    it('calls onDelete when delete is clicked', async () => {
      const user = userEvent.setup()
      const onDelete = vi.fn()
      render(<MenuCard {...defaultProps} onDelete={onDelete} />)

      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      const deleteButton = screen.getByText('delete')
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith(defaultProps.menu)
    })

    it('calls onTogglePublish when publish is clicked (draft menu)', async () => {
      const user = userEvent.setup()
      const onTogglePublish = vi.fn()
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} onTogglePublish={onTogglePublish} />)

      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      const publishButton = screen.getByText('publish')
      await user.click(publishButton)

      expect(onTogglePublish).toHaveBeenCalledWith(menu)
    })

    it('calls onTogglePublish when unpublish is clicked (published menu)', async () => {
      const user = userEvent.setup()
      const onTogglePublish = vi.fn()
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} onTogglePublish={onTogglePublish} />)

      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      const unpublishButton = screen.getByText('unpublish')
      await user.click(unpublishButton)

      expect(onTogglePublish).toHaveBeenCalledWith(menu)
    })
  })

  describe('manage button', () => {
    it('renders manage button with correct link', () => {
      render(<MenuCard {...defaultProps} />)
      const manageLink = screen.getByRole('link', { name: /manage/i })
      expect(manageLink).toHaveAttribute('href', '/admin/menus/menu-1')
    })
  })

  describe('QR code button', () => {
    it('renders QR code button when menu is published', () => {
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      const qrLink = screen.getByRole('link', { name: /downloadQR/i })
      expect(qrLink).toHaveAttribute('href', '/api/qr/menu-1')
    })

    it('does not render QR code button when menu is draft', () => {
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} />)
      expect(screen.queryByRole('link', { name: /downloadQR/i })).not.toBeInTheDocument()
    })
  })

  describe('view menu link', () => {
    it('shows view menu option in dropdown when published', async () => {
      const user = userEvent.setup()
      const menu = createMockMenu({ status: 'PUBLISHED' })
      render(<MenuCard {...defaultProps} menu={menu} />)

      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      const viewLink = screen.getByText('viewMenu')
      expect(viewLink).toBeInTheDocument()
    })

    it('does not show view menu option when draft', async () => {
      const user = userEvent.setup()
      const menu = createMockMenu({ status: 'DRAFT' })
      render(<MenuCard {...defaultProps} menu={menu} />)

      const menuButton = screen.getByRole('button', { name: /menuActions/i })
      await user.click(menuButton)

      expect(screen.queryByText('viewMenu')).not.toBeInTheDocument()
    })
  })
})
