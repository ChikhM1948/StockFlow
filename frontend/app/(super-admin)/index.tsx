import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { createToken, listTokens } from '@/api/tokens';
import { AdminTokenDoc } from '@/api/types';
import { extractErrorMessage } from '@/api/client';
import { AlertCircle, Check, CheckCircle2, Clock3, KeyRound, Plus, ShieldAlert, Ticket } from 'lucide-react-native';

function StatusBadge({ status }: { status: AdminTokenDoc['status'] }) {
  const colors: Record<AdminTokenDoc['status'], string> = {
    PENDING: '#F59E0B',
    USED: '#16A34A',
    REVOKED: '#DC2626',
  };
  const icons: Record<AdminTokenDoc['status'], typeof Clock3> = {
    PENDING: Clock3,
    USED: CheckCircle2,
    REVOKED: ShieldAlert,
  };
  const Icon = icons[status];
  return (
    <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: colors[status] + '20' }}>
      <Icon size={13} color={colors[status]} />
      <Text className="text-xs font-semibold" style={{ color: colors[status] }}>
        {status === 'PENDING' ? 'En attente' : status === 'USED' ? 'Utilisé' : 'Révoqué'}
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

  const pendingCount = tokens.filter((token) => token.status === 'PENDING').length;
  const usedCount = tokens.filter((token) => token.status === 'USED').length;

  return (
    <Screen>
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl bg-slate-900 items-center justify-center mr-3">
            <KeyRound size={23} color="#CBD5E1" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Tokens de marque</Text>
            <Text className="text-slate-500 mt-0.5">Créez et suivez les accès des nouvelles entreprises.</Text>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 mb-5">
        <View className="flex-1 bg-white border border-slate-200 rounded-2xl p-3">
          <Ticket size={17} color="#2563EB" />
          <Text className="text-slate-400 text-xs mt-2">Total émis</Text>
          <Text className="text-slate-900 text-xl font-bold mt-0.5">{tokens.length}</Text>
        </View>
        <View className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl p-3">
          <Clock3 size={17} color="#D97706" />
          <Text className="text-amber-700 text-xs mt-2">En attente</Text>
          <Text className="text-amber-900 text-xl font-bold mt-0.5">{pendingCount}</Text>
        </View>
        <View className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
          <Check size={17} color="#16A34A" />
          <Text className="text-emerald-700 text-xs mt-2">Utilisés</Text>
          <Text className="text-emerald-900 text-xl font-bold mt-0.5">{usedCount}</Text>
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <View className="flex-row items-center mb-1">
          <Plus size={18} color="#2563EB" strokeWidth={2.4} />
          <Text className="text-base font-bold text-slate-900 ml-2">Générer un accès</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Un token permettra à l'entreprise de créer son espace.</Text>
        <Input
          label="Nom de l'entreprise cliente"
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Ex: Épicerie Centrale SARL"
        />

        {error && (
          <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">
            <AlertCircle size={17} color="#DC2626" />
            <Text className="text-red-700 ml-2 flex-1">{error}</Text>
          </View>
        )}

        <Button label="Générer le token" onPress={handleCreate} loading={loading} />
      </View>

      <View className="flex-row items-center mb-3">
        <Ticket size={18} color="#475569" />
        <Text className="text-lg font-bold text-slate-900 ml-2">Tokens émis</Text>
        <View className="bg-slate-200 rounded-full px-2 py-0.5 ml-2">
          <Text className="text-slate-600 text-xs font-bold">{tokens.length}</Text>
        </View>
      </View>
      {tokens.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <KeyRound size={24} color="#64748B" />
          <Text className="text-slate-900 font-bold mt-3">Aucun token généré</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Les nouveaux accès apparaîtront ici.</Text>
        </View>
      ) : (
        tokens.map((t) => (
          <View key={t._id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3">
                <KeyRound size={18} color="#475569" />
              </View>
              <View className="flex-1 pr-2">
                <Text className="font-mono font-bold text-slate-900">{t.tokenId}</Text>
                <Text className="text-slate-500 text-sm mt-1">{t.companyName}</Text>
              </View>
              <StatusBadge status={t.status} />
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
