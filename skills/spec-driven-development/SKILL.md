# SKILL.md - Spec-Driven Development (SDD)

## 🎯 Description

**Skill de Specification-Driven Development** - Une approche systématique pour développer des logiciels à partir de spécifications détaillées et validées.

Inspiré par:
- [Kiro.dev](https://kiro.dev) - Spec-Driven Development Framework
- [Google Agent Skills](https://developers.google.com/agent-skills) - Structured Development
- Domain-Driven Design (DDD)
- Test-Driven Development (TDD)

## 📌 Capabilités

Cette skill permet à l'Agent IA de:

1. **Créer des spécifications détaillées** avant tout développement
2. **Valider les specs** avec le demandeur
3. **Générer une todo list** à partir de la spec
4. **Développer en suivant** strictement la spec
5. **Vérifier la conformité** du code par rapport à la spec
6. **Documenter automatiquement** à partir de la spec

## 🚀 Activation

Cette skill s'active automatiquement quand:
- Un utilisateur demande une nouvelle feature
- Un utilisateur dit "créer une spec"
- Un utilisateur mentionne "specification"
- Un projet est initialisé sans spec existante

## 📋 Workflow SDD

```
┌─────────────────────────────────────────────────────────────┐
│                    SPEC-DRIVEN DEVELOPMENT                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CAPTURE DES BESOINS                                     │
│     ├─ Comprendre le besoin utilisateur                     │
│     ├─ Identifier les acteurs                               │
│     └─ Définir le périmètre (In/Out of Scope)               │
│                                                             │
│  2. ANALYSE TECHNIQUE                                       │
│     ├─ Identifier les composants impactés                   │
│     ├─ Définir les interfaces/contrats                       │
│     └─ Analyser les contraintes techniques                  │
│                                                             │
│  3. RÉDACTION DE LA SPEC                                    │
│     ├─ Utiliser le template SPEC_TEMPLATE.md                │
│     ├─ Décrire les fonctionnalités                          │
│     ├─ Définir les règles métier                            │
│     └─ Spécifier les tests attendus                         │
│                                                             │
│  4. VALIDATION                                              │
│     ├─ Review de la spec avec le demandeur                 │
│     ├─ Clarification des points ambigus                    │
│     └─ Approbation formelle (✅ VALIDÉ)                     │
│                                                             │
│  5. PLANIFICATION                                           │
│     ├─ Découper en tâches (todo list)                      │
│     ├─ Estimer le temps pour chaque tâche                   │
│     └─ Définir les dépendances entre tâches                │
│                                                             │
│  6. DÉVELOPPEMENT                                          │
│     ├─ Coder UNIQUEMENT selon la spec                       │
│     ├─ Respecter les conventions (CONVENTIONS.md)          │
│     └─ Mettre à jour la todo list                           │
│                                                             │
│  7. VÉRIFICATION                                            │
│     ├─ Vérifier chaque point de la spec                    │
│     ├─ Exécuter les tests définis dans la spec              │
│     └─ Validation finale avec le demandeur                 │
│                                                             │
│  8. DOCUMENTATION                                           │
│     ├─ Mettre à jour la documentation                       │
│     ├─ Archiver la spec validée                             │
│     └─ Documenter les décisions techniques                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Template de Spécification

Voir `SPEC_TEMPLATE.md` dans ce dossier.

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
> "J'ai besoin d'un système de gestion des utilisateurs"

**Agent (réponse automatique):**
```
⚠️ PAS DE CODE SANS SPEC VALIDÉE

Je vais créer une spécification détaillée pour ce besoin.
Souhaitez-vous utiliser le template SDD? (Oui/Non)

Si Oui: /vibe spec:init user-management
```

**Utilisateur:**
> "Créer une API pour les produits"

**Agent (réponse automatique):**
```
⚠️ PAS DE CODE SANS SPEC VALIDÉE

Pour créer une API produits, nous devons d'abord:
1. Définir les endpoints nécessaires
2. Spécifier les DTOs (Data Transfer Objects)
3. Définir les règles métier
4. Identifier les cas d'erreur

Je propose de créer: /vibe spec:init product-api
```

## 📊 Structure d'une Spec

```
specs/
├── <nom-de-la-feature>/          # Dossier de la spec
│   ├── SPEC.md                  # Spécification principale
│   ├── diagrams/                # Diagrammes (Mermaid, PlantUML)
│   │   ├── architecture.mmd     # Diagramme d'architecture
│   │   ├── sequence.mmd         # Diagrammes de séquence
│   │   └── class.mmd             # Diagrammes de classes
│   ├── examples/                # Exemples concrets
│   │   ├── request.json          # Exemple de requête
│   │   └── response.json         # Exemple de réponse
│   ├── tests/                   # Cas de test spécifiés
│   │   └── test-cases.md         # Liste des cas de test
│   └── decisions.md             # Décisions techniques
└── INDEX.md                     # Index de toutes les specs
```

## ✅ Critères de Validation d'une Spec

Pour qu'une spec soit considérée comme **VALIDÉE**, elle doit:

- [ ] **Complétude**: Tous les aspects du besoin sont couverts
- [ ] **Précision**: Aucune ambiguïté dans les descriptions
- [ ] **Testabilité**: Chaque fonctionnalité a des critères de test clairs
- [ ] **Cohérence**: Pas de contradictions internes
- [ ] **Approbation**: Signée par le demandeur (✅ dans le fichier)
- [ ] **Estimation**: Temps estimé pour chaque tâche
- [ ] **Priorisation**: Priorité de chaque tâche définie

## 🛠️ Outils Intégrés

### 1. Générateur de Todo List

Transforme une spec en todo list exécutable:

**Input:** SPEC.md avec sections marquées `## 📋 Tâches`
**Output:** TODO.md ou mise à jour de la todo list Vibe

### 2. Vérificateur de Conformité

Compare le code produit avec la spec:
- Vérifie que toutes les fonctions spécifiées existent
- Vérifie que les interfaces/contrats sont respectés
- Vérifie que les tests spécifiés sont implémentés

### 3. Générateur de Diagrammes

Génère automatiquement des diagrammes Mermaid à partir de la spec:
- Diagrammes d'architecture
- Diagrammes de séquence
- Diagrammes de classes

### 4. Estimateur de Temps

Estime le temps de développement basé sur:
- Complexité de la spec
- Nombre de tâches
- Expérience de l'agent
- Historique des projets similaires

## 📁 Fichiers de la Skill

```
skills/spec-driven-development/
├── SKILL.md                     # Ce fichier
├── SPEC_TEMPLATE.md             # Template pour les specs
├── SPEC_INDEX_TEMPLATE.md      # Template pour l'index des specs
├── validators/
│   ├── spec-validator.ts        # Validation des specs
│   └── code-compliance.ts       # Vérification code vs spec
├── generators/
│   ├── todo-generator.ts        # Génération de todo lists
│   ├── diagram-generator.ts     # Génération de diagrammes
│   └── test-generator.ts        # Génération de tests
├── estimators/
│   └── time-estimator.ts        # Estimation des temps
└── utils/
    ├── spec-parser.ts           # Parsing des specs
    └── spec-writer.ts           # Écriture des specs
```

## 🎯 Bonnes Pratiques SDD

### 1. Principle of Least Surprise

La spec doit décrire exactement ce que l'utilisateur attend, sans surprise.

### 2. Single Source of Truth

La spec est LA référence. Si le code diffère, c'est le code qui a tort.

### 3. Living Documentation

La spec doit être mise à jour en temps réel avec les changements.

### 4. Test-First Mindset

La spec doit inclure les cas de test AVANT le développement.

### 5. Iterative Refinement

Une spec peut être affiné itérativement, mais doit toujours être validée.

## 🚫 Anti-Patterns à Éviter

### ❌ Spec Trop Vague

```markdown
# Gestion des Utilisateurs

Il faut gérer les utilisateurs.
```

**Problème:** Impossible de développer à partir de ça.

### ❌ Spec Trop Technique (pour le demandeur)

```markdown
# Architecture

Nous utiliserons Redis pour le caching avec une TTL de 3600 secondes...
```

**Problème:** Le demandeur ne comprend pas et ne peut pas valider.

### ❌ Spec Non Testable

```markdown
# Performance

Le système doit être rapide.
```

**Problème:** "Rapide" n'est pas mesurable.

**Correction:**
```markdown
# Performance

- Temps de réponse API < 200ms pour 95% des requêtes
- Capacité à gérer 1000 requêtes simultanées
```

### ❌ Spec avec Contradictions

```markdown
# Authentification

- Les utilisateurs doivent pouvoir se connecter avec email + mot de passe
- Le système ne doit pas stocker les mots de passe
```

**Problème:** Contradiction entre les deux points.

## 📚 Ressources

- [Kiro.dev - Spec-Driven Development](https://kiro.dev)
- [Google Agent Skills Documentation](https://developers.google.com/agent-skills)
- [Domain-Driven Design](https://domainlanguage.com/ddd/)
- [Test-Driven Development by Example](https://www.amazon.com/Test-Driven-Development-Example-Kent-Beck/dp/0321146530)
- [Specification by Example](https://www.amazon.com/Specification-Example-Gojko-Adzic/dp/1617290084)

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
    strict-mode: true  # Bloque le code sans spec
    
todo:
  auto-sync: true  # Sync avec les specs
  
validation:
  require-spec: true
  require-tests: true
```

## 🎓 Formation Recommandée

Pour maîtriser le SDD:

1. Lire `SPEC_TEMPLATE.md` et créer 3 specs d'exemple
2. Utiliser le workflow SDD pour un petit projet
3. Revoir les specs existantes et identifier les améliorations
4. Participer à des sessions de review de specs

## 📊 Métriques SDD

- **Taux de specs validées**: Objectif 100%
- **Temps moyen par spec**: < 2 heures
- **Taux de conformité code/spec**: Objectif 100%
- **Réduction des bugs**: Objectif -80% par rapport au développement sans spec

---

**Version:** 1.0.0  
**Auteur:** Agent IA Expert Architect  
**Dernière mise à jour:** 2024-11-05  
**Statut:** ✅ Opérationnelle
