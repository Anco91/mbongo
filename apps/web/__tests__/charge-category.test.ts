/**
 * Charge sub-category rules (spec charge-subcategories).
 *
 * @module Tests/Charges/ChargeCategory
 */
import {
  CHARGE_CATEGORIES,
  checkChargeSubcategory,
  createChargeSchema,
  chargeSchema,
  listSubcategories,
  resolveChargeSubcategory,
} from '@mbongo/shared';

const baseCharge = {
  label: 'Forfait mobile',
  type: 'FIXED_RECURRING' as const,
  amount: 25,
  currency: 'CHF' as const,
  accountId: 'account-1',
  category: 'Abonnements',
  startDate: '2026-11-01',
  endDate: null,
  frequency: 'monthly' as const,
  installments: null,
  provisioned: false,
};

describe('CHARGE_CATEGORIES taxonomy', () => {
  it('keeps the seven categories of the forms in order', () => {
    expect(Object.keys(CHARGE_CATEGORIES)).toEqual([
      'Logement',
      'Santé',
      'Impôts & taxes',
      'Assurances',
      'Abonnements',
      'Médias',
      'Divers',
    ]);
  });

  it('files LAMal under Santé and mobile, internet, sport under Abonnements', () => {
    expect(CHARGE_CATEGORIES['Santé']).toContain('LAMal');
    expect(CHARGE_CATEGORIES['Abonnements']).toEqual(
      expect.arrayContaining(['Mobile', 'Internet', 'Sport'])
    );
    expect(CHARGE_CATEGORIES['Assurances']).toEqual(
      expect.arrayContaining(['Auto', 'Garantie'])
    );
  });

  it('has no duplicate sub-category inside a category', () => {
    for (const subs of Object.values(CHARGE_CATEGORIES)) {
      expect(new Set(subs).size).toBe(subs.length);
    }
  });

  it('gives Divers no sub-category', () => {
    expect(CHARGE_CATEGORIES['Divers']).toEqual([]);
  });
});

describe('listSubcategories', () => {
  it('lists the sub-categories of a known category', () => {
    expect(listSubcategories('Abonnements')).toEqual(
      CHARGE_CATEGORIES['Abonnements']
    );
  });

  it('returns an empty list for an unknown or legacy category', () => {
    expect(listSubcategories('rent')).toEqual([]);
    expect(listSubcategories('Vie courante')).toEqual([]);
  });
});

describe('checkChargeSubcategory', () => {
  it('accepts a null sub-category for any category, known or legacy', () => {
    expect(checkChargeSubcategory('Logement', null)).toBeNull();
    expect(checkChargeSubcategory('Divers', null)).toBeNull();
    expect(checkChargeSubcategory('rent', null)).toBeNull();
  });

  it('accepts a sub-category that belongs to its category', () => {
    expect(checkChargeSubcategory('Abonnements', 'Mobile')).toBeNull();
    expect(checkChargeSubcategory('Santé', 'LAMal')).toBeNull();
  });

  it('refuses a sub-category of another category', () => {
    expect(checkChargeSubcategory('Logement', 'Mobile')).toEqual(
      expect.any(String)
    );
  });

  it('refuses a sub-category on a category without any', () => {
    expect(checkChargeSubcategory('Divers', 'Mobile')).toEqual(
      expect.any(String)
    );
  });

  it('refuses a sub-category on an unknown category', () => {
    expect(checkChargeSubcategory('rent', 'Mobile')).toEqual(
      expect.any(String)
    );
  });

  it('is case sensitive', () => {
    expect(checkChargeSubcategory('Abonnements', 'mobile')).toEqual(
      expect.any(String)
    );
  });
});

describe('resolveChargeSubcategory', () => {
  const existing = { category: 'Abonnements', subcategory: 'Mobile' };

  it('keeps the stored value when the patch touches neither field', () => {
    expect(resolveChargeSubcategory(existing, {})).toBe('Mobile');
  });

  it('keeps the stored value when the category is re-sent unchanged', () => {
    expect(
      resolveChargeSubcategory(existing, { category: 'Abonnements' })
    ).toBe('Mobile');
  });

  it('resets to null when the category changes without a sub-category', () => {
    expect(
      resolveChargeSubcategory(existing, { category: 'Logement' })
    ).toBeNull();
  });

  it('takes the explicit value, including when the category changes too', () => {
    expect(resolveChargeSubcategory(existing, { subcategory: 'Sport' })).toBe(
      'Sport'
    );
    expect(
      resolveChargeSubcategory(existing, {
        category: 'Santé',
        subcategory: 'LAMal',
      })
    ).toBe('LAMal');
  });

  it('clears the value on an explicit null', () => {
    expect(
      resolveChargeSubcategory(existing, { subcategory: null })
    ).toBeNull();
  });
});

describe('charge schemas with sub-category', () => {
  it('defaults subcategory to null on create', () => {
    const parsed = createChargeSchema.parse(baseCharge);
    expect(parsed.subcategory).toBeNull();
  });

  it('accepts a valid pair on create', () => {
    const parsed = createChargeSchema.parse({
      ...baseCharge,
      subcategory: 'Mobile',
    });
    expect(parsed.subcategory).toBe('Mobile');
  });

  it('rejects a sub-category foreign to the category on create', () => {
    const result = createChargeSchema.safeParse({
      ...baseCharge,
      category: 'Logement',
      subcategory: 'Mobile',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['subcategory']);
    }
  });

  it('keeps category a free string (legacy rows still parse)', () => {
    const row = {
      ...baseCharge,
      id: 'charge-1',
      category: 'rent',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    };
    expect(chargeSchema.safeParse(row).success).toBe(true);
    expect(chargeSchema.parse(row).subcategory).toBeNull();
  });
});
