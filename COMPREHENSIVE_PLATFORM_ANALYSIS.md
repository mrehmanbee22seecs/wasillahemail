# 🔍 Wasilah Platform - Comprehensive Analysis & Feature Documentation

## 📊 Executive Summary

**Platform Name:** Wasilah (وسیلہ - meaning "Connection/Medium" in Urdu)  
**Purpose:** Pakistan's #1 Volunteer & CSR Management Platform  
**Type:** Full-stack React + Firebase web application  
**Target Market:** Pakistan (NGOs, Volunteers, Students, Corporate CSR)  
**Tech Stack:** React 18, TypeScript, Firebase, Cloudinary, TailwindCSS  
**Deployment:** Firebase Hosting + Functions (currently on Blaze plan)  
**Current Status:** Production-ready, 70 files implemented, Zero errors

---

## 🎯 Core Platform Features

### 1. **Multi-Role User System** 👥
Complete role-based access control with 4 distinct user types:

**User Roles:**
- **Volunteers** - Individual users looking for opportunities
- **Students** - University students seeking CSR projects & certificates
- **NGOs** - Organizations managing projects and events
- **Admins** - Platform administrators with full control

**Authentication Features:**
- Email/Password authentication (Firebase Auth)
- Google OAuth integration
- Email verification
- Password reset functionality
- Role-based dashboard routing
- Session management with Firebase hooks

**Onboarding System:**
- Multi-step onboarding wizard
- Role selection during signup
- Profile completion progress tracking
- Interest and skill selection
- Location preferences
- Availability settings
- Welcome email automation

---

### 2. **Project Management System** 📋

**Project Submission & Approval Workflow:**
- Multi-step submission form (95KB CreateSubmission.tsx)
- Draft saving functionality
- Image upload with Cloudinary integration
- Location selection with interactive map
- Project categorization (Education, Health, Environment, etc.)
- Admin approval workflow
- Edit request system
- Visibility controls (public/private)

**Project Features:**
- Project detail pages with full information
- Volunteer application system
- Task checklists per project
- Progress tracking
- Project reviews and ratings
- Project recommendations based on user interests
- Advanced filtering and search (Fuse.js fuzzy search)
- Project cards with featured images

**Project Discovery:**
- Browse all approved projects
- Filter by category, location, status
- Search with auto-complete
- Sort by date, relevance, impact
- Recommended projects based on profile
- Map view of project locations

---

### 3. **Event Management System** 🎉

**Event Creation & Management:**
- Event submission form
- Date/time scheduling
- Location mapping
- Capacity management
- Registration system
- Event-to-project linking
- Recurring events support

**Event Features:**
- Event detail pages (60KB EventDetail.tsx)
- Online/In-person event types
- Registration tracking
- Attendee management
- Calendar integration (Google, Outlook, Yahoo, iCal)
- Event reminders
- Share to social media
- QR code check-in (potential feature)

---

### 4. **NGO Dashboard & Management** 🏢

**NGO-Specific Features:**
- Dedicated NGO dashboard (30KB NGODashboard.tsx)
- NGO profile pages (10KB NGOPersonal.tsx)
- Project portfolio management
- Volunteer application review
- Event organization tools
- Impact analytics
- Donation tracking
- Communication center
- Resource management

**NGO Verification:**
- Verification workflow
- Admin approval process
- Verified badge display
- Public/private profile toggle

---

### 5. **Volunteer Dashboard** 🙋

**Volunteer Features:**
- Active projects overview
- Application status tracking
- Task checklist management
- Personal notes section
- Impact summary (hours, projects, points)
- Upcoming events calendar
- Recommended opportunities
- Quick action buttons
- Achievement showcase

**Application Management:**
- Apply to projects/events
- Track application status
- Edit applications before approval
- View application history
- Withdraw applications

---

### 6. **Student Dashboard** 🎓

**Student-Specific Features:**
- CSR project opportunities
- Academic calendar integration
- Skill development tracking
- Certificate requests
- Achievement showcase
- Study groups (if implemented)
- Volunteer hour tracking for university requirements

---

### 7. **Admin Panel & CMS** ⚙️

**Comprehensive Admin Controls:**
- Massive admin panel (134KB AdminPanel.tsx)
- User management (approve, suspend, delete)
- Content moderation queue
- Project/event approval workflow
- NGO verification system
- System analytics dashboard
- Bulk operations
- Content management system

