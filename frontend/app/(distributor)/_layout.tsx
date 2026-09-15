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
      <Tabs.Screen name="sale-new" options={{ title: 'Nouvelle vente', tabBarLabel: 'Vendre' }} />
      <Tabs.Screen name="sales" options={{ title: 'Mes ventes', tabBarLabel: 'Historique' }} />
    </Tabs>
  );
}
