// quotaManager.js
// Gestion des quotas et analytics pour likes, follows et replies sur Bluesky
// Implémente des limites par heure et par jour pour respecter les limites recommandées
// Fournit des rapports d'activité

import fs from 'fs';

// Constantes pour les limites recommandées par Bluesky
const LIMITS = {
  like: {
    hourly: 30,
    daily: 200,
    historyFile: './analytics/like-history.json',
    historyDays: 30, // Garder l'historique des likes sur 30 jours
  },
  follow: {
    hourly: 30,
    daily: 200, 
    historyFile: './analytics/follow-history.json',
    historyDays: 30, // Garder l'historique des follows sur 30 jours
  },
  reply: {
    hourly: 25,
    daily: 100, // Plus prudent que la limite max de 200
    historyFile: './analytics/reply-history.json',
    historyDays: 30, // Garder l'historique des replies sur 30 jours
  }
};

// S'assurer que le dossier analytics existe
try {
  if (!fs.existsSync('./analytics')) {
    fs.mkdirSync('./analytics');
    console.log('[QuotaManager] Dossier analytics créé');
  }
} catch (err) {
  console.error('[QuotaManager] Erreur lors de la création du dossier analytics:', err);
}

/**
 * Charge l'historique des actions (likes, follows, replies)
 * @param {string} actionType - Type d'action ('like', 'follow', 'reply')
 * @returns {Object} Historique des actions
 */
function loadHistory(actionType) {
  if (!LIMITS[actionType]) {
    throw new Error(`Type d'action invalide: ${actionType}`);
  }

  const historyFile = LIMITS[actionType].historyFile;
  try {
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      const history = JSON.parse(data);
      // Ajoute la structure attendue si elle n'existe pas
      if (!history.actions) history.actions = [];
      return history;
    }
  } catch (error) {
    console.error(`[QuotaManager] Erreur lors du chargement de l'historique ${actionType}:`, error.message);
  }

  // Retourne un historique vide avec la structure attendue
  return { actions: [] };
}

/**
 * Sauvegarde l'historique des actions
 * @param {string} actionType - Type d'action ('like', 'follow', 'reply')
 * @param {Object} history - Historique à sauvegarder
 */
