# SKILL.md - Spec-Driven Development (SDD) for Next.js BFF

## 🎯 Description

**Skill de Specification-Driven Development** - Une approche systématique pour développer des applications **Next.js BFF Fullstack** à partir de spécifications détaillées et validées.

**Philosophie:** KISS (Keep It Simple, Stupid) - Architecture simple, directe, lisible.

Inspiré par:
- [Kiro.dev](https://kiro.dev) - Spec-Driven Development Framework
- **NestJS Architecture** (mais sans le framework)
- **Next.js Best Practices**
- Test-Driven Development (TDD)

## 📌 Capabilités

Cette skill permet à l'Agent IA de:

1. **Créer des spécifications détaillées** avant tout développement
2. **Valider les specs** avec le demandeur
3. **Générer une todo list** à partir de la spec
4. **Développer en suivant** strictement la spec
5. **Vérifier la conformité** du code par rapport à la spec
6. **Documenter automatiquement** à partir de la spec
7. **Respecter l'architecture Next.js BFF** (Services, Controllers, Schémas Zod)

## 🚀 Activation

Cette skill s'active automatiquement quand:
- Un utilisateur demande une nouvelle feature
- Un utilisateur dit "créer une spec"
- Un utilisateur mentionne "spécification"
- Un projet Next.js est initialisé sans spec existante

## 📋 Workflow SDD (Next.js BFF Edition)

```
┌─────────────────────────────────────────────────────────────┐
│              SPEC-DRIVEN DEVELOPMENT - NEXT.JS BFF            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CAPTURE DES BESOINS                                     │
│     ├─ Comprendre le besoin utilisateur                     │
│     ├─ Identifier les acteurs                               │
│     └─ Définir le périmètre (In/Out of Scope)               │
│                                                             │
│  2. ANALYSE TECHNIQUE (Next.js BFF)                         │
│     ├─ Définir les schémas Zod (packages/shared/schemas)   │
│     ├─ Identifier les endpoints API                         │
│     ├─ Définir les services nécessaires                    │
│     └─ Analyser les contraintes techniques                  │
│                                                             │
│  3. RÉDACTION DE LA SPEC                                    │
│     ├─ Utiliser le template SPEC_TEMPLATE.md                │
│     ├─ Décrire les schémas Zod                              │
│     ├─ Définir les endpoints API                            │
│     └─ Spécifier les tests attendus                         │
│                                                             │
│  4. VALIDATION                                              │
│     ├─ Review de la spec avec le demandeur                 │
│     ├─ Clarification des points ambigus                    │
│     └─ Approbation formelle (✅ VALIDÉ)                     │
│                                                             │
│  5. PLANIFICATION                                           │
│     ├─ Découper en tâches (todo list)                      │
│     └─ Définir les dépendances entre tâches                │
│                                                             │
│  6. DÉVELOPPEMENT (Next.js BFF)                            │
│     ├─ Créer les schémas Zod (packages/shared/schemas)      │
│     ├─ Implémenter les services (server/<module>.service.ts)│
│     ├─ Créer les controllers (server/<module>.controller.ts)│
│     ├─ Créer les routes API (app/api/<module>/route.ts)      │
│     └─ Créer les pages RSC si nécessaire                     │
│                                                             │
│  7. VÉRIFICATION                                            │
│     ├─ Vérifier chaque point de la spec                    │
│     ├─ Exécuter les tests définis dans la spec              │
│     └─ Validation finale avec le demandeur                 │
│                                                             │
│  8. DOCUMENTATION                                           │
│     └─ Mettre à jour la documentation                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Template de Spécification

Voir `SPEC_TEMPLATE.md` dans ce dossier (adapté pour Next.js BFF).

## 🎛️ Commandes & Triggers

### Commandes Vibe

```
/vibe spec:init <nom>          # Initialiser une nouvelle spec
/vibe spec:validate <nom>      # Valider une spec
/vibe spec:generate-todo <nom> # Générer une todo list depuis une spec
/vibe spec:check <nom>         # Vérifier la conformité du code vs spec
```

### Triggers Automatiques

L'agent DEVRA:
- ❌ **Refuser de coder** si aucune spec validée n'existe
- ❌ **Bloquer la demande** avec le message: "⚠️ PAS DE CODE SANS SPEC VALIDÉE"
- ✅ **Proposer de créer une spec** si un besoin est identifié
- ✅ **Vérifier automatiquement** la conformité du code avec la spec existante

### Exemples de Triggers

**Utilisateur:**
> "J'ai besoin d'un système de gestion des charges"

**Agent (réponse automatique):**
```
⚠️ PAS DE CODE SANS SPEC VALIDÉE

Pour ce besoin, nous allons créer une architecture Next.js BFF:
1. Schémas Zod dans packages/shared/schemas/charge.ts
2. Service dans server/charges/charge.service.ts
3. Controller dans server/charges/charges.controller.ts
4. Routes API dans app/api/charges/

Je propose: /vibe spec:init charge-management
```

## 📊 Structure d'une Spec (Next.js BFF)

```
specs/
├── charge-management/          # Dossier de la spec
│   ├── SPEC.md                  # Spécification principale
│   ├── schemas/                # Exemples de schémas Zod
│   │   └── charge.ts           # Exemple de schéma
│   ├── diagrams/               # Diagrammes
│   │   └── architecture.mmd    # Diagramme d'architecture
│   └── decisions.md            # Décisions techniques
```

## ✅ Critères de Validation d'une Spec

Pour qu'une spec soit considérée comme **VALIDÉE**, elle doit:

- [ ] **Complétude**: Tous les aspects du besoin sont couverts
- [ ] **Schéma Zod**: Tous les schémas Zod sont définis
- [ ] **Endpoints API**: Tous les endpoints sont spécifiés
- [ ] **Précision**: Aucune ambiguïté dans les descriptions
- [ ] **Testabilité**: Chaque fonctionnalité a des critères de test clairs
- [ ] **Cohérence**: Pas de contradictions internes
- [ ] **Approbation**: Signée par le demandeur (✅ dans le fichier)
- [ ] **Estimation**: Temps estimé pour chaque tâche
- [ ] **Priorisation**: Priorité de chaque tâche définie

## 🛠️ Outils Intégrés

### 1. Générateur de Code (Next.js BFF)

Transforme une spec en structure de code Next.js:

**Input:** SPEC.md avec description des endpoints
**Output:** 
- `packages/shared/schemas/<module>.ts` (schémas Zod)
- `server/<module>/<module>.service.ts` (service)
- `server/<module>/<module>s.controller.ts` (controller)
- `app/api/<module>/route.ts` (routes API)
- `tests/` (tests unitaires)

### 2. Vérificateur de Conformité

Compare le code produit avec la spec:
- Vérifie que toutes les méthodes de service spécifiées existent
- Vérifie que les schémas Zod sont complets
- Vérifie que les endpoints API sont implémentés
- Vérifie que les tests spécifiés sont implémentés

### 3. Générateur de Diagrammes

Génère automatiquement des diagrammes Mermaid à partir de la spec:
- Diagrammes d'architecture Next.js BFF
- Diagrammes de séquence pour les flux API
- Diagrammes de classes (simplifiés)

## 📁 Architecture Cible (Next.js BFF)

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS BFF ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────┐ │
│  │   Client        │───▶│   API Routes    │───▶│  Server  │ │
│  │   (React)       │    │   (Transport)   │    │ (Backend)│ │
│  └─────────────────┘    └─────────────────┘    └─────────┘ │
│                       │                                  │      │
│                       ▼                                  ▼      │
│              ┌─────────────────────────────────────┐        │
│              │       packages/shared               │        │
│              │  ┌──────────┐   ┌──────────┐       │        │
│              │  │ Schemas  │   │  Domain  │       │        │
│              │  │ (Zod)    │   │ (Pure)   │       │        │
│              │  └──────────┘   └──────────┘       │        │
│              └─────────────────────────────────────┘        │
│                                                             │
│  Server Layer:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  services/     controllers/    db/                  │   │
│  │  charge.svc ──▶ charges.ctrl ────▶ prisma            │   │
│  │  user.svc    ──▶ users.ctrl   ────▶ db.ts           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Bonnes Pratiques SDD pour Next.js BFF

### 1. **Un Schéma Zod par Modèle**

```typescript
// packages/shared/schemas/charge.ts
import { z } from "zod";

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

export const chargeTypeSchema = z.enum(["FIXED_RECURRING", "INSTALLMENT", "TEMPORARY", "ONE_OFF"]);

export const chargeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  type: chargeTypeSchema,
  amount: z.number().positive(),
  // ...
});

