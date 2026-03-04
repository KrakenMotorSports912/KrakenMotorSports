# 🦑 Kraken Motorsports - Full Stack Web Application

## Complete Next.js + Supabase Racing Rig Website

This is the production-ready rebuild of Kraken Motorsports with:
- ✅ Live leaderboard with real-time updates
- ✅ Admin dashboard for managing events, discounts, and entries
- ✅ Database-backed dynamic content
- ✅ Authentication system
- ✅ Event management
- ✅ Discount/pricing system
- ✅ Founders Pass program

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings → API** and copy your keys
4. Go to **SQL Editor** and run the schema from `SUPABASE_SETUP.md`

### 3. Configure Environment Variables

Create `.env.local` file (copy from `.env.local.example`):

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials and other settings.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Admin Account

1. Sign up on your site
2. Find your user ID in Supabase Dashboard → Authentication
3. Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'your-user-id-here';
```

4. Access admin dashboard at `/admin`

---

## 📁 Project Structure

```
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── submit/           # Leaderboard submission
│   │   └── founders-pass/    # Founders Pass registration
│   ├── components/           # React components
│   │   ├── Navigation.tsx
│   │   ├── Hero.tsx
│   │   ├── LiveLeaderboard.tsx
│   │   ├── UpcomingEvents.tsx
│   │   ├── FoundersPass.tsx
│   │   ├── Branding.tsx
│   │   ├── Countdown.tsx
│   │   ├── Contact.tsx
│   │   └── Footer.tsx
│   ├── lib/                  # Utility functions
│   │   └── supabase/         # Supabase clients
│   └── types/                # TypeScript types
│       └── supabase.ts       # Database types
├── public/                   # Static assets
├── SUPABASE_SETUP.md        # Database schema & setup
├── package.json
└── README.md
```

---

## 🎮 Racing Game Integration

### Supported Games

- Assetto Corsa
- Assetto Corsa Competizione
- F1 2025
- Forza Motorsport
- Forza Horizon

### How Leaderboard Works

1. **Players submit lap times** via `/submit` page
2. **Upload screenshot** for verification
3. **Admin reviews** submission in dashboard
4. **Approve/Reject** - approved times appear on live leaderboard
5. **Real-time updates** - leaderboard updates instantly for all users

### Future: Direct API Integration

For automatic time submission, you can integrate with:
- SimHub (for telemetry data)
- Game-specific plugins
- Custom overlay software

---

## 🛠️ Admin Dashboard Features

Access at `/admin` (requires admin account)

### Leaderboard Management
- View all pending submissions
- Approve/reject lap times
- View screenshots for verification
- Delete entries

### Event Management
- Create racing events
- Set prizes and participant limits
- Manage event status (active/inactive)
- Track registrations

### Discount Management
- Create discount codes
- Set percentage or fixed amount discounts
- Limit usage per code
- Set expiration dates
- Apply to sessions, Founders Pass, or merch

### Founders Pass Management
- View all pass holders (50 max)
- Track payment status
- Manage reservations
- Export pass holder list

---

## 💳 Payment Integration

### Current Setup (Simple)

Edit `.env.local`:
```bash
NEXT_PUBLIC_FOUNDERS_PASS_PAYPAL=https://paypal.me/yourlink
NEXT_PUBLIC_FOUNDERS_PASS_VENMO=@yourusername
```

### Future: Stripe Integration

To add Stripe payments:
1. Install Stripe SDK: `npm install stripe @stripe/stripe-js`
2. Add Stripe keys to `.env.local`
3. Create API routes for payment processing
4. Update Founders Pass form with Stripe checkout

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Import your GitHub repo
4. Add environment variables from `.env.local`
5. Deploy!

Your site will be live at `your-project.vercel.app`

### Custom Domain

In Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## 📊 Database Management

### Backup Database

In Supabase Dashboard:
- Go to Database → Backups
- Create backup before major changes

### Add New Tracks/Cars

```sql
-- Add track
INSERT INTO tracks (name, game, length_km, turns) 
VALUES ('Monaco', 'f1_2025', 3.337, 19);

-- Add car
INSERT INTO cars (name, game, class, manufacturer) 
VALUES ('Alpine A110', 'assetto_corsa', 'Road', 'Alpine');
```

### View Analytics

```sql
-- Most popular games
SELECT game, COUNT(*) as entries 
FROM leaderboard_entries 
WHERE status = 'approved' 
GROUP BY game ORDER BY entries DESC;

-- Best drivers
SELECT driver_name, COUNT(*) as wins 
FROM leaderboard_entries 
WHERE status = 'approved' 
GROUP BY driver_name ORDER BY wins DESC LIMIT 10;
```

---

## 🔐 Security

### Row Level Security (RLS)

Supabase RLS policies ensure:
- Users can only edit their own submissions
- Only admins can approve/reject entries
- Only admins can manage events and discounts
- Founders Pass data is protected

### Environment Variables

Never commit `.env.local` to Git. It's in `.gitignore`.

---

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js`:
```js
colors: {
  'kraken': {
    cyan: '#00ffff',      // Change to your color
    'cyan-dark': '#0088aa',
    // ... more colors
  },
}
```

### Update Content

- Edit components in `src/components/`
- Modify text, images, links directly in React components
- No CMS needed - it's all code

### Add New Games

1. Update database schema (add to CHECK constraint)
2. Update TypeScript types
3. Add to game selection dropdowns

---

## 🐛 Troubleshooting

### "Supabase client error"
- Check your `.env.local` has correct SUPABASE_URL and keys
- Verify Supabase project is running

### "Not authorized" in admin
- Run SQL to make yourself admin
- Clear browser cache and re-login

### Leaderboard not updating
- Check Supabase Replication is enabled
- Verify real-time subscriptions are working

### Build errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Run `npm run dev`

---

## 📚 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel
- **Real-time**: Supabase Realtime
- **Language**: TypeScript

---

## 🔄 Updates & Maintenance

### Update Dependencies

```bash
npm update
```

### Database Migrations

When you change the schema:
1. Update `SUPABASE_SETUP.md`
2. Run new SQL in Supabase
3. Regenerate types: `npx supabase gen types typescript --project-id YOUR_ID > src/types/supabase.ts`

---

## 📞 Support

Need help?
- Check `SUPABASE_SETUP.md` for database issues
- Review component files for frontend changes
- Join our Discord for community support

---

## 🦑 Unleash the Beast!

Your Kraken Motorsports website is ready to dominate the racing world.

**What's Next?**
1. Customize branding and content
2. Set up social media accounts
3. Create first event
4. Launch Founders Pass sales
5. Start building the physical rig!

Built with 🦑 and adrenaline.
© 2026 Kraken Motorsports
