# Kraken Motorsports - Official Site Summary

## Project Overview
**Kraken Motorsports** is a VR racing community platform built for competitive sim racers. The site serves as a hub for racing events, leaderboard competitions, and community engagement with a focus on the "Founders Pass" early supporter program.

**Status:** Coming Soon (Pre-Launch)  
**Launch Date:** TBD  
**Technology:** Next.js 14 with TypeScript, Supabase Backend  
**Live URL:** TBD  
**Development Port:** localhost:3001

---

## Core Features

### 1. **Public-Facing Features**
- **Hero Section**: Main landing with Discord integration and CTA buttons
- **Live Leaderboard**: Real-time lap time rankings with game/track filtering
- **Upcoming Events**: Racing events with image carousels (auto-rotating + manual navigation)
- **Founders Pass**: Limited edition (50 passes) early supporter program
- **Contact Form**: Community inquiries and support
- **Branding Section**: Logo showcase and team identity

### 2. **Admin Dashboard** (`/admin`)
Comprehensive management system with 4 sections:

#### Leaderboard Management
- Review/approve/reject lap time submissions
- Manual entry creation for admins
- Status filtering (pending/approved/rejected)
- Detail view with screenshots and video verification
- Rejection reason tracking

#### Events Management
- Create/edit/delete racing events
- Multiple image support with carousel preview
- Event types: race, tournament, time_trial, special, maintenance
- Active/inactive toggle
- Participant tracking and entry fees
- Prize and rules configuration

#### Discounts Management
- Promotional code creation
- Percentage or fixed amount discounts
- Usage limits and expiration dates
- Active/inactive toggle
- Min purchase requirements
- Multi-product application

#### Founders Pass Management
- Track all 50 Founders Pass holders
- Status monitoring (pending/active/expired)
- Revenue tracking ($50/pass = $2,500 total)
- Email and purchase date records

### 3. **Authentication System**
- Email/password authentication via Supabase Auth
- Automatic profile creation on signup (database trigger)
- Admin role-based access control
- Row Level Security (RLS) policies
- Dynamic navigation (LOG IN/ADMIN button)

---

## Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **UI Components**: Custom React components

### Backend Stack
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (ready for image uploads)
- **Security**: Row Level Security (RLS) policies

### Key Components
```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── login/page.tsx            # Login page
│   ├── submit/page.tsx           # Leaderboard submission
│   ├── founders-pass/page.tsx    # Founders Pass sales page
│   └── admin/                    # Admin dashboard
│       ├── page.tsx              # Dashboard home
│       ├── leaderboard/page.tsx  # Leaderboard management
│       ├── events/page.tsx       # Events management
│       ├── discounts/page.tsx    # Discounts management
│       └── founders/page.tsx     # Founders Pass management
├── components/                   # React components
│   ├── Hero.tsx                  # Landing hero section
│   ├── LiveLeaderboard.tsx       # Leaderboard display
│   ├── UpcomingEvents.tsx        # Events display with carousel
│   ├── ImageCarousel.tsx         # Image carousel component
│   ├── FoundersPass.tsx          # Founders Pass promo
│   ├── Navigation.tsx            # Site navigation
│   ├── Countdown.tsx             # Launch countdown
│   ├── About.tsx                 # About section
│   ├── Contact.tsx               # Contact form
│   ├── Branding.tsx              # Branding/logo section
│   └── Footer.tsx                # Site footer
├── lib/
│   └── supabase/                 # Supabase clients
│       ├── client.ts             # Client-side Supabase
│       └── server.ts             # Server-side Supabase
└── types/
    └── supabase.ts               # Database type definitions
```

### Database Schema

#### Tables
1. **profiles** - User profiles with admin flags
2. **leaderboard_entries** - Lap time submissions with verification
3. **events** - Racing events with images array support
4. **discounts** - Promotional discount codes
5. **founders_passes** - Founders Pass holder records