export const createChargeSchema = chargeSchema.omit({ id: true });
export const updateChargeSchema = createChargeSchema.partial();

export type Charge = z.infer<typeof chargeSchema>;
export type CreateChargeInput = z.infer<typeof createChargeSchema>;
export type UpdateChargeInput = z.infer<typeof updateChargeSchema>;
```

### 2. **Service avec Méthodes CRUD Standards**

```typescript
// server/charges/charge.service.ts
import { prisma } from "@/server/db";
import { ChargeQuery, CreateChargeInput, UpdateChargeInput } from "@mbongo/shared";

export class ChargeService {
  async findMany(query: ChargeQuery): Promise<Charge[]> {}
  async findOne(id: string): Promise<Charge | null> {}
  async create(input: CreateChargeInput): Promise<Charge> {}
  async update(id: string, input: UpdateChargeInput): Promise<Charge> {}
  async remove(id: string): Promise<void> {}
}
```

### 3. **Controller avec Validation Zod**

```typescript
// server/charges/charges.controller.ts
import { NextResponse } from "next/server";
import { chargeQuerySchema, createChargeSchema } from "@mbongo/shared";
import { parseBody, parseQuery, toErrorResponse } from "@/server/common/http";

export class ChargesController {
  constructor(private readonly charges: ChargeService) {}

