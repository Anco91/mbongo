# dashboard Specification

## Purpose

TBD - created from delta of change m3-maquette-refactor-features.

## Requirements

### Requirement: Page d'accueil

L'application SHALL servir le dashboard sur la route racine `/`. Aucune autre page SHALL être l'accueil par défaut.

#### Scenario: Accès racine

- **WHEN** l'utilisateur ouvre `/`
- **THEN** le dashboard s'affiche sans redirection ni 404

### Requirement: Patrimoine consolidé

L'UI du dashboard SHALL afficher le total consolidé en EUR au taux courant (taux officiel récupéré au chargement, fallback dernier taux connu — voir capability `exchange-rate`), toujours accompagné de la date du taux (« au taux du JJ/MM/AAAA ») et de la source. Le total CHF natif SHALL rester affiché en parallèle. Le sélecteur de devise du header reformate le montant principal selon la devise choisie (EUR ou CHF) — les données natives ne sont jamais réécrites.

#### Scenario: Consolidation datée

- **GIVEN** un taux courant disponible (officiel ou fallback)
- **WHEN** le dashboard se charge
- **THEN** le total consolidé EUR est affiché avec la mention de la date et de la source du taux
- **AND** le total CHF est affiché en parallèle

#### Scenario: Aucun taux

- **GIVEN** aucun taux disponible (API hors ligne, aucun transfert)
- **WHEN** le dashboard se charge
- **THEN** le total consolidé EUR est indiqué indisponible, sans erreur

#### Scenario: Sélecteur en CHF

- **GIVEN** le sélecteur de devise du header est sur CHF
- **WHEN** le dashboard se charge avec un taux disponible
- **THEN** le montant principal est affiché en CHF et le contre-total en EUR en parallèle

### Requirement: Détail du patrimoine consolidé

Au survol ou au focus clavier de la carte « Patrimoine consolidé », l'UI SHALL lister chaque terme du patrimoine : un compte actif par ligne, avec son nom, sa devise native et son solde signé. Les actifs sont triés par solde décroissant, puis les découverts du plus négatif au moins négatif ; les soldes nuls et les comptes clos sont exclus.

#### Scenario: Survol avec un découvert

- **GIVEN** un compte épargne à +1000 CHF et un compte courant à -500 EUR
- **WHEN** l'utilisateur survole ou focalise la carte
- **THEN** le panneau liste « + 1 000 CHF Épargne » puis « − 500 EUR Compte courant » marqué découvert

### Requirement: Sankey des flux du mois

L'UI du dashboard SHALL afficher le Sankey des flux du mois choisi, coloré par type (revenus, comptes, dépenses). Chaque nœud SHALL porter son nom ET son montant agrégé, en carte comme en plein écran — le graphe se lit sans survol. La jambe revenus → comptes SHALL partir des revenus attendus du mois (montant confirmé s'il existe, sinon montant prévu) : un revenu confirmé est un flux réalisé, un revenu non confirmé est un flux « prévu ». Une transaction positive sans lien à une source de revenu ni transfert n'y figure pas tant qu'elle n'est pas rapprochée. Un transfert entre deux comptes quelconques est un flux compte → compte, dans la devise du compte cible, jamais un revenu : un compte joint qui ne reçoit que des virements n'a aucun revenu inventé. Les échéances à venir du mois choisi SHALL être représentées comme des flux « prévus ». Les flux prévus (revenus et charges) SHALL être rendus distincts des flux réalisés par une opacité plus faible, sans motif rayé.

#### Scenario: Flux avec données

- **GIVEN** des transactions, transferts et échéances payées sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** chaque nœud affiche son nom et son montant (ex. « Salaire · 3 000 € »)

#### Scenario: Mois sans données

- **GIVEN** aucune donnée sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche un état vide lisible, sans erreur

#### Scenario: Mois préparé avec charges à venir

- **GIVEN** un mois préparé avec des échéances à venir et aucune dépense réalisée
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche la jambe comptes → charges comme flux prévu, distinct du réalisé

#### Scenario: Revenu attendu non confirmé

- **GIVEN** une source de revenu active due ce mois, sans transaction confirmée
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche un flux prévu source → compte au montant prévu

#### Scenario: Revenu confirmé

- **GIVEN** cette source confirmée sur le mois (transaction liée à la source et au mois)
- **WHEN** le dashboard se charge
- **THEN** un seul flux réalisé au montant confirmé s'affiche, jamais prévu et confirmé à la fois