**CMS Features (Professional Grade):**
- Rich text editor (TipTap WYSIWYG)
  - 20+ formatting options
  - Tables, images, links
  - Code blocks with syntax highlighting
  - Task lists, highlights, colors
- Content versioning system
  - Unlimited version history
  - Save/restore previous versions
  - Diff comparison
  - Undo/redo functionality
- Media library
  - Cloudinary integration
  - Drag-drop upload
  - Grid/list views
  - Search, filter, sort
  - Bulk operations
  - Image transformation preview
- Page content editing
  - Home page editor (24KB HomeEditable.tsx)
  - About page editor (27KB AboutEditable.tsx)
  - Contact page editor
  - Header/Footer editing
- Editable content sections
  - Hero sections
  - Feature cards
  - Testimonials
  - CTAs

**Admin Knowledge Base:**
- KB management interface
- Seed knowledge from admin
- Question/answer management
- Category organization

---

### 8. **AI-Powered Chatbot** 🤖

**Smart Chat System:**
- Context-aware chatbot widget
- Knowledge base integration
- Multi-language support (English/Urdu)
- Chat history tracking
- Intent recognition
- FAQ responses
- Unanswered query tracking
- Admin notification system
- Modal and inline chat modes
- Typing indicators
- Quick replies

**Chat Features:**
- Real-time responses
- Conversation persistence
- User context awareness
- Role-based responses
- Fallback to knowledge base
- Human handoff capability
- Chat analytics

---

### 9. **Donation Management** 💰

**Donation System:**
- Multi-step donation form
- Pakistan payment methods (JazzCash, EasyPaisa, Bank Transfer)
- Recurring donations (monthly, quarterly, yearly)
- Anonymous donations option
- Dedication messages
- Tax receipt generation
- Donation tracking
- NGO fundraising dashboard
- Donation goals and progress
- Donor wall/recognition

**Donation Analytics:**
- Total donations received
- Donor statistics
- Campaign performance
- Payment method breakdown
- Recurring vs one-time analysis

---

### 10. **Gamification & Points System** 🎮

**Engagement Mechanics:**
- Points for various actions
- Achievement badges
- Leaderboards
- Impact rankings
- Volunteer hour tracking
- Skill endorsements
- Recognition system
- Progress bars
- Level system

**Points Calculation:**
- Project completion
- Event attendance
- Profile completion
- Referrals
- Reviews and ratings
- Community engagement

---

### 11. **Notification System** 🔔

**Multi-Channel Notifications:**
- In-app notifications
- Email notifications (Resend API integration)
- Push notifications (Firebase Cloud Messaging)
- Notification center with badge
- Real-time updates
- Notification preferences
- Mark as read/unread
- Notification history

**Notification Types:**
- Application status updates
- Project approvals
- Event reminders
- Task assignments
- New opportunities
- Admin announcements
- Chat messages
- Donation confirmations

**Email Automation:**
- Welcome emails
- Verification emails
- Submission confirmations
- Approval notifications
- Reminder emails
- Edit request emails
- Custom campaign emails
- 12+ pre-built templates
- 5 automated workflows

---

### 12. **Reporting & Export System** 📊

**Report Builder:**
- Custom report builder with drag-and-drop
- Report templates (User, Project, Event, NGO, Donation, Analytics)
- Advanced filtering (10 operators)
- Data aggregation (sum, avg, count, min, max)
- Multi-field sorting
- Grouping capabilities
- Row limiting

**Export Features:**
- CSV export
- Excel (XLSX) export
- PDF export
- JSON export
- Bulk export operations
- Firebase Storage integration
- Download to computer
- Scheduled reports (daily, weekly, monthly, quarterly, yearly)

**Report Analytics:**
- Generation tracking
- View counts
- Download statistics
- Performance monitoring
- Usage trends
- Format breakdown

---

### 13. **Analytics Dashboard** 📈

**Platform Analytics:**
- User growth metrics
- Project statistics
- Event attendance
- Volunteer engagement
- NGO activity
- Donation analytics
- System health monitoring
- Cost breakdown tracking

**User Analytics:**
- Engagement metrics
- User segmentation
- Retention analysis
- Activity heatmaps

**Project Analytics:**
- Performance tracking
- Completion rates
- Impact measurement
- Success metrics

