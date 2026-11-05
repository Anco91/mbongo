# SKILL.md - Clean Code Craftsmanship

## 🎯 Description

**Skill de Clean Code et Craftsmanship** - Une approche rigoureuse pour produire du code de haute qualité, maintenable et élégant.

> "Clean code is not written by following a set of rules. You don’t become a software craftsman by learning a list of heuristics. Professionalism and craftsmanship come from values that drive discipline." - Robert C. Martin

## 📌 Capabilités

Cette skill permet à l'Agent IA de:

1. **Appliquer les principes SOLID** systématiquement
2. **Écrire du code auto-documenté** avec des noms explicites
3. **Respecter les conventions** définies dans CONVENTIONS.md
4. **Détecter et corriger** les code smells
5. **Refactorer** du code existant de manière sûre
6. **Reviewer du code** avec un œil critique
7. **Optimiser** pour la lisibilité et la maintenabilité

## 🚀 Activation

Cette skill s'active automatiquement quand:
- Un fichier de code est modifié
- Une review de code est demandée
- Le mot "refactor" est mentionné
- Du code "spaghetti" est détecté
- Une violation des conventions est identifiée

## 🏆 Principes Fondamentaux

### 1. SOLID Principles

#### S - Single Responsibility Principle (SRP)
> "A class should have only one reason to change."

**Exemple:**
```typescript
// ✅ BON - Une classe, une responsabilité
class UserRepository {
  async findById(id: string): Promise<User | null> {}
  async save(user: User): Promise<User> {}
}

class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> {}
}

// ❌ MAUVAIS - Plusieurs responsabilités
class UserManager {
  async findById(id: string) {}
  async save(user: User) {}
  async sendEmail(user: User) {} // Pas la responsabilité de UserManager
}
```

#### O - Open/Closed Principle (OCP)
> "Software entities should be open for extension, but closed for modification."

**Exemple:**
```typescript
// ✅ BON - Ouvert à l'extension
interface DiscountStrategy {
  calculate(price: number): number;
}

class PercentageDiscount implements DiscountStrategy {
  constructor(private readonly percentage: number) {}
  calculate(price: number): number {
    return price * (1 - this.percentage / 100);
  }
}

// On peut ajouter de nouvelles stratégies sans modifier le code existant
class FixedDiscount implements DiscountStrategy {
  constructor(private readonly amount: number) {}
  calculate(price: number): number {
    return Math.max(0, price - this.amount);
  }
}

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

#### L - Liskov Substitution Principle (LSP)
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
  
  setHeight(height: number): void {
    this.height = height;
    this.width = height; // Modifie aussi la largeur!
  }
  
  // Si on a un Rectangle, on ne peut pas le remplacer par un Square
  // sans casser la logique existante
}
```

#### I - Interface Segregation Principle (ISP)
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
  // Pas besoin d'implémenter write()
}

// ❌ MAUVAIS - Interface trop grosse
interface IFile {
  read(): string;
  write(data: string): void;
  delete(): void;
  rename(newName: string): void;
  // ... beaucoup d'autres méthodes
}

class SimpleFile implements IFile {
  // Doit implémenter toutes les méthodes, même celles qui ne sont pas nécessaires
  read(): string { /* ... */ }
  write(data: string): void { /* ... */ }
  delete(): void { throw new Error('Not implemented'); }
  rename(newName: string): void { throw new Error('Not implemented'); }
}
```

#### D - Dependency Inversion Principle (DIP)
> "High-level modules should not depend on low-level modules. Both should depend on abstractions."

**Exemple:**
```typescript
// ✅ BON - Dépendre d'abstractions
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

// On peut utiliser n'importe quelle implémentation
class MongoUserRepository implements IUserRepository { /* ... */ }
class PostgresUserRepository implements IUserRepository { /* ... */ }

// ❌ MAUVAIS - Dépendance concrète
class UserService {
  constructor(private readonly db: MongoDB) {}
  
  async register(userData: CreateUserDto) {
    // Dépend directement de MongoDB
    const existingUser = await this.db.collection('users').findOne({ id: userData.id });
    // ...
  }
}
```

### 2. DRY, KISS, YAGNI

#### DRY - Don't Repeat Yourself
> "Every piece of knowledge must have a single, unambiguous, authoritative representation within a system."

**Exemple:**
```typescript
// ✅ BON - Pas de duplication
function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Utilisation
console.log(formatCurrency(100)); // 100,00 €
console.log(formatCurrency(100, 'USD')); // $100.00

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

