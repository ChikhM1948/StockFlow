import { Brand } from '@/api/types';

/**
 * Vrai si la marque a accès à l'application : abonnement actif via Token ID,
 * ou essai gratuit encore en cours. Miroir de Brand#hasAccess côté backend
 * (qui reste la source de vérité, appliquée par requireActiveBrand) : utilisé
 * ici seulement pour décider vers quel écran rediriger côté client.
 */
export function brandHasAccess(brand: Brand | null): boolean {
  if (!brand) return true; // SUPER_ADMIN n'a pas de marque
  if (brand.status === 'ACTIVE') return true;
  if (brand.status === 'TRIAL') {
    return !!brand.trialEndsAt && new Date(brand.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

export function trialDaysLeft(brand: Brand | null): number | null {
  if (!brand || brand.status !== 'TRIAL' || !brand.trialEndsAt) return null;
  const msLeft = new Date(brand.trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}
