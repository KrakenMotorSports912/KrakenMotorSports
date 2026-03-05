# 🚀 INSTALLATION & DEPLOYMENT GUIDE
## Kraken Motorsports - Complete Setup

---

## 📋 PREREQUISITES

Before you start, make sure you have:
- [ ] Node.js 18+ installed ([nodejs.org](https://nodejs.org))
- [ ] Git installed
- [ ] A code editor (VS Code recommended)
- [ ] A Supabase account (free at [supabase.com](https://supabase.com))
- [ ] A Vercel account for deployment (free at [vercel.com](https://vercel.com))

---

## 🎯 STEP-BY-STEP INSTALLATION

### STEP 1: Install Node Packages

Open PowerShell in the project folder and run:

```powershell
npm install
```

This will install all required dependencies (~5 minutes).

---

### STEP 2: Set Up Supabase Database

#### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose a name: `kraken-motorsports`
4. Choose a strong database password (save it!)
5. Select a region close to you
6. Click **"Create new project"** (takes ~2 minutes)

#### 2.2 Get Your API Keys

1. In your Supabase project, go to **Project Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://abcdefg.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
   - **service_role key** (long string, keep secret!)

#### 2.3 Run Database Schema

1. In Supabase, click **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `SUPABASE_SETUP.md` in this project
4. Copy ALL the SQL code from that file
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (bottom right)
7. You should see "Success. No rows returned"

#### 2.4 Set Up Storage Buckets

1. In Supabase, click **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Create bucket: `leaderboard-screenshots`
   - Make it **Public**
   - Allowed MIME types: `image/jpeg,image/png,image/webp`
4. Create another bucket: `event-banners`
   - Make it **Public**
   - Allowed MIME types: `image/jpeg,image/png,image/webp`

#### 2.5 Enable Real-time

1. In Supabase, click **Database** → **Replication**
2. Find `leaderboard_entries` table
3. Enable replication (toggle switch)
4. Find `events` table
5. Enable replication (toggle switch)

---

### STEP 3: Configure Environment Variables

#### 3.1 Create .env.local File

In your project folder, create a file named `.env.local` (copy from `.env.local.example`):

```powershell
cp .env.local.example .env.local
```

#### 3.2 Fill in Your Values

Open `.env.local` in your code editor and replace these values:

```bash
# From Supabase API settings:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Your admin email (use the email you'll sign up with):
ADMIN_EMAIL=your-email@example.com

# Payment links (add later):
NEXT_PUBLIC_FOUNDERS_PASS_PAYPAL=https://paypal.me/yourlink
NEXT_PUBLIC_FOUNDERS_PASS_VENMO=@yourusername

# Site URLs:
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/ag39FaqY
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/krakenmotorsports912/
NEXT_PUBLIC_TIKTOK_URL=https://www.tiktok.com/@krakenmotorsports912
ADMIN_EMAIL=KrakenMotorSports912@gmail.com

# Launch date:
NEXT_PUBLIC_LAUNCH_DATE=2026-07-01
```

**Save the file!**

---

### STEP 4: Run Development Server

```powershell
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

You should see your Kraken Motorsports website! 🦑

---

### STEP 5: Create Your Admin Account

#### 5.1 Sign Up

1. Your site should be running at `localhost:3000`
2. Click **"ADMIN"** in the navigation
3. You'll be redirected to create an account
4. Sign up with your email and password
5. A profile will be **automatically created** for you via database trigger

#### 5.2 Make Yourself Admin

1. Go to Supabase Dashboard
2. Click **Authentication** (left sidebar)
3. Find your user in the list
4. Copy your **User UID** (looks like: `abc123-456-789...`)
5. Go to **SQL Editor**
6. Run this query (replace YOUR_USER_ID):

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'YOUR_USER_ID_HERE';
```

7. Go back to your site at `localhost:3000/admin`
8. You should now see the admin dashboard!

---

### STEP 6: Test Everything

#### Test Leaderboard Submission

1. Go to `localhost:3000/submit` (or create this page)
2. Submit a test lap time
3. Go to admin dashboard
4. You should see your pending submission
5. Approve it
6. Check the live leaderboard - it should appear!

#### Test Real-time Updates

1. Open your site in two browser windows
2. In one window, approve a leaderboard entry in admin
3. Watch the other window's leaderboard update automatically!

---

## 🌐 DEPLOYMENT TO PRODUCTION

### Deploy to Vercel (Free)

#### 1. Push to GitHub

```powershell
git init
git add .
git commit -m "Initial commit - Kraken Motorsports"
git branch -M main
git remote add origin https://github.com/yourusername/kraken-motorsports.git
git push -u origin main
```

#### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **"New Project"**
3. Import your GitHub repository
4. In **Environment Variables**, add ALL variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - All other variables from `.env.local`
5. Click **"Deploy"**
6. Wait 2-3 minutes for deployment

Your site will be live at: `your-project.vercel.app`

#### 3. Update Environment Variables

Go back to `.env.local` and Vercel settings, update:
```bash
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

Redeploy to apply changes.

---

## 🎨 CUSTOMIZATION

### Social Links (Already Configured)

All social links are set in `.env.local`:
```bash
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/ag39FaqY
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/krakenmotorsports912/
NEXT_PUBLIC_TIKTOK_URL=https://www.tiktok.com/@krakenmotorsports912
ADMIN_EMAIL=KrakenMotorSports912@gmail.com
```

For Vercel deployment, also add these as Environment Variables in your Vercel dashboard.

### Change Branding Colors

Edit `tailwind.config.js`:
```js
colors: {
  'kraken': {
    cyan: '#00ffff',      // Your primary color
    // Change other colors here
  },
}
```

Then restart dev server:
```powershell
npm run dev
```

---

## ✅ POST-LAUNCH CHECKLIST

- [ ] Admin account created and working
- [ ] Test leaderboard submission works
- [ ] Real-time updates working
- [ ] Events can be created
- [ ] Discounts can be created
- [ ] Founders Pass page accessible
- [ ] All social links updated
- [ ] Deployed to Vercel
- [ ] Custom domain connected (optional)
- [ ] Discord server created and linked
- [ ] First event scheduled
- [ ] Announced on social media

---

## 🆘 COMMON ISSUES & FIXES

### "Cannot find module" errors
```powershell
rm -rf node_modules
rm package-lock.json
npm install
```

### Supabase connection errors
- Double-check your `.env.local` has correct SUPABASE_URL and keys
- Make sure there are no extra spaces in the keys
- Restart dev server after changing `.env.local`

### Admin dashboard shows "Not authorized"
- Make sure you ran the SQL to set `is_admin = true`
- Clear browser cache and cookies
- Sign out and sign back in

### Real-time not working
- Check Supabase Replication is enabled for leaderboard_entries
- Check browser console for errors (F12)

### Build fails on Vercel
- Check all environment variables are set in Vercel
- Make sure GitHub repo is up to date
- Check build logs for specific error

---

## 📞 NEED HELP?

1. Check the `README_NEXTJS.md` for detailed documentation
2. Check `SUPABASE_SETUP.md` for database help
3. Review component files in `src/components/`
4. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
5. Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

## 🦑 YOU'RE READY!

Your Kraken Motorsports website is now:
- ✅ Fully functional
- ✅ Connected to live database
- ✅ Real-time leaderboard updates
- ✅ Admin dashboard working
- ✅ Ready for production deployment

**UNLEASH THE BEAST!** 🚀
