// Seed a fully-populated demo menu via Prisma directly.
// User: playwright-test@local.dev (must exist).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_EMAIL = 'playwright-test@local.dev';

const IMG = {
  logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80',
  // Food images
  khinkali: 'https://images.unsplash.com/photo-1625938145312-c223eb35b9b8?w=600&q=80',
  chakhokhbili: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
  mwvadi: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
  ojakhuri: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80',
  caesar: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80',
  veggie: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
  // Drinks
  lemonade: 'https://images.unsplash.com/photo-1523371683702-1e31c7fbf68b?w=600&q=80',
  kompot: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=600&q=80',
  cola: 'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=600&q=80',
  espresso: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80',
  cappuccino: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
  // Desserts
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
  icecream: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&q=80',
  // Promotions
  promo1: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80',
  promo2: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&q=80',
  promo3: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=80',
  // Category icons (small)
  iconFood: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&q=80',
  iconDrink: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=100&q=80',
};

async function main() {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) throw new Error(`User ${USER_EMAIL} not found`);

  // ── Clean up any prior demo menu ──
  const existing = await prisma.menu.findUnique({ where: { slug: 'demo-cafe' } });
  if (existing) {
    await prisma.menu.delete({ where: { id: existing.id } });
    console.log(`🗑️  removed prior demo menu (${existing.id})`);
  }

  // ── Create Menu with full header info + settings ──
  const menu = await prisma.menu.create({
    data: {
      userId: user.id,
      name: 'Demo Georgian Cafe',
      slug: 'demo-cafe',
      description: 'სრულად დაფარული სატესტო მენიუ — ყველა ფუნქციონალი',
      status: 'PUBLISHED',
      publishedAt: new Date(),

      logoUrl: IMG.logo,
      primaryColor: '#1e293b',
      accentColor: '#f59e0b',
      currencySymbol: '₾',

      headingFont: 'Playfair Display',
      bodyFont: 'Lora',

      enabledLanguages: ['KA', 'EN', 'RU'],

      allergenDisplay: 'ICON', // try icon mode
      caloriesDisplay: 'FLIP_REVEAL', // eye-tap
      showNutrition: true,
      showDiscount: true,

      splitByType: true, // Foods/Drinks tabs visible
      menuLayout: 'LINEAR', // start linear; can toggle via UI
      productCardStyle: 'ELEVATED',
      productTouchEffect: 'SCALE',

      address: 'რუსთაველის გამზირი 12, თბილისი, 0108',
      phone: '+995 555 12 34 56',
      wifiSsid: 'CafeGuest',
      wifiPassword: 'welcome2024',
      wcDirection: 'ტუალეტი მდებარეობს პირველ სართულზე, მარცხნივ კორიდორის ბოლოს.\nგასაღები ბარისტასთან მოითხოვეთ.',
      wcImageUrl: IMG.promo1,
      locationLat: 41.6997,
      locationLng: 44.7979,

      qrStyle: 'ROUNDED',
      qrForegroundColor: '#1e293b',
      qrBackgroundColor: '#fff7ed',
      qrLogoUrl: IMG.logo,
      qrTemplate: 'sunset',
    },
  });
  console.log(`✅ menu: ${menu.name} (${menu.id})`);

  // ── Categories ──
  const cats = {};

  cats.hotFood = await prisma.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'ცხელი საჭმელი',
      nameEn: 'Hot Foods',
      nameRu: 'Горячие блюда',
      descriptionKa: 'ქართული ტრადიციული ცხელი კერძები',
      descriptionEn: 'Traditional Georgian hot dishes',
      type: 'FOOD',
      brandLabel: 'House Kitchen',
      iconUrl: IMG.iconFood,
      sortOrder: 0,
    },
  });
  cats.salads = await prisma.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'სალათი',
      nameEn: 'Salads',
      nameRu: 'Салаты',
      type: 'FOOD',
      sortOrder: 1,
    },
  });
  cats.coldDrinks = await prisma.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'ცივი სასმელი',
      nameEn: 'Cold Drinks',
      nameRu: 'Холодные напитки',
      type: 'DRINK',
      iconUrl: IMG.iconDrink,
      sortOrder: 2,
    },
  });
  cats.hotDrinks = await prisma.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'ცხელი სასმელი',
      nameEn: 'Hot Drinks',
      nameRu: 'Горячие напитки',
      type: 'DRINK',
      brandLabel: 'Espresso Lab',
      sortOrder: 3,
    },
  });
  cats.desserts = await prisma.category.create({
    data: {
      menuId: menu.id,
      nameKa: 'დესერტი',
      nameEn: 'Desserts',
      nameRu: 'Десерты',
      type: 'OTHER',
      sortOrder: 4,
    },
  });
  console.log(`✅ 5 categories created`);

  // ── Products ──
  // Helper
  const P = (data) => prisma.product.create({ data });

  // 1. Hot Foods
  await P({
    categoryId: cats.hotFood.id,
    nameKa: 'ხინკალი (5 ცალი)',
    nameEn: 'Khinkali (5 pcs)',
    nameRu: 'Хинкали (5 шт)',
    descriptionKa: 'კლასიკური ქართული ხინკალი ხორცით, ხელით გაკეთებული',
    descriptionEn: 'Classic Georgian dumplings with meat, hand-made',
    descriptionRu: 'Классические грузинские хинкали с мясом, ручной работы',
    price: 18.5,
    oldPrice: 22.0,
    imageUrl: IMG.khinkali,
    ribbons: ['POPULAR', 'CHEF_CHOICE'],
    allergens: ['GLUTEN', 'DAIRY'],
    calories: 320,
    protein: 15.5,
    fats: 10.2,
    carbs: 40.0,
    fiber: 3.1,
    sortOrder: 0,
  });

  await P({
    categoryId: cats.hotFood.id,
    nameKa: 'ჩახოხბილი',
    nameEn: 'Chakhokhbili',
    nameRu: 'Чахохбили',
    descriptionKa: 'მოშუშული ქათამი პომიდვრის სოუსში',
    descriptionEn: 'Braised chicken in tomato sauce with herbs',
    price: 28.0,
    imageUrl: IMG.chakhokhbili,
    ribbons: ['DAILY_DISH'],
    allergens: ['CELERY'],
    calories: 450,
    protein: 32,
    fats: 18,
    carbs: 12,
    sortOrder: 1,
  });

  await P({
    categoryId: cats.hotFood.id,
    nameKa: 'მწვადი',
    nameEn: 'Mtsvadi (BBQ)',
    nameRu: 'Шашлык',
    descriptionKa: 'ცხარე ცხვრის მწვადი ხახვით და ლიმონით',
    descriptionEn: 'Spicy lamb skewers with onions and lemon',
    price: 32.0,
    imageUrl: IMG.mwvadi,
    ribbons: ['POPULAR', 'SPICY'],
    calories: 520,
    protein: 40,
    fats: 35,
    carbs: 5,
    sortOrder: 2,
  });

  await P({
    categoryId: cats.hotFood.id,
    nameKa: 'ოჯახური',
    nameEn: 'Ojakhuri',
    price: 35.0,
    oldPrice: 40.0,
    imageUrl: IMG.ojakhuri,
    ribbons: ['CHEF_CHOICE', 'NEW'],
    allergens: ['PORK'],
    calories: 600,
    protein: 35,
    fats: 40,
    carbs: 25,
    sortOrder: 3,
  });

  // 2. Salads
  await P({
    categoryId: cats.salads.id,
    nameKa: 'ცეზარ სალათი',
    nameEn: 'Caesar Salad',
    nameRu: 'Салат Цезарь',
    descriptionKa: 'მწვანე სალათი, ქათამი, პარმეზანი და კრუტონები',
    price: 22.0,
    imageUrl: IMG.caesar,
    allergens: ['DAIRY', 'EGGS', 'GLUTEN', 'FISH'],
    calories: 280,
    protein: 22,
    fats: 16,
    carbs: 10,
    sortOrder: 0,
  });

  await P({
    categoryId: cats.salads.id,
    nameKa: 'ვეგანური სალათი',
    nameEn: 'Vegan Garden Salad',
    nameRu: 'Веганский салат',
    descriptionKa: 'სეზონური ბოსტნეული, ქინძი, ლიმონის მწნილი',
    price: 18.0,
    imageUrl: IMG.veggie,
    ribbons: ['NEW'],
    isVegan: true,
    isVegetarian: true,
    calories: 150,
    protein: 5,
    fats: 8,
    carbs: 18,
    fiber: 6,
    sortOrder: 1,
  });

  // 3. Cold Drinks
  await P({
    categoryId: cats.coldDrinks.id,
    nameKa: 'ლიმონათი',
    nameEn: 'Lemonade',
    nameRu: 'Лимонад',
    price: 8.0,
    imageUrl: IMG.lemonade,
    ribbons: ['NEW', 'POPULAR'],
    isVegan: true,
    isVegetarian: true,
    calories: 120,
    sortOrder: 0,
  });

  await P({
    categoryId: cats.coldDrinks.id,
    nameKa: 'კომპოტი',
    nameEn: 'Kompot',
    price: 6.0,
    imageUrl: IMG.kompot,
    isVegan: true,
    isVegetarian: true,
    calories: 90,
    sortOrder: 1,
  });

  await P({
    categoryId: cats.coldDrinks.id,
    nameKa: 'Coca-Cola (0.5L)',
    price: 5.0,
    imageUrl: IMG.cola,
    calories: 210,
    carbs: 53,
    sortOrder: 2,
  });

  // 4. Hot Drinks (with variations)
  await P({
    categoryId: cats.hotDrinks.id,
    nameKa: 'ესპრესო',
    nameEn: 'Espresso',
    price: 6.0,
    imageUrl: IMG.espresso,
    ribbons: ['POPULAR', 'CHEF_CHOICE'],
    isVegan: true,
    isVegetarian: true,
    calories: 5,
    sortOrder: 0,
  });

  await P({
    categoryId: cats.hotDrinks.id,
    nameKa: 'კაპუჩინო',
    nameEn: 'Cappuccino',
    nameRu: 'Капучино',
    descriptionKa: 'ორმაგი ესპრესო, აორთქლებული რძე, რძის ქაფი',
    price: 9.0,
    imageUrl: IMG.cappuccino,
    allergens: ['DAIRY'],
    isVegetarian: true,
    calories: 120,
    sortOrder: 1,
    variations: {
      create: [
        { nameKa: 'პატარა (200ml)', nameEn: 'Small', price: 9.0, sortOrder: 0 },
        { nameKa: 'საშუალო (300ml)', nameEn: 'Medium', price: 11.0, sortOrder: 1 },
        { nameKa: 'დიდი (400ml)', nameEn: 'Large', price: 14.0, sortOrder: 2 },
      ],
    },
  });

  await P({
    categoryId: cats.hotDrinks.id,
    nameKa: 'ჩაი',
    nameEn: 'Tea',
    nameRu: 'Чай',
    price: 4.0,
    imageUrl: IMG.tea,
    isVegan: true,
    isVegetarian: true,
    calories: 0,
    sortOrder: 2,
    variations: {
      create: [
        { nameKa: 'შავი', nameEn: 'Black', price: 4.0, sortOrder: 0 },
        { nameKa: 'მწვანე', nameEn: 'Green', price: 4.5, sortOrder: 1 },
        { nameKa: 'ბალახეული', nameEn: 'Herbal', price: 5.0, sortOrder: 2 },
      ],
    },
  });

  // 5. Desserts
  await P({
    categoryId: cats.desserts.id,
    nameKa: 'ნამცხვარი (მედოვიკი)',
    nameEn: 'Medovik Cake',
    nameRu: 'Медовик',
    descriptionKa: 'ფენოვანი თაფლიანი ნამცხვარი',
    price: 12.0,
    oldPrice: 15.0,
    imageUrl: IMG.cake,
    ribbons: ['DAILY_DISH', 'CHEF_CHOICE'],
    allergens: ['GLUTEN', 'DAIRY', 'EGGS', 'NUTS'],
    isVegetarian: true,
    calories: 380,
    protein: 5,
    fats: 20,
    carbs: 45,
    sortOrder: 0,
  });

  await P({
    categoryId: cats.desserts.id,
    nameKa: 'ნაყინი',
    nameEn: 'Ice Cream',
    price: 8.0,
    imageUrl: IMG.icecream,
    allergens: ['DAIRY', 'EGGS'],
    isVegetarian: true,
    calories: 250,
    protein: 4,
    fats: 14,
    carbs: 28,
    sortOrder: 1,
  });

  console.log('✅ 13 products created');

  // ── Promotions ──
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ზაფხულის სპეციალური',
      titleEn: 'Summer Special',
      titleRu: 'Летний специальный',
      imageUrl: IMG.promo1,
      startDate: now,
      endDate: monthLater,
      isActive: true,
      sortOrder: 0,
    },
  });
  await prisma.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ყავა + კრუასანი',
      titleEn: 'Coffee + Croissant',
      imageUrl: IMG.promo2,
      startDate: now,
      endDate: weekLater,
      isActive: true,
      sortOrder: 1,
    },
  });
  await prisma.promotion.create({
    data: {
      menuId: menu.id,
      titleKa: 'ბედნიერი საათი',
      titleEn: 'Happy Hour',
      imageUrl: IMG.promo3,
      startDate: now,
      endDate: monthLater,
      isActive: true,
      sortOrder: 2,
    },
  });
  console.log('✅ 3 promotions created');

  console.log(`\n🎉 Demo menu ready: http://localhost:3000/m/${menu.slug}`);
  console.log(`📋 Admin: http://localhost:3000/admin/menus/${menu.id}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
