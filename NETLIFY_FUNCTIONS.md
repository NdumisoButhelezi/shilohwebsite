# Netlify Functions Setup Guide

## Overview
This project uses Netlify Functions (serverless functions) instead of Firebase Cloud Functions to save costs. Netlify Functions are **free** for up to 125,000 requests and 100 hours of runtime per month.

## Cost Comparison

**Firebase Cloud Functions:**
- First 2M invocations/month: FREE
- After that: $0.40 per million invocations
- Memory/CPU costs apply
- Cold start delays

**Netlify Functions:**
- 125,000 requests/month: FREE
- 100 hours runtime/month: FREE
- After that: $25/month for additional usage
- Built into Netlify deployment
- No cold start on Pro plan

## What Functions Are Included

### 1. Delete User (`netlify/functions/delete-user.ts`)
- Deletes a user from Firebase Auth and Firestore
- Admin-only operation
- Used by the Admins page

## Setup Instructions

### 1. Get Firebase Admin SDK Credentials

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to **Project Settings** (gear icon) > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 2. Add Credentials to Environment

Add these to your `.env` file (locally) and Netlify environment variables:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Your private key here (with \n for newlines)
-----END PRIVATE KEY-----"
```

**Important**: For the private key:
- Keep it on one line
- Use `\n` for line breaks
- Wrap in quotes
- In Netlify, paste exactly as shown in the JSON file

### 3. Set Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site
3. Go to **Site settings** > **Environment variables**
4. Add each variable:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (paste the entire key with `\n` characters)

### 4. Deploy

Netlify will automatically:
- Detect the functions in `netlify/functions/`
- Build and deploy them
- Make them available at `/.netlify/functions/[function-name]`

## Usage in Code

### Delete User Example

```typescript
import { deleteUser } from '@/integrations/firebase/helpers';

// In your component
const handleDelete = async (userId: string) => {
  const { success, error } = await deleteUser(userId);
  
  if (success) {
    console.log('User deleted successfully');
  } else {
    console.error('Error:', error);
  }
};
```

The `deleteUser` helper automatically:
- Gets the current user's auth token
- Calls the Netlify function
- Handles errors

## Testing Locally

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Run Local Development

```bash
netlify dev
```

This starts:
- Vite dev server on port 5173 (or similar)
- Netlify Functions on port 8888

Functions will be available at:
- `http://localhost:8888/.netlify/functions/delete-user`

### 3. Test Function

```bash
# Get your Firebase ID token first (from browser dev tools)
curl -X POST http://localhost:8888/.netlify/functions/delete-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"userId": "user_id_to_delete"}'
```

## Adding New Functions

### 1. Create Function File

Create a new file in `netlify/functions/`:

```typescript
// netlify/functions/my-function.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Netlify!' })
  };
};
```

### 2. Use in Frontend

```typescript
const response = await fetch('/.netlify/functions/my-function', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'your data' })
});
```

## Security Best Practices

1. **Always verify auth token** in functions
2. **Check user permissions** before operations
3. **Validate input data** thoroughly
4. **Never expose private keys** in client code
5. **Use environment variables** for all credentials
6. **Rate limit** if handling sensitive operations

## Troubleshooting

### "Missing Firebase credentials"
- Check environment variables are set in Netlify
- Verify private key format (should have `\n` for newlines)
- Ensure no extra spaces or quotes

### "Function not found"
- Check file is in `netlify/functions/` folder
- Verify function export: `export const handler: Handler`
- Re-deploy to Netlify

### "Unauthorized" errors
- User must be signed in to call functions
- Token must be included in Authorization header
- Check Firebase security rules

### Cold starts
- First request after inactivity may be slow
- Netlify Pro eliminates cold starts
- Consider keeping functions warm with a cron job

## Monitoring

### Netlify Dashboard
- View function logs in real-time
- See request/response data
- Monitor error rates
- Track bandwidth usage

### Firebase Console
- Monitor Auth operations
- Check Firestore usage
- View security rule evaluations

## Cost Optimization Tips

1. **Combine operations** when possible
2. **Cache results** on client side
3. **Use Firestore security rules** instead of functions when possible
4. **Batch operations** to reduce function calls
5. **Monitor usage** regularly

## Next Steps

- Add more functions as needed
- Set up monitoring alerts
- Implement rate limiting
- Add logging and analytics
- Consider upgrading to Netlify Pro for zero cold starts

---

**Free Tier Limits:**
- 125,000 function invocations/month
- 100 hours function runtime/month
- More than enough for small to medium sites!

For questions or issues, check:
- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
