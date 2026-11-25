/**
 * Locked tests for charge-owner-scope: who owns a charge.
 *
 * @module Tests/Domain/ChargeOwner
 */
import {
  chargeOwner,
  fieldsToOwnerChoice,
  ownerChoiceToFields,
} from '@mbongo/shared';

const charge = (extra: Record<string, unknown> = {}) =>
  ({ accountId: 'a1', ...extra }) as Parameters<typeof chargeOwner>[0];

describe('chargeOwner', () => {
  it('follows the account owner by default', () => {
    expect(chargeOwner(charge(), { memberId: 'm1' })).toBe('m1');
  });

  it('is common when the account has no owner', () => {
    expect(chargeOwner(charge(), { memberId: null })).toBeNull();
  });

  it('is common when the account is unknown', () => {
    expect(chargeOwner(charge(), undefined)).toBeNull();
  });

  it('uses the explicit member over the account owner', () => {
    expect(chargeOwner(charge({ memberId: 'm2' }), { memberId: 'm1' })).toBe(
      'm2'
    );
  });

  it('uses the explicit member on a joint account', () => {
    expect(chargeOwner(charge({ memberId: 'm1' }), { memberId: null })).toBe(
      'm1'
    );
  });

  it('is common when marked shared, whoever owns the account', () => {
    expect(
      chargeOwner(charge({ shared: true }), { memberId: 'm1' })
    ).toBeNull();
  });

  it('reads legacy charges without the new fields as following the account', () => {
    expect(
      chargeOwner(charge({ memberId: undefined }), { memberId: 'm1' })
    ).toBe('m1');
  });
});

describe('ownerChoiceToFields', () => {
  it('maps the empty choice to following the account', () => {
    expect(ownerChoiceToFields('')).toEqual({ memberId: null, shared: false });
  });

  it('maps « shared » to a common charge', () => {
    expect(ownerChoiceToFields('shared')).toEqual({
      memberId: null,
      shared: true,
    });
  });

  it('maps a member id to that owner', () => {
    expect(ownerChoiceToFields('m1')).toEqual({
      memberId: 'm1',
      shared: false,
    });
  });
});

describe('fieldsToOwnerChoice', () => {
  it('is the inverse of ownerChoiceToFields', () => {
    for (const choice of ['', 'shared', 'm1']) {
      expect(fieldsToOwnerChoice(ownerChoiceToFields(choice))).toBe(choice);
    }
  });

  it('reads missing fields as following the account', () => {
    expect(fieldsToOwnerChoice({})).toBe('');
  });

  it('prefers common when both are set on legacy bad data', () => {
    expect(fieldsToOwnerChoice({ memberId: 'm1', shared: true })).toBe(
      'shared'
    );
  });
});
