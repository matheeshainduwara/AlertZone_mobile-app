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

---

## 📈 Summary of Technical Stack Used
- **Frontend:** React Native (Expo SDK 54+)
- **Navigation:** Expo Router (Tabs-based)
- **Database:** Firebase Firestore (Real-time)
- **Storage:** Firebase Cloud Storage (Images)
- **Location:** Expo Location + React Native Maps (Google Maps Provider)
- **Image Processing:** Expo Image Manipulator

---

*Last Updated: 2026-05-16*
