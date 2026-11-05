# Project Setup Guide - Mbongo

**Complete AI Agent Configuration with Spec-Driven Development and Clean Code**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# From the root directory
cd /Users/anco/mbongo

# Install all dependencies (monorepo)
npm install

# This will install dependencies in:
# - Root (turbo, typescript)
# - apps/web (next.js, prisma, etc.)
# - packages/shared (zod, date-fns)
```

### 2. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (creates SQLite database)
npm run prisma:push

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 3. Start Development Server

```bash
# Start the Next.js development server
npm run dev

# Or run from the web app directly
cd apps/web && npm run dev
```

### 4. Open the Application

```bash
# Open in your browser
http://localhost:3000/charges
```

## 📁 Project Structure

```
mbongo/
├── AGENTS.md                    # AI Agent configuration and behavior
├── CONVENTIONS.md               # Development conventions and patterns
├── README.md                    # Main project documentation
├── SETUP.md                     # This file - setup instructions
├── TODO.md                      # Global todo list and roadmap
├── .eslintrc.json               # ESLint configuration
├── .prettierrc                  # Prettier configuration
├── .gitignore                   # Git ignore patterns
├── package.json                 # Monorepo configuration with Turbo
├── tsconfig.json                # Root TypeScript configuration
│
├── .vibe/
│   └── config/
│       └── settings.json        # Vibe CLI settings
│
├── apps/
│   └── web/                     # Next.js 15 Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/
│       │   │   │   └── charges/
│       │   │   │       └── page.tsx            # Charges dashboard page
│       │   │   ├── api/
│       │   │   │   └── charges/
│       │   │   │       ├── [id]/
│       │   │   │       │   ├── payments/
│       │   │   │       │   │   ├── [paymentId]/
│       │   │   │       │   │   │   └── paid/
│       │   │   │       │   │   │       └── route.ts   # Mark payment as paid
│       │   │   │       │   │   ├── next/
│       │   │   │       │   │   │   └── route.ts       # Get next payment
│       │   │   │       │   │   └── route.ts         # Get all payments
│       │   │   │       │   └── route.ts           # GET, PATCH, DELETE charge
│       │   │   │       └── route.ts             # GET, POST charges
│       │   │   ├── globals.css                # Global styles with Tailwind
│       │   │   └── layout.tsx                 # Root layout with QueryProvider
│       │   │
│       │   ├── server/
│       │   │   ├── db.ts                      # PrismaService singleton
│       │   │   ├── common/
│       │   │   │   ├── filter-to-where.ts      # Filter to Prisma where translator
│       │   │   │   └── http.ts                # HTTP validation & error handling
│       │   │   └── charges/
│       │   │       ├── charge.service.ts      # Charge service (CRUD + business logic)
│       │   │       └── charges.controller.ts  # Charge controller (validation + delegation)
│       │   │
│       │   ├── components/
│       │   │   ├── charges/
│       │   │   │   ├── charges-guard.tsx       # Server component (prefetch)
│       │   │   │   ├── charges-view.tsx        # Client component (UI)
│       │   │   │   └── hooks/
│       │   │   │       └── use-charges.ts     # React Query hooks
│       │   │   └── providers/
│       │   │       └── query-provider.tsx     # React Query provider
│       │   │
│       │   ├── lib/
│       │   │   └── api.ts                     # Typed API client
│       │   │
│       │   └── index.ts                       # Module exports
│       │
│       ├── prisma/
│       │   └── schema.prisma                 # Prisma schema (SQLite)
│       │
│       ├── package.json                       # App dependencies
│       ├── tsconfig.json                      # App TypeScript config
│       ├── next.config.js                      # Next.js configuration
│       ├── tailwind.config.js                  # Tailwind CSS configuration
│       ├── postcss.config.js                   # PostCSS configuration
│       ├── .env.example                        # Environment variables template
│       └── next-env.d.ts                       # Next.js types
│
├── packages/
│   └── shared/                  # Shared code (Domain pure - zero dependencies)
│       ├── src/
│       │   ├── schemas/
│       │   │   ├── charge.ts                 # Zod schemas for Charge
│       │   │   └── filter.ts                 # Zod schemas for Filter
│       │   ├── domain/
│       │   │   └── schedule.ts               # Pure domain logic (payment scheduling)
│       │   └── index.ts                      # Package exports
│       ├── package.json                       # Package dependencies
│       └── tsconfig.json                      # Package TypeScript config
│
├── skills/
│   ├── clean-code/
│   │   └── SKILL.md                         # Clean Code skill for AI Agents
│   └── spec-driven-development/
│       ├── SKILL.md                         # SDD skill for AI Agents
│       ├── SPEC_TEMPLATE.md                 # Specification template
│       └── SPEC_INDEX_TEMPLATE.md           # Specification index template
│
├── docs/
│   └── specs/
│       └── INDEX.md                         # Specifications index
│
└── .gitignore
```

## 🔧 Available Scripts

### Root Level (Monorepo)

```bash
# Install all dependencies
npm install

# Run all apps in development
npm run dev

# Build all apps
npm run build

