# Current Status — AlertZone Mobile App
> **Full Log:** [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)

> **Last Updated:** 2026-05-29 (Pull-to-Refresh · Auto-Archive · Archive Screen)
>
> This document tracks what is done, what is broken, and what remains. Agents MUST read this before starting work.

---

## Overall Progress

| Phase | Status | Notes |
|---|---|---------|
| Phase 0: Architecture Cleanup | 🔴 Not Started | Planned next |
| Phase 1: Core Firebase Integration | 🟢 Done | Auth, Live Database, Storage, and Push Notifications integrated |
| Phase 2: Report System | 🟢 Done | Submit + track + images + location search working ✅ |
| Phase 3: Community Features | 🟢 Done | Upvotes confirmation flow, community comments list, user detail modals, and dashboard linking ✅ |
| Phase 4: Notifications | 🟢 Done | expo-notifications plugin ✅, push tokens ✅, foreground listeners ✅, in-app Notification Center ✅ |
| Phase 5: Badge System | 🔴 Not Started | Static badges shown in profile |
| Phase 6: Polish & Launch | 🟢 Done | Animated splash gate, onboarding seen flag, and 7 critical/medium APK readiness fixes ✅ |

---

## What IS Working ✅

### Upvotes & Community Comments (Fully Functional)
- [x] Vibrantly redesigned, fully pressable upvote banner block (`#0f93f2ff`)
- [x] Custom interactive confirmation modal for upvoting with optional commenting support
- [x] Custom retract confirmation modal when removing an upvote
- [x] Fully keyboard-avoiding flex layout for the community comments input bar
- [x] Avatar and user name resolution for comments made by current user, highlighted with `(You)` label and teal border
- [x] Limit initial comment feed to 5 entries with a custom "View All" toggle button
- [x] Custom Toast notifications rendered inside the native modal wrapper to prevent rendering behind modal windows
- [x] Admin console live subscriptions to comments and upvotes
- [x] Admin console user profiles linkage from comments/upvotes avatars to open the user details controls

### Authentication (Fully Functional)
- [x] Email/password registration with Firebase Auth
- [x] Email verification sent on sign-up
- [x] Email/password login
- [x] Password reset (forgot password) with email link
- [x] User profile created in Firestore `users` collection on sign-up
- [x] Auth state persistence with AsyncStorage
- [x] Auth context provider (`useAuth` hook) with user + profile
- [x] Auto-redirect to login if not authenticated (tab guard)
- [x] Remember Me (saves email to AsyncStorage, securely purges raw passwords) ✅
- [x] Biometric authentication (Fingerprint & Face ID login with SecureStore encryption) ✅
- [x] Resolved startup connection loading hang with a Firestore query timeout race ✅
- [x] Global network status gate (`NetworkStatusGate`) with bottom sheet and manual "Check Connection" retry controls ✅
- [x] Logout functionality with confirmation modal
- [x] Password validation (min 8 chars, uppercase, number)

### Profile (Partially Functional)
- [x] Profile screen reads real data from Firestore via `useAuth`
- [x] Edit profile modal — saves phone, address, notification prefs to Firestore
- [x] Biometric login settings toggle with secure password verification overlay modal ✅
- [x] Display contribution points and reports validated from Firestore
- [x] User level display

### Navigation
- [x] Expo Router file-based routing configured
- [x] Root layout with AuthProvider and Toast
- [x] Tab navigator with 5 tabs (Home, Map, Report, History, Profile)
- [x] Custom floating tab bar with FAB for Report
- [x] Tab bar hides on scroll (ScrollProvider)
- [x] Onboarding 3-step carousel (only shown on first install)
- [x] **Animated splash gate** (`app/index.tsx`) — AlertZone logo with pulsing teal rings, fade+scale animation, loading dots
- [x] **Smart first-launch routing** — detects `hasSeenOnboarding` (AsyncStorage) + auth state to route: onboarding → login → home
- [x] Onboarding `hasSeenOnboarding` flag set on both Skip and Let's Start

### UI/UX
- [x] Consistent dark theme across all screens
- [x] Custom toast configuration (success + error styles)
- [x] Keyboard-aware forms (KeyboardAvoidingView)
- [x] Loading states on buttons and screens

---

## What Uses MOCK DATA (UI exists, not wired to Firebase) 🟡

