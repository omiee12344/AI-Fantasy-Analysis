# AI Fantasy Analytics Mobile (Expo + React Native)

This folder is the Expo/React Native version of the app.

## Prereqs

- Node.js (LTS recommended)
- Android Studio (for Android emulator) **or** the **Expo Go** app on your phone

## 1) Start the backend API

In one terminal:

```bash
cd "FPL/backend"
npm install
npm run dev
```

By default this project's mobile client expects the API at:

- `http://localhost:3000/api` (works for **web**)

For **Android emulator** you usually need:

- `http://10.0.2.2:3000/api`

For a **real phone** on the same Wi‑Fi, use your PC's LAN IP, e.g.:

- `http://192.168.1.50:3000/api`

## 2) Configure the API base URL for mobile

Set `EXPO_PUBLIC_API_URL` (Expo reads `EXPO_PUBLIC_*` env vars).

### PowerShell (current session)

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:3000/api"
```

## 3) Run the Expo app

In another terminal:

```bash
cd "FPL/mobile"
npm install
npm run start
```

Then:

- Press `a` to open Android
- Press `w` to open web
- Or scan the QR code with **Expo Go** (phone)

## Notes

- **Google sign-in** from the web app uses a popup flow and is not wired up in this mobile scaffold yet.
- Your FPL "My Team" screen needs your **FPL Team ID** (entry id) to call `/team/:id` from the backend.