#### Security Features
- Row Level Security (RLS) on all tables
- Admin-only write access to critical tables
- Automatic profile creation trigger
- User-based data isolation

---

## Design System

### Color Palette (Kraken Theme)
- **Primary Cyan**: `#00FFFF` (kraken-cyan)
- **Primary Pink**: `#FF00FF` (kraken-pink) 
- **Dark Background**: `#0a0e27` (kraken-dark)
- **Deep Background**: `#050814` (kraken-deep)
- **Card Background**: `#1a1f3a` (kraken-card)
- **Accent Purple**: `#7B2CBF` (kraken-purple)

### Typography
- **Display Font**: Custom racing-style font
- **Tracking**: Wide letter spacing for headers
- **Emphasis**: ALL CAPS for primary headings

### UI Patterns
- Card-based layouts with borders
- Gradient overlays and glows
- Animated backgrounds (radial gradients)
- Smooth transitions and hover effects
- Responsive mobile-first design

---

## Key User Flows

### 1. Submit Lap Time
1. Navigate to `/submit`
2. Fill out form (driver name, game, track, car, time)
3. Upload screenshot/video (optional)
4. Submit for admin review
5. Admin approves → appears on leaderboard

### 2. Purchase Founders Pass
1. Navigate to Founders Pass section
2. Click "RESERVE YOUR PASS"
3. Complete checkout (Stripe integration pending)
4. Recorded in admin dashboard
5. Access to exclusive benefits

### 3. Admin Management Flow
1. Login at `/login` with admin credentials
2. Navigate to `/admin`
3. Choose management section (leaderboard/events/discounts/founders)
4. Perform CRUD operations
5. Changes reflect immediately on public site

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DISCORD_INVITE=your_discord_link
```

### Installation
```bash
npm install
npm run dev
```

### Database Setup
1. Create Supabase project
2. Run SQL schema from `SUPABASE_SETUP.md`
3. Create admin user
4. Update admin flag in profiles table

---

## Special Features

### Image Carousel System
- **Auto-rotation**: 5-second intervals
- **Manual controls**: Previous/Next arrows
- **Dot indicators**: Visual position tracking
- **Image counter**: "1 / 3" display
- **Admin management**: Add/remove/reorder images

### Real-time Leaderboard
- Live updates via Supabase Realtime
- Game and track filtering
- Top 10 display with rankings
- Lap time formatting (MM:SS.mmm)

### Founders Pass Limits
- Hard limit: 50 passes total
- Revenue tracking: $50 per pass
- Status management: pending/active/expired
- Email notifications (pending integration)

---

## Roadmap & Future Enhancements

### Phase 1 (Current - Pre-Launch)
- ✅ Core site functionality
- ✅ Admin dashboard
- ✅ Authentication system
- ✅ Image carousel
- ✅ Manual leaderboard entries
- ⏳ Payment integration (Stripe)
- ⏳ Email notifications
- ⏳ Discord bot integration

### Phase 2 (Post-Launch)
- User profiles and dashboards
- Direct file uploads to Supabase Storage
- Event registration system
- Live race streaming integration
- Community forums
- Achievement badges
- Team/clan system

### Phase 3 (Growth)
- Mobile app (React Native)
- Twitch integration
- Sponsorship management
- Tournament bracket system
- Prize pool distribution
- VR headset compatibility guides

---

## Support & Contact

**Discord**: [Join our community](NEXT_PUBLIC_DISCORD_INVITE)  
**Email**: Contact form on site  
**Admin Support**: Contact site administrator

---

## License & Credits

**Built with**: Next.js, Supabase, Tailwind CSS  
**Maintained by**: Kraken Motorsports Team  
**Last Updated**: March 3, 2026

---

*This document serves as the official reference for the Kraken Motorsports platform. For technical documentation, see `PROJECT_STRUCTURE.md` and `SUPABASE_SETUP.md`.*