### Home Screen (`home.tsx`)
- [ ] Browse Categories — hardcoded array, not from Firestore
- [x] Nearby Issues — live Firestore subscription filtered to user's alert radius ✅
- [x] Latest Updates — live Firestore subscription ✅
- [x] Notification bell badge — wired to real Firestore unread count ✅
- [x] **Pull-to-Refresh** — re-fetches GPS location and refreshes nearby issues + updates ✅

### Map Screen (`map.tsx`) ✅ LIVE
- [x] Issue pins — live Firestore subscription (`onSnapshot`) ✅
- [x] Filter chips by category — filters Firestore data in real-time ✅
- [x] Search bar — filters by title or address ✅
- [x] Category Counts — shows number of reports by type within radius ✅
- [x] Navigation Support — centers on specific report if params provided ✅
- [x] User area circle (red) around device location ✅
- [x] Radius control — dynamic circle size (1km to 15km) ✅
- [x] Google Maps renders with dark theme ✅
- [x] User location permission + centering ✅
- [x] Zoom in/out + recenter controls ✅
- [ ] "Details" full-screen navigation — not yet implemented

### Report Screen (`report.tsx`) ✅ LIVE
- [x] GPS location — real `expo-location` with permission request ✅
- [x] Interactive MapView with **draggable marker** ✅
- [x] Full-screen Map modal for precise positioning ✅
- [x] Location Search — search by address/name ✅
- [x] Photo evidence — `expo-image-picker` wired (max 3 images) ✅
- [x] Optional Photos — allow submission without photos (with confirmation) ✅
- [x] Image validation — size limit (<2MB) + auto-compression ✅
- [x] "Other" category added ✅
- [x] GPS Status tag fix ("GPS Inactive") ✅
- [x] Visual Feedback — active state for all pressables ✅
- [x] Submit saves real Firestore document with images ✅
- [x] Auto-resolves Province, District, and Local Government Area (LGA) on submission using the updated `resolveSrilankaRegion` utility ✅
- [x] All-country LGA centers fallback: resolves to the nearest LGA center coordinates when text matches are unavailable or sparse ✅
- [x] Regex-based boundary matches prevent incorrect subword overlaps (e.g. "ella" matching inside "avissawella" or "pussellawa") ✅
- [x] Reference ID — real Firestore document ID ✅
- [x] Contribution points +10 on submit ✅
- [x] Category selection modal ✅
- [x] Description input with character count ✅
- [x] Success screen with real ref ID ✅

### History Screen (`history.tsx`) ✅ LIVE
- [x] Report list — live Firestore subscription for current user ✅
- [x] View on Map — navigate to Map tab and center on report ✅
- [x] Filters (All/Pending/Fixing/Resolved/Rejected) — filter real data ✅
- [x] Report detail modal — shows real Firestore data ✅
- [x] Status timeline with ASSIGNED stage ✅
- [x] Real-time updates — modal reflects status changes instantly ✅
- [x] Human-readable date formatting ✅
- [x] **Auto-Archive** — RESOLVED reports older than 24h are automatically set to `isArchived: true` in Firestore via batch write ✅
- [x] Archived reports excluded from all tab filters and counts ✅
- [x] **Archive button** in header — navigates to the dedicated Archive screen ✅

### Archive Screen (`archive.tsx`) ✅ NEW
- [x] Live Firestore subscription filtered to `isArchived == true` for the current user ✅
- [x] **Category filter chips** — All Categories + 6 specific categories ✅
- [x] **Date filter chips** — All Time / Today / Last 7 Days / Last 30 Days / Custom Range ✅
- [x] **Custom date range** — pure React Native calendar modal, no third-party date picker ✅
- [x] Report detail modal with status timeline and resolution notes ✅
- [x] Informative empty state explaining the auto-archive behaviour ✅

### Profile Screen (`profile.tsx`)
- [ ] Badges — hardcoded `BADGES` array, not computed from user activity
- [x] Avatar upload — camera button wired, supports photo/gallery, compression, and Storage upload ✅
- [ ] "View All" badges link — not functional
- [x] Notification sound preference and alert radius edit settings saved to Firestore ✅
- [x] Stats use real Firestore data ✅
- [x] Edit profile saves to Firestore ✅
- [x] Logout fully functional ✅

---

## What Is NOT Built Yet 🔴

