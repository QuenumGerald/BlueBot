// autoReply.js
// Répond automatiquement aux posts pertinents pour la recherche d'emploi à Silicon Valley

import { agent, initBluesky } from './bluesky.js';
import { generateReplyText } from './generateText.js';
import fs from 'fs';
import path from 'path';
import { franc } from 'franc-min';
import { checkQuota, recordAction } from './quotaManager.js';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gestion de l'historique des utilisateurs déjà contactés
const HISTORY_FILE = './reply-history.json';
const MAX_HISTORY_DAYS = 14; // Durée en jours pendant laquelle on ne recontacte pas quelqu'un 

/**
 * Charge l'historique des réponses (utilisateurs et posts)
 * @returns {Object} Un objet avec les propriétés users et posts
 */
function loadReplyHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      const history = JSON.parse(data);

      // Assure la compatibilité avec l'ancien format
      if (!history.users || !history.posts) {
        // Convertit l'ancien format au nouveau format
        const oldUsers = {};
        Object.keys(history).forEach(key => {
          if (key !== 'users' && key !== 'posts') {
            oldUsers[key] = history[key];
          }
        });

        return {
          users: oldUsers,
          posts: {}
        };
      }

      return history;
    }
  } catch (error) {
    console.error('[Historique] Erreur lors du chargement de l\'historique:', error.message);
  }

  // Retourne une structure vide avec users et posts
  return {
    users: {},
    posts: {}
  };
}

/**
 * Sauvegarde l'historique des réponses (utilisateurs et posts)
 * @param {Object} history Un objet avec les propriétés users et posts
 */
function saveReplyHistory(history) {
  try {
    // Assure que la structure est correcte
    if (!history.users) history.users = {};
    if (!history.posts) history.posts = {};

    // Nettoie l'historique en supprimant les entrées trop anciennes
    const now = Date.now();
    const maxAge = MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000; // Convertit jours en ms

    // Nettoie les utilisateurs
    Object.keys(history.users).forEach(did => {
      if (now - history.users[did] > maxAge) {
        delete history.users[did];
      }
    });

    // Nettoie les posts
    Object.keys(history.posts).forEach(uri => {
      if (now - history.posts[uri] > maxAge) {
        delete history.posts[uri];
      }
    });

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('[Historique] Erreur lors de la sauvegarde de l\'historique:', error.message);
  }
}

/**
 * Petit job séparé : envoie quelques réponses (max 2) pour maintenir l'interaction
 */
export async function autoSmallReply() {
  try {
    const replyHistory = loadReplyHistory();
    const MAX_REPLIES_PER_RUN = 2;
    const searchTerms = [
      'AI Africa', 'Tech Africa', 'Digital Africa', 'Startup Africa',
      'Alkimo',
      'Lagos tech', 'Abuja tech', 'Accra tech', 'Nairobi tech',
      'Johannesburg tech', 'Casablanca tech', 'Dakar tech', 'Abidjan tech'
    ];

    // Vérifie le quota reply avant d'initialiser
    const quotaCheck = checkQuota('reply');
    if (!quotaCheck.allowed) {
      console.log(`[QuotaManager][INFO] Quota de replies déjà atteint: ${quotaCheck.hourlyUsage}/${quotaCheck.hourlyLimit} par heure, ${quotaCheck.dailyUsage}/${quotaCheck.dailyLimit} par jour`);
      return;
    }

    await initBluesky();
    const uniquePosts = await fetchSearchPosts(searchTerms);
    uniquePosts.sort(() => Math.random() - 0.5);
    if (uniquePosts.length === 0) {
      console.warn('[INFO] Aucun post trouvé pour les hashtags ciblés (small reply).');
      return;
    }
    const alreadyRepliedDIDs = new Set(Object.keys(replyHistory.users));
    let replyCount = 0;

    for (const post of uniquePosts) {
      if (replyCount >= MAX_REPLIES_PER_RUN) break;
      const { uri, cid, author, record } = post;
      const text = record?.text;

      if (alreadyRepliedDIDs.has(author.did) || hasRepliedRecently(author.did, uri, replyHistory)) {
        continue;
      }

      let lang = 'undefined';
      if (text) lang = franc(text, { minLength: 10 });
      if (lang !== 'fra' && lang !== 'eng' && lang !== 'und') {
        continue;
      }

      // Vérification quota à chaque réponse
      const perReplyQuota = checkQuota('reply');
      if (!perReplyQuota.allowed) {
        console.log(`[QuotaManager][INFO] Quota de replies atteint en cours d'exécution: ${perReplyQuota.hourlyUsage}/${perReplyQuota.hourlyLimit} par heure, ${perReplyQuota.dailyUsage}/${perReplyQuota.dailyLimit} par jour`);
        break;
      }

      const truncatedText = truncateForReply(text);
      const replyText = await generateReplyText(truncatedText, lang === 'fra' ? 'fr' : 'en');

      const rootRef = record?.reply?.root
        ? { cid: record.reply.root.cid, uri: record.reply.root.uri }
        : { cid, uri };

      await agent.post({
        reply: {
          root: rootRef,
          parent: { cid, uri }
        },
        text: replyText,
      });

      recordAction('reply', uri, author.handle);
      replyHistory.users[author.did] = Date.now();
      replyHistory.posts[uri] = Date.now();
      alreadyRepliedDIDs.add(author.did);
      saveReplyHistory(replyHistory);
      replyCount++;
      console.log(`[Succès] Reply envoyée sur ${uri}`);
      await delay(8000);
    }
    console.log(`[INFO] autoSmallReply terminé avec ${replyCount} réponses.`);
  } catch (error) {
    console.error('[Erreur][autoSmallReply] Erreur globale :', error?.response?.data || error.message);
  }
}

