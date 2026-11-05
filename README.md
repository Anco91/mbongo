# Mbongo Project

**AI Agent Configuration with Spec-Driven Development and Clean Code Craftsmanship**

## 🚀 Overview

This project is a fully configured Next.js BFF (Backend for Frontend) Fullstack application with:

- **Next.js 15** with App Router
- **Prisma ORM** for database operations
- **Zod** for schema validation (single source of truth)
- **React Query** for client-side data management
- **TypeScript** for type safety
- **Clean Code** principles and KISS architecture
- **Spec-Driven Development** workflow

## 📁 Project Structure

```
mbongo/
├── AGENTS.md                    # AI Agent configuration
├── CONVENTIONS.md               # Development conventions
├── README.md                    # This file
├── TODO.md                      # Global todo list
├── package.json                 # Monorepo configuration
├── .gitignore
├── tsconfig.json                # Root TypeScript config
│
├── apps/
│   └── web/                     # Next.js Application
│       ├── src/
│       │   ├── app/             # Next.js App Router
│       │   │   ├── api/         # API Routes (Transport)
│       │   │   │   └── charges/ # Charge API endpoints
│       │   │   ├── (dashboard)/ # Dashboard pages
│       │   │   │   └── charges/ # Charges dashboard
│       │   │   ├── globals.css  # Global styles
│       │   │   └── layout.tsx   # Root layout
│       │   │
│       │   ├── server/          # Backend (NestJS-like)
│       │   │   ├── db.ts        # PrismaService singleton
│       │   │   ├── common/      # Utilities
│       │   │   │   ├── filter-to-where.ts
│       │   │   │   └── http.ts   # Validation & error handling
│       │   │   └── charges/     # Charges module
│       │   │       ├── charge.service.ts  # Service layer
│       │   │       └── charges.controller.ts # Controller layer
│       │   │
│       │   ├── components/     # React Components
│       │   │   ├── charges/     # Charges components
│       │   │   │   ├── charges-guard.tsx
│       │   │   │   ├── charges-view.tsx
│       │   │   │   └── hooks/
│       │   │   │       └── use-charges.ts
│       │   │   └── providers/   # Providers
│       │   │       └── query-provider.tsx
│       │   │
│       │   └── lib/             # Utilities
│       │       └── api.ts       # API client
│       │
│       ├── prisma/              # Prisma
│       │   └── schema.prisma   # Database schema
│       │
│       ├── package.json         # App dependencies
│       ├── tsconfig.json        # App TypeScript config
│       ├── next.config.js       # Next.js config
│       └── .env.example         # Environment variables
│
├── packages/
│   └── shared/                  # Shared code (Domain pure)
│       ├── src/
│       │   ├── schemas/         # Zod schemas
│       │   │   ├── charge.ts    # Charge schemas
│       │   │   └── filter.ts    # Filter schemas
│       │   ├── domain/          # Domain logic
│       │   │   └── schedule.ts  # Payment scheduling
│       │   └── index.ts         # Package exports
│       │
│       ├── package.json         # Package config
│       └── tsconfig.json        # TypeScript config
│
├── skills/                      # AI Agent Skills
│   ├── clean-code/
│   │   └── SKILL.md
│   └── spec-driven-development/
│       ├── SKILL.md
│       ├── SPEC_TEMPLATE.md
│       └── SPEC_INDEX_TEMPLATE.md
│
└── docs/
    └── specs/                   # Validated specifications
        └── INDEX.md
```

## 🛠️ Tech Stack

### Core
- **Next.js 15** - Fullstack React framework
- **TypeScript** - Type safety
- **Prisma** - ORM for database
- **SQLite** - Default database (easy to use)

### Validation & Types
- **Zod** - Schema validation (single source of truth)
- **date-fns** - Date utilities

### UI & State Management
- **React Query (TanStack)** - Server state management
- **Tailwind CSS** - Utility-first CSS (optional, but included)

### Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Jest** - Testing (configured in packages)
- **Turbo** - Monorepo build system

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mbongo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Push schema to database
   npm run prisma:push
   
   # (Optional) Open Prisma Studio
   npm run prisma:studio
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   cd apps/web && npm run dev
   ```

5. **Open the app**
   ```bash
   http://localhost:3000/charges
   ```

### Quick Setup Script

```bash
# Install everything and set up database
npm run setup
```

## 📊 Available Scripts

### Root Level
```bash
npm run dev              # Start all apps in dev mode
npm run build            # Build all apps
npm run lint             # Lint all packages
npm run lint:fix         # Fix lint issues
npm run format           # Format code
npm run format:check     # Check formatting
npm run test             # Run all tests
npm run typecheck        # Type check all packages
npm run clean            # Clean build artifacts
npm run quality          # Run all quality checks
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
npm run prisma:studio    # Open Prisma Studio
```

### App Level (in apps/web)
```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint the app
npm run lint:fix         # Fix lint issues
npm run format           # Format code
npm run test             # Run tests
npm run typecheck        # Type check
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
```

## 🏗️ Architecture

### Next.js BFF Pattern
- **Single Deployable**: One Next.js app for both frontend and backend
- **API Routes**: `/api/*` - Transport layer (Validation → Controller → Service)
- **App Router**: `/app/*` - Pages and UI components
- **Server Components**: RSC for server-side data fetching
- **Client Components**: Interactive UI with hooks

### Backend Structure (NestJS-like)
```
server/
├── db.ts                    # PrismaService (Singleton)
├── common/
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
│   └── filter.ts            # Generic filter schemas
└── domain/                  # Pure business logic
    └── schedule.ts          # Payment scheduling logic
```

## 📜 Conventions

### Code Style
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **DRY**: Don't Repeat Yourself
- **Clean Code**: Readable, maintainable, testable

### Naming
- **Variables**: camelCase (`userName`, `isValid`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LIMIT`, `DEFAULT_CURRENCY`)
- **Functions**: camelCase starting with verb (`getUser`, `createCharge`)
- **Classes**: PascalCase (`ChargeService`, `UserController`)
- **Files**: kebab-case (`charge.service.ts`, `charges.controller.ts`)

### File Structure
- **Schemas**: `packages/shared/schemas/<module>.ts`
- **Domain Logic**: `packages/shared/domain/<module>.ts`
- **Service**: `apps/web/src/server/<module>/<module>.service.ts`
- **Controller**: `apps/web/src/server/<module>/<module>.controller.ts`
- **API Routes**: `apps/web/src/app/api/<module>/route.ts`
- **Pages**: `apps/web/src/app/(dashboard)/<module>/page.tsx`
- **Components**: `apps/web/src/components/<feature>/<feature>-view.tsx`
- **Hooks**: `apps/web/src/components/<feature>/hooks/use-<feature>.ts`

## 🎯 AI Agent Configuration

This project is configured for use with **Vibe CLI** and other AI coding agents:

### Agent Files
- **AGENTS.md**: Agent configuration and instructions
- **CONVENTIONS.md**: Development conventions and patterns
- **TODO.md**: Global todo list and roadmap

### Skills
- **spec-driven-development**: Enforces spec-first development
- **clean-code**: Enforces clean code principles and patterns

### Workflow
1. **ANALYSE** → Understand the user requirement
2. **SPEC** → Write detailed specification (use `SPEC_TEMPLATE.md`)
3. **REVIEW** → Get spec validated by user
4. **PLAN** → Create todo list of tasks
5. **DEV** → Implement following spec and conventions
6. **TEST** → Write and run tests (80%+ coverage)
7. **DOC** → Document changes
8. **REVIEW** → Final review and cleanup

### Commands for AI Agents
```bash
# Run quality checks
npm run quality

# Install and setup
npm run setup

# Start development
npm run dev
```

## 🧪 Testing

### Test Coverage
- **Minimum**: 80% coverage required
- **Target**: 100% coverage
- **Tools**: Jest for unit and integration tests

### Running Tests
```bash
# All tests
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Examples

**Unit Test (Domain Logic)**
```typescript
// packages/shared/__tests__/domain/schedule.test.ts
import { generateScheduledPayments } from '@mbongo/shared/domain';
import { Charge } from '@mbongo/shared/schemas';

describe('generateScheduledPayments', () => {
  it('should generate monthly payments for FIXED_RECURRING', () => {
    const charge: Charge = {
      id: '123',
      label: 'Test',
      type: 'FIXED_RECURRING',
      amount: 100,
      currency: 'CHF',
      accountId: '456',
      startDate: '2024-01-01',
      endDate: '2024-06-01',
      frequency: 'monthly',
      installments: null,
      provisioned: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    const payments = generateScheduledPayments(charge, new Date('2024-01-01'));
    expect(payments).toHaveLength(6);
  });
});
```

**Integration Test (Service Layer)**
```typescript
// apps/web/__tests__/server/charges/charge.service.test.ts
import { prisma } from '@/server/db';
import { ChargeService } from '@/server/charges/charge.service';

describe('ChargeService', () => {
  let service: ChargeService;

  beforeAll(() => {
    service = new ChargeService();
  });

  afterEach(async () => {
    await prisma.charge.deleteMany({});
  });

  it('should create and find a charge', async () => {
    const charge = await service.create({
      label: 'Test',
      type: 'ONE_OFF',
      amount: 100,
      currency: 'CHF',
      accountId: '123',
      startDate: '2024-01-01',
    });

    const found = await service.findOne(charge.id);
    expect(found).toBeDefined();
    expect(found?.label).toBe('Test');
  });
});
```

## 📖 Documentation

### Spec-Driven Development
- See `skills/spec-driven-development/SPEC_TEMPLATE.md` for spec template
- See `skills/spec-driven-development/SKILL.md` for workflow details

### Clean Code Principles
- See `skills/clean-code/SKILL.md` for principles and examples
- See `CONVENTIONS.md` for project-specific conventions

### Architecture References
- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Zod Documentation**: https://zod.dev
- **React Query Documentation**: https://tanstack.com/query

## 🤖 AI Agent Integration

This project is designed to be AI-agent friendly:

### Agent Instructions
1. Always follow **AGENTS.md** for behavior and constraints
2. Always follow **CONVENTIONS.md** for coding standards
3. Use **Spec-Driven Development** for all new features
4. Maintain **80%+ test coverage**
5. Write **Clean Code** following KISS principles
6. Use **English** for all code (variable names, comments, etc.)
7. **Never** use DDD or Hexagonal Architecture (use NestJS-like style)

### Agent Workflow
```
USER REQUEST →
  1. Load relevant skill (if applicable)
  2. Analyze requirement
  3. Create/Update spec (if needed)
  4. Update TODO.md
  5. Implement changes
  6. Write/Update tests
  7. Verify with quality checks (lint, format, typecheck, test)
  8. Commit changes
  9. Provide summary
```

## 🔄 Deployment

### Vercel (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Link project: `vercel link`
3. Deploy: `vercel`

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

### Manual Deployment
1. Build: `npm run build`
2. Start: `npm run start`
3. Ensure DATABASE_URL is set in environment

## 💬 Communication

### Code
- **Language**: English only (variable names, function names, classes, etc.)
- **Comments**: Use JSDoc for public APIs, inline comments for complex logic

### Documentation
- **Language**: English or French (user preference)
- **Style**: Clear, concise, professional

### Git
- **Commits**: Use Conventional Commits
  - `feat:` - New feature
  - `fix:` - Bug fix
  - `chore:` - Technical task
  - `refactor:` - Code refactoring
  - `docs:` - Documentation
  - `test:` - Tests only
- **Messages**: Clear, descriptive, in English

## 📊 Project Status

- ✅ **Configuration**: Complete
- ✅ **Architecture**: Next.js BFF + NestJS-like
- ✅ **Conventions**: Defined in CONVENTIONS.md
- ✅ **AI Agent Setup**: Complete (AGENTS.md)
- ✅ **Spec-Driven Development**: Configured
- ✅ **Clean Code**: Enforced via ESLint/Prettier
- ✅ **Type Safety**: TypeScript with strict mode
- ✅ **Validation**: Zod schemas
- ✅ **Database**: Prisma with SQLite
- ✅ **Example Implementation**: Charges module complete

## 🎯 Next Steps

1. **Customize**: Update the example Charge module with your own domain logic
2. **Add More Modules**: Follow the same pattern for other entities
3. **Add Authentication**: Implement auth (NextAuth, Clerk, etc.)
4. **Add More UI**: Extend the React components
5. **Add Tests**: Write comprehensive tests for all modules
6. **Deploy**: Deploy to Vercel or other hosting

## 📄 License

MIT - See LICENSE file for details.

## 🙏 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Follow the conventions in CONVENTIONS.md
4. Write specs and tests
5. Commit your changes (`git commit -m 'feat: your feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Open a Pull Request

## 📞 Support

For questions or issues:
- Check the documentation
- Review the conventions in CONVENTIONS.md
- Follow the AI Agent instructions in AGENTS.md
- Open an issue in the repository

---

**Project Version**: 2.0.0  
**Architecture**: Next.js BFF Fullstack + NestJS-like Style + KISS  
**Status**: ✅ Ready for Development  
**Last Updated**: 2024-11-05
