// Firestore - Church data collections
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../client';

// Collection names
const EVENTS_COLLECTION = 'events';
const VIDEOS_COLLECTION = 'videos';
const CONTACT_SUBMISSIONS_COLLECTION = 'contact_submissions';
const CHURCH_INFO_COLLECTION = 'church_info';
const SERVICE_TIMES_COLLECTION = 'service_times';
const GALLERY_ALBUMS_COLLECTION = 'gallery_albums';
const GALLERY_IMAGES_COLLECTION = 'gallery_images';

// Event types
export interface Event {
  id?: string;
  title: string;
  description?: string;
  eventDate: Date | Timestamp;
  startTime: string;
  endTime?: string;
  location?: string;
  eventType?: string;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Video types
export interface Video {
  id?: string;
  title: string;
  youtubeVideoId: string;
  description?: string;
  thumbnailUrl?: string;
  eventId?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Contact submission types
export interface ContactSubmission {
  id?: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: Date | Timestamp;
}

// Church info types
export interface ChurchInfo {
  id?: string;
  churchName: string;
  address?: string;
  phone?: string;
  email?: string;
  missionStatement?: string;
  visionStatement?: string;
  youtubeChannelUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  googleMapsEmbedUrl?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Service time types
export interface ServiceTime {
  id?: string;
  serviceName: string;
  dayOfWeek: string;
  startTime: string;
  endTime?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date | Timestamp;
}

// Gallery types
export interface GalleryAlbum {
  id?: string;
  title: string;
  description?: string;
  eventId?: string | null;
  coverImageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface GalleryImage {
  id?: string;
  albumId: string;
  imageUrl: string;
  imageData?: string; // base64 compressed image
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  displayOrder: number;
  uploadedBy?: string;
  createdAt: Date | Timestamp;
}

// ===== EVENTS =====

export const getActiveEvents = async (): Promise<Event[]> => {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const q = query(eventsRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  
  console.log('Fetched active events:', events.length, events);
  
  // Sort by eventDate in JavaScript instead of Firestore to avoid composite index requirement
  return events.sort((a, b) => {
    const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
    const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
    return dateA.getTime() - dateB.getTime();
  });
};

export const getAllEvents = async (): Promise<Event[]> => {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const snapshot = await getDocs(eventsRef);
  const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  
  // Sort by eventDate descending in JavaScript
  return events.sort((a, b) => {
    const dateA = a.eventDate instanceof Date ? a.eventDate : (a.eventDate as any).toDate();
    const dateB = b.eventDate instanceof Date ? b.eventDate : (b.eventDate as any).toDate();
    return dateB.getTime() - dateA.getTime();
  });
};

export const createEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const docRef = await addDoc(eventsRef, {
    ...event,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateEvent = async (eventId: string, data: Partial<Event>): Promise<void> => {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await deleteDoc(eventRef);
};

// ===== VIDEOS =====

export const getActiveVideos = async (): Promise<Video[]> => {
  const videosRef = collection(db, VIDEOS_COLLECTION);
  const q = query(videosRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);
  const videos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Video));
  try {
    // eslint-disable-next-line no-console
    console.log('getActiveVideos - count:', videos.length);
    // eslint-disable-next-line no-console
    if (videos.length > 0) console.log('getActiveVideos first:', videos[0]);
  } catch (e) {}
  return videos.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const getAllVideos = async (): Promise<Video[]> => {
  const videosRef = collection(db, VIDEOS_COLLECTION);
  const q = query(videosRef, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
};

export const createVideo = async (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const videosRef = collection(db, VIDEOS_COLLECTION);
  const thumbnailUrl = video.youtubeVideoId ? `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg` : undefined;
  const docRef = await addDoc(videosRef, {
    ...video,
    thumbnailUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateVideo = async (videoId: string, data: Partial<Video>): Promise<void> => {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  const updateData: any = { ...data };
  if (data.youtubeVideoId && !data.thumbnailUrl) {
    updateData.thumbnailUrl = `https://img.youtube.com/vi/${data.youtubeVideoId}/hqdefault.jpg`;
  }
  updateData.updatedAt = serverTimestamp();
  await updateDoc(videoRef, updateData);
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  await deleteDoc(videoRef);
};

// ===== CONTACT SUBMISSIONS =====

export const createContactSubmission = async (
  submission: Omit<ContactSubmission, 'id' | 'isRead' | 'createdAt'>
): Promise<string> => {
  const submissionsRef = collection(db, CONTACT_SUBMISSIONS_COLLECTION);
  const docRef = await addDoc(submissionsRef, {
    ...submission,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getContactSubmissions = async (onlyUnread = false): Promise<ContactSubmission[]> => {
  const submissionsRef = collection(db, CONTACT_SUBMISSIONS_COLLECTION);
  let q = query(submissionsRef, orderBy('createdAt', 'desc'));
  
  if (onlyUnread) {
    q = query(submissionsRef, where('isRead', '==', false), orderBy('createdAt', 'desc'));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactSubmission));
};

export const markContactSubmissionAsRead = async (submissionId: string): Promise<void> => {
  const submissionRef = doc(db, CONTACT_SUBMISSIONS_COLLECTION, submissionId);
  await updateDoc(submissionRef, { isRead: true });
};

export const deleteContactSubmission = async (submissionId: string): Promise<void> => {
  const submissionRef = doc(db, CONTACT_SUBMISSIONS_COLLECTION, submissionId);
  await deleteDoc(submissionRef);
};

// ===== CHURCH INFO =====

export const getChurchInfo = async (): Promise<ChurchInfo | null> => {
  const churchInfoRef = collection(db, CHURCH_INFO_COLLECTION);
  const q = query(churchInfoRef, limit(1));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as ChurchInfo;
  }
  return null;
};

export const updateChurchInfo = async (data: Partial<ChurchInfo>): Promise<void> => {
  const churchInfo = await getChurchInfo();
  
  if (churchInfo?.id) {
    const churchInfoRef = doc(db, CHURCH_INFO_COLLECTION, churchInfo.id);
    await updateDoc(churchInfoRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create if doesn't exist
    const churchInfoRef = collection(db, CHURCH_INFO_COLLECTION);
    await addDoc(churchInfoRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

// ===== SERVICE TIMES =====

export const getActiveServiceTimes = async (): Promise<ServiceTime[]> => {
  const serviceTimesRef = collection(db, SERVICE_TIMES_COLLECTION);
  const q = query(
    serviceTimesRef,
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceTime));
};

export const getAllServiceTimes = async (): Promise<ServiceTime[]> => {
  const serviceTimesRef = collection(db, SERVICE_TIMES_COLLECTION);
  const q = query(serviceTimesRef, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceTime));
};

export const createServiceTime = async (
  serviceTime: Omit<ServiceTime, 'id' | 'createdAt'>
): Promise<string> => {
  const serviceTimesRef = collection(db, SERVICE_TIMES_COLLECTION);
  const docRef = await addDoc(serviceTimesRef, {
    ...serviceTime,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateServiceTime = async (
  serviceTimeId: string,
  data: Partial<ServiceTime>
): Promise<void> => {
  const serviceTimeRef = doc(db, SERVICE_TIMES_COLLECTION, serviceTimeId);
  await updateDoc(serviceTimeRef, data);
};

export const deleteServiceTime = async (serviceTimeId: string): Promise<void> => {
  const serviceTimeRef = doc(db, SERVICE_TIMES_COLLECTION, serviceTimeId);
  await deleteDoc(serviceTimeRef);
};

// ===== GALLERY =====

export const getActiveGalleryAlbums = async (): Promise<GalleryAlbum[]> => {
  const albumsRef = collection(db, GALLERY_ALBUMS_COLLECTION);
  const q = query(albumsRef, where('isActive', '==', true));
  const snapshot = await getDocs(q);
  const albums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryAlbum));
  // Sort by displayOrder in JavaScript to avoid composite index requirement
  return albums.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const getGalleryImagesByAlbum = async (albumId: string): Promise<GalleryImage[]> => {
  const imagesRef = collection(db, GALLERY_IMAGES_COLLECTION);
  // Query images for album and sort in JS to avoid composite index issues
  const q = query(imagesRef, where('albumId', '==', albumId));
  const snapshot = await getDocs(q);
  const images = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GalleryImage));
  // Debugging: log fetch results (visible in browser console)
  try {
    // eslint-disable-next-line no-console
    console.log('getGalleryImagesByAlbum - albumId:', albumId, 'count:', images.length);
    // eslint-disable-next-line no-console
    if (images.length > 0) console.log('getGalleryImagesByAlbum first:', images[0]);
  } catch (e) {
    // ignore logging errors
  }
  return images.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const createGalleryAlbum = async (
  album: Omit<GalleryAlbum, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const albumsRef = collection(db, GALLERY_ALBUMS_COLLECTION);
  const docRef = await addDoc(albumsRef, {
    ...album,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const createGalleryImage = async (
  image: Omit<GalleryImage, 'id' | 'createdAt'>
): Promise<string> => {
  const imagesRef = collection(db, GALLERY_IMAGES_COLLECTION);
  const docRef = await addDoc(imagesRef, {
    ...image,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
export const getAllGalleryAlbums = async (): Promise<GalleryAlbum[]> => {
  const albumsRef = collection(db, GALLERY_ALBUMS_COLLECTION);
  const snapshot = await getDocs(albumsRef);
  const albums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryAlbum));
  // Sort by displayOrder in JavaScript to avoid index requirement
  return albums.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
};

export const updateGalleryAlbum = async(
  albumId: string,
  data: Partial<Omit<GalleryAlbum, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const albumRef = doc(db, GALLERY_ALBUMS_COLLECTION, albumId);
  await updateDoc(albumRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteGalleryAlbum = async (albumId: string): Promise<void> => {
  // First delete all images in the album
  const imagesRef = collection(db, GALLERY_IMAGES_COLLECTION);
  const q = query(imagesRef, where('albumId', '==', albumId));
  const snapshot = await getDocs(q);
  
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  
  // Then delete the album
  const albumRef = doc(db, GALLERY_ALBUMS_COLLECTION, albumId);
  await deleteDoc(albumRef);
};

export const deleteGalleryImage = async (imageId: string): Promise<void> => {
  const imageRef = doc(db, GALLERY_IMAGES_COLLECTION, imageId);
  await deleteDoc(imageRef);
};

export const updateImageOrder = async (
  imageId: string,
  displayOrder: number
): Promise<void> => {
  const imageRef = doc(db, GALLERY_IMAGES_COLLECTION, imageId);
  await updateDoc(imageRef, { displayOrder });
};