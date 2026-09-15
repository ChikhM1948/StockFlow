import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';

type Mode = 'trial' | 'token';

/**
 * Deux façons de créer sa marque :
 * - "trial" : essai gratuit de 14 jours, sans Token ID (POST /api/auth/trial).
 * - "token" : Token ID déjà reçu du fournisseur (POST /api/auth/onboard).
 * Passé le délai d'essai sans Token ID soumis, l'app redirige vers
 * /subscription-expired (voir app/_layout.tsx) jusqu'à activation.
 */
export default function OnboardingScreen() {
  const { onboard, startTrial } = useAuth();
  const [mode, setMode] = useState<Mode>('trial');

  const [companyName, setCompanyName] = useState('');
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
      if (mode === 'trial') {
        await startTrial({ companyName: companyName.trim(), name, email: email.trim(), password });
      } else {
        await onboard({ tokenId: tokenId.trim(), name, email: email.trim(), password });
      }
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
          {mode === 'trial'
            ? 'Démarrez un essai gratuit de 14 jours, sans Token ID.'
            : 'Entrez le Token ID fourni par votre fournisseur de solution pour créer votre compte Administrateur.'}
        </Text>
      </View>

      <View className="flex-row mb-6 rounded-xl overflow-hidden border border-slate-300">
        <Pressable
          onPress={() => setMode('trial')}
          className={`flex-1 py-2.5 items-center ${mode === 'trial' ? 'bg-blue-600' : 'bg-white'}`}
        >
          <Text className={mode === 'trial' ? 'text-white font-semibold' : 'text-slate-600'}>
            Essai gratuit 14 jours
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('token')}
          className={`flex-1 py-2.5 items-center ${mode === 'token' ? 'bg-blue-600' : 'bg-white'}`}
        >
          <Text className={mode === 'token' ? 'text-white font-semibold' : 'text-slate-600'}>
            J'ai un Token ID
          </Text>
        </Pressable>
      </View>

      {mode === 'trial' ? (
        <Input
          label="Nom de l'entreprise"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Ex: Ma Marque SARL"
        />
      ) : (
        <Input
          label="Token ID"
          value={tokenId}
          onChangeText={setTokenId}
          autoCapitalize="characters"
          placeholder="BRD-XXXX-XXXX-XXXX"
        />
      )}
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

      <Button
        label={mode === 'trial' ? "Démarrer l'essai gratuit" : 'Activer et créer mon compte'}
        onPress={handleSubmit}
        loading={loading}
      />

      <View className="mt-6 items-center">
        <Text className="text-slate-500">Vous avez déjà un compte ?</Text>
        <Link href="/login" className="text-blue-600 font-medium mt-1">
          Se connecter
        </Link>
      </View>
    </Screen>
  );
}
