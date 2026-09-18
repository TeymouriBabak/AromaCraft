import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive seed script for AromaCraft dashboard testing.
 * Creates: 3 users, 18+ products across 4+ brands, 30+ orders, 5+ refund requests,
 * 10+ reviews, and content entries (FAQ, homepage sections, banners, Our Story).
 *
 * Usage:
 *   NODE_ENV=development npx ts-node --project tsconfig.json prisma/seed-comprehensive.ts
 */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// TEST USER CREDENTIALS
// ============================================================================

const TEST_USERS = [
  {
    id: 'user-manager-001',
    email: 'manager@aromacraft.test',
    username: 'Manager_Aroma',
    password: 'ManagerPass123!',
    role: 'MANAGER' as const,
    name: 'Sarah Manager',
  },
  {
    id: 'user-staff-001',
    email: 'staff@aromacraft.test',
    username: 'Staff_Aroma',
    password: 'StaffPass123!',
    role: 'ADMIN' as const,
    name: 'Alex Staff',
  },
  {
    id: 'user-customer-001',
    email: 'customer@aromacraft.test',
    username: 'Customer_Aroma',
    password: 'CustomerPass123!',
    role: 'CUSTOMER' as const,
    name: 'Jordan Customer',
  },
  {
    id: 'user-customer-002',
    email: 'alice@aromacraft.test',
    username: 'alice_coffee',
    password: 'AlicePass123!',
    role: 'CUSTOMER' as const,
    name: 'Alice Brown',
  },
  {
    id: 'user-customer-003',
    email: 'bob@aromacraft.test',
    username: 'bob_brewer',
    password: 'BobPass123!',
    role: 'CUSTOMER' as const,
    name: 'Bob Smith',
  },
];

// ============================================================================
// PRODUCTS BY BRAND
// ============================================================================

const PRODUCTS = [
  // Starbucks (5 products)
  {
    id: 101,
    name: 'Pike Place Roast',
    brand: 'Starbucks',
    price: 12.99,
    rating: 4.2,
    roast: 'MEDIUM',
    inventory: 50,
  },
  {
    id: 102,
    name: 'Espresso Roast',
    brand: 'Starbucks',
    price: 13.99,
    rating: 4.4,
    roast: 'DARK',
    inventory: 8, // Low stock
  },
  {
    id: 103,
    name: 'Blonde Roast',
    brand: 'Starbucks',
    price: 12.99,
    rating: 3.9,
    roast: 'LIGHT',
    inventory: 35,
  },
  {
    id: 104,
    name: 'Veranda Blend',
    brand: 'Starbucks',
    price: 11.99,
    rating: 3.8,
    roast: 'LIGHT',
    inventory: 0, // Out of stock
  },
  {
    id: 105,
    name: 'French Roast',
    brand: 'Starbucks',
    price: 13.49,
    rating: 4.3,
    roast: 'DARK',
    inventory: 42,
  },

  // Lavazza (5 products)
  {
    id: 201,
    name: 'Qualita Rossa',
    brand: 'Lavazza',
    price: 14.99,
    rating: 4.5,
    roast: 'MEDIUM',
    inventory: 60,
  },
  {
    id: 202,
    name: 'Crema e Gusto',
    brand: 'Lavazza',
    price: 16.99,
    rating: 4.6,
    roast: 'DARK',
    inventory: 3, // Low stock
  },
  {
    id: 203,
    name: 'Oro Mountain Grown',
    brand: 'Lavazza',
    price: 15.99,
    rating: 4.4,
    roast: 'MEDIUM',
    inventory: 28,
  },
  {
    id: 204,
    name: 'Pienaroma',
    brand: 'Lavazza',
    price: 13.49,
    rating: 4.2,
    roast: 'MEDIUM',
    inventory: 45,
  },
  {
    id: 205,
    name: 'Barista Perfetto',
    brand: 'Lavazza',
    price: 17.99,
    rating: 4.7,
    roast: 'DARK',
    inventory: 22,
  },

  // Illy (4 products)
  {
    id: 301,
    name: 'Classic Roast',
    brand: 'Illy',
    price: 15.99,
    rating: 4.5,
    roast: 'MEDIUM',
    inventory: 38,
  },
  {
    id: 302,
    name: 'Intenso',
    brand: 'Illy',
    price: 16.99,
    rating: 4.6,
    roast: 'DARK',
    inventory: 5, // Low stock
  },
  {
    id: 303,
    name: 'Mild Roast',
    brand: 'Illy',
    price: 15.49,
    rating: 4.3,
    roast: 'LIGHT',
    inventory: 32,
  },
  {
    id: 304,
    name: 'Single Origin Ethiopia',
    brand: 'Illy',
    price: 18.99,
    rating: 4.7,
    roast: 'MEDIUM',
    inventory: 15,
  },

  // Peet's (4 products)
  {
    id: 401,
    name: 'Major Dickason Blend',
    brand: "Peet's",
    price: 13.99,
    rating: 4.4,
    roast: 'MEDIUM',
    inventory: 44,
  },
  {
    id: 402,
    name: 'French Roast',
    brand: "Peet's",
    price: 14.49,
    rating: 4.5,
    roast: 'DARK',
    inventory: 2, // Low stock
  },
  {
    id: 403,
    name: 'Decaffeinated Major Dickason',
    brand: "Peet's",
    price: 14.99,
    rating: 4.2,
    roast: 'MEDIUM',
    inventory: 18,
  },
  {
    id: 404,
    name: 'Sumatra',
    brand: "Peet's",
    price: 14.99,
    rating: 4.6,
    roast: 'DARK',
    inventory: 30,
  },
];

