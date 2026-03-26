# GetHired Codebase - Comprehensive Analysis

## Overview

GetHired is a **React Native/Expo job marketplace application** connecting job seekers with employers. The app uses Firebase for authentication and real-time data sync via Firestore. It supports three distinct user roles: regular users (job seekers), employers, and admins, each with dedicated navigation flows.

---

## Table of Contents
1. [Entry Point & App Setup](#entry-point--app-setup)
2. [Firebase Configuration](#firebase-configuration)
3. [Navigation Architecture](#navigation-architecture)
4. [Services Layer](#services-layer)
5. [Custom Hooks](#custom-hooks)
6. [Authentication Screens](#authentication-screens)
7. [User Job Seeker Screens](#user-job-seeker-screens)
8. [Employer Screens](#employer-screens)
9. [Admin Screens](#admin-screens)
10. [Data Flow & Real-time Sync](#data-flow--real-time-sync)

---

## Entry Point & App Setup

### App.js
The root entry point that wraps the entire application with necessary context providers.

```javascript
// Key providers:
// 1. GestureHandlerRootView - Enables gesture detection (required by React Navigation & WebView)
// 2. SafeAreaProvider - Ensures UI respects notches, status bars, home indicators
// 3. StatusBar - Controls status bar appearance
// 4. AppNavigator - Central navigation hub
```

This structure ensures:
- Gestures work properly on navigation and interactive components
- Safe layouts on all device sizes (iPhone notches, Android bezels)
- Central routing logic managed by AppNavigator

---

## Firebase Configuration

### firebaseConfig.js
Initializes Firebase application, authentication, and Firestore database.

**Key Functions:**

`readEnv(key)` - Reads environment variables safely
- Retrieves Firebase credentials from .env file (marked as EXPO_PUBLIC_*)
- Returns empty string if not found, throws error if critical credentials missing

`initializeApp()` - Initializes Firebase application
- Checks if app already initialized (prevents duplicates on hot refresh)
- Uses getApps() to avoid reinitialization errors

`initializeAuth()` with React Native Persistence
- Uses AsyncStorage for persistent authentication
- Allows users to stay logged in after app restart
- Gracefully handles if auth already initialized

**Firestore collections structure:**
```
users/{uid}
├─ name, email, phone, role (user|employer|admin)
├─ profileCompleted (boolean)
├─ location (string - preferred job location)
├─ active (boolean)
└─ createdAt (timestamp)

jobs/{jobId}
├─ title, company, salary, type, category
├─ location: { lat, lng }
├─ createdBy (employer UID)
├─ active (boolean)
├─ flagged (boolean)
└─ createdAt (timestamp)

applications/{applicationId}
├─ jobId, jobTitle, jobSalary
├─ applicantId, applicantName, applicantEmail
├─ employerId, employerName
├─ status (Applied | Approved | Hired | Rejected)
├─ readByEmployer (boolean)
└─ createdAt, updatedAt (timestamps)

notifications/{notificationId}
├─ recipientId, senderId, message
├─ type (application_status, etc.)
├─ read (boolean)
└─ createdAt (timestamp)
```

---

## Navigation Architecture

### AppNavigator.js
The central routing hub that manages authentication state and role-based navigation.

**Core State:**
- `user` - Authenticated user object with uid, email, name, role, location, emailVerified, profileCompleted
- `authLoading` - Loading state during auth sync from Firestore

**Main Functions:**

`onAuthStateChanged()` - Firebase listener tracking login/logout
- Triggers when user logs in or out
- When user logs in: fetches profile from Firestore, syncs all user data
- When user logs out: clears user state
- Sets authLoading to false once profile data loaded

`onSnapshot(userRef)` - Real-time user profile listener
- Subscribes to user document in Firestore
- Automatically updates UI when user data changes (name, role, location, etc.)
- Syncs emailVerified status from Firebase Auth

Email Verification Poll (every 3 seconds):
- Checks if user has verified their email
- Calls auth.currentUser.reload() to refresh auth state
- Updates user state when verification complete
- Prevents users from accessing app before verifying email

Role-Based Navigation Flow:

```
NOT LOGGED IN
  ↓ Shows: Auth Stack (SplashScreen → Landing → Login/Register → VerifyEmail)
LOGGED IN + NOT VERIFIED
  ↓ Shows: VerifyEmailScreen (blocking - must verify first)
LOGGED IN + VERIFIED + PROFILE INCOMPLETE
  ↓ Shows: ProfileScreen (forced setup)
LOGGED IN + VERIFIED + PROFILE COMPLETE + ROLE="user"
  ↓ Shows: UserTabs Navigator (Home, Map, Track, Profile tabs)
LOGGED IN + VERIFIED + PROFILE COMPLETE + ROLE="employer"
  ↓ Shows: EmployerTabs Navigator (Dashboard, Map, Applicants, Profile tabs)
LOGGED IN + VERIFIED + PROFILE COMPLETE + ROLE="admin"
  ↓ Shows: AdminTabs Navigator (Overview, Users tabs)
```

**Tab Navigators (Role-Specific):**

`TabIcon({ name, focused })` - Helper component rendering tab icons
- Returns colored icon based on focused state
- Primary blue when active, mid-gray when inactive

`UserTabs({ user, onLogout })` - Bottom tab navigator for job seekers
- Home: Job feed, search, filtering by category
- Map: Location-based job browsing with interactive map
- Track: Application status dashboard with statistics
- Profile: User profile management and logout

`EmployerTabs({ user, onLogout })` - Bottom tab navigator for employers
- Dashboard: Overview of posted jobs and applicants
- Map: View created jobs on map, create new job pins
- Applicants: Manage incoming applications, update status
- Profile: Company profile management and logout

`AdminTabs({ onLogout })` - Simple admin navigation
- Overview: Platform statistics (users, jobs, applications)
- Users: User management interface with status toggling

`handleLogout()` - Signs out user and navigates to auth stack
- Calls auth.signOut() from Firebase
- Clears user state
- Navigates back to landing screen

---

## Services Layer

Services handle direct communication with Firebase and encapsulate business logic.

### jobsService.js
Manages job listings and creation.

**Functions:**

`toJob(docSnap)` - Converts Firestore document to job object
- Normalizes location data (handles both old latitude/longitude and new location.lat/lng formats)
- Extracts: id, title, company, salary, type, category, latitude, longitude, active, createdBy, createdAt
- Important: Allows backward compatibility with different location storage formats

`subscribeToActiveJobs(onJobs, onError)` - Real-time listener for active jobs
- Queries Firestore for all jobs where active === true
- Filters out jobs with null/undefined coordinates (prevents map errors)
- Calls onJobs() callback whenever active jobs change
- Returns unsubscribe function to cleanup listener
- Usage: Called by useJobs hook to populate job feed

```javascript
// Real-time update flow:
// Employer creates job → Firestore updates → onSnapshot detects change 
// → onJobs callback fires → React state updates → UI re-renders
```

`createJobPin(payload)` - Creates new job posting
- Accepts: title, company, salary, type, category, latitude, longitude, createdBy
- Validates: trims strings, sets defaults (type="Full-time", category="Employer")
- Stores: location as nested object {lat, lng} in Firestore
- Sets active=true and createdAt serverTimestamp
- Returns: new job document ID
- Security: Firestore rules verify createdBy matches request.auth.uid

### applicationsService.js
Manages job applications, notifications, and application status updates.

**Functions:**

`applyToJob(payload)` - Creates application record when user applies
- Parameters: job, applicantId, applicantName, applicantEmail, employerId
- Validation: Checks job exists, applicantId and employerId present
- Duplicate prevention: Queries Firestore for existing application (same jobId + applicantId)
  - If exists: Returns {created: false, applicationId}
  - If new: Creates document with status="Applied", readByEmployer=false
- Sets readByEmployer=false so employer sees as "unread"
- Returns: {created: boolean, applicationId: string}

```javascript
// Application lifecycle:
// User taps "Apply" → applyToJob() → Creates doc with status="Applied"
// → Employer subscribes to applications → Sees new application in Applicants tab
```

`subscribeEmployerApplications(employerId, onApplications, onError)` - Real-time listener for employer's applications
- Queries applications where employerId === employer's uid
- Orders by createdAt descending (newest first)
- Returns array of application documents
- Called by ApplicantsScreen to populate application list

`subscribeUserApplications(applicantId, onApplications, onError)` - Real-time listener for user's applications
- Queries applications where applicantId === user's uid
- Used by useApplications hook and TrackScreen
- Enables users to see all their applications in real-time

`setApplicationStatus(payload)` - Updates application status (Approve/Hire/Reject)
- Parameters: applicationId, employerId, status
- Updates: status, employerId (kept for security validation), updatedAt timestamp
- Called after employer clicks action button in ApplicantsScreen

`createNotification(payload)` - Creates notification when application status changes
- Parameters: recipientId, senderId, type, message, meta (optional)
- type examples: "application_approved", "application_hired", "application_rejected"
- meta: stores additional context like applicationId, jobId, status
- read=false (unread by default)
- Sent immediately after setApplicationStatus succeeds

```javascript
// Complete update flow:
// Employer clicks "Approve" → setApplicationStatus() → 
// createNotification() → sends notification to applicant →
// applicant sees update in NotificationsScreen + TrackScreen
```

`subscribeUserNotifications(recipientId, onNotifications, onError, limitCount)` - Real-time listener for notifications
- Queries notifications where recipientId === user's uid
- Orders by createdAt descending
- Limits results to limitCount parameter (default 10)
- Used by useNotifications hook and NotificationsScreen

`markNotificationsRead(notificationIds)` - Batch update notifications as read
- Accepts array of notification IDs
- Updates read=true and updatedAt timestamp for each
- Runs updates in parallel for performance

---

## Custom Hooks

Custom hooks encapsulate data subscription logic and state management, making screens cleaner.

### useJobs.js
Manages fetching and state for all active jobs.

**State:**
- `jobs` - Array of job objects
- `loading` - Boolean indicating if jobs are being fetched
- `errorMsg` - Error message if subscription fails

**Logic:**
- Calls subscribeToActiveJobs() in useEffect
- Updates jobs array in real-time when jobs are created/updated
- Returns unsubscribe function in cleanup to prevent memory leaks
- No dependencies array means subscription stays alive for component lifetime

**Usage:**
```javascript
const { jobs, loading, errorMsg } = useJobs();
// jobs automatically updates when new jobs are created in Firestore
```

### useApplications.js
Manages user's applications and calculates status counts.

**State:**
- `applications` - Array of user's applications
- `counts` - Aggregated count by status: {Applied: n, Approved: n, Hired: n, Rejected: n}
- `loading` - Boolean
- `errorMsg` - Error message

**Key Logic:**

Conditional subscription based on applicantId:
- If applicantId is null/undefined: sets applications=[], loading=false (user not logged in)
- If applicantId exists: subscribes to user's applications

Count calculation using useMemo:
```javascript
// Aggregates applications by status
{Applied: 10, Approved: 3, Hired: 1, Rejected: 2}
// Used by TrackScreen to display statistics
```

**Usage:**
```javascript
const { applications, counts, loading, errorMsg } = useApplications({
  applicantId: user?.uid
});
// counts.Applied, counts.Approved, etc. always in sync with Firestore
```

### useLocation.js
Gets user's current location via GPS.

**State:**
- `place` - Object with city, region, latitude, longitude
- `loading` - Boolean indicating if location is being fetched
- `error` - Error message if permission denied or fetch fails

**Key Logic:**
- On mount: Requests GPS permission via expo-location
- If granted: Gets current coordinates, performs reverse geocoding to get city name
- If denied: Sets error state
- Returns location or last known device location

**Usage:**
```javascript
const { place, loading } = useLocation();
// place.city used in HomeScreen to show "Getting location..." while loading
```

### useNotifications.js
Subscribes to user's notifications and counts unread.

**State:**
- `notifications` - Array of notification objects
- `unreadCount` - Number of unread notifications (read === false)
- `loading` - Boolean
- `errorMsg` - Error message

**Key Logic:**
- Takes recipientId parameter
- Conditional: Returns empty if recipientId null
- Calculates unreadCount from notifications array
- Real-time updates when notifications arrival

**Usage:**
```javascript
const { notifications, unreadCount } = useNotifications({
  recipientId: user?.uid
});
// unreadCount displayed as badge on notification icon
```

---

## Authentication Screens

### LoginScreen.js
Email/password login and Google OAuth implementation.

**State Variables:**
- `email`, `password` - Form inputs
- `loading` - Email/password login loading state
- `resetLoading` - Password reset loading state
- `googleLoading` - Google Sign-In loading state
- `googleSigninModule` - Native @react-native-google-signin module (if available)
- `googleSigninError` - OAuth error messages

**Key Functions:**

`signInWithEmailAndPassword()` - Standard email/password authentication
- Validates email not empty
- Calls Firebase auth.signInWithEmailAndPassword()
- On success: user auto-navigated to app (AppNavigator detects logged-in state)
- On error: shows Alert with error message

`handleExpoGoGoogleSignIn()` - Custom OAuth for Expo Go environment
- Expo Go doesn't have standalone app identity, so uses special proxy redirect
- Creates auth request with PKCE flow
- Gets ID token directly (avoids code exchange complexity)
- Creates GoogleAuthProvider credential from ID token
- Signs in with Firebase using credential

```javascript
// Expo Go OAuth flow:
// User clicks "Continue with Google" →
// Opens browser for OAuth login →
// Google redirects to Expo proxy URL →
// Proxy completes session in app →
// ID token passed to Firebase →
// User logged in
```

`GoogleAuthSession.useIdTokenAuthRequest()` - React hook for Google OAuth
- Used for native mobile build (not Expo Go)
- Handles platform-specific client IDs (Android/iOS)
- WebBrowser opens native OAuth flow

`sendPasswordResetEmail()` - Password reset link
- Accepts user's email
- Firebase sends reset email with verification link
- User clicks link, sets new password
- On success: shows success Alert

### RegisterScreen.js
New account creation with role selection and email verification.

**State:**
- `email`, `password`, `confirmPassword` - Signup form
- `selectedRole` - Role chosen: "user" or "employer"
- `loading` - Signup loading state
- `verificationSent` - Boolean tracking if verification email sent

**Key Functions:**

`createUserWithEmailAndPassword()` - Creates Firebase auth account
- Validates: email format, password length (min 8), passwords match
- Calls Firebase auth
- On success: user gets email verification email automatically

`sendEmailVerification()` - Sends verification email
- Firebase automatically includes link to verify account
- User clicks link → Firebase detects verification → reload() updates emailVerified flag
- AppNavigator polls every 3 seconds, detects change, navigates past VerifyEmailScreen

`setDoc(db, "users", profile)` - Creates user profile in Firestore
- Stores: name, email, role, profileCompleted=false, createdAt
- Role set by user selection (user or employer)
- profileCompleted=false forces ProfileScreen on first login

```javascript
// SignUp workflow:
// User enters email/password/role →
// createUserWithEmailAndPassword() →
// sendEmailVerification() →
// User sees "Check your email" message →
// User clicks link in email →
// AppNavigator detects emailVerified=true →
// Navigates to VerifyEmailScreen (this screen shows verification status)
```

### VerifyEmailScreen.js
Blocks app access until email is verified.

**Logic:**
- Shows message: "Check your email to verify your account"
- Periodically checks if user verified email (via AppNavigator polling)
- When verified: AppNavigator automatically navigates to ProfileScreen (profile setup)
- Users cannot bypass this - it's enforced by AppNavigator logic

---

## User Job Seeker Screens

### HomeScreen.js
Primary screen for job seekers. Shows job feed, search, filtering, and apply functionality.

**State:**
- `search` - Search query text
- `selectedCategoryId` - Currently selected job category filter
- `locationModalOpen` - Modal for editing preferred job location
- `preferredLocationDraft` - Temporary location input in modal
- `savingLocation` - Loading state when saving location to profile

**Data Subscriptions (via hooks):**
- `useJobs()` - Gets all active jobs in real-time
- `useLocation()` - Gets current device location
- `useNotifications()` - Gets user's notifications with unread count

**Key Functions:**

`categoryCounts` - Counts jobs per category
```javascript
// Processes jobs array into: {tech: 15, design: 8, data: 5}
// Used in category pill section to show "(15)" next to "Tech"
```

`filtered` - Calculates jobs matching search + category filter
```javascript
// Filters by:
// 1. Search text matches job title or company
// 2. Category matches selected category
// Returns filtered array used for rendering
```

`handleApply(job)` - User taps "Apply" button on job card
- Validates: user logged in, job has employerId
- Calls applyToJob() from applicationsService
- Checks if duplicate application (already applied)
- Shows success/error Alert

```javascript
// Apply workflow:
// User scrolls job feed → Sees JobCard →
// Taps "Apply" button → handleApply() →
// Creates application doc in Firestore →
// Shows "Applied" confirmation →
// Application appears in employer's ApplicantsScreen
```

`savePreferredLocation()` - Saves user's preferred job location
- Updates user profile with location field
- Uses setDoc with {merge: true} to only update location field (doesn't erase other fields)
- Shows success/error Alert
- Closes modal on success

`clearPreferredLocation()` - Clears preferred location
- Sets location to empty string in user profile
- Allows app to use device GPS location instead

**UI Sections:**
1. Header: GetHired logo, current location selector, notifications button with badge
2. Search bar: Text input for job search
3. Category pills: Scrollable horizontal list showing category counts
4. Job cards: Vertical ScrollView of JobCard components
   - Each card shows job title, company, salary, and Apply button
   - Tapping Apply triggers handleApply()

### MapScreen.js
Interactive map view showing jobs as location pins.

**Logic:**
- Loads OpenStreetMap via WebView (uses Leaflet library)
- Renders all active jobs as map pins with markers
- Pins clustered by proximity
- Tap pin to see job details
- Horizontal drawer shows nearby jobs
- User can adjust map view to explore locations

### TrackScreen.js
Application status tracking dashboard.

**State:**
- Applications fetched via useApplications hook
- Displays counts: Applied, Approved, Hired, Rejected

**Key Functions:**

Status aggregation from counts:
```javascript
// Displays statistics:
// Applied: [number] (in progress)
// Approved: [number] (next step)
// Hired: [number] (completed successfully)
// Rejected: [number] (not selected)
```

Application list with status badges showing:
- Job title
- Current status (Applied/Approved/Hired/Rejected)
- Date applied
- Employer name

---

## Employer Screens

### ApplicantsScreen.js
Manages incoming job applications. Employers review applicants and update status.

**State:**
- `applications` - Array of this employer's received applications
- `loading` - Loading state during subscription

**Data Subscription:**
- `subscribeEmployerApplications(user.uid, ...)` - Real-time listener for this employer's applications

**Key Functions:**

`handleUpdate(app, nextStatus)` - Updates application status when employer clicks action
- Parameters: application object, new status (Approved/Hired/Rejected)
- Flow:
  1. Calls `setApplicationStatus()` - updates status in Firestore
  2. Calls `createNotification()` - sends notification to applicant
  - Message customized per status:
    - Approved: "Your application for [job] was approved"
    - Hired: "Congratulations! You were hired for [job]"
    - Rejected: "Your application for [job] was rejected"
  3. notification appears in applicant's NotificationsScreen
  4. Updates applicant's TrackScreen status count

Application card display:
- Avatar: First letter of applicant name in colored circle
- Name: Applicant's name
- Job title: What job they applied for
- Status badge: Applied/Approved/Hired/Rejected with color coding
- Action buttons:
  - Approve (only shown if status=Applied)
  - Hire (only shown if status=Approved)
  - Reject (shown unless status=Rejected or Hired)

```javascript
// Status state machine:
// Applied → [Approve button] → Approved
// Approved → [Hire button] → Hired
// (any) → [Reject button] → Rejected (final state)
```

### DashboardScreen.js
Employer overview showing job posting statistics and applicant count.

**Displays:**
- Total jobs posted (all active jobs where createdBy === employer uid)
- Total applicants received (count of all applications where employerId === employer uid)
- Breakdown by status: Applied, Approved, Hired, Rejected

### EmployerMapScreen.js
Map showing job pins created by employer.

**Features:**
- Shows all jobs created by this employer
- Map pins at job coordinates
- Tapping pin shows job details (title, company, salary)
- Modal button to create new job posting

### EmployerJobPostingScreen.js
Modal form to create new job posting.

**Form Fields:**
- Job title (text)
- Company name (text)
- Salary (text)
- Job type: dropdown (Full-time, Part-time, Contract, etc.)
- Category: dropdown (Tech, Design, Security, Data, etc.)
- Location: Uses LocationPickerScreen (map-based picker)

**Submit Flow:**
- Validates all fields filled
- Calls createJobPin() from jobsService with form data
- Job created in Firestore with createdBy === employer uid
- Job appears on map
- Confirmation shown to employer
- Job now visible to all job seekers in HomeScreen/MapScreen

### EmployerProfileScreen.js
Company profile management.

**Features:**
- Display company information (name, industry, etc.)
- Edit company profile
- Update company photo/logo
- Logout button (calls handleLogout in AppNavigator)

### LocationPickerScreen.js
Modal with interactive map to select job location.

**Logic:**
- Opens full-screen map
- User pan/zoom to desired location
- Tap on map to select coordinates
- Returns latitude, longitude back to EmployerJobPostingScreen
- Stores in job as location: {lat, lng}

---

## Admin Screens

### AdminDashboardScreen.js
Platform overview showing business metrics.

**Displays:**
- Total users registered
- Total employers
- Active job postings (jobs where active === true)
- Total applications created
- Flagged content queue (jobs flagged for review)

**Data Sources:**
- Queries across multiple Firestore collections
- Used by platform administrators for oversight

### AdminUsersScreen.js
User management interface.

**Features:**
- Lists all registered users
- Shows user details (name, email, role, registration date)
- Toggle user active status
- Delete user account
- Search/filter users

**Employer/Employer User Update:**
- Calls toggleUserStatus() or deleteUser() from adminService
- Updates user.active field in Firestore
- Inactive users can't log in

---

## Data Flow & Real-time Sync

### Complete User Journey: "Job Seeker Applies for Job"

```
1. JOB SEEKER
   └─ Opens HomeScreen
      └─ useJobs() subscribes to active jobs
         └─ subscribeToActiveJobs() queries Firestore
            └─ onSnapshot listener attached
               └─ Real-time updates whenever jobs change

2. EMPLOYER
   └─ Posts new job on EmployerMapScreen
      └─ Calls createJobPin() from jobsService
         └─ Adds document to jobs collection
            └─ Sets createdBy = employer uid
               └─ Sets active = true

3. FIRESTORE
   └─ Job document created
      └─ Triggers onSnapshot in subscribeToActiveJobs()
         └─ onJobs callback fires with updated jobs array

4. JOB SEEKER SEES JOB
   └─ HomeScreen receives new jobs via useJobs
      └─ React state updates
         └─ Component re-renders
            └─ New job appears in job feed

5. JOB SEEKER APPLIES
   └─ Taps "Apply" on JobCard
      └─ Calls handleApply()
         └─ Calls applyToJob() from applicationsService
            └─ Creates application document in Firestore

6. APPLICATION CREATED
   └─ status = "Applied"
      └─ readByEmployer = false
         └─ createdAt = server timestamp

7. EMPLOYER SEES APPLICATION
   └─ ApplicantsScreen subscribed via subscribeEmployerApplications()
      └─ onSnapshot detects new application document
         └─ Calls onApplications callback
            └─ React state updates
               └─ New applicant appears in list

8. EMPLOYER REVIEWS & APPROVES
   └─ Taps "Approve" button on applicant card
      └─ Calls handleUpdate() with status="Approved"
         └─ Calls setApplicationStatus()
            └─ Updates application doc: status="Approved"
               └─ Calls createNotification()
                  └─ Adds notification document

9. JOB SEEKER SEES NOTIFICATION
   └─ NotificationsScreen subscribed via useNotifications()
      └─ onSnapshot detects new notification document
         └─ Calls onNotifications callback
            └─ React state updates
               └─ Notification appears "Application Approved!"

10. STATISTICS UPDATE
    └─ TrackScreen displays counts via useApplications
       └─ Counts aggregated from applications array
          └─ Applied: -1, Approved: +1 (status changed)
             └─ Chart updated in real-time
```

### Real-time Listener Pattern Used Throughout

**Common Structure:**
```javascript
// 1. Service function subscribes to Firestore query
export const subscribeToXXX = (params, onData, onError) => {
  const q = query(collection, where(...), orderBy(...));
  return onSnapshot(q, 
    (snap) => onData(snap.docs.map...),  // Success: call callback
    (error) => onError?.(error)           // Error: call error callback
  );
};

// 2. Hook wraps service function with React state
export const useXXX = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsub = subscribeToXXX(
      (data) => { setData(data); setLoading(false); },
      (error) => { setError(error); }
    );
    return unsub; // Cleanup
  }, []);
  
  return { data, loading, error };
};

// 3. Screen component uses hook
const MyScreen = () => {
  const { data, loading } = useXXX();
  return loading ? <Spinner /> : <FlatList data={data} />;
};
```

**Benefits:**
- Real-time updates without polling
- Automatic cleanup on unmount (prevents memory leaks)
- Efficient: only updates component if data actually changed
- Typed/structured data from Firestore

---

## Component Architecture

### Reusable Components (src/components/)

**JobCard.js**
- Displays: job title, company name, salary, job type, category
- Contains: Apply button that triggers handleApply()
- Props: job object, onApply callback, onCardPress callback
- Used by: HomeScreen, MapScreen

**InputField.js**
- Reusable text input with icon prefix
- Props: placeholder, value, onChange, icon name, secureTextEntry
- Used by: LoginScreen, RegisterScreen, ProfileScreen

**Badge.js**
- Status badge (Applied/Approved/Hired/Rejected)
- Props: label, color, backgroundColor
- Used by: ApplicantsScreen, TrackScreen, NotificationsScreen

**ThemedText/ThemedView** (from app-example)
- Typography and layout components respecting app color scheme
- Auto dark/light mode support
- Used for consistent styling across app

### Design System (src/constants/colors.js)

```javascript
COLORS = {
  primary: '#2563EB',      // Main blue
  primaryBg: '#...',       // Light blue background
  purple: '#8B5CF6',       // Secondary accent
  secondaryBg: '#...',     // Light purple background
  green: '#10B981',        // Success
  successBg: '#...',       // Light green background
  red: '#EF4444',          // Error/Rejected
  redBg: '#...',           // Light red background
  orange: '#F59E0B',       // Warning
  dark: '#1F2937',         // Dark text
  mid: '#6B7280',          // Medium text
  light: '#E5E7EB',        // Light dividers
  white: '#FFFFFF',        // Backgrounds
  bg: '#F3F4F6',           // Light background
}
```

---

## Security & Permissions

### Firebase Security Rules (firestore.rules)

**User Collection:**
- Users can read/write their own document only
- Prevents users seeing other users' private data

**Jobs Collection:**
- Employers can create jobs (only as createdBy === request.auth.uid)
- Anyone can read active jobs
- Only employer who created can update/delete

**Applications Collection:**
- Applicants can create applications
- Employers can read applications where employerId === request.auth.uid
- Applicants can read their own applications (applicantId === request.auth.uid)
- Only employer can update status

**Notifications Collection:**
- Users can read notifications where recipientId === request.auth.uid
- Prevents users seeing others' notifications

### App Permissions

**GPS Location (expo-location)**
- HomeScreen requests permission on first load
- Shows city in location picker
- User can manually override with preferred location

**Email Verification**
- Firebase sends verification email on signup
- User must click link to verify
- AppNavigator blocks app access until verified

---

## Key Patterns & Best Practices

### 1. Real-time Data Sync
- Services use Firestore onSnapshot()
- Hooks wrap with React state management
- Screens use hooks, not services directly
- Automatic cleanup prevents memory leaks

### 2. Error Handling
- Try/catch in async functions
- Firestore rules validate mutate operations server-side
- UI shows Alert for errors
- Graceful fallbacks (empty states, loading spinners)

### 3. State Management Hierarchy
```
Firestore (source of truth)
    ↓
Services (fetch & subscribe functions)
    ↓
Custom Hooks (React state + useEffect)
    ↓
Screens (render using hook data)
    ↓
Components (reusable UI building blocks)
```

### 4. Performance Optimization
- Firestore queries use where() and orderBy() to minimize data transfer
- useMemo() calculates derived state (count aggregation)
- Component subscription cleanup prevents duplicate listeners
- Images optimized via Expo Image component

### 5. User Flows
- Clear navigation hierarchy: Auth → Setup Profile → Role-based tabs
- Email verification enforced before access
- Profile completion required before main app
- Real-time notifications keep users informed

---

## File Structure Summary

```
GetHired/
├─ App.js                          (Root entry point)
├─ package.json                    (Dependencies: Expo 55, Firebase 12, React Navigation)
├─ app.json                        (Expo config)
├─ tsconfig.json                   (TypeScript config)
├─ firestore.rules                 (Security rules)
├─ FIREBASE_SETUP.md               (Setup guide)
│
├─ src/
│  ├─ firebase/
│  │  └─ firebaseConfig.js         (Firebase init, auth persistence)
│  │
│  ├─ navigation/
│  │  └─ AppNavigator.js           (Central routing, role-based nav, auth state management)
│  │
│  ├─ services/
│  │  ├─ jobsService.js            (subscribeToActiveJobs, createJobPin)
│  │  ├─ applicationsService.js    (applyToJob, status updates, notifications)
│  │  └─ adminService.js           (admin dashboard data, user management)
│  │
│  ├─ hooks/
│  │  ├─ useJobs.js                (jobs real-time subscription)
│  │  ├─ useApplications.js        (user applications + status counts)
│  │  ├─ useLocation.js            (GPS + reverse geocoding)
│  │  └─ useNotifications.js       (notifications + unread count)
│  │
│  ├─ screens/
│  │  ├─ auth/
│  │  │  ├─ SplashScreen.js        (Loading screen)
│  │  │  ├─ LandingScreen.js       (First-time intro)
│  │  │  ├─ LoginScreen.js         (Email/password/Google OAuth)
│  │  │  ├─ RegisterScreen.js      (Signup with role selection)
│  │  │  └─ VerifyEmailScreen.js   (Blocking verification check)
│  │  │
│  │  ├─ user/
│  │  │  ├─ HomeScreen.js          (Job feed, search, categories, apply)
│  │  │  ├─ MapScreen.js           (Location-based job browsing)
│  │  │  ├─ TrackScreen.js         (Application status statistics)
│  │  │  ├─ ProfileScreen.js       (User profile management)
│  │  │  ├─ NotificationsScreen.js (Application status notifications)
│  │  │  └─ JobCategoriesScreen.js (Browse by category)
│  │  │
│  │  ├─ employer/
│  │  │  ├─ DashboardScreen.js     (Job/applicant statistics)
│  │  │  ├─ EmployerMapScreen.js   (View created jobs on map)
│  │  │  ├─ ApplicantsScreen.js    (Review & update applications)
│  │  │  ├─ EmployerJobPostingScreen.js (Create new job modal)
│  │  │  ├─ LocationPickerScreen.js (Map-based location picker)
│  │  │  └─ EmployerProfileScreen.js (Company profile)
│  │  │
│  │  └─ admin/
│  │     ├─ AdminDashboardScreen.js (Platform metrics)
│  │     └─ AdminUsersScreen.js     (User management)
│  │
│  ├─ components/
│  │  ├─ JobCard.js                (Reusable job listing card)
│  │  ├─ InputField.js             (Reusable text input)
│  │  ├─ Badge.js                  (Status badge component)
│  │  └─ ...other UI components
│  │
│  └─ constants/
│     ├─ colors.js                 (Color palette)
│     └─ data.js                   (Static data: job categories, etc.)
│
└─ android/, ios/                  (Platform-specific builds)
```

---

## How It All Works Together

1. **User Opens App**
   - App.js mounts, initializes GestureHandler, SafeArea, and StatusBar
   - AppNavigator component starts listening to auth state

2. **Authentication Check**
   - onAuthStateChanged() runs
   - If no user: shows Auth Stack (Landing → Login/Register)
   - If user exists: loads profile from Firestore, checks emailVerified

3. **Email Verification (if needed)**
   - If not verified: shows VerifyEmailScreen only
   - AppNavigator polls every 3 seconds for verification
   - When verified: navigates past this screen

4. **Profile Setup (if needed)**
   - If profileCompleted=false: shows ProfileScreen
   - User fills name, location, photo
   - Sets profileCompleted=true in Firestore
   - Redirects to main app

5. **Main App Starts**
   - Role-based navigator selected (UserTabs/EmployerTabs/AdminTabs)
   - All hooks activate and subscribe to Firestore listeners
   - Jobs, applications, notifications now sync in real-time

6. **Real-time Updates**
   - Any data change in Firestore triggers onSnapshot callback
   - Service callback updates React state
   - Component re-renders with new data
   - UI always in sync with backend

7. **User Actions**
   - Apply to job: createJobPin() → Firestore → Employer sees it
   - Update application: setApplicationStatus() → Notification created → User sees it
   - Real-time two-way sync between all connected users

This architecture ensures that GetHired is always responsive, real-time, and maintains data consistency across all users and roles.
