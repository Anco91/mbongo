# CONVENTIONS.md - Conventions de Développement

## 📜 Philosophies Fondamentales

### 1. Clean Code Principles

> "Clean code is code that looks like it was written by someone who cares." - Robert C. Martin

**Règles d'or:**
- Le code doit être **lisible** comme de la prose
- Chaque fonction doit faire **une seule chose**
- Les noms doivent être **explicites et intentionnels**
- La complexité doit être **minimale**

### 2. Pragmatisme

- **YAGNI**: You Aren't Gonna Need It - Ne pas implémenter des features "au cas où"
- **KISS**: Keep It Simple, Stupid - La solution la plus simple est souvent la meilleure
- **DTSTTCPW**: Do The Simplest Thing That Could Possibly Work

### 3. Craftsmanship

- **Qualité > Vitesse**: On ne sacrifie pas la qualité pour aller plus vite
- **Pride in Work**: On est fier de son code et on le signe (métaphoriquement)
- **Continuous Improvement**: On améliore constamment ses compétences

---

## 📁 Structure des Fichiers

### Organisation des Dossiers

```
src/
├── core/            # Logique métier principale
│   ├── domain/      # Entités, Value Objects
│   ├── usecases/    # Cas d'utilisation
│   └── repositories/# Accès aux données
├── infrastructure/  # Couche technique
│   ├── api/         # Appels API externes
│   ├── db/          # Base de données
│   └── config/      # Configuration
├── interfaces/      # Couche présentation
│   ├── cli/         # Interface CLI
│   ├── web/         # Interface Web
│   └── api/         # API REST/GraphQL
└── shared/          # Code partagé
    ├── utils/       # Fonctions utilitaires
    ├── types/       # Types TypeScript
    └── constants/   # Constantes
```

### Nommage des Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Composant | PascalCase | `UserRepository.ts` |
| Utilitaire | camelCase | `dateUtils.ts` |
| Type/Interface | PascalCase | `User.ts`, `IUserService.ts` |
| Enum | PascalCase | `UserRole.ts` |
| Constante | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| Test | `<file>.test.ts` | `userService.test.ts` |
| Spec | `<file>.spec.ts` | `userService.spec.ts` |

---

## 💻 Conventions de Code

### TypeScript

#### Typage

```typescript
// ✅ BON
const age: number = 25;
const isActive: boolean = true;
const users: User[] = [];

// ❌ MAUVAIS
const age = 25; // any implicite
const isActive: any = true; // any explicite
const users = []; // any[]
```

#### Interfaces vs Types

- **Interface**: Pour les objets et contrats
- **Type**: Pour les unions, tuples, mapped types

```typescript
// ✅ BON
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

type ApiResponse<T> = {
  data: T;
  error?: string;
};

// ❌ MAUVAIS
interface UserRole = 'admin' | 'user'; // Type serait mieux
interface ApiResponse { // Interface générique difficile
  data: any;
}
```

#### Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Variable | camelCase | `userName`, `isValid` |
| Constante | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Fonction | camelCase | `getUser()`, `validateInput()` |
| Classe | PascalCase | `UserService`, `DatabaseConnection` |
| Interface | PascalCase | `IUserRepository`, `User` |
| Méthode | camelCase | `save()`, `findById()` |
| Propriété | camelCase | `this.userName` |
| Paramètre | camelCase | `function greet(userName: string)` |
| Enum | PascalCase | `UserRole.ADMIN` |
| Générique | T, U, V, K, V | `T`, `K extends keyof T` |

#### Fonctions

```typescript
// ✅ BON
// Noms de fonctions commencent par un verbe
function getUser(id: string): User | null {}
function createUser(data: CreateUserDto): User {}
function validateEmail(email: string): boolean {}

// Noms descriptifs
function calculateTotalPrice(items: CartItem[]): number {}
function formatDateForDisplay(date: Date): string {}

// ❌ MAUVAIS
function user(id: string) {} // Pas de verbe
function handle() {} // Pas descriptif
function processData(data: any) {} // Trop vague
```

#### Classes

```typescript
// ✅ BON
class UserService {
  // Une responsabilité claire
  async findById(id: string): Promise<User | null> {}
  async create(data: CreateUserDto): Promise<User> {}
  async update(id: string, data: UpdateUserDto): Promise<User> {}
  async delete(id: string): Promise<void> {}
}

// ❌ MAUVAIS
class UserManager { // "Manager" est trop vague
  // Trop de responsabilités
  async findById(id: string) {}
  async create(data: any) {}
  async sendEmail(user: User) {} // Pas lié à la gestion utilisateur
  async logActivity(user: User) {} // Pas lié
}
```