---

### 14. **Social Integration** 🌐

**Social Sharing:**
- WhatsApp sharing (Pakistan primary)
- Facebook sharing
- Twitter/X sharing
- LinkedIn sharing
- Email sharing
- Native Web Share API
- Copy to clipboard
- Pre-filled share messages
- Mobile-optimized

**Calendar Integration:**
- Google Calendar "Add to Calendar"
- Outlook Calendar
- Yahoo Calendar
- Apple Calendar (iCal file)
- No OAuth required
- Works offline

---

### 15. **Subscription System** 💎

**Two-Tier Subscription:**
- **Free Tier:**
  - Basic features
  - Limited projects (5/month)
  - Standard support
  - Basic analytics
  
- **Premium Tier:**
  - Unlimited projects
  - Priority support
  - Advanced analytics
  - Custom branding
  - API access
  - Bulk operations
  - Export features

**Features:**
- Usage tracking
- Quota enforcement
- Real-time visualization
- Feature gating with blur effects
- Upgrade prompts
- Subscription management

---

### 16. **Multi-Language Support** 🌍

**Languages:**
- English (LTR)
- Urdu (RTL) with Noto Nastaliq font

**Translation System:**
- 500+ translation keys
- Language switcher
- Persistence in localStorage
- Admin translation editor
- Context-aware translations
- RTL layout support
- Dynamic language loading

---

### 17. **Search & Discovery** 🔍

**Advanced Search:**
- Fuse.js full-text fuzzy search
- Search across projects, events, NGOs
- Auto-complete suggestions
- Recent searches
- Search history

**Filters:**
- Category filtering
- Location-based filtering
- Date range filtering
- Status filtering
- Tag-based filtering
- Custom filter combinations

**Discovery Features:**
- Trending content
- Recommended content based on profile
- Recently viewed
- Popular projects
- Featured events
- Top NGOs

---

### 18. **SEO Optimization** 🚀

**SEO Features:**
- React Helmet Async for dynamic meta tags
- Open Graph tags for social sharing
- Twitter Cards
- Structured data (JSON-LD schemas)
  - Organization schema
  - Event schema
  - Breadcrumb schema
  - Article schema
- Sitemap.xml generation
- robots.txt
- Google Analytics 4 integration (G-CNPNT0NXPQ)
- Canonical URLs
- Meta descriptions
- Title optimization

---

### 19. **PWA & Mobile Optimization** 📱

**Progressive Web App:**
- Service Worker with Workbox
- Offline support with background sync
- Install prompts (iOS/Android)
- Push notifications via FCM
- Caching strategies:
  - Cache-first for static assets
  - Network-first for dynamic data
  - Runtime caching
- Precaching (17 entries, 2.9 MB)
- Update prompts
- Offline indicator

**Mobile Features:**
- Responsive design (TailwindCSS)
- Touch-optimized UI
- Mobile-first approach
- Optimized images
- Fast load times
- App-like experience

---

### 20. **Performance & Scalability** ⚡

**Code Optimization:**
- Advanced code splitting (8+ bundles)
- Lazy loading with retry logic
- Bundle size: 182 KB gzipped (45.8% reduction)
- Tree shaking
- Terser minification
- Dual compression (gzip + brotli ~30% additional savings)

**Caching Layer:**
- In-memory cache with TTL
- IndexedDB persistent storage
- Stale-while-revalidate pattern
- Cache warming and invalidation
- 60% reduction in Firestore reads

**Monitoring:**
- Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
- Error tracking with severity levels
- Performance metrics collection
- Usage analytics
- Health checks (Firestore, storage, memory)
- Buffer-flush mechanism for logs

**Database Optimization:**
- 55 composite Firestore indexes
- Query optimization
- Pagination
- Strategic field indexing

---

### 21. **Image Management** 🖼️

**Cloudinary Integration:**
- Signed upload URLs
- Image transformations
  - Resizing
  - Cropping
  - Format conversion (WebP, AVIF)
  - Quality optimization
- Responsive images
- Lazy loading
- CDN delivery
- Thumbnail generation
- Image upload diagnostics

**Upload Features:**
- Drag-and-drop upload
- Multiple file upload
- Progress tracking
- Error handling
- Retry mechanism
- Crop/resize before upload
- Preview before upload

---

### 22. **REST API** 🔌

