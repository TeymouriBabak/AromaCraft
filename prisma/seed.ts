import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { products as shopProducts } from './seed-data';

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seedManagerAccount() {
  const email = process.env.SEED_MANAGER_EMAIL;
  const username = process.env.SEED_MANAGER_USERNAME;
  const password = process.env.SEED_MANAGER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error(
      'SEED_MANAGER_EMAIL, SEED_MANAGER_USERNAME and SEED_MANAGER_PASSWORD must be set to create the initial MANAGER account'
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      username,
      role: 'MANAGER',
      passwordHash,
    },
    create: {
      email,
      username,
      passwordHash,
      role: 'MANAGER',
    },
  });

  console.log('Ensured manager account exists');
}

async function seedCustomers() {
  const customerData = Array.from({ length: 24 }, (_, index) => {
    const suffix = index + 1;
    const firstName = ['Ava', 'Leo', 'Mila', 'Noah', 'Zoe', 'Ethan', 'Ivy', 'Kai', 'Nora', 'Owen', 'Rae', 'Theo'][index % 12];
    const lastName = ['Baker', 'Hayes', 'Nguyen', 'Patel', 'Smith', 'Chen', 'Davis', 'Wilson', 'Garcia', 'Brown', 'Ng', 'Lopez'][index % 12];
    const email = `customer${suffix}@aromacraft.test`;

    return {
      email,
      username: `customer${suffix}`,
      passwordHash: '$2a$12$L2vA7d9NyW9S1B7pGx5M2uVQxJvqBdi0rA9aYJuhCI9c5x6E4pTgS',
      role: 'CUSTOMER' as const,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      mobile: `+1${1000000000 + suffix}`,
      gender: index % 2 === 0 ? 'Female' : 'Male',
      createdAt: daysAgo(180 - index * 5),
    };
  });

  await prisma.user.createMany({
    data: customerData,
    skipDuplicates: true,
  });

  console.log(`Seeded ${customerData.length} customer accounts`);
}

async function seedBrands() {
  const uniqueBrands = [...new Set(shopProducts.map((product) => product.brand))];

  await prisma.brand.deleteMany();

  await prisma.brand.createMany({
    data: uniqueBrands.map((name) => ({
      name,
      slug: slugify(name),
      description: `${name} signature coffee selections for AromaCraft customers.`,
      isActive: true,
    })),
  });

  console.log(`Seeded ${uniqueBrands.length} brands`);
}

async function seedProducts() {
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: shopProducts.map((product) => ({
      id: product.id,
      slug: `${slugify(`${product.brand}-${product.name}`)}-${product.id}`,
      catalog: 'shop',
      name: product.name,
      brand: product.brand,
      price: product.price,
      rating: product.rating,
      reviews: product.reviews,
      image: product.image,
      roast: product.roast,
      process: product.process,
      origin: product.origin,
      originRegion: product.originRegion,
      country: product.country,
      coffeeType: product.coffeeType,
      body: product.body,
      acidity: product.acidity,
      sweetness: product.sweetness,
      size: product.size,
      description: product.description,
      inStock: product.inStock,
      inventory: product.inStock ? 40 + ((product.id * 13) % 80) : 0,
      originalPrice: product.originalPrice,
      badge: product.badge,
      imageAlt: product.imageAlt,
      subscriptionEligible: product.subscriptionEligible ?? false,
      subscriptionSavings: product.subscriptionSavings,
      altitude: product.altitude,
      variety: product.variety,
      notes: product.notes,
      brewMethods: product.brewMethods,
      grindTypes: product.grindTypes,
      tastingNotes: product.tastingNotes,
      specialTags: product.specialTags,
    })),
  });

  console.log(`Seeded ${shopProducts.length} shop products`);
}

