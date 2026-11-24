# SKILL.md - Clean Code Craftsmanship (Next.js BFF Edition)

## 🎯 Description

**Skill de Clean Code et Craftsmanship** - Une approche rigoureuse pour produire du code de haute qualité, maintenable et élégant **dans le contexte Next.js BFF Fullstack**.

> "Clean code is code that looks like it was written by someone who cares." - Robert C. Martin

**Philosophie:** KISS (Keep It Simple, Stupid) - On garde le code **simple, lisible et direct**.

## 📌 Capabilités

Cette skill permet à l'Agent IA de:

1. **Appliquer les principes SOLID** systématiquement
2. **Écrire du code auto-documenté** avec des noms explicites
3. **Respecter les conventions Next.js BFF** (pas de DDD, pas d'Hexagonal)
4. **Détecter et corriger** les code smells
5. **Refactorer** du code existant de manière sûre
6. **Reviewer du code** avec un œil critique
7. **Optimiser** pour la lisibilité et la maintenabilité
8. **Utiliser Zod** pour la validation des schémas

## 🚀 Activation

Cette skill s'active automatiquement quand:
- Un fichier de code est modifié
- Une review de code est demandée
- Le mot "refactor" est mentionné
- Du code "spaghetti" est détecté
- Une violation des conventions est identifiée

## 🏆 Principes Fondamentaux

### 1. KISS - Keep It Simple, Stupid

> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

**Exemple:**
```typescript
// ✅ BON - Simple et direct
function isEven(number: number): boolean {
  return number % 2 === 0;
}

// ❌ MAUVAIS - Trop complexe pour rien
function isEven(number: number): boolean {
  const remainder = number % 2;
  const isRemainderZero = remainder === 0;
  const result = isRemainderZero ? true : false;
  return result;
}
```

### 2. SOLID Principles (Simplifiés)

#### S - Single Responsibility Principle
> "A class should have only one reason to change."

**Exemple Next.js BFF:**
```typescript
// ✅ BON - Une classe, une responsabilité
// Service: CRUD pour Charge
class ChargeService {
  async findMany(query: ChargeQuery): Promise<Charge[]> {}
  async findOne(id: string): Promise<Charge | null> {}
  async create(input: CreateChargeInput): Promise<Charge> {}
  async update(id: string, input: UpdateChargeInput): Promise<Charge> {}
  async remove(id: string): Promise<void> {}
}

// Controller: Validation + Délégation
class ChargesController {
  constructor(private readonly service: ChargeService) {}
  async find(request: Request): Promise<NextResponse> {}
  async create(request: Request): Promise<NextResponse> {}
}

// ❌ MAUVAIS - Plusieurs responsabilités
class ChargeManager {
  async findById(id: string) {}
  async save(charge: Charge) {}
  async sendEmail(charge: Charge) {} // Pas la responsabilité!
  async validate(charge: Charge) {} // Pas la responsabilité!
}
```

#### O - Open/Closed Principle
> "Software entities should be open for extension, but closed for modification."

**Exemple:**
```typescript
// ✅ BON - Ouvert à l'extension
// Utiliser des stratégies pour les différents types de paiements
interface PaymentStrategy {
  calculate(amount: number): number;
}

class PercentageDiscount implements PaymentStrategy {
  constructor(private readonly percentage: number) {}
  calculate(amount: number): number {
    return amount * (1 - this.percentage / 100);
  }
}

class FixedDiscount implements PaymentStrategy {
  constructor(private readonly amount: number) {}
  calculate(price: number): number {
    return Math.max(0, price - this.amount);
  }
}

// On peut ajouter de nouvelles stratégies sans modifier le code existant

// ❌ MAUVAIS - Fermé à l'extension
class Discount {
  type: 'percentage' | 'fixed';
  value: number;
  
  calculate(price: number): number {
    // Il faut modifier cette méthode pour ajouter un nouveau type
    if (this.type === 'percentage') {
      return price * (1 - this.value / 100);
    } else {
      return Math.max(0, price - this.value);
    }
  }
}
```

#### L - Liskov Substitution Principle
> "Subtypes must be substitutable for their base types."

**Exemple:**
```typescript
// ✅ BON - Sous-types substituables
class Rectangle {
  constructor(protected width: number, protected height: number) {}
  
  setWidth(width: number): void {
    this.width = width;
  }
  
  setHeight(height: number): void {
    this.height = height;
  }
  
  area(): number {
    return this.width * this.height;
  }
}

// ❌ MAUVAIS - Violation de LSP
class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // Modifie aussi la hauteur!
  }
}
```

#### I - Interface Segregation Principle
> "Clients should not be forced to depend on interfaces they do not use."

**Exemple:**
```typescript
// ✅ BON - Interfaces petites et spécifiques
interface IReadable {
  read(): string;
}

interface IWritable {
  write(data: string): void;
}

class File implements IReadable, IWritable {
  read(): string { /* ... */ }
  write(data: string): void { /* ... */ }
}

class ReadOnlyFile implements IReadable {
  read(): string { /* ... */ }
}

// ❌ MAUVAIS - Interface trop grosse
interface IFile {
  read(): string;
  write(data: string): void;
  delete(): void;
  rename(newName: string): void;
}

class SimpleFile implements IFile {
  read(): string { /* ... */ }
  write(data: string): void { /* ... */ }
  delete(): void { throw new Error('Not implemented'); }
  rename(newName: string): void { throw new Error('Not implemented'); }
}
```

#### D - Dependency Inversion Principle
> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

**Exemple Next.js BFF:**
```typescript
// ✅ BON - Dépendre d'abstractions
// Interface dans packages/shared
interface IChargeRepository {
  findById(id: string): Promise<Charge | null>;
  save(charge: Charge): Promise<Charge>;
}

// Service dépend de l'interface
class ChargeService {
  constructor(private readonly repository: IChargeRepository) {}
  
  async getCharge(id: string): Promise<Charge> {
    const charge = await this.repository.findById(id);
    if (!charge) throw new Error('Charge not found');
    return charge;
  }
}

// Implémentation avec Prisma
class PrismaChargeRepository implements IChargeRepository {
  async findById(id: string): Promise<Charge | null> {
    return prisma.charge.findUnique({ where: { id } });
  }
  
  async save(charge: Charge): Promise<Charge> {
    return prisma.charge.upsert({ where: { id: charge.id }, create: charge, update: charge });
  }
}

// On peut changer l'implémentation sans modifier le service
const repository = new PrismaChargeRepository();
const service = new ChargeService(repository);

// ❌ MAUVAIS - Dépendance concrète
class ChargeService {
  async getCharge(id: string): Promise<Charge> {
    // Dépend directement de Prisma
    return prisma.charge.findUnique({ where: { id } });
  }
}
```

### 3. DRY, KISS, YAGNI

#### DRY - Don't Repeat Yourself
> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

**Exemple:**
```typescript
// ✅ BON - Pas de duplication
// packages/shared/schemas/filter.ts
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

// Utilisé partout
import { filterSchema } from "@mbongo/shared/schemas/filter";

// ❌ MAUVAIS - Duplication
// Dans chaque module...
export const chargeFilterSchema = z.object({
  eq: z.union([z.string(), z.number()]).optional(),
  // ... même code répété
});

export const userFilterSchema = z.object({
  eq: z.union([z.string(), z.number()]).optional(),
  // ... même code répété
});
```

#### KISS - Keep It Simple, Stupid

**Exemple:**
```typescript
// ✅ BON - Simple et clair
function formatCurrency(amount: number, currency: string = 'CHF'): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ❌ MAUVAIS - Trop complexe
function formatCurrency(amount: number, currency: string = 'CHF'): string {
  const formatter = new Intl.NumberFormat('fr-CH', { style: 'currency', currency });
  const formatted = formatter.format(amount);
  const result = formatted;
  return result;
}
```

#### YAGNI - You Aren't Gonna Need It

**Exemple:**
```typescript
// ✅ BON - On implémente seulement ce qui est nécessaire
class ChargeService {
  constructor(private readonly prisma: PrismaClient) {}
  
  async findMany(query: ChargeQuery): Promise<Charge[]> {
    return this.prisma.charge.findMany({ where: queryToWhere(query) });
  }
}

// ❌ MAUVAIS - On implémente "au cas où"
class ChargeService {
  constructor(private readonly prisma: PrismaClient) {}
  
  async findMany(query: ChargeQuery): Promise<Charge[]> {}
  async findManyWithPayments(query: ChargeQuery): Promise<Charge[]> {} // Pas utilisé
  async findManyWithUser(query: ChargeQuery): Promise<Charge[]> {} // Pas utilisé
  async findManyArchived(query: ChargeQuery): Promise<Charge[]> {} // Pas utilisé
}
```

---

## 🔍 Code Smells & Anti-Patterns (Next.js BFF)

### 1. Code Smells

#### Long Method
> Une méthode trop longue est difficile à comprendre et à maintenir.

**Solution:** Extraire des méthodes plus petites

```typescript
// ✅ BON - Méthodes courtes et focalisées
class ChargeService {
  async createChargeWithPayments(input: CreateChargeInput): Promise<Charge> {
    this.validateInput(input);
    const charge = await this.createCharge(input);
    await this.createScheduledPayments(charge);
    return charge;
  }
  
  private validateInput(input: CreateChargeInput): void { /* ... */ }
  private async createCharge(input: CreateChargeInput): Promise<Charge> { /* ... */ }
  private async createScheduledPayments(charge: Charge): Promise<void> { /* ... */ }
}

// ❌ MAUVAIS - Méthode trop longue
class ChargeService {
  async createChargeWithPayments(input: CreateChargeInput): Promise<Charge> {
    // 50 lignes de validation
    // 30 lignes de création
    // 40 lignes de génération de paiements
    // Total: 120 lignes!
  }
}
```

#### Large Class
> Une classe avec trop de responsabilités.

**Solution:** Appliquer SRP et diviser la classe

```typescript
// ✅ BON - Classes petites et focalisées
// ChargeService: CRUD pour Charge
class ChargeService {
  async findMany(query: ChargeQuery): Promise<Charge[]> {}
  async findOne(id: string): Promise<Charge | null> {}
  async create(input: CreateChargeInput): Promise<Charge> {}
  async update(id: string, input: UpdateChargeInput): Promise<Charge> {}
  async remove(id: string): Promise<void> {}
}

// PaymentService: Logique de paiement
class PaymentService {
  async generatePayments(charge: Charge): Promise<ScheduledPayment[]> {}
  async processPayment(paymentId: string): Promise<void> {}
}

// ❌ MAUVAIS - Classe trop grosse
class ChargeManager {
  async findMany(query: ChargeQuery): Promise<Charge[]> {}
  async create(input: CreateChargeInput): Promise<Charge> {}
  async generatePayments(charge: Charge): Promise<ScheduledPayment[]> {}
  async processPayment(paymentId: string): Promise<void> {}
  // ... beaucoup d'autres méthodes
}
```

#### Magic Numbers/Strings
> Des valeurs codées en dur sans explication.

**Solution:** Utiliser des constantes nommées

```typescript
// ✅ BON - Constantes nommées
// packages/shared/lib/constants.ts
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_CURRENCY = 'CHF';
const DEFAULT_LIMIT = 100;

export { MAX_RETRIES, RETRY_DELAY_MS, DEFAULT_CURRENCY, DEFAULT_LIMIT };

// ✅ MAUVAIS - Magic Numbers/Strings
function getCharges(limit: number = 100) {} // 100 est magique
function formatCurrency(amount: number, currency: string = 'CHF') {} // 'CHF' est magique
```

#### Duplicate Code
> Le même code apparaît dans plusieurs endroits.

**Solution:** Extraire dans un module partagé

```typescript
// ✅ BON - Code partagé dans packages/shared
// packages/shared/lib/calculation.ts
export function monthlyProvision(charges: Charge[]): number {
  return round2(charges.filter((c) => c.provisioned).reduce((sum, c) => sum + c.amount / 12, 0));
}

// Utilisé partout
import { monthlyProvision } from "@mbongo/shared/lib/calculation";

// ❌ MAUVAIS - Code dupliqué
// Dans server/charges/charge.service.ts
function calculateMonthlyProvision(charges: Charge[]): number {
  return charges.filter(c => c.provisioned).reduce((sum, c) => sum + c.amount / 12, 0);
}

// Dans components/dashboard/Provision.tsx
function calculateMonthly(charges: Charge[]): number {
  return charges.filter(c => c.provisioned).reduce((sum, c) => sum + c.amount / 12, 0);
}
```

#### Long Parameter List
> Une méthode avec trop de paramètres est difficile à comprendre et à utiliser.

**Solution:** Utiliser des Parameter Objects (Schémas Zod)

```typescript
// ✅ BON - Parameter Object avec Zod
// packages/shared/schemas/charge.ts
export const createChargeSchema = z.object({
  label: z.string().min(1),
  type: chargeTypeSchema,
  amount: z.number().positive(),
  currency: z.enum(["CHF", "EUR"]),
  accountId: z.string().uuid(),
  startDate: isoDate,
  endDate: isoDate().nullable(),
});

export type CreateChargeInput = z.infer<typeof createChargeSchema>;

// server/charges/charge.service.ts
class ChargeService {
  async create(input: CreateChargeInput): Promise<Charge> {
    return prisma.charge.create({ data: input });
  }
}

// ❌ MAUVAIS - Trop de paramètres
class ChargeService {
  async create(
    label: string,
    type: string,
    amount: number,
    currency: string,
    accountId: string,
    startDate: string,
    endDate: string | null,
    frequency: string | null,
    installments: number | null,
  ): Promise<Charge> {
    return prisma.charge.create({ data: { /* ... */ } });
  }
}
```

#### Feature Envy
> Une méthode qui utilise beaucoup les données d'une autre classe.

**Solution:** Déplacer la méthode dans la classe appropriée

```typescript
// ✅ BON - Méthode dans la bonne classe
// packages/shared/domain/calculation.ts
import { Charge } from "../schemas/charge";

export function remainingBalance(charge: Charge, payments: ScheduledPayment[]): number {
  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  return round2(charge.amount - paid);
}

// ❌ MAUVAIS - Feature Envy
// server/charges/charge.service.ts
class ChargeService {
  remainingBalance(charge: Charge, payments: ScheduledPayment[]): number {
    const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
    return charge.amount - paid;
  }
}
```

### 2. Anti-Patterns Spécifiques à Next.js BFF

#### ❌ Logique Métier dans les Routes

```typescript
// ❌ MAUVAIS - Logique dans les routes
// app/api/charges/route.ts
import { prisma } from "@/server/db";

export const POST = async (request: Request) => {
  const body = await request.json();
  
  // ❌ Logique métier ici!
  if (body.amount > 10000) {
    // Validation complexe
  }
  
  // ❌ Accès direct à Prisma
  const charge = await prisma.charge.create({ data: body });
  
  return NextResponse.json(charge);
};

// ✅ BON - Délégation au controller
// app/api/charges/route.ts
import { chargesController } from "@/server/charges/charges.controller";

export const POST = (request: Request) => chargesController.create(request);
```

#### ❌ Accès Direct à Prisma dans les Controllers

```typescript
// ❌ MAUVAIS - Prisma dans le controller
// server/charges/charges.controller.ts
import { prisma } from "@/server/db";

export class ChargesController {
  async findOne(id: string): Promise<NextResponse> {
    // ❌ Accès direct à Prisma
    const charge = await prisma.charge.findUnique({ where: { id } });
    return NextResponse.json(charge);
  }
}

// ✅ BON - Appel au service
// server/charges/charges.controller.ts
import { ChargeService } from "./charge.service";

export class ChargesController {
  constructor(private readonly service: ChargeService) {}
  
  async findOne(id: string): Promise<NextResponse> {
    const charge = await this.service.findOne(id);
    return NextResponse.json(charge);
  }
}
```

#### ❌ Schémas Zod Dupliqués

```typescript
// ❌ MAUVAIS - Schémas dupliqués
// server/charges/charge.service.ts
export const chargeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  // ...
});

// server/users/user.service.ts
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  // ... même pattern
});

// ✅ BON - Schémas centralisés
// packages/shared/schemas/charge.ts
export const chargeSchema = z.object({ /* ... */ });

// packages/shared/schemas/user.ts
export const userSchema = z.object({ /* ... */ });
```

#### ❌ Validation Manuelle au lieu de Zod

```typescript
// ❌ MAUVAIS - Validation manuelle
// server/charges/charges.controller.ts
export class ChargesController {
  async create(request: Request): Promise<NextResponse> {
    const body = await request.json();
    
    // ❌ Validation manuelle
    if (!body.label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }
    if (!["CHF", "EUR"].includes(body.currency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }
    
    // ...
  }
}

// ✅ BON - Validation avec Zod
// server/charges/charges.controller.ts
import { createChargeSchema } from "@mbongo/shared/schemas/charge";
import { parseBody } from "@/server/common/http";

export class ChargesController {
  async create(request: Request): Promise<NextResponse> {
    const input = await parseBody(request, createChargeSchema);
    return NextResponse.json(await this.service.create(input), { status: 201 });
  }
}
```

---

## 🛠️ Techniques de Refactoring (Next.js BFF)

### 1. Extraire la Validation dans des Schémas Zod

**Quand:** La validation est répétée ou complexe.

```typescript
// Avant
class ChargesController {
  async create(request: Request): Promise<NextResponse> {
    const body = await request.json();
    if (!body.label) throw new Error("Label required");
    if (!body.amount || body.amount <= 0) throw new Error("Amount must be positive");
    // ...
  }
}

// Après
// packages/shared/schemas/charge.ts
export const createChargeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.number().positive("Amount must be positive"),
  // ...
});

// server/charges/charges.controller.ts
import { createChargeSchema } from "@mbongo/shared/schemas/charge";
import { parseBody } from "@/server/common/http";

class ChargesController {
  async create(request: Request): Promise<NextResponse> {
    const input = await parseBody(request, createChargeSchema);
    return NextResponse.json(await this.service.create(input), { status: 201 });
  }
}
```

### 2. Extraire la Logique Métier dans packages/shared

**Quand:** La logique peut être testée sans serveur.

```typescript
// Avant
// server/charges/charge.service.ts
class ChargeService {
  async calculateRemainingBalance(chargeId: string): Promise<number> {
    const charge = await this.findOne(chargeId);
    const payments = await prisma.scheduledPayment.findMany({
      where: { chargeId, status: "PAID" },
    });
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    return charge.amount - paid;
  }
}

// Après
// packages/shared/domain/calculation.ts
export function remainingBalance(charge: Charge, payments: ScheduledPayment[]): number {
  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  return round2(charge.amount - paid);
}

// server/charges/charge.service.ts
import { remainingBalance } from "@mbongo/shared/domain/calculation";

class ChargeService {
  async calculateRemainingBalance(chargeId: string): Promise<number> {
    const charge = await this.findOne(chargeId);
    const payments = await prisma.scheduledPayment.findMany({
      where: { chargeId },
    });
    return remainingBalance(charge, payments);
  }
}
```

### 3. Extraire le Traducteur de Filtres

**Quand:** Les filtres sont utilisés dans plusieurs services.

```typescript
// Avant
// server/charges/charge.service.ts
class ChargeService {
  async findMany(query: any): Promise<Charge[]> {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.amount) where.amount = { gte: query.amount.min, lte: query.amount.max };
    // ...
    return prisma.charge.findMany({ where });
  }
}

// server/users/user.service.ts
class UserService {
  async findMany(query: any): Promise<User[]> {
    const where: any = {};
    if (query.name) where.name = { contains: query.name };
    if (query.email) where.email = query.email;
    // ... même pattern
    return prisma.user.findMany({ where });
  }
}

// Après
// packages/shared/lib/filter-to-where.ts
export function queryToWhere(query: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};
  for (const [field, filter] of Object.entries(query)) {
    if (["limit", "cursor"].includes(field)) continue;
    if (filter) where[field] = filterToCondition(filter);
  }
  return where;
}

function filterToCondition(filter: any): any {
  const condition: any = {};
  if (filter.eq !== undefined) condition.equals = filter.eq;
  if (filter.not !== undefined) condition.not = filter.not;
  if (filter.in !== undefined) condition.in = filter.in;
  if (filter.gte !== undefined) condition.gte = filter.gte;
  if (filter.lte !== undefined) condition.lte = filter.lte;
  if (filter.contains !== undefined) condition.contains = filter.contains;
  return condition;
}

// server/charges/charge.service.ts
import { queryToWhere } from "@mbongo/shared/lib/filter-to-where";

class ChargeService {
  async findMany(query: ChargeQuery): Promise<Charge[]> {
    return prisma.charge.findMany({
      where: queryToWhere(query),
      take: query.limit,
    });
  }
}
```

---

## 📊 Checklist Clean Code (Next.js BFF)

### Avant de Commiter

- [ ] **Nommage**: Tous les noms (variables, fonctions, classes) sont clairs et explicites
- [ ] **Fonctions**: Chaque fonction fait UNE seule chose et la fait bien
- [ ] **Taille**: Aucune fonction ne dépasse 20-30 lignes
- [ ] **Paramètres**: Aucune fonction n'a plus de 4 paramètres (utiliser des schémas Zod)
- [ ] **Classes**: Chaque classe a une seule responsabilité (SRP)
- [ ] **Duplication**: Aucune duplication de code (DRY)
- [ ] **Schémas Zod**: Tous les types sont définis dans packages/shared/schemas/
- [ ] **Commentaires**: Les commentaires expliquent le POURQUOI, pas le COMMENT
- [ ] **Tests**: Chaque fonction a des tests unitaires
- [ ] **Linting**: Le code passe ESLint sans erreurs
- [ ] **Typage**: Tous les types TypeScript sont corrects

### Avant une Code Review

- [ ] **Spec**: Le code respecte la spécification validée
- [ ] **Conventions**: Le code suit CONVENTIONS.md
- [ ] **Architecture**: L'architecture suit Next.js BFF (Services, Controllers, Schémas)
- [ ] **Validation**: Toutes les entrées sont validées avec Zod
- [ ] **Séparation des concerns**: Controllers = Validation + Délégation, Services = Logique
- [ ] **Documentation**: La documentation est à jour
- [ ] **Tests**: Tous les tests passent
- [ ] **Performance**: Pas de problèmes de performance évidents

---

## 🎯 Philosophies Complémentaires

### 1. Boy Scout Rule
> "Always leave the campground cleaner than you found it."

**Application:** Toujours améliorer le code que vous touchez, même si ce n'est pas le but principal de votre changement.

### 2. Principle of Least Astonishment
> "The code should behave in a way that minimizes surprise for the reader."

**Application:** Le code doit se comporter de manière prévisible et intuitive.

### 3. Fail Fast
> "Fail early, fail often, fail loudly."

**Application:** Détecter et signaler les erreurs le plus tôt possible.

```typescript
// ✅ BON - Fail Fast
function processCharge(charge: Charge | null): void {
  if (!charge) {
    throw new Error('Charge is required');
  }
  if (!charge.isActive) {
    throw new Error('Charge must be active');
  }
  // ... reste de la logique
}

// ❌ MAUVAIS - Fail Late
function processCharge(charge: Charge | null): void {
  // Beaucoup de logique...
  // Puis au milieu:
  if (!charge?.isActive) {
    return; // Échec silencieux!
  }
}
```

---

## 📚 Ressources Recommandées

### Livres
- [Clean Code: A Handbook of Agile Software Craftsmanship](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) - Robert C. Martin
- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/) - David Thomas & Andrew Hunt
- [Refactoring: Improving the Design of Existing Code](https://www.amazon.com/Refactoring-Improving-Design-Existing-Code/dp/0201485672) - Martin Fowler

### Sites Web
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
- [Clean Code Cheat Sheet](https://github.com/thoughtbot/guides/tree/main/style)
- [Refactoring Guru](https://refactoring.guru/)

### Outils
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Formatage
- [Prisma](https://www.prisma.io/) - ORM
- [Zod](https://zod.dev/) - Validation

---

**Version:** 2.0.0  
**Auteur:** Agent IA Expert Architect  
**Architecture:** Next.js BFF Fullstack + NestJS-like Style + KISS
**Dernière mise à jour:** 2024-11-05  
**Statut:** ✅ Opérationnelle