// ============================================================================
// ORDER STATUSES AND REFUNDS
// ============================================================================

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

const REFUND_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED'] as const;

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function clearDatabase() {
  console.log('\n[SEED] Clearing database...');
  await prisma.wishlistItem.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userActivity.deleteMany();
  await prisma.user.deleteMany();
  await prisma.faqEntry.deleteMany();
  await prisma.promotionalBanner.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.ourStory.deleteMany();
  await prisma.shopFilter.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.product.deleteMany();
  await prisma.bannedIdentity.deleteMany();
  console.log('[SEED] ✓ Database cleared');
}

async function seedUsers() {
  console.log('\n[SEED] Seeding users...');
  const createdUsers: Array<{ id: string; email: string; role: string }> = [];

  for (const user of TEST_USERS) {
    const passwordHash = await hash(user.password, 12);
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash,
        role: user.role,
        name: user.name,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ')[1] || '',
        emailVerified: new Date(),
      },
    });
    createdUsers.push({ id: created.id, email: created.email, role: created.role });
  }

  console.log(`[SEED] ✓ Created ${createdUsers.length} users:`);
  createdUsers.forEach((u) => console.log(`       - ${u.email} (${u.role})`));

  return createdUsers;
}

async function seedBrands() {
  console.log('\n[SEED] Seeding brands...');
  const brands = ['Starbucks', 'Lavazza', 'Illy', "Peet's"];

  await prisma.brand.createMany({
    data: brands.map((name) => ({
      name,
      slug: slugify(name),
      description: `Premium ${name} coffee selections.`,
      isActive: true,
    })),
  });

  console.log(`[SEED] ✓ Created ${brands.length} brands: ${brands.join(', ')}`);
}

async function seedProducts() {
  console.log('\n[SEED] Seeding products...');

  await prisma.product.createMany({
    data: PRODUCTS.map((p) => ({
      id: p.id,
      slug: slugify(`${p.brand}-${p.name}`),
      catalog: 'shop',
      name: p.name,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      reviews: 5 + Math.floor(Math.random() * 30),
      image: '/images/product/coffee-default.png',
      roast: p.roast,
      process: 'NATURAL',
      origin: 'Various',
      originRegion: p.brand,
      country: 'Multi-Origin',
      coffeeType: 'SINGLE_ORIGIN',
      body: 'MEDIUM',
      acidity: 'MEDIUM',
      sweetness: 'MEDIUM',
      size: '12 oz',
      description: `${p.name} from ${p.brand}. Premium quality roasted to perfection.`,
      inStock: p.inventory > 0,
      inventory: p.inventory,
      lowStockThreshold: 10,
      status: p.inventory > 0 ? 'active' : 'out_of_stock',
      brewMethods: ['DRIP', 'ESPRESSO'],
      grindTypes: ['WHOLE_BEAN', 'GROUND'],
      tastingNotes: ['BALANCED', 'SMOOTH'],
      specialTags: ['PREMIUM'],
    })),
  });

  console.log(`[SEED] ✓ Created ${PRODUCTS.length} products across ${[...new Set(PRODUCTS.map((p) => p.brand))].length} brands`);
  console.log(
    `       - ${PRODUCTS.filter((p) => p.inventory > 10).length} in stock | ${PRODUCTS.filter((p) => p.inventory > 0 && p.inventory <= 10).length} low stock | ${PRODUCTS.filter((p) => p.inventory === 0).length} out of stock`
  );
}

