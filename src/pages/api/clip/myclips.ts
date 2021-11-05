import {
  getLinkPreviewFromCache,
  storeLinkPreviewInCache,
} from '@utils/clipPreview';
import getCacheToken from '@utils/determineCacheToken';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

import { getUserIDFromEmail } from '../../../lib/dbHelpers';
import { db } from '../../../lib/prisma';
import limiter from '../../../lib/rateLimit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
) {
  try {
    await limiter.check(res, 30, getCacheToken(req));
  } catch {
    res.status(429).json({
      status: 'error',
      result: 'Rate limit exceeded',
    });
  }

  const session = await getSession({ req });

  if (!session) {
    res.status(401).json({
      status: 'error',
      result: 'Unauthenticated.',
    });
  }
  try {
    const clips = await db.clip.findMany({
      where: {
        ownerID: await getUserIDFromEmail(session?.user?.email),
      },
      select: {
        code: true,
        url: true,
        createdAt: true,
        expiresAt: true,
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const newClips = [];

    for (const clip of clips) {
      const additionalDetails =
        (await getLinkPreviewFromCache(clip.url)) ||
        (await storeLinkPreviewInCache(clip.url));

      if (additionalDetails) {
        newClips.push({
          ...clip,
          oembed: {
            ...additionalDetails,
          },
        });
      } else {
        newClips.push(clip);
      }
    }

    res.status(200).json({ status: 'success', result: newClips });
  } catch (e) {
    res.status(500).json({
      status: 'error',
      result: 'An error with the database has occured.',
    });
  }
}
