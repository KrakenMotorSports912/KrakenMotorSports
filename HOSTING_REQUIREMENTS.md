# Kraken Motorsports - Hosting Requirements & Specifications

## Core Technology Stack
- **Framework**: Next.js 14 (Node.js-based, requires server runtime)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Styling**: Tailwind CSS (build-time)
- **CDN**: For image/media delivery

## Server Requirements

### Compute
- **Runtime Environment**: Node.js 18+
- **Expected Traffic**: Low-to-medium (pre-launch, growing)
- **Concurrent Users**: Starting ~50-100, scaling to 1000+
- **CPU**: Minimal for Next.js (API routes are lightweight)
- **RAM**: 512MB minimum, 1-2GB recommended
- **Auto-scaling**: Necessary during events/competitions

### Build Requirements
- **Build Time**: ~2-3 minutes typical
- **Build Size**: ~200MB (node_modules)
- **Node Version**: 18.17+ or 19+

## Database Specifications

### PostgreSQL (via Supabase)
- **Current Size**: ~50MB (starting small)
- **Projected Growth**: 1-2GB within first year
- **Tables**: 5 main tables (profiles, leaderboard_entries, events, discounts, founders_passes)
- **Connections**: ~20-50 concurrent connections
- **Real-time Subscriptions**: Event-based, moderate frequency
- **Backup**: Daily backups required
- **Replication**: Optional, depends on uptime SLA

### Storage Needs
- **Images**: Event carousel images, screenshots, videos
- **Initial**: ~500MB
- **Projected**: 5-10GB within first year
- **Format**: JPG, PNG, MP4
- **CDN**: Critical for media delivery

## Authentication & Security

### Supabase Auth
- **Method**: Email/password (extendable to OAuth)
- **Users**: Growing from ~20 to 1000+
- **Admin Roles**: Small group (2-5 admins)
- **RLS Policies**: Implemented on all tables

### SSL/HTTPS
- **Required**: Yes, mandatory
- **Certificate**: Auto-renewal needed

## API & Performance

### Endpoints
- **REST API**: Via Next.js API routes
- **Real-time Subscriptions**: Using Supabase Realtime
- **Expected Requests**: Moderate (100-500/minute during peak)

### Performance Targets
- **First Contentful Paint (FCP)**: <2 seconds
- **Largest Contentful Paint (LCP)**: <2.5 seconds
- **Time to Interactive (TTI)**: <3.5 seconds
- **API Response Time**: <500ms average

## Third-Party Integrations (Current & Planned)

### Current
- **Supabase**: Database, auth, real-time, storage
- **Discord**: OAuth login, community link
- **Google Fonts**: Typography

### Planned
- **Stripe**: Payment processing (Founders Pass sales at $50/pass)
- **Email Service**: SendGrid/Resend (notifications, verification)
- **Twitch API**: Stream integration (future)
- **Discord Bot**: Community features (future)

## Deployment Options Needed

### Hosting Platform
- **Static Export**: Not viable (dynamic content required)
- **Serverless Functions**: Good for API routes
- **Container Deployment**: Preferred for production
- **Managed Hosting**: Ideal for simplicity

### CI/CD Pipeline
- **Git Integration**: GitHub/GitLab required
- **Auto-deployment**: On push to main branch
- **Environment Variables**: Secrets management needed
- **Build Caching**: To speed up deployments

## Data & Compliance

### Data Type
- **User Data**: Email, name, race times
- **Payment Data**: Handled by Stripe (PCI compliance delegated)
- **Analytics**: Optional, not currently required

### Regulations
- **GDPR**: If EU users present
- **Privacy Policy**: Required
- **Terms of Service**: Required
- **Data Retention**: Policy needed

## Expected Usage Patterns

### Traffic
- **Off-peak**: <100 requests/minute
- **Peak (Event Days)**: 500-1000 requests/minute
- **Spike Tolerance**: Handle 2-5x traffic on launch day

### Content Updates
- **Frequency**: Multiple per day (leaderboard updates, new events)
- **Real-time**: Leaderboard must update in real-time

### User Growth
- **Month 1**: 20-50 users
- **Month 3**: 100-500 users
- **Month 12**: 500-2000 users
- **Scaling Needs**: Auto-scaling critical

## Monitoring & Logging

