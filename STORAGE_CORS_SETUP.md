# Firebase Storage CORS Setup

The CORS error you're seeing is because Firebase Storage needs to be configured to allow cross-origin requests from your development server.

## To fix the CORS issue:

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # On macOS with Homebrew
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Login to Google Cloud**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project fusion-fc
   ```

4. **Apply the CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://fusion-fc.appspot.com
   ```

   Or if your storage bucket has a different name:
   ```bashwhat do we need ot dot
   gsutil cors set cors.json gs://YOUR-STORAGE-BUCKET-NAME
   ```

5. **Verify CORS is set**:
   ```bash
   gsutil cors get gs://fusion-fc.appspot.com
   ```

## Alternative: Firebase Storage Rules

If you're still in development, you can also temporarily update your Firebase Storage rules to allow public read access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rest of your rules...
  }
}
```

## Note for Production

Before going to production:
1. Update `cors.json` to include your production domain
2. Remove `localhost` URLs from CORS configuration
3. Tighten storage rules to require authentication