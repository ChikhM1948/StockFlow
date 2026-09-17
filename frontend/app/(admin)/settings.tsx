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
import { Check, FileText, ImagePlus, MapPin, Palette, ReceiptText, Settings2, ShieldCheck } from 'lucide-react-native';

const COLOR_PRESETS = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0F172A'];

export default function BrandSettingsScreen() {
  const { brand } = useAuth();
  const { primaryColor, refreshBrand } = useBrandTheme();

  const [name, setName] = useState(brand?.name || '');
  const [selectedColor, setSelectedColor] = useState(brand?.theme.primaryColor || '#2563EB');
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
    setSelectedColor(brand.theme.primaryColor);
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
        theme: { primaryColor: selectedColor },
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
      <View className="pt-2 mb-5">
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: primaryColor }}>
            <Settings2 size={23} color="#FFFFFF" strokeWidth={2.1} />
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-slate-950">Personnalisation</Text>
            <Text className="text-slate-500 mt-0.5">Adaptez votre marque et vos documents commerciaux.</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <ShieldCheck size={18} color={primaryColor} strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Identité de l'entreprise</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Ces informations apparaissent dans votre espace et vos factures.</Text>

        <Pressable onPress={pickLogo} className="flex-row items-center bg-slate-50 rounded-2xl p-3 mb-4">
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} className="w-20 h-20 rounded-xl bg-white" resizeMode="contain" />
          ) : (
            <View className="w-20 h-20 rounded-xl bg-blue-50 items-center justify-center">
              <ImagePlus size={26} color="#2563EB" strokeWidth={1.8} />
              <Text className="text-blue-700 text-xs font-semibold mt-1">Ajouter</Text>
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="text-slate-900 font-bold">Logo de votre marque</Text>
            <Text className="text-slate-500 text-sm mt-1">Touchez pour {logoUrl ? 'remplacer' : 'choisir'} votre logo.</Text>
          </View>
          <ImagePlus size={18} color="#64748B" />
        </Pressable>

        <Input label="Nom de l'entreprise" value={name} onChangeText={setName} placeholder="Ex: Distribution Plus" />
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <Palette size={18} color="#D97706" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Couleur de l'interface</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Choisissez la couleur principale de votre espace.</Text>
        <View className="flex-row flex-wrap gap-3 mb-4">
          {COLOR_PRESETS.map((color) => {
            const selected = selectedColor.toUpperCase() === color.toUpperCase();
            return (
              <Pressable
                key={color}
                onPress={() => setSelectedColor(color)}
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: color, borderWidth: selected ? 3 : 0, borderColor: '#FFFFFF' }}
              >
                {selected && <Check size={18} color="#FFFFFF" strokeWidth={3} />}
              </Pressable>
            );
          })}
        </View>
        <Input label="Ou code couleur (hex)" value={selectedColor} onChangeText={setSelectedColor} autoCapitalize="none" placeholder="#2563EB" />
      </View>

      <View className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <View className="flex-row items-center mb-1">
          <ReceiptText size={18} color="#2563EB" strokeWidth={2.2} />
          <Text className="text-base font-bold text-slate-900 ml-2">Pied de page des factures</Text>
        </View>
        <Text className="text-slate-500 text-sm mb-4">Ajoutez les coordonnées affichées au bas de vos documents.</Text>
        <View className="flex-row items-center mb-2">
          <MapPin size={15} color="#64748B" />
          <Text className="text-slate-600 text-xs font-semibold ml-1.5">Coordonnées</Text>
        </View>
        <Input label="Adresse" value={addressLine} onChangeText={setAddressLine} placeholder="Adresse de l'entreprise" />
        <Input label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+225 ..." />
        <View className="flex-row items-center mb-2 mt-1">
          <FileText size={15} color="#64748B" />
          <Text className="text-slate-600 text-xs font-semibold ml-1.5">Informations administratives</Text>
        </View>
        <Input label="Identifiant fiscal (NIF / RCCM...)" value={taxId} onChangeText={setTaxId} placeholder="Optionnel" />
        <Input label="Texte libre" value={customText} onChangeText={setCustomText} placeholder="Merci pour votre confiance" />
      </View>

      {error && <Text className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-3 mb-4">{error}</Text>}
      {success && (
        <View className="flex-row items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 mb-4">
          <Check size={17} color="#16A34A" strokeWidth={2.5} />
          <Text className="text-emerald-700 font-semibold ml-2">Modifications enregistrées.</Text>
        </View>
      )}

      <Button label="Enregistrer les modifications" onPress={handleSave} loading={loading} />
    </Screen>
  );
}