#### KISS - Keep It Simple, Stupid
> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

**Exemple:**
```typescript
// ✅ BON - Simple et clair
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

#### YAGNI - You Aren't Gonna Need It
> "Don't add functionality until it's necessary."

**Exemple:**
```typescript
// ✅ BON - On implémente seulement ce qui est nécessaire
class User {
  constructor(
    public id: string,
    public email: string,
    public name: string,
  ) {}
}

// ❌ MAUVAIS - On implémente "au cas où"
class User {
  constructor(
    public id: string,
    public email: string,
    public name: string,
    public age?: number, // Pas utilisé maintenant, mais "peut-être un jour"
    public address?: Address, // Pas utilisé
    public preferences?: UserPreferences, // Pas utilisé
    public lastLogin?: Date, // Pas utilisé
  ) {}
}
```

---

## 🔍 Code Smells & Anti-Patterns

### 1. Code Smells

#### Long Method
> Une méthode trop longue est difficile à comprendre et à maintenir.

**Solution:** Extraire des méthodes plus petites

```typescript
// ✅ BON - Méthodes courtes et focalisées
class OrderProcessor {
  processOrder(order: Order): void {
    this.validateOrder(order);
    this.calculateTotals(order);
    this.applyDiscounts(order);
    this.saveOrder(order);
    this.notifyCustomer(order);
  }
  
  private validateOrder(order: Order): void { /* ... */ }
  private calculateTotals(order: Order): void { /* ... */ }
  private applyDiscounts(order: Order): void { /* ... */ }
  private saveOrder(order: Order): void { /* ... */ }
  private notifyCustomer(order: Order): void { /* ... */ }
}

// ❌ MAUVAIS - Méthode trop longue
class OrderProcessor {
  processOrder(order: Order): void {
    // 50 lignes de validation
    // 30 lignes de calcul
    // 20 lignes d'application des réductions
    // 40 lignes de sauvegarde
    // 25 lignes de notification
    // Total: 165 lignes!
  }
}
```

#### Large Class
> Une classe avec trop de responsabilités.

**Solution:** Appliquer SRP et diviser la classe

```typescript
// ✅ BON - Classes petites et focalisées
class UserValidator {
  validate(user: User): boolean { /* ... */ }
}

class UserRepository {
  save(user: User): Promise<User> { /* ... */ }
}

class EmailService {
  sendEmail(user: User): Promise<void> { /* ... */ }
}

// ❌ MAUVAIS - Classe trop grosse
class UserManager {
  validate(user: User): boolean { /* ... */ }
  save(user: User): Promise<User> { /* ... */ }
  sendEmail(user: User): Promise<void> { /* ... */ }
  // ... beaucoup d'autres méthodes
}
```

#### Primitive Obsession
> Utiliser des types primitifs pour représenter des concepts du domaine.

**Solution:** Créer des Value Objects

```typescript
// ✅ BON - Value Objects
class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email');
    }
  }
  
  private isValid(email: string): boolean {
    return /^[\w.-]+@[\w.-]+\.\w+$/.test(email);
  }
  
  getValue(): string {
    return this.value;
  }
}

class User {
  constructor(
    public id: string,
    public email: Email, // Type fort
    public name: string,
  ) {}
}

// ❌ MAUVAIS - Types primitifs
class User {
  constructor(
    public id: string,
    public email: string, // Just a string
    public name: string,
  ) {}
}

// Utilisation
const user = new User('123', 'test@example.com', 'John');
// Comment savoir si 'test@example.com' est un email valide?
```

#### Duplicate Code
> Le même code apparaît dans plusieurs endroits.

**Solution:** Extraire dans une fonction/méthode commune

```typescript
// ✅ BON - Code partagé
function calculateTax(amount: number, rate: number): number {
  return amount * (rate / 100);
}

// Utilisé partout
const tax1 = calculateTax(100, 20);
const tax2 = calculateTax(50, 10);

// ❌ MAUVAIS - Code dupliqué
const tax1 = 100 * (20 / 100);
const tax2 = 50 * (10 / 100);
// ... à d'autres endroits
```

#### Long Parameter List
> Une méthode avec trop de paramètres est difficile à comprendre et à utiliser.

**Solution:** Utiliser des Parameter Objects

```typescript
// ✅ BON - Parameter Object
interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  isActive?: boolean;
}

