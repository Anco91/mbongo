## ADDED Requirements

### Requirement: Charge owner
A charge SHALL have an optional owner member, or be marked common to the household. A charge with neither follows the owner of its account.

#### Scenario: Default follows the account
- **WHEN** a charge has no owner and is not common
- **THEN** its owner is the owner of its account, or common when the account has none

#### Scenario: Explicit member
- **WHEN** a charge is owned by a member
- **THEN** that member is its owner, whatever account is debited

#### Scenario: Common charge
- **WHEN** a charge is marked common
- **THEN** its owner is the household (no member)

#### Scenario: Owner and common are exclusive
- **WHEN** a charge is saved with both an owner member and common
- **THEN** the save is refused with a validation error

#### Scenario: Unknown member
- **WHEN** a charge is saved with a member that does not exist
- **THEN** the save is refused (422)

### Requirement: Owner field in charge forms
The charge create and edit forms SHALL offer « Propriétaire / débiteur » with each member, « Commun » and « Suivre le compte » (default).

#### Scenario: Pick a member
- **WHEN** the user selects a member and saves
- **THEN** the charge is owned by that member and its badge shows the member

### Requirement: Owner badge follows the charge owner
The owner badge on charge rows and details SHALL show the charge owner, not only the account owner.

#### Scenario: Common charge on a personal account
- **WHEN** a common charge is debited from a member's account
- **THEN** the badge reads « Foyer »
