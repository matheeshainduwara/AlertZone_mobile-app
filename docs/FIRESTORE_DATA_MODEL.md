# Firestore Data Model — AlertZone

> **Shared Database**: Both the mobile app and admin dashboard read/write to this same Firestore instance.
>
> **Project ID**: `alertzone-3d2a3`

---

## Collections Overview

```
firestore/
├── users/                    # Citizen & admin profiles
│   └── {userId}/
│       └── (document fields)
├── reports/                  # Infrastructure issue reports
│   └── {reportId}/
│       ├── (document fields)
│       └── upvotes/          # Subcollection: who upvoted
│           └── {userd}/
├── notifications/            # Push notification log
│   └── {notificationId}/
│       └── (document fields)
└── app_config/               # System-level config (categories, badge defs)
    └── {configId}/
```

---

## 1. `users` Collection

**Path**: `users/{userId}`

The `userId` matches the Firebase Auth UID.

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `uid` | `string` | ✅ | — | Firebase Auth UID (matches document ID) |
| `fullName` | `string` | ✅ | — | User's display name |
| `email` | `string` | ✅ | — | Email address (from Firebase Auth) |
| `phoneNumber` | `string` | ✅ | — | Phone number |
| `address` | `string` | ❌ | `""` | User's address (can be added later) |
| `area` | `string` | ❌ | `""` | Registered area/district for feed filtering |
| `role` | `string` | ✅ | `"citizen"` | `"citizen"` or `"admin"` |
| `status` | `string` | ✅ | `"active"` | `"active"` or `"suspended"` |
| `isVerified` | `boolean` | ✅ | `false` | Whether email is verified |
| `avatarUrl` | `string` | ❌ | `null` | Profile picture URL (Firebase Storage) |
| `contributionPoints` | `number` | ❌ | `0` | Accumulated contribution score |
| `reportsValidated` | `number` | ❌ | `0` | Count of resolved reports |
| `level` | `number` | ❌ | `1` | User level (calculated from points) |
| `badges` | `string[]` | ❌ | `[]` | Array of earned badge IDs |
| `notificationSound` | `boolean` | ❌ | `true` | Notification sound preference |
| `alertRadius` | `string` | ❌ | `"10 Km"` | Alert radius preference |
| `fcmToken` | `string` | ❌ | `null` | Firebase Cloud Messaging device token |
| `createdAt` | `string` (ISO) | ✅ | — | Account creation timestamp |
| `updatedAt` | `timestamp` | ❌ | — | Last profile update |

### Current State (What's Actually Stored Now)

The signup flow currently writes these fields only:
```typescript
{
  uid: user.uid,
  fullName,
  email,
  phoneNumber: phone,
  role: 'citizen',
  status: 'active',
  isVerified: false,
  createdAt: new Date().toISOString(),
}
```

Fields like `contributionPoints`, `reportsValidated`, `level`, `badges`, `area`, etc. are **not yet written on signup** and need to be added with default values.

### Example Document

```json
{
  "uid": "abc123def456",
  "fullName": "Thamaruj Perera",
  "email": "thamaruj@example.com",
  "phoneNumber": "+94 77 123 4567",
  "address": "No. 06, Nawala Road, Rajagiriya",
  "area": "Rajagiriya",
  "role": "citizen",
  "status": "active",
  "isVerified": true,
  "avatarUrl": "https://firebasestorage.googleapis.com/.../avatar.jpg",
  "contributionPoints": 250,
  "reportsValidated": 8,
  "level": 3,
  "badges": ["first_responder", "mapper", "watchdog"],
  "notificationSound": true,
  "alertRadius": "10 Km",
  "fcmToken": "dGhpcyBpcyBhIGZha2UgdG9rZW4...",
  "createdAt": "2026-05-15T10:30:00.000Z",
  "updatedAt": { "_seconds": 1747340000, "_nanoseconds": 0 }
}
```

---

## 2. `reports` Collection

**Path**: `reports/{reportId}`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `uid` | `string` | ✅ | — | Report author's user UID |
| `authorName` | `string` | ✅ | — | Author's display name (denormalized) |
| `title` | `string` | ✅ | — | Short title (auto-generated from category or user input) |
| `category` | `string` | ✅ | — | Category label: `"Road & Traffic"`, `"Water & Drainage"`, etc. |
| `categoryId` | `string` | ✅ | — | Category machine ID: `"road_traffic"`, `"water_drainage"`, etc. |
| `categoryIcon` | `string` | ✅ | — | Ionicons icon name for the category |
| `categoryColor` | `string` | ✅ | — | Hex color for the category |
| `description` | `string` | ✅ | — | Detailed description (max 500 chars) |
| `location` | `object` | ✅ | — | See Location sub-object below |
| `imageUrls` | `string[]` | ❌ | `[]` | Firebase Storage URLs for evidence photos |
| `videoUrl` | `string` | ❌ | `null` | Firebase Storage URL for evidence video |
| `status` | `string` | ✅ | `"PENDING"` | `"PENDING"`, `"ASSIGNED"`, `"FIXING"`, `"RESOLVED"`, `"REJECTED"` |
| `assignedTo` | `string` | ❌ | `null` | Admin/team member assigned (set by admin) |
| `resolutionNote` | `string` | ❌ | `null` | Note when resolved or rejected (set by admin) |
| `upvoteCount` | `number` | ✅ | `0` | Total upvotes (denormalized count) |
| `isArchived` | `boolean` | ❌ | `false` | Soft-delete flag (set by admin) |
| `createdAt` | `timestamp` | ✅ | — | Report submission time |
| `updatedAt` | `timestamp` | ❌ | — | Last status update time |
| `statusHistory` | `array` | ❌ | `[]` | Array of status change events |

