import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/Screen';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useBrandTheme } from '@/context/BrandThemeContext';
import { updateMyBrand } from '@/api/brand';
import { extractErrorMessage } from '@/api/client';

const COLOR_PRESETS = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0F172A'];

export default function BrandSettingsScreen() {
  const { brand } = useAuth();
  const { refreshBrand } = useBrandTheme();

  const [name, setName] = useState(brand?.name || '');
  const [primaryColor, setPrimaryColor] = useState(brand?.theme.primaryColor || '#2563EB');
  const [logoUrl, setLogoUrl] = useState<string | null>(brand?.logoUrl || null);
  const [addressLine, setAddressLine] = useState(brand?.invoiceFooter.addressLine || '');
  const [phone, setPhone] = useState(brand?.invoiceFooter.phone || '');
  const [taxId, setTaxId] = useState(brand?.invoiceFooter.taxId || '');
  const [customText, setCustomText] = useState(brand?.invoiceFooter.customText || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brand) return;
    setName(brand.name);
    setPrimaryColor(brand.theme.primaryColor);
    setLogoUrl(brand.logoUrl);
    setAddressLine(brand.invoiceFooter.addressLine);
    setPhone(brand.invoiceFooter.phone);
    setTaxId(brand.invoiceFooter.taxId);
    setCustomText(brand.invoiceFooter.customText);
  }, [brand?._id]);

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisez l'accès aux photos pour choisir un logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      setLogoUrl(`data:${mime};base64,${asset.base64}`);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await updateMyBrand({
        name,
        logoUrl: logoUrl || undefined,
        theme: { primaryColor },
        invoiceFooter: { addressLine, phone, taxId, customText },
      });
      await refreshBrand();
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Text className="text-2xl font-bold text-slate-900 mb-4 mt-2">Personnalisation de ma marque</Text>

      <Pressable onPress={pickLogo} className="items-center mb-6">
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} className="w-24 h-24 rounded-xl mb-2" resizeMode="contain" />
        ) : (
          <View className="w-24 h-24 rounded-xl bg-slate-200 mb-2 items-center justify-center">
            <Text className="text-slate-500 text-xs text-center">Aucun{'\n'}logo</Text>
          </View>
        )}
        <Text className="text-blue-600 font-medium">Changer le logo</Text>
      </Pressable>

      <Input label="Nom de l'entreprise" value={name} onChangeText={setName} />

      <Text className="text-sm font-medium text-slate-600 mb-2">Couleur principale de l'interface</Text>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {COLOR_PRESETS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setPrimaryColor(color)}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: color, borderWidth: primaryColor === color ? 3 : 0, borderColor: '#0F172A' }}
          />
        ))}
      </View>
      <Input label="Ou code couleur (hex)" value={primaryColor} onChangeText={setPrimaryColor} autoCapitalize="none" />

      <Text className="text-lg font-semibold text-slate-900 mt-4 mb-2">Pied de page des factures</Text>
      <Input label="Adresse" value={addressLine} onChangeText={setAddressLine} />
      <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input label="Identifiant fiscal (NIF / RCCM...)" value={taxId} onChangeText={setTaxId} />
      <Input label="Texte libre" value={customText} onChangeText={setCustomText} />

      {error && <Text className="text-red-500 mb-4">{error}</Text>}
      {success && <Text className="text-green-600 mb-4">Modifications enregistrées.</Text>}

      <Button label="Enregistrer" onPress={handleSave} loading={loading} />
    </Screen>
  );
}