### SOLID Principles

#### S - Single Responsibility Principle

```typescript
// ✅ BON - Une classe, une responsabilité
class UserRepository {
  async findById(id: string): Promise<User | null> {}
  async findByEmail(email: string): Promise<User | null> {}
  async save(user: User): Promise<User> {}
}

class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> {}
  async sendPasswordResetEmail(user: User): Promise<void> {}
}

// ❌ MAUVAIS - Plusieurs responsabilités
class UserManager {
  async findById(id: string) {}
  async save(user: User) {}
  async sendEmail(user: User) {}
  async validate(user: User) {}
}
```

#### O - Open/Closed Principle

```typescript
// ✅ BON - Ouvert à l'extension, fermé à la modification
interface DiscountStrategy {
  calculate(amount: number): number;
}

class PercentageDiscount implements DiscountStrategy {
  constructor(private readonly percentage: number) {}
  calculate(amount: number): number {
    return amount * (1 - this.percentage / 100);
  }
}

class FixedAmountDiscount implements DiscountStrategy {
  constructor(private readonly amount: number) {}
  calculate(total: number): number {
    return Math.max(0, total - this.amount);
  }
}

// ❌ MAUVAIS - Modification nécessaire pour ajouter un type
class Discount {
  type: 'percentage' | 'fixed';
  value: number;
  
  calculate(amount: number): number {
    if (this.type === 'percentage') {
      return amount * (1 - this.value / 100);
    } else {
      return Math.max(0, amount - this.value);
    }
  }
}
```

#### L - Liskov Substitution Principle

```typescript
// ✅ BON - Les sous-classes respectent le contrat
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
  
  setHeight(height: number): void {
    this.height = height;
    this.width = height; // Modifie aussi la largeur!
  }
}
```

#### I - Interface Segregation Principle

```typescript
// ✅ BON - Interfaces petites et spécifiques
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

interface IEmailService {
  sendWelcomeEmail(user: User): Promise<void>;
  sendPasswordResetEmail(user: User): Promise<void>;
}

// ❌ MAUVAIS - Interface trop grosse
interface IUserService {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  sendWelcomeEmail(user: User): Promise<void>;
  sendPasswordResetEmail(user: User): Promise<void>;
  validateEmail(email: string): boolean;
  hashPassword(password: string): string;
}
```

#### D - Dependency Inversion Principle

```typescript
// ✅ BON - Dépendre d'abstractions, pas de concretions
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

class UserService {
  constructor(private readonly userRepository: IUserRepository) {}
  
  async register(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findById(userData.id);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const user = new User(userData);
    return this.userRepository.save(user);
  }
}

// ❌ MAUVAIS - Dépendance concrète
class UserService {
  constructor(private readonly db: MongoDB) {} // Dépend de MongoDB!
  
  async register(userData: CreateUserDto) {
    const existingUser = await this.db.collection('users').findOne({ id: userData.id });
    // ...
  }
}
```

---

## 🔍 Qualités de Code

### DRY (Don't Repeat Yourself)

```typescript
// ✅ BON
function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ❌ MAUVAIS - Duplication
function formatEuro(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDollar(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
```

### Fonctions Pures

