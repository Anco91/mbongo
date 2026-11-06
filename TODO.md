# TODO List - Mbongo Project

**Project**: AI Agent Configuration with Spec-Driven Development
**Architecture**: Next.js BFF Fullstack + NestJS-like Style + KISS
**Status**: ✅ Core Setup Complete

---

## 🚀 Immediate Next Steps

## 🧭 Objectif V1 — livraisons reviewables

- [ ] **Précondition qualité** :
  - [x] Implémenter le socle npm/Turbo défini dans [SPEC-TOOLING-001](docs/specs/tooling-foundation/SPEC.md).
  - [ ] Établir lint, format et types verts pour le squelette existant avant les features.
- [ ] **M1 POC** : spec validée ; implémenter par petites PR sur branches dédiées.
- [ ] **M2 Cœur métier** *(en cours)* : séparation CRUD `Charge` / `Payment` selon la spec validée ; charges typées, échéancier et carte différée à livrer.
- [ ] **M3 V1 utilisable** : dashboard/Sankey, vue foyer, import CSV, provisions, alertes et capital restant ; specs validées avant implémentation.
- [ ] **Clôture V1** : vérifier le critère d’usage réel du CDC §10 et documenter la livraison.

Chaque livraison fonctionnelle doit rester petite, être poussée sur sa propre branche et faire l’objet d’une PR avant de passer à la suivante.

- [ ] **Setup Database**: Run `npm run prisma:push` to initialize database
- [ ] **Test Development Server**: Run `npm run dev` and verify at http://localhost:3000/charges
- [ ] **Verify Prisma Client**: Check that `npm run prisma:generate` works correctly
- [ ] **Test API Endpoints**: Verify all charge API routes work with Postman/curl
- [ ] **Add Authentication**: Implement user authentication (NextAuth, Clerk, etc.)

---

## 🏗️ Project Setup (In Progress)

### ✅ Completed
- [x] **Monorepo Structure**: Configured with Turbo
- [x] **Next.js App**: Created with App Router
- [x] **Prisma Setup**: Schema, client, and migrations configured
- [x] **Zod Schemas**: Complete schemas for Charge, ScheduledPayment, Filter
- [x] **Backend Architecture**: NestJS-like (Service, Controller, DB)
- [x] **Frontend Architecture**: RSC + React Query + Client Components
- [x] **API Routes**: All charge endpoints (CRUD + payments)
- [x] **React Query Hooks**: useCharges, useCreateCharge, etc.
- [x] **UI Components**: ChargesGuard, ChargesView
- [x] **Shared Package**: Schemas, domain logic, types
- [x] **TypeScript Config**: Strict mode, path aliases
- [x] **ESLint/Prettier**: Configured for Clean Code
- [x] **AI Agent Config**: AGENTS.md, CONVENTIONS.md, Skills
- [x] **Documentation**: README.md, SPEC_TEMPLATE.md

### 📋 Pending
- [ ] **Authentication**: Add user auth to protect routes
- [ ] **Authorization**: Add permission checks
- [ ] **More Modules**: Add Account, Transaction, etc.
- [ ] **Error Tracking**: Setup Sentry or similar
- [ ] **Monitoring**: Add logging and metrics
- [ ] **CI/CD Pipeline**: GitHub Actions or similar
- [ ] **Docker Support**: Add Dockerfile and docker-compose

---

## 📦 Module: Charges (Legacy Example — M2 Refactor)

### ✅ Completed
- [x] **Schema**: Existing charge.ts; M2 separates charge.ts and payment.ts
- [x] **Filter Schema**: filter.ts with generic filter types
- [x] **Domain Logic**: schedule.ts with payment generation
- [x] **Prisma Model**: Charge and Payment models; Payment keeps the existing scheduled_payments table
- [x] **PrismaService**: db.ts singleton
- [x] **Common Utilities**: filter-to-where.ts, http.ts
- [x] **Service Layer**: ChargeService and PaymentService have separate CRUD responsibilities
- [x] **Controller Layer**: ChargesController and PaymentsController validate and delegate per resource
- [x] **API Routes**: GET, POST, PATCH, DELETE for charges
- [x] **Payment Routes**: `/api/payments` CRUD; charge-scoped payment routes removed
- [x] **React Query Hooks**: useCharges, useCreateCharge, etc.
- [x] **Server Component**: ChargesGuard with prefetch
- [x] **Client Component**: ChargesView with UI
- [x] **Page**: /charges dashboard page

### 📝 Notes
- The original scaffold was the legacy example; its Charge/Payment boundaries now follow `docs/specs/m2-charge-payments/SPEC.md`.
- All components are type-safe with Zod schemas

---

## 🔧 Technical Tasks

### TypeScript
- [ ] **Verify Types**: Check all types compile correctly
- [ ] **Add More Types**: Extend shared types as needed

### Testing
- [ ] **Unit Tests**: Add tests for domain logic
- [ ] **Integration Tests**: Add tests for services
- [ ] **E2E Tests**: Add end-to-end tests
- [ ] **Coverage**: Ensure 80%+ coverage

