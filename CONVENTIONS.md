# CONVENTIONS.md - Conventions de Développement Next.js BFF

## 📜 Philosophies Fondamentales

### 1. KISS - Keep It Simple, Stupid

> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

**Règles d'or:**
- **La solution la plus simple est la meilleure**
- **Éviter la complexité inutile**
- **Ne pas sur-ingénier** (No over-engineering)
- **Un code simple = un code maintenable**

### 2. Pragmatisme

- **YAGNI**: You Aren't Gonna Need It - Ne pas implémenter des features "au cas où"
- **DTSTTCPW**: Do The Simplest Thing That Could Possibly Work
- **Ne pas optimiser prématurément**

### 3. Clean Code Principles

> "Clean code is code that looks like it was written by someone who cares." - Robert C. Martin

**Règles:**
- Le code doit être **lisible** comme de la prose
- Chaque fonction doit faire **une seule chose** et la faire bien
- Les noms doivent être **explicites et intentionnels**
- La complexité doit être **minimale**

### 4. Architecture Standard

- **Next.js BFF Fullstack**: Un seul déploiement pour backend + frontend
- **Style NestJS**: Services, Controllers, Entities
- **Validation Zod**: Toutes les entrées validées avec Zod
- **Prisma**: ORM pour la base de données (optionnel)
- **Pas de DDD, pas d'Hexagonal**: On garde ça simple et direct

---

## 📁 Structure des Fichiers (Next.js BFF)

### Organisation des Dossiers

```
apps/
└── web/                           # Application Next.js
    ├── prisma/
    │   └── schema.prisma          # Schéma Prisma (génère les types)
    ├── src/
    │   ├── app/                   # Next.js App Router
    │   │   ├── api/               # API Routes (Transport Layer)
    │   │   │   ├── charges/
    │   │   │   │   ├── route.ts   # GET, POST
    │   │   │   │   └── [id]/
    │   │   │   │       └── route.ts # GET, PATCH, DELETE
    │   │   │   └── ...
    │   │   ├── (dashboard)/       # Pages Server Components
    │   │   │   └── charges/
    │   │   │       └── page.tsx
    │   │   └── layout.tsx
    │   │
    │   ├── server/                # Backend (NestJS-like)
    │   │   ├── db.ts              # PrismaService (Singleton)
    │   │   ├── common/            # Utilities backend
    │   │   │   ├── filter-to-where.ts  # Traducteur filtres → Prisma
    │   │   │   ├── http.ts         # Validation Zod + Error handling
    │   │   │   └── ...
    │   │   └── <module>/         # Modules par domaine
    │   │       ├── <module>.service.ts    # Service (CRUD + logique)
    │   │       ├── <module>.controller.ts # Controller (Validation + Délégation)
    │   │       └── ...
    │   │
    │   └── components/           # Composants React
    │       └── <feature>/
    │           ├── <feature>-guard.tsx   # Container RSC
    │           ├── <feature>-view.tsx    # Composant UI
    │           └── hooks/
    │               └── use-<feature>.ts   # Hooks client
    │
packages/
└── shared/                      # Code partagé (Domain pur)
    ├── schemas/                 # Schémas Zod (Source de vérité)
    │   ├── charge.ts            # Schémas pour Charge
    │   ├── filter.ts            # Schémas de filtres
    │   └── ...
    ├── domain/                  # Logique métier pure
    │   ├── schedule.ts          # Calculs de planning
    │   ├── calculation.ts       # Calculs financiers
    │   └── ...
    └── lib/                     # Utilities partagées
        └── types.ts
```

### Nommage des Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Module Backend | kebab-case (dossier) | `charges/` |
| Service | `<module>.service.ts` | `charge.service.ts` |
| Controller | `<module>.controller.ts` | `charges.controller.ts` |
| Schéma Zod | `<module>.ts` | `charge.ts` |
| Page Next.js | kebab-case | `page.tsx`, `charges/page.tsx` |
| Composant | PascalCase | `ChargesView.tsx` |
| Hook | `use-<nom>.ts` | `use-charges.ts` |
| Utility | kebab-case | `filter-to-where.ts` |
| Type/Interface | PascalCase | `Charge`, `ChargeQuery` |
| Constante | UPPER_SNAKE_CASE | `MAX_LIMIT`, `DEFAULT_CURRENCY` |

---

## 💻 Conventions de Code

### TypeScript

#### Typage

```typescript
// ✅ BON
const age: number = 25;
const isActive: boolean = true;
const charges: Charge[] = [];

// ❌ MAUVAIS
const age = 25; // any implicite
const isActive: any = true; // any explicite
const charges = []; // any[]
```

