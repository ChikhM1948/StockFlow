import React, { useCallback, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { createDistributor, listDistributors, updateDistributorPermissions } from '@/api/auth';
import { User } from '@/api/types';
import { extractErrorMessage } from '@/api/client';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { Check, Mail, Phone, ShieldCheck, Truck, UserPlus, Users, Warehouse } from 'lucide-react-native';

export default function DistributorsScreen() {
  const { primaryColor } = useBrandTheme();
  const [distributors, setDistributors] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleToggleAddStock = async (distributor: User, value: boolean) => {
    setError(null);
    setUpdatingId(distributor._id);
    try {
      const updated = await updateDistributorPermissions(distributor._id, value);
      setDistributors((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

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
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: primaryColor }}>
            <Users size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Distributeurs</Text>
            <Text className="text-slate-500 mt-0.5">Gérez votre équipe et ses accès au stock.</Text>
          </View>
        </View>
      </View>

      <View className="bg-slate-900 rounded-2xl p-4 mb-5 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-white/10 items-center justify-center mr-3">
          <Truck size={19} color="#93C5FD" />
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Équipe active</Text>
          <Text className="text-white text-2xl font-bold mt-0.5">{distributors.length}</Text>
        </View>
        <Text className="text-slate-400 text-xs">compte(s)</Text>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <View className="flex-row items-center mb-1">
          <UserPlus size={18} color={primaryColor} strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Créer un distributeur</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Créez un accès individuel pour votre équipe terrain.</Text>

        <Input label="Nom complet" value={name} onChangeText={setName} placeholder="Ex: Ahmed Traoré" />
        <Input
          label="Email professionnel"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="distributeur@exemple.com"
        />
        <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Optionnel" />
        <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry placeholder="Minimum 6 caractères" />

        {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}

        <Button label="Créer le distributeur" onPress={handleCreate} loading={loading} />
      </View>

      <View className="flex-row items-center mb-3">
        <Users size={18} color="#475569" />
        <Text className="text-lg font-bold text-slate-900 ml-2">Mon équipe</Text>
        <View className="bg-slate-200 rounded-full px-2 py-0.5 ml-2">
          <Text className="text-slate-600 text-xs font-bold">{distributors.length}</Text>
        </View>
      </View>
      {distributors.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 items-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-3">
            <Truck size={22} color="#64748B" />
          </View>
          <Text className="text-slate-900 font-bold">Aucun distributeur</Text>
          <Text className="text-slate-500 text-sm text-center mt-1">Les comptes créés apparaîtront ici.</Text>
        </View>
      ) : (
        distributors.map((d) => (
          <View key={d._id} className="bg-white rounded-2xl p-4 mb-3 border border-slate-200">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-2xl bg-blue-50 items-center justify-center mr-3">
                <Truck size={20} color="#2563EB" strokeWidth={2.1} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-base">{d.name}</Text>
                <View className="flex-row items-center mt-1">
                  <Mail size={13} color="#94A3B8" />
                  <Text className="text-slate-500 text-xs ml-1.5">{d.email}</Text>
                </View>
                {d.phone ? (
                  <View className="flex-row items-center mt-1">
                    <Phone size={13} color="#94A3B8" />
                    <Text className="text-slate-500 text-xs ml-1.5">{d.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <View className="flex-row items-center flex-1 pr-2">
                <View className={`w-8 h-8 rounded-lg items-center justify-center mr-2 ${d.canAddStock ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  {d.canAddStock ? <ShieldCheck size={16} color="#16A34A" /> : <Warehouse size={16} color="#64748B" />}
                </View>
                <View>
                  <Text className="text-slate-800 font-semibold text-sm">Ajout de stock</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">{d.canAddStock ? 'Autorisé' : 'Non autorisé'}</Text>
                </View>
              </View>
              <Switch
                value={d.canAddStock}
                onValueChange={(value) => handleToggleAddStock(d, value)}
                disabled={updatingId === d._id}
                trackColor={{ true: primaryColor }}
              />
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
