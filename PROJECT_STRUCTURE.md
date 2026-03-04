# 📂 Project Structure

```
Rad Racing/
│
├── 📖 DOCUMENTATION
│   ├── docs/
│   │   ├── START_HERE.md                    → Read first! Project overview
│   │   ├── INSTALLATION_GUIDE.md            → Setup instructions (45 min)
│   │   ├── SUPABASE_SETUP.md                → Database schema & SQL
│   │   ├── README_NEXTJS.md                 → Technical deep dive
│   │   ├── README_MAIN.md                   → Features & customization
│   │   ├── DOCUMENTATION_INDEX.md           → Navigation hub
│   │   ├── QUICK_REFERENCE.txt              → Commands & checklist
│   │   └── PROJECT_STRUCTURE.md             → This file
│   │
│   └── README.md                            ⭐ START HERE (project root)
│
│
├── 🛠️ CONFIGURATION (Root Level - Next.js Convention)
│   ├── package.json                         → Dependencies & scripts
│   ├── next.config.js                       → Next.js configuration
│   ├── tailwind.config.js                   → Tailwind CSS theme
│   ├── tsconfig.json                        → TypeScript settings
│   ├── postcss.config.js                    → CSS processing
│   ├── .env.local.example                   → Environment template
│   └── .gitignore                           → Git ignore rules
│
│
├── 💻 SOURCE CODE
│   └── src/
│       ├── app/                             → Next.js App Router pages
│       │   ├── layout.tsx                   → Root layout
│       │   ├── page.tsx                     → Homepage
│       │   ├── globals.css                  → Global styles
│       │   └── admin/                       → Admin dashboard pages
│       │       ├── layout.tsx               → Admin protected layout
│       │       ├── page.tsx                 → Admin dashboard
│       │       ├── leaderboard/             → Leaderboard management
│       │       ├── events/                  → Event management
│       │       ├── discounts/               → Discount management
│       │       └── founders/                → Founders Pass management
│       │
│       ├── components/                      → Reusable React components
│       │   ├── Navigation.tsx
│       │   ├── Hero.tsx
│       │   ├── About.tsx
│       │   ├── LiveLeaderboard.tsx
│       │   ├── UpcomingEvents.tsx
│       │   ├── FoundersPass.tsx
│       │   ├── Branding.tsx
│       │   ├── Countdown.tsx
│       │   ├── Contact.tsx
│       │   └── Footer.tsx
│       │
│       ├── lib/                             → Utility functions
│       │   └── supabase/
│       │       ├── client.ts                → Client-side Supabase
│       │       └── server.ts                → Server-side Supabase
│       │
│       └── types/
│           └── supabase.ts                  → Database type definitions
│
│
├── 🎨 PUBLIC ASSETS
│   └── public/
│       └── assets/                          → Images, logos, icons
│           ├── logo.svg
│           ├── favicon.ico
│           └── ... other assets
│
│
├── 📦 BUILD OUTPUT (Git ignored)
│   └── .next/                               → Next.js build cache
│
│
├── 📚 NODE MODULES (Git ignored)
│   └── node_modules/                        → Installed packages
│
│
└── 🗂️ ARCHIVE (Old / Deprecated)
    ├── Summary Part 2
    ├── Website Summary
    ├── index.html                           → Old static HTML
    ├── script.js                            → Old static JS
    └── styles.css                           → Old static CSS
```

---

## 📍 File Navigation

### ⭐ Quick Start Path
```
README.md (root)
    ↓
docs/START_HERE.md
    ↓
docs/INSTALLATION_GUIDE.md
    ↓
docs/QUICK_REFERENCE.txt
```

### 🏗️ Full Development Path
```
docs/START_HERE.md
    ↓
docs/INSTALLATION_GUIDE.md
    ↓
docs/README_NEXTJS.md (technical)
    ↓
src/ (components & code)
```

### 👨‍💼 Admin User Path
```
docs/START_HERE.md
    ↓
docs/README_MAIN.md (How to Use section)
    ↓
http://localhost:3000/admin
```

### 🗄️ Database Setup Path
```
docs/START_HERE.md
    ↓
docs/INSTALLATION_GUIDE.md
    ↓
docs/SUPABASE_SETUP.md (copy-paste SQL)
```

