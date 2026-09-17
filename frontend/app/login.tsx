import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { extractErrorMessage } from '@/api/client';
import { AlertCircle, ArrowRight, LockKeyhole, Mail, Package } from 'lucide-react-native';

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
      <View className="pt-12 mb-8">
        <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center mb-5">
          <Package size={28} color="#FFFFFF" strokeWidth={2.1} />
        </View>
        <Text className="text-3xl font-bold text-slate-950">Bienvenue</Text>
        <Text className="text-slate-500 text-base mt-2 leading-6">Connectez-vous pour retrouver votre espace de gestion.</Text>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <Mail size={17} color="#2563EB" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Vos identifiants</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Utilisez l'adresse associée à votre compte.</Text>
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
          placeholder="Votre mot de passe"
        />
        <View className="flex-row items-center bg-slate-50 rounded-xl px-3 py-2.5">
          <LockKeyhole size={15} color="#64748B" />
          <Text className="text-slate-500 text-xs ml-2">Vos données restent protégées.</Text>
        </View>
      </View>

      {error && (
        <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">
          <AlertCircle size={17} color="#DC2626" />
          <Text className="text-red-700 ml-2 flex-1">{error}</Text>
        </View>
      )}

      <Button label="Se connecter" onPress={handleLogin} loading={loading} />

      <View className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex-row items-center">
        <View className="flex-1">
          <Text className="text-slate-900 font-bold">Nouvelle marque ?</Text>
          <Text className="text-slate-500 text-sm mt-1">Créez votre espace en quelques étapes.</Text>
        </View>
        <Link href="/onboarding" accessibilityLabel="Créer ma marque" className="w-10 h-10 rounded-xl bg-white items-center justify-center">
          <ArrowRight size={19} color="#2563EB" strokeWidth={2.3} />
        </Link>
      </View>
    </Screen>
  );
}
