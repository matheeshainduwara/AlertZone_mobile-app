# Architecture — AlertZone Mobile App

> This document defines the **target architecture** for the AlertZone mobile app. All new code must follow these patterns. Existing code that deviates should be gradually refactored to align.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        EXPO ROUTER                          │
│                   (File-based Navigation)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                │
│  │  Screens │   │ Screens  │   │ Screens  │                │
│  │  (auth)  │   │  (tabs)  │   │ (modals) │                │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘                │
│       │              │              │                        │
│       ▼              ▼              ▼                        │
│  ┌─────────────────────────────────────────┐                │
│  │           COMPONENTS (shared UI)         │                │
│  └────────────────┬────────────────────────┘                │
│                   │                                          │
│  ┌────────────────┴────────────────────────┐                │
│  │           HOOKS (business logic)         │                │
│  └────────────────┬────────────────────────┘                │
│                   │                                          │
│  ┌────────────────┴────────────────────────┐                │
│  │         SERVICES (Firebase SDK)          │                │
│  └────────────────┬────────────────────────┘                │
│                   │                                          │
│  ┌────────────────┴────────────────────────┐                │
│  │            TYPES (interfaces)            │                │
│  └────────────────┬────────────────────────┘                │
│                   │                                          │
│  ┌────────────────┴────────────────────────┐                │
│  │         CONSTANTS (app-wide values)      │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              CONTEXT PROVIDERS (Auth, Scroll)                │
├─────────────────────────────────────────────────────────────┤
│                   FIREBASE BACKEND                           │
│          (Auth • Firestore • Storage • FCM)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Target Directory Structure

```
alertzone-mobile-app/
├── app/                           # SCREENS ONLY — Expo Router pages
│   ├── _layout.tsx                # Root layout (providers, global config)
│   ├── index.tsx                  # Landing / splash
│   ├── onboarding.tsx             # Onboarding flow
│   ├── (auth)/
│   │   ├── loginScreen.tsx
│   │   ├── signupScreen.tsx
│   │   └── passwordReset.tsx
│   └── (tabs)/
│       ├── _layout.tsx            # Tab navigator + auth guard
│       ├── home.tsx
│       ├── map.tsx
│       ├── report.tsx
│       ├── history.tsx
│       └── profile.tsx
│
├── components/                    # SHARED UI COMPONENTS
│   ├── ui/                        # Generic primitives
│   │   ├── Button.tsx             # Reusable button variants
│   │   ├── Card.tsx               # Base card component
│   │   ├── Badge.tsx              # Status badge
│   │   ├── Input.tsx              # Styled text input
│   │   ├── LoadingSpinner.tsx     # Full-screen loader
│   │   └── EmptyState.tsx         # "No data" placeholder
│   ├── report/                    # Report-specific components
│   │   ├── ReportCard.tsx         # Report list item
│   │   ├── ReportDetailModal.tsx  # Full report detail view
│   │   ├── CategoryPicker.tsx     # Category selection modal
│   │   └── StatusTimeline.tsx     # Visual status progress
│   ├── home/                      # Home screen components
│   │   ├── HeroBanner.tsx
│   │   ├── CategoryChip.tsx
│   │   ├── NearbyCard.tsx
│   │   └── UpdateRow.tsx
│   ├── profile/                   # Profile components
│   │   ├── StatCard.tsx
│   │   ├── BadgeChip.tsx
│   │   ├── SettingsRow.tsx
│   │   ├── EditProfileModal.tsx
│   │   └── LogoutModal.tsx
│   └── map/                       # Map components
│       ├── MapPinMarker.tsx
│       ├── FilterChips.tsx
│       └── PinPopup.tsx
│
├── hooks/                         # BUSINESS LOGIC HOOKS
│   ├── useReports.ts              # CRUD operations for reports
│   ├── useNearbyReports.ts        # Location-based report fetching
│   ├── useUpvote.ts               # Upvote logic
│   ├── useUserBadges.ts           # Badge calculation
│   ├── useLocation.ts             # Expo location wrapper
│   ├── useImagePicker.ts          # Camera/gallery picker
│   └── useNotifications.ts        # Push notification handling
│
├── services/                      # FIREBASE SERVICE LAYER
│   ├── firebase.ts                # Firebase app initialization
│   ├── auth.service.ts            # Auth helpers (login, signup, google)
│   ├── report.service.ts          # Firestore report CRUD
│   ├── user.service.ts            # Firestore user profile operations
│   ├── storage.service.ts         # Firebase Storage (upload images)
│   └── notification.service.ts    # FCM token registration, topics
│
├── types/                         # TYPESCRIPT INTERFACES
│   ├── report.ts                  # Report, ReportStatus, ReportCategory
│   ├── user.ts                    # UserProfile, Badge, UserLevel
│   ├── notification.ts            # NotificationPayload
│   └── index.ts                   # Re-exports
│
├── constants/                     # APP-WIDE CONSTANTS
│   ├── colors.ts                  # Design system color tokens
│   ├── categories.ts              # Report category definitions
│   ├── badges.ts                  # Badge definitions and criteria
│   ├── statuses.ts                # Status config (label, color, icon)
│   └── layout.ts                  # Spacing, sizing constants
│
├── utils/                         # PURE UTILITY FUNCTIONS
│   ├── formatDate.ts              # Date formatting helpers
│   ├── validation.ts              # Form validation rules
│   └── location.ts                # Geo distance calculations
│
├── context/                       # REACT CONTEXT PROVIDERS
│   ├── AuthContext.tsx             # Auth state + user profile
│   └── ScrollContext.tsx           # Tab bar hide-on-scroll
│
├── assets/                        # Static assets
│   └── images/
│
├── docs/                          # PROJECT DOCUMENTATION
│   ├── AGENTS.md
│   ├── ARCHITECTURE.md
│   ├── CURRENT_STATUS.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── FIRESTORE_DATA_MODEL.md
│
└── config files...                # .env, tsconfig, tailwind, etc.
```

