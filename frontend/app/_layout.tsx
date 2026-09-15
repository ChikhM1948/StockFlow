import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BrandThemeProvider } from '@/context/BrandThemeContext';
import { Role } from '@/api/types';
import { brandHasAccess } from '@/utils/subscription';

function roleGroup(role: Role) {
  if (role === 'SUPER_ADMIN') return '/(super-admin)';
  if (role === 'BRAND_ADMIN') return '/(admin)';
  return '/(distributor)';
}

function AuthGate() {
  const { user, brand, isLoading, isAuthenticated } = useAuth();
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

    // Essai gratuit terminé et aucun abonnement actif : on bloque l'accès aux
    // écrans métier tant qu'un Token ID n'est pas soumis (voir /auth/activate).
    if (user!.role !== 'SUPER_ADMIN' && !brandHasAccess(brand)) {
      if (currentGroup !== 'subscription-expired') {
        router.replace('/subscription-expired');
      }
      return;
    }
    if (currentGroup === 'subscription-expired') {
      router.replace(roleGroup(user!.role) as any);
      return;
    }

    const expectedGroup = roleGroup(user!.role);
    if (currentGroup !== expectedGroup.slice(1)) {
      router.replace(expectedGroup as any);
    }
  }, [isLoading, isAuthenticated, segments, brand]);

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
    <SafeAreaProvider>
      <AuthProvider>
        <BrandThemeProvider>
          <StatusBar style="dark" />
          <AuthGate />
        </BrandThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