#### Scenario: Transaction positive non rapprochée

- **GIVEN** une transaction positive sans source de revenu ni transfert
- **WHEN** le dashboard se charge
- **THEN** elle ne produit aucun flux de revenu dans le Sankey

### Requirement: Donut des dépenses par catégorie

L'UI du dashboard SHALL afficher le donut des dépenses du mois choisi avec le total au centre de l'anneau. En plein écran, chaque segment SHALL porter son nom de catégorie ET son pourcentage posés sur le bandeau coloré, lisibles sans survol — pas de texte à côté du graphe (pas de légende séparée). Les échéances à venir du mois choisi SHALL compter dans les dépenses par catégorie comme part « prévue », rendue distincte du réalisé ; le total au centre SHALL être la somme du prévu et du réalisé.

#### Scenario: Total au centre

- **GIVEN** 4 905 € de dépenses catégorisées sur le mois
- **WHEN** le donut s'affiche
- **THEN** « 4 905 € » (devise d'affichage courante) apparaît au centre de l'anneau

#### Scenario: Plein écran

- **WHEN** l'utilisateur ouvre le donut en plein écran
- **THEN** chaque segment porte son nom de catégorie et son pourcentage dans l'anneau, sans survol ni légende séparée

#### Scenario: Répartition affichée

- **GIVEN** des dépenses catégorisées sur le mois
- **WHEN** le dashboard se charge
- **THEN** chaque catégorie occupe une part proportionnelle du donut avec son montant

#### Scenario: Donut d'un mois préparé sans paiement

- **GIVEN** un mois préparé avec des charges à venir et aucun paiement réalisé
- **WHEN** le donut s'affiche
- **THEN** les catégories des charges à venir occupent une part prévue distincte et le total au centre est non nul

### Requirement: Ventilation du donut par sous-catégorie

Le donut SHALL conserver un segment par catégorie. La légende du plein écran SHALL lister, sous chaque catégorie qui porte au moins une sous-catégorie renseignée, ces sous-catégories avec leur montant, par montant décroissant (à égalité, ordre alphabétique). Les dépenses sans sous-catégorie (charge sans sous-catégorie, transaction) SHALL former une ligne « Autres ». Une catégorie sans sous-catégorie renseignée SHALL n'avoir aucune ligne de détail. Prévu et réalisé SHALL fusionner dans la ventilation.

#### Scenario: Catégorie ventilée

- **GIVEN** en Abonnements un Mobile à 30 € et un Internet à 50 €, payés
- **WHEN** l'utilisateur ouvre le donut en plein écran
- **THEN** la légende montre « Abonnements 80 € » puis « Internet 50 € » et « Mobile 30 € »

#### Scenario: Reste de la catégorie

- **GIVEN** en Abonnements un Mobile à 30 € et une charge sans sous-catégorie à 20 €
- **WHEN** la légende s'affiche
- **THEN** elle montre « Mobile 30 € » et « Autres 20 € »

#### Scenario: Aucune sous-catégorie

- **GIVEN** une catégorie dont aucune charge n'a de sous-catégorie
- **WHEN** la légende s'affiche
- **THEN** la catégorie n'a pas de ligne de détail

### Requirement: Comptes clôturés dans les charts

Le dashboard SHALL proposer une case « Afficher les comptes clôturés » au-dessus du Sankey et du donut. Par défaut elle est décochée : le Sankey et le donut SHALL exclure les transactions, transferts, charges et paiements liés à un compte clôturé. Cocher la case SHALL les réintégrer, la décocher les retirer, sans nouvelle requête. Patrimoine consolidé, soldes et alertes SHALL ignorer cette case. Le choix n'est pas persisté.

#### Scenario: Compte clôturé masqué par défaut

- **GIVEN** un compte clôturé qui porte des transactions sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** ses flux n'apparaissent ni dans le Sankey ni dans le donut

#### Scenario: Réintégration

- **GIVEN** la case décochée
- **WHEN** l'utilisateur coche « Afficher les comptes clôturés »
- **THEN** le Sankey et le donut incluent à nouveau les flux du compte clôturé
- **AND** décocher la case les retire de nouveau

#### Scenario: Patrimoine inchangé

- **WHEN** l'utilisateur coche ou décoche la case
- **THEN** le patrimoine consolidé, les soldes et les alertes ne changent pas

### Requirement: Échéances du mois

L'UI du dashboard SHALL afficher les échéances du mois choisi (navigation mensuelle) : 3 visibles par défaut, les autres révélées par paquets (« afficher les autres ») avec le geste mobile natif, sans barre de pagination web. Chaque échéance SHALL porter le badge « qui paie » de son compte débité.

#### Scenario: Échéances d'un mois passé

- **GIVEN** l'utilisateur navigue sur un mois passé
- **WHEN** le dashboard se charge
- **THEN** les échéances de ce mois s'affichent (payées, en retard, à venir)

#### Scenario: Beaucoup d'échéances

- **GIVEN** 10 échéances sur le mois choisi
- **WHEN** la liste se charge
- **THEN** 3 échéances sont visibles et « afficher les autres » révèle le reste par paquets de 5

#### Scenario: Liste tronquée

- **GIVEN** plus de 3 échéances au mois
- **THEN** les premières sont affichées et un bouton révèle les suivantes

### Requirement: Sélecteur de devise d'affichage

Le sélecteur EUR/CHF du header SHALL être visible uniquement sur le dashboard (`/`) : il pilote l'affichage consolidé et les charts du dashboard, avec la sélection conservée pendant la navigation et au rechargement. Les autres vues SHALL le masquer (il n'y reformate rien).