### Quality
- [ ] **Lint Check**: Run `npm run lint` and fix issues
- [ ] **Format Check**: Run `npm run format:check` and fix issues
- [ ] **Type Check**: Run `npm run typecheck` and fix issues
- [ ] **Quality Script**: Run `npm run quality` to verify all checks

### Documentation
- [ ] **API Docs**: Document all API endpoints
- [ ] **Component Docs**: Add JSDoc to all components
- [ ] **Architecture Docs**: Add detailed architecture documentation

---

## 🎨 UI/UX Tasks

### Layout & Design
- [ ] **Design System**: Define colors, typography, spacing
- [ ] **Tailwind Config**: Customize tailwind.config.js
- [ ] **Global Styles**: Update globals.css with brand styles
- [ ] **Component Library**: Create reusable UI components

### Pages
- [ ] **Home Page**: Create landing page
- [ ] **Dashboard**: Extend with more features
- [ ] **Authentication Pages**: Login, register, forgot password
- [ ] **Error Pages**: 404, 500, maintenance

### Components
- [ ] **Form Components**: Input, Select, DatePicker, etc.
- [ ] **Table Components**: DataTable, Pagination, Sorting
- [ ] **Modal Components**: Dialog, Confirmation, etc.
- [ ] **Notification System**: Toasts, Alerts
- [ ] **Loading States**: Spinners, Skeletons

---

## 📊 Data & Database

### Prisma
- [ ] **Verify Schema**: Check schema matches requirements
- [ ] **Add Migrations**: Create and apply migrations
- [ ] **Seed Data**: Add seed data for development

### Database
- [ ] **Production Setup**: Configure production database
- [ ] **Backups**: Setup database backup strategy
- [ ] **Optimization**: Add indexes, optimize queries

---

## 🔐 Security

### Authentication
- [ ] **Choose Provider**: NextAuth, Clerk, Auth0, etc.
- [ ] **Implement Auth**: Add authentication to app
- [ ] **Session Management**: Configure session handling

### Authorization
- [ ] **Permission System**: Define user roles and permissions
- [ ] **Route Protection**: Protect routes based on permissions
- [ ] **Data Access**: Filter data based on user permissions

### Security Best Practices
- [ ] **Input Validation**: Already implemented with Zod
- [ ] **Output Sanitization**: Sanitize data before rendering
- [ ] **Rate Limiting**: Add rate limiting to API
- [ ] **CORS**: Configure CORS properly
- [ ] **CSRF Protection**: Add CSRF protection
- [ ] **XSS Protection**: Add XSS protection

---

## ⚡ Performance

### Next.js Optimizations
- [ ] **Image Optimization**: Use next/image for images
- [ ] **Font Optimization**: Use next/font for fonts
- [ ] **Script Optimization**: Use next/script for scripts
- [ ] **Static Generation**: Add static pages where appropriate
- [ ] **Server-Side Rendering**: Optimize SSR for SEO

### Caching
- [ ] **React Query Cache**: Configure cache strategies
- [ ] **API Cache**: Add caching to API routes
- [ ] **CDN**: Setup CDN for static assets

### Monitoring
- [ ] **Performance Metrics**: Track Core Web Vitals
- [ ] **Error Tracking**: Setup Sentry or similar
- [ ] **Logging**: Add structured logging

---

## 🚀 Deployment

### Preparation
- [ ] **Environment Config**: Setup environment variables for production
- [ ] **CI/CD Pipeline**: Configure GitHub Actions or similar
- [ ] **Docker Setup**: Create Dockerfile and docker-compose
- [ ] **Database Migration**: Setup production database migration

### Hosting Options
- [ ] **Vercel**: Deploy to Vercel (recommended)
- [ ] **Netlify**: Deploy to Netlify
- [ ] **AWS**: Deploy to AWS (EC2, ECS, Lambda)
- [ ] **Azure**: Deploy to Azure
- [ ] **GCP**: Deploy to Google Cloud Platform

---

## 📝 Documentation Tasks

### Internal Documentation
- [ ] **Architecture Decision Records (ADR)**: Document key decisions
- [ ] **API Documentation**: Document all API endpoints
- [ ] **Component Documentation**: Document all React components
- [ ] **Module Documentation**: Document all backend modules

### External Documentation
- [ ] **User Guide**: Create user documentation
- [ ] **Getting Started**: Improve getting started guide
- [ ] **Examples**: Add more usage examples
- [ ] **FAQ**: Add frequently asked questions

---

## 🤖 AI Agent Tasks

### Skill Improvements
- [ ] **Spec-Driven Development**: Enhance spec templates
- [ ] **Clean Code**: Add more examples and patterns
- [ ] **Testing**: Add testing guidelines
- [ ] **Review**: Add code review guidelines