### Firebase Services
- [ ] `report.service.ts` — Firestore CRUD for reports
- [x] `storage.service.ts` — Image upload to Firebase Storage with local URI fix for APK builds ✅
- [x] `notification.service.ts` — Expo push token registration, Android channel setup (`alertzone-alerts`), Firestore token save/clear ✅
- [ ] `user.service.ts` — Separated user operations

### Hooks
- [ ] `useReports` — real-time report fetching
- [ ] `useNearbyReports` — geo-based report queries
- [ ] `useUpvote` — upvote/undo logic
- [ ] `useImagePicker` — camera/gallery picker wrapper
- [ ] `useLocation` — expo-location wrapper
- [x] `useNotifications` — push notification setup ✅
- [ ] `useUserBadges` — badge calculation logic

### Features
- [x] Real report submission to Firestore ✅
- [x] Image/video upload to Firebase Storage ✅
- [x] Community upvoting system with comment integration ✅
- [x] Push notifications (Expo Push API) ✅
- [ ] Badge calculation and display from real data
- [ ] Area-based report filtering
- [ ] Google Sign-In (planned for later phase)
- [ ] Report search functionality
- [x] Notification history screen ✅
- [ ] Report deletion/editing by citizen
- [ ] Deep linking to specific reports

### Architecture
- [ ] `components/` directory — all sub-components inline in screens
- [ ] `hooks/` directory — no custom hooks exist
- [ ] `types/` directory — interfaces scattered in config files
- [ ] `constants/` directory — colors/categories hardcoded everywhere
- [ ] `utils/` directory — no utility functions extracted
- [ ] `context/` directory — contexts live in `config/` currently

---

## Known Issues & Technical Debt 🐛

| Issue | Severity | Location | Notes |
|---|---|---|---|
| Google Sign-In button is a no-op | Low | `loginScreen.tsx`, `signupScreen.tsx` | Planned for future phase |
| `@ts-ignore` on Firebase auth import | Medium | `services/firebase.ts` | `getReactNativePersistence` type issue |
| Toast outside AuthProvider in root layout | Low | `app/_layout.tsx` | Toast renders as sibling, not child of AuthProvider |
| Password icon wrong on signup (uses call icon) | Low | `signupScreen.tsx:234` | Should be `lock-closed-outline` |
| Google Maps API key exposed in `app.json` | High | `app.json:14,28` | Should use env variable or restrict key |
| No Firestore security rules configured | High | Firebase Console | Anyone can read/write everything |
| Firebase `.env` values committed to repo | High | `.env` file | Should be in `.gitignore` |
| `expo-blur` imported but not in package.json | Medium | `signupScreen.tsx` | May crash on some devices |
| Unused imports in some files | Low | Various | `Toast` imported but unused in some screens |

---

## Firebase Services Status

| Service | Status | Notes |
|---|---|---|
| **Authentication** | ✅ Active | Email/password working |
| **Firestore** | ✅ Active | Only `users` collection used so far |
| **Storage** | 🔴 Not Set Up | Needed for report images |
| **Cloud Messaging** | 🟢 Active | Configured via Expo Push Service ✅ |
| **Cloud Functions** | 🔴 Not Set Up | May be needed for badge calculation, notifications |
| **Security Rules** | 🔴 Not Configured | Default open rules — must fix before production |

---

## Dependencies Status

| Dependency | Installed | Used | Notes |
|---|---|---|---|
| `firebase` | ✅ | ✅ | Auth + Firestore active |
| `expo-location` | ✅ | ✅ (map only) | Not used in report form yet |
| `react-native-maps` | ✅ | ✅ | Google Maps working |
| `expo-image` | ✅ | ❌ | Not used anywhere |
| `react-native-toast-message` | ✅ | ✅ | Custom config working |
| `nativewind` | ✅ | ✅ | TailwindCSS styling |
| `expo-haptics` | ✅ | ❌ | Not used yet |
| `expo-image-picker` | ✅ | ✅ | For report photos |
| `expo-image-manipulator` | ✅ | ✅ | For photo compression |
| `expo-notifications` | ✅ | ✅ | For push tokens & foreground listening |
| `expo-constants` | ✅ | ✅ | For reading EAS projectId |
| `expo-camera` | ❌ Not installed | — | May be needed for camera |
