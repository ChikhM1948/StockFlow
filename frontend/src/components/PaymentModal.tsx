import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { formatMoney } from '@/utils/money';

interface PaymentModalProps {
  visible: boolean;
  balance: number;
  saleNumber: string;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => Promise<void>;
}

export function PaymentModal({ visible, balance, saleNumber, onClose, onSubmit }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAmount('');
    setNote('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Montant invalide.');
      return;
    }
    if (parsed > balance) {
      setError(`Le montant dépasse le solde restant (${formatMoney(balance)}).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(parsed, note);
      reset();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-2xl p-5">
          <Text className="text-lg font-bold text-slate-900 mb-1">Encaisser un paiement</Text>
          <Text className="text-slate-500 text-sm mb-4">
            {saleNumber} — Solde restant : {formatMoney(balance)}
          </Text>

          <Input
            label="Montant reçu"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder={formatMoney(balance)}
          />
          <Input label="Note (optionnel)" value={note} onChangeText={setNote} placeholder="Ex : espèces, chèque..." />

          {error && <Text className="text-red-500 mb-3">{error}</Text>}

          <View className="flex-row gap-2 mt-1">
            <View className="flex-1">
              <Button label="Annuler" variant="outline" onPress={handleClose} disabled={submitting} />
            </View>
            <View className="flex-1">
              <Button label="Valider" onPress={handleSubmit} loading={submitting} />
            </View>
          </View>

          <Pressable onPress={handleClose} className="mt-2" hitSlop={8}>
            <Text className="text-center text-slate-400 text-xs">Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
