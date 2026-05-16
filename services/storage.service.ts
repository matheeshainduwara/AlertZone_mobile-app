import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compresses an image if it's over a certain size or just to optimize.
 * @param uri The local URI of the image
 * @returns The new local URI of the compressed image
 */
export const compressImage = async (uri: string): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize to a max width of 1200px
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.error('❌ Compression error:', error);
    return uri;
  }
};

/**
 * Checks if a file is under the size limit.
 * @param uri Local URI
 * @param maxSizeMb Max size in MB
 */
export const isUnderSizeLimit = async (uri: string, maxSizeMb: number = 2): Promise<boolean> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const sizeInMb = blob.size / (1024 * 1024);
    return sizeInMb <= maxSizeMb;
  } catch (error) {
    console.error('❌ Size check error:', error);
    return false;
  }
};

/**
 * Uploads a file to Firebase Storage.
 * @param uri Local URI
 * @param path Path in storage (e.g., 'reports/abc/image1.jpg')
 */
export const uploadFile = async (uri: string, path: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};
