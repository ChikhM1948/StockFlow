import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  FileInput,
  LogOut,
  Menu,
  PackagePlus,
  RotateCcw,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const primaryRoutes = [
  { name: 'index', label: 'Stock', icon: Store },
  { name: 'sale-new', label: 'Vendre', icon: ShoppingCart },
  { name: 'sales', label: 'Historique', icon: BarChart3 },
  { name: 'caisse', label: 'Caisse', icon: Wallet },
];

function LogoutButton() {
  const { logout } = useAuth();
  return <Pressable onPress={logout} accessibilityLabel="Se déconnecter" className="mr-4 w-9 h-9 rounded-xl bg-white/10 items-center justify-center">
    <LogOut size={17} color="#FFFFFF" strokeWidth={2} />
  </Pressable>;
}

function HeaderBrand({ brandName }: { brandName: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-9 h-9 rounded-xl bg-white/15 items-center justify-center mr-2">
        <Truck size={18} color="#FFFFFF" strokeWidth={2.2} />
      </View>
      <View>
        <Text className="text-white text-base font-bold" numberOfLines={1}>{brandName}</Text>
        <Text className="text-blue-100 text-[10px] uppercase tracking-widest">Espace distributeur</Text>
      </View>
    </View>
  );
}

function DistributorTabBar({ state, navigation }: any) {
  const { primaryColor } = useBrandTheme();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentRoute = state.routes[state.index]?.name;
  const extraRoutes = [
    ...(user?.canAddStock ? [{ name: 'add-stock', label: 'Ajouter du stock', icon: PackagePlus }] : []),
    { name: 'return-new', label: 'Créer un retour', icon: RotateCcw },
    { name: 'returns', label: 'Mes retours', icon: FileInput },
    { name: 'customer-balances', label: 'Créances clients', icon: Users },
  ];

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
                <Text className="text-xl font-bold text-slate-900">Mon espace</Text>
                <Text className="text-sm text-slate-500 mt-1">Retours, stock et suivi client.</Text>
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

export default function DistributorLayout() {
  const { primaryColor, brandName } = useBrandTheme();
  const { user } = useAuth();

  return (
    <Tabs
      tabBar={(props) => <DistributorTabBar {...props} />}
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
      <Tabs.Screen
        name="add-stock"
        options={{
          title: 'Ajouter du stock',
          href: user?.canAddStock ? undefined : null,
        }}
      />
      <Tabs.Screen name="sale-new" options={{ title: 'Nouvelle vente' }} />
      <Tabs.Screen name="sales" options={{ title: 'Mes ventes' }} />
      <Tabs.Screen name="return-new" options={{ title: 'Bon de retour' }} />
      <Tabs.Screen name="returns" options={{ title: 'Mes retours' }} />
      <Tabs.Screen name="customer-balances" options={{ title: 'Créances clients' }} />
      <Tabs.Screen name="caisse" options={{ title: 'Ma Caisse' }} />
    </Tabs>
  );
}
