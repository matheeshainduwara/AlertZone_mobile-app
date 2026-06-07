# AGENTS.md — AlertZone Mobile App

> **⚠️ MANDATORY**: Every AI agent MUST read `docs/AGENTS.md`, `docs/CURRENT_STATUS.md`, and `docs/IMPLEMENTATION_PLAN.md` before beginning any work on this project. No exceptions.

---

## 1. What Is AlertZone?

**AlertZone** is a **citizen-driven safety and infrastructure reporting platform** built for Sri Lanka. It empowers everyday citizens to report public safety concerns — potholes, broken streetlights, blocked drains, illegal dumping, etc. — directly to local government authorities via a mobile app.

### Core Mission

> *"Stay Aware. Stay Safe."*

AlertZone bridges the gap between citizens and local authorities by providing a transparent, trackable, and community-driven system for infrastructure issue reporting and resolution.

---

## 2. Project Overview

| Attribute | Detail |
|---|---|
| **Project Type** | University Group Project |
| **Platform** | Mobile (React Native / Expo) |
| **Target Region** | Sri Lanka |
| **Backend** | Firebase (Auth + Firestore + Storage) |
| **Admin Panel** | Separate Next.js project (`alertzone-admin-dashboard`) |
| **Companion Repo** | `../alertzone-admin-dashboard/` |

---

## 3. Core Features

### 3.1 Citizen (Mobile App)

| Feature | Description |
|---|---|
| **User Registration & Auth** | Email/password sign-up with email verification. Google Sign-In planned for a future phase. |
| **Onboarding Flow** | 3-screen onboarding carousel introducing the app's mission. |
| **Report Submission** | Citizens can submit infrastructure concerns with: category selection, description, photo/video evidence, and automatic GPS location. |
| **Report Tracking** | Citizens can track the lifecycle of their reports through stages: `PENDING → FIXING → RESOLVED` (or `REJECTED`). |
| **Notifications** | Users receive push notifications when their reports escalate to different stages (e.g., accepted, assigned, fixing, resolved). |
| **Community Upvoting** | Users registered in the same area can upvote concerns submitted by others, increasing priority and visibility. |
| **Map View** | Interactive Google Maps view showing all nearby active reports with category-based pins and filters. |
| **Report History** | Full list of the user's submitted reports with status filters (All, Pending, Fixing, Resolved, Rejected). |
| **User Profile** | Displays user information, contribution stats, earned badges, and account settings. |
| **Badge/Gamification System** | Citizens earn badges over time for successfully reporting concerns. Badges are visible on their profile (e.g., "First Responder", "Early Bird", "Community Hero", "Mapper"). |
| **Area-Based Feeds** | Users see reports and updates relevant to their registered area/location radius. |
| **Alert Preferences** | Configurable notification sound and alert radius settings. |

### 3.2 Admin (Web Dashboard)

| Feature | Description |
|---|---|
| **Admin Authentication** | Secure login for authorized admin/government users. |
| **Report Management** | View all submitted reports, filter by status/category/location, assign reports to field teams. |
| **Report Archival** | Admins can delete (archive) reports that are no longer relevant. |
| **Status Updates** | Admins can update report statuses, triggering citizen notifications. |
| **Analytics & Trends** | Graphical reports showing trends: reports over time, category breakdown, resolution rates. Filterable by date range, category, area. |
| **Map Overview** | Geographic visualization of all reports on an interactive map. |
| **User Management** | View registered citizens, manage accounts (suspend/activate). |
| **Notification Management** | Send targeted notifications to users. |

---

## 4. Report Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ SUBMITTED│ ──► │ PENDING  │ ──► │ ASSIGNED │ ──► │ FIXING   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                       │                                  │
                       │                                  ▼
                       │                           ┌──────────┐
                       │                           │ RESOLVED │
                       │                           └──────────┘
                       │
                       ▼
                 ┌──────────┐
                 │ REJECTED │
                 └──────────┘