/**
 * Vérifie si on a déjà répondu/reposté un utilisateur ou un post spécifique
 * @param {string} did DID de l'utilisateur à vérifier
 * @param {string} uri URI du post à vérifier
 * @param {Object} history Historique des réponses
 * @returns {boolean} true si on a déjà répondu/reposté récemment cet utilisateur ou ce post
 */
function hasRepliedRecently(did, uri, history) {
  // Vérifie si on a déjà répondu à cet utilisateur récemment
  if (history.users && history.users[did]) {
    return true;
  }

  // Vérifie si on a déjà répondu à ce post spécifique
  if (history.posts && history.posts[uri]) {
    return true;
  }

  return false;
}

async function fetchSearchPosts(searchTerms) {
  const allPosts = [];
  for (const term of searchTerms) {
    console.log(`[Recherche] Récupération des 10 derniers posts contenant "${term}"`);
    const res = await agent.app.bsky.feed.searchPosts({ q: term, limit: 10 });
    if (res && Array.isArray(res.data.posts)) {
      allPosts.push(...res.data.posts);
    }
    await delay(500);
  }
  return Array.from(new Map(allPosts.map(p => [p.uri, p])).values());
}

function truncateForReply(text) {
  const MAX_INPUT_LENGTH = 500;
  if (!text || text.length <= MAX_INPUT_LENGTH) return text;
  const window = text.substring(0, MAX_INPUT_LENGTH);
  const lastSentence = window.lastIndexOf('.');
  if (lastSentence > MAX_INPUT_LENGTH * 0.5) return window.substring(0, lastSentence + 1) + ' [...]';
  const lastSpace = window.lastIndexOf(' ');
  return window.substring(0, Math.max(lastSpace, 0)) + ' [...]';
}

/**
 * Recherche les posts et les repost au lieu de répondre
 */
