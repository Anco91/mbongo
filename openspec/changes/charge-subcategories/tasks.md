## 1. Domaine
- [ ] 1.1 `CHARGE_CATEGORIES`, `listSubcategories`, `checkChargeSubcategory`, `resolveChargeSubcategory` (`domain/charge-category.ts`)
- [ ] 1.2 `chargeSchema.subcategory` (nullable, défaut `null`); règle dans `createChargeSchema.superRefine`
## 2. Serveur
- [ ] 2.1 `npx prisma generate` (migration déjà préparée, ne pas l'appliquer)
- [ ] 2.2 `ChargeService.create` / `update`: écrire `subcategory`, 422 si étrangère, remise à `null` au changement de catégorie
## 3. Client
- [ ] 3.1 `ChargeCategoryFields` (catégorie + sous-catégorie), utilisé par les formulaires de création et d'édition
- [ ] 3.2 `charge-detail.tsx`: ligne « Sous-catégorie »
- [ ] 3.3 `ARCHITECTURE.md` (registre), `npm run typecheck`, `npm run lint`