---

## 3. Architectural Principles

### 3.1 Screens Are Thin

Screen files in `app/` should be **presentation-only**. They:
- Render UI components
- Call hooks for data and logic
- Handle navigation

❌ **Bad — logic in screen:**
```tsx
// app/(tabs)/history.tsx
const [reports, setReports] = useState([]);
useEffect(() => {
  const q = query(collection(db, 'reports'), where('uid', '==', user.uid));
  onSnapshot(q, snap => setReports(snap.docs.map(d => d.data())));
}, []);
```

✅ **Good — logic in hook:**
```tsx
// app/(tabs)/history.tsx
const { reports, loading } = useReports(user.uid);
```

### 3.2 Service Layer Abstracts Firebase

Never import Firebase SDK directly in screens or hooks. Always go through the service layer.

❌ **Bad:**
```tsx
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
await updateDoc(doc(db, 'reports', id), { status: 'FIXING' });
```

✅ **Good:**
```tsx
import { updateReportStatus } from '../services/report.service';
await updateReportStatus(id, 'FIXING');
```

### 3.3 Types Are Shared

All interfaces live in `types/` and are imported everywhere. Never define inline types for Firestore documents.

```tsx
// types/report.ts
export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

export interface Report {
  id: string;
  uid: string;
  title: string;
  category: ReportCategory;
  description: string;
  location: ReportLocation;
  status: ReportStatus;
  imageUrls: string[];
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### 3.4 Constants Are Centralized

Colors, categories, statuses, and badge definitions are in `constants/` — not scattered across screen files.

```tsx
// constants/colors.ts
export const COLORS = {
  bg: { primary: '#0D1F2D', secondary: '#0A1820', tertiary: '#071318' },
  accent: { primary: '#4CC2D1', secondary: '#30A89C' },
  surface: { base: '#111E27', elevated: '#1E3A44' },
  border: { default: '#1E3347', strong: '#2D4F5C' },
  text: { primary: '#FFFFFF', secondary: '#5A7D8A', muted: '#3A6070' },
  status: { pending: '#F59E0B', fixing: '#4CC2D1', resolved: '#30A89C', rejected: '#E05C5C' },
  danger: '#E05C5C',
  warning: '#F59E0B',
  success: '#30A89C',
} as const;
```

### 3.5 Components Are Reusable

If a UI pattern appears in more than one screen, extract it into `components/`.

---

## 4. Data Flow

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌────────────┐
│  Screen  │ ──►  │  Hook   │ ──►  │ Service  │ ──►  │ Firestore  │
│ (render) │ ◄──  │ (logic) │ ◄──  │ (CRUD)   │ ◄──  │ (database) │
└─────────┘      └─────────┘      └──────────┘      └────────────┘
```

