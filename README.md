# mbongo - Projet Agent IA Expert Architect

> **🚀 Un projet configuré pour le développement piloté par les spécifications (SDD) avec Clean Code et Craftsmanship**

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vibe CLI](https://img.shields.io/badge/Vibe_CLI-Ready-8B5CF6?logo=mistralai&logoColor=white)](https://github.com/mistralai/vibe)

---

## 📋 Table des Matières

- [🎯 Mission & Vision](#-mission--vision)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
- [📁 Structure du Projet](#-structure-du-projet)
- [🛠️ Configuration](#-configuration)
- [🎯 Principes de Développement](#-principes-de-développement)
- [📝 Spécifications (SDD)](#-spécifications-sdd)
- [🔧 Développement](#-développement)
- [🧪 Testing](#-testing)
- [📊 Qualité du Code](#-qualité-du-code)
- [👥 Contribution](#-contribution)
- [📚 Documentation](#-documentation)
- [🎓 Ressources](#-ressources)

---

## 🎯 Mission & Vision

**mbongo** est un projet conçu pour être développé par un **Agent IA Expert Architecte** suivant les principes du **Spec-Driven Development (SDD)** et du **Clean Code Craftsmanship**.

### 🎯 Objectifs Principaux

1. **Spec-Driven Development**: AUCUN code n'est écrit sans une spécification détaillée et validée
2. **Clean Code**: Code lisible, maintenable et élégant
3. **Craftsmanship**: Qualité professionnelle et fierté du travail
4. **Minimalisme**: Ne faire QUE ce qui est nécessaire
5. **Pragmatisme**: Solutions simples et efficaces

### 🏆 Valeurs

- **Qualité > Vitesse**: On ne sacrifie pas la qualité pour aller plus vite
- **Transparence**: Tout est documenté et traçable
- **Collaboration**: Travail d'équipe et feedback constructif
- **Apprentissage Continu**: Amélioration constante des compétences

---

## 🚀 Démarrage Rapide

### 📥 Prérequis

- [Node.js](https://nodejs.org/) v18.0.0 ou supérieur
- [npm](https://www.npmjs.com/) v9.0.0 ou supérieur
- [Git](https://git-scm.com/) v2.0.0 ou supérieur
- [Vibe CLI](https://github.com/mistralai/vibe) (optionnel mais recommandé)

### 💻 Installation

```bash
# Cloner le dépôt (si pas déjà fait)
git clone https://github.com/votre-org/mbongo.git
cd mbongo

# Installer les dépendances
npm install

# Vérifier que tout est configuré correctement
npm run quality
```

### 🎯 Première Utilisation

1. **Lire la documentation:**
   ```bash
   # Lire AGENTS.md pour comprendre la configuration de l'agent
   cat AGENTS.md
   
   # Lire CONVENTIONS.md pour les conventions de développement
   cat CONVENTIONS.md
   ```

2. **Créer une spécification:**
   ```bash
   # Utiliser le template de spec
   cp skills/spec-driven-development/SPEC_TEMPLATE.md docs/specs/votre-feature/SPEC.md
   
   # Ou utiliser le script
   npm run vibe:spec:init votre-feature
   ```

3. **Valider la spec:**
   ```bash
   npm run vibe:spec:validate votre-feature
   ```

4. **Générer la todo list:**
   ```bash
   npm run vibe:todo:sync
   ```

5. **Commencer le développement:**
   ```bash
   npm run dev
   ```

---

## 📁 Structure du Projet

```
mbongo/
├── .vibe/                          # Configuration Vibe CLI
│   └── config/
│       └── settings.json           # Paramètres Vibe
├── docs/                           # Documentation
│   ├── specs/                      # Spécifications validées
│   │   ├── INDEX.md                # Index des specs
│   │   └── <feature>/              # Dossier par feature
│   │       ├── SPEC.md             # Spécification
│   │       ├── diagrams/           # Diagrammes
│   │       └── decisions.md        # Décisions techniques
│   └── api/                        # Documentation API (générée)
├── skills/                         # Skills Vibe
│   ├── spec-driven-development/   # Skill SDD
│   │   ├── SKILL.md                # Définition de la skill
│   │   ├── SPEC_TEMPLATE.md        # Template de spec
│   │   └── SPEC_INDEX_TEMPLATE.md  # Template d'index
│   └── clean-code/                 # Skill Clean Code
│       └── SKILL.md
├── src/                            # Code source
│   ├── core/                       # Logique métier
│   │   ├── domain/                 # Entités, Value Objects
│   │   ├── usecases/               # Cas d'utilisation
│   │   └── repositories/           # Accès aux données
│   ├── infrastructure/              # Couche technique
│   │   ├── api/                    # Appels API externes
│   │   ├── db/                     # Base de données
│   │   └── config/                 # Configuration
│   ├── interfaces/                 # Couche présentation
│   │   ├── cli/                    # Interface CLI
│   │   ├── web/                    # Interface Web
│   │   └── api/                    # API REST
│   └── shared/                     # Code partagé
│       ├── utils/                  # Fonctions utilitaires
│       ├── types/                  # Types TypeScript
│       └── constants/              # Constantes
├── tests/                          # Tests
│   ├── unit/                       # Tests unitaires
│   ├── integration/                # Tests d'intégration
│   └── e2e/                        # Tests end-to-end
├── .gitignore                      # Fichiers ignorés par git
├── .env.example                   # Exemple de variables d'environnement
├── .eslintrc.json                  # Configuration ESLint
├── .prettierrc                    # Configuration Prettier
├── AGENTS.md                       # Configuration de l'agent IA
├── CONVENTIONS.md                 # Conventions de développement
├── package.json                   # Dépendances et scripts
├── TODO.md                        # Todo list du projet
├── tsconfig.json                  # Configuration TypeScript
└── README.md                      # Ce fichier
```

---

## 🛠️ Configuration

### Configuration Vibe CLI

Le projet est configuré pour fonctionner avec [Vibe CLI](https://github.com/mistralai/vibe).

**Fichiers de configuration:**
- `.vibe/config/settings.json` - Paramètres principaux
- `AGENTS.md` - Configuration de l'agent
- `skills/` - Skills personnalisées

**Skills activées:**
1. **spec-driven-development**: Gestion des specs SDD
2. **clean-code**: Enforcement du clean code

### Configuration TypeScript

- **Target:** ES2022
- **Module:** NodeNext
- **Strict Mode:** Activé
- **Paths:** Alias `@/*` pour une importation propre

### Configuration ESLint & Prettier

- **ESLint:** Règles strictes pour TypeScript
- **Prettier:** Formatage automatique
- **Husky:** Git hooks pour lint-staged

### Variables d'Environnement

Créer un fichier `.env` à partir de `.env.example`:

```bash
cp .env.example .env
```

Variables typiques:
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mbongo
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=15m
```

---

## 🎯 Principes de Développement

### 📌 Règles Critiques (NE JAMAIS VIOLER)

1. **❌ PAS DE CODE SANS SPEC VALIDÉE**
   - Chaque feature doit avoir une spec dans `docs/specs/`
   - La spec doit être validée (status: VALIDATED) avant tout développement
   - Utiliser le template `SPEC_TEMPLATE.md`

2. **✅ TODO LIST TOUJOURS À JOUR**
   - Toute tâche doit être dans `TODO.md`
   - Mettre à jour le statut en temps réel

3. **✅ CLEAN CODE OBLIGATOIRE**
   - Suivre CONVENTIONS.md
   - Respecter SOLID, DRY, KISS, YAGNI
   - Max 30 lignes par fonction
   - Max 4 paramètres par fonction

4. **✅ TESTS OBLIGATOIRES**
   - Coverage minimum: 80%
   - Tests unitaires pour chaque fonction
   - Tests d'intégration pour les flux critiques

### 🎯 Workflow de Développement

```
1. ANALYSE
   ├─ Comprendre le besoin
   ├─ Identifier les acteurs
   └─ Définir le périmètre

2. SPECIFICATION
   ├─ Rédiger la spec (SPEC_TEMPLATE.md)
   ├─ Décrire les fonctionnalités
   ├─ Définir les interfaces
   └─ Spécifier les tests

3. VALIDATION
   ├─ Review avec le demandeur
   ├─ Clarifier les points ambigus
   └─ Obtenir l'approbation (✅ VALIDATED)

4. PLANIFICATION
   ├─ Découper en tâches (TODO.md)
   ├─ Estimer le temps
   └─ Définir les dépendances

5. DÉVELOPPEMENT
   ├─ Coder selon la spec
   ├─ Respecter les conventions
   └─ Mettre à jour la todo list

6. VÉRIFICATION
   ├─ Vérifier la conformité code/spec
   ├─ Exécuter les tests
   └─ Validation finale

7. DOCUMENTATION
   ├─ Mettre à jour la documentation
   └─ Archiver la spec validée
```

---

## 📝 Spécifications (SDD)

### Qu'est-ce que le SDD?

**Spec-Driven Development** est une méthodologie où:
1. **La spécification est écrite AVANT le code**
2. **La spec est la référence absolue**
3. **Le code doit se conformer à la spec**
4. **La spec inclut les tests attendus**

### Structure d'une Spec

Chaque spec suit le template `SPEC_TEMPLATE.md` et contient:

```markdown
# Métadonnées (ID, version, statut, etc.)

## Résumé Exécutif
- Description en une ligne
- Contexte et justification
- Objectifs et bénéfices

## Acteurs & Parties Prenantes
- Qui utilise cette feature?
- Qui sont les parties prenantes?

## Périmètre
- ✅ In Scope (ce qui est inclus)
- ❌ Out of Scope (ce qui est exclu)
- ⚠️ Assumptions (hypothèses)
- 🔄 Dependencies (dépendances)

## Architecture & Design
- Diagrammes (Mermaid)
- Composants impactés
- Interfaces et contrats
- Base de données (si applicable)

## Fonctionnalités Détailées
- Description de chaque feature
- Règles métier
- Flux principaux (sequence diagrams)
- Cas d'erreur
- Algorithmes (si applicable)

## Spécification des Tests
- Stratégie de test
- Cas de test (unit, integration, e2e)
- Coverage attendu

## Non-Fonctionnel (NFR)
- Performance
- Sécurité
- Scalabilité
- Fiabilité
- Maintenabilité

## Documentation
- Documentation technique
- Documentation utilisateur

## Planning & Livrables
- Milestones
- Livrables

## Risques & Mitigations
- Risques identifiés
- Plans de mitigation

## Approbation
- ✅ VALIDATED par le demandeur
```

### Commandes SDD

```bash
# Initialiser une nouvelle spec
npm run vibe:spec:init <nom-de-la-feature>

# Valider une spec
npm run vibe:spec:validate <nom-de-la-feature>

# Vérifier la conformité code/spec
npm run vibe:spec:check <nom-de-la-feature>

# Synchroniser la todo list avec les specs
npm run vibe:todo:sync
```

### Exemple de Spec

Voir `skills/spec-driven-development/SPEC_TEMPLATE.md` pour un exemple complet.

---

## 🔧 Développement

### Prérequis

- Node.js v18+
- npm v9+
- Git
- Base de données PostgreSQL (optionnelle)
- Redis (optionnel)

### Scripts Disponibles

```bash
# Développement
npm run dev              # Lancer en mode développement

# Build
npm run build            # Build pour production
npm run start            # Lancer en production

# Qualité du code
npm run lint             # Linting
npm run lint:fix         # Linting + auto-fix
npm run format           # Formatage
npm run format:check     # Vérifier le formatage
npm run typecheck        # Vérifier les types TypeScript
npm run quality          # Vérification complète
npm run quality:fix      # Correction complète

# Tests
npm run test             # Lancer tous les tests
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Tests avec couverture

# Documentation
npm run docs             # Générer la documentation API
npm run docs:serve       # Servir la documentation API

# Clean
npm run clean            # Nettoyer les fichiers build
```

### Structure d'un Module

```typescript
// src/core/domain/User.ts
import { type UserRole } from '@shared/types';

export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(
    public id: string,
    public email: string,
    public name: string,
    public role: UserRole = 'user',
    public isActive: boolean = true,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}
  
  static create(data: {
    id: string;
    email: string;
    name: string;
    role?: UserRole;
    isActive?: boolean;
  }): User {
    return new User(
      data.id,
      data.email,
      data.name,
      data.role ?? 'user',
      data.isActive ?? true,
    );
  }
}
```

### Exemple de Use Case

```typescript
// src/core/usecases/CreateUser.ts
import type { IUserRepository } from '@core/repositories';
import { type CreateUserDto, type User } from '@core/domain';

export class CreateUser {
  constructor(private readonly userRepository: IUserRepository) {}
  
  async execute(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const user = User.create({
      id: crypto.randomUUID(),
      email: dto.email,
      name: dto.name,
      role: dto.role,
    });
    
    return this.userRepository.save(user);
  }
}
```

### Exemple de Repository

```typescript
// src/core/repositories/IUserRepository.ts
import { type User, type CreateUserDto } from '@core/domain';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// src/infrastructure/db/UserRepository.ts
import type { IUserRepository } from '@core/repositories';
import { type User, type CreateUserDto } from '@core/domain';
import { db } from '@infrastructure/db';

export class PostgresUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );
    return result.rows[0] ?? null;
  }
  
  async save(user: User): Promise<User> {
    const result = await db.query(
      `INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        user.id,
        user.email,
        user.name,
        user.role,
        user.isActive,
        user.createdAt,
        user.updatedAt,
      ],
    );
    return result.rows[0];
  }
  
  async delete(id: string): Promise<void> {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
```

---

## 🧪 Testing

### Stratégie de Test

- **Unit Tests:** Tester chaque fonction en isolation
- **Integration Tests:** Tester l'interaction entre composants
- **E2E Tests:** Tester les flux utilisateurs complets

### Exemple de Test Unitaire

```typescript
// tests/unit/core/usecases/CreateUser.test.ts
import { CreateUser } from '@core/usecases';
import { type IUserRepository, type User } from '@core/repositories';
import { type CreateUserDto } from '@core/domain';

describe('CreateUser', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let createUser: CreateUser;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;

    createUser = new CreateUser(mockUserRepository);
  });

  describe('execute', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const dto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) =>
        Promise.resolve(user),
      );

      // Act
      const result = await createUser.execute(dto);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        dto.email,
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.email).toBe(dto.email);
      expect(result.name).toBe(dto.name);
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const dto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const existingUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Existing User',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(createUser.execute(dto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });
});
```

### Exemple de Test d'Intégration

```typescript
// tests/integration/userManagement.test.ts
import { UserService } from '@core/services';
import { PostgresUserRepository } from '@infrastructure/db';
import { db } from '@infrastructure/db';

describe('User Management Integration', () => {
  let userRepository: PostgresUserRepository;
  let userService: UserService;

  beforeAll(async () => {
    // Setup test database
    await db.migrate.latest();
    userRepository = new PostgresUserRepository(db);
    userService = new UserService(userRepository);
  });

  afterAll(async () => {
    await db.destroy();
  });

  afterEach(async () => {
    await db('users').truncate();
  });

  it('should create and retrieve a user', async () => {
    // Create
    const createdUser = await userService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    });

    // Retrieve
    const retrievedUser = await userService.getUserById(createdUser.id);

    expect(retrievedUser).toBeDefined();
    expect(retrievedUser?.email).toBe('test@example.com');
    expect(retrievedUser?.name).toBe('Test User');
  });
});
```

### Commandes de Test

```bash
# Lancer tous les tests
npm run test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Voir le rapport de couverture
npm run test:coverage:html
```

---

## 📊 Qualité du Code

### Métriques

- **Test Coverage:** Minimum 80% (objectif 100%)
- **Linting:** 0 erreurs, 0 warnings
- **TypeScript:** 0 erreurs de typage
- **Complexité Cyclomatique:** < 10 par fonction
- **Lignes de Code:** < 50 lignes par fonction (idéalement < 20)

### Outils

- **ESLint:** Linting TypeScript/JavaScript
- **Prettier:** Formatage automatique
- **TypeScript:** Vérification des types
- **Jest:** Testing
- **Husky:** Git hooks
- **lint-staged:** Linting sur les fichiers modifiés

### Vérification de la Qualité

```bash
# Vérification complète
npm run quality

# Vérification + correction
npm run quality:fix

# Vérification individuelle
npm run lint
npm run format:check
npm run typecheck
npm run test
```

### Configuration ESLint

Voir `.eslintrc.json` pour la configuration complète.

**Règles clés:**
- `no-explicit-any`: ❌ Interdit
- `explicit-function-return-type`: ✅ Obligatoire
- `no-unused-vars`: ✅ Avec ignore pattern pour `_`
- `prefer-nullish-coalescing`: ✅ Obligatoire
- `prefer-optional-chain`: ✅ Obligatoire

---

## 👥 Contribution

### 📝 Comment Contribuer

1. **Lire la documentation:**
   - AGENTS.md
   - CONVENTIONS.md
   - Ce fichier README.md

2. **Créer une spec:**
   - Utiliser SPEC_TEMPLATE.md
   - Faire valider la spec avant de coder

3. **Suivre le workflow:**
   - Coder selon la spec
   - Respecter les conventions
   - Mettre à jour la todo list

4. **Soumettre une PR:**
   - PR = Pull Request
   - Respecter Conventional Commits
   - Inclure une description claire
   - Lier à la spec correspondante

### 🎯 Conventional Commits

Utiliser [Conventional Commits](https://www.conventionalcommits.org/) pour les messages de commit:

```
feat: add user authentication
fix: correct email validation regex
docs: update README with setup instructions
refactor: extract user validation logic
chore: update dependencies
```

Format:
```
type(scope): subject

body (optionnel)

footer (optionnel)
```

Types:
- `feat`: Nouvelle feature
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Changements de style
- `refactor`: Refactoring
- `perf`: Amélioration de performance
- `test`: Tests
- `chore`: Tâches techniques

### 📋 Checklist avant PR

- [ ] La spec est validée (status: VALIDATED)
- [ ] La todo list est à jour
- [ ] Le code suit CONVENTIONS.md
- [ ] Tous les tests passent
- [ ] Le linting passe
- [ ] Le typage TypeScript est correct
- [ ] La documentation est à jour
- [ ] Les commits suivent Conventional Commits
- [ ] Le coverage est > 80%

---

## 📚 Documentation

### 📄 Documentation Principal

- [AGENTS.md](AGENTS.md) - Configuration de l'agent IA
- [CONVENTIONS.md](CONVENTIONS.md) - Conventions de développement
- [TODO.md](TODO.md) - Todo list du projet

### 📁 Documentation Technique

- [docs/specs/](docs/specs/) - Toutes les specs validées
- [docs/api/](docs/api/) - Documentation API (générée automatiquement)

### 🎓 Guides

- [Guide de Contribution](CONTRIBUTING.md) (à créer)
- [Guide de Déploiement](DEPLOYMENT.md) (à créer)
- [Guide de Configuration](CONFIGURATION.md) (à créer)

---

## 🎓 Ressources

### 📚 Livres Recommandés

- [Clean Code: A Handbook of Agile Software Craftsmanship](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) - Robert C. Martin
- [The Clean Coder: A Code of Conduct for Professional Programmers](https://www.amazon.com/Clean-Coder-Conduct-Professional-Programmers/dp/0137081073) - Robert C. Martin
- [Refactoring: Improving the Design of Existing Code](https://www.amazon.com/Refactoring-Improving-Design-Existing-Code/dp/0201485672) - Martin Fowler
- [Domain-Driven Design: Tackling Complexity in the Heart of Software](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215) - Eric Evans
- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Example-Kent-Beck/dp/0321146530) - Kent Beck
- [Specification by Example](https://www.amazon.com/Specification-Example-Gojko-Adzic/dp/1617290084) - Gojko Adzic

### 🌐 Sites Web

- [Kiro.dev - Spec-Driven Development](https://kiro.dev)
- [Google Agent Skills](https://developers.google.com/agent-skills)
- [Martin Fowler's Blog](https://martinfowler.com/)
- [Refactoring Guru](https://refactoring.guru/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)

### 🛠️ Outils

- [Vibe CLI](https://github.com/mistralai/vibe) - CLI pour agents IA
- [TypeScript](https://www.typescriptlang.org/) - Typage fort
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Formatage
- [Jest](https://jestjs.io/) - Testing
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [SonarQube](https://www.sonarqube.org/) - Analyse de code (optionnel)

---

## 📞 Support

- **Problèmes techniques:** Ouvrir une issue GitHub
- **Questions sur le code:** Vérifier AGENTS.md et CONVENTIONS.md
- **Questions sur le SDD:** Lire skills/spec-driven-development/SKILL.md

---

## 🎯 Prochaines Étapes

1. **Finaliser la configuration:**
   - [ ] Créer .gitignore
   - [ ] Créer .env.example
   - [ ] Initialiser git
   - [ ] Faire le premier commit

2. **Créer les premières specs:**
   - [ ] SPEC-001: Gestion des Utilisateurs
   - [ ] SPEC-002: Authentification
   - [ ] SPEC-003: Gestion des Commandes

3. **Commencer le développement:**
   - [ ] Implémenter UserRepository
   - [ ] Implémenter UserService
   - [ ] Implémenter les tests

---

## 📜 Licence

Ce projet est sous licence [MIT](LICENSE).

---

## 🙏 Remerciements

- [Mistral AI](https://mistral.ai/) pour Vibe CLI
- [Robert C. Martin](https://cleancoder.com/) pour Clean Code
- [Martin Fowler](https://martinfowler.com/) pour les patterns de refactoring
- [Kiro.dev](https://kiro.dev) pour l'inspiration SDD

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2024-11-05  
**Auteur:** Agent IA Expert Architect  
**Statut:** ✅ Configuration complète, prêt pour le développement