### Location Sub-Object

```typescript
location: {
  address: string;         // Human-readable address
  latitude: number;        // GPS latitude
  longitude: number;       // GPS longitude
  area: string;            // District/area name (for filtering)
}
```

### Status History Entry

```typescript
statusHistory: [
  {
    status: "PENDING",
    changedAt: Timestamp,
    changedBy: "system"       // or admin UID
  },
  {
    status: "ASSIGNED",
    changedAt: Timestamp,
    changedBy: "admin_uid_123",
    note: "Assigned to Western Province maintenance team"
  }
]
```

### Example Document

```json
{
  "uid": "abc123def456",
  "authorName": "Thamaruj Perera",
  "title": "Large Pothole on Nawala Road",
  "category": "Road & Traffic",
  "categoryId": "road_traffic",
  "categoryIcon": "car-outline",
  "categoryColor": "#4CC2D1",
  "description": "There is a very large pothole on the left lane that has caused multiple near-accidents. It's about 2 feet wide and growing.",
  "location": {
    "address": "No. 06, Nawala Road, Rajagiriya, Sri Lanka",
    "latitude": 6.8900,
    "longitude": 79.8900,
    "area": "Rajagiriya"
  },
  "imageUrls": [
    "https://firebasestorage.googleapis.com/.../report_img_1.jpg",
    "https://firebasestorage.googleapis.com/.../report_img_2.jpg"
  ],
  "videoUrl": null,
  "status": "FIXING",
  "assignedTo": "admin_uid_789",
  "resolutionNote": null,
  "upvoteCount": 12,
  "isArchived": false,
  "createdAt": { "_seconds": 1747300000, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1747340000, "_nanoseconds": 0 },
  "statusHistory": [
    { "status": "PENDING", "changedAt": { "_seconds": 1747300000 }, "changedBy": "system" },
    { "status": "ASSIGNED", "changedAt": { "_seconds": 1747310000 }, "changedBy": "admin_uid_789" },
    { "status": "FIXING", "changedAt": { "_seconds": 1747320000 }, "changedBy": "admin_uid_789" }
  ]
}
```

---

## 3. `reports/{reportId}/upvotes` Subcollection

**Path**: `reports/{reportId}/upvotes/{userId}`

Using the user's UID as the document ID ensures one upvote per user per report.

| Field | Type | Required | Description |
|---|---|---|---|
| `uid` | `string` | ✅ | User who upvoted |
| `createdAt` | `timestamp` | ✅ | When the upvote was cast |

### Upvote Flow

1. **Upvote**: Create doc at `reports/{reportId}/upvotes/{userId}` + increment `reports/{reportId}.upvoteCount` (use batch write)
2. **Undo Upvote**: Delete doc + decrement count
3. **Check if upvoted**: Try to read `reports/{reportId}/upvotes/{currentUserId}` — exists = already upvoted

---

## 4. `notifications` Collection

**Path**: `notifications/{notificationId}`

| Field | Type | Required | Description |
|---|---|---|---|
| `recipientUid` | `string` | ✅ | User who receives the notification |
| `type` | `string` | ✅ | `"status_change"`, `"upvote"`, `"badge_earned"`, `"system"` |
| `title` | `string` | ✅ | Notification title |
| `body` | `string` | ✅ | Notification body text |
| `reportId` | `string` | ❌ | Associated report (for deeplink navigation) |
| `data` | `map` | ❌ | Extra payload (status, badge ID, etc.) |
| `isRead` | `boolean` | ✅ | Whether user has read it |
| `createdAt` | `timestamp` | ✅ | When notification was created |

### Example Document

```json
{
  "recipientUid": "abc123def456",
  "type": "status_change",
  "title": "Report Status Updated",
  "body": "Your report \"Large Pothole\" is now being fixed!",
  "reportId": "report_xyz",
  "data": {
    "previousStatus": "ASSIGNED",
    "newStatus": "FIXING"
  },
  "isRead": false,
  "createdAt": { "_seconds": 1747340000, "_nanoseconds": 0 }
}
```

---

## 5. `app_config` Collection (Optional)