async function seedOrders(users: Array<{ id: string; email: string; role: string }>) {
  console.log('\n[SEED] Seeding orders...');

  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });

  let orderCount = 0;
  const statuses = [...ORDER_STATUSES];

  for (let i = 0; i < 30; i++) {
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    const quantity = 1 + (i % 3);
    const unitPrice = parseFloat(product.price.toString());
    const subtotal = unitPrice * quantity;
    const shippingFee = i % 2 === 0 ? 5.99 : 0;
    const total = subtotal + shippingFee;
    const status = statuses[i % statuses.length];
    const daysAgo = Math.floor(i / 5) * 2; // Spread orders over ~12 days
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        userId: customer.id,
        status,
        subtotal: Math.round(subtotal * 100),
        shippingFee: Math.round(shippingFee * 100),
        total: Math.round(total * 100),
        createdAt,
        items: {
          create: {
            productId: product.id,
            quantity,
            unitPrice: Math.round(unitPrice * 100),
          },
        },
      },
    });

    orderCount++;
  }

  console.log(`[SEED] ✓ Created ${orderCount} orders spread across all statuses`);
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  statusCounts.forEach((sc) => console.log(`       - ${sc.status}: ${sc._count.id}`));
}

async function seedRefunds(users: Array<{ id: string; email: string; role: string }>) {
  console.log('\n[SEED] Seeding refund requests...');

  const orders = await prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  const manager = users.find((u) => u.role === 'MANAGER');

  const refundData = Array.from({ length: 5 }, (_, i) => {
    const order = orders[i % orders.length];
    const status = REFUND_STATUSES[i % REFUND_STATUSES.length];
    const requestedAt = new Date(Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000);
    const decisionAt = status !== 'REQUESTED' ? new Date(requestedAt.getTime() + 2 * 24 * 60 * 60 * 1000) : null;

    return {
      orderId: order.id,
      userId: order.userId,
      amount: order.total,
      reason: ['Product arrived damaged', 'Changed mind', 'Wrong item sent', 'Quality not as expected', 'Duplicate order'][i % 5],
      status,
      requestedAt,
      decisionAt,
      decidedBy: status !== 'REQUESTED' ? manager?.id : null,
    };
  });

  for (const refund of refundData) {
    await prisma.refundRequest.create({
      data: {
        orderId: refund.orderId,
        userId: refund.userId,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        requestedAt: refund.requestedAt,
        decisionAt: refund.decisionAt,
        decidedBy: refund.decidedBy,
      },
    });
  }

  console.log(`[SEED] ✓ Created ${refundData.length} refund requests`);
  const refundCounts = await prisma.refundRequest.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  refundCounts.forEach((rc) => console.log(`       - ${rc.status}: ${rc._count.id}`));
}

async function seedReviews(users: Array<{ id: string; email: string; role: string }>) {
  console.log('\n[SEED] Seeding reviews...');

  const customers = users.filter((u) => u.role === 'CUSTOMER');
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  const manager = users.find((u) => u.role === 'MANAGER');

  let reviewCount = 0;

  for (let i = 0; i < 10; i++) {
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    const status = REVIEW_STATUSES[i % REVIEW_STATUSES.length];
    const rating = 2 + (i % 4); // 2-5 stars
    const createdAt = new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000);
    const moderatedAt = status !== 'PENDING' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null;

    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: String(product.id),
        rating,
        title: `Review of ${product.name}`,
        content: `Great coffee! ${status === 'PENDING' ? '(Awaiting approval)' : ''} This ${product.brand} ${product.roast.toLowerCase()} roast delivers excellent flavor and aroma.`,
        type: 'PRODUCT',
        status,
        createdAt,
        moderatedAt,
        moderatedBy: status !== 'PENDING' ? manager?.id : null,
        rejectionReason: status === 'REJECTED' ? 'Please provide more detail about your experience.' : null,
        isHidden: status === 'REJECTED',
        hiddenAt: status === 'REJECTED' ? moderatedAt : null,
        hiddenBy: status === 'REJECTED' ? manager?.id : null,
      },
    });

    reviewCount++;
  }

  console.log(`[SEED] ✓ Created ${reviewCount} reviews`);
  const reviewCounts = await prisma.review.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  reviewCounts.forEach((rc) => console.log(`       - ${rc.status}: ${rc._count.id}`));
}