#### Scenario: Changement de devise

- **GIVEN** le dashboard affiché en EUR
- **WHEN** l'utilisateur bascule sur CHF dans le header
- **THEN** patrimoine consolidé et charts s'affichent en CHF sans rechargement

#### Scenario: Persistance de la sélection

- **GIVEN** la devise CHF sélectionnée
- **WHEN** l'utilisateur navigue vers une autre vue ou recharge l'app
- **THEN** la devise CHF reste sélectionnée

#### Scenario: Masqué hors dashboard

- **GIVEN** l'utilisateur navigue vers /charges, /transfers ou /accounts
- **WHEN** le header s'affiche
- **THEN** le sélecteur EUR/CHF n'y apparaît pas

### Requirement: Navigation mensuelle

Le dashboard SHALL permettre de consulter les mois passés et futurs : un curseur « ‹ mois › » dans la carte, et un swipe horizontal (geste tactile natif PWA) pour changer de mois. Sankey, donut, échéances, provisions et totaux du mois SHALL se recalculer pour le mois choisi ; le patrimoine consolidé et les alertes restent l'état du jour. Le curseur SHALL démarrer sur le mois courant. Les données du mois SHALL être requêtées pour le mois choisi (fenêtre sur la date d'échéance), sans dépendre d'un volume global tronqué ; les données préchargées côté serveur et les requêtes client SHALL utiliser la même requête du mois.

#### Scenario: Mois précédent

- **GIVEN** le dashboard sur le mois courant
- **WHEN** l'utilisateur touche « ‹ » ou swipe vers la droite
- **THEN** le mois précédent s'affiche avec ses flux et ses échéances

#### Scenario: Swipe

- **GIVEN** le dashboard ouvert sur mobile
- **WHEN** l'utilisateur swipe horizontalement sur la zone des charts
- **THEN** le mois change (avancer/reculer selon la direction)

#### Scenario: Mois au-delà des premières échéances globales

- **GIVEN** plus de 100 échéances dans la base, dont une partie hors du mois choisi
- **WHEN** le dashboard affiche un mois dont les échéances sont au-delà des 100 premières
- **THEN** les échéances, le Sankey et le donut de ce mois sont corrects

### Requirement: Invitation à préparer le mois courant

Le dashboard SHALL afficher une carte « Budget de <mois> — à préparer » lorsque le mois courant n'a pas été préparé. La carte SHALL nommer le mois en toutes lettres, rappeler le total des charges du mois et proposer l'action principale « Préparer le mois » vers le parcours guidé. La carte SHALL disparaître une fois le mois préparé.

#### Scenario: Mois courant non préparé

- **WHEN** le dashboard s'ouvre en novembre 2026 et que novembre n'est pas préparé
- **THEN** la carte « Budget de novembre — à préparer » est affichée avec le bouton « Préparer le mois »

#### Scenario: Mois courant préparé

- **WHEN** novembre 2026 est marqué préparé
- **THEN** la carte d'invitation n'est plus affichée

### Requirement: Accès à la modification d'un mois préparé

Une fois le mois courant préparé, le dashboard SHALL conserver un accès discret à la réouverture du budget du mois, sans réafficher l'invitation. L'accès SHALL ouvrir le parcours sur les données existantes du mois.

