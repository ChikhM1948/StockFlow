import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  FileInput,
  FileOutput,
  LogOut,
  Menu,
  PackagePlus,
  RotateCcw,
  Settings,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const primaryRoutes = [
  { name: 'index', label: 'Stock', icon: Boxes },
  { name: 'sales', label: 'Ventes', icon: ShoppingCart },
  { name: 'caisse', label: 'Caisse', icon: Wallet },
  { name: 'dashboard', label: 'Analyse', icon: BarChart3 },
];

const extraRoutes = [
  { name: 'product-new', label: 'Ajouter un article', icon: PackagePlus },
  { name: 'distributors', label: 'Distributeurs', icon: Store },
  { name: 'dispatch-new', label: 'Créer une sortie', icon: FileOutput },
  { name: 'dispatches', label: 'Historique des sorties', icon: FileInput },
  { name: 'returns', label: 'Retours', icon: RotateCcw },
  { name: 'customer-balances', label: 'Créances clients', icon: Users },
  { name: 'expenses', label: 'Dépenses', icon: CircleDollarSign },
  { name: 'settings', label: 'Réglages', icon: Settings },
];

function HeaderBrand({ brandName }: { brandName: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center mr-2">
        <Text className="text-white text-lg font-bold">S</Text>
      </View>
      <View>
        <Text className="text-white text-base font-bold" numberOfLines={1}>{brandName}</Text>
        <Text className="text-blue-100 text-[10px] uppercase tracking-widest">Espace admin</Text>
      </View>
    </View>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} accessibilityLabel="Se déconnecter" className="mr-4 w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
      <LogOut size={17} color="#FFFFFF" strokeWidth={2} />
    </Pressable>
  );
}

function AdminTabBar({ state, navigation }: any) {
  const { primaryColor } = useBrandTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentRoute = state.routes[state.index]?.name;

  const goTo = (name: string) => {
    const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
    setMenuOpen(false);
  };

  return (
    <>
      <View className="bg-white border-t border-slate-200 px-2" style={{ paddingBottom: 8 }}>
        <View className="flex-row items-center">
          {primaryRoutes.map((item) => {
            const Icon = item.icon;
            const focused = currentRoute === item.name;
            const color = focused ? primaryColor : '#94A3B8';
            return (
              <Pressable key={item.name} onPress={() => goTo(item.name)} accessibilityRole="button" accessibilityState={{ selected: focused }} className="flex-1 items-center justify-center py-2">
                <View className="items-center justify-center px-3 py-1 rounded-xl" style={focused ? { backgroundColor: `${primaryColor}18` } : undefined}>
                  <Icon size={20} color={color} strokeWidth={focused ? 2.5 : 2} />
                  <Text className="text-[10px] font-semibold mt-1" style={{ color }}>{item.label}</Text>
                </View>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setMenuOpen(true)} accessibilityLabel="Ouvrir le menu" className="flex-1 items-center justify-center py-2">
            <View className="items-center justify-center px-3 py-1 rounded-xl">
              <Menu size={20} color="#94A3B8" strokeWidth={2} />
              <Text className="text-[10px] text-slate-400 font-semibold mt-1">Plus</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-slate-950/35 justify-end" onPress={() => setMenuOpen(false)}>
          <Pressable className="bg-slate-50 rounded-t-3xl px-5 pt-4 pb-8 max-h-[82%]" onPress={(event) => event.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-xl font-bold text-slate-900">Espace de travail</Text>
                <Text className="text-sm text-slate-500 mt-1">Tout votre stock, au même endroit.</Text>
              </View>
              <Pressable onPress={() => setMenuOpen(false)} accessibilityLabel="Fermer le menu" className="w-9 h-9 rounded-full bg-white items-center justify-center">
                <X size={18} color="#475569" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {extraRoutes.map((item) => {
                const Icon = item.icon;
                const focused = currentRoute === item.name;
                return (
                  <Pressable key={item.name} onPress={() => goTo(item.name)} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 mb-2 flex-row items-center">
                    <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${primaryColor}${focused ? '24' : '12'}` }}>
                      <Icon size={19} color={primaryColor} />
                    </View>
                    <Text className="flex-1 text-slate-800 font-semibold">{item.label}</Text>
                    <ChevronRight size={18} color="#94A3B8" />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function AdminLayout() {
  const { primaryColor, brandName } = useBrandTheme();
  return (
    <Tabs
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: primaryColor, height: 92 },
        headerTintColor: '#FFFFFF',
        headerTitle: () => <HeaderBrand brandName={brandName} />,
        headerRight: () => <LogoutButton />,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: brandName }} />
      <Tabs.Screen name="product-new" options={{ title: 'Nouvel article' }} />
      <Tabs.Screen name="distributors" options={{ title: 'Distributeurs' }} />
      <Tabs.Screen name="dispatch-new" options={{ title: 'Bon de sortie' }} />
      <Tabs.Screen name="dispatches" options={{ title: 'Bons de sortie' }} />
      <Tabs.Screen name="returns" options={{ title: 'Bons de retour' }} />
      <Tabs.Screen name="sales" options={{ title: 'Ventes en direct' }} />
      <Tabs.Screen name="customer-balances" options={{ title: 'Créances clients' }} />
      <Tabs.Screen name="caisse" options={{ title: 'Caisse' }} />
      <Tabs.Screen name="expenses" options={{ title: 'Dépenses' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Tableau de bord' }} />
      <Tabs.Screen name="settings" options={{ title: 'Ma marque' }} />
    </Tabs>
  );
}
