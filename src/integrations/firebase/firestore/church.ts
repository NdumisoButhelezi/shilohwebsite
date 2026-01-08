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
  const q = query(
    eventsRef,
    where('isActive', '==', true),
    orderBy('eventDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
};

export const getAllEvents = async (): Promise<Event[]> => {
  const eventsRef = collection(db, EVENTS_COLLECTION);
  const q = query(eventsRef, orderBy('eventDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
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
  const q = query(
    videosRef,
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
};

export const getAllVideos = async (): Promise<Video[]> => {
  const videosRef = collection(db, VIDEOS_COLLECTION);
  const q = query(videosRef, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
};

export const createVideo = async (video: Omit<Video, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const videosRef = collection(db, VIDEOS_COLLECTION);
  const docRef = await addDoc(videosRef, {
    ...video,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateVideo = async (videoId: string, data: Partial<Video>): Promise<void> => {
  const videoRef = doc(db, VIDEOS_COLLECTION, videoId);
  await updateDoc(videoRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
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
  const q = query(
    albumsRef,
    where('isActive', '==', true),
    orderBy('displayOrder', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryAlbum));
};

export const getGalleryImagesByAlbum = async (albumId: string): Promise<GalleryImage[]> => {
  const imagesRef = collection(db, GALLERY_IMAGES_COLLECTION);
  const q = query(
    imagesRef,
    where('albumId', '==', albumId),
    orderBy('displayOrder', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage));
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
  const q = query(albumsRef, orderBy('displayOrder', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryAlbum));
};

export const updateGalleryAlbum = async (
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