import React from 'react';
import { Pressable, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { useAuth } from '@/context/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} className="mr-4">
      <Text className="text-white font-medium">Déconnexion</Text>
    </Pressable>
  );
}

export default function DistributorLayout() {
  const { primaryColor, brandName } = useBrandTheme();
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: primaryColor },
        headerTintColor: '#FFFFFF',
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: primaryColor,
      }}
    >
      <Tabs.Screen name="index" options={{ title: brandName, tabBarLabel: 'Mon Stock' }} />
      <Tabs.Screen
        name="add-stock"
        options={{
          title: 'Ajouter du stock',
          tabBarLabel: 'Ajouter',
          // Masqué du menu tant que le BRAND_ADMIN n'a pas accordé la permission.
          href: user?.canAddStock ? undefined : null,
        }}
      />
      <Tabs.Screen name="sale-new" options={{ title: 'Nouvelle vente', tabBarLabel: 'Vendre' }} />
      <Tabs.Screen name="sales" options={{ title: 'Mes ventes', tabBarLabel: 'Historique' }} />
      <Tabs.Screen name="return-new" options={{ title: 'Bon de retour', tabBarLabel: 'Retourner' }} />
      <Tabs.Screen name="returns" options={{ title: 'Mes retours', tabBarLabel: 'Retours' }} />
      <Tabs.Screen name="customer-balances" options={{ title: 'Créances clients', tabBarLabel: 'Créances' }} />
      <Tabs.Screen name="caisse" options={{ title: 'Ma Caisse', tabBarLabel: 'Caisse' }} />
    </Tabs>
  );
}
