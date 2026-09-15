import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getMyBrand } from '@/api/brand';

const DEFAULT_PRIMARY = '#2563EB';
const DEFAULT_SECONDARY = '#1E293B';

interface BrandThemeValue {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  brandName: string;
  refreshBrand: () => Promise<void>;
}

const BrandThemeContext = createContext<BrandThemeValue | undefined>(undefined);

/**
 * Expose le thème dynamique dérivé de la marque de l'utilisateur connecté.
 * Toute l'UI (boutons, en-têtes) doit lire ses couleurs ici plutôt que
 * les coder en dur, pour que la personnalisation Marque Blanche s'applique partout.
 */
export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const { brand, setBrand } = useAuth();

  const refreshBrand = useCallback(async () => {
    const fresh = await getMyBrand();
    setBrand(fresh);
  }, [setBrand]);

  const value = useMemo<BrandThemeValue>(
    () => ({
      primaryColor: brand?.theme?.primaryColor || DEFAULT_PRIMARY,
      secondaryColor: brand?.theme?.secondaryColor || DEFAULT_SECONDARY,
      logoUrl: brand?.logoUrl || null,
      brandName: brand?.name || 'Stock Alimentaire',
      refreshBrand,
    }),
    [brand, refreshBrand]
  );

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme() {
  const ctx = useContext(BrandThemeContext);
  if (!ctx) throw new Error('useBrandTheme doit être utilisé dans un BrandThemeProvider.');
  return ctx;
}