### Agent Configuration
- [ ] **Custom Skills**: Add project-specific skills
- [ ] **Templates**: Add more templates for common tasks
- [ ] **Automation**: Automate common agent tasks

---

## 📈 Project Metrics

### Code Quality
- [ ] **Test Coverage**: Maintain 80%+ coverage
- [ ] **Lint Score**: 0 errors, 0 warnings
- [ ] **Type Safety**: 0 TypeScript errors
- [ ] **Code Complexity**: Keep functions < 30 lines, max 4 params

### Performance
- [ ] **Bundle Size**: Keep bundle size reasonable
- [ ] **Load Time**: Optimize page load times
- [ ] **Time to Interactive**: Optimize TTI

### Security
- [ ] **Vulnerability Scan**: Regular security scans
- [ ] **Dependency Audit**: Regular dependency updates
- [ ] **Secret Management**: Secure handling of secrets

---

## 🎯 Release Checklist

### Before Release
- [ ] **All Tests Pass**: Run `npm run test`
- [ ] **Lint Passes**: Run `npm run lint`
- [ ] **Format Passes**: Run `npm run format:check`
- [ ] **Type Check Passes**: Run `npm run typecheck`
- [ ] **Build Succeeds**: Run `npm run build`
- [ ] **Database Migrations**: All migrations applied
- [ ] **Documentation Updated**: All docs up to date
- [ ] **Changelog Updated**: Update CHANGELOG.md

### Release
- [ ] **Version Bump**: Update version in package.json
- [ ] **Tag Release**: Create Git tag
- [ ] **Push Tags**: Push tags to repository
- [ ] **Create Release**: Create GitHub release
- [ ] **Deploy**: Deploy to production
- [ ] **Verify**: Verify deployment works

### After Release
- [ ] **Monitor**: Monitor for issues
- [ ] **Hotfix**: Prepare for hotfixes if needed
- [ ] **Feedback**: Collect user feedback

---

## 📅 Roadmap

### Phase 1: Core Setup ✅ (Current)
- [x] Project structure and configuration
- [x] Next.js app with App Router
- [x] Prisma ORM setup
- [x] Zod validation schemas
- [x] Backend architecture (NestJS-like)
- [x] Frontend architecture (RSC + React Query)
- [x] AI Agent configuration
- [x] Example implementation (Charges module)

### Phase 2: Authentication & Security
- [ ] User authentication
- [ ] Session management
- [ ] Authorization system
- [ ] Security best practices

### Phase 3: Additional Features
- [ ] Account module
- [ ] Transaction module
- [ ] Report generation
- [ ] Export/Import functionality

### Phase 4: Production Readiness
- [ ] Testing (unit, integration, e2e)
- [ ] Performance optimization
- [ ] Error tracking and monitoring
- [ ] CI/CD pipeline
- [ ] Documentation

### Phase 5: Launch
- [ ] Beta testing
- [ ] User feedback
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Marketing and promotion

---

## 💡 Ideas & Backlog

### Features
- [ ] **Recurring Payment Calendar**: Visual calendar for payments
- [ ] **Payment Reminders**: Email/SMS reminders for upcoming payments
- [ ] **Budget Tracking**: Track spending against budget
- [ ] **Financial Reports**: Generate monthly/yearly reports
- [ ] **Multi-Currency Support**: Support for multiple currencies
- [ ] **Bank Integration**: Connect to bank APIs
- [ ] **Mobile App**: React Native mobile app

### Technical
- [ ] **GraphQL API**: Add GraphQL support alongside REST
- [ ] **WebSockets**: Real-time updates with WebSockets
- [ ] **Offline Support**: Add offline capabilities with service workers
- [ ] **PWA**: Progressive Web App support
- [ ] **Internationalization**: Multi-language support
- [ ] **Accessibility**: Improve accessibility (a11y)

### Infrastructure
- [ ] **Microservices**: Split into microservices if needed
- [ ] **Kubernetes**: Deploy to Kubernetes cluster
- [ ] **Service Mesh**: Add service mesh for microservices
- [ ] **Feature Flags**: Add feature flag system
- [ ] **A/B Testing**: Add A/B testing capabilities

---

## 📝 Notes

### Conventions
- Follow **CONVENTIONS.md** for all coding
- Use **AGENTS.md** for AI Agent behavior
- Always write **specs first** (Spec-Driven Development)
- Maintain **Clean Code** principles
- Apply **KISS** (Keep It Simple, Stupid)

### Architecture
- **Next.js BFF**: Backend for Frontend pattern
- **NestJS-like**: Service + Controller + Entity architecture
- **No DDD/Hexagonal**: Keep it simple and direct
- **Zod First**: Zod schemas are the single source of truth for types

### Quality
- **80%+ Test Coverage**: Minimum requirement
- **0 Lint Errors**: Must pass linting
- **0 Type Errors**: Must pass type checking
- **Clean Code**: Must follow clean code principles

---

**Last Updated**: 2024-11-05
**Next Review**: 2024-11-12
**Project Status**: ✅ Core Setup Complete
