## ADDED Requirements

### Requirement: Member scope attributes charges by owner
With a member selected, donut and Sankey SHALL count the charges owned by that member (explicit owner, or following the account), whatever account pays them. Common charges SHALL appear only under « Foyer ».

#### Scenario: Common charge on a member account
- **WHEN** a common charge is debited from Anco's account and Anco is selected
- **THEN** the charge is not part of the donut or Sankey

#### Scenario: Member charge on a joint account
- **WHEN** a charge owned by Anco is debited from a joint account and Anco is selected
- **THEN** the charge and its payments are counted

### Requirement: Account sub-scope
With a member selected, the dashboard SHALL show one chip per account of that member (`?compte=`); picking one restricts donut and Sankey to that account. The sub-scope SHALL reset when the member changes.

#### Scenario: Pick an account
- **WHEN** Anco is selected and the user picks his current account
- **THEN** donut and Sankey show only data of that account

#### Scenario: Member change resets
- **WHEN** an account chip is active and the user selects another member or Foyer
- **THEN** no account chip stays selected
