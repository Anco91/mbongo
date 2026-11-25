# Plan — portée plein écran, budget des mois futurs, import bancaire

## Contexte

Trois demandes, un constat commun : l'app calcule des chiffres sans scénario de bout en bout qui prouve qu'ils tiennent d'un mois à l'autre.

1. Les boutons Foyer / membre (donut, Sankey) ne doivent exister que dans le plein écran des graphiques. Aujourd'hui ils sont aussi sur la page dashboard (`dashboard-content.tsx:165-172`).
2. Le budget d'un mois futur est faux. Audit du code (lecture seule) :
   - `Patrimoine consolidé` ignore le mois choisi (`use-dashboard-data.ts:95-114`, `selectedMonth` inutilisé) ; la spec l'assume (`specs/current/dashboard/spec.md:207`). Il n'existe aucun solde projeté.
   - Le solde = `openingBalance` + toutes les transactions, sans plafond de date (`balance.ts:31`). Confirmer un revenu de décembre, ou un virement daté dans le futur, modifie le patrimoine d'aujourd'hui.
   - Charges dues : seul le mois de `today` est compté, les échéances PENDING en retard disparaissent, le curseur de mois est ignoré (`due-charges.ts:23`, `use-dashboard-data.ts:78,227`).
   - `monthlyProvision` ignore `startDate`/`endDate` (`schedule.ts:301-305,528`) ; `computeMonthlyBudget` compte les paiements CANCELLED/FAILED (`schedule.ts:518-527`) et, côté dashboard, ne convertit pas CHF/EUR (`use-dashboard-data.ts:145`) alors que le recap convertit.
   - « Reste à vivre » désigne deux calculs différents (recap = revenus − charges ; WealthCard = soldes − dues).
   - Sankey/donut affichent le paiement d'une charge lissée à sa date, la provision n'a pas de branche, et le budget l'exclut puis ajoute la provision : trois vues, trois totaux.
   - Aucun test multi-mois. Les 40 tests existants sont unitaires, un mois à la fois.
3. Import du relevé BNP (`exports-xls/export_25_11_2026_11_02_30.xls`, fichier lu). Structure : bandeau `Compte de chèques ****2319`, `Solde au 24/11/2026`, `EUR`, puis colonnes `Date operation | Categorie operation | Sous Categorie operation | Libelle operation | Montant operation | Pointage operation | Commentaire operation`, dates `dd-MM-yyyy`. Les achats carte différée sont tous datés du jour de prélèvement (30-10), la vraie date est dans le libellé (`DU 17/10/26`). Les catégories banque (« À catégoriser » incluse) sont distinctes de `CHARGE_CATEGORIES`. Le signe des montants n'a pas été vérifié (cellules numériques non décodées) : à confirmer en début de spec 36.

## Décisions (PM, à consigner dans `design.md` de chaque change)

