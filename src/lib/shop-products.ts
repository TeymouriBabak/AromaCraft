import { prisma } from '@/lib/prisma';
import type {
  ROAST_LEVELS,
  PROCESSES,
  ORIGINS,
  BREW_METHODS,
  FLAVOR_NOTES,
  COFFEE_TYPES,
  BODY_LEVELS,
  ACIDITY_LEVELS,
  SWEETNESS_LEVELS,
  SIZES,
  GRIND_OPTIONS,
  SPECIAL_TAGS,
} from '@/data/coffee-brands';

export type Product = {
  id: number;
  name: string;
  brand: string;
  origin: string;
  country: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  badge: string;
  roast: (typeof ROAST_LEVELS)[number];
  process: (typeof PROCESSES)[number];
  originRegion: (typeof ORIGINS)[number];
  brewMethods: (typeof BREW_METHODS)[number][];
  grindTypes: (typeof GRIND_OPTIONS)[number][];
  image: string;
  imageAlt: string;
  description: string;
  tastingNotes: (typeof FLAVOR_NOTES)[number][];
  altitude: string;
  variety: string;
  notes: string;
  coffeeType: (typeof COFFEE_TYPES)[number];
  body: (typeof BODY_LEVELS)[number];
  acidity: (typeof ACIDITY_LEVELS)[number];
  sweetness: (typeof SWEETNESS_LEVELS)[number];
  size: (typeof SIZES)[number];
  specialTags: (typeof SPECIAL_TAGS)[number][];
  inStock: boolean;
  subscriptionEligible?: boolean;
  subscriptionSavings?: number;
};

type PrismaProductRow = Awaited<
  ReturnType<typeof prisma.product.findMany>
>[number];

function mapRow(p: PrismaProductRow): Product {
  const price = Number(p.price);
  const specialTags = (p.specialTags ?? []) as Product['specialTags'];
  const badge = specialTags.includes('New Arrival')
    ? 'New Arrival'
    : specialTags.includes('Best Seller')
      ? 'Best Seller'
      : 'Premium Selection';

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    origin: p.origin,
    country: p.country,
    price,
    originalPrice: Math.round(price * 1.12 * 100) / 100,
    rating: p.rating,
    reviews: p.reviews,
    badge,
    roast: p.roast as Product['roast'],
    process: p.process as Product['process'],
    originRegion: p.originRegion as Product['originRegion'],
    brewMethods: p.brewMethods as Product['brewMethods'],
    grindTypes: p.grindTypes as Product['grindTypes'],
    image: p.image,
    imageAlt: `${p.name} premium coffee`,
    description: p.description,
    tastingNotes: p.tastingNotes as Product['tastingNotes'],
    altitude: '1200-1600m',
    variety: 'Mixed Varieties',
    notes: `Smooth finish with ${p.body.toLowerCase()} body. Roast: ${p.roast}.`,
    coffeeType: p.coffeeType as Product['coffeeType'],
    body: p.body as Product['body'],
    acidity: p.acidity as Product['acidity'],
    sweetness: p.sweetness as Product['sweetness'],
    size: p.size as Product['size'],
    specialTags,
    inStock: p.inStock,
    subscriptionEligible: specialTags.includes('Subscription Eligible'),
  };
}

export async function getShopProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { catalog: 'shop' },
    orderBy: { id: 'asc' },
  });
  return rows.map(mapRow);
}

export async function getShopProduct(id: number): Promise<Product | null> {
  const p = await prisma.product.findFirst({
    where: { id, catalog: 'shop' },
  });
  if (!p) return null;
  return mapRow(p);
}
