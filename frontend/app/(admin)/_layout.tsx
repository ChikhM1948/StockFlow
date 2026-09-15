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

export default function AdminLayout() {
  const { primaryColor, brandName } = useBrandTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: primaryColor },
        headerTintColor: '#FFFFFF',
        headerRight: () => <LogoutButton />,
        tabBarActiveTintColor: primaryColor,
      }}
    >
      <Tabs.Screen name="index" options={{ title: brandName, tabBarLabel: 'Stock' }} />
      <Tabs.Screen name="product-new" options={{ title: 'Nouvel article', tabBarLabel: 'Ajouter' }} />
      <Tabs.Screen name="distributors" options={{ title: 'Distributeurs', tabBarLabel: 'Distributeurs' }} />
      <Tabs.Screen name="dispatch-new" options={{ title: 'Bon de sortie', tabBarLabel: 'Sortie' }} />
      <Tabs.Screen name="dispatches" options={{ title: 'Bons de sortie', tabBarLabel: 'Historique' }} />
      <Tabs.Screen name="returns" options={{ title: 'Bons de retour', tabBarLabel: 'Retours' }} />
      <Tabs.Screen name="sales" options={{ title: 'Ventes en direct', tabBarLabel: 'Ventes' }} />
      <Tabs.Screen name="customer-balances" options={{ title: 'Créances clients', tabBarLabel: 'Créances' }} />
      <Tabs.Screen name="caisse" options={{ title: 'Caisse', tabBarLabel: 'Caisse' }} />
      <Tabs.Screen name="expenses" options={{ title: 'Dépenses', tabBarLabel: 'Dépenses' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Tableau de bord', tabBarLabel: 'Dashboard' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ma marque', tabBarLabel: 'Réglages' }} />
    </Tabs>
  );
}
