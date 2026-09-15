import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { createToken, listTokens } from '@/api/tokens';
import { AdminTokenDoc } from '@/api/types';
import { extractErrorMessage } from '@/api/client';

function StatusBadge({ status }: { status: AdminTokenDoc['status'] }) {
  const colors: Record<AdminTokenDoc['status'], string> = {
    PENDING: '#F59E0B',
    USED: '#16A34A',
    REVOKED: '#DC2626',
  };
  return (
    <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors[status] + '20' }}>
      <Text className="text-xs font-semibold" style={{ color: colors[status] }}>
        {status}
      </Text>
    </View>
  );
}

export default function SuperAdminTokensScreen() {
  const [companyName, setCompanyName] = useState('');
  const [tokens, setTokens] = useState<AdminTokenDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      setTokens(await listTokens());
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTokens();
    }, [fetchTokens])
  );

  const handleCreate = async () => {
    setError(null);
    if (!companyName) {
      setError("Le nom de l'entreprise cliente est requis.");
      return;
    }
    setLoading(true);
    try {
      await createToken(companyName);
      setCompanyName('');
      await fetchTokens();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Générer un Token de marque</Text>

      <Input
        label="Nom de l'entreprise cliente"
        value={companyName}
        onChangeText={setCompanyName}
        placeholder="Ex: Épicerie Centrale SARL"
      />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}

      <Button label="Générer le Token" onPress={handleCreate} loading={loading} />

      <Text className="text-lg font-semibold text-slate-900 mt-8 mb-3">Tokens émis</Text>
      {tokens.length === 0 ? (
        <Text className="text-slate-500">Aucun token généré pour le moment.</Text>
      ) : (
        tokens.map((t) => (
          <View key={t._id} className="bg-white rounded-xl p-4 mb-2 border border-slate-200">
            <View className="flex-row justify-between items-center">
              <Text className="font-mono font-semibold text-slate-900">{t.tokenId}</Text>
              <StatusBadge status={t.status} />
            </View>
            <Text className="text-slate-500 mt-1">{t.companyName}</Text>
          </View>
        ))
      )}
    </Screen>
  );
}
