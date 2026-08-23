import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await prisma.product.findMany({
    where: { catalog: 'shop' },
    orderBy: { id: 'asc' },
  });

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      price: Number(p.price),
      brewMethods: p.brewMethods as string[],
      grindTypes: p.grindTypes as string[],
      tastingNotes: p.tastingNotes as string[],
      specialTags: p.specialTags as string[],
    }))
  );
}
