# 🦑 Kraken Motorsports - VR Racing Rig Experience

**A complete, production-ready website for launching a VR racing rig with live leaderboards, admin dashboard, and real-time updates.**

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Built with Next.js](https://img.shields.io/badge/built%20with-Next.js%2014-000000?logo=next.js)
![Database](https://img.shields.io/badge/database-Supabase-3FCF8E?logo=supabase)

---

## 📌 Quick Links

- **🚀 [GET STARTED](START_HERE.md)** - Read this first!
- **📖 [Installation Guide](INSTALLATION_GUIDE.md)** - Step-by-step setup
- **🗄️ [Database Setup](SUPABASE_SETUP.md)** - Schema and configuration
- **📚 [Full Documentation](README_NEXTJS.md)** - Complete technical docs
- **📋 [Quick Reference](QUICK_REFERENCE.txt)** - Checklist & commands

---

## ✨ Features

### 🏎️ **Live Leaderboard System**
- Real-time lap time submissions
- Multi-game support (Assetto Corsa, F1 2025, Forza, etc.)
- Admin approval workflow
- Instant updates across all users
- Screenshot verification
- Ranked display with medals

### 👨‍💼 **Complete Admin Dashboard**
- **Leaderboard Management** - Approve/reject submissions
- **Event Management** - Create tournaments and races
- **Discount System** - Promotional codes with limits
- **Founders Pass Tracking** - Monitor all 50 pass holders
- **Analytics Dashboard** - Real-time stats and metrics

### 🎮 **Game Integration**
- Assetto Corsa (all versions)
- Assetto Corsa Competizione
- F1 2025
- Forza Motorsport
- Forza Horizon
- Manual submission system
- Ready for future API integration

### 🎫 **Founders Pass Program**
- Limited to 50 passes
- Full tracking and management
- Perk system (discounts, VIP access, etc.)
- Payment tracking
- Export functionality

### 📅 **Event System**
- Create racing events and tournaments
- Set prizes and participant limits
- Track registrations
- Display on homepage
- Countdown timers

### 💰 **Discount & Pricing**
- Create promotional codes
- Percentage or fixed-amount discounts
- Usage limits and expiration dates
- Apply to multiple product types
- Track usage analytics

### 🎨 **Beautiful Frontend**
- Dark-cyan Kraken aesthetic
- Fully responsive (mobile/tablet/desktop)
- Smooth animations
- Modern UI with Tailwind CSS
- Accessibility features

### 🔐 **Security & Authentication**
- Supabase Auth integration
- Row-level security policies
- Admin role system
- Protected routes
- Secure API endpoints

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (React) |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Real-time** | Supabase Realtime |
| **Storage** | Supabase Storage |
| **Hosting** | Vercel (recommended) |
| **Language** | TypeScript |
| **Icons** | Lucide React |
| **Charts** | Recharts (optional) |

---

## 📂 Project Structure

```
kraken-motorsports/
│
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout with Toaster
│   │   ├── page.tsx                  # Homepage with all sections
│   │   ├── globals.css               # Global styles & animations
│   │   └── admin/                    # Admin dashboard pages
│   │       ├── layout.tsx            # Admin layout with nav
│   │       ├── page.tsx              # Dashboard overview
│   │       ├── leaderboard/          # Manage submissions
│   │       ├── events/               # Manage events
│   │       ├── discounts/            # Manage discounts
│   │       └── founders/             # Manage passes
│   │
│   ├── components/                   # React components
│   │   ├── Navigation.tsx            # Top navigation bar
│   │   ├── Hero.tsx                  # Landing section
│   │   ├── About.tsx                 # Rig information
│   │   ├── LiveLeaderboard.tsx       # Real-time leaderboard
│   │   ├── UpcomingEvents.tsx        # Events display
│   │   ├── FoundersPass.tsx          # Pass info & CTA
│   │   ├── Branding.tsx              # Brand identity
│   │   ├── Countdown.tsx             # Launch countdown
│   │   ├── Contact.tsx               # Social links
│   │   └── Footer.tsx                # Site footer
│   │
│   ├── lib/                          # Utility functions
│   │   └── supabase/
│   │       ├── client.ts             # Client-side Supabase
│   │       └── server.ts             # Server-side Supabase
│   │
│   └── types/
│       └── supabase.ts               # Database types
│
├── public/                           # Static assets
│
├── Configuration Files
│   ├── package.json                  # Dependencies
│   ├── next.config.js                # Next.js config
│   ├── tailwind.config.js            # Tailwind theme
│   ├── tsconfig.json                 # TypeScript config
│   ├── postcss.config.js             # PostCSS config
│   └── .env.local.example            # Environment template
│
└── Documentation
    ├── START_HERE.md                 # ⭐ Begin here!
    ├── INSTALLATION_GUIDE.md         # Step-by-step setup
    ├── SUPABASE_SETUP.md             # Database schema
    ├── README_NEXTJS.md              # Technical docs
    ├── QUICK_REFERENCE.txt           # Commands & checklist
    └── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- Git ([download](https://git-scm.com))
- Supabase account ([create free](https://supabase.com))
- Vercel account for deployment ([create free](https://vercel.com))

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Set Up Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Run SQL schema from [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
3. Copy API keys from Project Settings → API
4. Create storage buckets: `leaderboard-screenshots`, `event-banners`

### 3️⃣ Configure Environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

### 4️⃣ Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5️⃣ Create Admin Account
1. Sign up on your site
2. Make yourself admin:
```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'your-user-id';
```
3. Access admin dashboard at `/admin`

**✅ Done! Your site is running locally.**

---

## 📖 Documentation Guide

### For Getting Started
**→ [START_HERE.md](START_HERE.md)**
- Complete project overview
- What's been built
- Next steps
- Post-launch checklist

### For Installation & Setup
**→ [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)**
- Step-by-step setup instructions
- Supabase configuration guide
- Environment variable setup
- Admin account creation
- Deployment to Vercel
- Troubleshooting section

### For Database Schema
**→ [SUPABASE_SETUP.md](SUPABASE_SETUP.md)**
- Complete SQL schema
- Table descriptions
- Row-level security policies
- Seed data
- Storage bucket setup
- Real-time configuration

### For Technical Documentation
**→ [README_NEXTJS.md](README_NEXTJS.md)**
- Architecture overview
- API routes
- Component documentation
- Customization guide
- Deployment options
- Tech stack details

### For Quick Reference
**→ [QUICK_REFERENCE.txt](QUICK_REFERENCE.txt)**
- Setup checklist
- Key commands
- Important URLs
- Troubleshooting quick links

---

## 🎮 How to Use

### For Your Visitors
Visitors can:
1. View live leaderboard with top lap times
2. See upcoming racing events
3. Register for Founders Pass
4. Submit their own lap times
5. Follow you on social media

### For You (Admin)
Access `/admin` to:
1. **Approve/reject lap times** - View screenshots, verify times
2. **Create events** - Schedule tournaments and races
3. **Manage discounts** - Create promotional codes
4. **Track Founders Pass** - Monitor all 50 pass holders
5. **View analytics** - See real-time dashboard stats

### How the Leaderboard Works
```
1. Player submits lap time → 2. Uploads screenshot proof →
3. Admin reviews in dashboard → 4. Admin approves/rejects →
5. Approved times appear live → 6. All users see in real-time
```

---

## 🎨 Customization Guide

### Change Launch Date
Edit `.env.local`:
```env
NEXT_PUBLIC_LAUNCH_DATE=2026-07-01
```

### Change Colors (Dark-Cyan to Your Brand)
Edit `tailwind.config.js`:
```js
colors: {
  'kraken': {
    cyan: '#00ffff',        // Change primary color
    'cyan-dark': '#0088aa', // Change secondary
    'deep': '#001a1a',      // Change backgrounds
    'dark': '#0a0a0a',
    'card': '#1a1a1a',
    'pink': '#ff00ff',      // Change accents
  },
}
```

### Update Social Media Links
Edit `.env.local`:
```env
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/your-invite
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/yourhandle
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@yourhandle
```

### Discord Bot API Endpoints
Use these public JSON endpoints so your Discord bot can pull live data from the site:

- `GET /api/public/events?limit=10&game=assetto_corsa&event_type=race`
   - Returns active upcoming events sorted by `start_date`
   - Optional params: `limit` (1-50), `game`, `event_type`

- `GET /api/public/leaderboard?limit=10&game=f1_2025&track=Monza`
   - Returns approved leaderboard entries with computed `rank`
   - Optional params: `limit` (1-100), `game`, `track`

Example production URLs:
- `https://kraken-motor-sports.vercel.app/api/public/events`
- `https://kraken-motor-sports.vercel.app/api/public/leaderboard`

### Modify Website Content
All text is in React components in `src/components/`. Edit:
- `Hero.tsx` - Landing section, tagline, hero text
- `About.tsx` - Feature descriptions
- `FoundersPass.tsx` - Pass perks and pricing
- `Contact.tsx` - Social links and contact info

### Add New Racing Games
1. Update database schema (add to CHECK constraint in Supabase)
2. Update TypeScript types in `src/types/supabase.ts`
3. Add option to game selection dropdowns

### Replace Mockups with Real Images
1. Upload images to Supabase Storage
2. Replace mockup divs with `<Image>` components
3. Update component imports

---

## 📊 Database

### Tables
- **profiles** - User accounts with admin flags
- **leaderboard_entries** - All lap time submissions
- **events** - Racing events and tournaments
- **discounts** - Promotional codes
- **founders_passes** - Pass holder tracking
- **tracks** - Reference data for tracks
- **cars** - Reference data for cars

### Useful Queries

Most popular games:
```sql
SELECT game, COUNT(*) FROM leaderboard_entries 
WHERE status = 'approved' GROUP BY game;
```

Top drivers:
```sql
SELECT driver_name, COUNT(*) as wins 
FROM leaderboard_entries 
WHERE status = 'approved' 
GROUP BY driver_name ORDER BY wins DESC;
```

Founders pass sales:
```sql
SELECT status, COUNT(*) FROM founders_passes GROUP BY status;
```

---

## 🌐 Deployment

### Deploy to Vercel (Recommended - Free)

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push
```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Add Environment Variables**
   - Add all variables from `.env.local`
   - Make sure `NEXT_PUBLIC_*` variables are marked as such

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your site will be live at `your-project.vercel.app`

5. **Connect Custom Domain**
   - In Vercel dashboard, go to Domains
   - Add your custom domain
   - Update DNS records

### Build & Run Locally

Build:
```bash
npm run build
```

Start production server:
```bash
npm start
```

---

## 🔧 Common Tasks

### Create a New Event
1. Go to `/admin`
2. Click "CREATE EVENT"
3. Fill in details (title, game, track, date, prizes)
4. Click "Create"
5. Event appears on homepage

### Create a Discount Code
1. Go to `/admin/discounts`
2. Click "NEW DISCOUNT"
3. Enter code, discount value, expiration
4. Click "Create"
5. Share code with users

### Approve a Lap Time
1. Go to `/admin/leaderboard`
2. Click "REVIEW PENDING ENTRIES"
3. View screenshot for verification
4. Click "Approve" or "Reject"
5. Approved times appear instantly on live leaderboard

### Export Founders Pass List
1. Go to `/admin/founders`
2. Click "EXPORT CSV"
3. Use for tracking plaque names, shipping addresses, etc.

---

## 🆘 Troubleshooting

### Common Issues

**"Cannot find module" error**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Supabase connection error**
- Check `.env.local` has correct SUPABASE_URL and keys
- Make sure there are no extra spaces
- Restart dev server after updating `.env.local`

**Admin dashboard shows "Not authorized"**
- Make sure you ran the SQL to set `is_admin = true`
- Clear browser cache and cookies
- Sign out and sign back in

**Leaderboard not updating in real-time**
- Check Supabase Replication is enabled
- Go to Database → Replication and enable for `leaderboard_entries`
- Check browser console (F12) for errors

**Build fails on Vercel**
- Check all environment variables are set in Vercel
- Make sure `.env.local` is not committed to Git
- Check build logs for specific errors

**Already using port 3000**
```bash
npm run dev -- -p 3001
```

### Getting More Help

1. **Documentation** - Check the guides listed above
2. **Component Source** - Review React components in `src/components/`
3. **Supabase Docs** - [supabase.com/docs](https://supabase.com/docs)
4. **Next.js Docs** - [nextjs.org/docs](https://nextjs.org/docs)
5. **Tailwind Docs** - [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## 📋 Feature Roadmap

### Currently Implemented ✅
- [x] Live leaderboard with real-time updates
- [x] Admin dashboard
- [x] Event management
- [x] Discount system
- [x] Founders Pass tracking
- [x] Authentication & authorization
- [x] Responsive design
- [x] Multi-game support

### Future Enhancements 🎯
- [ ] Stripe payment integration for Founders Pass
- [ ] SimHub/iRacing telemetry integration
- [ ] Session booking system
- [ ] Merchandise store
- [ ] Player profiles with statistics
- [ ] Livestream integration
- [ ] Mobile app
- [ ] SMS notifications
- [ ] Team/clan management
- [ ] Tournament brackets

---

## 🎯 Performance

- ⚡ **Fast Builds** - Next.js build optimizations
- 🚀 **Fast Runtime** - Tailwind CSS production bundle
- 🔄 **Real-time Sync** - Supabase Realtime WebSockets
- 📊 **Scalable Database** - PostgreSQL on Supabase
- 🌍 **Global CDN** - Vercel edge network

---

## 🔐 Security

### Row-Level Security
- Users can only modify their own submissions
- Only admins can approve/reject entries
- Sensitive data is protected by RLS policies

### Authentication
- Passwords hashed by Supabase
- Session tokens expire automatically
- Admin actions are logged

### Environment Variables
- Never commit `.env.local` to Git (it's in `.gitignore`)
- All sensitive keys stored securely
- Different keys for development vs. production

---

## 📞 Support & Community

### Need Help?
1. **Documentation** - Start with [START_HERE.md](START_HERE.md)
2. **Installation** - See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
3. **Database** - Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
4. **Technical** - Review [README_NEXTJS.md](README_NEXTJS.md)
5. **Quick Ref** - Use [QUICK_REFERENCE.txt](QUICK_REFERENCE.txt)

### Useful Links
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📄 License

This project is built for Kraken Motorsports.

---

## 🦑 Credits

**Built with:**
- 🦑 Tentacles and determination
- ⚡ Next.js, React, and TypeScript
- 🎨 Tailwind CSS
- 🗄️ Supabase
- 🚀 Vercel

---

## 🎉 Ready to Launch?

1. **Open [START_HERE.md](START_HERE.md)** - Complete overview
2. **Follow [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Setup steps
3. **Customize your site** - Update branding, content, links
4. **Deploy to Vercel** - Take it live
5. **Announce on social media** - Let people know!

---

<div align="center">

### 🦑 UNLEASH THE BEAST!

**Built with adrenaline and octopus tentacles**

© 2026 Kraken Motorsports

</div>