class UserService {
  createUser(params: CreateUserParams): Promise<User> { /* ... */ }
}

// Utilisation
userService.createUser({
  email: 'test@example.com',
  password: 'secret',
  name: 'John',
});

// ❌ MAUVAIS - Trop de paramètres
class UserService {
  createUser(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'user',
    isActive: boolean = true,
    sendWelcomeEmail: boolean = true,
    validateEmail: boolean = true,
  ): Promise<User> { /* ... */ }
}

// Utilisation
userService.createUser('test@example.com', 'secret', 'John', 'user', true, true, true);
```

#### Feature Envy
> Une méthode qui utilise beaucoup les données d'une autre classe.

**Solution:** Déplacer la méthode dans la classe appropriée

```typescript
// ✅ BON - Méthode dans la bonne classe
class Order {
  constructor(
    public items: OrderItem[],
    public discount: number = 0,
  ) {}
  
  calculateTotal(): number {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal * (1 - this.discount / 100);
  }
}

// ❌ MAUVAIS - Feature Envy
class OrderCalculator {
  calculateTotal(order: Order): number {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal * (1 - order.discount / 100);
  }
}
```

#### Magic Numbers/Strings
> Des valeurs codées en dur sans explication.

**Solution:** Utiliser des constantes nommées

```typescript
// ✅ BON - Constantes nommées
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_CURRENCY = 'EUR';

function processPayment(amount: number, currency: string = DEFAULT_CURRENCY): void {
  for (let i = 0; i < MAX_RETRIES; i++) {
    // ...
    await sleep(RETRY_DELAY_MS);
  }
}

// ❌ MAUVAIS - Magic Numbers/Strings
function processPayment(amount: number, currency: string = 'EUR'): void {
  for (let i = 0; i < 3; i++) {
    // ...
    await sleep(1000);
  }
}
```

### 2. Anti-Patterns

#### God Object
> Une classe qui fait tout.

**Solution:** Diviser en plusieurs classes avec responsabilités uniques

#### Spaghetti Code
> Code avec des dépendances circulaires et une logique peu claire.

**Solution:** Restructurer avec des couches claires et des dépendances bien définies

#### Copy-Paste Programming
> Copier-coller du code avec des modifications mineures.

**Solution:** Extraire le code commun et paramétrer les différences

#### Golden Hammer
> Utiliser la même solution pour tous les problèmes.

**Solution:** Choisir la bonne solution pour chaque problème

#### Vendor Lock-in
> Dépendre trop d'une bibliothèque/technology spécifique.

**Solution:** Utiliser des abstractions pour permettre le changement

---

## 🛠️ Techniques de Refactoring

### 1. Extract Method
**Quand:** Une méthode est trop longue ou fait plusieurs choses.

```typescript
// Avant
function processOrder(order: Order): void {
  // Validation
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  
  // Calcul
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.2;
  const total = subtotal + tax;
  
  // Sauvegarde
  await db.save(order);
  
  // Notification
  await emailService.send(order.customer.email, 'Order confirmed');
}

// Après
function processOrder(order: Order): void {
  this.validateOrder(order);
  const total = this.calculateTotal(order);
  await this.saveOrder(order);
  await this.notifyCustomer(order);
}

private validateOrder(order: Order): void {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
}

private calculateTotal(order: Order): number {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.2;
  return subtotal + tax;
}

private async saveOrder(order: Order): Promise<void> {
  await db.save(order);
}

private async notifyCustomer(order: Order): Promise<void> {
  await emailService.send(order.customer.email, 'Order confirmed');
}
```

### 2. Extract Class
**Quand:** Une classe a trop de responsabilités.

```typescript
// Avant
class OrderProcessor {
  validateOrder(order: Order): boolean { /* ... */ }
  calculateTotal(order: Order): number { /* ... */ }
  saveOrder(order: Order): Promise<Order> { /* ... */ }
  sendConfirmationEmail(order: Order): Promise<void> { /* ... */ }
  updateInventory(order: Order): Promise<void> { /* ... */ }
}

// Après
class OrderValidator {
  validate(order: Order): boolean { /* ... */ }
}

class OrderCalculator {
  calculateTotal(order: Order): number { /* ... */ }
}

class OrderRepository {
  save(order: Order): Promise<Order> { /* ... */ }
}

