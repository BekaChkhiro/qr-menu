# Digital Menu - User Guide for Cafe Owners

> A step-by-step guide to creating and managing your digital menu

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Your Account](#creating-your-account)
3. [Creating Your First Menu](#creating-your-first-menu)
4. [Adding Categories](#adding-categories)
5. [Adding Products](#adding-products)
6. [Product Variations](#product-variations)
7. [Uploading Images](#uploading-images)
8. [Creating Promotions](#creating-promotions)
9. [Publishing Your Menu](#publishing-your-menu)
10. [Generating QR Codes](#generating-qr-codes)
11. [Viewing Analytics](#viewing-analytics)
12. [Managing Multiple Menus](#managing-multiple-menus)
13. [Account Settings](#account-settings)
14. [Pricing Plans](#pricing-plans)
15. [FAQ](#faq)

---

## Getting Started

Digital Menu allows you to create beautiful, mobile-friendly digital menus for your cafe or restaurant. Customers can scan a QR code with their smartphone to view your menu instantly.

### What You'll Need

- An email address or Google account
- Your cafe/restaurant name
- Menu items with prices
- (Optional) Product images

---

## Creating Your Account

### Option 1: Email Registration

1. Go to `/register`
2. Enter your email address
3. Create a password (at least 8 characters)
4. Enter your business name
5. Click **Create Account**

### Option 2: Google Sign-In

1. Go to `/login`
2. Click **Continue with Google**
3. Select your Google account
4. Enter your business name (first time only)

After registration, you'll be taken to your dashboard.

---

## Creating Your First Menu

### Step 1: Access the Dashboard

After logging in, you'll see your admin dashboard at `/admin/dashboard`.

### Step 2: Create a New Menu

1. Click **Create Menu** button
2. Enter the menu details:
   - **Menu Name**: e.g., "Main Menu", "Breakfast Menu", "Bar Menu"
   - **Slug**: A URL-friendly name (auto-generated from menu name)
   - **Description**: Optional description of your menu
3. Click **Create**

Your menu is created in **Draft** mode. It won't be visible to customers until you publish it.

---

## Adding Categories

Categories help organize your menu items (e.g., "Hot Drinks", "Cold Drinks", "Desserts").

### Creating a Category

1. Open your menu
2. Click **Add Category**
3. Enter category names:
   - **Georgian** (required): e.g., "ცხელი სასმელები"
   - **English** (optional): e.g., "Hot Drinks"
   - **Russian** (optional): e.g., "Горячие напитки"
4. Click **Save**

### Reordering Categories

1. Hover over a category
2. Click and drag the handle (⋮⋮) on the left
3. Drop the category in the desired position
4. Order is automatically saved

### Plan Limits

- **Free Plan**: Up to 3 categories per menu
- **Starter/Pro Plans**: Unlimited categories

---

## Adding Products

### Creating a Product

1. Open a category
2. Click **Add Product**
3. Fill in the details:
   - **Name (Georgian)**: Required product name
   - **Name (English/Russian)**: Optional translations
   - **Description**: Product description
   - **Price**: Price in GEL (₾)
   - **Image**: Upload a product photo
4. Click **Save**

### Product Fields

| Field | Required | Description |
|-------|----------|-------------|
| Name (Georgian) | Yes | Primary product name |
| Name (English) | No | English translation |
| Name (Russian) | No | Russian translation |
| Description | No | Product description |
| Price | Yes | Price in GEL |
| Image | No | Product photo |
| Available | Yes | Toggle product visibility |

### Reordering Products

1. Hover over a product
2. Click and drag the handle (⋮⋮)
3. Drop in the desired position

### Plan Limits

- **Free Plan**: Up to 15 products per menu
- **Starter/Pro Plans**: Unlimited products

---

## Product Variations

Variations let you offer different sizes or options (e.g., Small/Medium/Large).

### Adding Variations

1. Open a product for editing
2. Scroll to **Variations** section
3. Click **Add Variation**
4. Enter:
   - **Variation Name**: e.g., "Small", "Medium", "Large"
   - **Price**: Price for this variation
5. Click **Save**

### Example: Coffee Sizes

| Variation | Price |
|-----------|-------|
| Small (200ml) | 3.00₾ |
| Medium (350ml) | 4.00₾ |
| Large (500ml) | 5.00₾ |

When you add variations, customers will see all options with prices on the public menu.

---

## Uploading Images

Good product images significantly improve customer engagement.

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Image Guidelines

- **Maximum file size**: 5 MB
- **Recommended dimensions**: 400x400 pixels or larger
- **Square format** works best
- Images are automatically optimized for fast loading

### How to Upload

1. Click the image upload area on a product
2. Select an image from your device
3. Wait for upload to complete
4. Image appears on the product card

### Tips for Good Photos

- Use natural lighting
- Shoot from above or at a 45° angle
- Include the plate/cup in frame
- Keep backgrounds simple
- Make sure food looks fresh and appetizing

---

## Creating Promotions

Promotions are highlighted on your public menu to attract customer attention.

### Creating a Promotion

1. Go to **Promotions** section in your menu
2. Click **Add Promotion**
3. Fill in:
   - **Title**: e.g., "Happy Hour!"
   - **Description**: Details about the promotion
   - **Start Date**: When the promotion begins
   - **End Date**: When the promotion ends
   - **Image** (optional): Promotional banner
4. Click **Save**

### Promotion Best Practices

- Keep titles short and catchy
- Include clear details (discount %, times, conditions)
- Set appropriate date ranges
- Use eye-catching images

### Plan Requirements

- Promotions require **Starter** plan or higher

---

## Publishing Your Menu

### Draft vs Published

| Status | Description |
|--------|-------------|
| **Draft** | Menu is not visible to customers |
| **Published** | Menu is live and accessible via QR code |

### How to Publish

1. Open your menu
2. Review all categories and products
3. Click the **Publish** button
4. Confirm publication

Your menu is now live at `/m/your-menu-slug`

### Unpublishing

1. Click **Unpublish** button
2. Menu returns to draft status
3. QR codes will show "Menu not found"

---

## Generating QR Codes

QR codes link directly to your public menu.

### Generating a QR Code

1. Open your published menu
2. Click **QR Code** button
3. Select size:
   - **Small** (200px) - For small prints
   - **Medium** (400px) - Standard table tents
   - **Large** (800px) - Large posters
4. Click **Download**

### QR Code Sizes

| Size | Use Case |
|------|----------|
| Small | Table tents, receipts |
| Medium | Table stands, window stickers |
| Large | Posters, entrance signs |

### Printing Tips

- Print on high-quality paper
- Test QR code before mass printing
- Ensure good contrast (black on white)
- Add your logo or cafe name nearby
- Consider laminating for durability

### Placement Ideas

- Table tents
- Wall posters
- Window stickers
- Coasters
- Receipts
- Business cards

---

## Viewing Analytics

Track how customers interact with your menu.

### Available Metrics

- **Total Views**: How many times your menu was viewed
- **Views by Date**: Daily view trends
- **Views by Language**: Which languages customers prefer

### Accessing Analytics

1. Go to **Analytics** in your menu
2. Select date range (Last 7 days, 30 days, etc.)
3. View charts and statistics

### Using Analytics Data

- Identify peak hours/days
- Understand customer language preferences
- Track promotion effectiveness
- Plan menu updates

### Plan Requirements

- Full analytics require **Pro** plan

---

## Managing Multiple Menus

You can create separate menus for different purposes.

### Common Use Cases

| Menu | Purpose |
|------|---------|
| Main Menu | Primary food and drinks |
| Breakfast Menu | Morning offerings |
| Bar Menu | Alcoholic beverages |
| Seasonal Menu | Limited-time items |
| Kids Menu | Children's options |

### Switching Between Menus

1. Go to **My Menus** on dashboard
2. Click on the menu you want to edit

### Plan Limits

| Plan | Maximum Menus |
|------|---------------|
| Free | 1 |
| Starter | 3 |
| Pro | Unlimited |

---

## Account Settings

### Updating Profile

1. Click your profile icon
2. Select **Settings**
3. Update:
   - Business name
   - Email address
   - Password
4. Click **Save Changes**

### Changing Password

1. Go to **Settings**
2. Click **Change Password**
3. Enter current password
4. Enter new password (twice)
5. Click **Update Password**

### Deleting Account

Contact support to delete your account. This action is permanent.

---

## Pricing Plans

### Free Plan (0₾/month)

- 1 menu
- 3 categories per menu
- 15 products per menu
- Basic QR code
- Basic analytics

### Starter Plan (29₾/month)

- 3 menus
- Unlimited categories
- Unlimited products
- Promotions
- Custom branding

### Pro Plan (59₾/month)

- Unlimited menus
- All Starter features
- Multi-language support
- Allergen information
- Advanced analytics
- QR code with logo

### Upgrading Your Plan

1. Go to **Settings** → **Billing**
2. Click **Upgrade**
3. Select desired plan
4. Complete payment

---

## FAQ

### General Questions

**Q: Do customers need an app to view my menu?**
A: No, customers simply scan the QR code with their smartphone camera. The menu opens in their web browser.

**Q: Can I update my menu in real-time?**
A: Yes, changes are instant. As soon as you save, customers will see the updated menu.

**Q: Does the menu work offline?**
A: Customers need an internet connection to view the menu.

### Menu Questions

**Q: How do I change the order of items?**
A: Click and drag items using the handle on the left side.

**Q: Can I hide a product temporarily?**
A: Yes, toggle the "Available" switch off. The product won't show on the public menu.

**Q: What languages are supported?**
A: Georgian, English, and Russian. Customers can switch languages on the public menu.

### Technical Questions

**Q: What image formats are supported?**
A: JPEG, PNG, and WebP. Maximum file size is 5MB.

**Q: Can I use my own domain?**
A: Custom domains are available on Pro plan. Contact support for setup.

**Q: Is my data secure?**
A: Yes, we use industry-standard encryption and security practices.

### Billing Questions

**Q: Can I cancel my subscription?**
A: Yes, you can cancel anytime from Settings → Billing. You'll keep access until the end of your billing period.

**Q: Do you offer refunds?**
A: Contact support within 7 days of payment for refund requests.

**Q: What payment methods are accepted?**
A: Credit/debit cards and Georgian bank cards.

---

## Getting Help

### Contact Support

- **Email**: support@digitalmenu.ge
- **Response time**: Within 24 hours

### Common Issues

#### "My QR code doesn't work"
- Ensure menu is published
- Check that the menu slug matches
- Try generating a new QR code

#### "Images aren't uploading"
- Check file size (max 5MB)
- Try a different format (JPEG/PNG)
- Check your internet connection

#### "I can't add more products"
- You may have reached your plan limit
- Upgrade to Starter or Pro for unlimited products

---

## Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save changes | Ctrl/Cmd + S |
| Cancel/Close | Esc |

### Menu Status Icons

| Icon | Meaning |
|------|---------|
| 📝 Draft | Menu not published |
| ✅ Published | Menu is live |
| ⚠️ Warning | Issues need attention |

### Product Status

| Status | Visibility |
|--------|------------|
| Available | Shown on public menu |
| Unavailable | Hidden from public menu |

---

**Need more help?** Contact us at support@digitalmenu.ge

**Last Updated**: 2026-01-30