export async function autoReply() {
  try {
    let timeline;
    // Charge l'historique des réponses
    const replyHistory = loadReplyHistory();

    // Limite différente selon le mode (test ou production)
    const isTest = process.env.NODE_ENV === 'test';
    // Limite recommandée Bluesky :
    // - Pas plus de 100-200 actions/jour
    // - Implémenté via quotaManager (25 reposts/heure, 100 reposts/jour)

    // Vérification des quotas de reposts
    const repostQuota = checkQuota('repost');
    if (!repostQuota.allowed) {
      console.log(`[QuotaManager][INFO] Quota de reposts atteint: ${repostQuota.hourlyUsage}/${repostQuota.hourlyLimit} par heure, ${repostQuota.dailyUsage}/${repostQuota.dailyLimit} par jour`);
      console.log(`[QuotaManager][INFO] Traitement des reposts annulé pour respecter les limites Bluesky`);
      return;
    }

    // On limite quand même le nombre de reposts par exécution pour éviter le spam
    const MAX_ACTIONS_PER_RUN = 5; // Limite raisonnable pour éviter le spam
    // Authentifie l'agent Bluesky avant toute requête
    await initBluesky();
    // Termes de recherche pour trouver des posts pertinents pour la recherche d'emploi
    const searchTerms = [
      'AI Africa', 'Tech Africa', 'Digital Africa', 'Startup Africa',
      'Alkimo',
      'Lagos tech', 'Abuja tech', 'Accra tech', 'Nairobi tech',
      'Johannesburg tech', 'Casablanca tech', 'Dakar tech', 'Abidjan tech'
    ];

    // Récupère les posts récents contenant les termes de recherche
    const uniquePosts = await fetchSearchPosts(searchTerms);
    // Mélange aléatoire pour répondre à des posts variés à chaque run
    uniquePosts.sort(() => Math.random() - 0.5);
    if (uniquePosts.length === 0) {
      console.warn('[INFO] Aucun post trouvé pour les hashtags ciblés.');
      return;
    }
    // Récupère le handle du bot pour ne pas répondre à soi-même
    const myHandle = agent.session?.handle;
    console.log(`[DEBUG] Nombre de posts uniques récupérés : ${uniquePosts.length}`);
    let actionCount = 0;
    // Empêche de repost plusieurs fois à la même personne dans la même exécution
    const alreadyRepliedDIDs = new Set(Object.keys(replyHistory.users));

    for (const post of uniquePosts) {
      const { uri, author, record } = post;
      const text = record?.text;

      // Vérifie si on a déjà reposté cet utilisateur ou ce post récemment (historique ou dans cette run)
      if (alreadyRepliedDIDs.has(author.did) || hasRepliedRecently(author.did, uri, replyHistory)) {
        const reason = replyHistory.users[author.did] || alreadyRepliedDIDs.has(author.did) ? `déjà répondu à ${author.handle}` : 'post déjà traité';
        console.log(`[IGNORÉ] Post ignoré (${reason}): uri=${uri}`);
        continue;
      }

      // Filtre de langue : ne répondre qu'aux posts en français ou anglais
      let lang = 'undefined';
      if (text) {
        lang = franc(text, { minLength: 10 });
      }
      if (lang !== 'fra' && lang !== 'eng' && lang !== 'und') {
        console.log(`[IGNORÉ] Post ignoré (langue non supportée : ${lang}) : uri=${uri}`);
        continue; // NE PAS incrémenter repliedCount
      }
      try {
        // Vérification des quotas avant chaque repost
        const repostQuotaCheck = checkQuota('repost');
        if (!repostQuotaCheck.allowed) {
          console.log(`[QuotaManager][INFO] Quota de reposts atteint pendant l'exécution: ${repostQuotaCheck.hourlyUsage}/${repostQuotaCheck.hourlyLimit} par heure, ${repostQuotaCheck.dailyUsage}/${repostQuotaCheck.dailyLimit} par jour`);
          console.log(`[INFO] Arrêt du traitement des reposts pour respecter les limites Bluesky`);
          break;
        }

        await agent.repost(post.uri, post.cid);

        // Enregistrement de l'action pour le suivi des quotas
        recordAction('repost', post.uri, author.handle);
        actionCount++;
        console.log(`[Succès] Repost de ${uri}`);
        // Ajoute l'utilisateur et le post à l'historique
        if (!replyHistory.users) replyHistory.users = {};
        if (!replyHistory.posts) replyHistory.posts = {};
        replyHistory.users[author.did] = Date.now();
        replyHistory.posts[uri] = Date.now();
        alreadyRepliedDIDs.add(author.did);
        saveReplyHistory(replyHistory);
      } catch (error) {
        console.error(`[Erreur] Échec lors du repost de ${uri} :`, error?.response?.data || error.message);
      }
      await delay(10000);
      if (actionCount >= MAX_ACTIONS_PER_RUN) {
        console.log(`[INFO] Limite de ${MAX_ACTIONS_PER_RUN} reposts atteinte, arrêt de la boucle.`);
        break;
      }
    }
    console.log(`[DEBUG] Nombre total de reposts effectués : ${actionCount}`);
    console.log(`[INFO] Le bot a reposté ${actionCount} message(s) sur ${uniquePosts.length} posts uniques récupérés.`);

    // Affiche le statut des quotas après le traitement
    const finalQuota = checkQuota('repost');
    console.log(`[QuotaManager][INFO] Statut des quotas après traitement: ${finalQuota.hourlyUsage}/${finalQuota.hourlyLimit} par heure, ${finalQuota.dailyUsage}/${finalQuota.dailyLimit} par jour, ${finalQuota.hourlyRemaining} restants cette heure, ${finalQuota.dailyRemaining} restants aujourd'hui`);
  } catch (error) {
    console.error('[Erreur][autoReply] Erreur globale dans autoReply :', error?.response?.data || error.message);
  }
}

