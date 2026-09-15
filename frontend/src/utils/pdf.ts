import { Platform } from 'react-native';
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
 * Ces classes n'ont pas d'implémentation native sur le web (`new File(...)`
 * plante avec "this.validatePath is not a function", voir
 * expo-file-system/src/ExpoFileSystem.web.ts) : on télécharge donc le PDF
 * via `fetch` + Blob côté web, comme pour le token store dans api/client.ts.
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

async function downloadAuthenticatedPdfWeb(url: string): Promise<Blob> {
  const token = await getAuthToken();
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Échec du téléchargement du PDF (${response.status}).`);
  }
  return response.blob();
}

export async function shareDocument(url: string, fileName: string) {
  if (Platform.OS === 'web') {
    const blob = await downloadAuthenticatedPdfWeb(url);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return;
  }

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
  if (Platform.OS === 'web') {
    const blob = await downloadAuthenticatedPdfWeb(url);
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    return;
  }

  const localUri = await downloadAuthenticatedPdf(url, fileName);
  await Print.printAsync({ uri: localUri });
}
