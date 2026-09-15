import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { createDistributor, listDistributors } from '@/api/auth';
import { User } from '@/api/types';
import { extractErrorMessage } from '@/api/client';

export default function DistributorsScreen() {
  const [distributors, setDistributors] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDistributors = useCallback(async () => {
    try {
      setDistributors(await listDistributors());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDistributors();
    }, [fetchDistributors])
  );

  const handleCreate = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Nom, email et mot de passe sont requis.');
      return;
    }
    setLoading(true);
    try {
      await createDistributor({ name, email: email.trim(), password, phone });
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      await fetchDistributors();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Nouveau distributeur</Text>

      <Input label="Nom" value={name} onChangeText={setName} placeholder="Ex: Ahmed Traoré" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="distributeur@exemple.com"
      />
      <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optionnel" />
      <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 6 caractères" />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Button label="Créer le distributeur" onPress={handleCreate} loading={loading} />

      <Text className="text-lg font-semibold text-slate-900 mt-8 mb-3">Mes distributeurs</Text>
      {distributors.length === 0 ? (
        <Text className="text-slate-500">Aucun distributeur pour le moment.</Text>
      ) : (
        distributors.map((d) => (
          <View key={d._id} className="bg-white rounded-xl p-4 mb-2 border border-slate-200">
            <Text className="font-semibold text-slate-900">{d.name}</Text>
            <Text className="text-slate-500">{d.email}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}