**Example: Submitting a Report**

1. `report.tsx` (screen) — user fills form, presses Submit
2. `useSubmitReport` (hook) — validates data, calls services
3. `storage.service.ts` — uploads images to Firebase Storage
4. `report.service.ts` — creates Firestore document with image URLs
5. Hook returns `{ success, refId }` to screen
6. Screen shows SuccessScreen with reference ID

---

## 5. State Management Strategy

| State Type | Solution | Example |
|---|---|---|
| **Auth state** | React Context (`AuthContext`) | Current user, profile, logout |
| **Server data** | Custom hooks with `onSnapshot` | Reports, nearby issues |
| **UI state** | Component-local `useState` | Modal visibility, form inputs |
| **Scroll state** | React Context (`ScrollContext`) | Tab bar hide-on-scroll |

> **No Redux, Zustand, or other state libraries** unless the project grows significantly beyond its current scope. Context + hooks is sufficient for this scale.

---

## 6. Navigation Architecture

```
Root Stack (_layout.tsx)
├── index.tsx              ← Landing/splash (no auth required)
├── onboarding.tsx         ← Onboarding carousel (no auth required)
├── (auth)/                ← Auth route group (no auth required)
│   ├── loginScreen.tsx
│   ├── signupScreen.tsx
│   └── passwordReset.tsx
└── (tabs)/                ← Main app (AUTH REQUIRED — guarded in _layout.tsx)
    ├── home.tsx
    ├── map.tsx
    ├── report.tsx
    ├── history.tsx
    └── profile.tsx
```

**Auth Guard**: The `(tabs)/_layout.tsx` checks `useAuth()`. If no user is logged in, it redirects to `/(auth)/loginScreen`.

---

## 7. Firebase Architecture

### 7.1 Initialization

Firebase is initialized once in `services/firebase.ts` and exports `app`, `auth`, and `db`. All other service files import from here.

### 7.2 Auth Persistence

Using `getReactNativePersistence(AsyncStorage)` for session persistence across app restarts.

### 7.3 Real-time Subscriptions

Use `onSnapshot` for data that needs real-time updates (nearby reports, user's own reports). Use `getDoc`/`getDocs` for one-time reads (profile fetch on login).

### 7.4 Security Rules

Firestore security rules must enforce:
- Citizens can only read/write their own user profile
- Citizens can create reports but cannot modify status
- Citizens can read reports in their area
- Admins (role === 'admin') can read/write all reports and users
- Upvotes: one per user per report (enforced via subcollection or array)

---

## 8. Current vs. Target Architecture Gap

| Area | Current State | Target State |
|---|---|---|
| **File organization** | Flat — all logic in screen files | Layered — screens → hooks → services |
| **Types** | Inline interfaces in `authConfig.tsx` | Centralized in `types/` directory |
| **Constants** | Hardcoded in each screen | Centralized in `constants/` directory |
| **Components** | Inline sub-components in screens | Extracted to `components/` directory |
| **Firebase access** | Direct SDK calls in screens | Abstracted through service layer |
| **Mock data** | Hardcoded in screen files | Replace with Firestore real-time data |
| **Config** | `config/` directory | Renamed to `context/` for providers, config stays for non-React config |

The `IMPLEMENTATION_PLAN.md` contains the phased plan for closing these gaps.

---

## 9. Error Handling Strategy

```tsx
// services/report.service.ts
export async function createReport(data: CreateReportInput): Promise<{ id: string }> {
  try {
    const docRef = await addDoc(collection(db, 'reports'), {
      ...data,
      createdAt: serverTimestamp(),
      status: 'PENDING',
    });
    return { id: docRef.id };
  } catch (error) {
    console.error('❌ createReport failed:', error);
    throw new AppError('REPORT_CREATE_FAILED', 'Could not submit your report. Please try again.');
  }
}

// hooks/useSubmitReport.ts
const { mutate, loading, error } = useSubmitReport();
// The hook catches the error and exposes it for the screen to display via Toast
```

---

## 10. Testing Strategy (Future)

| Type | Tool | Scope |
|---|---|---|
| Unit tests | Jest | Services, utils, hooks |
| Component tests | React Native Testing Library | Shared components |
| E2E tests | Detox | Critical flows (login, report submission) |

> Testing is not a priority for the MVP but the architecture supports it by keeping logic in testable hooks and services.