  async find(request: Request): Promise<NextResponse> {
    const query = parseQuery(request, chargeQuerySchema);
    return NextResponse.json(await this.charges.findMany(query));
  }

  async create(request: Request): Promise<NextResponse> {
    const input = await parseBody(request, createChargeSchema);
    return NextResponse.json(await this.charges.create(input), { status: 201 });
  }
}
```

### 4. **Routes API Minimales**

```typescript
// app/api/charges/route.ts
import { chargesController } from "@/server/charges/charges.controller";

export const GET = (request: Request) => chargesController.find(request);
export const POST = (request: Request) => chargesController.create(request);
```

### 5. **Prisma Service Singleton**

```typescript
// server/db.ts
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
```

## 🚫 Anti-Patterns à Éviter

### ❌ Spec Trop Complexe

```markdown
# Gestion des Charges

Il faut gérer les charges avec DDD, hexagonal architecture...
```

**Problème:** Trop complexe pour Next.js BFF.

**Correction:**
```markdown
# Gestion des Charges

## Architecture
- Schémas Zod dans packages/shared/schemas/charge.ts
- Service dans server/charges/charge.service.ts
- Controller dans server/charges/charges.controller.ts
- Routes API dans app/api/charges/
```

### ❌ Sur-Ingénierie

```typescript
// ❌ MAUVAIS - Trop complexe
class ChargeFactory {
  static create(...): Charge {}
}

class ChargeRepository {
  // Abstraction inutile
}

class ChargeUseCase {
  // Couche supplémentaire inutile
}
```

**Correction:**
```typescript
// ✅ BON - Simple et direct
class ChargeService {
  async create(input: CreateChargeInput): Promise<Charge> {
    return prisma.charge.create({ data: input });
  }
}
```

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
- [Kiro.dev - Spec-Driven Development](https://kiro.dev)

## 🔧 Intégration avec Vibe CLI

Cette skill s'intègre avec:
- Le système de todo list de Vibe
- Le système de skills de Vibe
- Le système de permissions de Vibe

### Configuration Recommandée

```yaml
# .vibe/config/settings.yaml
skills:
  spec-driven-development:
    enabled: true
    auto-activate: true
    strict-mode: true
    architecture: "nextjs-bff"
```

---

**Version:** 2.0.0  
**Auteur:** Agent IA Expert Architect  
**Architecture:** Next.js BFF Fullstack + NestJS-like Style + KISS
**Dernière mise à jour:** 2024-11-05  
**Statut:** ✅ Opérationnelle