**API Endpoints (41 total):**

**Projects API (7 endpoints):**
- GET /api/projects - List projects with filters
- GET /api/projects/:id - Get project details
- POST /api/projects - Create project
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project
- POST /api/projects/:id/approve - Approve project (admin)
- POST /api/projects/:id/reject - Reject project (admin)

**Events API (7 endpoints):**
- GET /api/events - List events
- GET /api/events/:id - Get event details
- POST /api/events - Create event
- PUT /api/events/:id - Update event
- DELETE /api/events/:id - Delete event
- POST /api/events/:id/approve - Approve event (admin)
- POST /api/events/:id/reject - Reject event (admin)

**NGOs API (7 endpoints):**
- GET /api/ngos - List NGOs
- GET /api/ngos/:id - Get NGO details
- POST /api/ngos - Register NGO
- PUT /api/ngos/:id - Update NGO
- DELETE /api/ngos/:id - Delete NGO
- POST /api/ngos/:id/verify - Verify NGO (admin)
- POST /api/ngos/:id/reject - Reject verification (admin)

**Users API (4 endpoints):**
- GET /api/users - List users (admin)
- GET /api/users/:id - Get user profile
- GET /api/users/me - Get current user
- PUT /api/users/:id - Update user profile
- DELETE /api/users/:id - Delete user (admin)

**Admin API (4 endpoints):**
- GET /api/admin/stats - Platform statistics
- GET /api/admin/health - System health check
- GET /api/admin/moderation - Moderation queue
- POST /api/admin/bulk-action - Bulk operations

**Analytics API (4 endpoints):**
- GET /api/analytics/platform - Platform metrics
- GET /api/analytics/projects - Project analytics
- GET /api/analytics/events - Event analytics
- GET /api/analytics/users - User analytics

**Webhooks API (8 endpoints):**
- GET /api/webhooks - List webhooks
- GET /api/webhooks/:id - Get webhook details
- POST /api/webhooks - Create webhook
- PUT /api/webhooks/:id - Update webhook
- DELETE /api/webhooks/:id - Delete webhook
- POST /api/webhooks/:id/test - Test webhook delivery
- POST /api/webhooks/:id/retry - Retry failed delivery
- GET /api/webhooks/:id/deliveries - Get delivery history

**API Features:**
- Firebase Auth token verification
- Role-based rate limiting (100/500/1000 req/hr)
- Request validation with express-validator
- Standard JSON responses
- Pagination support
- Error handling
- CORS enabled
- Helmet security headers
- Webhook HMAC-SHA256 signatures
- Automatic webhook delivery on 20+ events
- Retry logic (up to 3 attempts)

---

### 23. **Task & Reminder System** ✅

**Task Management:**
- Task checklists per project
- Task creation and assignment
- Task completion tracking
- Progress indicators
- Personal notes section
- Task priorities
- Due dates

**Reminders:**
- Create reminders for projects/events
- Custom reminder messages
- Date/time scheduling
- Email notifications
- In-app notifications
- Reminder history
- Snooze functionality

---

### 24. **Review & Rating System** ⭐

**Reviews:**
- Project reviews
- Event reviews
- NGO reviews
- Star ratings (1-5)
- Written feedback
- Review moderation
- Response system
- Helpful/unhelpful voting

---

### 25. **Matching Algorithm** 🎯

**Smart Matching:**
- Volunteer-to-project matching
- Skill-based matching
- Interest-based recommendations
- Location proximity matching
- Availability matching
- Success rate calculation
- Match confidence scores

---

### 26. **Leadership & Teams** 👨‍👩‍👧‍👦

**Team Management:**
- Team leader assignment
- Team member management
- Leader profiles
- Team communication
- Delegation features
- Team analytics

---

## 🔧 Technical Architecture

### Frontend Stack
```
React 18.3.1
TypeScript 5.x
React Router DOM 7.x
TailwindCSS 3.x
Vite 4.x (build tool)
```

### Backend Stack
```
Firebase Functions (Node.js 20)
Express.js 4.x
TypeScript 5.x
Firebase Admin SDK
```

### Databases & Storage
```
Firebase Firestore (NoSQL database)
Firebase Storage (file storage)
Cloudinary (image CDN)
IndexedDB (client-side cache)
```

