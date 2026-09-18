import { z } from 'zod';

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional().default(''),
  status: z.enum(['active', 'draft', 'archived']).optional().or(z.literal('')).optional(),
  brand: z.string().optional().default(''),
  sort: z.enum(['name', 'price', 'stock']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required.'),
  slug: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1, 'Brand is required.'),
  price: z.coerce.number().positive('Price must be greater than 0.'),
  inventory: z.coerce.number().int().min(0, 'Inventory cannot be negative.').default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  description: z.string().trim().max(2000).optional().default(''),
  image: z.string().url('Image must be a valid URL.').or(z.literal('')).optional().default(''),
  catalog: z.string().default('shop'),
  inStock: z.coerce.boolean().default(true),
  roast: z.string().trim().optional().default('Not specified'),
  process: z.string().trim().optional().default('Not specified'),
  origin: z.string().trim().optional().default('Not specified'),
  originRegion: z.string().trim().optional().default('Not specified'),
  country: z.string().trim().optional().default('Not specified'),
  coffeeType: z.string().trim().optional().default('Coffee'),
  body: z.string().trim().optional().default('Balanced'),
  acidity: z.string().trim().optional().default('Medium'),
  sweetness: z.string().trim().optional().default('Medium'),
  size: z.string().trim().optional().default('250g'),
  brewMethods: z.array(z.string()).optional().default([]),
  grindTypes: z.array(z.string()).optional().default([]),
  tastingNotes: z.array(z.string()).optional().default([]),
  specialTags: z.array(z.string()).optional().default([]),
});

export const productUpdateSchema = productCreateSchema.partial();

export const brandSchema = z.object({
  name: z.string().trim().min(2, 'Brand name is required.'),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().max(1000).optional().default(''),
  isActive: z.boolean().optional().default(true),
});

export const shopFilterSchema = z.object({
  key: z.string().trim().min(1, 'Filter key is required.'),
  label: z.string().trim().min(1, 'Filter label is required.'),
  type: z.enum(['select', 'range', 'checkbox']).default('select'),
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional().default([]),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productCreateSchema>;