class EmailService {
  sendConfirmation(order: Order): Promise<void> { /* ... */ }
}

class InventoryService {
  updateForOrder(order: Order): Promise<void> { /* ... */ }
}

class OrderProcessor {
  constructor(
    private validator: OrderValidator,
    private calculator: OrderCalculator,
    private repository: OrderRepository,
    private emailService: EmailService,
    private inventoryService: InventoryService,
  ) {}
  
  async process(order: Order): Promise<Order> {
    if (!this.validator.validate(order)) {
      throw new Error('Invalid order');
    }
    
    const total = this.calculator.calculateTotal(order);
    const savedOrder = await this.repository.save(order);
    await this.emailService.sendConfirmation(savedOrder);
    await this.inventoryService.updateForOrder(savedOrder);
    
    return savedOrder;
  }
}
```

### 3. Replace Conditional with Polymorphism
**Quand:** Des conditionnels complexes sur le type.

```typescript
// Avant
class PaymentProcessor {
  processPayment(payment: Payment): void {
    switch (payment.type) {
      case 'credit_card':
        // Logique carte de crédit
        break;
      case 'paypal':
        // Logique PayPal
        break;
      case 'bank_transfer':
        // Logique virement
        break;
    }
  }
}

// Après
interface PaymentStrategy {
  process(): void;
}

class CreditCardPayment implements PaymentStrategy {
  process(): void { /* Logique carte de crédit */ }
}

class PayPalPayment implements PaymentStrategy {
  process(): void { /* Logique PayPal */ }
}

class BankTransferPayment implements PaymentStrategy {
  process(): void { /* Logique virement */ }
}

class PaymentProcessor {
  processPayment(strategy: PaymentStrategy): void {
    strategy.process();
  }
}
```

### 4. Introduce Parameter Object
**Quand:** Une méthode a trop de paramètres.

```typescript
// Avant
function createUser(
  id: string,
  email: string,
  password: string,
  name: string,
  role: UserRole = 'user',
  isActive: boolean = true,
): User { /* ... */ }

// Après
interface CreateUserParams {
  id: string;
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  isActive?: boolean;
}

function createUser(params: CreateUserParams): User { /* ... */ }
```

### 5. Replace Magic Number with Symbolic Constant
**Quand:** Des valeurs codées en dur.

```typescript
// Avant
if (status === 1) { /* Active */ }
if (status === 2) { /* Inactive */ }

// Après
const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  PENDING: 3,
} as const;

type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];

if (status === USER_STATUS.ACTIVE) { /* Active */ }
```

---

## 📊 Checklist Clean Code

### Avant de Commiter

- [ ] **Nommage**: Tous les noms (variables, fonctions, classes) sont clairs et explicites
- [ ] **Fonctions**: Chaque fonction fait UNE seule chose et la fait bien
- [ ] **Taille**: Aucune fonction ne dépasse 20-30 lignes (idéalement < 20)
- [ ] **Paramètres**: Aucune fonction n'a plus de 3-4 paramètres (utiliser Parameter Objects)
- [ ] **Classes**: Chaque classe a une seule responsabilité (SRP)
- [ ] **Duplication**: Aucune duplication de code (DRY)
- [ ] **Commentaires**: Les commentaires expliquent le POURQUOI, pas le COMMENT
- [ ] **Tests**: Chaque fonction a des tests unitaires
- [ ] **Linting**: Le code passe ESLint sans erreurs
- [ ] **Typage**: Tous les types TypeScript sont corrects

### Avant une Code Review

- [ ] **Spec**: Le code respecte la spécification validée
- [ ] **Conventions**: Le code suit CONVENTIONS.md
- [ ] **Documentation**: La documentation est à jour
- [ ] **Tests**: Tous les tests passent
- [ ] **Performance**: Pas de problèmes de performance évidents
- [ ] **Sécurité**: Pas de vulnérabilités de sécurité
- [ ] **Accessibilité**: Le code respecte les standards d'accessibilité (si UI)

---

## 🎓 Ressources Recommandées

### Livres
- [Clean Code: A Handbook of Agile Software Craftsmanship](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) - Robert C. Martin
- [The Clean Coder: A Code of Conduct for Professional Programmers](https://www.amazon.com/Clean-Coder-Conduct-Professional-Programmers/dp/0137081073) - Robert C. Martin
- [Refactoring: Improving the Design of Existing Code](https://www.amazon.com/Refactoring-Improving-Design-Existing-Code/dp/0201485672) - Martin Fowler

### Sites Web
- [Clean Code Cheat Sheet](https://github.com/thoughtbot/guides/tree/main/style)
- [Refactoring Guru](https://refactoring.guru/)
- [Martin Fowler's Blog](https://martinfowler.com/)
- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/)

### Outils
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Formatage
- [SonarQube](https://www.sonarqube.org/) - Analyse de code
- [CodeClimate](https://codeclimate.com/) - Qualité de code

---

## 📝 Exemples Pratiques

### Exemple 1: De Spaghetti à Clean

**Avant (Spaghetti Code):**
```typescript
// userManager.ts
class UserManager {
  constructor(private db: any) {}
  
