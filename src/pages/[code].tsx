import React, { useState } from 'react';
import { Layout } from '@components/Layout';
import { db } from '@utils/prisma';
import { NextApiRequest } from 'next';
import Image from 'next/image';
import QRModal from '@components/shared/QRModal';
import { QRIcon } from '@components/Icons';
import { Link } from '@components/Text/link';
import { getLinkPreview } from 'link-preview-js';
interface OEmbed {
  url: string;
  title: string;
  siteName: string | null;
  description: string | null;
  mediaType: string;
  contentType: string | null;
  images: string[];
  videos: {}[];
  favicons: string[];
}

function getBestFavicon(faviconsList: string[]) {
  if (faviconsList.length === 1) {
    return faviconsList.at(0);
  }
  // Todo(ft): determine the highest resolution favicon
  const matchesResolutionRegex = new RegExp(/\d{1,5}x\d{1,5}/);
  faviconsList.filter((favicon) => favicon.match(matchesResolutionRegex));
  return faviconsList.at(-1);
}

const Redirect = (props: { code: string; url: string; oembed: OEmbed }) => {
  const [qrCodeZoom, setQrCodeZoom] = useState<boolean>(false);
  const urlObject = new URL(props.url);
  const simplifiedURL = `${urlObject.hostname}${urlObject.pathname}`;
  return (
    <Layout>
      <section className="w-full h-full flex flex-col items-center justify-center">
        <div className="p-4 rounded-2xl mb-8 flex text-black dark:text-white bg-white dark:bg-[#262A2B] shadow-custom">
          <div className="mr-6">
            <h2 className="text-4xl mb-2 max-w-[30rem]">
              {props.oembed.title || props.code}
            </h2>
            <h3 className="text-2xl text-gray-400">
              <Link className="no-underline" href={props.url}>
                {simplifiedURL}
              </Link>
            </h3>
          </div>
          <div className="flex flex-col items-center">
            {props.oembed.favicons.length > 0 && (
              <Image
                src={`https://images.weserv.nl/?url=${getBestFavicon(
                  props.oembed.favicons,
                )}&w=300&h=300`}
                className="rounded"
                width={72}
                height={72}
              />
            )}
            <QRIcon
              onClick={() => {
                setQrCodeZoom(true);
              }}
            />
          </div>
          {qrCodeZoom && (
            <QRModal url={props.url} setQrCodeZoom={setQrCodeZoom} />
          )}
        </div>
      </section>
    </Layout>
  );
};

export async function getServerSideProps({
  query,
}: {
  query: NextApiRequest['query'];
}) {
  const userCode = query.code;
  const isPreviewPage = userCode.indexOf('+') === userCode.length - 1;
  if (userCode && typeof userCode === 'object') {
    return { notFound: true };
  }

  if (isPreviewPage) {
    try {
      const selectedClip = await db.clip.findUnique({
        where: { code: userCode.slice(0, -1) },
      });

      if (!selectedClip) {
        return { notFound: true };
      }
      const additionalDetails = (await getLinkPreview(
        selectedClip.url,
      )) as OEmbed;
      console.log(additionalDetails);

      return {
        props: {
          code: selectedClip.code,
          url: selectedClip.url,
          oembed: {
            title:
              additionalDetails.title || additionalDetails.siteName || null,
            description: additionalDetails.description || null,
            favicons: additionalDetails.favicons,
          },
        },
      };
    } catch (e) {
      console.error(e);
      return {
        notFound: true,
      };
    }
  }

  try {
    const selectedClip = await db.clip.findUnique({
      where: { code: userCode },
    });
    if (!selectedClip) {
      return { notFound: true };
    }
    return {
      redirect: {
        destination: selectedClip.url,
        permanent: true,
      },
    };
  } catch (e) {
    return {
      notFound: true,
    };
  }
}

export default Redirect;
