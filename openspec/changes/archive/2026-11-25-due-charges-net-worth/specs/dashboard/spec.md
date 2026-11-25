## ADDED Requirements

### Requirement: Net worth net of due charges
The wealth card SHALL show the consolidated net worth minus the charges due this month and not yet paid, and the amount of those charges.

#### Scenario: Pending payments reduce net worth
- **WHEN** the current month has `PENDING` payments totalling 500 EUR and net worth is 10 000 EUR
- **THEN** the card shows « dont charges dues » 500 EUR and a net total of 9 500 EUR

#### Scenario: Paid and provisioned payments are not counted
- **WHEN** a payment is `PAID`, or its charge is `provisioned`
- **THEN** it is not part of the due charges

### Requirement: Reste à vivre (comptes)
The wealth card SHALL show the balances of active non-savings accounts minus the due charges, labelled « Reste à vivre (comptes) ».

#### Scenario: Savings excluded
- **WHEN** a `SAVINGS` account holds 5 000 EUR and a current account holds 2 000 EUR with 500 EUR due
- **THEN** the figure is 1 500 EUR