function saveHistory(actionType, history) {
  if (!LIMITS[actionType]) {
    throw new Error(`Type d'action invalide: ${actionType}`);
  }

  try {
    // Nettoie les actions trop anciennes
    const now = Date.now();
    const maxAge = LIMITS[actionType].historyDays * 24 * 60 * 60 * 1000;
    
    // Filtre pour garder uniquement les actions récentes
    history.actions = history.actions.filter(action => 
      now - action.timestamp <= maxAge
    );

    // Sauvegarde l'historique
    fs.writeFileSync(LIMITS[actionType].historyFile, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error(`[QuotaManager] Erreur lors de la sauvegarde de l'historique ${actionType}:`, error.message);
  }
}

/**
 * Vérifie si une action est possible en tenant compte des quotas horaires et journaliers
 * @param {string} actionType - Type d'action ('like', 'follow', 'reply')
 * @returns {Object} Résultat avec les propriétés allowed, hourlyUsage, dailyUsage, hourlyLimit et dailyLimit
 */
export function checkQuota(actionType) {
  if (!LIMITS[actionType]) {
    throw new Error(`Type d'action invalide: ${actionType}`);
  }

  const history = loadHistory(actionType);
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTimestamp = startOfDay.getTime();

  // Compte les actions dans la dernière heure et aujourd'hui
  const hourlyActions = history.actions.filter(action => action.timestamp >= oneHourAgo);
  const dailyActions = history.actions.filter(action => action.timestamp >= startOfDayTimestamp);

  const hourlyUsage = hourlyActions.length;
  const dailyUsage = dailyActions.length;
  const hourlyLimit = LIMITS[actionType].hourly;
  const dailyLimit = LIMITS[actionType].daily;

  // Vérifie si on peut effectuer une action de plus
  const allowed = hourlyUsage < hourlyLimit && dailyUsage < dailyLimit;

  return {
    allowed,
    hourlyUsage,
    dailyUsage,
    hourlyLimit,
    dailyLimit,
    hourlyRemaining: hourlyLimit - hourlyUsage,
    dailyRemaining: dailyLimit - dailyUsage
  };
}

/**
 * Enregistre une nouvelle action effectuée
 * @param {string} actionType - Type d'action ('like', 'follow', 'reply')
 * @param {string} targetId - ID de la cible (DID pour users, URI pour posts)
 * @param {string} [targetLabel] - Label facultatif (handle, titre, etc.)
 * @returns {boolean} true si l'action a été enregistrée avec succès
 */
export function recordAction(actionType, targetId, targetLabel = '') {
  try {
    if (!LIMITS[actionType]) {
      throw new Error(`Type d'action invalide: ${actionType}`);
    }

    // Vérifie d'abord si l'action est autorisée selon les quotas
    const quota = checkQuota(actionType);
    if (!quota.allowed) {
      console.warn(`[QuotaManager] Limite atteinte pour ${actionType}: ${quota.hourlyUsage}/${quota.hourlyLimit} par heure, ${quota.dailyUsage}/${quota.dailyLimit} par jour`);
      return false;
    }

    // Charge l'historique
    const history = loadHistory(actionType);

    // Ajoute la nouvelle action
    const newAction = {
      timestamp: Date.now(),
      targetId,
      targetLabel
    };

    history.actions.push(newAction);
    saveHistory(actionType, history);

    // Log pour debug
    console.log(`[QuotaManager] Action ${actionType} enregistrée: ${targetLabel || targetId}`);
    console.log(`[QuotaManager] Utilisation ${actionType}: ${quota.hourlyUsage + 1}/${quota.hourlyLimit} par heure, ${quota.dailyUsage + 1}/${quota.dailyLimit} par jour`);

    return true;
  } catch (error) {
    console.error(`[QuotaManager] Erreur lors de l'enregistrement de l'action ${actionType}:`, error.message);
    return false;
  }
}

/**
 * Génère des rapports quotidiens d'utilisation par type d'action
 * @param {string} actionType - Type d'action ('like', 'follow', 'reply')
 * @param {number} [days=7] - Nombre de jours à inclure dans le rapport
 * @returns {Array} Tableau d'objets contenant date, count pour chaque jour
 */
export function generateDailyReport(actionType, days = 7) {
  try {
    if (!LIMITS[actionType]) {
      throw new Error(`Type d'action invalide: ${actionType}`);
    }

    const history = loadHistory(actionType);
    const report = [];
    const now = new Date();

    // Boucle sur chaque jour demandé
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Compte les actions pour ce jour
      const dayActions = history.actions.filter(action => {
        const actionTime = new Date(action.timestamp);
        return actionTime >= date && actionTime < nextDate;
      });

      report.push({
        date: date.toISOString().split('T')[0], // Format YYYY-MM-DD
        count: dayActions.length
      });
    }

    return report;
  } catch (error) {
    console.error(`[QuotaManager] Erreur lors de la génération du rapport pour ${actionType}:`, error.message);
    return [];
  }
}

/**
 * Renvoie le résumé actuel des quotas pour tous les types d'actions
 * @returns {Object} Résumé des quotas
 */
export function getQuotaSummary() {
  const summary = {};
  
  for (const actionType of Object.keys(LIMITS)) {
    summary[actionType] = checkQuota(actionType);
  }
  
  return summary;
}

/**
 * Affiche un rapport complet d'utilisation dans la console
 */
export function printFullReport() {
  console.log('\n===== RAPPORT D\'UTILISATION BLUEBOT =====');
  
  for (const actionType of Object.keys(LIMITS)) {
    const quota = checkQuota(actionType);
    console.log(`\n== ${actionType.toUpperCase()} ==`);
    console.log(`Aujourd'hui: ${quota.dailyUsage}/${quota.dailyLimit} (${quota.dailyRemaining} restants)`);
    console.log(`Dernière heure: ${quota.hourlyUsage}/${quota.hourlyLimit} (${quota.hourlyRemaining} restants)`);
    
    // Ajoute le rapport des 7 derniers jours
    const report = generateDailyReport(actionType, 7);
    console.log('\nHistorique 7 jours:');
    report.forEach(day => {
      console.log(`${day.date}: ${day.count}`);
    });
  }
  
  console.log('\n=======================================');
}
