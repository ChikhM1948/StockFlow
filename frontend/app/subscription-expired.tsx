import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';

/**
 * Affiché quand l'essai gratuit (14 jours) de la marque est terminé et
 * qu'aucun abonnement n'est actif (voir requireActiveBrand côté backend,
 * qui renvoie 402 SUBSCRIPTION_REQUIRED sur les routes métier).
 * Seul un BRAND_ADMIN peut soumettre le Token ID reçu à l'achat ; un
 * DISTRIBUTOR est invité à contacter son administrateur.
 */
export default function SubscriptionExpiredScreen() {
  const { user, activateSubscription, logout } = useAuth();
  const [tokenId, setTokenId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'BRAND_ADMIN';

  const handleActivate = async () => {
    setError(null);
    setLoading(true);
    try {
      await activateSubscription(tokenId.trim());
      // AuthGate (app/_layout.tsx) redirige automatiquement une fois la marque active
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mt-16 mb-8">
        <Text className="text-3xl font-bold text-slate-900">Essai gratuit terminé</Text>
        <Text className="text-slate-500 mt-1">
          {isAdmin
            ? "Votre période d'essai de 14 jours est arrivée à son terme. Entrez le Token ID reçu à l'achat pour continuer à utiliser l'application."
            : "La période d'essai de votre entreprise est terminée. Contactez votre administrateur pour réactiver l'accès."}
        </Text>
      </View>

      {isAdmin && (
        <>
          <Input
            label="Token ID"
            value={tokenId}
            onChangeText={setTokenId}
            autoCapitalize="characters"
            placeholder="BRD-XXXX-XXXX-XXXX"
          />

          {error && <Text className="text-red-500 mb-4">{error}</Text>}

          <Button label="Activer mon abonnement" onPress={handleActivate} loading={loading} disabled={!tokenId.trim()} />
        </>
      )}

      <View className="mt-6 items-center">
        <Button label="Se déconnecter" variant="outline" onPress={logout} />
      </View>
    </Screen>
  );
}
