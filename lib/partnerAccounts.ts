import { prisma } from './prisma';

interface CacheEntry {
  ids: string[];
  expiresAt: number;
}

// In-memory cache for user partner accounts to avoid redundant remote database queries
const partnerCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Returns all associated user IDs for partner workshops (MotoFit, Samael, Akshat, Munna, Kunal, Manager).
 * Uses an in-memory cache to guarantee sub-millisecond retrieval on repeat requests.
 */
export async function getTargetUserIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const now = Date.now();
  const cached = partnerCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.ids;
  }

  const defaultIds = [userId];
  try {
    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const userEmail = (userObj?.email || '').toLowerCase();
    if (
      userEmail.includes('motofit') ||
      userEmail.includes('manash') ||
      userEmail.includes('samael') ||
      userEmail.includes('akshat') ||
      userEmail.includes('munna') ||
      userEmail.includes('kunal') ||
      userEmail.includes('manager')
    ) {
      const partners = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: 'motofit' } },
            { email: { contains: 'manash' } },
            { email: { contains: 'samael' } },
            { email: { contains: 'akshat' } },
            { email: { contains: 'munna' } },
            { email: { contains: 'kunal' } },
            { email: { contains: 'manager' } },
          ],
        },
        select: { id: true },
      });
      const ids = partners.map((p) => p.id);
      const result = ids.length > 0 ? ids : defaultIds;
      partnerCache.set(userId, { ids: result, expiresAt: now + CACHE_TTL_MS });
      return result;
    }
  } catch (err) {
    console.warn('[getTargetUserIds] Error resolving partner accounts:', err);
  }

  partnerCache.set(userId, { ids: defaultIds, expiresAt: now + CACHE_TTL_MS });
  return defaultIds;
}

/**
 * Invalidate partner accounts cache on updates or resets
 */
export function invalidatePartnerCache(userId?: string) {
  if (userId) {
    partnerCache.delete(userId);
  } else {
    partnerCache.clear();
  }
}