  async handleUserRequest(req: any, res: any): Promise<void> {
    if (req.method === 'GET' && req.url === '/users') {
      const users = await this.db.collection('users').find({}).toArray();
      res.json(users);
    } else if (req.method === 'POST' && req.url === '/users') {
      const user = req.body;
      if (!user.email || !user.password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }
      const existing = await this.db.collection('users').findOne({ email: user.email });
      if (existing) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }
      user.password = this.hashPassword(user.password);
      const result = await this.db.collection('users').insertOne(user);
      res.status(201).json({ id: result.insertedId, ...user });
    } else if (req.method === 'GET' && req.url.match(>/users/\w+/)) {
      const id = req.url.split('/')[2];
      const user = await this.db.collection('users').findOne({ _id: id });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
  
  private hashPassword(password: string): string {
    // Implémentation basique
    return require('crypto').createHash('sha256').update(password).digest('hex');
  }
}
```

**Après (Clean Code):**
```typescript
// types/user.ts
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

// interfaces/IUserRepository.ts
interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserDto): Promise<User>;
}

// services/PasswordService.ts
class PasswordService {
  hash(password: string): string {
    return require('crypto').createHash('sha256').update(password).digest('hex');
  }
}

// repositories/UserRepository.ts
class UserRepository implements IUserRepository {
  constructor(private db: any, private passwordService: PasswordService) {}
  
  async findAll(): Promise<User[]> {
    return this.db.collection('users').find({}).toArray();
  }
  
  async findById(id: string): Promise<User | null> {
    return this.db.collection('users').findOne({ _id: id });
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return this.db.collection('users').findOne({ email });
  }
  
  async create(userDto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(userDto.email);
    if (existing) {
      throw new Error('Email already exists');
    }
    
    const user: User = {
      id: require('uuid').v4(),
      email: userDto.email,
      passwordHash: this.passwordService.hash(userDto.password),
      name: userDto.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await this.db.collection('users').insertOne(user);
    return user;
  }
}

// usecases/GetAllUsers.ts
class GetAllUsers {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}

// usecases/GetUserById.ts
class GetUserById {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

// usecases/CreateUser.ts
class CreateUser {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(userDto: CreateUserDto): Promise<User> {
    if (!userDto.email || !userDto.password) {
      throw new Error('Email and password required');
    }
    return this.userRepository.create(userDto);
  }
}

// controllers/UserController.ts
class UserController {
  constructor(
    private getAllUsers: GetAllUsers,
    private getUserById: GetUserById,
    private createUser: CreateUser,
  ) {}
  
  async handleRequest(req: any, res: any): Promise<void> {
    try {
      if (req.method === 'GET' && req.url === '/users') {
        const users = await this.getAllUsers.execute();
        res.json(users);
      } else if (req.method === 'POST' && req.url === '/users') {
        const user = await this.createUser.execute(req.body);
        res.status(201).json(user);
      } else if (req.method === 'GET' && req.url.match(>/users/\w+/)) {
        const id = req.url.split('/')[2];
        const user = await this.getUserById.execute(id);
        res.json(user);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

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
function processOrder(order: Order): void {
  if (!order) {
    throw new Error('Order is required');
  }
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  // ... reste de la logique
}

// ❌ MAUVAIS - Fail Late
function processOrder(order: Order): void {
  // Beaucoup de logique...
  // Puis au milieu:
  if (!order.items) {
    return; // Échec silencieux!
  }
}
```

---

**Version:** 1.0.0  
**Auteur:** Agent IA Expert Architect  
**Dernière mise à jour:** 2024-11-05  
**Statut:** ✅ Opérationnelle