async function seedReviews() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'asc' },
  });
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
  });
  const moderator = await prisma.user.findFirst({ where: { role: 'MANAGER' }, select: { id: true } });

  if (users.length === 0 || products.length === 0) {
    console.warn('[seed] no customer users or products found; skipping review seed');
    return;
  }

  await prisma.review.deleteMany();

  const reviewData = Array.from({ length: 48 }, (_, index) => {
    const user = users[index % users.length];
    const product = products[index % products.length];
    const rating = 3 + ((index + product.id) % 3);
    const createdAt = daysAgo(10 + index * 4);
    const type = index % 2 === 0 ? 'PRODUCT' : 'HOME';
    const status: 'PENDING' | 'APPROVED' | 'REJECTED' = index % 3 === 0 ? 'PENDING' : index % 3 === 1 ? 'APPROVED' : 'REJECTED';

    return {
      userId: user.id,
      productId: String(product.id),
      rating,
      title: `${product.brand} review ${index + 1}`,
      content: `This ${product.name} delivered a ${['smooth', 'bright', 'balanced', 'full-bodied'][index % 4]} cup and a dependable brew every time.`,
      type: type as 'PRODUCT' | 'HOME',
      createdAt,
      status,
      moderatedAt: status === 'PENDING' ? null : createdAt,
      moderatedBy: status === 'PENDING' ? null : moderator?.id ?? null,
      rejectionReason: status === 'REJECTED' ? 'Please provide a few more details about the brew and roast profile.' : null,
      isHidden: status === 'REJECTED',
      hiddenAt: status === 'REJECTED' ? createdAt : null,
      hiddenBy: status === 'REJECTED' ? moderator?.id ?? null : null,
    };
  });

  await prisma.review.createMany({ data: reviewData });
  console.log(`Seeded ${reviewData.length} reviews`);
}

