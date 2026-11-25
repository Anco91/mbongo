/**
 * Route chrome — single source of truth for the header title, the header
 * eyebrow and sub-view detection (design D4). Pure: no React, no I/O.
 *
 * A sub-view covers the shell: the tab bar is hidden and the header shows
 * a back button instead of the alerts bell.
 *
 * @module Lib/Routes
 */

export interface RouteChrome {
  /** Header title for the current pathname. */
  title: string;
  /** Eyebrow shown above the title on sub-views. */
  eyebrow: string;
  /** True when the route is a create/edit/detail screen. */
  isSubView: boolean;
}

const MAIN_ROUTES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/charges': 'Charges',
  '/transfers': 'Transferts',
  '/accounts': 'Comptes',
  '/household': 'Membres du foyer',
  '/schedule': 'Échéances à venir',
  '/alerts': 'Alertes',
  '/incomes/unmatched': 'Revenus à lier',
  '/import': 'Import du relevé',
};

const CREATE_ROUTES: Record<string, string> = {
  '/charges/new': 'Nouvelle charge',
  '/accounts/new': 'Nouveau compte',
  '/transfers/new': 'Nouveau transfert',
};

const EDIT_ROUTES: Record<string, string> = {
  charges: 'Modifier la charge',
  accounts: 'Modifier le compte',
};

const SCHEDULE_DETAIL = /^\/schedule\/[^/]+$/;
const EDIT_VIEW = /^\/(charges|accounts)\/[^/]+\/edit$/;

const FALLBACK_TITLE = 'Mbongo';

/** Resolve the chrome (title, eyebrow, sub-view flag) for a pathname. */
export function routeChrome(pathname: string): RouteChrome {
  const createTitle = CREATE_ROUTES[pathname];
  if (createTitle) {
    return { title: createTitle, eyebrow: 'Création', isSubView: true };
  }

  const editMatch = EDIT_VIEW.exec(pathname);
  if (editMatch) {
    return {
      title: EDIT_ROUTES[editMatch[1]] ?? FALLBACK_TITLE,
      eyebrow: 'Édition',
      isSubView: true,
    };
  }

  if (SCHEDULE_DETAIL.test(pathname)) {
    return {
      title: "Détail de l'échéance",
      eyebrow: 'Détail',
      isSubView: true,
    };
  }

  const section = `/${pathname.split('/')[1] ?? ''}`;
  return {
    title: MAIN_ROUTES[pathname] ?? MAIN_ROUTES[section] ?? FALLBACK_TITLE,
    eyebrow: '',
    isSubView: false,
  };
}
