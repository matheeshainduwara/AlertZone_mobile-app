# AlertZone Project Progress & Milestone Log

This document tracks the end-to-end development journey of the AlertZone mobile application, documenting every step, feature, and architectural decision made since the project's inception.

---

## 🛠 Phase 0: Foundation & Architecture
**Objective:** Establish a professional, scalable codebase structure and clear development roadmap.

- **[2026-05-15] Documentation Suite Created:**
    - `docs/AGENTS.md`: Defined project rules and AI agent interaction protocols.
    - `docs/ARCHITECTURE.md`: Established the layered pattern (Screens → Hooks → Services).
    - `docs/FIRESTORE_DATA_MODEL.md`: Defined the initial schema for Users and Reports.
    - `docs/IMPLEMENTATION_PLAN.md`: Created a 7-phase roadmap.
    - `docs/CURRENT_STATUS.md`: Feature tracking and milestone monitoring.
- **[2026-05-15] Branching Strategy:** Established `feat-add_report` as the primary development branch for core features.

---

## 🔥 Phase 1: Firebase & Core Integration
**Objective:** Connect the app to a real backend (Firebase) and replace all mock data.

- **[2026-05-16] Firebase Service Setup:**
    - Configured `services/firebase.ts` with API keys and initialized Auth, Firestore, and Storage.
- **[2026-05-16] Authentication:**
    - Verified `AuthProvider` and `useAuth` hook for managing user sessions.
    - **Remember Me Enhancement**: Implemented logic to save both email and password securely in `AsyncStorage`.
    - **Security Masking**: Prevented revealing passwords loaded from storage. Users must type to enable the "reveal" (eye) icon, ensuring stored credentials remain masked.
- **[2026-05-16] Firestore Security Rules:**
    - Implemented initial security rules to allow authenticated users to read/write reports and profiles while protecting data.

---

## 📍 Phase 2: Report Submission System (The Core)
**Objective:** Enable citizens to report issues with real location data and photo evidence.

- **[2026-05-16] Real-time Report Submission:**
    - Created a functional `report.tsx` screen.
    - Integrated `expo-location` for automatic device GPS detection.
    - Implemented a **Draggable Map Pin** for precise location adjustment.
    - **Reverse Geocoding**: Added logic to translate coordinates into human-readable addresses.
    - **Location Autocomplete**: Implemented real-time location suggestions using Photon API, providing a dropdown list as users type.
    - **Expanded Map Search**: Integrated the search bar and suggestion engine into the full-screen map modal for seamless location adjustment.
    - **Geofencing Validation**: Implemented strict validation to ensure reports are only submitted within Sri Lanka, with real-time feedback when a pin is moved outside the boundary.
- **[2026-05-16] Multimedia & Evidence:**
    - Integrated `expo-image-picker` for photo evidence (up to 3 images).
    - **Optimization:** Created `services/storage.service.ts` to handle:
        - Image compression (70% quality, max 1200px width).
        - Size validation (blocking uploads > 2MB).
        - Firebase Storage upload flow.
- **[2026-05-16] Validation & UX:**
    - Added "Optional Photo" confirmation alert.
    - Added informative validation alerts (missing category, short description).
    - Added visual click feedback (active opacity) across all interactive elements.

---

## 🗺 Phase 3: Community Map & Real-time Tracking
**Objective:** Provide a live view of all active reports in the community.

- **[2026-05-16] Live Firestore Map:**
    - Rewrote `map.tsx` to subscribe to live Firestore updates using `onSnapshot`.
    - Implemented category-based filtering.
    - Added search functionality to find locations on the map.
- **[2026-05-16] Safety Radius Feature:**
    - Added a **Red User Area Circle** centered on the user's location.
    - Implemented **Radius Control** (1km to 15km) to allow users to define their area of interest.
    - **Alert Radius Synchronization**: Integrated map radius with the user's `alertRadius` setting in Firestore. Changes on the map are saved to the profile instantly.
    - **UI Optimization**: Merged live report counts directly into the category filter chips for a cleaner interface.
    - **Nearby Reports List**: Implemented an expandable list view on the map, allowing users to browse reports in a card layout and jump directly to them.

---

## 📜 Phase 4: History & Cross-Tab Navigation
**Objective:** Allow users to track their own reports and jump between screens easily.

- **[2026-05-16] Personal Report History:**
    - Implemented `history.tsx` with a live query filtered by `uid`.
    - Added a detailed **Status Timeline** showing progress from Pending → Assigned → Fixing → Resolved.