**Path**: `app_config/{configId}`

Stores system-level configuration that can be changed without app updates.

### `app_config/categories`
```json
{
  "categories": [
    {
      "id": "road_traffic",
      "label": "Road & Traffic",
      "icon": "car-outline",
      "color": "#4CC2D1",
      "bgColor": "#0D2A35",
      "examples": "Potholes, signals, noise"
    }
  ]
}
```

### `app_config/badges`
```json
{
  "badges": [
    {
      "id": "first_responder",
      "label": "First Responder",
      "icon": "shield",
      "color": "#4CC2D1",
      "criteria": "Submit your first report",
      "pointsAwarded": 50
    }
  ]
}
```

### `app_config/levels`
```json
{
  "levels": [
    { "level": 1, "minPoints": 0, "title": "Newcomer" },
    { "level": 2, "minPoints": 100, "title": "Contributor" },
    { "level": 3, "minPoints": 300, "title": "Active Reporter" },
    { "level": 4, "minPoints": 600, "title": "Community Leader" },
    { "level": 5, "minPoints": 1000, "title": "Safety Champion" }
  ]
}
```

---

## 6. TypeScript Interfaces

These should live in `types/` in the mobile app:

```typescript
// types/user.ts
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  area?: string;
  role: 'citizen' | 'admin';
  status: 'active' | 'suspended';
  isVerified: boolean;
  avatarUrl?: string;
  contributionPoints: number;
  reportsValidated: number;
  level: number;
  badges: string[];
  notificationSound: boolean;
  alertRadius: string;
  fcmToken?: string;
  createdAt: string;
  updatedAt?: any; // Firestore Timestamp
}

// types/report.ts
export type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

export type ReportCategoryId =
  | 'road_traffic'
  | 'water_drainage'
  | 'waste_environment'
  | 'social_safety'
  | 'bridge_structural';

export interface ReportLocation {
  address: string;
  latitude: number;
  longitude: number;
  area: string;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  changedAt: any; // Firestore Timestamp
  changedBy: string; // UID or "system"
  note?: string;
}

export interface Report {
  id: string; // Firestore document ID
  uid: string;
  authorName: string;
  title: string;
  category: string;
  categoryId: ReportCategoryId;
  categoryIcon: string;
  categoryColor: string;
  description: string;
  location: ReportLocation;
  imageUrls: string[];
  videoUrl?: string;
  status: ReportStatus;
  assignedTo?: string;
  resolutionNote?: string;
  upvoteCount: number;
  isArchived: boolean;
  createdAt: any;
  updatedAt?: any;
  statusHistory: StatusHistoryEntry[];
}

// types/notification.ts
export type NotificationType = 'status_change' | 'upvote' | 'badge_earned' | 'system';

export interface AppNotification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  body: string;
  reportId?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: any;
}
```

---

## 7. Indexes Required

Firestore composite indexes needed for queries:

| Collection | Fields | Query Purpose |
|---|---|---|
| `reports` | `uid` ASC, `createdAt` DESC | User's reports sorted by date |
| `reports` | `status` ASC, `createdAt` DESC | Filter by status |
| `reports` | `location.area` ASC, `createdAt` DESC | Area-based feed |
| `reports` | `categoryId` ASC, `createdAt` DESC | Filter by category |
| `reports` | `isArchived` ASC, `status` ASC, `createdAt` DESC | Admin: active reports |
| `notifications` | `recipientUid` ASC, `createdAt` DESC | User's notifications |
| `notifications` | `recipientUid` ASC, `isRead` ASC, `createdAt` DESC | Unread notifications |
| `upvotes` (Collection Group) | `uid` ASC | Fetch user's upvoted reports |

---

## 8. Security Rules (Draft)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Users ──
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId
                    && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status']);
      // Admins can read all users and update status
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow update: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // ── Reports ──
    match /reports/{reportId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.status == 'PENDING';
      // Only admins can update status
      allow update: if request.auth != null
                    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // ── Upvotes subcollection ──
      match /upvotes/{upvoteUserId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.auth.uid == upvoteUserId;
        allow delete: if request.auth != null && request.auth.uid == upvoteUserId;
      }

      // ── Comments subcollection ──
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
        allow update: if request.auth != null && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['upvoteCount']);
      }
    }

    // ── Upvotes collectionGroup ──
    match /{path=**}/upvotes/{upvoteUserId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == upvoteUserId;
      allow delete: if request.auth != null && request.auth.uid == upvoteUserId;
    }

    // ── Notifications ──
    match /notifications/{notifId} {
      allow read: if request.auth != null && resource.data.recipientUid == request.auth.uid;
      allow update: if request.auth != null && resource.data.recipientUid == request.auth.uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
      // Only server (Cloud Functions) should create notifications
      allow create: if false;
    }

    // ── App Config ──
    match /app_config/{configId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only via Firebase Console or Cloud Functions
    }
  }
}
```