# Lint all packages
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Type checking
npm run typecheck

# Clean build artifacts
npm run clean

# Run all quality checks
npm run quality
npm run quality:fix

# Prisma commands
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:push        # Push schema to database
```

### App Level (apps/web)

```bash
# Navigate to app
cd apps/web

# Development
npm run dev

# Production
npm run build
npm run start

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Type checking
npm run typecheck

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:push        # Push schema to database
npm run db:seed        # Seed database (if seed file exists)
```

## 🏗️ Architecture Overview

### Next.js BFF Pattern
- **Single Deployable**: One Next.js app for both frontend and backend
- **API Routes**: `/api/*` - Transport layer (REST API)
- **App Router**: `/app/*` - Pages and UI components
- **Server Components (RSC)**: Server-side data fetching
- **Client Components**: Interactive UI with hooks

### Backend Structure (NestJS-like)
```
server/
├── db.ts                    # PrismaService (Singleton)
├── common/                  # Utilities
│   ├── filter-to-where.ts   # Generic filter translator
│   └── http.ts              # Validation + Error handling
└── <module>/
    ├── <module>.service.ts   # Business logic + CRUD
    └── <module>.controller.ts # Validation + Delegation
```

### Frontend Structure
```
app/
├── api/                     # API Routes (wiring only)
│   └── <module>/            # Module endpoints
├── (dashboard)/             # Protected pages
│   └── <module>/            # Module pages
└── layout.tsx               # Root layout

components/
└── <feature>/
    ├── <feature>-guard.tsx  # Server container (prefetch)
    ├── <feature>-view.tsx   # Client view component
    └── hooks/
        └── use-<feature>.ts # React Query hooks
```

### Shared Package (Pure Domain)
```
packages/shared/
├── schemas/                 # Zod schemas (source of truth)
│   ├── charge.ts            # Charge type definitions
│   └── filter.ts            # Filter schemas
└── domain/                  # Pure business logic
    └── schedule.ts          # Payment scheduling logic
```

## 📊 Example Module: Charges

The project includes a complete example implementation of the **Charges** module:

### Schema (packages/shared/src/schemas/charge.ts)
- `Charge` - Main entity
- `ScheduledPayment` - Payment entity
- `CreateChargeInput` - Creation DTO
- `UpdateChargeInput` - Update DTO (partial)
- `ChargeQuery` - Query parameters
- Type definitions for all enums (ChargeType, Currency, Frequency, etc.)

### Domain Logic (packages/shared/src/domain/schedule.ts)
- `generateScheduledPayments()` - Generate payments for a charge
- `monthlyProvision()` - Calculate monthly provision
- `remainingBalance()` - Calculate remaining balance
- `paymentsInMonth()` - Filter payments by month
- `nextPayment()` - Get next scheduled payment
- `isOverdue()` - Check if payment is overdue
- `overduePayments()` - Get all overdue payments

### Service Layer (apps/web/src/server/charges/charge.service.ts)
- `findMany()` - List charges with filtering/pagination
- `findOne()` - Get single charge
- `create()` - Create charge with scheduled payments
- `update()` - Update charge
- `remove()` - Delete charge
- `regeneratePayments()` - Regenerate scheduled payments
- `getPayments()` - Get payments for a charge
- `getNextPayment()` - Get next payment
- `markPaymentAsPaid()` - Mark payment as paid

### Controller Layer (apps/web/src/server/charges/charges.controller.ts)
- Validation using Zod schemas
- Delegation to service layer
- Response formatting
- Error handling

### API Routes (apps/web/src/app/api/charges/)
- `GET /api/charges` - List charges
- `POST /api/charges` - Create charge
- `GET /api/charges/:id` - Get charge by ID
- `PATCH /api/charges/:id` - Update charge
- `DELETE /api/charges/:id` - Delete charge
- `GET /api/charges/:id/payments` - Get payments for charge
- `GET /api/charges/:id/payments/next` - Get next payment
- `PATCH /api/charges/:id/payments/:paymentId/paid` - Mark payment as paid

### Client Components
- `ChargesGuard` (Server Component) - Prefetch data
- `ChargesView` (Client Component) - Display UI
- `useCharges()` hook - React Query hooks for charges

## 🎯 AI Agent Configuration

### Agent Files
- **AGENTS.md**: Complete AI Agent configuration
  - Mission & Role
  - Behavior & Priorities
  - Critical Rules (NEVER violate)
  - Workflow (Spec-Driven Development)
  - Qualities Expected
  - Prohibitions
  - Project Structure
  - Technical Configuration
  - Quality Metrics

- **CONVENTIONS.md**: Development conventions
  - Philosophies (KISS, Pragmatism, Clean Code)
  - File organization
  - File naming conventions
  - Code conventions (TypeScript, Zod, etc.)
  - Examples for each pattern
  - Testing strategy
  - Git & Versioning
  - Code Review checklist

- **TODO.md**: Global todo list
  - Immediate next steps
  - Project setup status
  - Module status
  - Technical tasks
  - UI/UX tasks
  - Security tasks
  - Release checklist
  - Roadmap

### Skills
- **spec-driven-development**: Enforces spec-first development
  - SPEC_TEMPLATE.md: Template for writing specifications
  - SPEC_INDEX_TEMPLATE.md: Template for specification index
  - SKILL.md: Detailed skill instructions

- **clean-code**: Enforces clean code principles
  - SKILL.md: Principles, patterns, and examples

### Vibe CLI Settings
- `.vibe/config/settings.json`: Complete configuration
  - Agent persona and behavior
  - Enabled skills
  - Workflow configuration
  - Quality gates
  - Validation rules

## 🛡️ Quality Standards

### Code Quality
- **Test Coverage**: Minimum 80% required
- **Linting**: 0 errors, 0 warnings
- **Type Safety**: 0 TypeScript errors
- **Code Complexity**: Functions < 30 lines, max 4 parameters

### Clean Code Principles
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **DRY**: Don't Repeat Yourself
- **SOLID**: Single Responsibility, Open/Closed, etc.

### Architecture Principles
- **NestJS-like**: Service + Controller + Entity
- **Next.js BFF**: Backend for Frontend
- **No DDD/Hexagonal**: Keep it simple and direct
- **Zod First**: Zod schemas are single source of truth

## 🔄 Development Workflow

### Spec-Driven Development (SDD)
1. **ANALYSE** → Understand the user requirement
2. **SPEC** → Write detailed specification (use SPEC_TEMPLATE.md)
3. **REVIEW** → Get spec validated by user
4. **PLAN** → Create todo list of tasks
5. **DEV** → Implement following spec and conventions
6. **TEST** → Write and run tests (80%+ coverage)
7. **DOC** → Document changes
8. **REVIEW** → Final review and cleanup

### AI Agent Workflow
1. Load relevant skill (if applicable)
2. Analyze requirement
3. Create/Update spec (if needed)
4. Update TODO.md
5. Implement changes
6. Write/Update tests
7. Verify with quality checks (lint, format, typecheck, test)
8. Commit changes
9. Provide summary

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Link project
vercel link

# Deploy
vercel
```

### Manual Deployment
```bash
# Build
npm run build

# Start
npm run start

# Ensure DATABASE_URL is set
DATABASE_URL=file:./prod.db npm run start
```

### Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## 💡 Tips & Tricks

### Import Paths
- Use path aliases for cleaner imports:
  ```typescript
  import { prisma } from '@/server/db';
  import { chargeService } from '@/server/charges/charge.service';
  import { Charge } from '@mbongo/shared';
  ```

### Zod Schemas
- Always use Zod for validation
- Define schemas in `packages/shared/schemas/`
- Export types from schemas: `type Charge = z.infer<typeof chargeSchema>`
- Use `.partial()` for update schemas: `updateChargeSchema = createChargeSchema.partial()`

### Prisma
- Use the singleton pattern for Prisma client
- Extend PrismaClient for custom methods
- Use transactions for complex operations
- Cache the client in development for HMR

### React Query
- Use hooks for data fetching
- Prefetch data in server components
- Use HydrationBoundary for SSR
- Cache queries properly

## 📚 Documentation

### Project Documentation
- **README.md**: Main project documentation
- **SETUP.md**: Setup instructions (this file)
- **AGENTS.md**: AI Agent configuration
- **CONVENTIONS.md**: Development conventions
- **TODO.md**: Global todo list

### External Documentation
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Zod**: https://zod.dev
- **React Query**: https://tanstack.com/query
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🙏 Troubleshooting

### Common Issues

**1. Prisma Client Not Generated**
```bash
cd apps/web
npx prisma generate
```

**2. Database Connection Failed**
- Check `.env.local` for DATABASE_URL
- Ensure the database file exists
- Try: `npm run prisma:push`

**3. Module Not Found Errors**
- Run `npm install` in root
- Check path aliases in tsconfig.json
- Verify import paths

**4. TypeScript Errors**
- Run `npm run typecheck` to see all errors
- Check tsconfig.json for proper configuration
- Ensure all dependencies are installed

**5. Linting Errors**
- Run `npm run lint:fix` to auto-fix
- Manually fix remaining errors
- Check .eslintrc.json for configuration

**6. Formatting Issues**
- Run `npm run format` to format all files
- Check .prettierrc for configuration

### Getting Help
1. Check the documentation files
2. Review the conventions in CONVENTIONS.md
3. Follow the AI Agent instructions in AGENTS.md
4. Check the TODO.md for known issues
5. Review the Git history for changes

## 🎉 Success Checklist

After completing the setup:

- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Database created (`npm run prisma:push`)
- [ ] Development server starts (`npm run dev`)
- [ ] Application opens at http://localhost:3000/charges
- [ ] API endpoints work (try with Postman/curl)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No linting errors (`npm run lint`)
- [ ] No formatting issues (`npm run format:check`)

If all checks pass, your project is ready for development! 🎉

---

**Project Version**: 2.0.0  
**Architecture**: Next.js BFF Fullstack + NestJS-like Style + KISS  
**Status**: ✅ Ready for Development  
**Last Updated**: 2024-11-05