async function seedContent() {
  console.log('\n[SEED] Seeding content...');

  // FAQ Entries
  const faqCount = await prisma.faqEntry.count();
  if (faqCount === 0) {
    await prisma.faqEntry.createMany({
      data: [
        {
          question: 'What is your refund policy?',
          answer: 'We offer a 30-day money-back guarantee on all coffee purchases. If you are not satisfied with your order, contact our support team.',
          sortOrder: 1,
          isActive: true,
        },
        {
          question: 'Do you offer international shipping?',
          answer: 'Currently, we ship within the continental United States. International shipping coming soon!',
          sortOrder: 2,
          isActive: true,
        },
        {
          question: 'What is the difference between light, medium, and dark roasts?',
          answer: 'Light roasts have a higher acidity and brighter flavor. Medium roasts are balanced. Dark roasts are bold with lower acidity and deeper chocolate notes.',
          sortOrder: 3,
          isActive: true,
        },
        {
          question: 'How should I store my coffee?',
          answer: 'Store coffee in an airtight container away from direct sunlight and heat. Whole beans stay fresh for up to 4 weeks. Ground coffee should be used within 1 week.',
          sortOrder: 4,
          isActive: true,
        },
      ],
    });
  }

  // Homepage Sections
  const homepageSectionCount = await prisma.homepageSection.count();
  if (homepageSectionCount === 0) {
    await prisma.homepageSection.createMany({
      data: [
        {
          key: 'hero-banner',
          title: 'Welcome to AromaCraft',
          content: 'Discover premium coffee selections from around the world.',
          sortOrder: 1,
          isActive: true,
        },
        {
          key: 'featured-products',
          title: 'Featured Collections',
          content: 'Explore our curated selection of specialty coffees.',
          sortOrder: 2,
          isActive: true,
        },
        {
          key: 'about-us-intro',
          title: 'About AromaCraft',
          content: 'Since 2020, we have been sourcing and roasting the finest coffee beans.',
          sortOrder: 3,
          isActive: true,
        },
        {
          key: 'customer-testimonials',
          title: 'What Our Customers Say',
          content: 'Join thousands of coffee lovers who trust AromaCraft.',
          sortOrder: 4,
          isActive: true,
        },
      ],
    });
  }

  // Promotional Banners
  const bannerCount = await prisma.promotionalBanner.count();
  if (bannerCount === 0) {
    await prisma.promotionalBanner.createMany({
      data: [
        {
          title: 'Summer Sale',
          image: '/images/banner-summer.png',
          link: '/shop?sale=summer',
          startsAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          title: 'New Arrivals',
          image: '/images/banner-new.png',
          link: '/shop?new=true',
          isActive: true,
        },
        {
          title: 'Subscribe & Save',
          image: '/images/banner-subscribe.png',
          link: '/subscription',
          isActive: true,
        },
      ],
    });
  }

  // Our Story
  const storyCount = await prisma.ourStory.count();
  if (storyCount === 0) {
    await prisma.ourStory.create({
      data: {
        id: 'default',
        title: 'Our Story',
        body: 'AromaCraft was founded by coffee enthusiasts who believed that everyone deserves access to exceptional, ethically-sourced coffee. We work directly with farmers around the world to bring you the finest coffee selections. Each bag tells a story of craftsmanship, passion, and dedication to quality.',
        image: '/images/our-story.png',
      },
    });
  }

  console.log('[SEED] ✓ Created content: FAQ entries, homepage sections, promotional banners, Our Story');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    await clearDatabase();
    const users = await seedUsers();
    await seedBrands();
    await seedProducts();
    await seedOrders(users);
    await seedRefunds(users);
    await seedReviews(users);
    await seedContent();

    console.log('\n' + '='.repeat(70));
    console.log('✓ SEEDING COMPLETE');
    console.log('='.repeat(70));
    console.log('\nTest Credentials:');
    console.log('  Manager:  manager@aromacraft.test / ManagerPass123!');
    console.log('  Staff:    staff@aromacraft.test / StaffPass123!');
    console.log('  Customer: customer@aromacraft.test / CustomerPass123!');
    console.log('\nVerify counts with:');
    console.log('  SELECT COUNT(*) FROM User;');
    console.log('  SELECT COUNT(*) FROM Product;');
    console.log('  SELECT COUNT(*) FROM Order;');
    console.log('  SELECT COUNT(*) FROM Review;');
    console.log('  SELECT COUNT(*) FROM RefundRequest;');
    console.log('  SELECT COUNT(*) FROM FaqEntry;');
    console.log('  SELECT COUNT(*) FROM HomepageSection;');
    console.log('  SELECT COUNT(*) FROM PromotionalBanner;');
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n[SEED ERROR]', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
