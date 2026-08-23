import type { NextApiRequest, NextApiResponse } from 'next';
import { requireSession } from '@/lib/auth-utils';
import {
  jsonError,
  jsonSuccess,
  parseJsonBody,
  validateMethod,
} from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';
import {
  buildCommentTitle,
  normalizeCommentDestination,
} from '@/lib/review-utils';
import { createReviewSchema } from '@/lib/validators/review';

const defaultReviews = [
  {
    id: 'default-1',
    destination: 'home',
    title: 'Home',
    rating: 5,
    content:
      'A calm, confident experience from discovery to delivery. Everything feels premium and effortless.',
    author: 'Amelia',
  },
  {
    id: 'default-2',
    destination: 'pike-place',
    title: 'Pike Place',
    rating: 5,
    content:
      'A luxurious daily ritual with the smoothness and consistency I want in a neighborhood coffee favorite.',
    author: 'Noah',
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { user: { select: { id: true, name: true } } },
      });

      const mapped = reviews.map((review) => {
        const destination = normalizeCommentDestination(review.title);
        return {
          id: review.id,
          destination,
          title: buildCommentTitle(review.title),
          rating: review.rating,
          content: review.content,
          author: review.user?.name || 'Community member',
          createdAt: review.createdAt.toISOString(),
        };
      });

      return jsonSuccess(
        res,
        {
          reviews: mapped.length ? mapped : defaultReviews,
        },
        200
      );
    } catch {
      return jsonError(res, 'reviews_error', 'Unable to load reviews.', 500);
    }
  }

  if (req.method === 'POST') {
    const auth = await requireSession(req, res);
    if (!auth) return;

    const body = parseJsonBody<{
      destination?: string;
      rating?: number;
      title?: string;
      content?: string;
    }>(req);
    if (!body) {
      return jsonError(
        res,
        'invalid_request',
        'Review payload is required.',
        400
      );
    }

    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        res,
        'invalid_request',
        'Invalid review payload.',
        400,
        parsed.error.flatten()
      );
    }

    const reviewInput = parsed.data;
    const destination = normalizeCommentDestination(reviewInput.destination);
    const rawTitle = reviewInput.title.trim() || buildCommentTitle(destination);
    const content = reviewInput.content.trim();
    const rating = reviewInput.rating;

    try {
      const review = await prisma.review.create({
        data: {
          userId: auth.user.id,
          rating,
          title: rawTitle,
          content,
          type: 'HOME',
          productId: null,
        },
        include: { user: { select: { id: true, name: true } } },
      });

      return jsonSuccess(
        res,
        {
          review: {
            id: review.id,
            destination,
            title: buildCommentTitle(review.title),
            rating: review.rating,
            content: review.content,
            author: review.user?.name || 'Community member',
            createdAt: review.createdAt.toISOString(),
          },
        },
        201
      );
    } catch {
      return jsonError(
        res,
        'reviews_error',
        'Unable to save your review.',
        500
      );
    }
  }

  return validateMethod(req, res, ['GET', 'POST']);
}
