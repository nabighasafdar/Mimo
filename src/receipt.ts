import {FunctionsHttpError} from '@supabase/supabase-js';
import {launchCamera, launchImageLibrary, CameraOptions} from 'react-native-image-picker';
import {CategoryKey} from './categories';
import {supabase} from './supabase';

// Receipt photos are read by the `read-receipt` Edge Function (supabase/functions), which
// holds the Anthropic key. The app only sends the photo and gets the items back.

export type ReceiptItem = {name: string; amount: number; category: CategoryKey};

export type Receipt = {
  merchant: string;
  /** YYYY-MM-DD, or '' when the receipt has no readable date. */
  date: string;
  currency: string;
  total: number;
  items: ReceiptItem[];
};

type Photo = {base64: string; mediaType: string};

// Big enough to read small print, small enough to upload quickly on mobile data.
const PHOTO_OPTIONS: CameraOptions = {
  mediaType: 'photo',
  includeBase64: true,
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.7,
};

/** Opens the camera or the gallery. Resolves null if the user backs out. */
export async function pickPhoto(source: 'camera' | 'gallery'): Promise<Photo | null> {
  const res =
    source === 'camera'
      ? await launchCamera({...PHOTO_OPTIONS, saveToPhotos: false})
      : await launchImageLibrary({...PHOTO_OPTIONS, selectionLimit: 1});
  if (res.didCancel) {
    return null;
  }
  if (res.errorCode) {
    throw new Error(
      res.errorCode === 'camera_unavailable'
        ? 'This device has no camera. Choose a photo from the gallery instead.'
        : res.errorCode === 'permission'
        ? 'Mimo needs permission to use the camera and photos. Allow it in Settings.'
        : res.errorMessage ?? 'Could not open the photo.',
    );
  }
  const asset = res.assets?.[0];
  if (!asset?.base64) {
    return null;
  }
  return {base64: asset.base64, mediaType: asset.type ?? 'image/jpeg'};
}

/** Sends the photo to the receipt reader. Throws with a message fit to show the user. */
export async function readReceipt(photo: Photo): Promise<Receipt> {
  const {data, error} = await supabase.functions.invoke('read-receipt', {
    body: {image: photo.base64, mediaType: photo.mediaType},
  });
  if (error) {
    let message = 'Could not reach Mimo. Check your internet and try again.';
    if (error instanceof FunctionsHttpError) {
      if (error.context.status === 401) {
        message = 'Please log in again to scan receipts.';
      } else {
        const body = await error.context.json().catch(() => null);
        message = body?.error ?? message;
      }
    }
    throw new Error(message);
  }
  if (!data?.is_receipt) {
    throw new Error("That doesn't look like a receipt or bill. Try another photo.");
  }
  const items: ReceiptItem[] = (data.items ?? []).filter(
    (i: ReceiptItem) => Number.isFinite(i.amount) && i.amount > 0,
  );
  if (!items.length) {
    throw new Error("I couldn't find any amounts on that receipt. Try a clearer photo.");
  }
  return {
    merchant: data.merchant || 'Receipt',
    date: data.date,
    currency: data.currency,
    total: data.total || items.reduce((s, i) => s + i.amount, 0),
    items,
  };
}

/**
 * Asks the same AI to turn what the user said into expenses and pick each one's category.
 * Throws when it can't be reached, so the caller can fall back to the on-device parser.
 */
export async function readSpoken(text: string): Promise<ReceiptItem[]> {
  const {data, error} = await supabase.functions.invoke('read-receipt', {body: {text}});
  if (error) {
    throw error;
  }
  return (data?.items ?? []).filter(
    (i: ReceiptItem) => Number.isFinite(i.amount) && i.amount > 0 && i.name,
  );
}