- D1. Les chips Foyer/membre n'apparaissent que dans le plein écran. On garde `?membre=` / `?compte=` (nuqs, règle « URL state in the URL »). Les cartes de la page reçoivent un scope nul (Foyer) ; le plein écran reçoit `scopeToMember(closedScope, memberId, accountId)` (fonction pure, second appel peu coûteux). Sans chips sur la page, un `?membre=` persisté ne doit pas la filtrer. Les sous-chips de comptes du plein écran listent seulement les comptes courants (`CURRENT`, `JOINT`, `CREDIT_CARD`) ; les comptes `SAVINGS` n'y figurent pas (pas de charges). Décision utilisateur 2026-11-25.
- D2. Un solde « à une date » est une fonction pure : transactions datées ≤ la date. Le patrimoine du jour est borné à aujourd'hui.
- D3. Mois passé = réel (solde en fin de ce mois). Mois courant = réel à ce jour + attendu restant. Mois futur = **projeté** : solde d'aujourd'hui + flux attendus jusqu'à fin du mois, étiqueté « Projeté fin décembre » (jamais présenté comme réel).
- D4. Flux attendus d'un mois futur : revenus dus non confirmés (montant planifié), échéances PENDING à leur date (retards inclus, CANCELLED/FAILED exclues), virements planifiés. Comptes d'épargne : stables, bougent seulement par virement. Taux de change : taux courant, signalé.
- D5. Provision : pour le **patrimoine projeté**, l'argent sort à l'échéance réelle (flux de trésorerie). Pour le **reste à vivre du budget** (flux du mois), on retire la provision mensuelle, bornée par `startDate`/`endDate`. Deux libellés distincts : « Reste à vivre (budget) » et « Reste à vivre (comptes) ».
- D6. Un revenu confirmé remplace son montant planifié (anti-double-compte déjà en place) ; une transaction positive non liée n'est jamais comptée comme revenu futur (modèle matching, `ARCHITECTURE.md` décision 2026-11-24).
- D8. Sankey et donut montrent une charge lissée par sa **provision mensuelle** (branche « Provisions »), pas par le paiement à sa date ; le total charges du budget = Sankey = donut. Le paiement réel de la charge lissée n'apparaît que dans le patrimoine projeté (D5).
- D7. Import : **CSV BNP** (l'utilisateur peut le télécharger ; plus de `.xls`, plus de dépendance SheetJS), derrière une interface de profil bancaire. Boursorama ensuite (CSV). YUH n'a que du PDF : snapshot manuel en V1. L'API bancaire (PSD2) est une ligne ultérieure, spike seulement : voir « Import par API » ci-dessous.

## Lignes à ajouter au master (ordre)

| # | Sous-spec | Contenu | Besoin |
|---|---|---|---|
| 33 | `dashboard-scope-fullscreen-only` | Retire les chips de la page, scope local au plein écran (D1). Delta `specs/current/dashboard/spec.md` « Portée par membre des graphiques ». Pas de test verrouillé (glue). | — |
| 34 | `budget-journey-scenarios` | **Advisor écrit et verrouille** des scénarios de bout en bout sans UI, en deux fichiers (voir ci-dessous). Le premier compile et échoue sur des assertions précises : c'est la preuve des incohérences. Le second verrouille les signatures de 35. | — |
| 35 | `projected-balance` | Fonctions pures `balanceAsOf`, `computeProjectedBalance`, `computeMonthState` ; corrige **chaque scénario rouge de 34** (liste en Frame, voir « Défauts constatés ») ; WealthCard suit le curseur ; libellés D5. Frame > Modify : `docs/LEXIQUE.md` (« Reste à vivre (budget) », « Reste à vivre (comptes) », « Projeté fin <mois> »). Deltas `dashboard`, `monthly-budget`, `provisions`. | 34 |
| 36 | `bank-import-bnp` | Spec d'abord (draft), pas de code : voir ci-dessous. | 35 |

33 est indépendant et peut partir tout de suite. 34 → 35 est strictement séquentiel (WF : tests verrouillés avant exécution).

## Défauts constatés (à copier dans la Frame de 35, chaque ligne = une assertion rouge de 34)

Vérifiés par lecture au moment du plan : `schedule.ts:301-305`, `use-dashboard-data.ts:140-146` (appel sans `convert`), `due-charges.ts:23-45`, `schedule.ts:515-530`.

- Solde sans plafond de date : une transaction future modifie le patrimoine du jour (`balance.ts:31`).
- Patrimoine et dues ignorent le mois du curseur (`use-dashboard-data.ts:78,95-114,227`).
- Dues : seul le mois de `today`, PENDING en retard exclues, PENDING futures du mois incluses (`due-charges.ts:23`).
- `monthlyProvision` somme toutes les charges lissées, sans `startDate`/`endDate` (`schedule.ts:301-305`).
- `computeMonthlyBudget` compte CANCELLED/FAILED (`schedule.ts:518-527`).
- `computeMonthlyBudget` appelé sans `convert` dans le dashboard (`use-dashboard-data.ts:145`) alors que le recap convertit ; recap : taux nul remplacé par 1 (`recap-step.tsx:49-55`).
- Sankey/donut : charge lissée affichée par son paiement, sans branche provision (`sankey.ts:208`) ; transferts filtrés sur `sentAt` seul.
- ProvisionsCard reçoit toutes les charges, sans mois ni expiration.
- « Reste à vivre » : deux définitions, un libellé.
- À vérifier au moment de la Frame, non confirmés : fuseau horaire des `dueDate` (UTC minuit) et `isWithinInterval` de `income.ts:48-62`.

## Sous-spec 34 — scénarios (jeu de données fictif, un foyer FR/CH)

Deux fichiers dans `apps/web/__tests__/scenarios/`, fonctions pures de `@mbongo/shared`, aucun Prisma ni React :

- `budget-journey.current.test.ts` : n'utilise que des fonctions existantes (`computeMonthlyBudget`, `monthlyProvision`, `computeDueCharges`, `computeSankeyFlows`, `computeDonutExpenses`, `computeMonthExpectedIncome`, `computeConsolidatedBalance`). Il compile et échoue assertion par assertion. Scénarios 2 (partie flux), 3, 4, 5, 10.
- `budget-journey.projection.test.ts` : utilise les signatures de 35. Scénarios 1, 2 (patrimoine), 6 à 9, 11. Échoue à la compilation tant que 35 n'existe pas : attendu.

Scénarios : Fixture : compte courant EUR, compte joint, épargne EUR, compte CHF, carte différée ; salaire CHF mensuel, loyer, assurance annuelle lissée, crédit à échéances, charge temporaire à `endDate`, virement CHF→EUR avec frais.

1. M0 état de départ : patrimoine, reste à vivre, dues, attendus.
2. M1 sans aucune action : patrimoine projeté exact = M0 + revenus − échéances, épargne inchangée.
3. M+2, M+3 : la projection se chaîne, une charge terminée disparaît, une charge pas encore commencée n'apparaît pas, la provision ne court qu'entre `startDate` et `endDate`.
4. Confirmer le salaire de M1 en avance : le patrimoine d'aujourd'hui ne bouge pas, la projection de M1 ne compte pas deux fois (D6).
5. Échéance en retard (PENDING d'un mois passé) : comptée dans les dues et la projection.
6. Payer une échéance : débit unique, puis la projection ne la recompte pas.
7. Virement CHF→EUR avec frais : neutre pour le patrimoine hors frais ; futur planifié apparaît à sa date.
8. Carte différée : le prélèvement de fin de mois tombe dans le bon mois du compte lié.
9. Compte clôturé : sorti du patrimoine et de la projection.
10. Cohérence croisée : pour un même mois, total charges du budget = somme Sankey = somme donut (provision comprise).
11. Mois passé : solde en fin de mois = solde reconstruit à cette date (`balanceAsOf`).

L'Advisor valide d'abord les chiffres attendus à la main (mois par mois, dans un tableau en tête du fichier) avant de verrouiller.

## Sous-spec 36 — import bancaire (spec seulement)

Questions à trancher dans la spec, avec la recommandation :

- Format : CSV BNP, parse local. Séparateur, encodage (probablement `;` et ISO-8859-1/Windows-1252), format de date et signe des montants à relever sur un fichier réel : **l'utilisateur dépose un export CSV dans `exports-xls/`** avant la rédaction de la spec. Parse par une bibliothèque CSV éprouvée (à choisir et enregistrer dans `ARCHITECTURE.md` ; nouvelle dépendance = porte humaine GIT-7) ; le `.xls` fourni sert seulement à confirmer les colonnes.
- Pipeline : parse (`BankProfile.detect/parse`) → `ImportedRow {date, amount, label, bankCategory, bankSubcategory, fingerprint}` → dédoublonnage → rapprochement → aperçu → validation → écriture.
- Dédoublonnage : empreinte compte + date + montant + libellé + rang d'occurrence ; idempotent si on réimporte le même fichier ou un fichier qui chevauche.
- Rapprochement : réutilise `findUnmatchedIncome`, `computeSettlement`, `checkIncomeLink`, `planPaymentDebit`. Un débit lié à une échéance PENDING remplace le débit manuel (`AUTO_DEBIT_NOTE`) au lieu de le doubler.
- `Solde au dd/mm/yyyy` crée un `BalanceSnapshot` (ancre) ; l'écart avec le solde calculé s'affiche via `computeStatementGap`.
- Carte différée : date réelle extraite du libellé (`DU dd/mm/yy`), sinon date du prélèvement.
- Catégories : table de correspondance banque → `CHARGE_CATEGORIES`, « À catégoriser » reste non catégorisé, jamais deviné.
- Rien n'est écrit sans l'aperçu validé ; fichier sensible (IBAN, noms) : traité en local, jamais journalisé.

## Constats sur le CSV réel (`exports-xls/E3292319 (1).csv`, 2026-11-25)

- ASCII, séparateur `;`, 1 242 lignes du 25/10/2025 au 22/11/2026. Ligne 1 = bandeau `type;type;****2319;date du solde;;solde` (`296,60` au 24/11/2026, entités HTML dans le libellé). Puis `date dd/mm/yyyy;catégorie;sous-type;libellé;montant`. Montant à la française (`-1 300,00`, espace des milliers, virgule), signe : débit négatif, crédit positif. Pas de ligne d'en-tête de colonnes.
- Les achats carte sont dans ce compte courant : `PAIEMENT CB` / `FACTURE CARTE DU ddmmyy <commerçant> ... <montant>EUR`, 951 lignes, toutes datées du jour de prélèvement (fin de mois). La vraie date est `DU ddmmyy` dans le libellé. Pas de ligne d'en-tête carte séparée : il n'y a donc pas de compte carte distinct dans cet export.
- Aucun IBAN : un virement donne seulement `/MOTIF`, `/BEN <nom>` ou `/DE <nom>`. Le compte cible n'est pas identifiable (ex. `CHARGES MAISON /BEN CARLA ...` = compte joint). `VIREMENT INTERNE` (`VIR CPTE A CPTE EMIS`, motif `EPARGNE`) = vers l'épargne, sans compte nommé.
- Conséquence (décision D9) : l'import ne crée jamais de virement. Il importe la transaction (sortie ou entrée) et propose un lien manuel vers un virement saisi à la main, ou « virement externe » (spec 37). Même règle de non-devinette que pour les catégories.
- Types vus : PAIEMENT CB 951, PRELEVEMENT 105, VIREMENT INSTANTANE EMIS 56, VIREMENT 40, VIREMENT INSTANTANE RECU 19, COMMISSIONS 18, ECHEANCE PRET 16, RETRAIT DISTRIBUTEUR 15, VIREMENT INTERNE 8, INTERETS 2, CHEQUE 2, OPERATIONS DIVERSES 1, ANN PRLV SEPA EMIS 1. Les libellés de prélèvement et de virement reçu portent des motifs exploitables pour le rapprochement des charges et des revenus.
- Les libellés contiennent noms et références : fichier traité en local, jamais journalisé (déjà dit plus haut).

## Sous-spec 37 — virements externes et commentaire

- Besoin humain (2026-11-25) : certains virements partent vers un compte hors foyer ; côté Mbongo il n'y a qu'une soustraction. Un commentaire optionnel doit exister sur tout virement.
- Existant : `Transfer.memo` (schéma, formulaire de création « Mémo (optionnel) »). À vérifier en spec : affichage dans la liste/détail, édition, import.
- Changement : `targetAccountId` devient optionnel (virement externe = jambe SOURCE seule, pas de taux ni frais, pas de jambe TARGET). Migration Prisma (porte humaine GIT-7), `checkTransferAccounts` / `checkTransferLegs` et les calculs (patrimoine, Sankey : sortie externe = dépense non catégorisée du budget, pas neutre) à adapter. Un virement externe sort du patrimoine du foyer, contrairement à un virement interne (voir décision 2026-11-24).
- À trancher dans la spec : libellé et destinataire texte libre (« Compte externe : <nom> ») ou entité réutilisable ; recommandation : texte libre dans un champ `externalLabel`, pas d'entité tant qu'un seul usage.

## Import par API (recherche faite, non retenue pour V1)

- BNP Paribas : les API DSP2 (Hello bank! et BNP retail France) sont réservées aux prestataires de paiement agréés par une autorité nationale ([groupe BNP Paribas, API DSP2](https://group.bnpparibas/en/psd2-apis)). Le portail CIB vise les comptes d'entreprise ([developers.cib.bnpparibas.com](https://developers.cib.bnpparibas.com/)). Pas d'accès particulier trouvé.
- Boursorama : portail DSP2 ouvert aux tiers enregistrés, certificats eIDAS (QWAC, QSEAL) exigés ([Yapily, Boursorama](https://docs.yapily.com/institution-configurations/france/Boursorama)). Voie pratique pour un particulier : un agrégateur (Powens, ex-Budget Insight), couverture limitée aux comptes courants selon un fil [Finary](https://community.finary.com/t/en-cours-connexion-powens-boursorama/28424?page=4).
- Conséquence : l'invariant du master « pas d'open banking en V1 » reste vrai. Un agrégateur impose un compte tiers, des conditions d'usage et le partage des identifiants bancaires avec lui : décision humaine. Ligne ultérieure « spike agrégateur » seulement si le CSV manuel pèse trop à l'usage ; l'interface `BankProfile` doit permettre de brancher une source API plus tard sans toucher au rapprochement.
- À confirmer par l'utilisateur : tarif et conditions réels d'un agrégateur en usage personnel (non trouvés).

## Quand extraire, quand remplir le budget (conseil de fond, à reprendre dans la spec 36)

- Préparer le mois M+1 entre le 20 et le 25 de M : salaire et échéances de M+1 sont connus, le projeté de fin M+1 se lit sans bruit.
- Importer deux fois par mois : le lendemain du salaire, puis après le prélèvement de la carte différée (fin de mois). Un import tardif ne casse rien grâce à l'empreinte.
- Fin de mois : importer, lier les revenus non liés (« N revenus à lier »), contrôler l'écart de relevé, puis seulement lire le réel du mois.
- Règle de lecture : mois passé = réel, mois courant = réel + attendu, mois futur = projeté.

## Fichiers critiques

- `apps/web/src/components/dashboard/dashboard-content.tsx` (retrait chips l.165-172, import l.35, état nuqs l.56-95)
- `apps/web/src/components/dashboard/dashboard-fullscreen-charts.tsx` (reçoit l'état de scope local)
- `apps/web/src/components/dashboard/use-dashboard-data.ts`
- `packages/shared/src/domain/balance.ts`, `domain/schedule.ts`, `domain/income.ts`
- `packages/shared/src/lib/calculation/{consolidated,due-charges,remaining-to-live,sankey,donut}.ts`
- `apps/web/src/components/dashboard/cards/wealth-card.tsx`, `components/budget/steps/recap-step.tsx`
- Réutilisation : `computeMonthExpectedIncome`, `computeSettlement`, `findUnmatchedIncome`, `planPaymentDebit`, `computeStatementGap`, `scopeToMember`, `excludeClosedAccounts`.

## Vérification

- 34 rouge avant 35, vert après ; `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- 33 : lancer l'app (`npm run dev`), page dashboard sans chips, plein écran donut puis Sankey avec chips, changer de membre ne modifie pas les cartes de la page.
- 35 : naviguer sur décembre, le patrimoine affiche « Projeté fin décembre » et correspond au tableau du scénario 2.
- SPEC-3 : mettre à jour `specs/current/{dashboard,monthly-budget,provisions}/spec.md` au review.
