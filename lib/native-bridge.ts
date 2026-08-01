/** Native shell bridges (iOS WKWebView / Android WebView). */

type SabagiroAndroidBridge = {
  saveImageToGallery?: (base64: string, filename: string) => boolean;
};

type SabagiroIosHandlers = {
  sabagiroSaveImage?: { postMessage: (body: { base64: string; filename: string }) => void };
};

function androidBridge(): SabagiroAndroidBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { SabagiroApp?: SabagiroAndroidBridge }).SabagiroApp;
}

function iosHandlers(): SabagiroIosHandlers | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { webkit?: { messageHandlers?: SabagiroIosHandlers } }).webkit
    ?.messageHandlers;
}

export function canNativeSaveImageToPhotos(): boolean {
  return Boolean(
    androidBridge()?.saveImageToGallery || iosHandlers()?.sabagiroSaveImage,
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Save PNG into the device photo library (native apps only). */
export async function nativeSaveImageToPhotos(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  const base64 = await blobToBase64(blob);
  const android = androidBridge();
  if (typeof android?.saveImageToGallery === 'function') {
    return Boolean(android.saveImageToGallery(base64, filename));
  }
  const ios = iosHandlers()?.sabagiroSaveImage;
  if (ios) {
    ios.postMessage({ base64, filename });
    return true;
  }
  return false;
}