#### Schémas Zod (Très Important!)

```typescript
// ✅ BON - Schéma Zod complet pour un modèle
import { z } from "zod";

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

export const chargeTypeSchema = z.enum([
  "FIXED_RECURRING",
  "INSTALLMENT",
  "TEMPORARY",
  "ONE_OFF",
  "UPCOMING",
]);

export const chargeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  type: chargeTypeSchema,
  amount: z.number().positive(),
  currency: z.enum(["CHF", "EUR"]),
  accountId: z.string().uuid(),
  startDate: isoDate,
  endDate: isoDate().nullable(),
});

// Schémas dérivés (TOUJOURS utiliser zod.partial(), PAS TS Partial<>)
export const createChargeSchema = chargeSchema.omit({ id: true });
export const updateChargeSchema = createChargeSchema.partial();

export type Charge = z.infer<typeof chargeSchema>;
export type CreateChargeInput = z.infer<typeof createChargeSchema>;
export type UpdateChargeInput = z.infer<typeof updateChargeSchema>;

// ❌ MAUVAIS - Utiliser Partial<> de TypeScript
const updateChargeInput: Partial<Charge> = {}; // ❌ À éviter!
```

#### Schémas de Filtres

```typescript
// ✅ BON - Schéma de filtre générique
import { z } from "zod";

const filterValue = z.union([z.string(), z.number()]);

export const filterSchema = z.object({
  eq: filterValue.optional(),
  not: filterValue.optional(),
  in: z.array(filterValue).optional(),
  gte: filterValue.optional(),
  lte: filterValue.optional(),
  contains: filterValue.optional(),
});

export type Filter = z.infer<typeof filterSchema>;

// Schéma de query pour GET /charges
export const chargeQuerySchema = z.object({
  type: filterSchema.optional(),
  category: filterSchema.optional(),
  accountId: filterSchema.optional(),
  limit: z.number().int().positive().max(500).optional(),
  cursor: z.string().optional(),
});

export type ChargeQuery = z.infer<typeof chargeQuerySchema>;
```

#### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Variable | camelCase | `userName`, `isValid`, `chargeList` |
| Constante | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL`, `DEFAULT_LIMIT` |
| Fonction | camelCase | `getUser()`, `validateInput()`, `findMany()` |
| Classe | PascalCase | `ChargeService`, `UserController`, `PrismaService` |
| Interface | PascalCase | `Charge`, `ChargeQuery`, `IChargeService` (optionnel) |
| Méthode | camelCase | `findOne()`, `create()`, `update()`, `remove()` |
| Propriété | camelCase | `this.userName`, `this.chargeId` |
| Paramètre | camelCase | `function greet(userName: string)` |
| Enum | PascalCase | `ChargeType.ADMIN` |
| Générique | T, U, V | `T`, `K extends keyof T` |

#### Fonctions

```typescript
// ✅ BON - Noms de fonctions commençant par un verbe
function getCharge(id: string): Promise<Charge | null> {}
function createCharge(data: CreateChargeInput): Promise<Charge> {}
function validateChargeInput(input: unknown): Charge {}
function generateScheduledPayments(charge: Charge): ScheduledPayment[] {}

// Noms descriptifs
function calculateMonthlyProvision(charges: Charge[]): number {}
function formatDateForDisplay(date: Date): string {}

// ❌ MAUVAIS
function charge(id: string) {} // Pas de verbe
function handle() {} // Pas descriptif
function processData(data: any) {} // Trop vague
```

#### Classes (Style NestJS)

```typescript
// ✅ BON - Service avec méthodes CRUD standards
import { prisma } from "@/server/db";
import { ChargeQuery, CreateChargeInput, UpdateChargeInput } from "@mbongo/shared";
import { queryToWhere } from "@/server/common/filter-to-where";

export class ChargeService {
  // CRUD Standards
  async findMany(query: ChargeQuery): Promise<Charge[]> {
    return prisma.charge.findMany({
      where: queryToWhere(query),
      orderBy: { startDate: "desc" },
      take: query.limit,
    });
  }

  async findOne(id: string): Promise<Charge | null> {
    return prisma.charge.findUnique({ where: { id } });
  }

  async create(input: CreateChargeInput): Promise<Charge> {
    return prisma.charge.create({ data: input });
  }

  async update(id: string, input: UpdateChargeInput): Promise<Charge> {
    return prisma.charge.update({ where: { id }, data: input });
  }

