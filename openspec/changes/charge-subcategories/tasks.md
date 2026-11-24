## 1. Domaine
- [x] 1.1 `CHARGE_CATEGORIES`, `listSubcategories`, `checkChargeSubcategory`, `resolveChargeSubcategory` (`domain/charge-category.ts`)
- [x] 1.2 `chargeSchema.subcategory` (nullable, défaut `null`); règle dans `createChargeSchema.superRefine`
## 2. Serveur
- [x] 2.1 `npx prisma generate` (migration déjà préparée, ne pas l'appliquer)
- [x] 2.2 `ChargeService.create` / `update`: écrire `subcategory`, 422 si étrangère, remise à `null` au changement de catégorie
## 3. Client
- [x] 3.1 `ChargeCategoryFields` (catégorie + sous-catégorie), utilisé par les formulaires de création et d'édition
- [x] 3.2 `charge-detail.tsx`: ligne « Sous-catégorie »
- [x] 3.3 `ARCHITECTURE.md` (registre), `npm run typecheck`, `npm run lint`
