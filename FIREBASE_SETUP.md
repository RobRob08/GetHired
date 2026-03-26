# Firebase setup (mobile)

## 1) Firebase Console

1. Create a Firebase project.
2. Enable `Authentication > Sign-in method > Email/Password`.
3. Create `Firestore Database` (Production mode).
4. Add an app and copy Firebase config values.

## 2) Environment variables

1. Copy `.env.example` to `.env`.
2. Fill all `EXPO_PUBLIC_FIREBASE_*` values.
3. For Google Sign-In, fill:
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
4. In Firebase Console, enable `Authentication > Sign-in method > Google`.
5. In Google Cloud Console, create OAuth Client IDs for Web, Android, and iOS and copy them into `.env`.
6. Make sure the Android OAuth client uses the exact package name `com.cs.GetHired` and the correct SHA-1/SHA-256 from your signing key.
7. Restart Metro after editing `.env`.

## 3) Firestore collections used by app

- `users/{uid}`
  - `name` (string)
  - `email` (string)
  - `phone` (string)
  - `role` (string: `user`, `employer`, `admin`)
  - `createdAt` (timestamp)

- `jobs/{jobId}`
  - `title` (string)
  - `company` (string)
  - `salary` (string)
  - `type` (string)
  - `category` (string)
  - `location.lat` (number)
  - `location.lng` (number)
  - `createdBy` (string uid)
  - `active` (boolean)
  - `createdAt` (timestamp)

## 4) Security rules

1. Open Firestore rules.
2. Paste rules from `firestore.rules`.
3. Publish rules.

## 5) Admin bootstrap

- Register a normal account first.
- In Firestore `users/{uid}`, set `role` to `admin` manually for that account.

## 6) Validation checklist

- Register `user` and `employer` accounts from app.
- Login persists after app restart.
- Employer can create map pin.
- User and employer map both show created pin.
- Logout returns to auth stack.
