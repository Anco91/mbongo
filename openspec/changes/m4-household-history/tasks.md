# Tasks

## 1. Socle membre : lastName + CRUD API

- [x] 1.1 `packages/shared` : `memberSchema` + `lastName` optionnel (create/update) ; Prisma migration `members.lastName` nullable ; service `create/update/delete` (delete = transaction : nullification `memberId` des comptes puis delete) ; controller + routes `POST/PATCH/DELETE /api/members` ; repository + hooks `useCreateMember/useUpdateMember/useDeleteMember` ; tests service/where/routes
- [x] 1.2 `ownerLabel(memberId, members)` dérivation pure + `OwnerBadge` (components/common, chip « prénom » ou « Foyer ») ; test rendu des deux cas
- [x] 1.3 Vue `/household` : view/guard/content + formulaire (prénom, nom, rôle) sur form kit + `DeleteButton` ; lien « Vue foyer » depuis la page comptes ; AppHeader title `/household` ; tests content (liste, filtres, actions)

## 2. Badge qui-paie sur toutes les cards

- [x] 2.1 `OwnerBadge` sur cards comptes (à côté du nom), charges (ligne badges + détail), échéances du dashboard, provisions du dashboard ; test charges-content avec badge « Foyer » et badge membre
- [x] 2.2 Vérification : membre renommé → badge mis à jour partout ; compte sans membre → « Foyer »

## 3. Dashboard mensuel (curseur + swipe)

- [ ] 3.1 Shared : `monthRange(iso)` pure + filtrage mensuel des inputs sankey/donut/échéances dans dashboard-content (`selectedMonth` défaut courant) ; `computeAlerts` reste asOf jour ; test monthRange + filtrage
- [ ] 3.2 Curseur « ‹ nov. 2026 › » (précédent/suivant) au-dessus des charts + swipe horizontal (pointer events, seuil 60 px, zone charts) ; test curseur (mois affiché, navigation)
- [ ] 3.3 Vérification : mois passé → échéances/flux de ce mois ; mois courant au premier chargement ; scroll vertical non capturé par le swipe

## 4. Texte dans les graphes

- [ ] 4.1 Sankey : `sankeyNodeTotals(data)` pure (total par nœud depuis les liens) + labels « nom · montant » toujours visibles (carte + plein écran), marges ajustées ; test totals
- [ ] 4.2 Donut : total formaté au centre de l'anneau (`<text>` superposé) + `label` % custom sur les segments en plein écran ; légende retirée de la carte, conservée en plein écran ; test centre rendu
- [ ] 4.3 Vérification : lisibilité en carte (390 px), contraste des labels sur les liens colorés

## 5. Texte légende + pagination PWA

- [ ] 5.1 `chargeSchema` + `note` optionnelle ; Prisma migration `charges.note` nullable ; textarea dans charge-create/edit-form ; test schema
- [ ] 5.2 `chargeCaption(charge, account)` pure (note si présente sinon « type · catégorie · fréquence sur compte ») affichée sous le montant des cards charges ; test des deux cas
- [ ] 5.3 `ShowMoreList` générique (components/common) : items, renderItem, initial 3, step 5, labels « afficher les n autres » / « réduire » ; refactor transfers-content dessus ; test (12 items → paquets, 2 items → pas de bouton)
- [ ] 5.4 Application : accounts-content, charges-content (après filtres, reset au changement de filtre), échéances du dashboard (remplace le toggle), provisions du dashboard (total toujours visible) ; tests par vue
- [ ] 5.5 AppHeader : sélecteur EUR/CHF rendu uniquement sur `/` ; test pathname
- [ ] 5.6 Amendement delta m4-ui-fixes (specs/dashboard : sélecteur dashboard-only) + `openspec validate` avant archive

## 6. Vérification globale

- [ ] 6.1 `npx tsc --noEmit` + lint 0 erreur + suite complète au vert
- [ ] 6.2 `npm run build` au vert ; smoke : /household CRUD, badges qui-paie, swipe mensuel, texte donut/sankey, pagination comptes/charges/échéances/provisions, switch masqué hors dashboard
