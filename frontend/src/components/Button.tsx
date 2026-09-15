import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useBrandTheme } from '@/context/BrandThemeContext';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}

/**
 * Bouton dont la couleur "primary" suit la charte de la marque active.
 * On applique la couleur dynamique via `style` (et pas une classe Tailwind)
 * car NativeWind ne peut pas générer de classe utilitaire pour une couleur
 * connue seulement à l'exécution (venant de l'API).
 */
export function Button({ label, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const { primaryColor } = useBrandTheme();
  const isOutline = variant === 'outline';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className="rounded-xl py-3.5 px-4 items-center justify-center"
      style={{
        backgroundColor: isOutline ? 'transparent' : primaryColor,
        borderWidth: isOutline ? 1.5 : 0,
        borderColor: primaryColor,
        opacity: disabled || loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? primaryColor : '#FFFFFF'} />
      ) : (
        <Text
          className="font-semibold text-base"
          style={{ color: isOutline ? primaryColor : '#FFFFFF' }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
