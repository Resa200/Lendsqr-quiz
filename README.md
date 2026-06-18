# Lendsqr Townhall Quiz

A real-time multiplayer quiz game for Lendsqr townhalls.

## Setup (one-time, ~10 minutes)

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** — name it `lendsqr-quiz`, pick a region
3. Once the project is ready, go to **Settings → API**
4. Copy the **Project URL** and **anon public** key

### 2. Create the database tables
1. In Supabase dashboard, go to **SQL Editor → New Query**
2. Paste the entire contents of `supabase-setup.sql`
3. Click **Run**

### 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ADMIN_PASSWORD=your-secret-password
```

### 4. Run locally
```bash
npm install
npm run dev
```

### 5. Deploy to Vercel
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import the repo
3. In **Environment Variables**, add the three vars from your `.env`
4. Click **Deploy**

---

## How to run a game

### Before the event
- Share the game URL with all participants
- Keep `?admin` URL for yourself (e.g. `https://your-app.vercel.app?admin`)

### During the event
1. Players visit the URL and enter their names → they land in the lobby
2. You (admin) go to `?admin`, enter your password
3. Wait until everyone has joined, then click **🚀 Start Game**
4. All players see Q1 simultaneously — they have 30 seconds
5. Click **👁 Reveal Answer** to show the correct answer to everyone
6. Click **⏭ Next Q** to advance — live leaderboard updates between questions
7. After Q20, the game ends automatically with the final leaderboard + confetti

### Between games
Hit **↺ Reset Everything** in the admin panel to clear all scores and start fresh.

---

## Scoring
- Correct answer: **100 points**
- Speed bonus: up to **+50 points** (faster = more)
- Wrong or no answer: **0 points**

## URLs
| URL | Purpose |
|-----|---------|
| `https://your-app.vercel.app` | Players |
| `https://your-app.vercel.app?admin` | Admin panel |
