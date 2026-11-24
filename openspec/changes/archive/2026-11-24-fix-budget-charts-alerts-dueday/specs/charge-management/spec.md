# Spec Delta — charge-management

## MODIFIED Requirements

### Requirement: Formulaire de charge adapté au type

Le formulaire de création SHALL adapter ses champs au type de charge choisi : récurrence + jour de prélèvement pour les fixes ; N échéances + première date pour les échelonnées ; fin d'engagement pour les temporaires ; date pour les ponctuelles ; date prévue + option provision pour les à venir. Le jour de prélèvement (1–31) SHALL être proposé pour les charges fixes récurrentes mensuelles, avec le début du mois (1) comme valeur par défaut, et SHALL être masqué pour les autres fréquences. La date de début SHALL proposer par défaut le premier jour du mois courant.

#### Scenario: Champs conditionnels par type

- **WHEN** l'utilisateur choisit le type `INSTALLMENT`
- **THEN** le formulaire affiche les champs "nombre d'échéances" et "première échéance", et masque les champs des autres types (récurrence, fin d'engagement…)

#### Scenario: Choix du jour de prélèvement

- **GIVEN** le type `FIXED_RECURRING` choisi
- **WHEN** le formulaire s'affiche
- **THEN** le jour de prélèvement est proposé, positionné par défaut sur le début du mois, et modifiable au jour 5

#### Scenario: Jour masqué hors mensuel

- **GIVEN** le type `INSTALLMENT` choisi
- **WHEN** le formulaire s'affiche
- **THEN** le jour de prélèvement n'est pas proposé

### Requirement: Génération des échéances à la création

La création d'une charge SHALL être transactionnelle : la charge et ses échéances générées selon le type (récurrentes par période jusqu'à l'horizon, N échéances pour les échelonnées, une seule pour les ponctuelles et les à venir) sont persistées dans une même transaction. En cas d'échec, aucune charge ne SHALL être créée (tout-ou-rien) ; l'utilisateur peut resoumettre le formulaire sans état intermédiaire. Aucune échéance orpheline ne SHALL exister après une création réussie. La génération mensuelle SHALL ancrer la récurrence sur le jour de prélèvement choisi (ou, à défaut, le jour de la date de début) et SHALL inclure le mois d'ancrage même si le jour est déjà passé : l'échéance du mois courant est créée et le statut « dû » en est dérivé. Le jour choisi SHALL être adapté à la longueur du mois (le 31 tombe le 28, ou le 29 en année bissextile, pour février).

#### Scenario: Charge échelonnée en 4 prélèvements

- **WHEN** l'utilisateur crée "Impôt FR", type `INSTALLMENT`, 4 échéances de 312 EUR, première échéance au 25/09
- **THEN** la charge et ses 4 échéances sont créées aux dates consécutives prévues, au statut `PENDING`, dans une seule opération

#### Scenario: Échec de génération récupérable

- **WHEN** la persistance groupée des échéances échoue au cours de la transaction de création
- **THEN** la charge n'est pas créée (tout-ou-rien), la réponse est une erreur lisible, la base ne contient ni charge ni échéance orpheline, et l'utilisateur récupère en resoumettant simplement le formulaire

#### Scenario: Échéance au jour choisi, mois courant inclus

- **GIVEN** une charge fixe mensuelle créée le 23 du mois avec le jour de prélèvement 5
- **WHEN** les échéances sont générées
- **THEN** une échéance existe le 5 du mois courant (statut « dû » dérivé) puis le 5 de chaque mois suivant

#### Scenario: Jour 31 en mois court

- **WHEN** le jour de prélèvement 31 est choisi et le mois comporte 28 jours
- **THEN** l'échéance tombe le 28 (le 29 en année bissextile)

### Requirement: Édition du calendrier d'une charge

La modification d'une charge touchant son calendrier (montant, fréquence, dates, jour de prélèvement, nombre d'échéances) SHALL remplacer les futures échéances au statut `PENDING` non rapprochées par le nouveau calendrier, dans une même transaction. Les échéances au statut `PAID` ou rapprochées SHALL rester strictement inchangées (l'historique des paiements est préservé). Une édition ne touchant pas le calendrier SHALL laisser toutes les échéances en l'état. Les charges existantes sans jour de prélèvement SHALL être conservées en l'état, sans migration de données.

#### Scenario: Révision du montant d'une charge fixe

- **WHEN** l'utilisateur porte le loyer de 1 850 à 1 900 CHF
- **THEN** toutes les échéances futures `PENDING` non rapprochées affichent 1 900 CHF, et les échéances `PAID` conservent leur montant d'origine

#### Scenario: Édition préservant l'historique

- **WHEN** une charge échelonnée a 2 échéances `PAID` sur 4 et l'utilisateur corrige la date de la 4ᵉ échéance via l'édition de la charge
- **THEN** les 2 échéances payées restent intouchées et seules les échéances futures sont recalculées

#### Scenario: Changement du jour de prélèvement

- **GIVEN** une charge fixe mensuelle avec des échéances futures `PENDING`
- **WHEN** l'utilisateur porte le jour de prélèvement au 5
- **THEN** les échéances futures `PENDING` non rapprochées sont recalculées au 5 de chaque mois, et les échéances payées ou rapprochées restent inchangées