Privilégier les fonctions pures (même entrée = même sortie, pas d'effets de bord):

```typescript
// ✅ BON - Fonction pure
function calculateDiscount(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100);
}

// ❌ MAUVAIS - Effets de bord
let totalDiscount = 0;

function applyDiscount(price: number, discountPercentage: number): number {
  totalDiscount += price * (discountPercentage / 100);
  return price * (1 - discountPercentage / 100);
}
```

### Immutabilité

```typescript
// ✅ BON - Immutabilité
const updatedUser = {
  ...user,
  name: newName,
};

const filteredUsers = users.filter(u => u.isActive);

// ❌ MAUVAIS - Mutation
user.name = newName;
users.splice(0, 1);
```

---

## 📝 Documentation

### Commentaires

**Règle:** Les commentaires expliquent le **POURQUOI**, pas le **COMMENT**.

```typescript
// ✅ BON - Pourquoi ce code existe
// NOTE: On vérifie manuellement l'email car la lib de validation
// ne gère pas les domaines internationaux correctement
if (!this.isValidInternationalEmail(email)) {
  throw new Error('Invalid email format');
}

// ❌ MAUVAIS - Comment fait le code (évident)
// Cette fonction prend un email et retourne vrai si c'est valide
function isValidEmail(email: string): boolean {
  // ...
}

// ❌ MAUVAIS - Commentaires inutiles
// Initialisation de la variable
const count = 0;

// Incrémentation
count++;
```

### JSDoc / TSDoc

```typescript
// ✅ BON
/**
 * Calcule le prix total d'un panier avec les taxes
 * 
 * @param items - Liste des articles dans le panier
 * @param taxRate - Taux de taxe en pourcentage (ex: 20 pour 20%)
 * @returns Le prix total TTC arrondi à 2 décimales
 * 
 * @example
 * ```typescript
 * const total = calculateTotal([{ price: 100 }, { price: 50 }], 20);
 * // total = 180 (100 + 50 + 30 de taxes)
 * ```
 */
function calculateTotal(items: CartItem[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxes = subtotal * (taxRate / 100);
  return Math.round((subtotal + taxes) * 100) / 100;
}
```

---

## 🧪 Testing

### Stratégie de Test

- **Unit Tests**: Tester chaque fonction en isolation
- **Integration Tests**: Tester l'interaction entre composants
- **E2E Tests**: Tester les flux utilisateurs complets

### AA (Arrange-Act-Assert)

```typescript
// ✅ BON
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      // Arrange
      const mockRepository = {
        findByEmail: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockImplementation(u => Promise.resolve(u)),
      };
      const service = new UserService(mockRepository);
      const userData = { email: 'test@example.com', name: 'Test' };
      
      // Act
      const result = await service.createUser(userData);
      
      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.email).toBe('test@example.com');
    });
  });
});
```

### Nommage des Tests

```typescript
// ✅ BON
describe('UserRepository', () => {
  describe('findById', () => {
    it('should return user when found');
    it('should return null when not found');
    it('should throw error when database fails');
  });
});

// ❌ MAUVAIS
it('test user find');
it('should work');
```

---

## 📦 Git & Versioning

### Commit Messages

Utiliser [Conventional Commits](https://www.conventionalcommits.org/):

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
- `style`: Changements de style (formatage, etc.)
- `refactor`: Refactoring de code
- `perf`: Amélioration de performance
- `test`: Ajout de tests
- `chore`: Changements de configuration, dépendances, etc.

### Branches

```
main/master    # Production
release/*      # Release en préparation
develop        # Développement principal
feature/*      # Nouvelle feature
fix/*          # Correction de bug
refactor/*     # Refactoring
chore/*        # Tâches techniques
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

### Feedback Constructif

**✅ BON:**
- "Je suggérerais d'extraire cette logique dans une fonction séparée pour améliorer la lisibilité"
- "As-tu considéré l'impact sur les performances avec de grandes listes?"
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
- **Husky**: Git hooks (lint-staged)
- **SonarQube**: Analyse de code (optionnel)

### Configuration Recommandée

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "prettier/prettier": "error"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

---

## 🎯 Bonnes Pratiques Additionnelles

### 1. Early Returns

```typescript
// ✅ BON
function processUser(user: User | null): void {
  if (!user) return;
  if (!user.isActive) return;
  
  // Logique principale
}

// ❌ MAUVAIS
function processUser(user: User | null): void {
  if (user) {
    if (user.isActive) {
      // Logique principale
    }
  }
}
```

### 2. Guard Clauses

```typescript
// ✅ BON
function calculateOrderTotal(order: Order): number {
  if (!order || !order.items || order.items.length === 0) {
    throw new Error('Invalid order');
  }
  
  // ...
}
```

### 3. Optional Chaining & Nullish Coalescing

```typescript
// ✅ BON
const userName = user?.profile?.name ?? 'Anonymous';
const email = user?.email ?? defaultEmail;

// ❌ MAUVAIS
const userName = user && user.profile && user.profile.name ? user.profile.name : 'Anonymous';
```

### 4. Destructuring

```typescript
// ✅ BON
const { name, email, profile: { avatar } } = user;
const [first, second, ...rest] = items;

// ❌ MAUVAIS
const name = user.name;
const email = user.email;
const avatar = user.profile.avatar;
```

---

**Règle Ultime:**
> "Leave the code better than you found it."

---

*Dernière mise à jour: 2024-11-05*  
*Version: 1.0.0*  
*Statut: ✅ Applicable immédiatement*