```

**Status Definitions:**
- **PENDING** — Report submitted by citizen, awaiting admin review.
- **ASSIGNED** — Admin has reviewed and assigned the report to a field team.
- **FIXING** — Field team is actively working on the issue.
- **RESOLVED** — Issue has been fixed and closed.
- **REJECTED** — Report deemed invalid or irrelevant (with reason provided to citizen).

Citizens are notified at each stage transition.

---

## 5. Badge / Gamification System

Badges incentivize continued community engagement:

| Badge | Criteria | Icon |
|---|---|---|
| **First Responder** | Submit your first report | `shield` |
| **Early Bird** | First to report an issue in a new area | `sunny` |
| **Community Hero** | Receive 50+ total upvotes on reports | `people` |
| **Mapper** | Report issues across 5+ different locations | `map` |
| **Watchdog** | Submit 10+ validated reports | `eye` |
| **Trend Setter** | Have a report go viral (100+ upvotes) | `trending-up` |
| **Consistent Reporter** | Report at least once a week for 4 consecutive weeks | `calendar` |

Badges are stored in the user's Firestore profile and displayed on their mobile profile screen. Contribution points accumulate alongside badge progress, and users have a level that increases with activity.

---

## 6. Technology Stack

### Mobile App
| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo SDK 53 |
| Routing | Expo Router v6 (file-based) |
| Styling | NativeWind v4 (TailwindCSS 3) |
| State | React Context (AuthProvider, ScrollProvider) |
| Maps | react-native-maps + Google Maps |
| Location | expo-location |
| Backend | Firebase JS SDK v12 |
| Auth | Firebase Auth (email/password + planned Google) |
| Database | Cloud Firestore |
| Storage | Firebase Storage (planned) |
| Notifications | Firebase Cloud Messaging (planned) |
| Language | TypeScript |

### Admin Dashboard
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Maps | Leaflet + react-leaflet |
| Backend | Firebase JS SDK v12 |
| Language | TypeScript |

---

## 7. Project Structure (Mobile App)

```
alertzone-mobile-app/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (AuthProvider + Toast)
│   ├── index.tsx                 # Landing / splash screen
│   ├── onboarding.tsx            # 3-step onboarding carousel
│   ├── (auth)/                   # Auth route group
│   │   ├── loginScreen.tsx       # Email/password login
│   │   ├── signupScreen.tsx      # Registration + email verification
│   │   └── passwordReset.tsx     # Forgot password flow
│   └── (tabs)/                   # Main app tab group (auth-gated)
│       ├── _layout.tsx           # Tab navigator + custom tab bar
│       ├── home.tsx              # Dashboard / home feed
│       ├── map.tsx               # Interactive map with issue pins
│       ├── report.tsx            # New report submission form
│       ├── history.tsx           # User's report history + detail modal
│       └── profile.tsx           # Profile, badges, settings, edit, logout
├── config/                       # App-wide configuration
│   ├── authConfig.tsx            # AuthContext + useAuth hook
│   ├── tabBarScrollContext.tsx    # Tab bar hide-on-scroll behaviour
│   └── toastConfig.tsx           # Custom toast styling
├── services/                     # External service connections
│   └── firebase.ts              # Firebase app + auth + Firestore init
├── assets/                       # Images, icons, onboarding illustrations
├── .env                          # Firebase + Google Maps API keys
├── app.json                      # Expo config
├── package.json                  # Dependencies
├── tailwind.config.js            # NativeWind/Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## 8. Design System

| Token | Value | Usage |
|---|---|---|
| **Background Gradient** | `['#0D1F2D', '#0A1820', '#071318']` | All screens |
| **Primary Accent** | `#4CC2D1` | Buttons, active states, links |
| **Secondary Accent** | `#30A89C` | Brand green, badges |
| **Surface** | `#111E27` | Cards, containers |
| **Surface Elevated** | `#1E3A44` | Input fields, modals |
| **Border** | `#1E3347` / `#2D4F5C` | Card outlines, dividers |
| **Text Primary** | `#FFFFFF` | Headings, primary text |
| **Text Secondary** | `#5A7D8A` / `gray-400` | Labels, descriptions |
| **Danger** | `#E05C5C` | Errors, logout, rejected |
| **Warning** | `#F59E0B` | Pending status |
| **Success** | `#30A89C` / `#34D399` | Resolved, success toasts |
| **Purple Accent** | `#A78BFA` | Community Hero badge, social safety |

---

## 9. Agent Rules

### Before Starting ANY Work

1. **Read** `docs/AGENTS.md` (this file) — understand the project's purpose and architecture.
2. **Read** `docs/CURRENT_STATUS.md` — know what is done, what is broken, and what is pending.
3. **Read** `docs/IMPLEMENTATION_PLAN.md` — find the specific phase/task you are working on.
4. **Read** `docs/FIRESTORE_DATA_MODEL.md` — understand the data schema before touching any Firebase code.
5. **Read** `docs/ARCHITECTURE.md` — understand the target architecture and coding patterns.

### During Work

- **Follow the target architecture** defined in `ARCHITECTURE.md`. All new code should go in the correct directory.
- **Use the shared design tokens** (colors, spacing). Do NOT introduce ad-hoc hardcoded colors.
- **Replace mock data with Firestore calls** when the task requires it — refer to the data model.
- **Keep screens thin** — business logic belongs in hooks/services, not inline in screen files.
- **Write TypeScript** with proper types. Use the shared interfaces from `types/`.
- **Test on Android** — the primary target device (the project uses `expo run:android`).

### After Completing Work

1. **Update relevant documentation** (including `docs/CURRENT_STATUS.md` and any other affected docs) **before each and every commit**. Keeping documentation in sync is a strict requirement before committing any changes.
2. **Commit with a descriptive message** — format: `feat: <what was done>` or `fix: <what was fixed>`.
3. **Do not break existing features** — if you change auth flow or navigation, verify the app still loads.

### Commit Message Convention

```
feat: add report submission with Firestore
fix: resolve login redirect loop
refactor: extract report card into shared component
docs: update CURRENT_STATUS after Phase 2 completion
chore: add expo-image-picker dependency
```

---

## 10. Shared Firebase Project

Both the mobile app and the admin dashboard connect to the **same Firebase project** (`alertzone-3d2a3`). This means:

- They share the same Firestore database.
- They share the same Auth user pool.
- Changes to Firestore rules or data model affect both apps.
- Security rules must account for both citizen (mobile) and admin (web) access patterns.

### Environment Variables

**Mobile App** (`.env`):
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
GOOGLE_MAPS_API_KEY=...
```

**Admin Dashboard** (`.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 11. Key Contacts & Roles

This is a university group project. All team members are students collaborating on different parts of the system:

- **Mobile App Team** — Working on the React Native / Expo mobile application.
- **Admin Dashboard Team** — Working on the Next.js admin web panel.
- **Both teams** share a single Firebase backend and must coordinate on data model changes.
