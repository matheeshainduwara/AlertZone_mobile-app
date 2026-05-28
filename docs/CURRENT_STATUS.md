# Current Status — AlertZone Mobile App
> **Full Log:** [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)

> **Last Updated:** 2026-05-29
>
> This document tracks what is done, what is broken, and what remains. Agents MUST read this before starting work.

---

## Overall Progress

| Phase | Status | Notes |
|---|---|---------|
| Phase 0: Architecture Cleanup | 🔴 Not Started | Planned next |
| Phase 1: Core Firebase Integration | 🟡 In Progress | Auth ✅, Report submit ✅, Map live ✅, History live ✅ |
| Phase 2: Report System | 🟢 Done | Submit + track + images + location search working ✅ |
| Phase 3: Community Features | 🔴 Not Started | Upvoting UI exists but not functional |
| Phase 4: Notifications | 🟢 Done | expo-notifications plugin ✅, push tokens ✅, foreground listeners ✅, in-app Notification Center ✅ |
| Phase 5: Badge System | 🔴 Not Started | Static badges shown in profile |
| Phase 6: Polish & Launch | 🟡 In Progress | Animated splash gate ✅, smart first-launch routing ✅, onboarding seen flag ✅ |

---

## What IS Working ✅

### Authentication (Fully Functional)
- [x] Email/password registration with Firebase Auth
- [x] Email verification sent on sign-up
- [x] Email/password login
- [x] Password reset (forgot password) with email link
- [x] User profile created in Firestore `users` collection on sign-up
- [x] Auth state persistence with AsyncStorage
- [x] Auth context provider (`useAuth` hook) with user + profile
- [x] Auto-redirect to login if not authenticated (tab guard)
- [x] Remember Me (saves email to AsyncStorage)
- [x] Logout functionality with confirmation modal
- [x] Password validation (min 8 chars, uppercase, number)

### Profile (Partially Functional)
- [x] Profile screen reads real data from Firestore via `useAuth`
- [x] Edit profile modal — saves phone, address, notification prefs to Firestore
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
- [ ] Nearby Issues — hardcoded `NEARBY_ISSUES` array with stock images
- [ ] Latest Updates — hardcoded `LATEST_UPDATES` array
- [x] Notification bell badge — wired to real Firestore unread count ✅

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

### Profile Screen (`profile.tsx`)
- [ ] Badges — hardcoded `BADGES` array, not computed from user activity
- [ ] Avatar upload — camera button exists but `expo-image-picker` not wired
- [ ] "View All" badges link — not functional
- [x] Notification sound preference and alert radius edit settings saved to Firestore ✅
- [x] Stats use real Firestore data ✅
- [x] Edit profile saves to Firestore ✅
- [x] Logout fully functional ✅

---

## What Is NOT Built Yet 🔴

### Firebase Services
- [ ] `report.service.ts` — Firestore CRUD for reports
- [ ] `storage.service.ts` — Image/video upload to Firebase Storage
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
- [ ] Real report submission to Firestore
- [ ] Image/video upload to Firebase Storage
- [ ] Community upvoting system
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
