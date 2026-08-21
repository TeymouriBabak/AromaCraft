import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/auth-utils';
import { jsonError, jsonSuccess } from '@/lib/api-utils';
import { prisma } from '@/lib/prisma';

// formatAxisLabel removed (unused)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireRole(req, res, ['customer', 'admin', 'manager']);
  if (!auth) return;

  try {
    const activities = await prisma.userActivity.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      take: 90,
    });

    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => {
      const totalMinutes = activities.filter((entry) => new Date(entry.createdAt).getHours() === hour).reduce((sum, entry) => {
        const duration = typeof entry.durationMs === 'number' ? entry.durationMs : 0;
        return sum + duration;
      }, 0);

      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        minutes: Math.round(totalMinutes / 60000),
      };
    });

    const monthlyBuckets = Array.from({ length: 6 }, (_, offset) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - offset));
      const label = date.toLocaleString('en-US', { month: 'short' });
      const value = activities.filter((entry) => {
        const createdAt = new Date(entry.createdAt);
        return createdAt.getMonth() === date.getMonth() && createdAt.getFullYear() === date.getFullYear();
      }).length;
      return { month: label, actions: value };
    });

    const recentActivity = activities.slice(0, 10).map((entry) => ({
      id: entry.id,
      title: entry.action,
      date: entry.createdAt.toISOString(),
      details: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
    }));

    return jsonSuccess(res, {
      activity: recentActivity,
      charts: {
        hourly: hourlyBuckets,
        monthly: monthlyBuckets,
      },
      summary: {
        totalActions: activities.length,
        averageMinutes: activities.length
          ? Math.round(activities.reduce((sum, entry) => sum + (entry.durationMs ?? 0), 0) / 60000 / activities.length)
          : 0,
      },
    }, 200);
  } catch (error) {
    return jsonError(res, 'activity_error', 'Unable to load activity.', 500, error instanceof Error ? error.message : undefined);
  }
}
