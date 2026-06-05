/** Open Graph / Twitter preview image (matrix logo on dark grain). */
export const SABAGIRO_SHARE_IMAGE = {
  path: '/club/sabagiro-share.jpg',
  width: 1024,
  height: 823,
  alt: 'Sabagiro — Night · Concrete · Sound',
} as const;

export function shareImageOpenGraph() {
  return [
    {
      url: SABAGIRO_SHARE_IMAGE.path,
      width: SABAGIRO_SHARE_IMAGE.width,
      height: SABAGIRO_SHARE_IMAGE.height,
      alt: SABAGIRO_SHARE_IMAGE.alt,
    },
  ];
}

export function shareImageTwitter() {
  return [SABAGIRO_SHARE_IMAGE.path];
}
