/**
 * Tests for Month Navigation Helpers
 */

import {
  monthKeyToDate,
  monthLongLabel,
  monthBounds,
  currentMonthKey,
  isValidMonthKey,
} from '@/lib/month-navigation';

describe('Month Navigation Helpers', () => {
  describe('monthKeyToDate', () => {
    it('convertit une clé mensuelle en date à midi', () => {
      const date = monthKeyToDate('2026-11');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(10); // Novembre = 10 (0-indexed)
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(12);
    });

    it("gère le passage d'année", () => {
      const date = monthKeyToDate('2027-01');
      expect(date.getFullYear()).toBe(2027);
      expect(date.getMonth()).toBe(0); // Janvier = 0
    });
  });

  describe('monthLongLabel', () => {
    it('retourne le libellé long en français', () => {
      const label = monthLongLabel('2026-11');
      expect(label).toBe('novembre 2026');
    });

    it("gère les mois sans heure d'été", () => {
      const label = monthLongLabel('2026-01');
      expect(label).toBe('janvier 2026');
    });
  });

  describe('monthBounds', () => {
    it('retourne les bornes du mois', () => {
      const bounds = monthBounds('2026-11');
      expect(bounds.start.getDate()).toBe(1);
      expect(bounds.start.getMonth()).toBe(10);
      expect(bounds.end.getDate()).toBe(30); // Novembre a 30 jours
      expect(bounds.end.getMonth()).toBe(10);
    });

    it('gère février correctement', () => {
      const bounds = monthBounds('2026-02');
      expect(bounds.start.getDate()).toBe(1);
      expect(bounds.end.getDate()).toBe(28); // 2026 n'est pas bissextile
    });
  });

  describe('currentMonthKey', () => {
    it('retourne la clé du mois courant', () => {
      const key = currentMonthKey();
      expect(key).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    });
  });

  describe('isValidMonthKey', () => {
    it('valide les clés correctes', () => {
      expect(isValidMonthKey('2026-11')).toBe(true);
      expect(isValidMonthKey('2027-01')).toBe(true);
      expect(isValidMonthKey('2026-12')).toBe(true);
    });

    it('rejette les clés invalides', () => {
      expect(isValidMonthKey('2026-13')).toBe(false);
      expect(isValidMonthKey('2026-00')).toBe(false);
      expect(isValidMonthKey('2026-1')).toBe(false);
      expect(isValidMonthKey('invalid')).toBe(false);
    });
  });
});
