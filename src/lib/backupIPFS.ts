import { db } from '@utils/prisma';
import { create } from 'ipfs-http-client';
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
});

export const createBackupDirectory = async () => {
  await client.files.mkdir('/clips');
  return await client.files.stat('/clips');
};

/**
 * Upload a post to ipfs
 * @param id - Id of the post to be uploaded to IPFS
 */
export const uploadToIPFS = async (id: number) => {
  new Promise(async (resolve) => {
    const clip = await db.clip.findUnique({
      where: { id },
      select: {
        createdAt: true,
        url: true,
        code: true,
        ownerID: true,
      },
    });
    const { path } = await client.add(
      JSON.stringify({
        post: clip,
      }),
    );

    await db.clip.update({
      where: { id },
      data: { ipfsHash: path },
    });
    resolve(path);
  });
};
