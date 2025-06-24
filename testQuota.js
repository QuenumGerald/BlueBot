// testQuota.js
// Script pour tester les fonctionnalités de quotas et afficher des statistiques

import { printFullReport, getQuotaSummary } from './quotaManager.js';
import fs from 'fs';

// Affiche les informations du système de quotas
console.log('===== TEST DU SYSTÈME DE QUOTAS BLUEBOT =====');
console.log('Ce script permet de vérifier que les quotas fonctionnent correctement.');

// Vérifie si les fichiers d'historique existent
const analyticsDir = './analytics';
const checkFile = (file) => {
  const fullPath = `${analyticsDir}/${file}`;
  try {
    if (fs.existsSync(fullPath)) {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      console.log(`✓ ${file}: ${data.actions ? data.actions.length : 0} action(s) enregistrée(s)`);
    } else {
      console.log(`✗ ${file}: fichier non trouvé`);
    }
  } catch (err) {
    console.error(`✗ Erreur lors de la lecture de ${file}:`, err.message);
  }
};

// Vérifie si le dossier analytics existe
if (fs.existsSync(analyticsDir)) {
  console.log(`✓ Dossier ${analyticsDir} présent`);
} else {
  console.log(`✗ Dossier ${analyticsDir} non trouvé - sera créé au premier usage`);
}

console.log('\n=== FICHIERS D\'HISTORIQUE DE QUOTAS ===');
checkFile('like-history.json');
checkFile('follow-history.json');
checkFile('reply-history.json');

console.log('\n=== RAPPORTS D\'UTILISATION ===');
printFullReport();

console.log('\n=== RÉSUMÉ DES QUOTAS ===');
const summary = getQuotaSummary();
for (const [actionType, quota] of Object.entries(summary)) {
  console.log(`${actionType.toUpperCase()}:`);
  console.log(`  Limite horaire: ${quota.hourlyUsage}/${quota.hourlyLimit} (${quota.hourlyRemaining} restants)`);
  console.log(`  Limite quotidienne: ${quota.dailyUsage}/${quota.dailyLimit} (${quota.dailyRemaining} restants)`);
}

console.log('\n=== FICHIERS D\'HISTORIQUE ANCIENS (LEGACY) ===');
const checkLegacyFile = (file) => {
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const count = Object.keys(data).length;
      console.log(`✓ ${file}: ${count} entrée(s)`);
    } else {
      console.log(`✗ ${file}: fichier non trouvé`);
    }
  } catch (err) {
    console.error(`✗ Erreur lors de la lecture de ${file}:`, err.message);
  }
};

checkLegacyFile('./like-history.json');
checkLegacyFile('./reply-history.json');

console.log('\n===== FIN DU TEST =====');
