/**
 * Tests for routeChrome — titles, eyebrows and sub-view detection.
 *
 * @module Tests/Lib/Routes
 */

import { routeChrome } from '@/lib/routes';

describe('routeChrome', () => {
  it('names every main destination', () => {
    expect(routeChrome('/').title).toBe('Tableau de bord');
    expect(routeChrome('/charges').title).toBe('Charges');
    expect(routeChrome('/transfers').title).toBe('Transferts');
    expect(routeChrome('/accounts').title).toBe('Comptes');
    expect(routeChrome('/household').title).toBe('Membres du foyer');
    expect(routeChrome('/schedule').title).toBe('Échéances à venir');
    expect(routeChrome('/alerts').title).toBe('Alertes');
  });

  it('keeps main routes out of sub-views', () => {
    expect(routeChrome('/alerts').isSubView).toBe(false);
    expect(routeChrome('/household').isSubView).toBe(false);
  });

  it('treats create routes as sub-views with a creation eyebrow', () => {
    expect(routeChrome('/charges/new')).toEqual({
      title: 'Nouvelle charge',
      eyebrow: 'Création',
      isSubView: true,
    });
    expect(routeChrome('/accounts/new').title).toBe('Nouveau compte');
    expect(routeChrome('/transfers/new').title).toBe('Nouveau transfert');
  });

  it('treats edit routes as sub-views with an edition eyebrow', () => {
    expect(routeChrome('/charges/abc/edit')).toEqual({
      title: 'Modifier la charge',
      eyebrow: 'Édition',
      isSubView: true,
    });
    expect(routeChrome('/accounts/abc/edit').title).toBe('Modifier le compte');
  });

  it('treats the payment detail as a sub-view', () => {
    expect(routeChrome('/schedule/pay_1')).toEqual({
      title: "Détail de l'échéance",
      eyebrow: 'Détail',
      isSubView: true,
    });
  });

  it('falls back to the section title for an unknown path', () => {
    expect(routeChrome('/charges/abc').title).toBe('Charges');
    expect(routeChrome('/inconnu').title).toBe('Mbongo');
  });
});
