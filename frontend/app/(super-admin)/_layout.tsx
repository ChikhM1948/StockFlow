import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LogOut, ShieldCheck } from 'lucide-react-native';

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} accessibilityLabel="Se déconnecter" className="mr-4 w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
      <LogOut size={17} color="#FFFFFF" strokeWidth={2} />
    </Pressable>
  );
}

function HeaderTitle() {
  return (
    <View className="flex-row items-center">
      <View className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center mr-2">
        <ShieldCheck size={18} color="#CBD5E1" strokeWidth={2.1} />
      </View>
      <View>
        <Text className="text-white text-base font-bold">Super Admin</Text>
        <Text className="text-slate-400 text-[10px] uppercase tracking-widest">Centre de contrôle</Text>
      </View>
    </View>
  );
}

export default function SuperAdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitle: () => <HeaderTitle />,
        headerRight: () => <LogoutButton />,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tokens', headerBackVisible: false }} />
    </Stack>
  );
}
