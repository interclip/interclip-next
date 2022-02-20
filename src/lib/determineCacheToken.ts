import { NextApiRequest } from 'next';
import { createHash } from 'node:crypto';

/**
 * Returns a key for the rate limiter
 * @param req the API request
 */
const getCacheToken = (req: NextApiRequest): string => {
  const ip =
    req.headers['x-forwarded-for']?.toString() ||
    req.socket.remoteAddress ||
    'anonymous';
  return createHash('sha256').update(ip).digest('hex');
};

export default getCacheToken;
