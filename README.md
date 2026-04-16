# CFA Ace Tracker

A deployable React + Vite build of the CFA Ace Tracker app.

## What is included

- Public landing page
- App workspace
- Dashboard
- Daily Log
- Subjects
- Analytics
- Heat Map
- Weekly Review
- Settings
- Local browser persistence
- Import / export JSON backups

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal in this folder.
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL shown in the terminal.

## Build for production

```bash
npm install
npm run build
```

## Deploy to Vercel

### Option 1: easiest route

1. Create a GitHub repository.
2. Upload this project folder to the repo.
3. Go to Vercel.
4. Click **Add New Project**.
5. Import the GitHub repository.
6. Vercel should detect **Vite** automatically.
7. Click **Deploy**.

### Option 2: drag and drop

1. Run:

```bash
npm install
npm run build
```

2. Upload the generated `dist` folder to a static host that supports Vite output.

## Notes

- User data is stored in browser local storage.
- Users can export a JSON backup and restore it later.
- This is a front-end product shell. It does not include authentication or a backend database yet.

## Strong next upgrades

- Supabase or Firebase backend
- User accounts and sync across devices
- Real auth flow
- Topic-level mastery tracking
- Notifications and reminders
- Stripe payments if commercialized