  async remove(id: string): Promise<void> {
    await prisma.charge.delete({ where: { id } });
  }
  
  // Méthodes métier spécifiques
  async generatePayments(chargeId: string): Promise<ScheduledPayment[]> {
    const charge = await this.findOne(chargeId);
    if (!charge) throw new Error("Charge not found");
    
    return generateScheduledPayments(charge, new Date());
  }
}

// Singleton
const globalForChargeService = globalThis as unknown as { chargeService?: ChargeService };
export const chargeService = globalForChargeService.chargeService ?? new ChargeService();
if (process.env.NODE_ENV !== "production") globalForChargeService.chargeService = chargeService;

// ❌ MAUVAIS - Classe trop grosse avec trop de responsabilités
class ChargeManager {
  async findById(id: string) {}
  async save(charge: Charge) {}
  async sendEmail(charge: Charge) {} // Pas la responsabilité de ChargeManager
  async validate(charge: Charge) {} // Doit être dans un validator séparé
}
```

#### Controllers (Transport Layer)

```typescript
// ✅ BON - Controller avec validation + délégation
import { NextResponse } from "next/server";
import { chargeQuerySchema, createChargeSchema } from "@mbongo/shared";
import { parseBody, parseQuery, toErrorResponse } from "@/server/common/http";
import { ChargeService, chargeService } from "./charge.service";

export class ChargesController {
  constructor(private readonly charges: ChargeService) {}

