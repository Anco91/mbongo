# exchange-rate Specification (delta)

## ADDED Requirements

### Requirement: Taux officiel EUR→CHF

Le système SHALL récupérer le taux de change EUR→CHF officiel au chargement du dashboard via une API publique gratuite (Frankfurter, taux de la BCE), sans clé ni authentification. Le taux récupéré SHALL être mis en cache pour la session : un rechargement du dashboard pendant la même session ne re-fetch pas si un taux de moins de 12 h est en cache.

#### Scenario: Chargement avec réseau

- **GIVEN** une connexion réseau disponible
- **WHEN** l'utilisateur ouvre le dashboard
- **THEN** le taux affiché est le taux officiel du jour (source Frankfurter/BCE)

#### Scenario: Rechargement dans la session

- **GIVEN** un taux récupéré il y a moins de 12 h dans la session
- **WHEN** le dashboard est rechargé
- **THEN** le taux en cache est utilisé sans nouvel appel réseau

### Requirement: Fallback dernier taux connu

Si l'API est indisponible (réseau, erreur, hors ligne), le système SHALL utiliser le dernier taux connu des transferts (taux effectif du dernier transfert réalisé, sinon taux estimé), sans erreur visible. L'absence totale de taux SHALL afficher le patrimoine EUR comme indisponible, sans crash.

#### Scenario: API indisponible

- **GIVEN** l'API Frankfurter ne répond pas
- **AND** un transfert réalisé existe avec un taux effectif
- **WHEN** le dashboard se charge
- **THEN** le patrimoine consolidé utilise le taux effectif du dernier transfert, avec sa date

### Requirement: Affichage de la source et de la date

L'UI SHALL toujours afficher la date du taux utilisé (« au taux du JJ/MM/AAAA ») et SHALL distinguer le taux officiel du taux de secours (mention de la source). Aucun taux fictif ou deviné SHALL être utilisé.

#### Scenario: Taux officiel affiché

- **GIVEN** le taux Frankfurter du jour est utilisé
- **WHEN** le dashboard se charge
- **THEN** la mention « au taux du JJ/MM/AAAA · BCE » (ou source équivalente) est visible

#### Scenario: Taux de secours affiché

- **GIVEN** le fallback transferts est utilisé
- **WHEN** le dashboard se charge
- **THEN** la mention indique la date du transfert et que le taux est le dernier taux connu, pas un taux du jour