### External Services
```
Firebase Auth (authentication)
Firebase Cloud Messaging (push notifications)
Resend API (email delivery)
Google Analytics 4 (analytics)
Cloudinary (image management)
```

### Key Libraries
```
fuse.js - Fuzzy search
axios - HTTP client
react-helmet-async - SEO
react-firebase-hooks - Firebase integration
@tiptap/react - Rich text editor
lucide-react - Icons
xlsx - Excel export
uuid - Unique IDs
lowlight - Syntax highlighting
```

---

## 📂 Project Structure

```
wasillahemail/
├── src/
│   ├── components/        # 50+ React components
│   │   ├── Admin/         # Admin-specific components
│   │   ├── Analytics/     # Analytics dashboards
│   │   ├── CMS/           # Content management
│   │   ├── Chat/          # Chatbot components
│   │   ├── Dashboard/     # Dashboard widgets
│   │   ├── Donation/      # Donation forms
│   │   ├── Gamification/  # Points & achievements
│   │   ├── Matching/      # Matching algorithm UI
│   │   ├── NGO/           # NGO-specific components
│   │   ├── Reporting/     # Report builder
│   │   ├── Reviews/       # Review system
│   │   ├── SEO/           # SEO components
│   │   ├── Social/        # Social sharing
│   │   ├── Subscription/  # Subscription UI
│   │   └── Tasks/         # Task management
│   ├── pages/            # 28 page components
│   ├── services/         # API services
│   ├── utils/            # Utility functions (45+ files)
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript types (15+ files)
│   ├── config/           # Configuration files
│   └── i18n/             # Translations (English/Urdu)
├── functions/            # Firebase Cloud Functions
│   └── src/
│       └── api/          # REST API implementation
│           ├── endpoints/ # API endpoints (7 files)
│           ├── routes/    # Route definitions (8 files)
│           ├── middleware/# Auth, rate limit, validation
│           ├── services/  # Webhook service
│           ├── utils/     # API utilities
│           └── config/    # API configuration
├── public/               # Static assets
├── docs/                 # API documentation
├── kb/                   # Knowledge base data
└── __tests__/            # Test suites
```

---

## 💰 Current Cost Analysis (Blaze Plan)

### Monthly Costs Breakdown

**Firebase Services:**
- **Firestore:**
  - Reads: ~$0.03-0.09 (60% reduced with caching)
  - Writes: ~$0.02
  - Storage: ~$0.01
  - **Subtotal: ~$0.06-0.12/month**

- **Cloud Functions:**
  - Invocations: First 2M/month FREE
  - Compute time: First 400K GB-sec/month FREE
  - Network: First 5GB/month FREE
  - Typical usage: $0-0.70/month
  - **Subtotal: ~$0-0.70/month**

- **Cloud Storage:**
  - Storage: First 5GB FREE
  - Downloads: First 1GB/month FREE
  - Typical usage: ~$0-0.05/month
  - **Subtotal: ~$0-0.05/month**

- **Hosting:**
  - First 10GB storage: FREE
  - First 360MB/day transfer: FREE
  - **Subtotal: $0/month**

- **Auth:**
  - Phone auth: Not used
  - Email/OAuth: FREE
  - **Subtotal: $0/month**

**External Services:**
- **Cloudinary:**
  - Storage: First 10GB FREE
  - Transformations: First 25K/month FREE
  - Bandwidth: First 25GB/month FREE
  - **Subtotal: $0/month**

- **Resend (Email):**
  - First 3,000 emails/month: FREE
  - Currently using: ~100-500/month
  - **Subtotal: $0/month**

- **Google Analytics:**
  - Standard tier: FREE
  - **Subtotal: $0/month**

**New Segment Costs:**
- **Monitoring/Logging:** ~$0.04/month (batched writes)
- **Reports Storage:** ~$0.01-0.05/month

### 🎯 Total Monthly Cost Estimate

**Current Usage (Small scale - 100-500 users):**
- **Minimum:** $0.08/month
- **Typical:** $0.50-0.80/month
- **Maximum:** $1.50/month

**Medium Scale (1,000-2,000 users):**
- **Estimated:** $3-8/month

**Growing Scale (5,000+ users):**
- **Estimated:** $15-30/month

### 💡 Cost Optimization in Place

