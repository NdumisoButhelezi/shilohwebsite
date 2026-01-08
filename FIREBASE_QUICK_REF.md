# 🔥 Firebase Quick Reference Card

## Authentication

### Hook
```typescript
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

const { user, isAdmin, isLoading, signIn, signInWithGoogle, signUp, signOut } = useFirebaseAuth();
```

### Sign In
```typescript
const { error } = await signIn(email, password, rememberMe);
```

### Sign Up
```typescript
const { error, userId } = await signUp(email, password, displayName);
```

### Google OAuth
```typescript
const { error } = await signInWithGoogle(rememberMe);
```

### Sign Out
```typescript
await signOut();
```

---

## Firestore - Users

```typescript
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  getUserRole,
  isUserAdmin,
  setUserRole,
  createAdminRequest,
  getAdminRequestStatus,
  getPendingAdminRequests,
  updateAdminRequest
} from '@/integrations/firebase/firestore/users';
```

### Examples
```typescript
// Get user profile
const profile = await getUserProfile(userId);

// Check if user is admin
const isAdmin = await isUserAdmin(userId);

// Create admin request
await createAdminRequest(userId, email);

// Get pending requests
const requests = await getPendingAdminRequests();

// Approve request
await updateAdminRequest(userId, 'approved', reviewerId);
```

---

## Firestore - Church Data

```typescript
import {
  // Events
  getActiveEvents,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  
  // Videos
  getActiveVideos,
  getAllVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  
  // Contact
  createContactSubmission,
  getContactSubmissions,
  markContactSubmissionAsRead,
  deleteContactSubmission,
  
  // Church Info
  getChurchInfo,
  updateChurchInfo,
  
  // Service Times
  getActiveServiceTimes,
  getAllServiceTimes,
  createServiceTime,
  updateServiceTime,
  deleteServiceTime,
  
  // Gallery
  getActiveGalleryAlbums,
  getGalleryImagesByAlbum,
  createGalleryAlbum,
  createGalleryImage
} from '@/integrations/firebase/firestore/church';
```

### Examples
```typescript
// Get events
const events = await getActiveEvents();

// Create event
const eventId = await createEvent({
  title: 'Sunday Service',
  description: 'Weekly worship',
  eventDate: new Date('2026-01-15'),
  startTime: '09:00',
  endTime: '12:00',
  location: 'Main Sanctuary',
  eventType: 'weekly',
  isActive: true
});

// Update event
await updateEvent(eventId, { title: 'New Title' });

// Delete event
await deleteEvent(eventId);
```

---

## React Query Patterns

### Fetch Data
```typescript
const { data: events = [], isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: getActiveEvents
});
```

### Create Mutation
```typescript
const createMutation = useMutation({
  mutationFn: createEvent,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    toast.success('Event created!');
  },
  onError: (error) => {
    toast.error(`Failed: ${error.message}`);
  }
});
```

### Update Mutation
```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => 
    updateEvent(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }
});
```

### Delete Mutation
```typescript
const deleteMutation = useMutation({
  mutationFn: deleteEvent,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }
});
```

---

## Protected Routes

```typescript
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user, isAdmin, isLoading } = useFirebaseAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user || !isAdmin) return <Navigate to="/auth" />;
  
  return children;
}
```

---

## Realtime Listeners

```typescript
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

useEffect(() => {
  const q = query(
    collection(db, 'events'),
    where('isActive', '==', true)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New event:', change.doc.data());
      }
    });
  });
  
  return () => unsubscribe();
}, []);
```

---

## Common Patterns

### Check Auth Status
```typescript
const { user, isAdmin, isLoading } = useFirebaseAuth();

if (isLoading) return <Loader />;
if (!user) return <LoginPrompt />;
if (!isAdmin) return <Unauthorized />;
```

### Handle Timestamps
```typescript
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

// Firestore uses Timestamp objects
const date = event.createdAt instanceof Timestamp 
  ? event.createdAt.toDate() 
  : event.createdAt;

const formatted = format(date, 'MMMM d, yyyy');
```

### Error Handling
```typescript
try {
  await createEvent(eventData);
  toast.success('Created!');
} catch (error) {
  console.error('Error:', error);
  toast.error(error instanceof Error ? error.message : 'Failed');
}
```

---

## Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## Useful Commands

```bash
# Install Firebase
bun add firebase

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Initialize Firebase Functions
firebase init functions

# Deploy Cloud Functions
firebase deploy --only functions

# Start Firebase Emulators
firebase emulators:start
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module firebase" | Run `bun add firebase` |
| Env vars not loading | Restart dev server |
| Permission denied | Deploy security rules |
| Popup blocked | Allow popups or use redirect |
| User not admin | Check Firestore user_roles collection |

---

## File Locations

```
src/
├── integrations/firebase/
│   ├── config.ts           # Firebase config
│   ├── client.ts           # Initialization
│   ├── auth.ts             # Auth functions
│   ├── admin.ts            # Admin operations
│   └── firestore/
│       ├── users.ts        # User management
│       └── church.ts       # Church data
├── hooks/
│   └── useFirebaseAuth.tsx # Auth hook
└── pages/
    ├── FirebaseAuth.tsx    # Auth page
    └── admin/
        └── FirebaseEventsExample.tsx  # Migration example
```

---

## Key Differences: Supabase vs Firebase

| Supabase | Firebase |
|----------|----------|
| `supabase.from('table')` | Service function call |
| `user.id` | `user.uid` |
| PostgreSQL | Firestore (NoSQL) |
| RLS Policies | Security Rules |
| Edge Functions | Cloud Functions |
| Realtime channels | onSnapshot listeners |

---

## Migration Pattern

```typescript
// BEFORE (Supabase)
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('is_active', true);

// AFTER (Firebase)
const events = await getActiveEvents();
```

---

**Keep this card handy while migrating! 🔥**

For detailed docs: See FIREBASE_INTEGRATION.md
