import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { products as shopProducts } from './seed-data';

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedProducts() {
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: shopProducts.map((p) => ({
      id: p.id,
      slug: `${slugify(`${p.brand}-${p.name}`)}-${p.id}`,
      catalog: 'shop',
      name: p.name,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      reviews: p.reviews,
      image: p.image,
      roast: p.roast,
      process: p.process,
      origin: p.origin,
      originRegion: p.originRegion,
      country: p.country,
      coffeeType: p.coffeeType,
      body: p.body,
      acidity: p.acidity,
      sweetness: p.sweetness,
      size: p.size,
      description: p.description,
      inStock: p.inStock,
      inventory: p.inStock ? 40 + ((p.id * 13) % 80) : 0,
      originalPrice: p.originalPrice,
      badge: p.badge,
      imageAlt: p.imageAlt,
      subscriptionEligible: p.subscriptionEligible ?? false,
      subscriptionSavings: p.subscriptionSavings,
      altitude: p.altitude,
      variety: p.variety,
      notes: p.notes,
      brewMethods: p.brewMethods,
      grindTypes: p.grindTypes,
      tastingNotes: p.tastingNotes,
      specialTags: p.specialTags,
    })),
  });

  console.log(`Seeded ${shopProducts.length} shop products`);
}

async function main() {
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

  await seedProducts();
}

main()
  .catch((error) => {
    console.error(error?.message ?? error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