  async find(request: Request): Promise<NextResponse> {
    try {
      const query = parseQuery(request, chargeQuerySchema);
      return NextResponse.json(await this.charges.findMany(query));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async create(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, createChargeSchema);
      return NextResponse.json(await this.charges.create(input), { status: 201 });
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async findOne(id: string): Promise<NextResponse> {
    try {
      return NextResponse.json(await this.charges.findOne(id));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      const input = await parseBody(request, updateChargeSchema);
      return NextResponse.json(await this.charges.update(id, input));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  async remove(id: string): Promise<NextResponse> {
    try {
      await this.charges.remove(id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

// Singleton
export const chargesController = new ChargesController(chargeService);

// ❌ MAUVAIS - Logique métier dans le controller
class ChargesController {
  async create(request: Request) {
    const body = await request.json();
    // ❌ Logique métier ici!
    if (body.amount > 10000) {
      // Validation complexe
    }
    // ❌ Accès direct à Prisma
    const charge = await prisma.charge.create({ data: body });
    return NextResponse.json(charge);
  }
}
```

#### API Routes (Next.js)

```typescript
// ✅ BON - Route handler minimal (wiring seulement)
// app/api/charges/route.ts
import { chargesController } from "@/server/charges/charges.controller";

export const GET = (request: Request) => chargesController.find(request);
export const POST = (request: Request) => chargesController.create(request);

// app/api/charges/[id]/route.ts
import { chargesController } from "@/server/charges/charges.controller";

type Context = { params: Promise<{ id: string }> };

export const GET = async (_request: Request, { params }: Context) =>
  chargesController.findOne((await params).id);

export const PATCH = async (request: Request, { params }: Context) =>
  chargesController.update(request, (await params).id);

export const DELETE = async (_request: Request, { params }: Context) =>
  chargesController.remove((await params).id);

// ❌ MAUVAIS - Logique dans les routes
// app/api/charges/route.ts
import { prisma } from "@/server/db";

export const GET = async (request: Request) => {
  // ❌ Logique directement dans la route!
  const { searchParams } = new URL(request.url);
  const charges = await prisma.charge.findMany({
    where: { /* complex filter */ },
  });
  return NextResponse.json(charges);
};
```

#### Prisma Service

```typescript
// ✅ BON - PrismaService singleton
import "server-only";
import { PrismaClient } from "@prisma/client";

class Database extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
}

const globalForDb = globalThis as unknown as { db?: Database };
export const prisma = globalForDb.db ?? new Database();
if (process.env.NODE_ENV !== "production") globalForDb.db = prisma;

// ❌ MAUVAIS - Créer plusieurs instances
import { PrismaClient } from "@prisma/client";

// ❌ dans chaque fichier!
const prisma = new PrismaClient();
```

#### Validation HTTP

```typescript
// ✅ BON - Validation centralisée avec Zod
import { ZodError, ZodSchema } from "zod";
import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(readonly status: number, readonly details?: unknown) {
    super(`HTTP ${status}`);
  }
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  return parse(await request.json(), schema);
}

export function parseQuery<T>(request: Request, schema: ZodSchema<T>): T {
  return parse(Object.fromEntries(new URL(request.url).searchParams), schema);
}

function parse<T>(value: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpError(400, result.error.flatten());
  return result.data;
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) return NextResponse.json({ error: error.details }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.flatten() }, { status: 400 });
  console.error(error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
```

#### Traduction Filtres → Prisma

```typescript
// ✅ BON - Traducteur générique
import { Filter } from "@mbongo/shared";
import { Prisma } from "@prisma/client";

function filterToCondition(filter: Filter): Record<string, unknown> {
  const condition: Record<string, unknown> = {};
  if (filter.eq !== undefined) condition.equals = filter.eq;
  if (filter.not !== undefined) condition.not = filter.not;
  if (filter.in !== undefined) condition.in = filter.in;
  if (filter.gte !== undefined) condition.gte = filter.gte;
  if (filter.lte !== undefined) condition.lte = filter.lte;
  if (filter.contains !== undefined) condition.contains = filter.contains;
  return condition;
}

export function queryToWhere(query: ChargeQuery): Prisma.ChargeWhereInput {
  const where: Record<string, unknown> = {};
  for (const [field, filter] of Object.entries(query)) {
    if (["limit", "cursor"].includes(field)) continue;
    if (filter) where[field] = filterToCondition(filter);
  }
  return where as Prisma.ChargeWhereInput;
}
```

#### Logique Métier Pure (packages/shared)

```typescript
// ✅ BON - Logique métier dans packages/shared (zéro dépendance)
import { addMonths, addWeeks, addYears, isAfter } from "date-fns";
import { Charge, ScheduledPayment } from "../schemas";

type Frequency = NonNullable<Charge["frequency"]>;
const steps: Record<Frequency, (d: Date, n: number) => Date> = {
  monthly: addMonths,
  weekly: addWeeks,
  yearly: addYears,
};

// Fonction pure, testable sans serveur
export function generateScheduledPayments(charge: Charge, from: Date): ScheduledPayment[] {
  switch (charge.type) {
    case "FIXED_RECURRING": {
      if (!charge.frequency) throw new Error("FIXED_RECURRING requires a frequency");
      const payments: ScheduledPayment[] = [];
      let due = new Date(charge.startDate);
      const horizon = charge.endDate ?? addYears(from, 5);
      while (!isAfter(due, horizon)) {
        payments.push(makePayment(charge, due));
        due = steps[charge.frequency](due, 1);
      }
      return payments;
    }
    // ... autres cas
  }
}

function makePayment(charge: Charge, dueDate: Date, amount = charge.amount): ScheduledPayment {
  return {
    id: crypto.randomUUID(),
    chargeId: charge.id,
    amount,
    currency: charge.currency,
    dueDate: dueDate.toISOString(),
    status: "PENDING",
  };
}
```

---

## 🧪 Testing

### Stratégie de Test

- **Unit Tests:** Tester chaque fonction en isolation (surtout la logique dans `packages/shared`)
- **Integration Tests:** Tester l'interaction entre composants
- **E2E Tests:** Tester les flux utilisateurs complets via l'API

### Exemple de Test Unitaire (Logique Métier)

```typescript
// ✅ BON - Test de logique métier pure
import { generateScheduledPayments } from "@mbongo/shared/domain";
import { Charge } from "@mbongo/shared/schemas";

describe("generateScheduledPayments", () => {
  it("should generate monthly payments for FIXED_RECURRING", () => {
    const charge: Charge = {
      id: "123",
      label: "Test",
      type: "FIXED_RECURRING",
      amount: 100,
      currency: "CHF",
      accountId: "456",
      startDate: "2024-01-01",
      endDate: "2024-06-01",
      frequency: "monthly",
      installments: null,
      provisioned: false,
    };

    const payments = generateScheduledPayments(charge, new Date("2024-01-01"));

    expect(payments).toHaveLength(6);
    expect(payments[0].dueDate).toBe("2024-01-01");
    expect(payments[5].dueDate).toBe("2024-06-01");
  });
});
```

### Exemple de Test d'Intégration

```typescript
// ✅ BON - Test d'intégration avec Prisma
import { prisma } from "@/server/db";
import { ChargeService } from "@/server/charges/charge.service";

describe("ChargeService", () => {
  let service: ChargeService;

  beforeAll(() => {
    service = new ChargeService();
  });

  afterEach(async () => {
    await prisma.charge.deleteMany({});
  });

  it("should create and find a charge", async () => {
    const charge = await service.create({
      label: "Test",
      type: "ONE_OFF",
      amount: 100,
      currency: "CHF",
      accountId: "123",
      startDate: "2024-01-01",
    });

    const found = await service.findOne(charge.id);
    expect(found).toBeDefined();
    expect(found?.label).toBe("Test");
  });
});
```

---

## 📦 Git & Versioning

### Commit Messages

Utiliser [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add charge management
fix: correct payment calculation
chore: update prisma schema
docs: update README
refactor: extract payment logic
```

### Branches

```
main          # Production
release/*     # Release en préparation
develop       # Développement principal
feature/*     # Nouvelle feature
fix/*         # Correction de bug
refactor/*    # Refactoring
chore/*       # Tâches techniques
```

---

## 🔄 Code Review

### Checklist avant Review

- [ ] La spec est validée et à jour
- [ ] La todo list est mise à jour
- [ ] Le code suit les conventions
- [ ] Tous les tests passent
- [ ] Le linting passe
- [ ] Le typage TypeScript est correct
- [ ] La documentation est complète
- [ ] Les commits suivent Conventional Commits

### Bonnes Pratiques de Review

**✅ BON:**
- "Peux-tu extraire cette logique dans packages/shared pour la réutiliser côté client?"
- "As-tu considéré l'impact sur les performances avec beaucoup de données?"
- "Le nom de cette variable n'est pas très explicite, que penses-tu de `maxRetryCount`?"

**❌ MAUVAIS:**
- "C'est nul"
- "Je n'aime pas"
- "Fais comme je dis"

---

## 📊 Métriques & Outils

### Outils de Qualité

- **ESLint**: Linting TypeScript/JavaScript
- **Prettier**: Formatage automatique
- **TypeScript**: Vérification des types
- **Jest/Vitest**: Testing
- **Prisma**: ORM et migrations
- **Zod**: Validation des schémas

### Configuration Recommandée

Voir `.eslintrc.json` et `.prettierrc` pour les configurations complètes.

---

## 🎯 Bonnes Pratiques Additionnelles

### 1. Early Returns

```typescript
// ✅ BON
function processCharge(charge: Charge | null): void {
  if (!charge) return;
  if (!charge.isActive) return;
  // Logique principale
}

// ❌ MAUVAIS
function processCharge(charge: Charge | null): void {
  if (charge) {
    if (charge.isActive) {
      // Logique principale
    }
  }
}
```

### 2. Optional Chaining & Nullish Coalescing

```typescript
// ✅ BON
const userName = user?.profile?.name ?? 'Anonymous';
const email = user?.email ?? defaultEmail;

// ❌ MAUVAIS
const userName = user && user.profile && user.profile.name ? user.profile.name : 'Anonymous';
```

### 3. Destructuring

```typescript
// ✅ BON
const { name, email, profile: { avatar } } = user;
const [first, second, ...rest] = items;

// ❌ MAUVAIS
const name = user.name;
const email = user.email;
const avatar = user.profile.avatar;
```

### 4. Immutabilité

```typescript
// ✅ BON
const updatedCharge = {
  ...charge,
  status: 'PAID',
};

const filteredCharges = charges.filter(c => c.isActive);

// ❌ MAUVAIS
charge.status = 'PAID';
charges.splice(0, 1);
```

---

## 💡 Conseils Spécifiques à l'Architecture

### 1. **Validation à la Frontière**
- **TOUJOURS** valider avec Zod dans les controllers
- **JAMAIS** faire confiance aux données entrées
- Utiliser `parseQuery` et `parseBody` systématiquement

### 2. **Séparation des Concerns**
- **Controllers**: Validation + Délégation uniquement
- **Services**: Logique métier + CRUD
- **Domain (shared)**: Logique pure, zéro dépendance
- **Routes**: Wiring uniquement

### 3. **Zod Partout**
- Une seule source de vérité pour les types
- Schémas complets pour chaque modèle
- `zod.partial()` pour les updates, PAS `Partial<T>`

### 4. **Prisma comme ORM**
- Utiliser Prisma pour les opérations DB
- PAS écrire de SQL brut (sauf si nécessaire)
- Utiliser les types générés par Prisma

### 5. **Next.js RSC vs Client**
- **RSC**: Composants serveur, accès direct aux services
- **Client**: Composants UI, hooks, appels API via `/api`
- **Pas de mélange**: Ne pas mettre de logique métier dans les composants client

---

**Règle Ultime:**
> "Keep It Simple, Stupid."

---

*Dernière mise à jour: 2024-11-05*  
*Version: 2.0.0*  
*Architecture: Next.js BFF + NestJS-like Style + KISS*  
*Statut: ✅ Applicable immédiatement*
