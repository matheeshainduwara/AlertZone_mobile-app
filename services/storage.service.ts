import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';

/** Target size in MB we try to compress images down to */
const COMPRESS_TARGET_MB = 2;

/**
 * Helper function to convert a local file/content URI to a Blob using XMLHttpRequest.
 * Standard fetch() fails on local file:// or content:// URIs in standalone React Native APK builds.
 */
const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error('❌ uriToBlob failed for uri:', uri, e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

/**
 * Compresses an image iteratively until it is under COMPRESS_TARGET_MB (2 MB).
 * Tries progressively lower quality levels and smaller widths to guarantee the target.
 * @param uri The local URI of the image
 * @returns The compressed local URI
 */
export const compressImage = async (uri: string): Promise<string> => {
  // Ordered compression attempts: [maxWidth, quality]
  const attempts: [number, number][] = [
    [1200, 0.70],
    [1000, 0.55],
    [800,  0.40],
    [600,  0.25],
  ];

  for (const [width, quality] of attempts) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width } }],
        { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
      );
      const blob = await uriToBlob(result.uri);
      const sizeMb = blob.size / (1024 * 1024);
      console.log(`🗜️ Compressed to ${width}px @ q${quality}: ${sizeMb.toFixed(2)} MB`);
      if (sizeMb <= COMPRESS_TARGET_MB) {
        return result.uri;
      }
    } catch (error) {
      console.error(`❌ Compression attempt [${width}, ${quality}] error:`, error);
    }
  }

  // Last resort: return the result from the lowest quality attempt
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 600 } }],
      { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('❌ Final compression fallback error:', error);
    return uri;
  }
};

/**
 * Gets the size of a local file in MB.
 * @param uri Local URI
 * @returns Size in MB, or null on error
 */
export const getFileSizeMb = async (uri: string): Promise<number | null> => {
  try {
    const blob = await uriToBlob(uri);
    return blob.size / (1024 * 1024);
  } catch (error) {
    console.error('❌ Size check error:', error);
    return null;
  }
};

/**
 * Checks if a file is under the size limit.
 * @param uri Local URI
 * @param maxSizeMb Max size in MB (default: 5)
 */
export const isUnderSizeLimit = async (uri: string, maxSizeMb: number = 5): Promise<boolean> => {
  const sizeMb = await getFileSizeMb(uri);
  if (sizeMb === null) return false;
  return sizeMb <= maxSizeMb;
};

/**
 * Uploads a file to Firebase Storage and returns its public download URL.
 * @param uri Local URI
 * @param path Path in storage (e.g., 'reports/abc/image1.jpg')
 */
export const uploadFile = async (uri: string, path: string): Promise<string> => {
  try {
    const blob = await uriToBlob(uri);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};
