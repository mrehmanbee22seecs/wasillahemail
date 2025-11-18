// Media Service - Cloudinary Integration
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import type { Media, MediaUploadOptions } from '../types/cms';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

/**
 * Upload media file to Cloudinary
 */
export async function uploadMedia(
  file: File,
  userId: string,
  userName: string,
  options: MediaUploadOptions = {}
): Promise<Media> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  if (options.tags) {
    formData.append('tags', options.tags.join(','));
  }

  // Upload to Cloudinary
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload media to Cloudinary');
  }

  const data = await response.json();

  // Save media metadata to Firestore
  const media: Omit<Media, 'id'> = {
    fileName: file.name,
    url: data.secure_url,
    publicId: data.public_id,
    type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
    format: data.format,
    size: data.bytes,
    width: data.width,
    height: data.height,
    uploaderId: userId,
    uploaderName: userName,
    uploadedAt: new Date(),
    tags: options.tags || [],
    folder: options.folder || 'default',
    usageCount: 0,
    usedIn: [],
  };

  const docRef = await addDoc(collection(db, 'media'), media);

  return {
    id: docRef.id,
    ...media,
  };
}

/**
 * Bulk upload multiple media files
 */
export async function bulkUploadMedia(
  files: File[],
  userId: string,
  userName: string,
  options: MediaUploadOptions = {}
): Promise<Media[]> {
  const uploadPromises = files.map(file => uploadMedia(file, userId, userName, options));
  return Promise.all(uploadPromises);
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  const {
    width = 800,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  let transformations = `q_${quality},f_${format}`;
  
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height},c_${crop}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

/**
 * Generate responsive image srcset
 */
export function generateResponsiveSrcSet(publicId: string): string {
  const widths = [320, 640, 768, 1024, 1280, 1920];
  return widths
    .map(width => `${getOptimizedImageUrl(publicId, { width })} ${width}w`)
    .join(', ');
}

/**
 * Get all media files
 */
export async function getAllMedia(
  filters: {
    type?: 'image' | 'video' | 'document';
    tags?: string[];
    folder?: string;
    uploaderId?: string;
  } = {},
  limitCount: number = 50
): Promise<Media[]> {
  let q = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'), limit(limitCount));

  if (filters.type) {
    q = query(q, where('type', '==', filters.type));
  }

  if (filters.folder) {
    q = query(q, where('folder', '==', filters.folder));
  }

  if (filters.uploaderId) {
    q = query(q, where('uploaderId', '==', filters.uploaderId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Media));
}

/**
 * Search media by filename or tags
 */
export async function searchMedia(searchTerm: string): Promise<Media[]> {
  const allMedia = await getAllMedia({}, 100);
  
  const lowerSearch = searchTerm.toLowerCase();
  return allMedia.filter(media =>
    media.fileName.toLowerCase().includes(lowerSearch) ||
    media.tags.some(tag => tag.toLowerCase().includes(lowerSearch))
  );
}

/**
 * Update media metadata
 */
export async function updateMediaMetadata(
  mediaId: string,
  updates: Partial<Pick<Media, 'tags' | 'alt' | 'caption' | 'fileName'>>
): Promise<void> {
  const mediaRef = doc(db, 'media', mediaId);
  await updateDoc(mediaRef, updates);
}

/**
 * Delete media
 */
export async function deleteMedia(mediaId: string, publicId: string): Promise<void> {
  // Delete from Cloudinary
  // Note: Requires signed request with API secret - implement server-side
  // For now, just delete from Firestore
  await deleteDoc(doc(db, 'media', mediaId));
}

/**
 * Track media usage
 */
export async function trackMediaUsage(mediaId: string, contentId: string): Promise<void> {
  const mediaRef = doc(db, 'media', mediaId);
  const mediaDoc = await getDocs(query(collection(db, 'media'), where('__name__', '==', mediaId)));
  
  if (!mediaDoc.empty) {
    const media = mediaDoc.docs[0].data() as Media;
    const usedIn = media.usedIn || [];
    
    if (!usedIn.includes(contentId)) {
      await updateDoc(mediaRef, {
        usageCount: (media.usageCount || 0) + 1,
        usedIn: [...usedIn, contentId],
      });
    }
  }
}
