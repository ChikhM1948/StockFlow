import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BrandThemeProvider } from '@/context/BrandThemeContext';
import { Role } from '@/api/types';

function roleGroup(role: Role) {
  if (role === 'SUPER_ADMIN') return '/(super-admin)';
  if (role === 'BRAND_ADMIN') return '/(admin)';
  return '/(distributor)';
}

function AuthGate() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const currentGroup = segments[0];
    const isProtectedGroup =
      currentGroup === '(admin)' || currentGroup === '(distributor)' || currentGroup === '(super-admin)';

    if (!isAuthenticated) {
      if (isProtectedGroup) router.replace('/login');
      return;
    }

    const expectedGroup = roleGroup(user!.role);
    if (currentGroup !== expectedGroup.slice(1, -1)) {
      router.replace(expectedGroup as any);
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BrandThemeProvider>
        <StatusBar style="dark" />
        <AuthGate />
      </BrandThemeProvider>
    </AuthProvider>
  );
}
