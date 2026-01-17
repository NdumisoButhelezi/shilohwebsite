/**
 * Image Compression Utility
 * Compresses images to base64 format for Firestore storage
 * Optimizes images to stay within Firestore's 1MB document limit
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  outputFormat?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  outputFormat: 'jpeg',
};

/**
 * Compresses an image file to base64 string
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<string> - Base64 encoded image string
 */
export const compressImageToBase64 = async (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Check file size (warn if > 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.warn('Large image file detected. Compression may take longer.');
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > opts.maxWidth!) {
            width = opts.maxWidth!;
            height = width / aspectRatio;
          }

          if (height > opts.maxHeight!) {
            height = opts.maxHeight!;
            width = height * aspectRatio;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64
          const mimeType = `image/${opts.outputFormat}`;
          const base64String = canvas.toDataURL(mimeType, opts.quality);

          // Check if compressed size is reasonable (< 800KB to be safe)
          const sizeInBytes = (base64String.length * 3) / 4;
          const sizeInKB = sizeInBytes / 1024;

          console.log(`Compressed image size: ${sizeInKB.toFixed(2)}KB`);

          if (sizeInKB > 800) {
            console.warn('Compressed image is large. Consider reducing quality or dimensions.');
          }

          resolve(base64String);
        } catch (error) {
          reject(new Error('Failed to compress image'));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compresses multiple images to base64
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Promise<string[]> - Array of base64 encoded images
 */
export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<string[]> => {
  const compressionPromises = files.map((file) =>
    compressImageToBase64(file, options)
  );

  return Promise.all(compressionPromises);
};

/**
 * Extracts base64 data without the data URL prefix
 * @param base64String - Full base64 data URL string
 * @returns Base64 data only (without "data:image/...;base64," prefix)
 */
export const stripBase64Prefix = (base64String: string): string => {
  const match = base64String.match(/^data:image\/[a-z]+;base64,(.+)$/);
  return match ? match[1] : base64String;
};

/**
 * Adds base64 prefix back for display
 * @param base64Data - Base64 data without prefix
 * @param format - Image format (jpeg, png, webp)
 * @returns Full base64 data URL string
 */
export const addBase64Prefix = (
  base64Data: string,
  format: string = 'jpeg'
): string => {
  if (base64Data.startsWith('data:image/')) {
    return base64Data; // Already has prefix
  }
  return `data:image/${format};base64,${base64Data}`;
};

/**
 * Validates if a string is a valid base64 image
 * @param str - String to validate
 * @returns boolean
 */
export const isValidBase64Image = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  // Check if it has the data URL prefix
  const hasPrefix = str.startsWith('data:image/');
  
  // Check if it's a valid base64 string
  const base64Part = hasPrefix ? stripBase64Prefix(str) : str;
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  
  return base64Regex.test(base64Part);
};