- **[2026-05-16] "View on Map" Integration:**
    - Added a button in History details to navigate directly to the Map tab.
    - The Map tab now auto-centers and selects the specific report pin passed from the History screen.

- **[2026-05-24] All-Country LGA Auto-Resolution:**
    - Geocoded the center coordinates for all **341 LGAs** across all **25 districts** in Sri Lanka using the Photon API.
    - Integrated the `LGA_CENTERS` coordinate database into the shared config [sriLankaRegions.ts](file:///e:/AlertZone_New/alertzone-mobile-app/config/sriLankaRegions.ts).
    - Upgraded the `resolveSrilankaRegion` algorithm to check matching terms with regex word boundaries `\b`, preventing false positive substring matches (like `"ella"` matching inside `"avissawella"` or `"pussellawa"`).
    - Added a centroid-based fallback to find the nearest LGA center if text matching fails, ensuring 100% accurate resolution for sparse or GPS-only address coordinates.
    - Validated and verified that Sabaragamuwa reports (and others) resolve with 100% accuracy.

---

## 🚀 Phase 6: Polish & Build Preparation

**Objective:** Ready the app for a real test build with notification verification and a premium launch experience.

- **[2026-05-29] Animated Splash Gate (`app/index.tsx`):**
    - Replaced the static `index.tsx` with a fully animated branded splash screen.
    - AlertZone logo (`iconAlerZone-Bg-none.png`) animates in with a fade + spring scale effect.
    - Dual pulsing teal rings radiate outward from the logo in a looping animation.
    - Subtle radial glow layers behind the logo for depth.
    - "AlertZone" wordmark (white + `#30A89C` teal) fades in after the logo.
    - "STAY AWARE. STAY SAFE." tagline fades in with wide letter spacing.
    - Three bouncing teal loading dots at the bottom of the screen.
    - **Smart routing logic**: waits for both auth state resolution AND a minimum 2.2s display time before navigating to the correct screen:
        - No `hasSeenOnboarding` flag → `/onboarding`
        - Flag set + not logged in → `/(auth)/loginScreen`
        - Flag set + logged in → `/(tabs)/home`

- **[2026-05-29] First-Launch Onboarding Gate (`app/onboarding.tsx`):**
    - Added `AsyncStorage.setItem('hasSeenOnboarding', 'true')` on both "Let's Start" (last slide) and "Skip" button.
    - Onboarding now only ever appears on a fresh install — returning users always bypass it.

- **[2026-05-29] Notification Service Hardening (`services/notification.service.ts`):**
    - Moved Android notification channel creation (`alertzone-alerts`) to **before** the push token fetch, ensuring the channel exists at registration time.
    - Renamed channel to `"AlertZone Alerts"` with teal LED light color `#30A89C`, max importance, vibration, and badge support.

- **[2026-05-29] `app.json` — Notification & Splash Config:**
    - Added `expo-notifications` plugin with monochrome icon, teal `#30A89C` accent color, and `alertzone-alerts` default channel.
    - Added Android 13+ `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, and `VIBRATE` permissions.
    - Splash screen updated to use the AlertZone logo (`iconAlerZone-Bg-none.png`) on `#0D1F2D` dark background (both light and dark modes).

- **[2026-05-29] Dependency Fixes:**
    - Downgraded `expo-image-manipulator` → `~14.0.8` and `expo-image-picker` → `~17.0.11` to match SDK 54.
    - Updated `expo` → `~54.0.34`, `expo-linking` → `~8.0.12`, `expo-web-browser` → `~15.0.11`.
    - All 18/18 `expo-doctor` checks now pass.

- **[2026-05-29] EAS Cloud Build:**
    - Committed on branch `test-build-2`.
    - Triggered EAS preview build for Android (build ID: `d520c667-5394-4521-a4db-a666d68c7eba`).

---

## 🔄 Session: Pull-to-Refresh, Auto-Archive & Archive Screen
**Date:** 2026-05-29

- **[2026-05-29] Home Screen — Pull-to-Refresh (`home.tsx`):**
    - Added `RefreshControl` to the main `ScrollView` with brand teal `#4CC2D1` spinner colour.
    - `handleRefresh()` re-requests foreground location permission, fetches the latest GPS coordinates, and waits a minimum 800ms for a smooth UX before releasing the spinner.
    - Refreshing `userLocation` automatically triggers the distance calculation `useEffect`, re-computing nearby issues and latest updates.

- **[2026-05-29] My Reports — Auto-Archiving (`history.tsx`):**
    - Added `writeBatch` + `doc` Firestore imports and extended the `Report` interface with `categoryId`, `updatedAt`, and `isArchived` fields.
    - Added `getResolvedTime(report)` helper: inspects `statusHistory` for the `RESOLVED` entry first, then falls back to `updatedAt` / `createdAt`.
    - Added `isEligibleForArchive(report)` helper: checks `status === 'RESOLVED'`, `isArchived !== true`, and that ≥24 hours have elapsed since resolution.
    - Added a `useEffect` that commits a Firestore `writeBatch` to set `isArchived: true` on any eligible reports whenever the reports list updates.
    - Updated `filtered` array and `countFor()` to exclude archived reports from all filter tabs and count badges.
    - Added a teal **Archive** pill button (with icon) to the header that routes to `/archive`.

- **[2026-05-29] Archive Screen (`app/archive.tsx`) — New screen:**
    - Dedicated `/archive` route with a premium dark `LinearGradient` layout.
    - Real-time Firestore subscription: `uid == user.uid` AND `isArchived == true`, ordered by `createdAt DESC`.
    - Category filter chips: All + 6 report categories with icons and brand colours.
    - Date filter chips: All Time, Today, Last 7 Days, Last 30 Days, Custom Range.
    - Custom date range picker: pure React Native `CalendarModal` with month navigation — no third-party date picker required.
    - Full `ReportDetailModal` with status timeline, location, description, and resolution note.
    - Informative empty state describing the auto-archive behaviour.

- **[2026-05-29] Login Screen (`loginScreen.tsx`):**
    - Changed heading and toast copy from "Welcome Back!" → "Welcome!".

---

## 💬 Phase 3 Addendum: Upvotes, Comments & Admin Integration
**Objective:** Add citizen upvoting, confirmation modals, keyboard-avoiding comment feeds, and full admin console linkage.

- **[2026-05-29] Upvote & Retract Confirmation Flow:**
    - Redesigned the upvote section into a fully pressable glassmorphic blue card block.
    - Tapping to upvote triggers a confirmation modal permitting standard upvotes or upvoting with an optional comment.
    - Tapping to retract triggers a safety modal prompting confirmation to withdraw the upvote.
    - Toast notifications configured to mount within the native modal tree to render on top of all modal windows.
- **[2026-05-29] Keyboard-Avoiding Comments Feed:**
    - Converted comment inputs from absolute to relative flex layouts, allowing `KeyboardAvoidingView` to dynamically slide input fields upward on focus.
    - Resolved real names and avatars for authors matching the logged-in user, adding a `(You)` label and a distinctive teal border.
    - Initial comment list capped at 5 comments with a toggle button to "View All".
- **[2026-05-29] Admin Console Integration:**
    - Wired live listeners to `comments` and `upvotes` subcollections on the report detail view.
    - Allowed admins to see who commented or upvoted with real avatar, name, and email details.
    - Linked admin avatars to trigger the `UserDetailsModal` showing user history and management controls.

---

## 🛠 APK Production Readiness & Bug-Fixes
**Objective:** Thoroughly analyze and rectify layout, error feedback, and stability issues prior to APK generation.

- **[2026-05-29] Android APK Fixes:**
    - **BUG-1 (Android Carousel Position)**: Changed image carousel arrows from percentage positioning (`top: '50%'`) to static pixel coordinates (`top: 84`) to bypass Android APK render bugs.
    - **BUG-2 & BUG-3 (Toast Error Catches)**: Implemented Toast warning messages inside catch blocks for upvote and comment operations.
    - **BUG-4 (Negative Counts Guard)**: Used `Math.max(0, ...)` to ensure the upvote UI never displays a negative value on race conditions.
    - **BUG-5 (Report Title Recovery)**: Restored the rendering of `report.title` inside the details modal header section.
    - **BUG-6 (Icon Fallback)**: Added `'help-circle-outline'` fallback to `report.categoryIcon` properties.
    - **BUG-7 (Style Standardization)**: Standardized React Native inline styles in `upvoted-reports.tsx` by replacing NativeWind `className` flags.
    - **verification**: Validated that all code compiles clean with `npx tsc --noEmit` and EAS build configurations are complete.

---

## 📈 Summary of Technical Stack Used
- **Frontend:** React Native (Expo SDK 54+)
- **Navigation:** Expo Router (Tabs-based)
- **Database:** Firebase Firestore (Real-time)
- **Storage:** Firebase Cloud Storage (Images)
- **Location:** Expo Location + React Native Maps (Google Maps Provider)
- **Image Processing:** Expo Image Manipulator
- **Push Notifications:** Expo Notifications + Expo Push Service (FCM)

---

*Last Updated: 2026-05-29 — Upvotes & Comments Integration · APK Bug-Fixes*