---

## 📂 Folder Purpose Guide

| Folder | Purpose | Edit? |
|--------|---------|-------|
| **docs/** | All documentation | Rarely |
| **src/app/** | Pages & layouts | Often |
| **src/components/** | UI components | Often |
| **src/lib/** | Helper functions | Often |
| **src/types/** | TypeScript definitions | Sometimes |
| **public/assets/** | Images & static files | Sometimes |
| **archive/** | Old files (reference) | Never - Legacy |

---

## 🚀 Getting Started

### For First Time Setup
1. Read [README.md](README.md) in project root
2. Follow [docs/INSTALLATION_GUIDE.md](docs/INSTALLATION_GUIDE.md)
3. Start developing!

### For Customization
1. Check [docs/README_MAIN.md](docs/README_MAIN.md) for examples
2. Edit files in `src/components/` for UI
3. Check `tailwind.config.js` for styling

### For Database/Backend
1. Read [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
2. Edit `src/lib/supabase/` for integrations
3. Update types in `src/types/supabase.ts`

---

## 💾 Common File Locations

**Need to...** | **Go to...**
---|---
Change site colors | `tailwind.config.js`
Edit homepage content | `src/components/Hero.tsx`
Add new page | `src/app/` or `src/app/pathname/page.tsx`
Update database queries | `src/lib/supabase/`
Configure environment | `.env.local.example` & `.env.local`
Add npm packages | `package.json` & run `npm install`
View live leaderboard | `src/components/LiveLeaderboard.tsx`
Access admin dashboard | `src/app/admin/`
Read setup guide | `docs/INSTALLATION_GUIDE.md`
Quick reference | `docs/QUICK_REFERENCE.txt`

---

## 🎯 Key Conventions

### Next.js Conventions (Keep at Root)
- `package.json` - Top level
- `next.config.js` - Top level
- `tailwind.config.js` - Top level
- `tsconfig.json` - Top level
- `.env.local` - Top level
- `public/` - Top level
- `src/app` - For pages

### Organization Best Practices
- **Documentation** → `docs/` folder (keeps root clean)
- **Source code** → `src/` folder (keeps organized)
- **Public assets** → `public/assets/` (Next.js standard)
- **Old files** → `archive/` (reference only)
- **Build output** → `.next/` (git ignored, auto-generated)

---

## 🔄 Migration Notes

### Files Moved to `/docs/`
- ✅ START_HERE.md
- ✅ INSTALLATION_GUIDE.md  
- ✅ SUPABASE_SETUP.md
- ✅ README_NEXTJS.md
- ✅ README_MAIN.md
- ✅ DOCUMENTATION_INDEX.md
- ✅ QUICK_REFERENCE.txt
- ✅ QUICK_START.txt

### Files Moved to `/archive/`
- Summary Part 2 (original requirements)
- Website Summary (old notes)
- index.html (old static site)
- script.js (old static site)
- styles.css (old static site)

### Files Kept at Root
- package.json (Next.js convention)
- Configuration files (Next.js convention)
- .env.local.example (Next.js convention)
- .gitignore (standard location)
- **README.md** (NEW - Main entry point)

### Files Moved to `/public/`
- `assets/` → `public/assets/`

---

## 📋 Update Links in Documentation

If you move these files, update any hardcoded links:

### Old Links → New Links
```
[INSTALLATION_GUIDE.md] → [docs/INSTALLATION_GUIDE.md]
[SUPABASE_SETUP.md] → [docs/SUPABASE_SETUP.md]
[README_NEXTJS.md] → [docs/README_NEXTJS.md]
[START_HERE.md] → [docs/START_HERE.md]
```

---

## ✅ Organization Checklist

- [ ] Move all docs/*.md files
- [ ] Move archive/* files
- [ ] Move assets to public/assets/
- [ ] Update README.md links
- [ ] Delete empty folders
- [ ] Test npm run dev works
- [ ] Update .gitignore if needed
- [ ] Commit to git

---

<div align="center">

### 🎯 Clean structure = Happy development!

Start in **[docs/START_HERE.md](docs/START_HERE.md)**

</div>
