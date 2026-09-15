import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';

/**
 * Onboarding Marque Blanche : l'utilisateur entre le Token ID reçu du
 * Super Admin. S'il est valide, un compte BRAND_ADMIN est créé et
 * rattaché à sa propre marque (voir POST /api/auth/onboard côté backend).
 */
export default function OnboardingScreen() {
  const { onboard } = useAuth();
  const [tokenId, setTokenId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await onboard({ tokenId: tokenId.trim(), name, email: email.trim(), password });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mt-16 mb-8">
        <Text className="text-3xl font-bold text-slate-900">Activer ma marque</Text>
        <Text className="text-slate-500 mt-1">
          Entrez le Token ID fourni par votre fournisseur de solution pour créer votre compte
          Administrateur.
        </Text>
      </View>

      <Input
        label="Token ID"
        value={tokenId}
        onChangeText={setTokenId}
        autoCapitalize="characters"
        placeholder="BRD-XXXX-XXXX-XXXX"
      />
      <Input label="Votre nom" value={name} onChangeText={setName} placeholder="Ex: Jean Dupont" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="admin@votremarque.com"
      />
      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Minimum 6 caractères"
      />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Button label="Activer et créer mon compte" onPress={handleSubmit} loading={loading} />

      <View className="mt-6 items-center">
        <Text className="text-slate-500">Vous avez déjà un compte ?</Text>
        <Link href="/login" className="text-blue-600 font-medium mt-1">
          Se connecter
        </Link>
      </View>
    </Screen>
  );
}