**Already Implemented:**
1. ✅ Multi-layer caching (60% Firestore read reduction)
2. ✅ Batched writes for logging/analytics
3. ✅ Optimized indexes (55 composite indexes)
4. ✅ Lazy loading & code splitting
5. ✅ CDN caching (Cloudinary, Workbox)
6. ✅ Image optimization
7. ✅ Service Worker offline support
8. ✅ Rate limiting on API
9. ✅ Query optimization
10. ✅ Bundle size optimization (45.8% reduction)

---

## 🚀 Deployment Workflows

### Current Deployment
- **Frontend:** Firebase Hosting (or Vercel)
- **Backend:** Firebase Functions
- **Database:** Firestore
- **Storage:** Firebase Storage + Cloudinary
- **Domain:** Custom domain (wasilah.pk or similar)

### CI/CD
- GitHub Actions for automated deployment
- Build verification before deploy
- Automated testing
- Environment variable management

---

## 🎯 Key User Workflows

### 1. **Volunteer Journey**
```
Sign Up → Select Role (Volunteer) → Onboarding Wizard → 
Complete Profile → Browse Projects → Apply to Project → 
Get Approved → Join Project → Complete Tasks → 
Earn Points → Get Certificate → Leave Review
```

### 2. **NGO Journey**
```
Sign Up → Select Role (NGO) → Onboarding → 
Complete NGO Profile → Submit for Verification → 
Get Verified → Create Project → Post Event → 
Manage Applications → Track Volunteers → 
View Analytics → Receive Donations
```

### 3. **Student Journey**
```
Sign Up → Select Role (Student) → Onboarding → 
Browse CSR Projects → Apply → Complete Hours → 
Request Certificate → Track Skills → 
Showcase Achievements
```

### 4. **Admin Journey**
```
Login → Admin Dashboard → Review Submissions → 
Approve/Reject Projects → Moderate Content → 
Manage Users → View Analytics → Seed KB → 
Configure Settings → Generate Reports
```

---

## 📊 Database Collections

**Firestore Collections (20+ collections):**
1. `users` - User profiles and roles
2. `project_submissions` - All projects
3. `event_submissions` - All events
4. `applications` - Volunteer applications
5. `event_registrations` - Event signups
6. `drafts` - Draft submissions
7. `kb` - Knowledge base for chatbot
8. `unanswered_queries` - Chatbot fallback tracking
9. `admin_notifications` - Admin alerts
10. `notifications` - User notifications
11. `donations` - Donation records
12. `subscriptions` - User subscriptions
13. `tasks` - Task management
14. `reminders` - User reminders
15. `reviews` - Reviews and ratings
16. `content` - CMS content
17. `content_versions` - Version history
18. `media` - Media library
19. `content_templates` - CMS templates
20. `reports` - Report configurations
21. `report_results` - Generated reports
22. `report_analytics` - Report usage tracking
23. `error_logs` - Error tracking
24. `performance_logs` - Performance metrics
25. `usage_logs` - Usage analytics
26. `leaders` - Team leaders

---

## 🔒 Security Features

**Authentication & Authorization:**
- Firebase Auth integration
- Email verification required
- Role-based access control (RBAC)
- Admin-only routes
- Owner-based permissions

**API Security:**
- Token verification on all endpoints
- Rate limiting per user role
- Request validation
- CORS configuration
- Helmet security headers
- HMAC webhook signatures

**Firestore Security Rules:**
- Read/write rules per collection
- Owner-based access
- Admin privileges
- Public read for approved content
- Private drafts

**Data Protection:**
- No PII in logs by default
- Secure file uploads
- Input sanitization
- XSS protection
- CSRF protection

---

## 🔄 Data Flow Examples

### Project Submission Flow
```
User fills form → Save as draft → Submit for review →
Admin receives notification → Admin reviews →
Approve/Reject with reason → User notified →
If approved: Project goes live → Appears in discovery →
Volunteers can apply
```

### Application Flow
```
Volunteer browses projects → Clicks Apply →
Fills application form → Submits →
NGO receives notification → NGO reviews application →
Accepts/Rejects → Volunteer notified →
If accepted: Added to project team →
Access to tasks and communication
```

### Donation Flow
```
Donor selects NGO/Project → Chooses amount →
Selects payment method → Completes payment →
Donation recorded in Firestore → NGO notified →
Receipt generated → Donor acknowledged →
Appears in donor wall (if not anonymous)
```

---

