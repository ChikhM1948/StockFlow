import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthGate (app/_layout.tsx) redirige automatiquement selon le rôle
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="mt-16 mb-8">
        <Text className="text-3xl font-bold text-slate-900">Connexion</Text>
        <Text className="text-slate-500 mt-1">Accédez à votre espace Stock Alimentaire.</Text>
      </View>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="vous@exemple.com"
      />
      <Input
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Button label="Se connecter" onPress={handleLogin} loading={loading} />

      <View className="mt-6 items-center">
        <Text className="text-slate-500">Nouvelle marque ?</Text>
        <Link href="/onboarding" className="text-blue-600 font-medium mt-1">
          Activer mon Token ID
        </Link>
      </View>
    </Screen>
  );
}
