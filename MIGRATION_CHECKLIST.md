# Firebase Migration Checklist

Use this checklist to track your Firebase migration progress.

## ✅ Phase 1: Initial Setup

- [ ] Install Firebase package: `bun add firebase`
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Email/Password authentication
- [ ] Enable Google OAuth authentication
- [ ] Create Firestore database (Production mode)
- [ ] Copy Firebase config from project settings
- [ ] Create `.env` file with Firebase credentials
- [ ] Deploy security rules from `firebase-security-rules.txt`
- [ ] Test Firebase connection (check browser console)

## ✅ Phase 2: Authentication Setup

- [ ] Import `FirebaseAuthProvider` in App.tsx
- [ ] Update route to use `FirebaseAuth.tsx` page
- [ ] Test email/password sign-up
- [ ] Test email/password sign-in
- [ ] Test Google OAuth sign-in
- [ ] Test "Remember Me" functionality
- [ ] Test sign-out functionality
- [ ] Create first admin user (manually in Firestore)
- [ ] Test admin access to dashboard
- [ ] Test non-admin user sees pending screen

## ✅ Phase 3: Admin Approval Workflow

- [ ] Sign up with new test account
- [ ] Verify admin request created in Firestore
- [ ] Test admin can see pending request
- [ ] Test admin can approve request
- [ ] Test approved user gains admin access
- [ ] Test reject functionality
- [ ] Test rejected user status

## ✅ Phase 4: Data Migration (One Collection at a Time)

### Events
- [ ] Export events from Supabase
- [ ] Import events to Firestore (manual or script)
- [ ] Update `Events.tsx` admin page to use Firebase
- [ ] Test create event
- [ ] Test read events
- [ ] Test update event
- [ ] Test delete event
- [ ] Test public events page shows Firebase data

### Videos
- [ ] Export videos from Supabase
- [ ] Import videos to Firestore
- [ ] Update `Videos.tsx` admin page
- [ ] Test CRUD operations
- [ ] Test public videos display

### Contact Submissions
- [ ] Export contact submissions from Supabase
- [ ] Import to Firestore
- [ ] Update `Messages.tsx` admin page
- [ ] Test marking as read
- [ ] Test deleting messages
- [ ] Test contact form submission

### Gallery
- [ ] Export gallery albums from Supabase
- [ ] Export gallery images from Supabase
- [ ] Import to Firestore
- [ ] Update `Gallery.tsx` admin page
- [ ] Test album CRUD
- [ ] Test image upload (if using Storage)
- [ ] Test public gallery display

### Church Info
- [ ] Export church info from Supabase
- [ ] Import to Firestore
- [ ] Update `Settings.tsx` admin page
- [ ] Test updating church info
- [ ] Test public display of church info

### Service Times
- [ ] Export service times from Supabase
- [ ] Import to Firestore
- [ ] Update relevant admin page
- [ ] Test CRUD operations
- [ ] Test public display

## ✅ Phase 5: Component Updates

- [ ] Update all instances of `useAuth` to `useFirebaseAuth`
- [ ] Update all Supabase queries to Firebase service functions
- [ ] Remove Supabase imports from components
- [ ] Update protected route components
- [ ] Test all public pages work with Firebase
- [ ] Test all admin pages work with Firebase

## ✅ Phase 6: Testing

### Authentication Testing
- [ ] Email sign-up works
- [ ] Email sign-in works
- [ ] Google sign-in works
- [ ] Password reset works (if implemented)
- [ ] Session persistence works
- [ ] Sign-out works
- [ ] Admin detection works
- [ ] Role-based access works

### Data Testing
- [ ] All CRUD operations work for events
- [ ] All CRUD operations work for videos
- [ ] All CRUD operations work for gallery
- [ ] Contact form submissions work
- [ ] Church info updates work
- [ ] Service times updates work

### Security Testing
- [ ] Non-authenticated users can't access admin pages
- [ ] Non-admin users can't access admin features
- [ ] Security rules prevent unauthorized writes
- [ ] Security rules allow authorized reads
- [ ] API keys are in environment variables (not committed)

### Performance Testing
- [ ] Pages load quickly
- [ ] No unnecessary re-fetches
- [ ] Loading states show appropriately
- [ ] Error states handle gracefully

## ✅ Phase 7: Production Preparation

- [ ] Environment variables set in production
- [ ] Firebase project configured for production domain
- [ ] Authorized domains added in Firebase Auth settings
- [ ] Firestore indexes created (if needed)
- [ ] Security rules reviewed and optimized
- [ ] Firebase Analytics enabled (optional)
- [ ] Firebase App Check enabled (recommended)
- [ ] Backup strategy in place
- [ ] Monitoring set up

## ✅ Phase 8: Deployment

- [ ] Deploy to staging environment
- [ ] Test all functionality in staging
- [ ] Fix any issues found
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Test critical paths in production
- [ ] Create first production admin user

## ✅ Phase 9: Post-Launch

- [ ] Monitor Firebase usage dashboard
- [ ] Check for any auth errors
- [ ] Check for any database errors
- [ ] Verify all features working
- [ ] Collect user feedback
- [ ] Document any issues

## ✅ Phase 10: Cleanup (After Confirmed Stable)

- [ ] Remove Supabase package dependency
- [ ] Remove Supabase integration files
- [ ] Remove old `useAuth.tsx` hook
- [ ] Remove old `Auth.tsx` page
- [ ] Clean up unused environment variables
- [ ] Archive Supabase data backup
- [ ] Update README with Firebase instructions
- [ ] Celebrate! 🎉

---

## 🚨 Rollback Plan (If Needed)

If you need to rollback to Supabase:

1. [ ] Revert App.tsx to use `AuthProvider`
2. [ ] Revert routes to use old `Auth.tsx`
3. [ ] Keep Firebase files for future retry
4. [ ] Document what went wrong
5. [ ] Plan fixes for next attempt

---

## 📝 Notes

Use this section to track issues, decisions, or important information:

```
Date: ___________
Issue: 
Solution: 

Date: ___________
Issue: 
Solution: 

Date: ___________
Issue: 
Solution: 
```

---

## 🆘 Need Help?

- Check `FIREBASE_INTEGRATION.md` for detailed guides
- Check `FIREBASE_QUICK_START.md` for quick reference
- Check `FIREBASE_ARCHITECTURE.md` for system design
- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs

---

**Migration Started**: ___________
**Migration Completed**: ___________
**Migrated By**: ___________
