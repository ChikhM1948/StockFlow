import React from 'react';
import { Pressable, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} className="mr-4">
      <Text className="text-white font-medium">Déconnexion</Text>
    </Pressable>
  );
}

export default function SuperAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Super Admin — Tokens' }} />
    </Stack>
  );
}