async function seedOrders() {
  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'asc' },
  });
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
  });

  if (users.length === 0 || products.length === 0) {
    console.warn('[seed] no customer users or products found; skipping order seed');
    return;
  }

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  const statuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
  const bestSellerIds = products.slice(0, 10).map((product) => product.id);

  for (let index = 0; index < 60; index += 1) {
    const user = users[index % users.length];
    const itemCount = 1 + (index % 5);
    const status = statuses[index % statuses.length];
    const createdAt = daysAgo(200 - index * 3);
    const itemProductIds = Array.from({ length: itemCount }, (_, itemIndex) => {
      const isTopSeller = itemIndex % 3 === 0 || itemIndex === 0;
      const basePool = isTopSeller ? bestSellerIds : products.map((product) => product.id);
      return basePool[(index + itemIndex) % basePool.length];
    });

    const items = itemProductIds.map((productId, itemIndex) => {
      const product = products.find((entry) => entry.id === productId) ?? products[0];
      const quantity = 1 + ((index + itemIndex) % 3);
      const unitPrice = Number(product.price) * (1 + (itemIndex % 2) * 0.12);
      return {
        productId,
        quantity,
        unitPrice: Number(unitPrice.toFixed(2)),
      };
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
    const shippingFee = index % 2 === 0 ? 6 : 4;

    await prisma.order.create({
      data: {
        userId: user.id,
        status,
        subtotal: Number(subtotal.toFixed(2)),
        shippingFee,
        total: Number((subtotal + shippingFee).toFixed(2)),
        createdAt,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
    });
  }

  const itemTotal = await prisma.orderItem.count();
  console.log(`Seeded 60 orders with ${itemTotal} order items across recent months`);
}

async function seedRefundRequests() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  if (orders.length === 0) {
    console.warn('[seed] no orders found; skipping refund request seed');
    return;
  }

  await prisma.refundRequest.deleteMany();

  const statuses = ['REQUESTED', 'APPROVED', 'REJECTED'] as const;
  const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' }, select: { id: true } });

  const refundData = orders.slice(0, 9).map((order, index) => ({
    orderId: order.id,
    userId: order.userId ?? null,
    requestedAt: daysAgo(25 + index * 3),
    amount: Number(order.total) * (index % 3 === 0 ? 0.5 : index % 3 === 1 ? 0.25 : 0.1),
    reason: [
      'The order arrived later than expected and the roast did not match the description.',
      'One of the beans arrived damaged and I would like a refund for the damaged item.',
      'The brew profile was much weaker than described and I want a partial refund.',
    ][index % 3],
    status: statuses[index % statuses.length],
    decisionAt: index % 3 === 0 ? daysAgo(18 + index) : index % 3 === 1 ? daysAgo(12 + index) : null,
    decidedBy: index % 3 === 2 ? null : manager?.id ?? null,
  }));

  await prisma.refundRequest.createMany({ data: refundData });
  console.log(`Seeded ${refundData.length} refund requests`);
}

async function seedContent() {
  await prisma.shopFilter.deleteMany();
  await prisma.shopFilter.createMany({
    data: [
      { key: 'roast', label: 'Roast level', type: 'select', options: ['Light', 'Medium', 'Dark'], sortOrder: 1, isVisible: true },
      { key: 'origin', label: 'Origin', type: 'select', options: ['Ethiopia', 'Colombia', 'Kenya', 'Brazil'], sortOrder: 2, isVisible: true },
      { key: 'brew-method', label: 'Brew method', type: 'multiselect', options: ['Espresso', 'Pour Over', 'French Press'], sortOrder: 3, isVisible: true },
    ],
  });

  await prisma.homepageSection.deleteMany();
  await prisma.homepageSection.createMany({
    data: [
      { key: 'hero', title: 'Fresh roasts, delivered weekly', content: 'Handpicked seasonal coffees for home brewers and café lovers.', sortOrder: 1, isActive: true },
      { key: 'best-sellers', title: 'Best sellers', content: 'Our most loved blends are flying out this month.', sortOrder: 2, isActive: true },
      { key: 'story', title: 'From-source roastery story', content: 'We source traceable beans from productive partner farms and roast in small batches.', sortOrder: 3, isActive: true },
    ],
  });

  await prisma.promotionalBanner.deleteMany();
  await prisma.promotionalBanner.createMany({
    data: [
      { title: 'Spring coffee sampler', image: '/images/banner-sampler.jpg', link: '/shop', startsAt: daysAgo(20), endsAt: daysAgo(-5), isActive: true },
      { title: 'Free shipping over $50', image: '/images/banner-shipping.jpg', link: '/shop', startsAt: daysAgo(45), endsAt: daysAgo(-10), isActive: true },
    ],
  });

  await prisma.faqEntry.deleteMany();
  await prisma.faqEntry.createMany({
    data: [
      { question: 'How often do you roast?', answer: 'We roast in small batches every Tuesday and Friday to keep freshness high.', sortOrder: 1, isActive: true },
      { question: 'Do you offer subscriptions?', answer: 'Yes, all of our popular roasts can be delivered on a flexible subscription plan.', sortOrder: 2, isActive: true },
      { question: 'Can I request a grind?', answer: 'Absolutely. We offer a variety of grind options for espresso, pour over, and French press brewers.', sortOrder: 3, isActive: true },
    ],
  });

  await prisma.ourStory.upsert({
    where: { id: 'default' },
    update: {
      title: 'Small-batch coffee from origin to cup',
      body: 'AromaCraft connects thoughtful growers with everyday coffee lovers by focusing on traceability, freshness, and a memorable cup profile.',
      image: '/images/story-default.jpg',
    },
    create: {
      id: 'default',
      title: 'Small-batch coffee from origin to cup',
      body: 'AromaCraft connects thoughtful growers with everyday coffee lovers by focusing on traceability, freshness, and a memorable cup profile.',
      image: '/images/story-default.jpg',
    },
  });

  console.log('Seeded content management records');
}

async function main() {
  await seedManagerAccount();
  await seedProducts();
  await seedBrands();
  await seedCustomers();
  await seedReviews();
  await seedOrders();
  await seedRefundRequests();
  await seedContent();
}

main()
  .catch((error) => {
    console.error(error?.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
