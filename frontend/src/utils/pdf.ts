import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { getAuthToken } from '@/api/client';

/**
 * Les PDF (Bon de Sortie, Facture, Bon de Livraison) sont générés côté backend
 * (pdfkit) et exposés via des routes protégées par JWT. On les télécharge donc
 * avec l'en-tête Authorization avant de pouvoir les partager/imprimer,
 * plutôt que d'ouvrir l'URL directement (elle renverrait 401).
 *
 * SDK 54+ : l'ancienne API `FileSystem.downloadAsync`/`cacheDirectory` a été
 * remplacée par les classes `File`/`Paths` (voir expo-file-system/build/File.d.ts).
 */
async function downloadAuthenticatedPdf(url: string, fileName: string): Promise<string> {
  const token = await getAuthToken();
  const destination = new File(Paths.cache, fileName);

  const file = await File.downloadFileAsync(url, destination, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    idempotent: true, // écrase un précédent partage du même document dans le cache
  });

  return file.uri;
}

export async function shareDocument(url: string, fileName: string) {
  const localUri = await downloadAuthenticatedPdf(url, fileName);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Le partage n'est pas disponible sur cet appareil.");
  }

  await Sharing.shareAsync(localUri, {
    mimeType: 'application/pdf',
    dialogTitle: fileName,
  });
}

export async function printDocument(url: string, fileName: string) {
  const localUri = await downloadAuthenticatedPdf(url, fileName);
  await Print.printAsync({ uri: localUri });
}