#### Scenario: Réouverture depuis le dashboard

- **WHEN** l'utilisateur appuie sur « Modifier » depuis le budget du mois préparé
- **THEN** le parcours s'ouvre sur le mois courant avec ses revenus, charges et comptes déjà renseignés

### Requirement: Invitation limitée au mois courant

L'invitation au budget SHALL concerner uniquement le mois courant. La navigation mensuelle du dashboard SHALL continuer d'afficher les flux, échéances et provisions des mois passés ou futurs sans proposer de préparation pour ces mois.

#### Scenario: Consultation d'un mois passé

- **WHEN** l'utilisateur fait reculer le curseur mensuel sur octobre 2026
- **THEN** les cartes du mois s'affichent normalement et aucune invitation à préparer octobre n'apparaît


### Requirement: Portée par membre des graphiques

Le plein écran du Sankey et du donut SHALL proposer un bouton « Foyer » (défaut, tous les comptes) et un bouton par membre du foyer ; la page du dashboard n'affiche aucun de ces boutons et ses cartes Sankey et donut restent toujours celles du foyer, même si l'URL porte `?membre=`. Choisir un membre en plein écran SHALL restreindre le Sankey et le donut aux comptes de ce membre (et à leurs revenus, charges, échéances, transactions ; un transfert n'est gardé que si ses deux comptes sont à ce membre). Les comptes sans membre (compte joint) n'apparaissent que dans « Foyer » : un indice « hors comptes joints » SHALL être affiché près des boutons dès qu'un membre est choisi. Le membre choisi SHALL vivre dans l'URL (`?membre=<id>`, absent = Foyer) : l'URL partagée ou rechargée restitue la vue, et un identifiant inconnu retombe sur « Foyer ». Les charges suivent leur propriétaire effectif (membre choisi sur la charge, sinon membre du compte ; les charges « Commun » n'apparaissent que dans « Foyer »), et non plus seulement leur compte. Quand un membre est choisi, une seconde rangée SHALL proposer « Tous les comptes » et un bouton par compte courant de ce membre (les comptes d'épargne ne sont pas proposés) ; le compte choisi vit dans l'URL (`?compte=<id>`) et restreint comptes, transactions, revenus, transferts et charges (débitées sur ce compte) à ce compte. `?compte=` est ignoré s'il n'est pas un compte du membre choisi, et remis à zéro quand le membre change. Le patrimoine, les alertes et les échéances du mois restent ceux du foyer.

#### Scenario: Dépenses d'un seul membre

- **WHEN** l'utilisateur choisit un membre
- **THEN** le donut et le Sankey ne montrent que les dépenses des comptes de ce membre, et « Foyer » rétablit la vue complète

#### Scenario: Un seul compte d'un membre

- **GIVEN** un membre choisi ayant deux comptes
- **WHEN** l'utilisateur choisit l'un des comptes
- **THEN** l'URL porte `?compte=<id>` et le donut et le Sankey ne montrent que ce compte ; changer de membre remet « Tous les comptes »

#### Scenario: Cartes de la page toujours Foyer

- **GIVEN** l'URL porte `?membre=<id>`
- **WHEN** le dashboard se charge
- **THEN** aucun bouton Foyer / membre n'est affiché sur la page et le Sankey et le donut de la page montrent le foyer ; le plein écran applique le membre

#### Scenario: Comptes d'épargne non proposés

- **GIVEN** un membre choisi en plein écran ayant un compte courant et un compte d'épargne
- **WHEN** la rangée de comptes s'affiche
- **THEN** elle propose « Tous les comptes » et le compte courant, pas le compte d'épargne

### Requirement: Patrimoine net des charges dues

La carte patrimoine SHALL, dès que des charges du mois courant restent à payer (paiements `PENDING`, hors charges provisionnées), afficher « dont charges dues », le « Patrimoine net » (patrimoine consolidé moins ces charges) et le « Reste à vivre (comptes) » (soldes des comptes actifs hors épargne, cartes de crédit comprises, moins ces charges). Ces lignes SHALL ignorer le curseur mensuel et rester masquées sans charge due ou sans taux de change utile.

#### Scenario: Charges dues ce mois

- **WHEN** le mois courant a 500 EUR de paiements `PENDING` et que le patrimoine est de 10 000 EUR
- **THEN** la carte affiche 500 EUR de charges dues et un patrimoine net de 9 500 EUR
