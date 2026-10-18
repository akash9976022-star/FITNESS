# FitMaintenance AI 🏋️‍♂️⚡

A production-ready React, Tailwind CSS, and Vite progressive fitness web and mobile application with automated **GitHub Pages Web deployment** and cloud-built **Android APK Release**.

---

### 🌐 Live Web Application & 📱 Android APK
- **Live Web App Link:** [https://akash9976022-star.github.io/FITNESS/](https://akash9976022-star.github.io/FITNESS/)
- **Download Android APK:** [GitHub Releases - FitMaintenance-AI.apk](https://github.com/akash9976022-star/FITNESS/releases)
- **GitHub Actions Workflows:** [View Automatic Builds & Releases](https://github.com/akash9976022-star/FITNESS/actions)

---

### ⚡ 1-Step GitHub Pages Activation
To enable the live weblink on GitHub:
1. Open your repository on GitHub: [https://github.com/akash9976022-star/FITNESS](https://github.com/akash9976022-star/FITNESS)
2. Click **Settings** (top menu) ➔ **Pages** (left sidebar).
3. Under **Build and deployment** ➔ **Source**, select **GitHub Actions**.
4. That's it! GitHub will automatically deploy your live web app to `https://akash9976022-star.github.io/FITNESS/` and compile the `FitMaintenance-AI.apk` on every push.

---

## 🌟 Key Architectural Features

### 1. Router & Navigation Architecture
- **HashRouter Implementation (`/#/` routing):** Mandatory for static web hosting (GitHub Pages, GitLab Pages) and Capacitor Android web views. Static hosts return 404 errors on direct browser refreshes with `BrowserRouter`. `HashRouter` ensures 100% reliable page reloads on any host and inside local native Android asset directories (`capacitor://localhost`).
- **Responsive Layout Shell (`src/components/layout/AppLayout.tsx`):**
  - **Desktop Viewport:** Persistent sidebar navigation with FitMaintenance branding, live connectivity badges, active navigation pills, and user profile drawer.
  - **Mobile Viewport:** Fixed bottom navigation bar with safe-area inset spacing (`env(safe-area-inset-bottom)`), quick-access tabs, and slide-over menu drawer.
- **Route Protection (`src/components/ProtectedRoute.tsx`):** Restricts authenticated routes (`/`, `/workouts`, `/nutrition`, `/ai-coach`, `/settings`). Automatically redirects unauthenticated requests to `/login` while storing previous location state for seamless redirect after login.

### 2. Firebase Modular SDK & Firestore Initialization
- **Environment Variables (`import.meta.env.VITE_FIREBASE_*`):**
  - Fully typed Vite configuration (`src/vite-env.d.ts`).
  - `.env.example` template provided for quick project setup.
- **Authentication Providers (`src/context/AuthContext.tsx`):**
  - **Email & Password Authentication** (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`).
  - **Google OAuth Sign-In** (`signInWithPopup` via `GoogleAuthProvider`).
  - **Demo Fast-Track:** Allows immediate testing of all routes and layout features even before Firebase keys are provisioned.
- **Firestore Instance:** Exported modular database instance (`db`) from `src/config/firebase.ts`.

### 3. Capacitor Android Compatibility
- **Relative Base Asset Path (`base: './'` in `vite.config.ts`):** Guarantees that built JavaScript and CSS bundles resolve accurately on both GitHub subpaths (e.g. `username.github.io/repo/`) and Capacitor Android local assets (`android/app/src/main/assets/public`).
- **Safe Area Insets:** Handled in `src/index.css` with dynamic CSS viewport units (`100dvh`) to prevent layout clipping around device camera cutouts and Android navigation bars.
- Native Android Gradle project ready in `android/`.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your credentials from [Firebase Console](https://console.firebase.google.com/) > Project Settings > General > Your apps (Web):
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
```

### 3. Start Development Server
```bash
npm run dev
```

---

## 📱 Capacitor Android Build & Run

To sync web assets and launch Android Studio:
```bash
# 1. Build production web bundle
npm run build

# 2. Sync web bundle to Android native folder
npm run cap:sync

# 3. Open project in Android Studio
npm run cap:android
```

Or run all in one step:
```bash
npm run cap:build
```

---

## 🌐 GitHub Pages Deployment

Because the application uses `HashRouter` and relative paths (`base: './'`), deploying to GitHub Pages requires no route rewrites or 404 hacks:

1. Build the production files:
   ```bash
   npm run build
   ```
2. Deploy the `dist` directory to the `gh-pages` branch using `gh-pages` CLI:
   ```bash
   npx gh-pages -d dist
   ```
3. In your GitHub repository settings under **Pages**, set the source branch to `gh-pages`.

---

## 📂 Project Directory Structure

```
fitness/
├── android/                   # Capacitor Native Android Project (Gradle)
├── dist/                      # Production compiled assets
├── public/                    # Static favicon and assets
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx  # Responsive shell (Desktop sidebar + Mobile bottom bar)
│   │   └── ProtectedRoute.tsx # Route auth guard
│   ├── config/
│   │   └── firebase.ts        # Modular Firebase SDK & Firestore init
│   ├── context/
│   │   └── AuthContext.tsx    # Firebase Auth provider (Email/Pass + Google)
│   ├── pages/
│   │   ├── AiCoach.tsx        # FitMaintenance AI chat consultation
│   │   ├── Dashboard.tsx      # Metrics split view (BMR, TDEE, Workouts)
│   │   ├── Login.tsx          # Dual tab sign-in/up & Google auth
│   │   ├── Nutrition.tsx      # Mifflin-St Jeor maintenance calorie engine
│   │   ├── Settings.tsx       # Firebase diagnostics & Capacitor platform info
│   │   └── Workouts.tsx       # Volume tracker & exercise set logger
│   ├── utils/
│   │   └── platform.ts        # Capacitor platform detection helpers
│   ├── App.tsx                # HashRouter Route hierarchy
│   ├── index.css              # Tailwind CSS directives & safe-area insets
│   ├── main.tsx               # Entry point with HashRouter & AuthProvider
│   └── vite-env.d.ts          # Vite environment types
├── .env.example               # Template environment variables
├── capacitor.config.ts        # Capacitor configuration (App ID: com.fitmaintenance.ai)
├── package.json
├── tailwind.config.js
└── vite.config.ts             # Relative base configuration for universal hosts
```
