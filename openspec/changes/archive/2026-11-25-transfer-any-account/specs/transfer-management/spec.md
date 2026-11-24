# Delta — transfer-management

## ADDED Requirements

### Requirement: Transfer between any two open accounts
A household member MAY transfer between any two distinct open accounts, whatever their owner or currency. The same account on both sides, or a closed account, is refused.

#### Scenario: Same currency, instant
- GIVEN two open CHF accounts
- WHEN a transfer of 1000 CHF is created
- THEN it is COMPLETED at once, received = sent, rate 1, fees 0, a debit and a credit are recorded

#### Scenario: Different currency
- GIVEN an open CHF account and an open EUR account (either direction)
- WHEN a transfer is created with a rate
- THEN it is ESTIMATED and completed later with the received amount, as before

#### Scenario: Closed account
- WHEN the source or target account is closed
- THEN the transfer is refused (422)