### Required
- **Error Tracking**: Sentry/similar
- **Performance Monitoring**: APM tool
- **Uptime Monitoring**: 99.5%+ SLA needed
- **Log Aggregation**: Cloud logging
- **Alerts**: Email/Slack notifications for errors

## Environmental Considerations

### Development Environment
- **Local Development**: Works on Windows (PowerShell), Mac, Linux
- **Staging Environment**: Needed for testing before production
- **Production Environment**: Isolated, secure

### Version Control
- **Repository**: GitHub (assumed)
- **Branch Strategy**: main, develop, feature branches
- **Environment Parity**: Staging matches production

## Estimated Costs (Monthly)

### Components
- **Hosting/Compute**: $15-100 (depends on platform)
- **Database**: $15-50 (Supabase or managed PostgreSQL)
- **Storage**: $5-20 (images/media)
- **Email Service**: $10-30 (SendGrid/Resend)
- **Monitoring**: $10-20 (Sentry, APM)
- **Stripe**: 2.9% + $0.30 per transaction
- **Total Baseline**: ~$55-220/month

## Hosting Platforms to Evaluate

### Serverless (Function-based)
- Vercel (Next.js optimized)
- Netlify (with Functions)
- AWS Lambda + API Gateway
- Google Cloud Functions + Cloud Run

### Container-based
- Docker (required)
- Kubernetes (via EKS, GKE, AKS)
- AWS ECS
- DigitalOcean App Platform
- Heroku (deprecated free tier)

### Managed Platforms
- Railway
- Render
- Fly.io
- PaaS solutions

### Hybrid (Mixed services)
- AWS (Lambda + RDS + S3)
- Google Cloud (Cloud Run + Cloud SQL + Cloud Storage)
- Azure (App Service + Database + Blob Storage)
- DigitalOcean (App Platform + Managed Database)

## Questions for Hosting Evaluation

1. **Uptime SLA**: What percentage is acceptable? (99%, 99.5%, 99.9%)
2. **Auto-scaling**: How aggressive should it be?
3. **Budget Constraint**: Hard cap on monthly costs?
4. **Team Expertise**: DevOps experience level?
5. **Complexity Tolerance**: How much infrastructure management?
6. **Growth Timeline**: When expecting 10x traffic?
7. **Global Users**: Geographically distributed audience?
8. **Maintenance Windows**: Acceptable downtime for updates?
9. **Analytics**: What metrics are critical to track?
10. **Future Features**: Streaming, file uploads, webhooks?

## Critical Dependencies

- ✅ Node.js runtime
- ✅ PostgreSQL database
- ✅ Static asset CDN
- ✅ Environment variable management
- ✅ SSL/TLS certificates
- ✅ Backup & disaster recovery
- ✅ Log aggregation
- ✅ Error tracking

## Red Flags to Avoid

- ❌ Providers with no auto-scaling
- ❌ No support for Node.js/Next.js
- ❌ Manual database backups only
- ❌ High egress costs (images!)
- ❌ No uptime monitoring
- ❌ Limited environment variable support
- ❌ No built-in SSL
- ❌ Expensive startup/dormancy fees

---

## Summary

Kraken Motorsports is a **modern, scalable Next.js application** with a **PostgreSQL backend** (via Supabase) and **real-time leaderboard features**. The platform is designed to grow from a small community of ~50 users during pre-launch to 1000+ active users post-launch, with predictable traffic patterns peaking during racing events. The application requires a hosting solution that supports **Node.js 18+**, handles **real-time database subscriptions**, and can **auto-scale during traffic spikes** without incurring excessive costs.

The ideal hosting platform should offer **seamless Next.js deployment**, **managed database support** (or integration with Supabase), **automatic SSL/TLS**, **built-in monitoring and logging**, and a **straightforward CI/CD pipeline**. Budget-conscious options like **Vercel** (Next.js native) or **Railway** (all-in-one simplicity) are excellent for small-to-medium scale, while **AWS, Google Cloud, or DigitalOcean** provide more control and scalability for enterprise growth. Avoid traditional legacy hosting—this is a modern, rapidly iterating application that benefits from serverless/containerized architectures. The critical success factor is **avoiding egress charges on media/image delivery** and ensuring **auto-scaling works seamlessly** to handle launch day traffic spikes.
