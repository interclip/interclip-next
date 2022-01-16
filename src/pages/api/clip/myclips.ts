import { needsAuth } from '@utils/api/ensureAuth';
import {
  getLinkPreviewFromCache,
  storeLinkPreviewInCache,
} from '@utils/clipPreview';
import { getUserIDFromEmail } from '@utils/dbHelpers';
import getCacheToken from '@utils/determineCacheToken';
import { db } from '@utils/prisma';
import limiter from '@utils/rateLimit';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { APIResponse } from 'src/typings/interclip';

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

  needsAuth(req, res);

  try {
    const clips = await db.clip.findMany({
      where: {
        ownerID: await getUserIDFromEmail(session?.user?.email),
      },
      select: {
        code: true,
        hashLength: true,
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
