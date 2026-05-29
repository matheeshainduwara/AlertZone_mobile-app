# AlertZone Push Notifications Guide

This document explains exactly how push notifications are configured in the AlertZone ecosystem, the architecture behind them, and step-by-step instructions on how the native Android push notification pipeline was set up.

## 1. High-Level Architecture

For a push notification to reach a user's phone, it travels through several services:

1. **Admin Dashboard (Next.js):** Triggers the push notification (e.g., sending a broadcast or updating a report status). It queries the user's `expoPushToken` from Firestore.
2. **Expo Push API:** The Admin Dashboard sends the message payload to Expo's Push servers (`https://exp.host/--/api/v2/push/send`).
3. **Google Firebase Cloud Messaging (FCM):** Expo's servers cannot talk directly to an Android phone. They must forward the message to Google's FCM servers. 
4. **Android OS:** Google's FCM servers wake up the user's phone and display the native notification in the system tray.

To make this pipeline work, **two different authentication links** must be established using two distinct JSON files.

---

## 2. The Two Configuration Files (Crucial Distinction)

Understanding the difference between these two files is the most important part of the setup:

### A. `google-services.json` (Client-Side / Public)
* **What it is:** A public configuration file that tells your compiled Android APK how to identify itself to Google.
* **Where it lives:** Inside the `alertzone-mobile-app` folder (bundled into the APK).
* **Security:** **Safe to commit.** It only contains public API keys and your Android Package Name (`com.anonymous.alertzone`). Anyone who downloads your app can extract this file. It is protected by your Firestore Security Rules.
* **Purpose:** Allows the mobile app to successfully request a Push Token from Google when the app launches.

### B. `service-account.json` (Server-Side / Private)
* **What it is:** A highly sensitive private key that grants **full admin access** to your entire Firebase project.
* **Where it lives:** Kept securely on your backend server (`alertzone-admin-dashboard`) and uploaded directly to Expo's secure credential vault.
* **Security:** **NEVER put this in the mobile app.** If an attacker gets this file, they can delete your entire database and bypass all security rules.
* **Purpose:** Allows Expo's Push Servers to securely authenticate with Google's FCM servers on your behalf to deliver the push notifications.

---

## 3. Step-by-Step Setup Process

Here is the exact step-by-step process we followed to get push notifications working on Android:

### Step 1: Mobile App Client Configuration
1. Created an **Android App** in the Firebase Console Settings (matching the package name `com.anonymous.alertzone`).
2. Downloaded the `google-services.json` file.
3. Placed the file in the root of the `alertzone-mobile-app`.
4. Updated `app.json` to tell Expo where the file is:
   ```json
   "android": {
     "package": "com.anonymous.alertzone",
     "googleServicesFile": "./google-services.json"
   }
   ```
5. Triggered a new native build (`eas build --platform android --profile preview`) to compile this file into the APK.

### Step 2: Uploading Server Credentials to Expo
Because Expo needs permission to forward messages to Google's FCM, we had to upload the Firebase Admin private key.
1. Downloaded the `service-account.json` private key from Firebase Console -> Service Accounts.
2. Opened a terminal in the `alertzone-mobile-app` folder.
3. Ran the interactive command: `eas credentials`
4. Selected **Android** -> **preview** profile -> **Google Service Account**.
5. Provided the path to the `service-account.json` file (which was stored safely in the dashboard folder).
*Expo encrypts and stores this key on their secure servers.*

### Step 3: Handling Push Tokens in the App
When a user opens the newly built standalone APK:
1. The app checks if it is running in **Expo Go**. (If yes, it skips registration because Expo Go cannot receive custom native push notifications).
2. The app asks the user for Notification Permissions.
3. It calls `Notifications.getExpoPushTokenAsync()`. Because `google-services.json` is bundled in the app, Google issues a valid token.
4. The token is saved to the user's document in the Firestore `users` collection as `expoPushToken`.

### Step 4: Sending Notifications from the Dashboard
When an admin sends a broadcast:
1. The dashboard queries Firestore for all users with `role === "citizen"`.
2. It extracts their `expoPushToken`s.
3. It sends a batch HTTP POST request to the Expo Push API.
4. Expo receives the request, uses the `service-account.json` key we uploaded earlier to authenticate with Google, and Google delivers the notification to the user's phone.

---

## 4. Testing & Troubleshooting

### Why Notifications don't work in Expo Go
You will often see this log: `ℹ️ Running in Expo Go. OS push notification listeners are skipped.`
Because Expo Go is a generic shared app (not signed with your specific `google-services.json`), it cannot generate a valid push token for your project. **You must always build a standalone APK via EAS to test native push notifications.**

### How to Isolate Issues
If notifications stop working, use the **[Expo Push Tool](https://expo.dev/notifications)**:
1. Copy your `expoPushToken` from Firestore.
2. Paste it into the Expo Push Tool website.
3. Under Android, ensure you enter **Channel ID:** `alertzone-alerts`.
4. Send the test notification.
   * **If it arrives:** Your app and Expo credentials are fine. The bug is in the Admin Dashboard code.
   * **If it fails (e.g., InvalidCredentials):** Your Expo server credentials (`service-account.json`) are missing or expired. Run `eas credentials` again to fix it.
