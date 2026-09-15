/**
 * Retourne minuit (00:00:00.000) pour la date du jour, heure du serveur.
 * Sert de borne basse pour les agrégations "journalières" de la caisse.
 */
function getStartOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Lit `startDate`/`endDate` (format "YYYY-MM-DD" ou ISO) depuis une query
 * Express et les convertit en bornes de journée complètes : `start` à
 * 00:00:00.000, `end` à 23:59:59.999. Ignore silencieusement les valeurs
 * absentes ou invalides.
 */
function parseDateRangeQuery({ startDate, endDate } = {}) {
  const range = {};

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      range.start = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.end = end;
    }
  }

  return range;
}

module.exports = { getStartOfToday, parseDateRangeQuery };
