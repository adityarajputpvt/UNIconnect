# 🎓 Uni-Connect — AI-Powered University Ecosystem

> A production-grade full-stack SaaS platform combining LinkedIn, Notion, Google Classroom, and AI career guidance into one seamless university operating system.

![Uni-Connect](https://img.shields.io/badge/Uni--Connect-v1.0.0-6366f1?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏆 **Achievement Management** | Track academic, certifications, internships, hackathons, research, and more |
| 🤖 **Aura AI Assistant** | GPT-4 powered career guidance, skill gap analysis, and recommendations |
| 📜 **Smart OCR Upload** | Auto-extract certificate data using Tesseract.js |
| ✅ **Verification Workflow** | Faculty-verified credentials with full audit trail |
| 🌐 **Public Portfolio** | Shareable, recruiter-ready portfolio pages |
| 📊 **Analytics Dashboards** | Rich charts for students, faculty, and admins |
| 💬 **Community Feed** | Social posts, likes, comments, and peer kudos |
| 🔔 **Real-time Notifications** | WebSocket-powered instant alerts |
| 🔐 **Role-Based Access** | Student, Faculty, Department Admin, Super Admin |
| 🌙 **Dark/Light Mode** | Full theme support |

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** animations
- **Zustand** state management
- **TanStack Query** data fetching
- **React Hook Form** + **Zod** validation
- **Recharts** analytics
- **Socket.io-client** real-time

### Backend
- **Node.js** + **Express.js** REST API
- **Prisma ORM** + **PostgreSQL**
- **JWT** auth with refresh token rotation
- **Socket.io** WebSockets
- **Cloudinary** file storage
- **Tesseract.js** OCR processing
- **OpenAI API** (GPT-4o-mini)
- **Nodemailer** email notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### 1. Clone & Setup

```bash
git clone <repo-url>
cd uniconnect
cp .env.example .env
# Fill in your environment variables
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed    # Creates demo users & sample data
npm run dev            # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev            # Starts on http://localhost:3000
```

### 4. Docker (Full Stack)

```bash
docker-compose up -d
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | demo123 |
| Faculty | faculty@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

---

## 📁 Project Structure

```
uniconnect/
├── frontend/                    # Next.js 15 App
│   └── src/
│       ├── app/                 # App Router pages
│       │   ├── (auth)/          # Login, Register, Forgot Password
│       │   ├── (dashboard)/     # Protected dashboard pages
│       │   └── portfolio/       # Public portfolio pages
│       ├── components/
│       │   ├── ui/              # shadcn/ui primitives
│       │   ├── landing/         # Landing page sections
│       │   └── dashboard/       # Dashboard components
│       ├── lib/                 # API client, utilities
│       ├── store/               # Zustand stores
│       └── types/               # TypeScript types
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── routes/              # Express routers
│   │   ├── middleware/          # Auth, upload, error handling
│   │   ├── services/            # Business logic
│   │   ├── socket/              # Socket.io manager
│   │   ├── utils/               # JWT, email, logger
│   │   └── config/              # Prisma, Cloudinary, env
│   └── prisma/
│       ├── schema.prisma        # Database schema
│       └── seed.ts              # Demo data seeder
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API Endpoints

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/auth` | Register, login, refresh, verify email |
| Profiles | `/api/profiles` | Profile CRUD, avatar, resume upload |
| Achievements | `/api/achievements` | Achievement CRUD, OCR, document upload |
| Verifications | `/api/verifications` | Faculty review queue and actions |
| AI | `/api/ai` | Aura chat, recommendations, profile analysis |
| Social | `/api/social` | Feed, posts, likes, comments, kudos |
| Notifications | `/api/notifications` | Real-time notification management |
| Analytics | `/api/analytics` | Student, faculty, admin dashboards |

---

## 🌍 Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Token signing keys
- `CLOUDINARY_*` — File storage credentials
- `OPENAI_API_KEY` — GPT-4 API key for Aura
- `SMTP_*` — Email configuration

---

## 🎨 Design System

- **Colors**: Indigo/Violet gradient brand palette
- **Typography**: Inter font with display variants
- **Components**: shadcn/ui with custom extensions
- **Animations**: Framer Motion throughout
- **Dark Mode**: Full CSS variable-based theming
- **Glassmorphism**: Subtle backdrop-blur effects

---

## 🔒 Security

- bcrypt password hashing (12 rounds)
- JWT access tokens (15min) + refresh tokens (7d)
- Rate limiting on auth endpoints
- RBAC middleware on all protected routes
- Input validation with Zod
- CORS protection
- Helmet.js security headers
- Audit logging for all sensitive actions

---

## 📈 Roadmap

- [ ] PDF portfolio export
- [ ] Mobile app (React Native)
- [ ] LMS integration (Moodle, Canvas)
- [ ] Blockchain credential verification
- [ ] Advanced analytics with ML insights
- [ ] Multi-language support

---

## 📄 License

MIT License — Built with ❤️ for students everywhere.
